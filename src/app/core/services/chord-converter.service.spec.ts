import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { ChordConverterService } from './chord-converter.service';

describe('ChordConverterService', () => {
    let service: ChordConverterService;

    // Inicjalizacja środowiska testowego Angular przed wszystkimi testami
    beforeAll(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [ChordConverterService],
        }).compileComponents();

        service = TestBed.inject(ChordConverterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('convertFromChordsOverText', () => {
        it('should return empty string for empty input', () => {
            const result = service.convertFromChordsOverText('');
            expect(result).toBe('');
        });

        it('should return empty string for whitespace-only input', () => {
            const result = service.convertFromChordsOverText('   \n  \n  ');
            expect(result).toBe('');
        });

        it('should convert simple chord-over-text format', () => {
            const input = [
                'C        Am       F         G',
                'To jest przykład piosenki z akordami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');
            // Sprawdź czy tekst jest obecny (z akordami wstawionymi)
            expect(result).toContain('To jest');
            expect(result).toContain('iosenki'); // fragment słowa
            expect(result).toContain('akordami');
        });

        it('should handle multiple verse sections', () => {
            const input = [
                'C        Am',
                'Pierwsza zwrotka',
                '',
                'F        G',
                'Druga zwrotka'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            expect(lines[0]).toContain('[C]');
            expect(lines[0]).toContain('[Am]');
            expect(lines[0]).toContain('Pierwsza');
            expect(lines[0]).toContain('wrotka'); // fragment słowa
            expect(lines[1]).toBe('');
            expect(lines[2]).toContain('[F]');
            expect(lines[2]).toContain('[G]');
            expect(lines[2]).toContain('Druga');
            expect(lines[2]).toContain('otka'); // fragment słowa
        });

        it('should handle chord line without text below', () => {
            const input = 'C  Am  F  G';

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');
        });

        it('should preserve plain text lines', () => {
            const input = [
                'To jest zwykły tekst',
                'Druga linia tekstu',
                'Trzecia linia'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toBe(input);
        });

        it('should handle complex chord notations with modifiers', () => {
            const input = [
                'Am7      Dm9      G#sus4   Cmaj7',
                'Tekst z skomplikowanymi akordami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[Am7]');
            expect(result).toContain('[Dm9]');
            expect(result).toContain('Tekst');
            expect(result).toContain('komplikow'); // fragment słowa
            expect(result).toContain('ako'); // fragment słowa
        });

        it('should handle chords with sharps and flats', () => {
            const input = [
                'C#       Bb       F#m      Eb',
                'Tekst z akordami z krzyżykami i bemolami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C#]');
            expect(result).toContain('[Bb]');
            expect(result).toContain('[F#m]');
            expect(result).toContain('[Eb]');
        });

        it('should position chords at correct text positions', () => {
            const input = [
                'C           Am',
                'Pierwsza    druga'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Akord C powinien być na początku
            expect(result.indexOf('[C]')).toBe(0);

            // Akord Am powinien być gdzieś w okolicy słowa "druga"
            const amIndex = result.indexOf('[Am]');
            const drugaIndex = result.indexOf('druga');
            expect(amIndex).toBeGreaterThan(0);
            expect(amIndex).toBeLessThanOrEqual(drugaIndex);
        });

        it('should handle empty lines between sections', () => {
            const input = [
                'C        Am',
                'Pierwsza linia',
                '',
                '',
                'F        G',
                'Druga linia'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBeGreaterThanOrEqual(4);
            expect(lines[1]).toBe('');
            expect(lines[2]).toBe('');
        });

        it('should handle consecutive chord lines', () => {
            const input = [
                'C  Am  F  G',
                'Dm Em  Am G'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Obie linie powinny zostać rozpoznane jako linie z akordami
            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');
            expect(result).toContain('[Dm]');
            expect(result).toContain('[Em]');
        });

        it('should handle mixed content with chords and regular text', () => {
            const input = [
                'Refren:',
                'C        Am       F         G',
                'To jest refren naszej piosenki',
                '',
                'Zwrotka:',
                'Dm       Em',
                'Tekst zwrotki'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('Refren:');
            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('efren'); // fragment słowa
            expect(result).toContain('iosen'); // fragment słowa
            expect(result).toContain('Zwrotka:');
            expect(result).toContain('[Dm]');
            expect(result).toContain('[Em]');
            expect(result).toContain('Tekst');
            expect(result).toContain('otki'); // fragment słowa
        });

        it('should handle single chord on a line', () => {
            const input = [
                'C',
                'Tekst piosenki'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C]');
            expect(result).toContain('Tekst piosenki');
        });

        it('should handle augmented and diminished chords', () => {
            const input = [
                'Caug     Ddim',
                'Tekst z rzadkimi akordami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[Caug]');
            expect(result).toContain('[Ddim]');
        });

        it('should handle real-world example', () => {
            const input = [
                'Intro:',
                'C  Am  F  G',
                '',
                'Zwrotka 1:',
                'C              Am',
                'Kiedy pada deszcz',
                '    F                G',
                'Chowam się pod dach',
                '',
                'Refren:',
                'Am           F',
                'I śpiewam tę piosenkę',
                'C            G',
                'Dla Ciebie każdego dnia'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Sprawdź czy wszystkie sekcje są zachowane
            expect(result).toContain('Intro:');
            expect(result).toContain('Zwrotka 1:');
            expect(result).toContain('Refren:');

            // Sprawdź czy akordy zostały przekonwertowane
            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');

            // Sprawdź czy fragmenty tekstu są obecne (mogą być rozdzielone akordami)
            expect(result).toContain('Kiedy');
            expect(result).toContain('pada');
            expect(result).toContain('Chow');
            expect(result).toContain('dach');
            expect(result).toContain('śpiewam');
            expect(result).toContain('piosenkę');
            expect(result).toContain('Ciebie');
            expect(result).toContain('dnia');
        });

        it('should not confuse chord-like words with actual chords', () => {
            const input = [
                'To jest normalne zdanie bez akordów.',
                'Kolejna linia z samym tekstem.'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Nie powinny pojawić się żadne nawiasy kwadratowe
            expect(result).not.toContain('[');
            expect(result).not.toContain(']');
            expect(result).toBe(input);
        });

        it('should handle lines with tabs instead of spaces', () => {
            const input = 'C\t\tAm\t\tF\t\tG\nTekst z akordami';

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C]');
            expect(result).toContain('[Am]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');
            expect(result).toContain('ek'); // fragment słowa "Tekst"
            expect(result).toContain('ordami'); // fragment słowa
        });

        it('should handle lowercase chords (European notation)', () => {
            const input = [
                '   C          a      C           a',
                'Ragazzo da Napoli zajechał mirafiori',
                '    C            A7         d  G',
                'Na sam trotuar wjechał kołami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Sprawdź czy wszystkie akordy zostały wykryte
            expect(result).toContain('[C]');
            expect(result).toContain('[a]');
            expect(result).toContain('[A7]');
            expect(result).toContain('[d]');
            expect(result).toContain('[G]');

            // Sprawdź czy fragmenty tekstu są obecne (mogą być rozdzielone akordami)
            expect(result).toContain('Rag'); // fragment "Ragazzo"
            expect(result).toContain('azzo');
            expect(result).toContain('Nap'); // fragment "Napoli"
            expect(result).toContain('oli');
            expect(result).toContain('mirafi'); // fragment "mirafiori"
            expect(result).toContain('ori');
            expect(result).toContain('trotuar');
            expect(result).toContain('kołam'); // fragment słowa "kołami"
        });

        it('should handle mixed case chords in one line', () => {
            const input = [
                'C  a  d  G  e  A',
                'Tekst piosenki z mieszanymi akordami'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[C]');
            expect(result).toContain('[a]');
            expect(result).toContain('[d]');
            expect(result).toContain('[G]');
            expect(result).toContain('[e]');
            expect(result).toContain('[A]');
        });

        it('should not treat Polish word "a" at line start as chord line', () => {
            // Ten test sprawdza przypadek, gdy linia tekstu zaczyna się od polskiego
            // słowa "a" (spójnik), które nie powinno być traktowane jako akord
            const input = [
                'C    a     F   G',
                'a witając zawołali'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Linia "a witając zawołali" powinna być połączona z akordami z poprzedniej linii
            // NIE powinna być traktowana jako linia akordów
            expect(result).toContain('[C]a');
            expect(result).toContain('[a]');
            expect(result).toContain('[F]');
            expect(result).toContain('[G]');
            // Słowa mogą być rozdzielone przez akordy (w zależności od pozycji akordów)
            // więc sprawdzamy fragmenty słów
            expect(result).toContain('wit');
            expect(result).toContain('jąc'); // fragment "witając"
            expect(result).toContain('awoł'); // fragment "zawołali"

            // Upewnij się, że "witając" nie ma wewnątrz fałszywych akordów typu [c]
            // (co by się stało gdyby 'c' w "witając" było wykryte jako akord przez stary kod)
            expect(result).not.toContain('[c]');
        });

        it('should handle Polish diacritics in text without false chord detection', () => {
            // Test sprawdza, że polskie znaki diakrytyczne (ą, ć, ę, ł, ń, ó, ś, ź, ż)
            // nie powodują fałszywego wykrywania akordów w środku słów
            const input = [
                ' C   G      C       C     G        C',
                'Poszli, znaleźli Dzieciątko w żłobie',
                '     C   G     C      C  G     C',
                'z wszystkimi znaki, danymi sobie.',
                ' C    a     F       G',
                'Jako Bogu cześć Mu dali,',
                'C    a     F   G',
                'a witając zawołali',
                '    C       G    C      C       G    C',
                'z wielkiej radości, z wielkiej radości'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            // Sprawdź poprawną konwersję akordów
            expect(result).toContain('[C]');
            expect(result).toContain('[G]');
            expect(result).toContain('[a]');
            expect(result).toContain('[F]');

            // Sprawdź, że fragmenty polskich słów są zachowane (słowa mogą być rozdzielone akordami)
            expect(result).toContain('znal'); // fragment "znaleźli"
            expect(result).toContain('źli'); // fragment "znaleźli"
            expect(result).toContain('Dzi'); // fragment "Dzieciątko" (może być rozdzielone)
            expect(result).toContain('eciąt'); // fragment "Dzieciątko"
            expect(result).toContain('żłobi'); // fragment "żłobie"
            expect(result).toContain('eść'); // fragment "cześć"
            expect(result).toContain('wit'); // fragment "witając"
            expect(result).toContain('awoł'); // fragment "zawołali"
            expect(result).toContain('adośc'); // fragment "radości"

            // Upewnij się, że nie ma fałszywych akordów wykrytych w środku słów
            // (np. 'c' z "witając" nie powinno być akordem)
            const lines = result.split('\n');
            for (const line of lines) {
                // Żadna linia nie powinna zawierać sekwencji typu [a] [a] [c] [a] [a]
                // która wskazywałaby na błędne wykrycie akordów w tekście
                expect(line).not.toMatch(/\[.\] \[.\] \[.\] \[.\] \[.\]/);
            }
        });

        it('should handle chord line followed by text starting with "a"', () => {
            const input = [
                'C    a     F   G',
                'a witając zawołali'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Powinniśmy mieć tylko jedną linię wyniku (akordy połączone z tekstem)
            expect(lines.length).toBe(1);

            // Sprawdź, że tekst "a witając zawołali" jest obecny jako część wyniku
            // Słowa mogą być rozdzielone akordami, więc sprawdzamy fragmenty
            expect(lines[0]).toContain('wit'); // fragment "witając"
            expect(lines[0]).toContain('awoł'); // fragment "zawołali"

            // Sprawdź, że akordy są obecne
            expect(lines[0]).toContain('[C]');
            expect(lines[0]).toContain('[a]');
            expect(lines[0]).toContain('[F]');
            expect(lines[0]).toContain('[G]');
        });
    });

    describe('convertToOverText', () => {
        it('should return empty string for empty input', () => {
            const result = service.convertToOverText('');
            expect(result).toBe('');
        });

        it('should return empty string for whitespace-only input', () => {
            const result = service.convertToOverText('   \n  \n  ');
            expect(result).toBe('');
        });

        it('should convert simple ChordPro format', () => {
            const input = '[C]To jest [Am]przykład [F]piosenki [G]z akordami';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBe(2);
            // Linia akordów powinna zawierać akordy w odpowiednich pozycjach
            expect(lines[0]).toContain('C');
            expect(lines[0]).toContain('Am');
            expect(lines[0]).toContain('F');
            expect(lines[0]).toContain('G');
            // Linia tekstu
            expect(lines[1]).toBe('To jest przykład piosenki z akordami');
        });

        it('should handle multiple lines with chords', () => {
            const input = [
                '[C]Pierwsza [Am]zwrotka',
                '',
                '[F]Druga [G]zwrotka'
            ].join('\n');

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            // Każda linia z akordami staje się dwoma liniami
            expect(lines.length).toBe(5);
            expect(lines[0]).toContain('C');
            expect(lines[0]).toContain('Am');
            expect(lines[1]).toBe('Pierwsza zwrotka');
            expect(lines[2]).toBe('');
            expect(lines[3]).toContain('F');
            expect(lines[3]).toContain('G');
            expect(lines[4]).toBe('Druga zwrotka');
        });

        it('should preserve lines without chords', () => {
            const input = [
                'Refren:',
                '[C]To jest [G]refren',
                '',
                'Zwrotka:'
            ].join('\n');

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines[0]).toBe('Refren:');
            // Linia z akordami rozdzielona na dwie
            expect(lines[1]).toContain('C');
            expect(lines[1]).toContain('G');
            expect(lines[2]).toBe('To jest refren');
            expect(lines[3]).toBe('');
            expect(lines[4]).toBe('Zwrotka:');
        });

        it('should handle chords at the beginning of line', () => {
            const input = '[Am]Kiedy pada deszcz';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBe(2);
            expect(lines[0].startsWith('Am')).toBe(true);
            expect(lines[1]).toBe('Kiedy pada deszcz');
        });

        it('should handle complex chord notations', () => {
            const input = '[Am7]Tekst [Dm9]z [G#sus4]akordami [Cmaj7]złożonymi';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines[0]).toContain('Am7');
            expect(lines[0]).toContain('Dm9');
            expect(lines[0]).toContain('G#sus4');
            expect(lines[0]).toContain('Cmaj7');
            expect(lines[1]).toBe('Tekst z akordami złożonymi');
        });

        it('should handle chords with sharps and flats', () => {
            const input = '[C#]Tekst [Bb]z [F#m]akordami [Eb]chromatycznymi';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines[0]).toContain('C#');
            expect(lines[0]).toContain('Bb');
            expect(lines[0]).toContain('F#m');
            expect(lines[0]).toContain('Eb');
        });

        it('should handle consecutive chords without text between them', () => {
            const input = '[C][Am][F][G]';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBe(2);
            expect(lines[0]).toContain('C');
            expect(lines[0]).toContain('Am');
            expect(lines[0]).toContain('F');
            expect(lines[0]).toContain('G');
            expect(lines[1]).toBe('');
        });

        it('should handle unclosed bracket gracefully', () => {
            const input = '[C]Tekst z [niezamkniętym nawiasem';

            const result = service.convertToOverText(input);

            // Powinien obsłużyć to bez crashu
            expect(result).toBeTruthy();
        });

        it('should position chords correctly over text', () => {
            const input = '[C]To jest [G]tekst';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBe(2);
            // C powinien być na początku
            expect(lines[0].trimStart().startsWith('C')).toBe(true);
            // G powinien być po C
            expect(lines[0].indexOf('G')).toBeGreaterThan(lines[0].indexOf('C'));
            // Tekst powinien być zachowany
            expect(lines[1]).toBe('To jest tekst');
        });

        it('should be inverse of convertFromChordsOverText for simple cases', () => {
            const original = [
                'C       Am      F       G',
                'To jest przykładowy tekst'
            ].join('\n');

            // Konwertuj do ChordPro i z powrotem
            const chordPro = service.convertFromChordsOverText(original);
            const backToOverText = service.convertToOverText(chordPro);

            // Wynikowy tekst powinien zawierać ten sam tekst
            expect(backToOverText).toContain('To jest przykładowy tekst');
            // I te same akordy
            expect(backToOverText).toContain('C');
            expect(backToOverText).toContain('Am');
            expect(backToOverText).toContain('F');
            expect(backToOverText).toContain('G');
        });
    });
});

