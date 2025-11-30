import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { SongViewerComponent } from '../song-viewer/song-viewer.component';
import type { SongViewerConfig } from '../song-viewer/song-viewer.config';
import type { SongEditPreviewMode } from './song-editor-preview.types';

/**
 * Konfiguracja SongViewerComponent dla trybu podglądu Biesiada w edytorze.
 * Ukrywa wszystkie elementy UI niepotrzebne w kontekście edycji.
 */
const BIESIADA_PREVIEW_CONFIG: SongViewerConfig = {
    showBackButton: false,
    titleInToolbar: false,
    showChordsToggle: false,
    showTransposeControls: false,
    showQrButton: false,
    showNavigation: false,
};

/**
 * Komponent prezentacyjny odpowiedzialny za wyświetlanie panelu podglądu
 * w edytorze piosenek.
 * 
 * Zawiera przełącznik trybów i warunkowo renderuje:
 * - Surowy tekst ChordPro (textarea)
 * - Renderowany podgląd w stylu "Biesiada" (SongViewerComponent)
 * 
 * @example
 * ```html
 * <stbo-song-editor-preview
 *   [content]="chordProContent"
 *   [title]="songTitle"
 *   [mode]="previewMode()"
 *   (modeChange)="onModeChange($event)">
 * </stbo-song-editor-preview>
 * ```
 */
@Component({
    selector: 'stbo-song-editor-preview',
    standalone: true,
    imports: [
        MatButtonToggleModule,
        SongViewerComponent,
    ],
    templateUrl: './song-editor-preview.component.html',
    styleUrl: './song-editor-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongEditorPreviewComponent {
    /**
     * Treść piosenki w formacie ChordPro do podglądu.
     */
    @Input({ required: true }) content!: string;

    /**
     * Tytuł piosenki (używany w trybie Biesiada).
     */
    @Input() title = '';

    /**
     * Aktualnie wybrany tryb podglądu.
     */
    @Input() mode: SongEditPreviewMode = 'chordpro';

    /**
     * Zdarzenie emitowane przy zmianie trybu podglądu.
     */
    @Output() modeChange = new EventEmitter<SongEditPreviewMode>();

    /**
     * Konfiguracja dla SongViewerComponent w trybie Biesiada.
     */
    protected readonly biesiadaConfig = BIESIADA_PREVIEW_CONFIG;

    /**
     * Placeholder dla pustego podglądu ChordPro.
     */
    protected readonly emptyContentPlaceholder = 'Wprowadź treść, aby zobaczyć podgląd w formacie ChordPro...';

    /**
     * Obsługa zmiany trybu podglądu.
     */
    protected onModeToggle(value: SongEditPreviewMode): void {
        this.modeChange.emit(value);
    }
}

