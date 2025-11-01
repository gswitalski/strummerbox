import type { PublicRepertoireSongDto } from '../../../../packages/contracts/types';

/**
 * Typy dla widoku Public Repertoire Song View
 */

/**
 * Stan widoku publicznej piosenki w repertuarze (discriminated union)
 */
export type PublicRepertoireSongState =
    | { status: 'loading' }
    | { status: 'loaded'; song: PublicRepertoireSongDto }
    | { status: 'error'; error: { code: number; message: string } };

