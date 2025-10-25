import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import type { RepertoireSongViewModel } from '../../models/repertoire-edit.types';

@Component({
    selector: 'stbo-repertoire-song-list',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        DragDropModule,
    ],
    templateUrl: './repertoire-song-list.component.html',
    styleUrls: ['./repertoire-song-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireSongListComponent {
    @Input({ required: true }) public songs!: Signal<RepertoireSongViewModel[]>;
    @Input({ required: true }) public removingSongId!: Signal<string | null>;

    @Output() public orderChanged = new EventEmitter<string[]>();
    @Output() public songRemoved = new EventEmitter<string>();

    /**
     * Obsługuje zdarzenie upuszczenia elementu (drag-and-drop)
     */
    public onDrop(event: CdkDragDrop<RepertoireSongViewModel[]>): void {
        const songs = [...this.songs()];

        // Jeśli element został upuszczony w tym samym miejscu, nie rób nic
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        // Przenieś element w tablicy
        moveItemInArray(songs, event.previousIndex, event.currentIndex);

        // Emituj nową kolejność (array repertoireSongId)
        const newOrder = songs.map((song) => song.repertoireSongId);
        this.orderChanged.emit(newOrder);
    }

    /**
     * Obsługuje kliknięcie przycisku usuń
     */
    public onRemoveClick(repertoireSongId: string): void {
        this.songRemoved.emit(repertoireSongId);
    }

    /**
     * Sprawdza czy piosenka jest w trakcie usuwania
     */
    public isRemoving(repertoireSongId: string): boolean {
        return this.removingSongId() === repertoireSongId;
    }
}

