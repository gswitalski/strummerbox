import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SongDisplayComponent } from '../song-display/song-display.component';
import { SongNavigationComponent } from '../song-navigation/song-navigation.component';
import { ErrorDisplayComponent } from '../error-display/error-display.component';
import { TransposeControlsComponent } from '../transpose-controls/transpose-controls.component';
import { FontSizeControlsComponent } from '../font-size-controls/font-size-controls.component';
import type {
    SongViewerConfig,
    SongViewerStatus,
    SongViewerError,
} from './song-viewer.config';
import type { SongNavigation } from './song-viewer.types';
import type { FontSize } from '../../models/font-size.model';

/**
 * Reużywalny komponent prezentacyjny do wyświetlania widoku piosenki.
 *
 * Ten komponent jest wysoce konfigurowalny i może być używany w różnych kontekstach:
 * - Widok biesiady (z akordami, przyciskiem QR, nawigacją)
 * - Widok publicznego repertuaru (z przełącznikiem akordów, nawigacją)
 * - Widok publicznej piosenki (z przełącznikiem akordów, bez nawigacji)
 *
 * @example
 * ```html
 * <stbo-song-viewer
 *   [status]="status"
 *   [title]="song.title"
 *   [content]="song.content"
 *   [showChords]="showChords"
 *   [navigation]="navigation"
 *   [config]="viewerConfig"
 *   (chordsToggled)="onChordsToggled($event)"
 *   (qrButtonClicked)="onQrButtonClicked()">
 * </stbo-song-viewer>
 * ```
 */
@Component({
    selector: 'stbo-song-viewer',
    standalone: true,
    imports: [
        RouterLink,
        MatToolbarModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatProgressBarModule,
        SongDisplayComponent,
        SongNavigationComponent,
        ErrorDisplayComponent,
        TransposeControlsComponent,
        FontSizeControlsComponent,
    ],
    templateUrl: './song-viewer.component.html',
    styleUrl: './song-viewer.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongViewerComponent {
    /**
     * Stan komponentu: ładowanie, załadowany lub błąd
     */
    @Input({ required: true }) status!: SongViewerStatus;

    /**
     * Obiekt błędu (wymagany tylko gdy status = 'error')
     */
    @Input() error?: SongViewerError;

    /**
     * Tytuł piosenki (wymagany gdy status = 'loaded')
     */
    @Input() title?: string;

    /**
     * Treść piosenki w formacie ChordPro (wymagany gdy status = 'loaded')
     */
    @Input() content?: string;

    /**
     * Czy wyświetlać akordy (true) czy tylko tekst (false)
     */
    @Input() showChords = false;

    /**
     * Aktualna wartość transpozycji (przesunięcie w półtonach)
     */
    @Input() transposeOffset = 0;

    /**
     * Obiekt nawigacyjny z linkami do poprzedniej/następnej piosenki
     * Wymagany tylko gdy config.showNavigation = true
     */
    @Input() navigation?: SongNavigation;

    /**
     * Konfiguracja określająca, które elementy UI mają być widoczne
     */
    @Input({ required: true }) config!: SongViewerConfig;

    /**
     * Czy wyświetlać toolbar
     */
    @Input() showHeader = true;

    /**
     * Wielkość czcionki dla wyświetlanego tekstu
     */
    @Input() fontSize: FontSize = 'small';


    /**
     * Zdarzenie emitowane gdy użytkownik zmienia stan przełącznika akordów
     */
    @Output() chordsToggled = new EventEmitter<boolean>();

    /**
     * Zdarzenie emitowane gdy użytkownik klika przycisk FAB (kod QR)
     */
    @Output() qrButtonClicked = new EventEmitter<void>();

    /**
     * Zdarzenie emitowane gdy użytkownik zmienia wartość transpozycji
     */
    @Output() transposeChanged = new EventEmitter<number>();

    /**
     * Zdarzenie emitowane gdy użytkownik zmienia wielkość czcionki
     */
    @Output() fontSizeChanged = new EventEmitter<FontSize>();

    /**
     * Zdarzenie emitowane gdy użytkownik klika przycisk "Zamknij" (wyjście z trybu Biesiada)
     */
    @Output() exitClicked = new EventEmitter<void>();

    /**
     * Pomocnicze gettery dla czytelności w template
     */
    get isLoading(): boolean {
        return this.status === 'loading';
    }

    get isLoaded(): boolean {
        return this.status === 'loaded';
    }

    get isError(): boolean {
        return this.status === 'error';
    }

    /**
     * Obsługa zmiany przełącznika akordów
     */
    onChordsToggleChange(value: string): void {
        const newValue = value === 'chords';
        this.chordsToggled.emit(newValue);
    }

    /**
     * Obsługa kliknięcia przycisku QR
     */
    onQrButtonClick(): void {
        this.qrButtonClicked.emit();
    }

    /**
     * Obsługa zmiany wartości transpozycji
     */
    onTransposeChange(newOffset: number): void {
        this.transposeChanged.emit(newOffset);
    }

    /**
     * Obsługa zmiany wielkości czcionki
     */
    onFontSizeChange(newSize: FontSize): void {
        this.fontSizeChanged.emit(newSize);
    }

    /**
     * Obsługa kliknięcia przycisku "Zamknij" (wyjście z trybu Biesiada)
     */
    onExitClick(): void {
        this.exitClicked.emit();
    }
}
