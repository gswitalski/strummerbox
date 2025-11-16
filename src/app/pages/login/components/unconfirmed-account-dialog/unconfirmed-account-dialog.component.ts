import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../../core/services/auth.service';
import type { UnconfirmedAccountDialogData } from './unconfirmed-account-dialog.types';

@Component({
    selector: 'stbo-unconfirmed-account-dialog',
    standalone: true,
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatProgressBarModule,
        MatSnackBarModule,
    ],
    templateUrl: './unconfirmed-account-dialog.component.html',
    styleUrls: ['./unconfirmed-account-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnconfirmedAccountDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<UnconfirmedAccountDialogComponent>);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    readonly data = inject<UnconfirmedAccountDialogData>(MAT_DIALOG_DATA);
    readonly isResending = signal(false);

    async onResendClick(): Promise<void> {
        if (this.isResending()) {
            return;
        }

        this.isResending.set(true);

        try {
            await this.authService.resendConfirmation({ email: this.data.email });

            this.snackBar.open(
                'Link aktywacyjny został wysłany ponownie. Sprawdź swoją skrzynkę e-mail.',
                'OK',
                {
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                }
            );

            this.dialogRef.close(true);
        } catch (error) {
            console.error('UnconfirmedAccountDialogComponent: resend error', error);

            const errorMessage = error instanceof Error
                ? error.message
                : 'Wystąpił błąd. Nie udało się wysłać linku.';

            this.snackBar.open(
                errorMessage,
                'OK',
                {
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                }
            );
        } finally {
            this.isResending.set(false);
        }
    }
}

