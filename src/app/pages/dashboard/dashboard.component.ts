import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

import { ProfileService } from '../../core/services/profile.service';

@Component({
    selector: 'stbo-dashboard',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    private readonly profileService = inject(ProfileService);
    private readonly router = inject(Router);

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

    public async navigateToCreateRepertoire(): Promise<void> {
        await this.router.navigateByUrl('/management/repertoires/new');
    }
}



