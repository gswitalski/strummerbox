import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    computed,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Subject, switchMap, takeUntil, catchError, of, map } from 'rxjs';
import { BiesiadaService } from '../../core/services/biesiada.service';
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
import { ShareDialogComponent } from '../../shared/components/share-dialog/share-dialog.component';
import type { SongViewerConfig } from '../../shared/components/song-viewer/song-viewer.config';
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
    imports: [SongViewerComponent],
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
     * Sygnał zarządzający wartością transpozycji
     * Domyślnie 0 (brak transpozycji)
     */
    public readonly transposeOffset = signal(0);

    /**
     * Konfiguracja dla komponentu SongViewer
     * Będzie aktualizowana dynamicznie w computed signal
     */
    public readonly viewerConfig = computed<SongViewerConfig>(() => {
        const viewModel = this.state().data;
        return {
            showBackButton: !!viewModel?.navigation.back,
            backLink: viewModel?.navigation.back || undefined,
            titleInToolbar: false, // Tytuł w content, nie w toolbarze
            showChordsToggle: false, // Zawsze pokazuj akordy w trybie biesiada
            showTransposeControls: true, // Kontrolki transpozycji widoczne
            showQrButton: true,
            showNavigation: true,
            backButtonAriaLabel: 'Powrót do listy',
        };
    });

    /**
     * Computed signal - nawigacja
     */
    public readonly navigation = computed<SongNavigation | null>(() => {
        const viewModel = this.state().data;
        return viewModel?.navigation || null;
    });

    /**
     * Computed signal - status dla SongViewer
     */
    public readonly viewerStatus = computed<'loading' | 'loaded' | 'error'>(() => {
        const state = this.state();
        if (state.isLoading) return 'loading';
        if (state.error) return 'error';
        return 'loaded';
    });

    /**
     * Computed signal - obiekt błędu
     */
    public readonly viewerError = computed<{ code: number; message: string } | undefined>(() => {
        const error = this.state().error;
        return error ? { code: 0, message: error.message } : undefined;
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
    onQrButtonClick(): void {
        const viewModel = this.state().data;
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
     * Obsługuje zmianę wartości transpozycji
     */
    onTransposeChanged(newOffset: number): void {
        this.transposeOffset.set(newOffset);
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

