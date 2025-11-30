/**
 * Typy podglądu dostępne w edytorze piosenek.
 * 
 * - 'chordpro' - Podgląd surowego tekstu w formacie ChordPro
 * - 'biesiada' - Renderowany podgląd w stylu "Biesiada" (akordy nad tekstem)
 */
export type SongEditPreviewMode = 'chordpro' | 'biesiada';

/**
 * Klucz localStorage dla preferencji trybu podglądu.
 */
export const SONG_EDITOR_PREVIEW_MODE_STORAGE_KEY = 'song-editor-preview-mode';

