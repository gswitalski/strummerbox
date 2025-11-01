import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BiesiadaRepertoireListService } from './services/biesiada-repertoire-list.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

/**
 * Biesiada Repertoire List Page Component
 * Displays a simplified list of repertoires for the Biesiada mode.
 * Optimized for mobile devices.
 */
@Component({
    selector: 'stbo-biesiada-repertoire-list-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatListModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        EmptyStateComponent,
    ],
    templateUrl: './biesiada-repertoire-list-page.component.html',
    styleUrl: './biesiada-repertoire-list-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaRepertoireListPageComponent implements OnInit {
    private readonly service = inject(BiesiadaRepertoireListService);
    private readonly router = inject(Router);

    /**
     * View model signal exposed from the service
     */
    readonly vm = this.service.vm;

    ngOnInit(): void {
        this.service.fetchRepertoires();
    }

    /**
     * Retry fetching repertoires after an error
     */
    onRetry(): void {
        this.service.fetchRepertoires();
    }

    /**
     * Navigate to repertoires management page
     */
    onNavigateToRepertoires(): void {
        this.router.navigate(['/repertoires']);
    }
}

