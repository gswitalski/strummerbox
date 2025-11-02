/**
 * Usuwa akordy w formacie ChordPro (np. [C], [G], [Am]) z treści piosenki.
 * Usuwa również puste linie, które powstają po usunięciu akordów.
 * 
 * @param content - Treść piosenki zawierająca akordy w formacie ChordPro
 * @returns Treść piosenki bez akordów
 * 
 * @example
 * ```typescript
 * const withChords = "Hello [C]world [G]today\n[D]\nNext line";
 * const stripped = stripChords(withChords);
 * // Wynik: "Hello world today\nNext line"
 * ```
 */
export function stripChords(content: string): string {
    if (!content) {
        return '';
    }

    // Przetwarzamy treść linia po linii
    const lines = content.split(/\r?\n/);
    const processedLines: string[] = [];

    for (const line of lines) {
        // Usuń akordy z linii
        const lineWithoutChords = line.replace(/\[([^\]]+)\]/g, '');
        
        // Sprawdź, czy linia po usunięciu akordów zawiera jakiś tekst
        // (nie jest pusta ani nie składa się tylko z białych znaków)
        const hasText = lineWithoutChords.trim().length > 0;
        
        // Jeśli linia ma tekst, dodaj ją do wyniku
        // Jeśli była pusta przed usunięciem akordów I pozostała pusta, również ją dodaj
        // (to zachowuje intencjonalne puste linie)
        if (hasText) {
            processedLines.push(lineWithoutChords);
        } else if (line.trim().length === 0) {
            // Zachowaj oryginalne puste linie
            processedLines.push('');
        }
        // W przeciwnym razie pomijamy linię (była to linia zawierająca tylko akordy)
    }

    return processedLines.join('\n');
}

