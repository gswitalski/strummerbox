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
import type { RepertoireSummaryDto } from '../../../../../packages/contracts/types';
import type { Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { RepertoireCreateDialogComponent } from '../components/repertoire-create-dialog/repertoire-create-dialog.component';
import { ShareService } from '../../../core/services/share.service';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import type { ShareDialogData } from '../../../shared/models/share-dialog.model';

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

    public readonly repertoires: Signal<RepertoireSummaryVM[]> = computed(
        () => this.viewState().repertoires
    );

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
        try {
            await this.repertoireListService.deleteRepertoire(repertoireId);
            this.refreshState.update((value) => value + 1);
            this.snackBar.open('Repertuar został usunięty.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireListPageComponent: delete error', error);
            this.snackBar.open(
                'Nie udało się usunąć repertuaru. Spróbuj ponownie później.',
                undefined,
                {
                    duration: 5000,
                }
            );
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

            this.state.set({
                repertoires: result.items.map(mapRepertoireDtoToViewModel),
                totalCount: result.total ?? 0,
                currentPage: config.page,
                pageSize: config.pageSize,
                searchTerm: config.search,
                sort: config.sort,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('RepertoireListPageComponent: load error', error);
            this.state.update((current) => ({
                ...current,
                isLoading: false,
                error: 'Nie udało się pobrać listy repertuarów. Spróbuj ponownie później.',
            }));
        }
    }
}

