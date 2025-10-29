import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    WritableSignal,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PublicSongService } from './services/public-song.service';
import { stripChords } from './utils/chord-stripper';
import { SongContentViewComponent } from './components/song-content/song-content-view.component';
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import type { PublicSongState } from './public-song.types';
import type { PublicSongDto } from '../../../../packages/contracts/types';

/**
 * Główny komponent widoku publicznej piosenki (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametru publicId z URL
 * - Pobranie danych piosenki z API
 * - Usunięcie akordów z treści
 * - Zarządzanie stanem widoku
 * - Dynamiczne ustawianie metatagów
 */
@Component({
    selector: 'stbo-public-song-view',
    standalone: true,
    imports: [
        MatProgressSpinnerModule,
        SongContentViewComponent,
        ErrorDisplayComponent,
    ],
    templateUrl: './public-song.view.html',
    styleUrl: './public-song.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSongViewComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly publicSongService = inject(PublicSongService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state: WritableSignal<PublicSongState> = signal({
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

    get loadedSong() {
        const currentState = this.state();
        return currentState.status === 'loaded' ? currentState.song : null;
    }

    get errorData() {
        const currentState = this.state();
        return currentState.status === 'error' ? currentState.error : null;
    }

    ngOnInit(): void {
        // Pobierz publicId z parametrów trasy
        const publicId = this.route.snapshot.paramMap.get('publicId');

        if (!publicId) {
            this.handleError({
                status: 404,
                message: 'Brak identyfikatora piosenki',
            } as HttpErrorResponse);
            return;
        }

        void this.loadSong(publicId);
    }

    /**
     * Pobiera dane piosenki z API i przetwarza treść
     */
    private async loadSong(publicId: string): Promise<void> {
        this.state.set({ status: 'loading' });

        try {
            const dto: PublicSongDto = await firstValueFrom(
                this.publicSongService.getSongByPublicId(publicId)
            );

            // Usuń akordy z treści
            const processedContent = stripChords(dto.content);

            // Zaktualizuj stan
            this.state.set({
                status: 'loaded',
                song: {
                    title: dto.title,
                    content: processedContent,
                },
            });

            // Ustaw tytuł strony i metatagi
            this.updateMetaTags(dto.title);
        } catch (error) {
            this.handleError(error as HttpErrorResponse);
        }
    }

    /**
     * Obsługuje błędy API
     */
    private handleError(error: HttpErrorResponse): void {
        const code = error.status || 0;
        const message = this.getErrorMessage(code);

        this.state.set({
            status: 'error',
            error: { code, message },
        });

        // Ustaw ogólny tytuł dla błędów
        this.titleService.setTitle('Błąd - StrummerBox');
        this.metaService.updateTag({
            name: 'robots',
            content: 'noindex, nofollow',
        });
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
                return 'Wystąpił błąd. Spróbuj ponownie później.';
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
}

