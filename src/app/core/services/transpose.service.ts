import { Injectable } from '@angular/core';

/**
 * Skala chromatyczna z użyciem krzyżyków (#)
 * Używana jako domyślna reprezentacja
 */
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Skala chromatyczna z użyciem bemoli (b)
 * Używana gdy oryginalny akord zawiera bemol
 */
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Mapowanie nazw nut na indeksy w skali chromatycznej
 */
const NOTE_TO_INDEX: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 0,
};

/**
 * Regex do parsowania pojedynczego akordu.
 * Dopasowuje:
 * - Nutę bazową (A-G lub a-g)
 * - Opcjonalny modyfikator (#, b)
 * - Opcjonalny sufiks (m, maj7, 7, sus4, dim, aug, add9, itp.)
 * - Opcjonalny bas po / (np. /E, /F#)
 */
const CHORD_REGEX = /^([A-Ga-g])([#b])?(.*)$/;

/**
 * Regex do wykrywania basu w akordzie (np. C/E -> bas to E)
 */
const BASS_REGEX = /^(.*)\/([A-Ga-g][#b]?)$/;

/**
 * Serwis odpowiedzialny za transpozycję akordów w treści ChordPro.
 * Transpozycja to przesunięcie wszystkich akordów o określoną liczbę półtonów.
 *
 * @example
 * // Transponuj treść o 2 półtony w górę
 * const transposed = transposeService.transposeContent('[Am]Hello [G]World', 2);
 * // Wynik: '[Bm]Hello [A]World'
 */
@Injectable({
    providedIn: 'root',
})
export class TransposeService {
    /**
     * Transponuje całą treść piosenki w formacie ChordPro.
     * Znajduje wszystkie akordy w nawiasach kwadratowych i przesuwa je o podany offset.
     *
     * @param content - Treść piosenki w formacie ChordPro
     * @param offset - Liczba półtonów do przesunięcia (dodatnia = w górę, ujemna = w dół)
     * @returns Treść z transponowanymi akordami
     */
    public transposeContent(content: string, offset: number): string {
        if (!content || offset === 0) {
            return content;
        }

        // Normalizuj offset do zakresu -11..11
        const normalizedOffset = ((offset % 12) + 12) % 12;

        // Znajdź wszystkie akordy w nawiasach kwadratowych i je transponuj
        return content.replace(/\[([^\]]+)\]/g, (match, chord: string) => {
            const transposed = this.transposeChord(chord, normalizedOffset);
            return `[${transposed}]`;
        });
    }

    /**
     * Transponuje pojedynczy akord o podany offset.
     *
     * @param chord - Akord do transpozycji (np. "Am", "C#m7", "G/B")
     * @param offset - Liczba półtonów (0-11, już znormalizowana)
     * @returns Transponowany akord lub oryginalny string jeśli nie udało się sparsować
     */
    private transposeChord(chord: string, offset: number): string {
        const trimmedChord = chord.trim();

        if (!trimmedChord) {
            return chord;
        }

        // Sprawdź czy akord ma bas (np. C/E)
        const bassMatch = trimmedChord.match(BASS_REGEX);
        if (bassMatch) {
            const mainChord = bassMatch[1];
            const bassNote = bassMatch[2];
            const transposedMain = this.transposeSingleChord(mainChord, offset);
            const transposedBass = this.transposeSingleNote(bassNote, offset);
            return `${transposedMain}/${transposedBass}`;
        }

        return this.transposeSingleChord(trimmedChord, offset);
    }

    /**
     * Transponuje pojedynczy akord bez basu.
     */
    private transposeSingleChord(chord: string, offset: number): string {
        const match = chord.match(CHORD_REGEX);

        if (!match) {
            // Nie udało się sparsować - zwróć oryginał (może to komentarz w nawiasach)
            return chord;
        }

        const [, rootNote, modifier, suffix] = match;
        const normalizedRoot = rootNote.toUpperCase();
        const fullNote = modifier ? `${normalizedRoot}${modifier}` : normalizedRoot;

        const noteIndex = NOTE_TO_INDEX[fullNote];

        if (noteIndex === undefined) {
            // Nieznana nuta - zwróć oryginał
            return chord;
        }

        // Oblicz nowy indeks
        const newIndex = (noteIndex + offset) % 12;

        // Wybierz skalę (krzyżyki lub bemole) w zależności od oryginału
        const useFlats = modifier === 'b';
        const scale = useFlats ? FLAT_NOTES : SHARP_NOTES;
        const newNote = scale[newIndex];

        // Zachowaj oryginalną wielkość litery
        const finalNote = rootNote === rootNote.toLowerCase()
            ? newNote.toLowerCase()
            : newNote;

        return `${finalNote}${suffix}`;
    }

    /**
     * Transponuje pojedynczą nutę (używane dla basu).
     */
    private transposeSingleNote(note: string, offset: number): string {
        const normalizedNote = note[0].toUpperCase() + note.slice(1);
        const noteIndex = NOTE_TO_INDEX[normalizedNote];

        if (noteIndex === undefined) {
            return note;
        }

        const newIndex = (noteIndex + offset) % 12;
        const useFlats = note.includes('b');
        const scale = useFlats ? FLAT_NOTES : SHARP_NOTES;
        const newNote = scale[newIndex];

        // Zachowaj oryginalną wielkość litery
        return note[0] === note[0].toLowerCase()
            ? newNote.toLowerCase()
            : newNote;
    }
}

