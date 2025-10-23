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
    RepertoireListSortDirection,
    RepertoireListSortField,
    RepertoireSummaryVM,
} from '../../repertoire-list.types';

@Component({
    selector: 'stbo-repertoire-list',
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
    templateUrl: './repertoire-list.component.html',
    styleUrl: './repertoire-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireListComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);

    @Input({ required: true })
    public repertoires: RepertoireSummaryVM[] = [];

    @Input()
    public isLoading = false;

    @Input()
    public currentSort: { active: RepertoireListSortField; direction: RepertoireListSortDirection } = {
        active: 'createdAt',
        direction: 'desc',
    };

    @Output()
    public readonly editRepertoire = new EventEmitter<string>();

    @Output()
    public readonly deleteRepertoire = new EventEmitter<string>();

    @Output()
    public readonly shareRepertoire = new EventEmitter<string>();

    @Output()
    public readonly sortChange = new EventEmitter<Sort>();

    private readonly displayModeSignal: Signal<'table' | 'cards'> = this.createDisplayModeSignal();

    public readonly displayMode = this.displayModeSignal;

    public readonly columns: string[] = ['name', 'songCount', 'createdAt', 'updatedAt', 'status', 'actions'];

    private createDisplayModeSignal(): Signal<'table' | 'cards'> {
        return toSignal(
            this.breakpointObserver.observe(Breakpoints.Handset).pipe(
                map((result) => (result.matches ? 'cards' : 'table'))
            ),
            { initialValue: 'table' }
        );
    }

    public trackByRepertoireId(_index: number, item: RepertoireSummaryVM): string {
        return item.id;
    }

    public handleSortChange(sort: Sort): void {
        this.sortChange.emit(sort);
    }

    public handleEditRepertoire(repertoireId: string): void {
        this.editRepertoire.emit(repertoireId);
    }

    public handleDeleteRepertoire(repertoireId: string): void {
        this.deleteRepertoire.emit(repertoireId);
    }

    public handleShareRepertoire(repertoireId: string): void {
        this.shareRepertoire.emit(repertoireId);
    }
}

