import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Komponent prezentacyjny (dumb component) do wyświetlania treści piosenki.
 * Renderuje tytuł i treść bez akordów w sposób zoptymalizowany pod urządzenia mobilne.
 */
@Component({
    selector: 'stbo-song-content-view',
    standalone: true,
    imports: [],
    templateUrl: './song-content-view.component.html',
    styleUrl: './song-content-view.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongContentViewComponent {
    /**
     * Tytuł piosenki
     */
    @Input({ required: true }) title!: string;

    /**
     * Treść piosenki (już przetworzona, bez akordów)
     */
    @Input({ required: true }) content!: string;
}

