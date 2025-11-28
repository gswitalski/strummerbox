import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import type {
    SongDto,
    SongPatchCommand,
} from '../../../../../packages/contracts/types';
import { SongsApiService } from '../../song-create/services/songs-api.service';
import { ChordConverterService } from '../../../core/services/chord-converter.service';
import {
    SongEditFormComponent,
    SongEditFormData,
    SongEditFormInitialData,
} from '../../../shared/components/song-edit-form/song-edit-form.component';

/**
 * Typy błędów możliwych do wystąpienia w komponencie.
 */
type SongEditError = 'load_failed' | 'not_found' | 'save_failed' | 'duplicate' | null;

/**
 * Komponent strony edycji piosenki.
 * 
 * Odpowiedzialności:
 * - Pobieranie danych piosenki z API
 * - Konwersja treści z ChordPro na format "akordy nad tekstem" przy ładowaniu
 * - Konwersja treści z formatu "akordy nad tekstem" na ChordPro przy zapisie
 * - Obsługa stanów ładowania, zapisu i błędów
 * - Nawigacja po zakończeniu operacji
 */
@Component({
    selector: 'stbo-song-edit-page',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        SongEditFormComponent,
    ],
    templateUrl: './song-edit-page.component.html',
    styleUrl: './song-edit-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongEditPageComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly songsApiService = inject(SongsApiService);
    private readonly chordConverter = inject(ChordConverterService);
    private readonly snackBar = inject(MatSnackBar);

    @ViewChild(SongEditFormComponent)
    private songEditFormComponent?: SongEditFormComponent;

    private songId: string | null = null;

    // Stan komponentu
    private readonly initialDataState: WritableSignal<SongEditFormInitialData | null> = signal(null);
    private readonly isLoadingState: WritableSignal<boolean> = signal(true);
    private readonly isSavingState: WritableSignal<boolean> = signal(false);
    private readonly errorState: WritableSignal<SongEditError> = signal(null);
    private readonly isFormValidState: WritableSignal<boolean> = signal(false);

    // Publiczne sygnały dla template
    public readonly initialData: Signal<SongEditFormInitialData | null> = computed(() => this.initialDataState());
    public readonly isLoading: Signal<boolean> = computed(() => this.isLoadingState());
    public readonly isSaving: Signal<boolean> = computed(() => this.isSavingState());
    public readonly error: Signal<SongEditError> = computed(() => this.errorState());
    public readonly isFormValid: Signal<boolean> = computed(() => this.isFormValidState());

    public ngOnInit(): void {
        this.songId = this.route.snapshot.paramMap.get('id');

        if (!this.songId) {
            this.errorState.set('not_found');
            this.isLoadingState.set(false);
            return;
        }

        void this.loadSong(this.songId);
    }

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
     * Ładuje piosenkę z API i konwertuje treść na format "akordy nad tekstem".
     */
    private async loadSong(id: string): Promise<void> {
        this.isLoadingState.set(true);
        this.errorState.set(null);

        try {
            const song: SongDto = await this.songsApiService.getSong(id);

            // Konwertuj treść z ChordPro na format "akordy nad tekstem"
            const overTextContent = this.chordConverter.convertToOverText(song.content);

            this.initialDataState.set({
                title: song.title,
                content: overTextContent,
            });

            this.isLoadingState.set(false);
        } catch (error) {
            console.error('SongEditPageComponent: load error', error);

            if (this.isNotFoundError(error)) {
                this.errorState.set('not_found');
            } else {
                this.errorState.set('load_failed');
            }

            this.isLoadingState.set(false);
        }
    }

    /**
     * Zapisuje piosenkę do API, konwertując treść na ChordPro.
     */
    private async saveSong(formData: SongEditFormData): Promise<void> {
        if (this.isSavingState() || !this.songId) {
            return;
        }

        this.isSavingState.set(true);
        this.errorState.set(null);

        // Konwertuj treść z formatu "akordy nad tekstem" na ChordPro
        const chordProContent = this.chordConverter.convertFromChordsOverText(formData.content);

        const command: SongPatchCommand = {
            title: formData.title.trim(),
            content: chordProContent,
        };

        try {
            await this.songsApiService.updateSong(this.songId, command);
            this.snackBar.open('Piosenka została zaktualizowana.', undefined, {
                duration: 3000,
            });
            await this.router.navigate(['/management/songs']);
        } catch (error) {
            console.error('SongEditPageComponent: save error', error);

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
                'Nie udało się zaktualizować piosenki. Spróbuj ponownie później.',
                undefined,
                { duration: 4000 }
            );
        } finally {
            this.isSavingState.set(false);
        }
    }

    private isNotFoundError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const status = (error as { status?: number }).status;
        if (status === 404) {
            return true;
        }

        const responseError = (error as { error?: { code?: string } }).error;
        return responseError?.code === 'resource_not_found';
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

