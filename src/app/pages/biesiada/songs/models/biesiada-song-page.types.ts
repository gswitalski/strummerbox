import { BiesiadaRepertoireSongDetailDto } from '../../../../../../packages/contracts/types';

/**
 * Stan widoku piosenki w trybie Biesiada
 */
export type BiesiadaSongState = 'loading' | 'loaded' | 'error';

/**
 * ViewModel dla widoku piosenki w trybie Biesiada
 */
export interface BiesiadaSongPageViewModel {
    state: BiesiadaSongState;
    data: BiesiadaRepertoireSongDetailDto | null;
    error: string | null;
}

/**
 * Dane błędu
 */
export interface BiesiadaSongError {
    code: number;
    message: string;
}



