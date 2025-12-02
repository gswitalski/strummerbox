import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import type { SongDto } from '../../../../packages/contracts/types';
import { SongsApiService } from '../song-create/services/songs-api.service';
import { FontSizeService } from '../../core/services/font-size.service';
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
import type {
    SongViewerConfig,
    SongViewerError,
    SongViewerStatus,
} from '../../shared/components/song-viewer/song-viewer.config';
import type { FontSize } from '../../shared/models/font-size.model';

/**
 * Interfejs opisujący stan widoku podglądu piosenki.
 */
interface SongPreviewState {
    status: SongViewerStatus;
    song: SongDto | null;
    error: SongViewerError | null;
    transposeOffset: number;
}

/**
 * Komponent strony podglądu piosenki.
 *
 * Jest to "inteligentny" komponent odpowiedzialny za:
 * - Pobieranie ID piosenki z URL
 * - Komunikację z API w celu pobrania danych piosenki
 * - Zarządzanie stanem (ładowanie, błąd, dane)
 * - Obsługę transpozycji akordów
 * - Nawigację powrotną do listy piosenek
 */
@Component({
    selector: 'stbo-song-preview-page',
    standalone: true,
    imports: [SongViewerComponent],
    templateUrl: './song-preview-page.component.html',
    styleUrl: './song-preview-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongPreviewPageComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly songsApiService = inject(SongsApiService);
    private readonly fontSizeService = inject(FontSizeService);

    /**
     * Główny sygnał stanu komponentu.
     */
    private readonly state: WritableSignal<SongPreviewState> = signal({
        status: 'loading',
        song: null,
        error: null,
        transposeOffset: 0,
    });

    /**
     * Sygnał zarządzający wielkością czcionki
     * Inicjalizowany wartością z localStorage lub domyślną wartością 'small'
     */
    public readonly fontSize: WritableSignal<FontSize> = signal(this.fontSizeService.getFontSize());

    /**
     * Konfiguracja dla SongViewerComponent.
     */
    public readonly config: SongViewerConfig = {
        showBackButton: true,
        backLink: ['/management/songs'],
        backButtonAriaLabel: 'Powrót do listy piosenek',
        titleInToolbar: false,
        showChordsToggle: false,
        showTransposeControls: true,
        showQrButton: false,
        showNavigation: false,
    };

    /**
     * Sygnały pochodne dla szablonu.
     */
    public readonly status = computed(() => this.state().status);
    public readonly song = computed(() => this.state().song);
    public readonly title = computed(() => this.state().song?.title ?? '');
    public readonly content = computed(() => this.state().song?.content ?? '');
    public readonly transposeOffset = computed(() => this.state().transposeOffset);
    public readonly error = computed(() => this.state().error);

    public ngOnInit(): void {
        const songId = this.route.snapshot.paramMap.get('id');

        if (!songId) {
            this.state.update((s) => ({
                ...s,
                status: 'error',
                error: { code: 404, message: 'Nie podano identyfikatora piosenki.' },
            }));
            return;
        }

        void this.loadSong(songId);
    }

    /**
     * Obsługuje zmianę wartości transpozycji.
     */
    public onTransposeChange(newOffset: number): void {
        this.state.update((s) => ({
            ...s,
            transposeOffset: newOffset,
        }));
    }

    /**
     * Obsługuje zmianę wielkości czcionki.
     */
    public onFontSizeChange(newSize: FontSize): void {
        this.fontSize.set(newSize);
        this.fontSizeService.setFontSize(newSize);
    }

    /**
     * Pobiera dane piosenki z API.
     */
    private async loadSong(id: string): Promise<void> {
        try {
            const song = await this.songsApiService.getSong(id);

            this.state.update((s) => ({
                ...s,
                status: 'loaded',
                song,
            }));
        } catch (error) {
            console.error('SongPreviewPageComponent: load error', error);

            const errorMessage = this.getErrorMessage(error);
            const errorCode = this.getErrorCode(error);

            this.state.update((s) => ({
                ...s,
                status: 'error',
                error: { code: errorCode, message: errorMessage },
            }));
        }
    }

    private getErrorMessage(error: unknown): string {
        if (this.isNotFoundError(error)) {
            return 'Nie znaleziono piosenki.';
        }

        if (this.isForbiddenError(error)) {
            return 'Brak uprawnień do wyświetlenia tej piosenki.';
        }

        return 'Wystąpił błąd podczas ładowania piosenki.';
    }

    private getErrorCode(error: unknown): number {
        if (!error || typeof error !== 'object') {
            return 500;
        }

        const status = (error as { status?: number }).status;
        if (status) {
            return status;
        }

        return 500;
    }

    private isNotFoundError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const status = (error as { status?: number }).status;
        if (status === 404) {
            return true;
        }

        const responseError = (error as { error?: { code?: string } }).error;
        return responseError?.code === 'resource_not_found';
    }

    private isForbiddenError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const status = (error as { status?: number }).status;
        if (status === 403) {
            return true;
        }

        const responseError = (error as { error?: { code?: string } }).error;
        return responseError?.code === 'forbidden';
    }
}

