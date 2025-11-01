import type { BiesiadaRepertoireSongEntryDto } from '../../../../../../../packages/contracts/types';

export interface BiesiadaRepertoireSongListViewModel {
    repertoireId: string | null;
    repertoireName: string | null;
    songs: BiesiadaRepertoireSongEntryDto[];
    isLoading: boolean;
    error: string | null;
}

