import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ProfileService } from '../../core/services/profile.service';
import { RepertoireCreateDialogComponent } from '../repertoire-list/components/repertoire-create-dialog/repertoire-create-dialog.component';

@Component({
    selector: 'stbo-dashboard',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatDialogModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    private readonly profileService = inject(ProfileService);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);

    public readonly profile = this.profileService.profile;
    public readonly isLoading = this.profileService.isLoading;
    public readonly error = this.profileService.error;

    public readonly displayName = computed(() => this.profile()?.displayName ?? null);

    public ngOnInit(): void {
        void this.profileService.loadProfile();
    }

    public async navigateToAddSong(): Promise<void> {
        await this.router.navigateByUrl('/management/songs/new');
    }

    public navigateToCreateRepertoire(): void {
        // Otwórz okno dialogowe do utworzenia nowego repertuaru
        const dialogRef = this.dialog.open(RepertoireCreateDialogComponent, {
            width: '500px',
            disableClose: false,
        });

        // Dialog sam obsługuje nawigację do widoku edycji po utworzeniu repertuaru
        // Nie ma potrzeby dodatkowych akcji po zamknięciu dialogu w kontekście dashboardu
        dialogRef.afterClosed().subscribe(() => {
            // W dashboardzie nie musimy odświeżać listy (jak w RepertoireListPageComponent),
            // ponieważ nie ma tutaj wyświetlanej listy repertuarów
        });
    }
}



