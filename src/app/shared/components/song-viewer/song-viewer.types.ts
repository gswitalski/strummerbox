/**
 * Typy dla komponentu SongViewer - reużywalnego komponentu prezentacyjnego
 * do wyświetlania treści piosenki z nawigacją
 */

/**
 * Opisuje pojedynczy link nawigacyjny
 */
export interface SongNavLink {
    title: string;
    link: unknown[]; // Router link array
}

/**
 * Definiuje kompletny zestaw linków nawigacyjnych dla komponentu
 */
export interface SongNavigation {
    previous: SongNavLink | null;
    next: SongNavLink | null;
    back: unknown[] | null; // Router link array for the back button
}

