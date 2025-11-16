import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

import type { OrganizerRegisterCommand } from '../../../../packages/contracts/types';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'stbo-register-page',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        RouterModule,
    ],
    templateUrl: './register-page.component.html',
    styleUrls: ['./register-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    readonly isLoading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly passwordsMismatch = signal(false);

    private readonly passwordsMatchValidator: ValidatorFn = (
        control: AbstractControl
    ): ValidationErrors | null => {
        const group = control as RegisterFormGroup;
        const password = group.controls.password.value;
        const confirmPassword = group.controls.confirmPassword.value;

        return password === confirmPassword
            ? null
            : { passwordsMismatch: true };
    };

    readonly registerForm: RegisterFormGroup =
        this.formBuilder.nonNullable.group(
            {
                email: this.formBuilder.nonNullable.control('', {
                    validators: [Validators.required, Validators.email],
                }),
                displayName: this.formBuilder.nonNullable.control('', {
                    validators: [
                        Validators.required,
                        Validators.minLength(1),
                        Validators.maxLength(120),
                    ],
                }),
                password: this.formBuilder.nonNullable.control('', {
                    validators: [
                        Validators.required,
                        Validators.minLength(8),
                        Validators.maxLength(256),
                    ],
                }),
                confirmPassword: this.formBuilder.nonNullable.control('', {
                    validators: [Validators.required],
                }),
            },
            {
                validators: this.passwordsMatchValidator,
            }
        );

    onSubmit(): void {
        if (this.registerForm.invalid || this.isLoading()) {
            this.registerForm.markAllAsTouched();
            this.updatePasswordsMismatchStatus();
            return;
        }

        this.updatePasswordsMismatchStatus();

        const { email, displayName, password } =
            this.registerForm.getRawValue();

        void this.handleRegister({
            email,
            displayName,
            password,
        });
    }

    onPasswordInput(): void {
        this.updatePasswordsMismatchStatus();
    }

    private async handleRegister(
        command: OrganizerRegisterCommand
    ): Promise<void> {
        if (this.isLoading()) {
            return;
        }

        this.errorMessage.set(null);
        this.isLoading.set(true);

        try {
            await this.authService.register(command);
            await this.router.navigate(['/auth/awaiting-confirmation'], {
                queryParams: { email: command.email },
            });
        } catch (error) {
            console.error('RegisterPageComponent: register error', error);
            this.errorMessage.set(this.mapError(error));
        } finally {
            this.isLoading.set(false);
        }
    }

    private updatePasswordsMismatchStatus(): void {
        this.registerForm.updateValueAndValidity({ onlySelf: true });

        this.passwordsMismatch.set(
            this.registerForm.hasError('passwordsMismatch') &&
                this.registerForm.controls.confirmPassword.touched
        );
    }

    private mapError(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
    }
}

type RegisterFormGroup = FormGroup<RegisterFormControls>;

interface RegisterFormControls {
    email: FormControl<string>;
    displayName: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
}


