import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    WritableSignal,
    inject,
    signal,
    OnDestroy,
    computed,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, takeUntil, catchError, of, map } from 'rxjs';
import { PublicRepertoireService } from '../public-repertoire/services/public-repertoire.service';
import { FontSizeService } from '../../core/services/font-size.service';
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
import type { SongViewerConfig } from '../../shared/components/song-viewer/song-viewer.config';
import type { PublicRepertoireSongState } from './public-repertoire-song.types';
import type { SongNavigation } from '../../shared/components/song-viewer/song-viewer.types';
import type { FontSize } from '../../shared/models/font-size.model';

/**
 * Główny komponent widoku publicznej piosenki w kontekście repertuaru (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametrów repertoirePublicId i songPublicId z URL
 * - Pobranie danych piosenki z API
 * - Zarządzanie stanem widoku (ładowanie, błąd, dane)
 * - Nawigację między piosenkami w repertuarze
 * - Obsługę przełącznika widoczności akordów
 * - Dynamiczne ustawianie metatagów
 */
@Component({
    selector: 'stbo-public-repertoire-song-view',
    standalone: true,
    imports: [SongViewerComponent],
    templateUrl: './public-repertoire-song.view.html',
    styleUrl: './public-repertoire-song.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRepertoireSongViewComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly publicRepertoireService = inject(PublicRepertoireService);
    private readonly fontSizeService = inject(FontSizeService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);
    private readonly destroy$ = new Subject<void>();

    /**
     * Przechowuje repertoirePublicId z aktualnej trasy.
     * Używane podczas ładowania do budowania nawigacji.
     */
    private readonly currentRepertoirePublicId: WritableSignal<string | null> = signal(null);

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state: WritableSignal<PublicRepertoireSongState> = signal({
        status: 'loading',
    });

    /**
     * Sygnał zarządzający widocznością akordów
     * Domyślnie false (tylko tekst)
     */
    public readonly showChords: WritableSignal<boolean> = signal(false);

    /**
     * Sygnał zarządzający wartością transpozycji
     * Domyślnie 0 (brak transpozycji)
     */
    public readonly transposeOffset: WritableSignal<number> = signal(0);

    /**
     * Sygnał zarządzający wielkością czcionki
     * Inicjalizowany wartością z localStorage lub domyślną wartością 'small'
     */
    public readonly fontSize: WritableSignal<FontSize> = signal(this.fontSizeService.getFontSize());

    /**
     * Pomocniczy getter dla type narrowing
     */
    get loadedSong() {
        const currentState = this.state();
        return currentState.status === 'loaded' ? currentState.song : null;
    }

    /**
     * Konfiguracja dla komponentu SongViewer
     * Będzie aktualizowana dynamicznie w computed signal
     */
    public readonly viewerConfig = computed<SongViewerConfig>(() => {
        const repertoirePublicId = this.currentRepertoirePublicId();
        return {
            showBackButton: !!repertoirePublicId,
            backLink: repertoirePublicId
                ? ['/public/repertoires', repertoirePublicId]
                : undefined,
            titleInToolbar: true,
            showChordsToggle: true,
            showTransposeControls: true,
            showQrButton: false,
            showNavigation: true,
            backButtonAriaLabel: 'Powrót do repertuaru',
        };
    });

    /**
     * Computed signal - nawigacja dla SongViewerComponent.
     * Zwraca nawigację nawet podczas ładowania (z pustymi wartościami),
     * aby komponent SongViewer nie był odmontowywany podczas przejścia między piosenkami.
     */
    public readonly navigation = computed<SongNavigation>(() => {
        const song = this.loadedSong;
        const repertoirePublicId = this.currentRepertoirePublicId();

        // Jeśli nie mamy piosenki lub repertoirePublicId, zwróć pustą nawigację
        if (!song || !repertoirePublicId) {
            return {
                previous: null,
                next: null,
                back: repertoirePublicId ? ['/public/repertoires', repertoirePublicId] : null,
            };
        }

        return {
            previous: song.order.previous
                ? {
                      title: song.order.previous.title,
                      link: [
                          '/public/repertoires',
                          repertoirePublicId,
                          'songs',
                          this.extractSongId(song.order.previous.url),
                      ],
                  }
                : null,
            next: song.order.next
                ? {
                      title: song.order.next.title,
                      link: [
                          '/public/repertoires',
                          repertoirePublicId,
                          'songs',
                          this.extractSongId(song.order.next.url),
                      ],
                  }
                : null,
            back: ['/public/repertoires', repertoirePublicId],
        };
    });


    ngOnInit(): void {
        // Reaktywne ładowanie danych przy każdej zmianie parametrów URL
        this.route.params
            .pipe(
                map((params) => ({
                    repertoirePublicId: params['repertoirePublicId'],
                    songPublicId: params['songPublicId'],
                })),
                switchMap(({ repertoirePublicId, songPublicId }) => {
                    // Walidacja parametrów
                    if (!repertoirePublicId || !songPublicId) {
                        return of({
                            status: 'error' as const,
                            error: {
                                code: 404,
                                message: 'Brak wymaganych parametrów w URL',
                            },
                        });
                    }

                    // Zapisz repertoirePublicId przed ustawieniem stanu loading
                    // aby navigation() computed signal miał dostęp do niego podczas ładowania
                    this.currentRepertoirePublicId.set(repertoirePublicId);

                    // Ustaw stan ładowania
                    this.state.set({ status: 'loading' });

                    // Pobierz dane z API
                    return this.publicRepertoireService
                        .getRepertoireSong(repertoirePublicId, songPublicId)
                        .pipe(
                            map((song) => {
                                // Ustaw tytuł strony
                                this.updateMetaTags(song.title);
                                return {
                                    status: 'loaded' as const,
                                    song,
                                };
                            }),
                            catchError((error: HttpErrorResponse) => {
                                const code = error.status || 0;
                                const message = this.getErrorMessage(code);

                                // Ustaw ogólny tytuł dla błędów
                                this.titleService.setTitle('Błąd - StrummerBox');
                                this.metaService.updateTag({
                                    name: 'robots',
                                    content: 'noindex, nofollow',
                                });

                                return of({
                                    status: 'error' as const,
                                    error: { code, message },
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
     * Zwraca komunikat błędu na podstawie kodu HTTP
     */
    private getErrorMessage(code: number): string {
        switch (code) {
            case 404:
                return 'Nie znaleziono piosenki';
            case 410:
                return 'Ta piosenka nie jest już dostępna';
            default:
                return 'Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.';
        }
    }

    /**
     * Aktualizuje tytuł strony i metatagi
     */
    private updateMetaTags(songTitle: string): void {
        this.titleService.setTitle(`${songTitle} - StrummerBox`);
        this.metaService.updateTag({
            name: 'robots',
            content: 'noindex, nofollow',
        });
    }

    /**
     * Wyciąga songPublicId z pełnego URL
     * Przykład: "/public/repertoires/abc123/songs/xyz789" -> "xyz789"
     */
    private extractSongId(url: string): string | null {
        if (!url) return null;
        const segments = url.split('/');
        return segments[segments.length - 1] || null;
    }

    /**
     * Obsługuje zmianę przełącznika akordów
     */
    onChordsToggled(value: boolean): void {
        this.showChords.set(value);
    }

    /**
     * Obsługuje zmianę wartości transpozycji
     */
    onTransposeChanged(newOffset: number): void {
        this.transposeOffset.set(newOffset);
    }

    /**
     * Obsługuje zmianę wielkości czcionki
     */
    onFontSizeChanged(newSize: FontSize): void {
        this.fontSize.set(newSize);
        this.fontSizeService.setFontSize(newSize);
    }
}

