import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Signal,
    inject,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { LayoutService } from '../services/layout.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
    selector: 'stbo-default-layout',
    standalone: true,
    imports: [
        MatSidenavModule,
        RouterOutlet,
        ToolbarComponent,
        SidenavComponent,
    ],
    templateUrl: './default-layout.component.html',
    styleUrl: './default-layout.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultLayoutComponent implements OnInit {
    private readonly layoutService = inject(LayoutService);
    private readonly profileService = inject(ProfileService);

    public readonly isMobile: Signal<boolean> = this.layoutService.isMobile;
    public readonly sidenavMode: Signal<'side' | 'over'> =
        this.layoutService.sidenavMode;
    public readonly isSidenavOpened: Signal<boolean> =
        this.layoutService.isSidenavOpen;

    public ngOnInit(): void {
        void this.profileService.loadProfile();
    }
    public onSidenavOpenedChange(isOpen: boolean | undefined): void {
        if (typeof isOpen !== 'boolean') {
            return;
        }

        this.layoutService.setSidenavOpen(isOpen);
    }

    public handleSidenavAction(): void {
        if (!this.isMobile()) {
            return;
        }

        this.layoutService.closeSidenav();
    }
}

