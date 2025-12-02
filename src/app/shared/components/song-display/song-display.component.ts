import { ChangeDetectionStrategy, Component, computed, HostBinding, inject, input, Signal } from '@angular/core';
import { TransposeService } from '../../../core/services/transpose.service';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Dostępne rozmiary czcionki
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Pojedyncza cześć słowa - akord i fragment tekstu
 */
export interface SongWordPart {
    chord: string;
    text: string;
}

/**
 * Całe słowo logiczne składające się z jednej lub wielu części (np. "noc-nej" z akordami w środku)
 */
export interface SongWord {
    parts: SongWordPart[];
}

/**
 * Linia z tekstem i opcjonalnymi akordami
 */
export interface LyricsLine {
    type: 'lyrics';
    chordLine: string;
    textLine: string;
    hasLyrics: boolean;
    repetitionCount?: number;
    // Lista słów zamiast płaskich tokenów, aby zapewnić poprawne łamanie linii
    words?: SongWord[];
}

export interface DirectiveLine {
    type: 'directive';
    content: string;
}

export interface CommentLine {
    type: 'comment';
    content: string;
}

export interface EmptyLine {
    type: 'empty';
}

/**
 * Wszystkie typy linii w ChordPro
 */
export type ParsedLine = LyricsLine | DirectiveLine | CommentLine | EmptyLine;

const NBSP = '\u00A0';

/**
 * Wzorzec dla dyrektywy repetycji w formacie ChordPro.
 * Dopasowuje {c: xN} lub {c:xN} gdzie N to liczba.
 */
const REPETITION_DIRECTIVE_PATTERN = /\{c:\s*x(\d+)\s*\}/i;

/**
 * Reużywalny komponent do renderowania treści piosenki w formacie ChordPro.
 * Komponent jest "głupi" (presentational) - jego wygląd jest sterowany przez dane wejściowe.
 *
 * Funkcjonalność:
 * - Parsowanie treści ChordPro do struktury SongDisplayVm
 * - Wyświetlanie tekstu z akordami lub bez (kontrolowane przez showChords)
 * - Odporność na błędy parsowania
 */
@Component({
    selector: 'stbo-song-display',
    standalone: true,
    imports: [],
    templateUrl: './song-display.component.html',
    styleUrl: './song-display.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongDisplayComponent {
    private readonly transposeService = inject(TransposeService);

    /**
     * Treść piosenki w formacie ChordPro
     */
    public readonly content = input<string | undefined | null>();

    /**
     * Flaga decydująca o wyświetlaniu akordów
     */
    public readonly showChords = input<boolean>(false);

    /**
     * Wartość transpozycji (przesunięcie w półtonach)
     */
    public readonly transposeOffset = input<number>(0);

    /**
     * Wielkość czcionki dla wyświetlanego tekstu
     */
    public readonly fontSize = input<FontSize>('small');

    /**
     * Dynamicznie ustawia klasę CSS na hoście komponentu w zależności od rozmiaru czcionki
     */
    @HostBinding('class')
    get hostClasses(): string {
        return `font-size-${this.fontSize()}`;
    }

    /**
     * Sparsowana treść piosenki - automatycznie przeliczana gdy zmieni się content lub transposeOffset
     */
    protected readonly parsedLines: Signal<ParsedLine[]> = computed(() => {
        const contentValue = this.content();
        if (!contentValue) {
            return [];
        }

        // Najpierw transponuj treść jeśli offset !== 0
        const offset = this.transposeOffset();
        const processedContent = offset !== 0
            ? this.transposeService.transposeContent(contentValue, offset)
            : contentValue;

        return parseChordPro(processedContent);
    });

    /**
     * Pomocnicza stała dla non-breaking space
     */
    protected readonly nbsp = NBSP;
}

/**
 * Parsuje treść ChordPro do struktury ParsedLine[]
 */
function parseChordPro(rawContent: string): ParsedLine[] {
    if (!rawContent) {
        return [];
    }

    try {
        return rawContent.split(/\r?\n/).map((line) => parseLine(line));
    } catch (error) {
        console.error('Błąd parsowania ChordPro:', error);
        // W przypadku błędu, zwracamy surowy tekst jako pojedynczą linię
        return [
            {
                type: 'lyrics',
                chordLine: '',
                textLine: rawContent,
                hasLyrics: true,
            },
        ];
    }
}

/**
 * Parsuje pojedynczą linię tekstu ChordPro
 */
function parseLine(line: string): ParsedLine {
    const trimmed = line.trim();

    // Pusta linia
    if (trimmed.length === 0) {
        return { type: 'empty' };
    }

    // Komentarz
    if (trimmed.startsWith('#')) {
        return {
            type: 'comment',
            content: trimmed.slice(1).trim(),
        };
    }

    // Dyrektywa (ale NIE dyrektywa repetycji {c: xN} - ta jest obsługiwana w liniach lyrics)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        // Sprawdź czy to dyrektywa repetycji - jeśli tak, traktuj jako lyrics
        const repetitionMatch = trimmed.match(REPETITION_DIRECTIVE_PATTERN);
        if (repetitionMatch) {
            return {
                type: 'lyrics',
                chordLine: '',
                textLine: '',
                hasLyrics: false,
                repetitionCount: parseInt(repetitionMatch[1], 10),
            };
        }
        return {
            type: 'directive',
            content: trimmed.slice(1, -1).trim(),
        };
    }

    // Wyodrębnij dyrektywę repetycji z końca linii (jeśli istnieje)
    const { lineWithoutRepetition, repetitionCount } = extractRepetitionDirective(line);

    const textLine = lineWithoutRepetition
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\t/g, NBSP.repeat(4));
    const hasLyrics = textLine.trim().length > 0;
    const chordLine = hasLyrics ? buildChordLine(lineWithoutRepetition) : buildChordOnlyLine(lineWithoutRepetition);

    // Parsuj linię na słowa (Word -> Parts) dla poprawnego zawijania
    // Tokeny generujemy tylko dla linii z tekstem I akordami
    const hasChords = /\[[^\]]+\]/.test(lineWithoutRepetition);
    const words = (hasLyrics && hasChords) ? parseLineToWords(lineWithoutRepetition) : undefined;

    return {
        type: 'lyrics',
        chordLine,
        textLine,
        hasLyrics,
        repetitionCount,
        words,
    };
}

/**
 * Wyodrębnia dyrektywę repetycji {c: xN} z linii.
 * Zwraca linię bez dyrektywy oraz liczbę powtórzeń (lub undefined).
 */
function extractRepetitionDirective(line: string): { lineWithoutRepetition: string; repetitionCount?: number } {
    const match = line.match(REPETITION_DIRECTIVE_PATTERN);
    if (match) {
        // Usuń dyrektywę z linii
        const lineWithoutRepetition = line.replace(match[0], '').trimEnd();
        const repetitionCount = parseInt(match[1], 10);
        return { lineWithoutRepetition, repetitionCount };
    }
    return { lineWithoutRepetition: line, repetitionCount: undefined };
}

/**
 * Buduje linię samych akordów (dla widoku desktopowego/bez zawijania lub gdy nie ma tekstu)
 * Zachowuje spacje, aby akordy były nad odpowiednimi słowami (w przybliżeniu, przy czcionce monospaced)
 */
function buildChordLine(line: string): string {
    let rendered = '';
    let textIndex = 0; // Indeks w wyczyszczonym tekście (bez znaczników akordów)

    // Regex do znajdowania akordów w nawiasach kwadratowych [C]
    const chordRegex = /\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    let lastChordEndIndex = 0;

    while ((match = chordRegex.exec(line)) !== null) {
        const chord = match[1];
        const chordStartIndex = match.index;

        // Tekst przed akordem (który nie jest akordem)
        const textBeforeChord = line.slice(lastChordEndIndex, chordStartIndex);
        // Oblicz długość tego tekstu po usunięciu ewentualnych innych tagów (gdyby były) - tutaj zakładamy prosty format
        const textLength = textBeforeChord.length; // Uproszczenie: 1 char = 1 space

        // Dodaj spacje odpowiadające tekstowi przed akordem
        const spacesNeeded = textIndex + textLength - rendered.length;
        if (spacesNeeded > 0) {
            rendered += ' '.repeat(spacesNeeded);
        }

        rendered += chord;
        // Przesuwamy wirtualny kursor tekstu
        textIndex += textLength;
        lastChordEndIndex = chordStartIndex + match[0].length;
    }

    return rendered;
}

/**
 * Dla linii zawierających tylko akordy (bez tekstu)
 * Po prostu wyciąga akordy i spacje, usuwając nawiasy.
 */
function buildChordOnlyLine(line: string): string {
    // Zamień [C] na C, zachowaj spacje
    // To jest uproszczone podejście
    const rendered = line.replace(/\[([^\]]+)\]/g, '$1');
    return rendered;
}


/**
 * Parsuje linię ChordPro na logiczne słowa.
 * Rozwiązuje problem dzielenia słów w połowie przy zawijaniu wierszy.
 *
 * Algorytm:
 * 1. Dzieli linię na zgrubne segmenty "akord + tekst" (chunks).
 * 2. Iteruje po segmentach, dzieląc tekst wewnątrz nich wg spacji.
 * 3. Grupuje segmenty w "Słowa" (SongWord). Słowo kończy się, gdy tekst segmentu kończy się spacją.
 *
 * Przykład: "[C]Wśród [a]noc[G]nej [d]ciszy"
 *
 * Krok 1 (Chunks):
 * - { chord: "C", text: "Wśród " }
 * - { chord: "a", text: "noc" }
 * - { chord: "G", text: "nej " }
 * - { chord: "d", text: "ciszy" }
 *
 * Krok 2 (Words):
 * - Word 1: [{C, "Wśród "}] (spacja kończy słowo)
 * - Word 2: [{a, "noc"}, {G, "nej "}] (noc nie ma spacji -> klei się z nej)
 * - Word 3: [{d, "ciszy"}]
 */
function parseLineToWords(line: string): SongWord[] {
    // 1. Pobierz zgrubne segmenty (akord + tekst do następnego akordu)
    const chunks = parseLineToChunks(line);
    const words: SongWord[] = [];
    let currentWordParts: SongWordPart[] = [];

    for (const chunk of chunks) {
        // Dzielimy tekst chunka na części, zachowując separatory (spacje)
        // Używamy regexa z grupą przechwytującą (\s+), co powoduje, że split zwraca też separatory.
        // Np. "To jest" -> ["To", " ", "jest"]
        // "Wśród " -> ["Wśród", " "]
        const splitRegex = /(\s+)/;
        const textParts = chunk.text.split(splitRegex).filter(p => p.length > 0);

        if (textParts.length === 0) {
            // Pusty tekst w chunku (np. same akordy [C][D]) -> dodaj jako part do bieżącego słowa lub nowe?
            // Jeśli same akordy, traktujmy jako część bieżącego słowa (lub początek nowego)
            currentWordParts.push({ chord: chunk.chord, text: '' });
            continue;
        }

        // Pierwsza część tekstu dziedziczy akord chunka
        // Kolejne części w tym samym chunku mają pusty akord (bo akord był na początku chunka)

        let isFirstPart = true;

        for (const part of textParts) {
            const isWhitespace = /^\s+$/.test(part);
            const chordForPart = isFirstPart ? chunk.chord : '';

            if (isWhitespace) {
                // To jest separator (spacja/tab)
                // Doklejamy go do ostatniej dodanej części w currentWordParts
                if (currentWordParts.length > 0) {
                    const lastPart = currentWordParts[currentWordParts.length - 1];
                    lastPart.text += part;
                } else {
                    // Spacja na samym początku linii lub słowa?
                    // Dodajmy pustą część z tą spacją
                    currentWordParts.push({ chord: chordForPart, text: part });
                }

                // Spacja ZAMYKA aktualne słowo
                words.push({ parts: [...currentWordParts] });
                currentWordParts = [];
            } else {
                // To jest fragment tekstu
                currentWordParts.push({ chord: chordForPart, text: part });
            }

            isFirstPart = false;
        }
    }

    // Dodaj ostatnie słowo, jeśli coś zostało w buforze (nie zakończone spacją)
    if (currentWordParts.length > 0) {
        words.push({ parts: currentWordParts });
    }

    return words;
}

/**
 * Pomocnicza struktura do pierwszego etapu parsowania
 */
interface ChordTextChunk {
    chord: string;
    text: string;
}

/**
 * Dzieli linię na sekwencje "akord + tekst po nim".
 * Podobne do starego parseLineToTokens, ale uproszczone dla nowego algorytmu.
 */
function parseLineToChunks(line: string): ChordTextChunk[] {
    const chunks: ChordTextChunk[] = [];
    const chordRegex = /\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    // Znajdź wszystkie akordy
    const matches: { chord: string; index: number; length: number }[] = [];
    while ((match = chordRegex.exec(line)) !== null) {
        matches.push({ chord: match[1], index: match.index, length: match[0].length });
    }

    // Jeśli brak akordów, zwróć całość (choć ta funkcja jest wywoływana tylko gdy są akordy)
    if (matches.length === 0) {
        chunks.push({ chord: '', text: line });
        return chunks;
    }

    // Tekst przed pierwszym akordem
    if (matches[0].index > 0) {
        const textBefore = line.slice(0, matches[0].index);
        if (textBefore.length > 0) {
            chunks.push({ chord: '', text: textBefore });
        }
    }

    // Iteruj po akordach
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const nextStart = (i < matches.length - 1) ? matches[i + 1].index : line.length;

        const textAfter = line.slice(current.index + current.length, nextStart);
        chunks.push({ chord: current.chord, text: textAfter });
    }

    // Zamień tabulatory na spacje w wynikach
    return chunks.map(c => ({ ...c, text: c.text.replace(/\t/g, NBSP.repeat(4)) }));
}
