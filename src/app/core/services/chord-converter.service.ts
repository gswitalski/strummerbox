import { Injectable } from '@angular/core';

/**
 * Serwis odpowiedzialny za konwersję tekstów piosenek z formatu "akordy nad tekstem"
 * do formatu ChordPro (z akordami w nawiasach kwadratowych).
 */
@Injectable({
    providedIn: 'root',
})
export class ChordConverterService {
    /**
     * Konwertuje tekst w formacie "akordy nad tekstem" do formatu ChordPro.
     *
     * Format wejściowy:
     * - Linia z akordami (zawiera znaki muzyczne: A-G, cyfry, #, b, m, sus, dim, aug itp.)
     * - Linia z tekstem (bezpośrednio pod akordami)
     *
     * Format wyjściowy ChordPro:
     * - Akordy umieszczone w nawiasach kwadratowych [akord] w odpowiednich miejscach tekstu
     *
     * @param text - Tekst piosenki w formacie "akordy nad tekstem"
     * @returns Tekst piosenki w formacie ChordPro
     */
    public convertFromChordsOverText(text: string): string {
        if (!text || text.trim().length === 0) {
            return '';
        }

        const lines = text.split('\n');
        const result: string[] = [];
        let i = 0;

        while (i < lines.length) {
            const currentLine = lines[i];
            const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

            // Sprawdź, czy aktualna linia to linia z akordami
            if (this.isChordLine(currentLine)) {
                if (nextLine !== null && !this.isChordLine(nextLine)) {
                    // Mamy parę: akordy + tekst
                    const merged = this.mergeChordLineWithText(currentLine, nextLine);
                    result.push(merged);
                    i += 2; // Przeskocz obie linie
                } else {
                    // Linia z akordami bez tekstu pod nią
                    const chords = this.extractChordsOnly(currentLine);
                    result.push(chords);
                    i += 1;
                }
            } else {
                // Zwykła linia tekstu
                result.push(currentLine);
                i += 1;
            }
        }

        return result.join('\n');
    }

    /**
     * Sprawdza, czy linia zawiera akordy.
     * Linia jest uznawana za linię z akordami, jeśli:
     * - Zawiera przynajmniej jeden akord (A-G lub a-g z opcjonalnymi modyfikatorami)
     * - Nie zawiera zbyt wielu zwykłych słów (stosunek akordów do słów jest wysoki)
     */
    private isChordLine(line: string): boolean {
        if (!line || line.trim().length === 0) {
            return false;
        }

        const trimmed = line.trim();

        // Regex dla akordów: litera A-G lub a-g (notacja europejska), po której może być #, b, m, cyfry, sus, dim, aug itp.
        const chordPattern = /\b[A-Ga-g](#|b)?(m|maj|min|aug|dim|sus)?\d*\b/g;
        const chords = trimmed.match(chordPattern);

        if (!chords || chords.length === 0) {
            return false;
        }

        // Sprawdź stosunek akordów do wszystkich tokenów
        const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);

        // Jeśli więcej niż 40% tokenów to akordy, uznajemy to za linię akordową
        const chordRatio = chords.length / tokens.length;
        return chordRatio >= 0.4;
    }

    /**
     * Łączy linię z akordami z linią tekstu, wstawiając akordy w odpowiednich miejscach.
     */
    private mergeChordLineWithText(chordLine: string, textLine: string): string {
        // Znajdź pozycje i wartości akordów
        const chordPositions = this.extractChordPositions(chordLine);

        if (chordPositions.length === 0) {
            return textLine;
        }

        // Buduj wynikową linię od końca, aby uniknąć problemów z przesunięciami indeksów
        let result = textLine;

        // Sortuj pozycje od końca do początku
        chordPositions.sort((a, b) => b.position - a.position);

        for (const { position, chord } of chordPositions) {
            // Wstaw akord w nawiasach kwadratowych na odpowiedniej pozycji
            const insertPosition = Math.min(position, result.length);
            result =
                result.substring(0, insertPosition) +
                `[${chord}]` +
                result.substring(insertPosition);
        }

        return result;
    }

    /**
     * Ekstraktuje pozycje i wartości akordów z linii akordowej.
     */
    private extractChordPositions(line: string): { position: number; chord: string }[] {
        const chordPattern = /[A-Ga-g](#|b)?(m|maj|min|aug|dim|sus)?\d*/g;
        const positions: { position: number; chord: string }[] = [];
        let match: RegExpExecArray | null;

        while ((match = chordPattern.exec(line)) !== null) {
            positions.push({
                position: match.index,
                chord: match[0],
            });
        }

        return positions;
    }

    /**
     * Ekstraktuje same akordy z linii (gdy nie ma tekstu pod nią).
     */
    private extractChordsOnly(line: string): string {
        const chordPattern = /[A-Ga-g](#|b)?(m|maj|min|aug|dim|sus)?\d*/g;
        const chords = line.match(chordPattern);

        if (!chords || chords.length === 0) {
            return line;
        }

        // Zwróć akordy oddzielone spacjami w nawiasach kwadratowych
        return chords.map(chord => `[${chord}]`).join(' ');
    }
}

