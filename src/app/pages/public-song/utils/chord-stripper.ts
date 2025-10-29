/**
 * Usuwa akordy w formacie ChordPro (np. [C], [G], [Am]) z treści piosenki.
 * 
 * @param content - Treść piosenki zawierająca akordy w formacie ChordPro
 * @returns Treść piosenki bez akordów
 * 
 * @example
 * ```typescript
 * const withChords = "Hello [C]world [G]today";
 * const stripped = stripChords(withChords);
 * // Wynik: "Hello world today"
 * ```
 */
export function stripChords(content: string): string {
    if (!content) {
        return '';
    }

    // Wyrażenie regularne dopasowujące akordy w nawiasach kwadratowych
    // Dopasowuje [dowolny_tekst], ale nie usuwa samych nawiasów w innych kontekstach
    return content.replace(/\[([^\]]+)\]/g, '');
}

