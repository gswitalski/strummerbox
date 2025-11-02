import type { 
    BiesiadaRepertoireSongEntryDto,
    BiesiadaRepertoireShareMetaDto 
} from '../../../../../../../packages/contracts/types';

export interface BiesiadaRepertoireSongListViewModel {
    repertoireId: string | null;
    repertoireName: string | null;
    songs: BiesiadaRepertoireSongEntryDto[];
    share: BiesiadaRepertoireShareMetaDto | null;
    isLoading: boolean;
    error: string | null;
}

