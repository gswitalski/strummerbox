import type { SongNavigation } from '../../shared/components/song-viewer/song-viewer.types';

/**
 * ViewModel używany przez BiesiadaSongView do przechowywania stanu
 */
export interface BiesiadaSongViewModel {
    title: string;
    content: string;
    navigation: SongNavigation;
    share: {
        publicUrl: string;
        qrPayload: string;
    };
}

/**
 * Stan komponentu BiesiadaSongView
 */
export interface BiesiadaSongState {
    data: BiesiadaSongViewModel | null;
    isLoading: boolean;
    error: Error | null;
}

