import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Signal,
    ViewChild,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import type {
    SongCreateError,
    SongCreateState,
} from '../models/song-create-state.model';
import type { SongCreateFormViewModel } from '../models/song-create-form-view.model';
import { SongFormComponent } from '../components/song-form/song-form.component';
import { ChordProPreviewComponent } from '../components/chord-pro-preview/chord-pro-preview.component';
import { ImportFromTextDialogComponent } from '../components/import-from-text-dialog/import-from-text-dialog.component';
import type { SongCreateCommand } from '../../../../../packages/contracts/types';
import { SongsApiService } from '../services/songs-api.service';

const INITIAL_FORM_VALUE: SongCreateFormViewModel = {
    title: '',
    content: '',
};

const LARGE_SCREEN_QUERY = '(min-width: 1024px)' as const;

@Component({
    selector: 'stbo-song-create-page',
    standalone: true,
    imports: [
        LayoutModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatTabsModule,
        MatSnackBarModule,
        MatDialogModule,
        NgClass,
        SongFormComponent,
        ChordProPreviewComponent,
    ],
    templateUrl: './song-create-page.component.html',
    styleUrl: './song-create-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongCreatePageComponent {
    private readonly router = inject(Router);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly destroyRef = inject(DestroyRef);
    private readonly songsApiService = inject(SongsApiService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);

    @ViewChild(SongFormComponent)
    private songFormComponent?: SongFormComponent;

    private readonly formValueState: WritableSignal<SongCreateFormViewModel> = signal(
        { ...INITIAL_FORM_VALUE }
    );
    private readonly isSavingState: WritableSignal<boolean> = signal(false);
    private readonly errorState: WritableSignal<SongCreateError | null> = signal(null);
    private readonly layoutModeState: WritableSignal<'split' | 'tabs'> = signal('split');
    private readonly isFormValidState: WritableSignal<boolean> = signal(false);

    public readonly viewState: Signal<SongCreateState> = computed(() => ({
        formValue: this.formValueState(),
        isSaving: this.isSavingState(),
        error: this.errorState(),
        layoutMode: this.layoutModeState(),
        isFormValid: this.isFormValidState(),
    }));

    public readonly currentContent: Signal<string> = computed(
        () => this.viewState().formValue.content
    );

    constructor() {
        this.observeLayout();
    }

    public onFormValueChange(value: SongCreateFormViewModel): void {
        this.formValueState.set(value);

        if (this.errorState() === 'duplicate') {
            this.errorState.set(null);
            this.songFormComponent?.clearUniqueError();
        }
    }

    public onFormSubmit(value: SongCreateFormViewModel): void {
        this.formValueState.set(value);
        void this.saveSong(value);
    }

    public async onCancel(): Promise<void> {
        await this.router.navigate(['/management/songs']);
    }

    public onFormStatusChange(isValid: boolean): void {
        this.isFormValidState.set(isValid);
    }

    public onSubmit(): void {
        this.songFormComponent?.submitForm();
    }

    public onImportFromText(): void {
        const dialogRef = this.dialog.open(ImportFromTextDialogComponent, {
            width: '700px',
            maxWidth: '90vw',
            maxHeight: '90vh',
        });

        dialogRef.afterClosed().subscribe((convertedText: string | undefined) => {
            if (!convertedText) {
                return;
            }

            this.appendContentToForm(convertedText);
        });
    }

    private appendContentToForm(newContent: string): void {
        const currentValue = this.formValueState();
        const currentContent = currentValue.content;

        // Jeśli jest już jakaś treść, dodaj nową linię przed nową treścią
        const updatedContent = currentContent
            ? `${currentContent}\n${newContent}`
            : newContent;

        this.formValueState.update(value => ({
            ...value,
            content: updatedContent,
        }));
    }

    private async saveSong(formValue: SongCreateFormViewModel): Promise<void> {
        if (this.isSavingState()) {
            return;
        }

        this.isSavingState.set(true);
        this.errorState.set(null);

        const command: SongCreateCommand = {
            title: formValue.title.trim(),
            content: formValue.content,
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
                this.songFormComponent?.markTitleAsUniqueError();
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

    private observeLayout(): void {
        this.breakpointObserver
            .observe(LARGE_SCREEN_QUERY)
            .pipe(
                map((result) => (result.matches ? 'split' : 'tabs')),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((mode) => {
                this.layoutModeState.set(mode);
            });
    }
}

