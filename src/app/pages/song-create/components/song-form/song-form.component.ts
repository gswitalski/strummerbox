import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    EventEmitter,
    Input,
    Output,
    inject,
} from '@angular/core';
import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { SongCreateFormViewModel } from '../../models/song-create-form-view.model';

@Component({
    selector: 'stbo-song-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
    ],
    templateUrl: './song-form.component.html',
    styleUrl: './song-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongFormComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    public readonly form = this.fb.group({
        title: this.fb.control('', {
            validators: [Validators.required, Validators.maxLength(180)],
        }),
        content: this.fb.control('', {
            validators: [Validators.required],
        }),
    });

    private isSavingState = false;

    @Input()
    public set initialState(value: Partial<SongCreateFormViewModel> | null) {
        if (!value) {
            return;
        }

        this.form.patchValue(value, { emitEvent: false });
        this.emitCurrentState();
    }

    @Input()
    public set isSaving(value: boolean) {
        this.isSavingState = value;
        if (value) {
            this.form.disable({ emitEvent: false });
            return;
        }

        this.form.enable({ emitEvent: false });
    }
    public get isSaving(): boolean {
        return this.isSavingState;
    }

    @Output()
    public readonly formValueChange = new EventEmitter<SongCreateFormViewModel>();

    @Output()
    public readonly formStatusChange = new EventEmitter<boolean>();

    @Output()
    public readonly formSubmit = new EventEmitter<SongCreateFormViewModel>();

    constructor() {
        this.form.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.emitCurrentState();
            });

        this.form.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.formStatusChange.emit(this.form.valid);
            });
    }

    public submitForm(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.formStatusChange.emit(this.form.valid);
            return;
        }

        this.formSubmit.emit(this.form.getRawValue());
    }

    public markTitleAsUniqueError(): void {
        this.form.controls.title.setErrors({
            ...this.form.controls.title.errors,
            unique: true,
        });
    }

    public clearUniqueError(): void {
        if (!this.form.controls.title.hasError('unique')) {
            return;
        }

        const errors = { ...this.form.controls.title.errors };
        delete errors['unique'];
        this.form.controls.title.setErrors(
            Object.keys(errors).length > 0 ? errors : null
        );
    }

    private emitCurrentState(): void {
        const value = this.form.getRawValue();
        this.formValueChange.emit(value);
        this.formStatusChange.emit(this.form.valid);
    }
}

