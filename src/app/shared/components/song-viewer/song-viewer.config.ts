/**
 * Konfiguracja dla komponentu SongViewer
 * Określa, które elementy UI mają być widoczne i jak mają być wyświetlane
 */
export interface SongViewerConfig {
    /**
     * Czy wyświetlać przycisk powrotu w toolbarze
     */
    showBackButton: boolean;

    /**
     * Link do przekierowania po kliknięciu przycisku powrotu
     * Używany tylko gdy showBackButton = true
     */
    backLink?: unknown[];

    /**
     * Gdzie wyświetlić tytuł piosenki
     * - true: w toolbarze (obok innych kontrolek)
     * - false: w głównym contencie (poniżej toolbara)
     */
    titleInToolbar: boolean;

    /**
     * Czy wyświetlać przełącznik widoczności akordów (Tekst/Akordy)
     */
    showChordsToggle: boolean;

    /**
     * Czy wyświetlać pływający przycisk FAB do udostępniania (kod QR)
     */
    showQrButton: boolean;

    /**
     * Czy wyświetlać nawigację między piosenkami (poprzednia/następna)
     */
    showNavigation: boolean;

    /**
     * Label dla przycisku powrotu (domyślnie: "Powrót")
     */
    backButtonAriaLabel?: string;
}

/**
 * Stan ładowania komponentu
 */
export type SongViewerStatus = 'loading' | 'loaded' | 'error';

/**
 * Obiekt błędu
 */
export interface SongViewerError {
    code: number;
    message: string;
}

