import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { BiesiadaRepertoireSongListService } from './services/biesiada-repertoire-song-list.service';
import { BiesiadaRepertoireSongListComponent } from './components/list/biesiada-repertoire-song-list.component';
import { ShareDialogComponent } from '../../../../shared/components/share-dialog/share-dialog.component';
import type { ShareDialogData } from '../../../../shared/models/share-dialog.model';

/**
 * Biesiada Repertoire Song List Page Component
 * Displays the list of songs in a selected repertoire for Biesiada mode.
 * Optimized for mobile devices.
 */
@Component({
    selector: 'stbo-biesiada-repertoire-song-list-page',
    standalone: true,
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        BiesiadaRepertoireSongListComponent,
    ],
    templateUrl: './biesiada-repertoire-song-list-page.component.html',
    styleUrl: './biesiada-repertoire-song-list-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaRepertoireSongListPageComponent implements OnInit, OnDestroy {
    private readonly service = inject(BiesiadaRepertoireSongListService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);

    /**
     * View model signal exposed from the service
     */
    readonly vm = this.service.vm;

    ngOnInit(): void {
        // Get repertoire ID from route params
        const repertoireId = this.route.snapshot.paramMap.get('id');
        
        if (!repertoireId) {
            // If no ID, navigate back to repertoires list
            this.navigateBack();
            return;
        }

        // Fetch songs for the repertoire
        this.service.fetchRepertoireSongs(repertoireId);
    }

    ngOnDestroy(): void {
        // Reset service state when leaving the page
        this.service.reset();
    }

    /**
     * Navigate back to repertoires list
     */
    navigateBack(): void {
        this.router.navigate(['/biesiada/repertoires']);
    }

    /**
     * Handle song selection - navigate to song detail view
     */
    onSongSelected(songId: string): void {
        const repertoireId = this.vm().repertoireId;
        
        if (!repertoireId) {
            return;
        }

        this.router.navigate(['/biesiada/repertoires', repertoireId, 'songs', songId]);
    }

    /**
     * Retry fetching songs after an error
     */
    onRetry(): void {
        const repertoireId = this.route.snapshot.paramMap.get('id');
        
        if (repertoireId) {
            this.service.fetchRepertoireSongs(repertoireId);
        }
    }

    /**
     * Show QR code dialog for sharing the repertoire
     */
    showQrCode(): void {
        const share = this.vm().share;
        const repertoireName = this.vm().repertoireName;
        
        if (!share) {
            return;
        }

        const dialogData: ShareDialogData = {
            title: `Udostępnij repertuar "${repertoireName || 'Repertuar'}"`,
            publicUrl: share.publicUrl,
            qrPayload: share.qrPayload,
        };

        this.dialog.open(ShareDialogComponent, {
            data: dialogData,
            width: '400px',
            maxWidth: '90vw',
        });
    }
}

