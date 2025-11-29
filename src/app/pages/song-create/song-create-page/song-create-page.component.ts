import {
    ChangeDetectionStrategy,
    Component,
    Signal,
    ViewChild,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import type { SongCreateCommand } from '../../../../../packages/contracts/types';
import { SongsApiService } from '../services/songs-api.service';
import { ChordConverterService } from '../../../core/services/chord-converter.service';
import {
    SongEditFormComponent,
    SongEditFormData,
} from '../../../shared/components/song-edit-form/song-edit-form.component';

/**
 * Typy błędów możliwych do wystąpienia w komponencie.
 */
type SongCreateError = 'save_failed' | 'duplicate' | null;

/**
 * Komponent strony tworzenia nowej piosenki.
 * 
 * Odpowiedzialności:
 * - Konwersja treści z formatu "akordy nad tekstem" na ChordPro przy zapisie
 * - Wysyłanie nowej piosenki do API
 * - Obsługa stanów zapisu i błędów
 * - Nawigacja po zakończeniu operacji
 */
@Component({
    selector: 'stbo-song-create-page',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatSnackBarModule,
        SongEditFormComponent,
    ],
    templateUrl: './song-create-page.component.html',
    styleUrl: './song-create-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongCreatePageComponent {
    private readonly router = inject(Router);
    private readonly songsApiService = inject(SongsApiService);
    private readonly chordConverter = inject(ChordConverterService);
    private readonly snackBar = inject(MatSnackBar);

    @ViewChild(SongEditFormComponent)
    private songEditFormComponent?: SongEditFormComponent;

    // Stan komponentu
    private readonly isSavingState: WritableSignal<boolean> = signal(false);
    private readonly errorState: WritableSignal<SongCreateError> = signal(null);
    private readonly isFormValidState: WritableSignal<boolean> = signal(false);

    // Publiczne sygnały dla template
    public readonly isSaving: Signal<boolean> = computed(() => this.isSavingState());
    public readonly error: Signal<SongCreateError> = computed(() => this.errorState());
    public readonly isFormValid: Signal<boolean> = computed(() => this.isFormValidState());

    /**
     * Obsługuje zdarzenie zapisu z formularza.
     * Konwertuje treść na ChordPro i wysyła do API.
     */
    public onSaveSong(formData: SongEditFormData): void {
        void this.saveSong(formData);
    }

    /**
     * Obsługuje zmianę statusu walidacji formularza.
     */
    public onFormValidityChange(isValid: boolean): void {
        this.isFormValidState.set(isValid);

        // Jeśli formularz stał się valid i był błąd duplicate, wyczyść go
        if (isValid && this.errorState() === 'duplicate') {
            this.errorState.set(null);
        }
    }

    /**
     * Nawiguje z powrotem do listy piosenek.
     */
    public async onCancel(): Promise<void> {
        await this.router.navigate(['/management/songs']);
    }

    /**
     * Wywołuje submit na formularzu.
     */
    public onSubmit(): void {
        this.songEditFormComponent?.submitForm();
    }

    /**
     * Zapisuje nową piosenkę do API, konwertując treść na ChordPro.
     */
    private async saveSong(formData: SongEditFormData): Promise<void> {
        if (this.isSavingState()) {
            return;
        }

        this.isSavingState.set(true);
        this.errorState.set(null);

        // Konwertuj treść z formatu "akordy nad tekstem" na ChordPro
        const chordProContent = this.chordConverter.convertFromChordsOverText(formData.content);

        const command: SongCreateCommand = {
            title: formData.title.trim(),
            content: chordProContent,
            published: false,
        };

        try {
            await this.songsApiService.createSong(command);
            this.snackBar.open('Piosenka została zapisana.', undefined, {
                duration: 3000,
            });
            await this.router.navigate(['/management/songs']);
        } catch (error) {
            console.error('SongCreatePageComponent: save error', error);

            if (this.isConflictError(error)) {
                this.songEditFormComponent?.markTitleAsUniqueError();
                this.snackBar.open(
                    'Piosenka o takim tytule już istnieje. Zmień tytuł i spróbuj ponownie.',
                    undefined,
                    { duration: 4000 }
                );
                this.errorState.set('duplicate');
                return;
            }

            this.errorState.set('save_failed');
            this.snackBar.open(
                'Nie udało się zapisać piosenki. Spróbuj ponownie później.',
                undefined,
                { duration: 4000 }
            );
        } finally {
            this.isSavingState.set(false);
        }
    }

    private isConflictError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const status = (error as { status?: number }).status;
        if (status === 409) {
            return true;
        }

        const responseError = (error as { error?: { code?: string } }).error;
        return responseError?.code === 'conflict';
    }
}

