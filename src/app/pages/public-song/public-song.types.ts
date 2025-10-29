/**
 * Typy dla widoku Public Song View
 */

/**
 * Stan widoku publicznej piosenki (discriminated union)
 */
export type PublicSongState =
    | { status: 'loading' }
    | { status: 'loaded'; song: { title: string; content: string } }
    | { status: 'error'; error: { code: number; message: string } };

