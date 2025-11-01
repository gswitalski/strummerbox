import { BiesiadaRepertoireSummaryDto } from '../../../../../../packages/contracts/types';

/**
 * ViewModel for Biesiada Repertoire List page.
 * Manages loading state, data, and error handling.
 */
export interface BiesiadaRepertoireListViewModel {
    repertoires: BiesiadaRepertoireSummaryDto[];
    isLoading: boolean;
    error: string | null;
}

