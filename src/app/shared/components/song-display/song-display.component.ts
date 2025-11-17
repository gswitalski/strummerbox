import {
    ChangeDetectionStrategy,
    Component,
    Signal,
    computed,
    input,
} from '@angular/core';

/**
 * Struktura reprezentująca pojedynczy segment linii (tekst z opcjonalnym akordem)
 */
interface SongSegment {
    chord: string | null;
    text: string;
}

/**
 * Struktura reprezentująca ca\u0142\u0105 lini\u0119 piosenki
 */
type SongLine = SongSegment[];

/**
 * G\u0142\u00f3wny ViewModel komponentu
 */
type SongDisplayVm = SongLine[];

/**
 * Typ linii w ChordPro
 */
interface ParsedLine {
    type: 'lyrics' | 'directive' | 'comment' | 'empty';
    segments?: SongSegment[];
    content?: string;
}

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
    /**
     * Tre\u015b\u0107 piosenki w formacie ChordPro
     */
    public readonly content = input<string | undefined | null>();

    /**
     * Flaga decyduj\u0105ca o wy\u015bwietlaniu akord\u00f3w
     */
    public readonly showChords = input<boolean>(false);

    /**
     * Sparsowana tre\u015b\u0107 piosenki - automatycznie przeliczana gdy zmieni si\u0119 content
     */
    protected readonly parsedLines: Signal<ParsedLine[]> = computed(() => {
        const contentValue = this.content();
        if (!contentValue) {
            return [];
        }
        return parseChordPro(contentValue);
    });

    /**
     * Pomocnicza sta\u0142a dla non-breaking space
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
        console.error('B\u0142\u0105d parsowania ChordPro:', error);
        // W przypadku b\u0142\u0119du, zwracamy surowy tekst jako pojedyncz\u0105 lini\u0119
        return [
            {
                type: 'lyrics',
                segments: [{ chord: null, text: rawContent }],
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
    const segments = parseLineSegments(line);
    return {
        type: 'lyrics',
        segments,
    };
}

/**
 * Parsuje lini\u0119 tekstu na segmenty (tekst + akordy)
 */
function parseLineSegments(line: string): SongSegment[] {
    const segments: SongSegment[] = [];
    let currentText = '';
    let index = 0;

    while (index < line.length) {
        const char = line[index];

        // Znaleziono pocz\u0105tek akordu
        if (char === '[') {
            const closingIndex = line.indexOf(']', index + 1);

            // Niezamkni\u0119ty nawias - traktuj jako zwyk\u0142y tekst
            if (closingIndex === -1) {
                currentText += char;
                index += 1;
                continue;
            }

            // Wyci\u0105gnij akord
            const chord = line.slice(index + 1, closingIndex).trim();

            // Dodaj poprzedni tekst (je\u015bli by\u0142) jako segment bez akordu
            if (currentText) {
                segments.push({
                    chord: null,
                    text: currentText.replace(/\t/g, NBSP.repeat(4)),
                });
                currentText = '';
            }

            // Przygotuj si\u0119 na tekst po akordzie
            index = closingIndex + 1;

            // Zbierz tekst po akordzie a\u017c do nast\u0119pnego akordu lub ko\u0144ca linii
            let textAfterChord = '';
            while (index < line.length && line[index] !== '[') {
                textAfterChord += line[index];
                index += 1;
            }

            // Dodaj segment z akordem i tekstem
            segments.push({
                chord,
                text: textAfterChord.replace(/\t/g, NBSP.repeat(4)),
            });
        } else {
            currentText += char;
            index += 1;
        }
    }

    // Dodaj pozosta\u0142y tekst
    if (currentText) {
        segments.push({
            chord: null,
            text: currentText.replace(/\t/g, NBSP.repeat(4)),
        });
    }

    // Je\u015bli nie ma \u017cadnych segment\u00f3w, dodaj pusty segment
    if (segments.length === 0) {
        segments.push({ chord: null, text: '' });
    }

    return segments;
}

