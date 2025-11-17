import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    computed,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, switchMap, takeUntil, catchError, of, map } from 'rxjs';
import { BiesiadaService } from '../../core/services/biesiada.service';
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import { SongDisplayComponent } from '../../shared/components/song-display/song-display.component';
import { ShareDialogComponent } from '../../shared/components/share-dialog/share-dialog.component';
import type { BiesiadaSongViewModel, BiesiadaSongState } from './biesiada-song.types';
import type { BiesiadaRepertoireSongDetailDto } from '../../../../packages/contracts/types';
import type { SongNavigation } from '../../shared/components/song-viewer/song-viewer.types';
import type { ShareDialogData } from '../../shared/models/share-dialog.model';

/**
 * Główny komponent widoku piosenki w trybie Biesiada (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametrów repertoireId i songId z URL
 * - Pobranie danych piosenki z API (z akordami)
 * - Zarządzanie stanem widoku
 * - Nawigację między piosenkami w repertuarze
 * - Udostępnianie piosenki za pomocą kodu QR
 */
@Component({
    selector: 'stbo-biesiada-song-view',
    standalone: true,
    imports: [
        RouterLink,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        ErrorDisplayComponent,
        SongDisplayComponent,
    ],
    templateUrl: './biesiada-song.view.html',
    styleUrl: './biesiada-song.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaSongViewComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly biesiadaService = inject(BiesiadaService);
    private readonly titleService = inject(Title);
    private readonly dialog = inject(MatDialog);
    private readonly destroy$ = new Subject<void>();

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state = signal<BiesiadaSongState>({
        data: null,
        isLoading: true,
        error: null,
    });

    /**
     * Pomocnicze gettery dla type narrowing w template
     */
    get isLoading(): boolean {
        return this.state().isLoading;
    }

    get hasError(): boolean {
        return this.state().error !== null;
    }

    get hasData(): boolean {
        return this.state().data !== null;
    }

    get viewModel(): BiesiadaSongViewModel | null {
        return this.state().data;
    }

    get errorMessage(): string {
        const error = this.state().error;
        return error ? error.message : '';
    }

    /**
     * Computed signal - nawigacja dla SongViewerComponent
     */
    public readonly navigation = computed<SongNavigation | null>(() => {
        const viewModel = this.viewModel;
        if (!viewModel) return null;

        return viewModel.navigation;
    });

    /**
     * Computed signal - tytuł piosenki
     */
    public readonly title = computed<string>(() => {
        return this.viewModel?.title ?? '';
    });

    /**
     * Computed signal - treść piosenki z akordami
     */
    public readonly content = computed<string>(() => {
        return this.viewModel?.content ?? '';
    });

    ngOnInit(): void {
        // Reaktywne ładowanie danych przy każdej zmianie parametrów URL
        this.route.params
            .pipe(
                map((params) => ({
                    repertoireId: params['repertoireId'],
                    songId: params['songId'],
                })),
                switchMap(({ repertoireId, songId }) => {
                    // Walidacja parametrów
                    if (!repertoireId || !songId) {
                        return of({
                            data: null,
                            isLoading: false,
                            error: new Error('Brak wymaganych parametrów w URL'),
                        });
                    }

                    // Ustaw stan ładowania
                    this.state.set({ data: null, isLoading: true, error: null });

                    // Pobierz dane z API
                    return this.biesiadaService
                        .getSongDetails(repertoireId, songId)
                        .pipe(
                            map((dto) => {
                                // Mapuj DTO na ViewModel
                                const viewModel = this.mapDtoToViewModel(
                                    dto,
                                    repertoireId
                                );

                                // Ustaw tytuł strony
                                this.titleService.setTitle(
                                    `${dto.title} - Biesiada - StrummerBox`
                                );

                                return {
                                    data: viewModel,
                                    isLoading: false,
                                    error: null,
                                };
                            }),
                            catchError((error: HttpErrorResponse) => {
                                const errorMessage = this.getErrorMessage(
                                    error.status || 0
                                );

                                // Ustaw ogólny tytuł dla błędów
                                this.titleService.setTitle(
                                    'Błąd - StrummerBox'
                                );

                                return of({
                                    data: null,
                                    isLoading: false,
                                    error: new Error(errorMessage),
                                });
                            })
                        );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe((newState) => {
                this.state.set(newState);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Obsługuje kliknięcie przycisku QR - otwiera dialog udostępniania
     */
    public handleQrButtonClick(): void {
        const viewModel = this.viewModel;
        if (!viewModel) return;

        const dialogData: ShareDialogData = {
            title: `Udostępnij piosenkę "${viewModel.title}"`,
            publicUrl: viewModel.share.publicUrl,
            qrPayload: viewModel.share.qrPayload,
        };

        this.dialog.open(ShareDialogComponent, {
            data: dialogData,
            width: '600px',
            maxWidth: '90vw',
        });
    }

    /**
     * Mapuje DTO z API na ViewModel używany w komponencie
     */
    private mapDtoToViewModel(
        dto: BiesiadaRepertoireSongDetailDto,
        repertoireId: string
    ): BiesiadaSongViewModel {
        const navigation: SongNavigation = {
            previous: dto.order.previous
                ? {
                      title: dto.order.previous.title,
                      link: [
                          '/biesiada/repertoires',
                          repertoireId,
                          'songs',
                          dto.order.previous.songId,
                      ],
                  }
                : null,
            next: dto.order.next
                ? {
                      title: dto.order.next.title,
                      link: [
                          '/biesiada/repertoires',
                          repertoireId,
                          'songs',
                          dto.order.next.songId,
                      ],
                  }
                : null,
            back: ['/biesiada/repertoires', repertoireId],
        };

        return {
            title: dto.title,
            content: dto.content,
            navigation,
            share: {
                publicUrl: dto.share.publicUrl,
                qrPayload: dto.share.qrPayload,
            },
        };
    }

    /**
     * Zwraca komunikat błędu na podstawie kodu HTTP
     */
    private getErrorMessage(code: number): string {
        switch (code) {
            case 404:
                return 'Nie znaleziono piosenki w tym repertuarze';
            case 401:
                return 'Musisz być zalogowany, aby wyświetlić tę treść';
            case 403:
                return 'Nie masz uprawnień do wyświetlenia tej piosenki';
            default:
                return 'Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.';
        }
    }
}

