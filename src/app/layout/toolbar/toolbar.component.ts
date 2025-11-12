import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../services/layout.service';
import { ProfileService } from '../../core/services/profile.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'stbo-toolbar',
    standalone: true,
    imports: [MatToolbarModule, MatButtonModule, MatIconModule],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
    private readonly layoutService = inject(LayoutService);
    private readonly profileService = inject(ProfileService);

    public readonly isMobile: Signal<boolean> = this.layoutService.isMobile;
    public readonly userInitials: Signal<string | null> = computed(() => {
        const profile = this.profileService.profile();

        if (!profile) {
            return null;
        }

        const name = profile.displayName?.trim() || profile.email;

        return name.charAt(0).toUpperCase();
    });

    // Dynamiczny tytuł aplikacji z oznaczeniem środowiska testowego
    public readonly appTitle: string = this.getAppTitle();

    public toggleSidenav(): void {
        this.layoutService.toggleSidenav();
    }

    private getAppTitle(): string {
        const baseTitle = 'StrummerBox';

        if (environment.environmentName === 'test') {
            return `${baseTitle} (test)`;
        }

        if (environment.environmentName === 'development') {
            return `${baseTitle} (development)`;
        }

        return baseTitle;
    }
}

