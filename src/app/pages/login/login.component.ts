import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import type { AuthError, SignInWithPasswordCredentials } from '@supabase/supabase-js';

import { SupabaseService } from '../../core/services/supabase.service';
import { ProfileService } from '../../core/services/profile.service';
import { UnconfirmedAccountDialogComponent } from './components/unconfirmed-account-dialog/unconfirmed-account-dialog.component';

@Component({
    selector: 'stbo-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        MatDialogModule,
        RouterModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly supabase = inject(SupabaseService);
    private readonly profileService = inject(ProfileService);
    private readonly dialog = inject(MatDialog);

    readonly loginForm = this.formBuilder.nonNullable.group({
        email: this.formBuilder.nonNullable.control('', {
            validators: [Validators.required, Validators.email],
        }),
        password: this.formBuilder.nonNullable.control('', {
            validators: [Validators.required],
        }),
    });

    readonly isLoading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid || this.isLoading()) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);
        this.isLoading.set(true);

        const { email, password } = this.loginForm.getRawValue();

        const credentials: SignInWithPasswordCredentials = {
            email,
            password,
        };

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword(
                credentials
            );

            if (error) {
                // Sprawdź czy błąd dotyczy nieaktywowanego konta
                const isEmailNotConfirmed = this.isEmailNotConfirmedError(error);

                if (isEmailNotConfirmed) {
                    // Otwórz dialog z informacją o niepotwierdzonym koncie
                    this.dialog.open(UnconfirmedAccountDialogComponent, {
                        data: { email },
                        width: '500px',
                        disableClose: false,
                    });
                    return;
                }

                // Inne błędy logowania
                this.errorMessage.set(error.message);
                return;
            }

            if (!data.session || !data.user) {
                this.errorMessage.set(
                    'Nie udało się zalogować. Spróbuj ponownie później.'
                );
                return;
            }

            this.profileService.reset();

            const redirectTarget = this.route.snapshot.queryParamMap.get('redirect');
            const targetUrl =
                redirectTarget && redirectTarget !== '/login'
                    ? redirectTarget
                    : '/management/dashboard';

            await this.router.navigateByUrl(targetUrl);
        } catch (error) {
            console.error('Login error', error);
            this.errorMessage.set(
                'Wystąpił błąd podczas logowania. Spróbuj ponownie.'
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Sprawdza czy błąd dotyczy nieaktywowanego konta (niepotwierdzony email).
     * Supabase zwraca błąd z kodem "email_not_confirmed" lub komunikatem "Email not confirmed".
     */
    private isEmailNotConfirmedError(error: AuthError): boolean {
        // Sprawdź różne możliwe struktury błędu
        const errorCode = error?.code || error?.status;
        const errorMessage = error?.message || '';

        return (
            errorCode === 'email_not_confirmed' ||
            errorMessage.toLowerCase().includes('email not confirmed')
        );
    }
}

