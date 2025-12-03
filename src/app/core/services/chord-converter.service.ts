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
     * Format: [CDEFGAB lub cdefgab lub H/h][#/b opcjonalnie][modyfikator opcjonalnie][cyfra opcjonalnie][* opcjonalnie]
     *
     * Przykłady poprawnych akordów: C, Am, G#, Bb, Dm7, Csus4, Fmaj7, a, e, H, G*, Am7*
     * Gwiazdka (*) jest używana do oznaczania szczególnych wariacji akordu (np. muted chords).
     */
    private readonly CHORD_PATTERN = /^[A-Ga-gHh](#|b)?(m|maj|min|M|aug|dim|sus|add)?\d*\*?(\/[A-Ga-gHh](#|b)?)?$/;

    /**
     * Wzorzec dla znacznika repetycji na końcu linii.
     * Dopasowuje spację (lub więcej) + "x" + jedna lub więcej cyfr na końcu linii.
     * Przykłady: "tekst x2", "akordy x3"
     */
    private readonly REPETITION_MARKER_PATTERN = /\s+(x\d+)$/i;

    /**
     * Wzorzec dla dyrektywy repetycji w formacie ChordPro.
     * Dopasowuje {c: xN} gdzie N to liczba.
     */
    private readonly REPETITION_DIRECTIVE_PATTERN = /\{c:\s*x(\d+)\s*\}/i;

    /**
     * Wzorzec dla wielowierszowego znacznika repetycji na końcu linii.
     * Dopasowuje spację + "x" + liczba powtórzeń + "(" + liczba linii + ")" na końcu linii.
     * Przykłady: "tekst x2(4)", "akordy x3(2)"
     */
    private readonly MULTILINE_REPETITION_MARKER_PATTERN = /\s+x(\d+)\((\d+)\)$/i;

    /**
     * Wzorzec dla dyrektywy początku bloku powtórzeń w formacie ChordPro.
     * Dopasowuje {block_start: xN} gdzie N to liczba.
     */
    private readonly BLOCK_START_DIRECTIVE_PATTERN = /^\{block_start:\s*x(\d+)\s*\}$/i;

    /**
     * Wzorzec dla dyrektywy końca bloku powtórzeń w formacie ChordPro.
     * Dopasowuje {block_end}
     */
    private readonly BLOCK_END_DIRECTIVE_PATTERN = /^\{block_end\}$/i;

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
     * Obsługuje również znacznik repetycji xN (np. x2) na końcu linii,
     * konwertując go do dyrektywy ChordPro {c: xN}.
     *
     * Obsługuje wielowierszowe powtórzenia xN(L) (np. x2(4)), konwertując je
     * do dyrektyw {block_start: xN} i {block_end}.
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
                    // Najpierw wyodrębnij znacznik repetycji z linii tekstu
                    const { line: textWithoutRepetition, repetitionDirective } = this.extractRepetitionMarker(nextLine);
                    const merged = this.mergeChordLineWithText(currentLine, textWithoutRepetition);
                    result.push(merged + repetitionDirective);
                    i += 2; // Przeskocz obie linie
                } else {
                    // Linia z akordami bez tekstu pod nią (lub pusta linia/kolejna linia akordów pod spodem)
                    // Najpierw wyodrębnij znacznik repetycji z linii akordów
                    const { line: chordsWithoutRepetition, repetitionDirective } = this.extractRepetitionMarker(currentLine);
                    const chords = this.extractChordsOnly(chordsWithoutRepetition);
                    result.push(chords + repetitionDirective);
                    i += 1;
                }
            } else {
                // Zwykła linia tekstu (w tym puste linie)
                result.push(this.convertRepetitionMarker(currentLine));
                i += 1;
            }
        }

        // Drugie przejście: obsługa wielowierszowych powtórzeń xN(L)
        return this.processMultilineRepetitions(result);
    }

    /**
     * Przetwarza wielowierszowe znaczniki powtórzeń xN(L) i konwertuje je
     * do dyrektyw {block_start: xN} i {block_end}.
     *
     * @param lines - Tablica linii po pierwszym etapie konwersji
     * @returns Tekst z przetworzonymi blokami powtórzeń
     */
    private processMultilineRepetitions(lines: string[]): string {
        const result = [...lines];

        for (let i = 0; i < result.length; i++) {
            const line = result[i];
            const match = line.match(this.MULTILINE_REPETITION_MARKER_PATTERN);

            if (match) {
                const repeatCount = parseInt(match[1], 10);
                const lineCount = parseInt(match[2], 10);

                // Usuń znacznik z aktualnej linii
                const lineWithoutMarker = line.replace(this.MULTILINE_REPETITION_MARKER_PATTERN, '');
                result[i] = lineWithoutMarker;

                // Oblicz indeks początku bloku
                // Bierzemy pod uwagę, że blok obejmuje 'lineCount' linii, włącznie z aktualną
                const blockStartIndex = Math.max(0, i - lineCount + 1);

                // Wstaw dyrektywę {block_start: xN} przed blokiem
                result.splice(blockStartIndex, 0, `{block_start: x${repeatCount}}`);

                // Indeks został przesunięty o 1 przez splice, więc koniec bloku jest teraz na i + 1
                // Wstaw dyrektywę {block_end} po aktualnej linii (teraz i + 1 + 1 = i + 2)
                result.splice(i + 2, 0, '{block_end}');

                // Przeskocz dodane dyrektywy
                i += 2;
            }
        }

        return result.join('\n');
    }

    /**
     * Konwertuje znacznik repetycji xN na końcu linii do dyrektywy ChordPro {c: xN}.
     *
     * @param line - Linia tekstu
     * @returns Linia z przekonwertowanym znacznikiem repetycji
     */
    private convertRepetitionMarker(line: string): string {
        const match = line.match(this.REPETITION_MARKER_PATTERN);
        if (match) {
            const marker = match[1]; // np. "x2"
            return line.replace(this.REPETITION_MARKER_PATTERN, ` {c: ${marker}}`);
        }
        return line;
    }

    /**
     * Wyodrębnia znacznik repetycji xN z końca linii i zwraca linię bez znacznika
     * oraz dyrektywę ChordPro do dodania na końcu.
     *
     * @param line - Linia tekstu
     * @returns Obiekt z linią bez znacznika i dyrektywą repetycji (lub pustym stringiem)
     */
    private extractRepetitionMarker(line: string): { line: string; repetitionDirective: string } {
        const match = line.match(this.REPETITION_MARKER_PATTERN);
        if (match) {
            const marker = match[1]; // np. "x2"
            const lineWithoutMarker = line.replace(this.REPETITION_MARKER_PATTERN, '');
            return {
                line: lineWithoutMarker,
                repetitionDirective: ` {c: ${marker}}`,
            };
        }
        return {
            line: line,
            repetitionDirective: '',
        };
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
     * Obsługuje również dyrektywę repetycji {c: xN},
     * konwertując ją z powrotem do znacznika xN.
     *
     * Obsługuje dyrektywy blokowe {block_start: xN} i {block_end},
     * konwertując je z powrotem do składni xN(L).
     *
     * @param chordProContent - Tekst piosenki w formacie ChordPro
     * @returns Tekst piosenki w formacie "akordy nad tekstem"
     */
    public convertToOverText(chordProContent: string): string {
        if (!chordProContent || chordProContent.trim().length === 0) {
            return '';
        }

        // Najpierw przetwórz dyrektywy blokowe
        const processedContent = this.processBlockDirectivesToOverText(chordProContent);

        const lines = processedContent.split('\n');
        const result: string[] = [];

        for (const line of lines) {
            // Najpierw wyodrębnij dyrektywę repetycji (jeśli istnieje)
            const { lineWithoutDirective, repetitionMarker } = this.extractRepetitionDirectiveForOverText(line);

            const { chordLine, textLine, hasChords } = this.splitChordProLine(lineWithoutDirective);

            if (hasChords) {
                // Linia zawiera akordy
                if (textLine.trim().length > 0) {
                    // Jest tekst - dodaj linię akordów, potem linię tekstu z markerem
                    result.push(chordLine);
                    result.push(textLine + repetitionMarker);
                } else {
                    // Brak tekstu (same akordy) - dodaj linię akordów z markerem
                    result.push(chordLine + repetitionMarker);
                }
            } else {
                // Linia bez akordów - dodaj bez zmian (z markerem jeśli był)
                result.push(lineWithoutDirective + repetitionMarker);
            }
        }

        return result.join('\n');
    }

    /**
     * Przetwarza dyrektywy blokowe {block_start: xN} i {block_end}
     * i konwertuje je do składni xN(L).
     *
     * @param content - Tekst piosenki w formacie ChordPro
     * @returns Tekst z przekonwertowanymi dyrektywami blokowymi
     */
    private processBlockDirectivesToOverText(content: string): string {
        const lines = content.split('\n');
        const result: string[] = [];

        let blockRepeatCount: number | null = null;
        let blockStartResultIndex: number | null = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Sprawdź czy to dyrektywa początku bloku
            const blockStartMatch = trimmedLine.match(this.BLOCK_START_DIRECTIVE_PATTERN);
            if (blockStartMatch) {
                blockRepeatCount = parseInt(blockStartMatch[1], 10);
                blockStartResultIndex = result.length;
                // Nie dodawaj tej linii do wyniku
                continue;
            }

            // Sprawdź czy to dyrektywa końca bloku
            const blockEndMatch = trimmedLine.match(this.BLOCK_END_DIRECTIVE_PATTERN);
            if (blockEndMatch) {
                if (blockRepeatCount !== null && blockStartResultIndex !== null) {
                    // Oblicz liczbę linii w bloku
                    const lineCount = result.length - blockStartResultIndex;

                    // Dodaj znacznik xN(L) do ostatniej linii bloku (jeśli jest)
                    if (lineCount > 0) {
                        const lastLineIndex = result.length - 1;
                        result[lastLineIndex] = `${result[lastLineIndex]} x${blockRepeatCount}(${lineCount})`;
                    }
                }

                // Zresetuj stan bloku
                blockRepeatCount = null;
                blockStartResultIndex = null;
                // Nie dodawaj tej linii do wyniku
                continue;
            }

            // Zwykła linia - dodaj do wyniku
            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * Wyodrębnia dyrektywę repetycji {c: xN} z linii i zwraca linię bez dyrektywy
     * oraz znacznik do dodania (np. " x2").
     *
     * @param line - Linia tekstu w formacie ChordPro
     * @returns Obiekt z linią bez dyrektywy i znacznikiem repetycji
     */
    private extractRepetitionDirectiveForOverText(line: string): { lineWithoutDirective: string; repetitionMarker: string } {
        // Reset lastIndex bo wzorzec jest globalny
        this.REPETITION_DIRECTIVE_PATTERN.lastIndex = 0;
        const match = line.match(this.REPETITION_DIRECTIVE_PATTERN);
        if (match) {
            const lineWithoutDirective = line.replace(this.REPETITION_DIRECTIVE_PATTERN, '').trimEnd();
            return {
                lineWithoutDirective,
                repetitionMarker: ` x${match[1]}`,
            };
        }
        return { lineWithoutDirective: line, repetitionMarker: '' };
    }

    /**
     * Konwertuje dyrektywę repetycji {c: xN} z powrotem do znacznika xN.
     *
     * @param line - Linia tekstu w formacie ChordPro
     * @returns Linia z przekonwertowaną dyrektywą repetycji
     */
    private convertRepetitionDirective(line: string): string {
        // Reset lastIndex bo wzorzec jest globalny
        this.REPETITION_DIRECTIVE_PATTERN.lastIndex = 0;
        return line.replace(this.REPETITION_DIRECTIVE_PATTERN, (_, num) => `x${num}`);
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
        const chordsWithPositions: { chord: string; textPosition: number }[] = [];
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

