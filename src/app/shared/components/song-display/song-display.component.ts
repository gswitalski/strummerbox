import {
    ChangeDetectionStrategy,
    Component,
    Signal,
    computed,
    inject,
    input,
} from '@angular/core';
import { TransposeService } from '../../../core/services/transpose.service';

/**
 * Typ linii z tekstem piosenki
 */
interface LyricsLine {
    type: 'lyrics';
    chordLine: string;
    textLine: string;
}

/**
 * Typ linii dyrektywy
 */
interface DirectiveLine {
    type: 'directive';
    content: string;
}

/**
 * Typ linii komentarza
 */
interface CommentLine {
    type: 'comment';
    content: string;
}

/**
 * Typ pustej linii
 */
interface EmptyLine {
    type: 'empty';
}

/**
 * Wszystkie typy linii w ChordPro
 */
type ParsedLine = LyricsLine | DirectiveLine | CommentLine | EmptyLine;

const NBSP = '\u00A0';

/**
 * Reu\u017cywalny komponent do renderowania tre\u015bci piosenki w formacie ChordPro.
 * Komponent jest "g\u0142upi" (presentational) - jego wygl\u0105d jest sterowany przez dane wej\u015bciowe.
 * 
 * Funkcjonalno\u015b\u0107:
 * - Parsowanie tre\u015bci ChordPro do struktury SongDisplayVm
 * - Wy\u015bwietlanie tekstu z akordami lub bez (kontrolowane przez showChords)
 * - Odporno\u015b\u0107 na b\u0142\u0119dy parsowania
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
 * Parsuje tre\u015b\u0107 ChordPro do struktury ParsedLine[]
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
            },
        ];
    }
}

/**
 * Parsuje pojedyncz\u0105 lini\u0119 tekstu ChordPro
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

    // Dyrektywa
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return {
            type: 'directive',
            content: trimmed.slice(1, -1).trim(),
        };
    }

    // Linia z tekstem (i ewentualnie akordami)
    const chordLine = buildChordLine(line);
    const textLine = line
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\t/g, NBSP.repeat(4));

    return {
        type: 'lyrics',
        chordLine,
        textLine,
    };
}

/**
 * Buduje linię akordów z odpowiednimi spacjami
 * Algorytm identyczny jak w ChordProPreviewComponent
 */
function buildChordLine(line: string): string {
    const chordChars: string[] = [];
    let column = 0;
    let index = 0;

    const ensureLength = (targetLength: number): void => {
        while (chordChars.length < targetLength) {
            chordChars.push(NBSP);
        }
    };

    while (index < line.length) {
        const char = line[index];

        if (char === '[') {
            const closingIndex = line.indexOf(']', index + 1);
            if (closingIndex === -1) {
                ensureLength(column + 1);
                column += 1;
                index += 1;
                continue;
            }

            const chord = line.slice(index + 1, closingIndex).trim();

            ensureLength(column);
            for (let chordIndex = 0; chordIndex < chord.length; chordIndex += 1) {
                const writePosition = column + chordIndex;
                ensureLength(writePosition + 1);
                chordChars[writePosition] = chord[chordIndex];
            }

            index = closingIndex + 1;
            continue;
        }

        const TAB_SIZE = 4;
        const width = char === '\t'
            ? (() => {
                  const remainder = column % TAB_SIZE;
                  return remainder === 0 ? TAB_SIZE : TAB_SIZE - remainder;
              })()
            : 1;

        column += width;
        ensureLength(column);
        index += 1;
    }

    return chordChars.join('');
}

