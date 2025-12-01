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
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PublicSongService } from './services/public-song.service';
import { FontSizeService } from '../../core/services/font-size.service';
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
import type { SongViewerConfig } from '../../shared/components/song-viewer/song-viewer.config';
import type { PublicSongState } from './public-song.types';
import type { PublicSongDto } from '../../../../packages/contracts/types';
import type { FontSize } from '../../shared/models/font-size.model';

/**
 * Główny komponent widoku publicznej piosenki (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametru publicId z URL
 * - Pobranie danych piosenki z API
 * - Zarządzanie stanem widoku (ładowanie, błąd, dane)
 * - Obsługę przełącznika widoczności akordów
 * - Dynamiczne ustawianie metatagów
 */
@Component({
    selector: 'stbo-public-song-view',
    standalone: true,
    imports: [SongViewerComponent],
    templateUrl: './public-song.view.html',
    styleUrl: './public-song.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSongViewComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly publicSongService = inject(PublicSongService);
    private readonly fontSizeService = inject(FontSizeService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state: WritableSignal<PublicSongState> = signal({
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
     * Konfiguracja dla komponentu SongViewer
     */
    public readonly viewerConfig: SongViewerConfig = {
        showBackButton: false,
        titleInToolbar: true,
        showChordsToggle: true,
        showTransposeControls: true,
        showQrButton: false,
        showNavigation: false,
    };

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
     * Pobiera dane piosenki z API
     */
    private async loadSong(publicId: string): Promise<void> {
        this.state.set({ status: 'loading' });

        try {
            const dto: PublicSongDto = await firstValueFrom(
                this.publicSongService.getSongByPublicId(publicId)
            );

            // Zaktualizuj stan z pełną treścią ChordPro
            this.state.set({
                status: 'loaded',
                song: {
                    title: dto.title,
                    content: dto.content,
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

