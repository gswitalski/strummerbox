import type { SongCreateFormViewModel } from './song-create-form-view.model';

export type SongCreateError = 'duplicate' | 'save_failed';

export interface SongCreateState {
    formValue: SongCreateFormViewModel;
    isSaving: boolean;
    error: SongCreateError | null;
    layoutMode: 'split' | 'tabs';
    isFormValid: boolean;
}

