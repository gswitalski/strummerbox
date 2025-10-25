import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    Signal,
    WritableSignal,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { AvailableSongViewModel } from '../../models/repertoire-edit.types';

@Component({
    selector: 'stbo-available-song-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './available-song-list.component.html',
    styleUrls: ['./available-song-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableSongListComponent {
    @Input({ required: true }) public songs!: Signal<AvailableSongViewModel[]>;
    @Input({ required: true }) public addingSongId!: Signal<string | null>;

    @Output() public songAdded = new EventEmitter<string>();

    // Stan lokalny dla filtrowania
    private readonly filterState: WritableSignal<string> = signal('');
    public readonly filter: Signal<string> = this.filterState.asReadonly();

    /**
     * Filtrowane piosenki na podstawie wyszukiwania
     */
    public get filteredSongs(): AvailableSongViewModel[] {
        const filterValue = this.filterState().toLowerCase().trim();

        if (filterValue.length === 0) {
            return this.songs();
        }

        return this.songs().filter((song) =>
            song.title.toLowerCase().includes(filterValue)
        );
    }

    /**
     * Aktualizuje wartość filtra
     */
    public updateFilter(value: string): void {
        this.filterState.set(value);
    }

    /**
     * Czyści filtr
     */
    public clearFilter(): void {
        this.filterState.set('');
    }

    /**
     * Obsługuje kliknięcie przycisku dodaj
     */
    public onAddClick(songId: string): void {
        this.songAdded.emit(songId);
    }

    /**
     * Sprawdza czy piosenka jest w trakcie dodawania
     */
    public isAdding(songId: string): boolean {
        return this.addingSongId() === songId;
    }
}

