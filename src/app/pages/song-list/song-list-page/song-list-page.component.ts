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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';

import type {
    SongListSortDirection,
    SongListSortField,
} from '../services/song-list.service';
import { SongListService } from '../services/song-list.service';
import { SongListComponent } from '../components/song-list/song-list.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import type { SongSummaryDto } from '../../../../../packages/contracts/types';
import type { SongListViewModel } from '../song-list.types';
import type { Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { ShareService } from '../../../core/services/share.service';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import type { ShareDialogData } from '../../../shared/models/share-dialog.model';

interface SongListState {
    songs: SongListViewModel[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchTerm: string;
    sort: {
        active: SongListSortField;
        direction: SongListSortDirection;
    };
    isLoading: boolean;
    error: string | null;
}
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SEARCH_DEBOUNCE_MS = 300;

@Component({
    selector: 'stbo-song-list-page',
    standalone: true,
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatSortModule,
        EmptyStateComponent,
        SongListComponent,
        CommonModule,
    ],
    templateUrl: './song-list-page.component.html',
    styleUrl: './song-list-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongListPageComponent {
    private readonly songListService = inject(SongListService);
    private readonly shareService = inject(ShareService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private readonly paginationState: WritableSignal<{ pageIndex: number; pageSize: number }> = signal({
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE,
    });
    private readonly searchInputState: WritableSignal<string> = signal('');
    private readonly searchQueryState: WritableSignal<string> = signal('');
    private readonly sortState: WritableSignal<{
        active: SongListSortField;
        direction: SongListSortDirection;
    }> = signal({
        active: 'createdAt',
        direction: 'desc',
    });
    private readonly refreshState: WritableSignal<number> = signal(0);
    private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

    private readonly state: WritableSignal<SongListState> = signal({
        songs: [],
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

    public readonly viewState: Signal<SongListState> = this.state.asReadonly();

    public readonly isLoading: Signal<boolean> = computed(
        () => this.viewState().isLoading
    );

    public readonly isInitialLoading: Signal<boolean> = computed(() =>
        this.viewState().isLoading && this.viewState().songs.length === 0 && !this.viewState().error
    );

    public readonly hasResults: Signal<boolean> = computed(
        () => this.viewState().songs.length > 0
    );

    public readonly shouldShowEmptyState: Signal<boolean> = computed(
        () => !this.viewState().isLoading && this.viewState().songs.length === 0 && !this.viewState().error
    );

    public readonly totalCount: Signal<number> = computed(
        () => this.viewState().totalCount
    );

    public readonly songs: Signal<SongListViewModel[]> = computed(
        () => this.viewState().songs
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

            void this.loadSongs({
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
            active: sort.active as SongListSortField,
            direction: sort.direction as SongListSortDirection,
        });
    }

    public async onDeleteSong(songId: string): Promise<void> {
        try {
            await this.songListService.deleteSong(songId);
            this.refreshState.update((value) => value + 1);
            this.snackBar.open('Piosenka została usunięta.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('SongListPageComponent: delete error', error);
            this.snackBar.open(
                'Nie udało się usunąć piosenki. Spróbuj ponownie później.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public onEditSong(songId: string): void {
        void this.router.navigate(['/management/songs', songId, 'edit']);
    }

    public onShareSong(songId: string): void {
        // Pobierz metadane udostępniania dla piosenki
        this.shareService.getSongShareMeta(songId).subscribe({
            next: (shareMeta) => {
                // Znajdź piosenkę w liście, aby uzyskać jej tytuł
                const song = this.viewState().songs.find(s => s.id === songId);
                const songTitle = song?.title ?? 'Piosenka';

                // Mapuj DTO na ShareDialogData
                const dialogData: ShareDialogData = {
                    title: `Udostępnij piosenkę "${songTitle}"`,
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
                console.error('SongListPageComponent: share error', error);
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
     * Handles song status toggle (publish/unpublish).
     * Updates the isTogglingStatus flag, calls the appropriate API method,
     * and updates the song in the state with the new data.
     */
    public async onToggleSongStatus(songId: string, isPublished: boolean): Promise<void> {
        // Set isTogglingStatus to true for the specific song
        this.updateSongTogglingStatus(songId, true);

        try {
            // Call the appropriate API method
            const updatedSong = isPublished
                ? await this.songListService.unpublishSong(songId)
                : await this.songListService.publishSong(songId);

            // Update the song in the state with new data
            this.state.update((current) => ({
                ...current,
                songs: current.songs.map((song) =>
                    song.id === songId
                        ? {
                              ...song,
                              publishedAt: updatedSong.publishedAt,
                              isPublished: updatedSong.publishedAt !== null,
                              isTogglingStatus: false,
                          }
                        : song
                ),
            }));

            // Show success message
            const message = isPublished
                ? 'Piosenka została cofnięta do szkicu.'
                : 'Piosenka została opublikowana.';
            this.snackBar.open(message, undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('SongListPageComponent: toggle status error', error);

            // Revert the toggle and show error message
            this.updateSongTogglingStatus(songId, false);
            this.snackBar.open(
                'Nie udało się zaktualizować statusu piosenki. Spróbuj ponownie.',
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

    public async navigateToCreateSong(): Promise<void> {
        await this.router.navigate(['/management/songs', 'new']);
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

    private async loadSongs(config: {
        page: number;
        pageSize: number;
        search: string;
        sort: {
            active: SongListSortField;
            direction: SongListSortDirection;
        };
    }): Promise<void> {
        this.state.update((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try {
            const result = await this.songListService.fetchSongs({
                page: config.page + 1,
                pageSize: config.pageSize,
                search: config.search,
                sortField: config.sort.active,
                sortDirection: config.sort.direction,
            });

            this.state.set({
                songs: result.items.map(mapSongDtoToViewModel),
                totalCount: result.total,
                currentPage: config.page,
                pageSize: config.pageSize,
                searchTerm: config.search,
                sort: config.sort,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('SongListPageComponent: load error', error);
            this.state.update((current) => ({
                ...current,
                isLoading: false,
                error: 'Nie udało się pobrać listy piosenek. Spróbuj ponownie później.',
            }));
        }
    }

    /**
     * Updates the isTogglingStatus flag for a specific song.
     */
    private updateSongTogglingStatus(songId: string, isToggling: boolean): void {
        this.state.update((current) => ({
            ...current,
            songs: current.songs.map((song) =>
                song.id === songId
                    ? { ...song, isTogglingStatus: isToggling }
                    : song
            ),
        }));
    }
}

const mapSongDtoToViewModel = (dto: SongSummaryDto): SongListViewModel => ({
    id: dto.id,
    publicId: dto.publicId,
    title: dto.title,
    publishedAt: dto.publishedAt,
    createdAt: new Date(dto.createdAt).toLocaleDateString('pl-PL'),
    updatedAt: new Date(dto.updatedAt).toLocaleDateString('pl-PL'),
    isPublished: dto.publishedAt !== null,
    isTogglingStatus: false,
});
