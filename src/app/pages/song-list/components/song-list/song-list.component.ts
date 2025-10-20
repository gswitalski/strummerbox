import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule, NgClass } from '@angular/common';
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
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type {
    SongListSortDirection,
    SongListSortField,
} from '../../services/song-list.service';

export interface SongSummaryVM {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    isPublished: boolean;
}

@Component({
    selector: 'stbo-song-list',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSortModule,
        MatTableModule,
        NgClass,
    ],
    templateUrl: './song-list.component.html',
    styleUrl: './song-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongListComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);

    @Input({ required: true })
    public songs: SongSummaryVM[] = [];

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

    public trackBySongId(_index: number, item: SongSummaryVM): string {
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
}
