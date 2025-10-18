import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    WritableSignal,
    inject,
    signal,
} from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

import type { OrganizerRegisterCommand } from '../../../../../packages/contracts/types';

@Component({
    selector: 'stbo-register-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        RouterModule,
    ],
    templateUrl: './register-form.component.html',
    styleUrls: ['./register-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
    private readonly formBuilder = inject(FormBuilder);

    private readonly isLoadingState: WritableSignal<boolean> = signal(false);
    private readonly serverErrorState: WritableSignal<string | null> = signal(null);

    @Input({ required: true })
    public set isLoading(value: boolean) {
        this.isLoadingState.set(value);
    }

    public get isLoading(): boolean {
        return this.isLoadingState();
    }

    @Input({ required: true })
    public set serverError(value: string | null) {
        this.serverErrorState.set(value);
    }

    public get serverError(): string | null {
        return this.serverErrorState();
    }

    @Output()
    public readonly formSubmit = new EventEmitter<OrganizerRegisterCommand>();

    protected readonly registerForm: FormGroup<RegisterFormViewModel> =
        this.formBuilder.nonNullable.group({
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
        });

    constructor() {
        this.registerForm.addValidators(this.createPasswordsMatchValidator());
    }

    protected readonly passwordsMismatch: WritableSignal<boolean> = signal(false);

    protected onSubmit(): void {
        if (this.registerForm.invalid || this.isLoading) {
            this.registerForm.markAllAsTouched();
            this.updatePasswordsMismatchStatus();
            return;
        }

        this.updatePasswordsMismatchStatus();

        const { email, displayName, password } = this.registerForm.getRawValue();

        this.formSubmit.emit({
            email,
            displayName,
            password,
        });
    }

    protected onPasswordInput(): void {
        if (this.passwordsMismatch()) {
            this.updatePasswordsMismatchStatus();
        }
    }

    private createPasswordsMatchValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const group = control as FormGroup<RegisterFormViewModel>;
            const password = group.controls.password.value;
            const confirmPassword = group.controls.confirmPassword.value;

            return password === confirmPassword
                ? null
                : { passwordsMismatch: true };
        };
    }

    private updatePasswordsMismatchStatus(): void {
        this.passwordsMismatch.set(
            this.registerForm.hasError('passwordsMismatch') &&
                this.registerForm.controls.confirmPassword.touched
        );
    }
}

type RegisterFormViewModel = {
    email: FormControl<string>;
    displayName: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
};


