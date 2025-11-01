import type { PublicRepertoireDto } from '../../../../packages/contracts/types';

/**
 * Typy dla widoku Public Repertoire View
 */

/**
 * Stan widoku publicznego repertuaru (discriminated union)
 */
export type PublicRepertoireState =
    | { status: 'loading' }
    | { status: 'loaded'; repertoire: PublicRepertoireDto }
    | { status: 'error'; error: { code: number; message: string } };

