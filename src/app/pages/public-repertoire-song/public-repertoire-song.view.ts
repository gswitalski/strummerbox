import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    WritableSignal,
    inject,
    signal,
    OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, takeUntil, catchError, of, map } from 'rxjs';
import { PublicRepertoireService } from '../public-repertoire/services/public-repertoire.service';
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import type { PublicRepertoireSongState } from './public-repertoire-song.types';
import type { PublicRepertoireSongDto } from '../../../../packages/contracts/types';

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
        MatProgressBarModule,
        MatButtonModule,
        RouterLink,
        ErrorDisplayComponent,
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
     * Pomocnicze gettery dla nawigacji
     */
    get hasPrevious(): boolean {
        return this.loadedSong?.order.previous !== null;
    }

    get hasNext(): boolean {
        return this.loadedSong?.order.next !== null;
    }

    get previousSongId(): string | null {
        const previousUrl = this.loadedSong?.order.previous;
        return previousUrl ? this.extractSongId(previousUrl) : null;
    }

    get nextSongId(): string | null {
        const nextUrl = this.loadedSong?.order.next;
        return nextUrl ? this.extractSongId(nextUrl) : null;
    }

    get repertoirePublicId(): string | null {
        return this.route.snapshot.paramMap.get('repertoirePublicId');
    }

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

