/**
 * Reprezentuje możliwe do wyboru wielkości czcionki.
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Definiuje strukturę opcji wielkości czcionki.
 */
export interface FontSizeOption {
    key: FontSize;
    value: string; // Wartość CSS, np. '1rem'
    label: string; // Etykieta dla przycisku, np. 'A'
}

/**
 * Mapa konfiguracji dla dostępnych wielkości czcionek.
 */
export const FONT_SIZE_OPTIONS: Record<FontSize, FontSizeOption> = {
    small: { key: 'small', value: '1rem', label: 'A' },
    medium: { key: 'medium', value: '1.3rem', label: 'A' },
    large: { key: 'large', value: '1.6rem', label: 'A' },
};

