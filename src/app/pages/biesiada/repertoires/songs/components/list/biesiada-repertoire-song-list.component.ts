import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import type { BiesiadaRepertoireSongEntryDto } from '../../../../../../../../packages/contracts/types';

/**
 * Biesiada Repertoire Song List Component
 * Prezentational component displaying a clickable list of songs in a repertoire.
 */
@Component({
    selector: 'stbo-biesiada-repertoire-song-list',
    standalone: true,
    imports: [
        MatListModule,
        MatIconModule,
    ],
    templateUrl: './biesiada-repertoire-song-list.component.html',
    styleUrl: './biesiada-repertoire-song-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaRepertoireSongListComponent {
    /**
     * Array of songs to display
     */
    @Input({ required: true }) songs: BiesiadaRepertoireSongEntryDto[] = [];

    /**
     * Event emitted when a song is selected
     */
    @Output() songSelected = new EventEmitter<string>();

    /**
     * Handles song selection
     */
    onSongClick(songId: string): void {
        this.songSelected.emit(songId);
    }
}

