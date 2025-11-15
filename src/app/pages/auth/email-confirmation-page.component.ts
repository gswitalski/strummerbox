import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';

type EmailConfirmationState = 'loading' | 'success' | 'error';

@Component({
    selector: 'stbo-email-confirmation-page',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule,
    ],
    templateUrl: './email-confirmation-page.component.html',
    styleUrls: ['./email-confirmation-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfirmationPageComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly state = signal<EmailConfirmationState>('loading');

    ngOnInit(): void {
        void this.handleConfirmation();
    }

    private async handleConfirmation(): Promise<void> {
        try {
            await this.authService.handleEmailConfirmation();
            this.state.set('success');
        } catch (error) {
            console.error('EmailConfirmationPageComponent: confirmation error', error);
            this.state.set('error');
        }
    }

    goToLogin(): void {
        void this.router.navigate(['/login']);
    }

    goToResendConfirmation(): void {
        // Przekierowanie do strony rejestracji, gdzie użytkownik może ponownie zarejestrować się
        // lub do strony logowania, skąd może poprosić o nowy link
        void this.router.navigate(['/register']);
    }
}

