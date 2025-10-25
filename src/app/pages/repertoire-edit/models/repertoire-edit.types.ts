import type {
    RepertoireDto,
    RepertoireSongDto,
    SongSummaryDto,
} from '../../../../../packages/contracts/types';

/**
 * Główny model stanu widoku edycji repertuaru
 */
export interface RepertoireEditViewModel {
    repertoire: RepertoireDto | null;
    allSongs: SongSummaryDto[];
    isLoading: boolean;
    isUpdatingHeader: boolean;
    error: string | null;
    addingSongId: string | null;
    removingSongId: string | null;
}

/**
 * Model dla piosenki w repertuarze
 * Rozszerza RepertoireSongDto
 */
export type RepertoireSongViewModel = RepertoireSongDto;

/**
 * Model dla dostępnej piosenki (nie w repertuarze)
 * Rozszerza SongSummaryDto
 */
export type AvailableSongViewModel = SongSummaryDto;

