import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import type {
    SongDto,
    SongPatchCommand,
} from '../../../../../packages/contracts/types';
import { SongFormComponent } from '../../song-create/components/song-form/song-form.component';
import { ChordProPreviewComponent } from '../../song-create/components/chord-pro-preview/chord-pro-preview.component';
import { SongsApiService } from '../../song-create/services/songs-api.service';

interface SongEditFormViewModel {
    title: string;
    content: string;
}

type SongEditError = 'load_failed' | 'not_found' | 'save_failed' | 'duplicate' | null;

interface SongEditState {
    formValue: SongEditFormViewModel;
    isLoading: boolean;
    isSaving: boolean;
    error: SongEditError;
    layoutMode: 'split' | 'tabs';
    isFormValid: boolean;
}

const LARGE_SCREEN_QUERY = '(min-width: 1024px)' as const;

@Component({
    selector: 'stbo-song-edit-page',
    standalone: true,
    imports: [
        LayoutModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatSnackBarModule,
        NgClass,
        SongFormComponent,
        ChordProPreviewComponent,
    ],
    templateUrl: './song-edit-page.component.html',
    styleUrl: './song-edit-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongEditPageComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly destroyRef = inject(DestroyRef);
    private readonly songsApiService = inject(SongsApiService);
    private readonly snackBar = inject(MatSnackBar);

    @ViewChild(SongFormComponent)
    private songFormComponent?: SongFormComponent;

    private songId: string | null = null;

    private readonly formValueState: WritableSignal<SongEditFormViewModel> = signal({
        title: '',
        content: '',
    });
    private readonly isLoadingState: WritableSignal<boolean> = signal(true);
    private readonly isSavingState: WritableSignal<boolean> = signal(false);
    private readonly errorState: WritableSignal<SongEditError> = signal(null);
    private readonly layoutModeState: WritableSignal<'split' | 'tabs'> = signal('split');
    private readonly isFormValidState: WritableSignal<boolean> = signal(false);

    public readonly viewState: Signal<SongEditState> = computed(() => ({
        formValue: this.formValueState(),
        isLoading: this.isLoadingState(),
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

    public ngOnInit(): void {
        this.songId = this.route.snapshot.paramMap.get('id');

        if (!this.songId) {
            this.errorState.set('not_found');
            this.isLoadingState.set(false);
            return;
        }

        void this.loadSong(this.songId);
    }

    public onFormValueChange(value: SongEditFormViewModel): void {
        this.formValueState.set(value);

        if (this.errorState() === 'duplicate') {
            this.errorState.set(null);
            this.songFormComponent?.clearUniqueError();
        }
    }

    public onFormSubmit(value: SongEditFormViewModel): void {
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

    private async loadSong(id: string): Promise<void> {
        this.isLoadingState.set(true);
        this.errorState.set(null);

        try {
            const song: SongDto = await this.songsApiService.getSong(id);

            this.formValueState.set({
                title: song.title,
                content: song.content,
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

    private async saveSong(formValue: SongEditFormViewModel): Promise<void> {
        if (this.isSavingState() || !this.songId) {
            return;
        }

        this.isSavingState.set(true);
        this.errorState.set(null);

        const command: SongPatchCommand = {
            title: formValue.title.trim(),
            content: formValue.content,
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

