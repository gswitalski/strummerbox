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
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
import { stripChords } from '../public-song/utils/chord-stripper';
import type { PublicRepertoireSongState } from './public-repertoire-song.types';
import type { PublicRepertoireSongDto } from '../../../../packages/contracts/types';
import type { SongNavigation } from '../../shared/components/song-viewer/song-viewer.types';

/**
 * Główny komponent widoku publicznej piosenki w kontekście repertuaru (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametrów repertoirePublicId i songPublicId z URL
 * - Pobranie danych piosenki z API
 * - Zarządzanie stanem widoku
 * - Nawigację między piosenkami w repertuarze
 * - Dynamiczne ustawianie metatagów
 */
@Component({
    selector: 'stbo-public-repertoire-song-view',
    standalone: true,
    imports: [
        ErrorDisplayComponent,
        SongViewerComponent,
    ],
    templateUrl: './public-repertoire-song.view.html',
    styleUrl: './public-repertoire-song.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRepertoireSongViewComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly publicRepertoireService = inject(PublicRepertoireService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);
    private readonly destroy$ = new Subject<void>();

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state: WritableSignal<PublicRepertoireSongState> = signal({
        status: 'loading',
    });

    /**
     * Pomocnicze gettery dla type narrowing w template
     */
    get isLoading(): boolean {
        return this.state().status === 'loading';
    }

    get isLoaded(): boolean {
        return this.state().status === 'loaded';
    }

    get isError(): boolean {
        return this.state().status === 'error';
    }

    get loadedSong(): PublicRepertoireSongDto | null {
        const currentState = this.state();
        return currentState.status === 'loaded' ? currentState.song : null;
    }

    get errorData() {
        const currentState = this.state();
        return currentState.status === 'error' ? currentState.error : null;
    }

    /**
     * Computed signal - nawigacja dla SongViewerComponent
     */
    public readonly navigation = computed<SongNavigation | null>(() => {
        const song = this.loadedSong;
        if (!song) return null;

        const repertoirePublicId = this.route.snapshot.paramMap.get('repertoirePublicId');

        return {
            previous: song.order.previous
                ? {
                      title: 'Poprzednia',
                      link: [
                          '/public/repertoires',
                          repertoirePublicId,
                          'songs',
                          this.extractSongId(song.order.previous),
                      ],
                  }
                : null,
            next: song.order.next
                ? {
                      title: 'Następna',
                      link: [
                          '/public/repertoires',
                          repertoirePublicId,
                          'songs',
                          this.extractSongId(song.order.next),
                      ],
                  }
                : null,
            back: ['/public/repertoires', repertoirePublicId],
        };
    });

    /**
     * Computed signal - treść piosenki bez akordów (stripped)
     */
    public readonly strippedContent = computed<string>(() => {
        const song = this.loadedSong;
        if (!song || !song.content) {
            return '';
        }
        return stripChords(song.content);
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
}

