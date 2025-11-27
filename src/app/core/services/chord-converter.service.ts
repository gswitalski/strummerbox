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
     * Wzorzec dla kompletnego akordu muzycznego.
     * Dopasowuje cały token jako akord (nie szuka wewnątrz słów).
     *
     * Format: [CDEFGAB lub cdefgab lub H/h][#/b opcjonalnie][modyfikator opcjonalnie][cyfra opcjonalnie]
     *
     * Przykłady poprawnych akordów: C, Am, G#, Bb, Dm7, Csus4, Fmaj7, a, e, H
     */
    private readonly CHORD_PATTERN = /^[A-Ga-gHh](#|b)?(m|maj|min|M|aug|dim|sus|add)?\d*(\/[A-Ga-gHh](#|b)?)?$/;

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
     * Sprawdza, czy podany token jest poprawnym akordem muzycznym.
     * Token musi w całości pasować do wzorca akordu.
     *
     * @param token - Token do sprawdzenia
     * @returns true jeśli token jest akordem
     */
    private isChord(token: string): boolean {
        return this.CHORD_PATTERN.test(token);
    }

    /**
     * Sprawdza, czy linia zawiera akordy.
     * Linia jest uznawana za linię z akordami, jeśli:
     * - Zawiera przynajmniej jeden kompletny token będący akordem
     * - Stosunek tokenów-akordów do wszystkich tokenów jest wysoki (>= 60%)
     * - Tokeny są sprawdzane jako całość (nie szukamy akordów wewnątrz słów)
     *
     * Ta metoda jest odporna na polskie znaki diakrytyczne, ponieważ
     * sprawdza całe tokeny zamiast szukać wzorców wewnątrz słów.
     */
    private isChordLine(line: string): boolean {
        if (!line || line.trim().length === 0) {
            return false;
        }

        const trimmed = line.trim();

        // Podziel linię na tokeny (oddzielone spacjami)
        const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);

        if (tokens.length === 0) {
            return false;
        }

        // Policz ile tokenów to kompletne akordy
        const chordCount = tokens.filter(token => this.isChord(token)).length;

        if (chordCount === 0) {
            return false;
        }

        // Jeśli więcej niż 60% tokenów to akordy, uznajemy to za linię akordową
        // Wyższy próg (60%) pomaga uniknąć fałszywych pozytywów
        const chordRatio = chordCount / tokens.length;
        return chordRatio >= 0.6;
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
     * Iteruje przez linię szukając tokenów (ciągów znaków nie będących spacjami)
     * i sprawdza każdy token metodą isChord().
     */
    private extractChordPositions(line: string): { position: number; chord: string }[] {
        const positions: { position: number; chord: string }[] = [];

        // Znajdź wszystkie tokeny (ciągi znaków nie będące spacjami) wraz z ich pozycjami
        const tokenPattern = /\S+/g;
        let match: RegExpExecArray | null;

        while ((match = tokenPattern.exec(line)) !== null) {
            const token = match[0];
            // Sprawdź czy token jest poprawnym akordem
            if (this.isChord(token)) {
                positions.push({
                    position: match.index,
                    chord: token,
                });
            }
        }

        return positions;
    }

    /**
     * Ekstraktuje same akordy z linii (gdy nie ma tekstu pod nią).
     * Zwraca tylko tokeny będące poprawnymi akordami.
     */
    private extractChordsOnly(line: string): string {
        const tokens = line.split(/\s+/).filter(t => t.length > 0);
        const chords = tokens.filter(token => this.isChord(token));

        if (chords.length === 0) {
            return line;
        }

        // Zwróć akordy oddzielone spacjami w nawiasach kwadratowych
        return chords.map(chord => `[${chord}]`).join(' ');
    }
}

