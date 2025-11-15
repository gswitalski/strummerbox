import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { ResendConfirmationCommand } from '../../../../packages/contracts/types';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'stbo-awaiting-confirmation-page',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule,
        MatSnackBarModule,
        RouterModule,
    ],
    templateUrl: './awaiting-confirmation-page.component.html',
    styleUrls: ['./awaiting-confirmation-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwaitingConfirmationPageComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    readonly email = signal<string>('');
    readonly isResending = signal(false);
    readonly canResend = signal(true);

    private resendCooldownMs = 30000; // 30 sekund

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const emailParam = params['email'];

            if (!emailParam || typeof emailParam !== 'string') {
                void this.router.navigate(['/login']);
                return;
            }

            this.email.set(emailParam);
        });
    }

    async onResend(): Promise<void> {
        if (!this.canResend() || this.isResending()) {
            return;
        }

        const emailValue = this.email();

        if (!emailValue) {
            return;
        }

        this.isResending.set(true);

        try {
            const command: ResendConfirmationCommand = {
                email: emailValue,
            };

            await this.authService.resendConfirmation(command);

            this.snackBar.open('Wysłano nowy link aktywacyjny', 'Zamknij', {
                duration: 5000,
            });

            this.startResendCooldown();
        } catch (error) {
            console.error('AwaitingConfirmationPageComponent: resend error', error);

            const errorMessage = this.mapError(error);
            this.snackBar.open(errorMessage, 'Zamknij', {
                duration: 5000,
            });
        } finally {
            this.isResending.set(false);
        }
    }

    private startResendCooldown(): void {
        this.canResend.set(false);

        setTimeout(() => {
            this.canResend.set(true);
        }, this.resendCooldownMs);
    }

    private mapError(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
    }
}

