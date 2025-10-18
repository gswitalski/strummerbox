import { ChangeDetectionStrategy, Component, EventEmitter, Output, Signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../services/layout.service';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { NavLink } from '../models/nav-link.model';

@Component({
    selector: 'stbo-sidenav',
    standalone: true,
    imports: [CommonModule, MatListModule, MatDividerModule, MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent {
    private readonly layoutService = inject(LayoutService);
    private readonly profileService = inject(ProfileService);
    private readonly authService = inject(AuthService);

    @Output()
    public readonly navigateRequest = new EventEmitter<void>();

    public readonly profile = this.profileService.profile;
    public readonly isMobile: Signal<boolean> = this.layoutService.isMobile;
    public readonly managementLinks: Signal<NavLink[]> = this.layoutService.managementLinks;
    public readonly biesiadaLinks: Signal<NavLink[]> = this.layoutService.biesiadaLinks;

    public readonly isLoggingOut: Signal<boolean> = this.authService.isLoggingOut;
    public readonly logoutError: Signal<string | null> = this.authService.logoutError;

    public async logout(): Promise<void> {
        const isSuccess = await this.authService.logout();

        if (isSuccess) {
            this.navigateRequest.emit();
            return;
        }
    }

    public handleNavigate(): void {
        this.navigateRequest.emit();
    }
}

