import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import type { RepertoireCreateCommand } from '../../../../../../packages/contracts/types';
import { RepertoiresApiService } from '../../../repertoire-edit/services/repertoires-api.service';

interface RepertoireCreateForm {
    name: FormControl<string>;
    description: FormControl<string | null>;
}

@Component({
    selector: 'stbo-repertoire-create-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    providers: [RepertoiresApiService],
    templateUrl: './repertoire-create-dialog.component.html',
    styleUrl: './repertoire-create-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireCreateDialogComponent {
    private readonly fb = inject(FormBuilder);
    private readonly dialogRef = inject(MatDialogRef<RepertoireCreateDialogComponent>);
    private readonly router = inject(Router);
    private readonly repertoiresApiService = inject(RepertoiresApiService);

    public readonly isLoading = signal<boolean>(false);
    public readonly apiError = signal<string | null>(null);

    public readonly form: FormGroup<RepertoireCreateForm> = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(160)]],
        description: this.fb.control<string | null>(null),
    });

    public get nameControl(): FormControl<string> {
        return this.form.controls.name;
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public async onSubmit(): Promise<void> {
        if (this.form.invalid || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);
        this.apiError.set(null);

        try {
            const formValue = this.form.getRawValue();
            const command: RepertoireCreateCommand = {
                name: formValue.name,
                description: formValue.description || null,
            };

            const result = await this.repertoiresApiService.createRepertoire(command);

            // Zamknij dialog i przekaż informację o sukcesie
            this.dialogRef.close({ success: true, repertoireId: result.id });

            // Nawiguj do widoku edycji
            await this.router.navigate(['/management/repertoires', result.id, 'edit']);
        } catch (error: unknown) {
            console.error('RepertoireCreateDialogComponent: create error', error);
            this.isLoading.set(false);

            // Obsługa błędów HTTP
            if (error && typeof error === 'object' && 'status' in error) {
                const httpError = error as { status: number; error?: { message?: string } };

                switch (httpError.status) {
                    case 409:
                        // Conflict - zduplikowana nazwa
                        this.apiError.set('Repertuar o tej nazwie już istnieje.');
                        break;
                    case 400:
                        // Bad Request - błąd walidacji
                        this.apiError.set('Nieprawidłowe dane. Sprawdź poprawność formularza.');
                        break;
                    case 401:
                        // Unauthorized - brak autoryzacji
                        this.apiError.set('Sesja wygasła. Zaloguj się ponownie.');
                        break;
                    case 403:
                        // Forbidden - brak uprawnień
                        this.apiError.set('Nie masz uprawnień do wykonania tej operacji.');
                        break;
                    case 500:
                    case 502:
                    case 503:
                        // Server errors
                        this.apiError.set('Problem z serwerem. Spróbuj ponownie za chwilę.');
                        break;
                    default:
                        // Inne błędy HTTP
                        this.apiError.set('Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie.');
                }
            } else if (error instanceof Error) {
                // Błąd JavaScript (np. błąd sieci)
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    this.apiError.set('Brak połączenia z serwerem. Sprawdź połączenie internetowe.');
                } else {
                    this.apiError.set('Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie.');
                }
            } else {
                // Nieznany błąd
                this.apiError.set('Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie.');
            }
        }
    }
}
