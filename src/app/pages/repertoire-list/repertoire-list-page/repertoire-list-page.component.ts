import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Signal,
    WritableSignal,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';

import type {
    RepertoireListSortDirection,
    RepertoireListSortField,
    RepertoireListState,
    RepertoireSummaryVM,
} from '../repertoire-list.types';
import { mapRepertoireDtoToViewModel } from '../repertoire-list.types';
import { RepertoireListService } from '../services/repertoire-list.service';
import { RepertoireListComponent } from '../components/repertoire-list/repertoire-list.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import type { Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { RepertoireCreateDialogComponent } from '../components/repertoire-create-dialog/repertoire-create-dialog.component';
import { ShareService } from '../../../core/services/share.service';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import type { ShareDialogData } from '../../../shared/models/share-dialog.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import type { ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SEARCH_DEBOUNCE_MS = 300;

@Component({
    selector: 'stbo-repertoire-list-page',
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatSortModule,
        EmptyStateComponent,
        RepertoireListComponent,
        CommonModule,
    ],
    templateUrl: './repertoire-list-page.component.html',
    styleUrl: './repertoire-list-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireListPageComponent {
    private readonly repertoireListService = inject(RepertoireListService);
    private readonly shareService = inject(ShareService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    private readonly paginationState: WritableSignal<{ pageIndex: number; pageSize: number }> = signal({
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE,
    });
    private readonly searchInputState: WritableSignal<string> = signal('');
    private readonly searchQueryState: WritableSignal<string> = signal('');
    private readonly sortState: WritableSignal<{
        active: RepertoireListSortField;
        direction: RepertoireListSortDirection;
    }> = signal({
        active: 'createdAt',
        direction: 'desc',
    });
    private readonly refreshState: WritableSignal<number> = signal(0);
    private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

    private readonly state: WritableSignal<RepertoireListState> = signal({
        repertoires: [],
        totalCount: 0,
        currentPage: 0,
        pageSize: DEFAULT_PAGE_SIZE,
        searchTerm: '',
        sort: {
            active: 'createdAt',
            direction: 'desc',
        },
        isLoading: false,
        error: null,
    });

    public readonly viewState: Signal<RepertoireListState> = this.state.asReadonly();

    public readonly isLoading: Signal<boolean> = computed(
        () => this.viewState().isLoading
    );

    public readonly isInitialLoading: Signal<boolean> = computed(() =>
        this.viewState().isLoading && this.viewState().repertoires.length === 0 && !this.viewState().error
    );

    public readonly hasResults: Signal<boolean> = computed(
        () => this.viewState().repertoires.length > 0
    );

    public readonly shouldShowEmptyState: Signal<boolean> = computed(
        () => !this.viewState().isLoading && this.viewState().repertoires.length === 0 && !this.viewState().error
    );

    public readonly totalCount: Signal<number> = computed(
        () => this.viewState().totalCount
    );

    public readonly repertoires: Signal<RepertoireSummaryVM[]> = computed(() => {
        const deletingId = this.repertoireListService.deletingRepertoireId();
        return this.viewState().repertoires.map((repertoire) => ({
            ...repertoire,
            isDeletingRepertoire: deletingId === repertoire.id,
        }));
    });

    public readonly searchTerm: Signal<string> = this.searchInputState.asReadonly();

    public readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

    constructor() {
        effect(() => {
            const pageIndex = this.paginationState().pageIndex;
            const pageSize = this.paginationState().pageSize;
            const searchTerm = this.searchQueryState();
            const sort = this.sortState();
            const refreshTicker = this.refreshState();

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            refreshTicker;

            void this.loadRepertoires({
                page: pageIndex,
                pageSize,
                search: searchTerm,
                sort,
            });
        });

        this.destroyRef.onDestroy(() => {
            this.clearSearchDebounce();
        });
    }

    public onSearchChange(value: string): void {
        this.searchInputState.set(value);
        this.scheduleSearchUpdate(value);
    }

    public onPageChange(event: PageEvent): void {
        this.paginationState.set({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize,
        });
    }

    public onSortChange(sort: Sort): void {
        if (!sort.direction) {
            this.sortState.set({
                active: 'createdAt',
                direction: 'desc',
            });
            return;
        }

        this.sortState.set({
            active: sort.active as RepertoireListSortField,
            direction: sort.direction as RepertoireListSortDirection,
        });
    }

    public async onDeleteRepertoire(repertoireId: string): Promise<void> {
        // Znajdź repertuar w liście, aby uzyskać jego nazwę
        const repertoire = this.viewState().repertoires.find(r => r.id === repertoireId);
        const repertoireName = repertoire?.name ?? 'ten repertuar';

        // Otwórz dialog potwierdzenia
        const dialogData: ConfirmationDialogData = {
            title: 'Usuń repertuar',
            message: `Czy na pewno chcesz usunąć repertuar "${repertoireName}"? Tej operacji nie można cofnąć.`,
            confirmButtonText: 'Usuń',
            cancelButtonText: 'Anuluj',
        };

        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            maxWidth: '90vw',
            data: dialogData,
        });

        // Poczekaj na zamknięcie dialogu
        const confirmed = await dialogRef.afterClosed().toPromise();

        // Jeśli użytkownik anulował, przerwij
        if (!confirmed) {
            return;
        }

        // Wykonaj usuwanie
        try {
            await this.repertoireListService.deleteRepertoire(repertoireId);
            this.refreshState.update((value) => value + 1);
            this.snackBar.open('Repertuar został usunięty.', undefined, {
                duration: 3000,
            });
        } catch (error: unknown) {
            console.error('RepertoireListPageComponent: delete error', error);
            
            // Obsługa różnych typów błędów
            let errorMessage = 'Nie udało się usunąć repertuaru. Spróbuj ponownie później.';
            
            if (error && typeof error === 'object' && 'status' in error) {
                const httpError = error as { status: number };
                
                if (httpError.status === 404) {
                    // Repertuar już nie istnieje - usuń go z lokalnej listy
                    errorMessage = 'Ten repertuar został już usunięty.';
                    this.refreshState.update((value) => value + 1);
                } else if (httpError.status === 401 || httpError.status === 403) {
                    // Błędy autoryzacji są obsługiwane przez interceptor
                    errorMessage = 'Brak uprawnień do usunięcia repertuaru.';
                } else if (httpError.status >= 500) {
                    errorMessage = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
                }
            }
            
            this.snackBar.open(errorMessage, undefined, {
                duration: 5000,
            });
        }
    }

    public onEditRepertoire(repertoireId: string): void {
        void this.router.navigate(['/management/repertoires', repertoireId, 'edit']);
    }

    public onShareRepertoire(repertoireId: string): void {
        // Pobierz metadane udostępniania dla repertuaru
        this.shareService.getRepertoireShareMeta(repertoireId).subscribe({
            next: (shareMeta) => {
                // Znajdź repertuar w liście, aby uzyskać jego nazwę
                const repertoire = this.viewState().repertoires.find(r => r.id === repertoireId);
                const repertoireName = repertoire?.name ?? 'Repertuar';

                // Mapuj DTO na ShareDialogData
                const dialogData: ShareDialogData = {
                    title: `Udostępnij repertuar "${repertoireName}"`,
                    publicUrl: shareMeta.publicUrl,
                    qrPayload: shareMeta.qrPayload,
                };

                // Otwórz dialog
                this.dialog.open(ShareDialogComponent, {
                    width: '600px',
                    maxWidth: '90vw',
                    data: dialogData,
                });
            },
            error: (error) => {
                console.error('RepertoireListPageComponent: share error', error);
                this.snackBar.open(
                    'Wystąpił błąd. Nie udało się wygenerować linku.',
                    'OK',
                    {
                        duration: 5000,
                    }
                );
            },
        });
    }

    /**
     * Handles repertoire status toggle (publish/unpublish).
     * Updates the isTogglingStatus flag, calls the appropriate API method,
     * and updates the repertoire in the state with the new data.
     */
    public async onToggleRepertoireStatus(repertoireId: string, isPublished: boolean): Promise<void> {
        // Set isTogglingStatus to true for the specific repertoire
        this.updateRepertoireTogglingStatus(repertoireId, true);

        try {
            // Call the appropriate API method
            const updatedRepertoire = isPublished
                ? await this.repertoireListService.unpublishRepertoire(repertoireId)
                : await this.repertoireListService.publishRepertoire(repertoireId);

            // Update the repertoire in the state with new data
            this.state.update((current) => ({
                ...current,
                repertoires: current.repertoires.map((repertoire) =>
                    repertoire.id === repertoireId
                        ? {
                              ...repertoire,
                              isPublished: updatedRepertoire.publishedAt !== null,
                              isTogglingStatus: false,
                          }
                        : repertoire
                ),
            }));

            // Show success message
            const message = isPublished
                ? 'Repertuar został cofnięty do szkicu.'
                : 'Repertuar został opublikowany.';
            this.snackBar.open(message, undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireListPageComponent: toggle status error', error);

            // Revert the toggle and show error message
            this.updateRepertoireTogglingStatus(repertoireId, false);
            this.snackBar.open(
                'Nie udało się zaktualizować statusu repertuaru. Spróbuj ponownie.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public retryLoad(): void {
        this.refreshState.update((value) => value + 1);
    }

    public navigateToCreateRepertoire(): void {
        const dialogRef = this.dialog.open(RepertoireCreateDialogComponent, {
            width: '500px',
            disableClose: false,
        });

        // Nasłuchuj na zamknięcie dialogu
        dialogRef.afterClosed().subscribe((result) => {
            // Jeśli użytkownik pomyślnie utworzył repertuar i wrócił (bez nawigacji),
            // odśwież listę
            if (result?.success) {
                this.refreshState.update((value) => value + 1);
            }
        });
    }

    private scheduleSearchUpdate(rawValue: string): void {
        this.clearSearchDebounce();

        this.searchDebounceHandle = setTimeout(() => {
            const trimmed = rawValue.trim();

            this.searchQueryState.set(trimmed);
            this.paginationState.set({
                pageIndex: 0,
                pageSize: this.paginationState().pageSize,
            });

            this.searchDebounceHandle = null;
        }, SEARCH_DEBOUNCE_MS);
    }

    private clearSearchDebounce(): void {
        if (this.searchDebounceHandle !== null) {
            clearTimeout(this.searchDebounceHandle);
            this.searchDebounceHandle = null;
        }
    }

    private async loadRepertoires(config: {
        page: number;
        pageSize: number;
        search: string;
        sort: {
            active: RepertoireListSortField;
            direction: RepertoireListSortDirection;
        };
    }): Promise<void> {
        this.state.update((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try {
            const result = await this.repertoireListService.fetchRepertoires({
                page: config.page + 1,
                pageSize: config.pageSize,
                search: config.search,
                sortField: config.sort.active,
                sortDirection: config.sort.direction,
            });

            console.log('RepertoireListPageComponent: received result', result);

            // Sprawdź czy result ma wymagane właściwości
            if (!result || !Array.isArray(result.items)) {
                throw new Error('Invalid response structure: missing items array');
            }

            // Używamy update() zamiast set() aby zachować płynność przejścia
            // i uniknąć białego migotania podczas sortowania
            this.state.update((current) => ({
                ...current,
                repertoires: result.items.map((dto) => mapRepertoireDtoToViewModel(dto)),
                totalCount: result.total ?? 0,
                currentPage: config.page,
                pageSize: config.pageSize,
                searchTerm: config.search,
                sort: config.sort,
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            console.error('RepertoireListPageComponent: load error', error);
            this.state.update((current) => ({
                ...current,
                isLoading: false,
                error: 'Nie udało się pobrać listy repertuarów. Spróbuj ponownie później.',
            }));
        }
    }

    /**
     * Updates the isTogglingStatus flag for a specific repertoire.
     */
    private updateRepertoireTogglingStatus(repertoireId: string, isToggling: boolean): void {
        this.state.update((current) => ({
            ...current,
            repertoires: current.repertoires.map((repertoire) =>
                repertoire.id === repertoireId
                    ? { ...repertoire, isTogglingStatus: isToggling }
                    : repertoire
            ),
        }));
    }
}

