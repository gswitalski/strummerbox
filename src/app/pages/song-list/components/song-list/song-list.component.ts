import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    Signal,
    inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type {
    SongListSortDirection,
    SongListSortField,
} from '../../services/song-list.service';
import type { SongListViewModel } from '../../song-list.types';

@Component({
    selector: 'stbo-song-list',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatSortModule,
        MatTableModule,
    ],
    templateUrl: './song-list.component.html',
    styleUrl: './song-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongListComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);

    @Input({ required: true })
    public songs: SongListViewModel[] = [];

    @Input()
    public isLoading = false;

    @Input()
    public currentSort: { active: SongListSortField; direction: SongListSortDirection } = {
        active: 'createdAt',
        direction: 'desc',
    };

    @Output()
    public readonly editSong = new EventEmitter<string>();

    @Output()
    public readonly deleteSong = new EventEmitter<string>();

    @Output()
    public readonly shareSong = new EventEmitter<string>();

    @Output()
    public readonly sortChange = new EventEmitter<Sort>();

    @Output()
    public readonly statusChange = new EventEmitter<{ songId: string; isPublished: boolean }>();

    private readonly displayModeSignal: Signal<'table' | 'cards'> = this.createDisplayModeSignal();

    public readonly displayMode = this.displayModeSignal;

    public readonly columns: string[] = ['title', 'createdAt', 'updatedAt', 'status', 'actions'];

    private createDisplayModeSignal(): Signal<'table' | 'cards'> {
        return toSignal(
            this.breakpointObserver.observe(Breakpoints.Handset).pipe(
                map((result) => (result.matches ? 'cards' : 'table'))
            ),
            { initialValue: 'table' }
        );
    }

    public trackBySongId(_index: number, item: SongListViewModel): string {
        return item.id;
    }

    public handleSortChange(sort: Sort): void {
        this.sortChange.emit(sort);
    }

    public handleEditSong(songId: string): void {
        this.editSong.emit(songId);
    }

    public handleDeleteSong(songId: string): void {
        this.deleteSong.emit(songId);
    }

    public handleShareSong(songId: string): void {
        this.shareSong.emit(songId);
    }

    public handleStatusChange(songId: string, isPublished: boolean): void {
        this.statusChange.emit({ songId, isPublished });
    }
}
