import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Signal,
    computed,
    input,
} from '@angular/core';

interface LyricsLine {
    type: 'lyrics';
    chordLine: string;
    lyricLine: string;
}

interface DirectiveLine {
    type: 'directive';
    content: string;
}

interface CommentLine {
    type: 'comment';
    content: string;
}

interface EmptyLine {
    type: 'empty';
}

type ChordProLine = LyricsLine | DirectiveLine | CommentLine | EmptyLine;

const NBSP = '\u00A0';

@Component({
    selector: 'stbo-chord-pro-preview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chord-pro-preview.component.html',
    styleUrl: './chord-pro-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChordProPreviewComponent {
    public readonly content = input.required<string>();

    private readonly parsedLines: Signal<ChordProLine[]> = computed(() =>
        parseChordPro(this.content() ?? '')
    );

    public readonly hasContent: Signal<boolean> = computed(
        () => this.content()?.trim().length > 0
    );

    public readonly lines: Signal<ChordProLine[]> = computed(
        () => this.parsedLines()
    );

    public readonly nbsp = NBSP;
}

const parseChordPro = (rawContent: string): ChordProLine[] => {
    if (!rawContent) {
        return [];
    }

    return rawContent.split(/\r?\n/).map((line) => parseLine(line));
};

const parseLine = (line: string): ChordProLine => {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
        return {
            type: 'empty',
        };
    }

    if (trimmed.startsWith('#')) {
        return {
            type: 'comment',
            content: trimmed.slice(1).trim(),
        };
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return {
            type: 'directive',
            content: trimmed.slice(1, -1).trim(),
        };
    }

    const chordLine = buildChordLine(line);
    const lyricLine = line
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\t/g, NBSP.repeat(4));

    return {
        type: 'lyrics',
        chordLine,
        lyricLine,
    };
};

const buildChordLine = (line: string): string => {
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
};

