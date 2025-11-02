import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChordProPreviewComponent } from '../../../pages/song-create/components/chord-pro-preview/chord-pro-preview.component';
import type { SongNavigation } from './song-viewer.types';

/**
 * Reużywalny komponent prezentacyjny do wyświetlania treści piosenki.
 * Używany zarówno w publicznym widoku jak i w trybie Biesiada.
 *
 * Komponent odpowiedzialny za:
 * - Wyświetlanie tytułu piosenki w toolbar
 * - Renderowanie treści piosenki z akordami (lub bez)
 * - Nawigację między piosenkami (poprzednia/następna)
 * - Przycisk powrotu do listy
 * - Opcjonalny przycisk FAB do pokazywania QR kodu
 */
@Component({
    selector: 'stbo-song-viewer',
    standalone: true,
    imports: [
        RouterLink,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        ChordProPreviewComponent,
    ],
    templateUrl: './song-viewer.component.html',
    styleUrl: './song-viewer.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongViewerComponent {
    /**
     * Tytuł piosenki wyświetlany w toolbar
     */
    public readonly title = input.required<string>();

    /**
     * Treść piosenki w formacie ChordPro
     */
    public readonly content = input.required<string>();

    /**
     * Konfiguracja nawigacji (poprzednia, następna, powrót)
     */
    public readonly navigation = input.required<SongNavigation>();

    /**
     * Określa, czy pokazywać akordy (true) czy tylko tekst (false)
     * Gdy true - używa ChordProPreviewComponent do renderowania z akordami
     * Gdy false - używa prostego <pre> tylko z tekstem
     */
    public readonly showChords = input<boolean>(true);

    /**
     * Określa, czy przycisk FAB do pokazywania QR kodu powinien być widoczny
     */
    public readonly showQrButton = input<boolean>(false);

    /**
     * Włącza/wyłącza wyświetlanie wskaźnika ładowania
     */
    public readonly isLoading = input<boolean>(false);

    /**
     * Zdarzenie emitowane po kliknięciu przycisku udostępniania (QR)
     */
    public readonly qrButtonClicked = output<void>();

    /**
     * Obsługuje kliknięcie przycisku QR
     */
    protected handleQrButtonClick(): void {
        this.qrButtonClicked.emit();
    }
}

