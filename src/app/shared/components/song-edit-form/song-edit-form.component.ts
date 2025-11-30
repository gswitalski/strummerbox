import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    EventEmitter,
    Output,
    computed,
    effect,
    inject,
    input,
    signal,
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
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { SongEditorLayoutComponent } from '../song-editor-layout/song-editor-layout.component';
import { SongEditorPreviewComponent } from '../song-editor-preview/song-editor-preview.component';
import {
    SongEditPreviewMode,
    SONG_EDITOR_PREVIEW_MODE_STORAGE_KEY,
} from '../song-editor-preview/song-editor-preview.types';
import { ChordConverterService } from '../../../core/services/chord-converter.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';

/**
 * Dane początkowe dla formularza edycji piosenki.
 * content jest w formacie "akordy nad tekstem".
 */
export interface SongEditFormInitialData {
    title: string;
    content: string;
}

/**
 * Dane emitowane przy zapisie formularza.
 * content jest w formacie "akordy nad tekstem".
 */
export interface SongEditFormData {
    title: string;
    content: string;
}

/**
 * Komponent prezentacyjny zawierający formularz do edycji piosenki.
 * 
 * Funkcjonalność:
 * - Pole tytułu z walidacją (required, maxLength)
 * - Textarea dla treści w formacie "akordy nad tekstem"
 * - Podgląd na żywo treści w formacie ChordPro
 * - Responsywny układ (side-by-side na dużych ekranach, zakładki na mobilnych)
 * 
 * @example
 * ```html
 * <stbo-song-edit-form
 *   [initialData]="{ title: 'Tytuł', content: 'C\nTekst' }"
 *   [isSaving]="false"
 *   (saveSong)="onSave($event)"
 * ></stbo-song-edit-form>
 * ```
 */
@Component({
    selector: 'stbo-song-edit-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        SongEditorLayoutComponent,
        SongEditorPreviewComponent,
    ],
    templateUrl: './song-edit-form.component.html',
    styleUrl: './song-edit-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongEditFormComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly chordConverter = inject(ChordConverterService);
    private readonly localStorage = inject(LocalStorageService);

    /**
     * Dane początkowe do wypełnienia formularza.
     * content jest w formacie "akordy nad tekstem".
     */
    public readonly initialData = input<SongEditFormInitialData | null>(null);

    /**
     * Flaga informująca o trwającym procesie zapisu.
     */
    public readonly isSaving = input<boolean>(false);

    /**
     * Zdarzenie emitowane przy próbie zapisu formularza.
     * Emituje dane tylko gdy formularz jest prawidłowy.
     */
    @Output()
    public readonly saveSong = new EventEmitter<SongEditFormData>();

    /**
     * Zdarzenie emitowane przy zmianie statusu walidacji formularza.
     */
    @Output()
    public readonly formValidityChange = new EventEmitter<boolean>();

    /**
     * Formularz reaktywny z polami title i content.
     */
    public readonly form = this.fb.group({
        title: this.fb.control('', {
            validators: [Validators.required, Validators.maxLength(180)],
        }),
        content: this.fb.control('', {
            validators: [Validators.required],
        }),
    });

    /**
     * Treść do podglądu w formacie ChordPro.
     * Aktualizowana z debounce przy każdej zmianie w edytorze.
     */
    public readonly previewContent = signal<string>('');

    /**
     * Tryb podglądu: 'chordpro' lub 'biesiada'.
     * Wartość początkowa odczytywana z localStorage, domyślnie 'chordpro'.
     */
    public readonly previewMode = signal<SongEditPreviewMode>(this.getInitialPreviewMode());

    /**
     * Computed signal informujący czy formularz jest prawidłowy.
     */
    public readonly isFormValid = computed(() => {
        // Wymuszamy przeliczenie przy każdej zmianie formularza
        return this.form.valid && !this.form.pending;
    });

    constructor() {
        // Obserwuj zmiany initialData i aktualizuj formularz
        effect(() => {
            const data = this.initialData();
            if (data) {
                this.form.patchValue(data, { emitEvent: false });
                this.updatePreview(data.content);
                this.formValidityChange.emit(this.form.valid);
            }
        });

        // Obserwuj isSaving i blokuj/odblokuj formularz
        effect(() => {
            if (this.isSaving()) {
                this.form.disable({ emitEvent: false });
            } else {
                this.form.enable({ emitEvent: false });
            }
        });

        // Zapisuj zmiany trybu podglądu w localStorage
        effect(() => {
            const mode = this.previewMode();
            this.localStorage.setItem(SONG_EDITOR_PREVIEW_MODE_STORAGE_KEY, mode);
        });

        // Subskrybuj zmiany w polu content z debounce dla podglądu
        this.form.controls.content.valueChanges
            .pipe(
                debounceTime(150),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((value) => {
                this.updatePreview(value);
            });

        // Subskrybuj zmiany statusu formularza
        this.form.statusChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.formValidityChange.emit(this.form.valid && !this.form.pending);
            });

        // Emituj początkowy status
        this.formValidityChange.emit(this.form.valid);
    }

    /**
     * Próbuje zatwierdzić formularz.
     * Jeśli formularz jest prawidłowy, emituje dane przez saveSong.
     */
    public submitForm(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.formValidityChange.emit(false);
            return;
        }

        this.saveSong.emit(this.form.getRawValue());
    }

    /**
     * Programowo ustawia błąd unikalności na polu tytułu.
     * Używane gdy API zwróci błąd 409 (konflikt).
     */
    public markTitleAsUniqueError(): void {
        this.form.controls.title.setErrors({
            ...this.form.controls.title.errors,
            unique: true,
        });
    }

    /**
     * Usuwa błąd unikalności z pola tytułu.
     */
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

    /**
     * Aktualizuje podgląd konwertując treść z formatu "akordy nad tekstem" do ChordPro.
     */
    private updatePreview(overTextContent: string): void {
        const chordProContent = this.chordConverter.convertFromChordsOverText(overTextContent);
        this.previewContent.set(chordProContent);
    }

    /**
     * Obsługuje zmianę trybu podglądu.
     */
    public onPreviewModeChange(mode: SongEditPreviewMode): void {
        this.previewMode.set(mode);
    }

    /**
     * Pobiera początkowy tryb podglądu z localStorage.
     * Zwraca 'chordpro' jeśli brak zapisanej wartości lub wartość jest nieprawidłowa.
     */
    private getInitialPreviewMode(): SongEditPreviewMode {
        const stored = this.localStorage.getItem(SONG_EDITOR_PREVIEW_MODE_STORAGE_KEY);
        if (stored === 'chordpro' || stored === 'biesiada') {
            return stored;
        }
        return 'chordpro';
    }
}

