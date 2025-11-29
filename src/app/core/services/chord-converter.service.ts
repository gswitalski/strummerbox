import { Injectable } from '@angular/core';

/**
 * Serwis odpowiedzialny za dwukierunkową konwersję tekstów piosenek między formatem
 * "akordy nad tekstem" a formatem ChordPro (z akordami w nawiasach kwadratowych).
 */
@Injectable({
    providedIn: 'root',
})
export class ChordConverterService {
    /**
     * Non-breaking space używany do zachowania odstępów
     */
    private readonly NBSP = '\u00A0';
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
                // Sprawdź czy następna linia zawiera tekst (niepusta i nie jest linią akordów)
                const nextLineHasText = nextLine !== null &&
                    nextLine.trim().length > 0 &&
                    !this.isChordLine(nextLine);

                if (nextLineHasText) {
                    // Mamy parę: akordy + tekst
                    const merged = this.mergeChordLineWithText(currentLine, nextLine);
                    result.push(merged);
                    i += 2; // Przeskocz obie linie
                } else {
                    // Linia z akordami bez tekstu pod nią (lub pusta linia/kolejna linia akordów pod spodem)
                    const chords = this.extractChordsOnly(currentLine);
                    result.push(chords);
                    i += 1;
                }
            } else {
                // Zwykła linia tekstu (w tym puste linie)
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
     * Akordy są oddzielone co najmniej dwiema spacjami dla lepszej czytelności.
     */
    private extractChordsOnly(line: string): string {
        const tokens = line.split(/\s+/).filter(t => t.length > 0);
        const chords = tokens.filter(token => this.isChord(token));

        if (chords.length === 0) {
            return line;
        }

        // Zwróć akordy oddzielone podwójnymi spacjami w nawiasach kwadratowych
        return chords.map(chord => `[${chord}]`).join('  ');
    }

    // ============================================================================
    // Konwersja ChordPro -> Akordy nad tekstem
    // ============================================================================

    /**
     * Konwertuje tekst w formacie ChordPro do formatu "akordy nad tekstem".
     *
     * Format wejściowy ChordPro:
     * - Akordy umieszczone w nawiasach kwadratowych [akord] w tekście
     *
     * Format wyjściowy:
     * - Linia z akordami (umieszczone nad odpowiednimi pozycjami w tekście)
     * - Linia z tekstem (bezpośrednio pod akordami)
     *
     * @param chordProContent - Tekst piosenki w formacie ChordPro
     * @returns Tekst piosenki w formacie "akordy nad tekstem"
     */
    public convertToOverText(chordProContent: string): string {
        if (!chordProContent || chordProContent.trim().length === 0) {
            return '';
        }

        const lines = chordProContent.split('\n');
        const result: string[] = [];

        for (const line of lines) {
            const { chordLine, textLine, hasChords } = this.splitChordProLine(line);

            if (hasChords) {
                // Linia zawiera akordy - dodaj linię akordów
                result.push(chordLine);
                // Dodaj linię tekstu tylko jeśli zawiera jakikolwiek tekst (nie same spacje)
                // (samodzielne akordy bez tekstu nie potrzebują pustej linii pod spodem)
                if (textLine.trim().length > 0) {
                    result.push(textLine);
                }
            } else {
                // Linia bez akordów - dodaj bez zmian
                result.push(line);
            }
        }

        return result.join('\n');
    }

    /**
     * Rozdziela linię ChordPro na linię akordów i linię tekstu.
     * Akordy są umieszczane w pozycjach odpowiadających ich miejscu w tekście.
     * Gdy akordy się nakładają, dodawane są spacje aby je rozdzielić.
     */
    private splitChordProLine(line: string): {
        chordLine: string;
        textLine: string;
        hasChords: boolean;
    } {
        // Sprawdź czy linia zawiera jakiekolwiek akordy
        if (!line.includes('[')) {
            return { chordLine: '', textLine: line, hasChords: false };
        }

        // Najpierw zbierz wszystkie akordy i ich pozycje
        const chordsWithPositions: Array<{ chord: string; textPosition: number }> = [];
        const textChars: string[] = [];
        let textPosition = 0;
        let index = 0;

        while (index < line.length) {
            const char = line[index];

            if (char === '[') {
                // Szukaj zamykającego nawiasu
                const closingIndex = line.indexOf(']', index + 1);

                if (closingIndex === -1) {
                    // Brak zamykającego nawiasu - traktuj jako zwykły tekst
                    textChars.push(char);
                    textPosition += 1;
                    index += 1;
                    continue;
                }

                const chord = line.slice(index + 1, closingIndex);
                chordsWithPositions.push({ chord, textPosition });

                index = closingIndex + 1;
                continue;
            }

            // Zwykły znak tekstu
            textChars.push(char);
            textPosition += 1;
            index += 1;
        }

        const textLine = textChars.join('');
        const hasLyrics = textLine.trim().length > 0;

        if (!hasLyrics) {
            const standaloneChordLine = this.buildStandaloneChordLine(line);
            return {
                chordLine: standaloneChordLine,
                textLine: '',
                hasChords: standaloneChordLine.length > 0,
            };
        }

        // Teraz buduj linię akordów, rozwiązując nakładanie się
        const chordChars: string[] = [];
        let currentChordEndPosition = 0;

        for (const { chord, textPosition: chordTextPos } of chordsWithPositions) {
            // Jeśli akord zaczyna się przed końcem poprzedniego, dodaj spację
            let writePosition = chordTextPos;
            if (writePosition < currentChordEndPosition) {
                writePosition = currentChordEndPosition;
            }

            // Upewnij się, że mamy wystarczającą długość
            this.ensureChordLineLength(chordChars, writePosition);

            // Zapisz akord
            for (let i = 0; i < chord.length; i++) {
                const pos = writePosition + i;
                this.ensureChordLineLength(chordChars, pos + 1);
                chordChars[pos] = chord[i];
            }

            // Zaktualizuj pozycję końca + 1 spacja odstępu
            currentChordEndPosition = writePosition + chord.length + 1;
        }

        // Konwertuj tablice na stringi, zamieniając undefined na spacje
        const chordLine = chordChars.map(c => c || ' ').join('');

        // Przytnij trailing spaces w linii akordów, ale zachowaj leading spaces
        const trimmedChordLine = chordLine.replace(/\s+$/, '');

        return {
            chordLine: trimmedChordLine,
            textLine: textLine,
            hasChords: trimmedChordLine.length > 0,
        };
    }

    /**
     * Zapewnia, że tablica chordChars ma odpowiednią długość.
     */
    private ensureChordLineLength(chordChars: string[], targetLength: number): void {
        while (chordChars.length < targetLength) {
            chordChars.push(' ');
        }
    }

    /**
     * Buduje linię akordów dla przypadku, gdy wiersz nie zawiera żadnego tekstu.
     * Zapewnia co najmniej podwójny odstęp pomiędzy akordami oraz zachowuje
     * wiodące wcięcie jeśli występuje.
     */
    private buildStandaloneChordLine(line: string): string {
        const matches = Array.from(line.matchAll(/\[([^\]]+)\]/g));

        if (matches.length === 0) {
            return '';
        }

        let rendered = '';
        let cursor = 0;

        for (let index = 0; index < matches.length; index += 1) {
            const match = matches[index];
            const between = line.slice(cursor, match.index);

            if (index === 0) {
                rendered += between.replace(/\t/g, '    ');
            } else {
                const normalized = between.replace(/\t/g, '    ');
                const whitespaceLength = normalized.length;
                const gapSize = Math.max(2, whitespaceLength);
                rendered += ' '.repeat(gapSize);
            }

            rendered += match[1].trim();
            cursor = match.index + match[0].length;
        }

        return rendered.trimEnd();
    }
}

