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

        it('should handle chord line followed by empty line (not merge with it)', () => {
            // Bug fix: linia akordów po której następuje pusta linia
            // nie powinna być łączona z pustą linią
            const input = [
                'A f# E',
                '',
                ' A                      f#',
                'Nie płacz Ewka, bo tu miejsca brak'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Linia 1: akordy z podwójnymi spacjami
            expect(lines[0]).toContain('[A]');
            expect(lines[0]).toContain('[f#]');
            expect(lines[0]).toContain('[E]');
            // Akordy powinny być rozdzielone podwójnymi spacjami
            expect(lines[0]).toMatch(/\[A\]\s{2,}\[f#\]\s{2,}\[E\]/);

            // Linia 2: pusta linia zachowana (z inputu, NIE dodana automatycznie)
            expect(lines[1]).toBe('');

            // Linia 3: akordy połączone z tekstem
            // Akordy są wstawiane w pozycjach z linii akordowej,
            // więc słowa mogą być rozdzielone przez akordy
            expect(lines[2]).toContain('[A]');
            expect(lines[2]).toContain('[f#]');
            // Sprawdzamy fragmenty słów bo akordy mogą być wstawione w środku
            expect(lines[2]).toContain('ie płacz Ewka');
            expect(lines[2]).toContain('ejsca brak'); // akord [f#] jest wstawiany w środku "miejsca"

            // Sprawdzamy że mamy dokładnie 3 linie (nie 4!)
            expect(lines.length).toBe(3);
        });

        it('should preserve empty line between standalone chord line and text', () => {
            // Pusta linia jest w inputcie - powinna być zachowana (akordy NIE są łączone z tekstem)
            const input = [
                'C Am F G',
                '',
                'Tekst bez akordów'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            expect(lines.length).toBe(3);
            // Linia 1: samodzielne akordy (bo pusta linia pod spodem)
            expect(lines[0]).toContain('[C]');
            expect(lines[0]).toContain('[Am]');
            // Linia 2: pusta linia zachowana z inputu
            expect(lines[1]).toBe('');
            // Linia 3: tekst bez akordów
            expect(lines[2]).toBe('Tekst bez akordów');
        });

        it('should merge chord line with text below when no empty line between them', () => {
            // Brak pustej linii - linia akordów odnosi się do tekstu pod nią
            // To jest podstawowe założenie formatu "akordy nad tekstem"
            const input = [
                'C Am F G',
                'Tekst bez akordów'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Powinna być 1 linia - akordy połączone z tekstem
            expect(lines.length).toBe(1);
            expect(lines[0]).toContain('[C]');
            expect(lines[0]).toContain('[Am]');
            expect(lines[0]).toContain('[F]');
            expect(lines[0]).toContain('[G]');
            // Słowa mogą być rozdzielone przez akordy, sprawdzamy fragmenty
            expect(lines[0]).toContain('kst'); // fragment "Tekst"
            expect(lines[0]).toContain('akordów');
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

        it('should handle consecutive chord lines as standalone (no text below)', () => {
            // Dwie linie akordów pod sobą - obie są "akordami bez tekstu"
            const input = [
                'C  Am  F  G',
                'Dm Em  Am G'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Obie linie powinny być samodzielnymi liniami akordów
            expect(lines.length).toBe(2);
            expect(lines[0]).toContain('[C]');
            expect(lines[0]).toContain('[Am]');
            expect(lines[1]).toContain('[Dm]');
            expect(lines[1]).toContain('[Em]');
        });

        it('should handle two chord lines followed by empty line then text', () => {
            // Dwie linie akordów, pusta linia, tekst
            // Obie linie akordów są "bez tekstu", pusta linia zachowana, tekst bez zmian
            const input = [
                'A f# E',
                'C Am F G',
                '',
                'Tekst bez akordów'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Oczekujemy 4 linie: akordy1, akordy2, pusta, tekst
            expect(lines.length).toBe(4);
            expect(lines[0]).toContain('[A]');
            expect(lines[0]).toContain('[f#]');
            expect(lines[0]).toContain('[E]');
            expect(lines[1]).toContain('[C]');
            expect(lines[1]).toContain('[Am]');
            expect(lines[2]).toBe('');
            expect(lines[3]).toBe('Tekst bez akordów');
        });

        it('should NOT add empty line between chord-only line and chord+text pair', () => {
            // Linia akordów, potem linia akordów z tekstem pod spodem
            // NIE dodawać pustej linii automatycznie!
            const input = [
                'A f# E',
                ' A                      f#',
                'Nie płacz Ewka, bo tu miejsca brak'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);
            const lines = result.split('\n');

            // Oczekujemy 2 linie: samodzielne akordy, potem akordy+tekst
            // BEZ automatycznej pustej linii między nimi!
            expect(lines.length).toBe(2);
            expect(lines[0]).toContain('[A]');
            expect(lines[0]).toContain('[f#]');
            expect(lines[0]).toContain('[E]');
            expect(lines[1]).toContain('[A]');
            expect(lines[1]).toContain('[f#]');
            expect(lines[1]).toContain('ie płacz Ewka');
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

        it('should handle chords with asterisk notation (G*)', () => {
            // Gwiazdka jest używana do oznaczania szczególnych wariacji akordu
            const input = [
                'G*       C        D*       A',
                'Tekst z akordami z gwiazdką'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[G*]');
            expect(result).toContain('[C]');
            expect(result).toContain('[D*]');
            expect(result).toContain('[A]');
            expect(result).toContain('Tekst');
            expect(result).toContain('gwiazdką');
        });

        it('should handle mixed asterisk chords with modifiers (Am7*, C#*)', () => {
            const input = [
                'Am7*     C#*      Dm*      Gsus4*',
                'Tekst z różnymi akordami z gwiazdką'
            ].join('\n');

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[Am7*]');
            expect(result).toContain('[C#*]');
            expect(result).toContain('[Dm*]');
            expect(result).toContain('[Gsus4*]');
        });

        it('should handle standalone chord line with asterisks', () => {
            const input = 'G*  Am*  D*  C';

            const result = service.convertFromChordsOverText(input);

            expect(result).toContain('[G*]');
            expect(result).toContain('[Am*]');
            expect(result).toContain('[D*]');
            expect(result).toContain('[C]');
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

        // ========== Testy konwersji znacznika repetycji xN → {c: xN} ==========

        describe('repetition marker conversion (xN → {c: xN})', () => {
            it('should convert x2 at end of text line to ChordPro directive', () => {
                const input = 'La la la x2';

                const result = service.convertFromChordsOverText(input);

                expect(result).toBe('La la la {c: x2}');
            });

            it('should convert x3 at end of chord+text line', () => {
                const input = [
                    'C        Am',
                    'Tekst piosenki x3'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);

                expect(result).toContain('[C]');
                expect(result).toContain('[Am]');
                expect(result).toContain('{c: x3}');
                // Sprawdź poprawny format dyrektywy ze spacją
                expect(result).toMatch(/\{c: x3\}$/);
            });

            it('should convert x2 at end of standalone chord line', () => {
                const input = 'C  Am  F  G x2';

                const result = service.convertFromChordsOverText(input);

                expect(result).toContain('[C]');
                expect(result).toContain('[Am]');
                expect(result).toContain('[F]');
                expect(result).toContain('[G]');
                expect(result).toContain('{c: x2}');
            });

            it('should handle multiple digit repetition like x10', () => {
                const input = 'Refren x10';

                const result = service.convertFromChordsOverText(input);

                expect(result).toBe('Refren {c: x10}');
            });

            it('should NOT convert "extra" (word ending with x) as repetition', () => {
                const input = 'This is extra';

                const result = service.convertFromChordsOverText(input);

                expect(result).toBe('This is extra');
                expect(result).not.toContain('{c:');
            });

            it('should NOT convert "x" without number as repetition', () => {
                const input = 'Test x';

                const result = service.convertFromChordsOverText(input);

                expect(result).toBe('Test x');
                expect(result).not.toContain('{c:');
            });

            it('should NOT convert x2 in the middle of line', () => {
                const input = 'Śpiewaj x2 razy głośniej';

                const result = service.convertFromChordsOverText(input);

                // x2 w środku linii nie powinno być konwertowane
                expect(result).toBe('Śpiewaj x2 razy głośniej');
                expect(result).not.toContain('{c:');
            });

            it('should handle uppercase X2 as repetition marker', () => {
                const input = 'La la la X2';

                const result = service.convertFromChordsOverText(input);

                expect(result).toBe('La la la {c: X2}');
            });

            it('should preserve repetition marker through chord conversion', () => {
                const input = [
                    'C    G     C',
                    'Lalala x2'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);

                expect(result).toContain('[C]');
                expect(result).toContain('[G]');
                // Tekst "Lalala" może być rozdzielony przez akordy, sprawdzamy fragmenty
                expect(result).toContain('Lala');
                expect(result).toContain('{c: x2}');
                // Dyrektywa powinna być na końcu linii
                expect(result).toMatch(/\{c: x2\}$/);
            });
        });

        // ========== Testy konwersji wielowierszowych powtórzeń xN(L) → {block_start}/{block_end} ==========

        describe('multiline repetition conversion (xN(L) → block directives)', () => {
            it('should convert x2(4) to block directives for 4 lines', () => {
                const input = [
                    'Linia 1',
                    'Linia 2',
                    'Linia 3',
                    'Linia 4 x2(4)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);
                const lines = result.split('\n');

                expect(lines[0]).toBe('{block_start: x2}');
                expect(lines[1]).toBe('Linia 1');
                expect(lines[2]).toBe('Linia 2');
                expect(lines[3]).toBe('Linia 3');
                expect(lines[4]).toBe('Linia 4');
                expect(lines[5]).toBe('{block_end}');
            });

            it('should convert x3(2) to block directives for 2 lines', () => {
                const input = [
                    'Pierwsza linia',
                    'Druga linia x3(2)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);
                const lines = result.split('\n');

                expect(lines[0]).toBe('{block_start: x3}');
                expect(lines[1]).toBe('Pierwsza linia');
                expect(lines[2]).toBe('Druga linia');
                expect(lines[3]).toBe('{block_end}');
            });

            it('should handle x2(4) with chords over text', () => {
                const input = [
                    'C       Am',
                    'Linia pierwsza',
                    'F       G',
                    'Linia druga x2(2)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);

                expect(result).toContain('{block_start: x2}');
                expect(result).toContain('{block_end}');
                expect(result).toContain('[C]');
                expect(result).toContain('[Am]');
                expect(result).toContain('[F]');
                expect(result).toContain('[G]');
            });

            it('should handle x2(1) for single line repeat block', () => {
                const input = 'Powtórz mnie x2(1)';

                const result = service.convertFromChordsOverText(input);
                const lines = result.split('\n');

                expect(lines[0]).toBe('{block_start: x2}');
                expect(lines[1]).toBe('Powtórz mnie');
                expect(lines[2]).toBe('{block_end}');
            });

            it('should handle L greater than available lines (use all available)', () => {
                const input = [
                    'Linia 1',
                    'Linia 2 x2(10)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);
                const lines = result.split('\n');

                // Powinno użyć wszystkich dostępnych linii (2)
                expect(lines[0]).toBe('{block_start: x2}');
                expect(lines[1]).toBe('Linia 1');
                expect(lines[2]).toBe('Linia 2');
                expect(lines[3]).toBe('{block_end}');
            });

            it('should handle multiple repeat blocks in one song', () => {
                const input = [
                    'Refren linia 1',
                    'Refren linia 2 x2(2)',
                    '',
                    'Zwrotka linia 1',
                    'Zwrotka linia 2',
                    'Zwrotka linia 3 x3(3)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);

                // Sprawdź czy oba bloki są obecne
                const blockStarts = (result.match(/\{block_start:/g) || []).length;
                const blockEnds = (result.match(/\{block_end\}/g) || []).length;

                expect(blockStarts).toBe(2);
                expect(blockEnds).toBe(2);
                expect(result).toContain('{block_start: x2}');
                expect(result).toContain('{block_start: x3}');
            });

            it('should NOT convert x2 without (L) as multiline block', () => {
                const input = 'Linia z powtórzeniem x2';

                const result = service.convertFromChordsOverText(input);

                // Powinno użyć standardowej konwersji do {c: x2}
                expect(result).toBe('Linia z powtórzeniem {c: x2}');
                expect(result).not.toContain('{block_start:');
                expect(result).not.toContain('{block_end}');
            });

            it('should handle uppercase X2(3)', () => {
                const input = [
                    'Linia 1',
                    'Linia 2',
                    'Linia 3 X2(3)'
                ].join('\n');

                const result = service.convertFromChordsOverText(input);

                expect(result).toContain('{block_start: x2}');
                expect(result).toContain('{block_end}');
            });
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

        it('should handle standalone chords without text (no empty line added)', () => {
            // Samodzielne akordy bez tekstu - NIE dodawać pustej linii pod spodem
            const input = '[C][Am][F][G]';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            // Tylko 1 linia - same akordy, BEZ pustej linii pod spodem
            expect(lines.length).toBe(1);
            expect(lines[0]).toContain('C');
            expect(lines[0]).toContain('Am');
            expect(lines[0]).toContain('F');
            expect(lines[0]).toContain('G');
            expect(lines[0]).toMatch(/C\s{2,}Am\s{2,}F\s{2,}G/);
        });

        it('should handle standalone chords with spacing', () => {
            // Samodzielne akordy z spacjami - zachowaj co najmniej podwójny odstęp
            const input = '[A]  [f#]  [E]';

            const result = service.convertToOverText(input);
            const lines = result.split('\n');

            // Tylko 1 linia - same akordy, BEZ pustej linii pod spodem
            expect(lines.length).toBe(1);
            expect(lines[0]).toContain('A');
            expect(lines[0]).toContain('f#');
            expect(lines[0]).toContain('E');
            expect(lines[0]).toMatch(/A\s{2,}f#\s{2,}E/);
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

        // ========== Testy konwersji dyrektywy repetycji {c: xN} → xN ==========

        describe('repetition directive conversion ({c: xN} → xN)', () => {
            it('should convert {c: x2} directive back to x2 marker', () => {
                const input = 'La la la {c: x2}';

                const result = service.convertToOverText(input);

                expect(result).toBe('La la la x2');
            });

            it('should convert {c: x3} in line with chords', () => {
                const input = '[C]Tekst [Am]piosenki {c: x3}';

                const result = service.convertToOverText(input);
                const lines = result.split('\n');

                expect(lines.length).toBe(2);
                expect(lines[0]).toContain('C');
                expect(lines[0]).toContain('Am');
                expect(lines[1]).toBe('Tekst piosenki x3');
            });

            it('should convert {c: x2} in standalone chord line', () => {
                const input = '[C]  [Am]  [F]  [G] {c: x2}';

                const result = service.convertToOverText(input);

                expect(result).toContain('C');
                expect(result).toContain('Am');
                expect(result).toContain('F');
                expect(result).toContain('G');
                expect(result).toContain('x2');
            });

            it('should handle {c:x2} without space', () => {
                const input = 'La la la {c:x2}';

                const result = service.convertToOverText(input);

                expect(result).toBe('La la la x2');
            });

            it('should handle {c: x10} with multiple digits', () => {
                const input = 'Refren {c: x10}';

                const result = service.convertToOverText(input);

                expect(result).toBe('Refren x10');
            });

            it('should be inverse of convertFromChordsOverText for repetition markers', () => {
                const original = [
                    'C       Am      F       G',
                    'Śpiewaj razem x2'
                ].join('\n');

                // Konwertuj do ChordPro i z powrotem
                const chordPro = service.convertFromChordsOverText(original);
                expect(chordPro).toContain('{c: x2}');

                const backToOverText = service.convertToOverText(chordPro);

                // Wynikowy tekst powinien zawierać x2 (nie {c: x2})
                expect(backToOverText).toContain('x2');
                expect(backToOverText).not.toContain('{c:');
                // Tekst może być rozdzielony przez akordy, sprawdzamy fragmenty
                expect(backToOverText).toContain('Śpiewaj');
                expect(backToOverText).toContain('razem');
            });
        });

        // ========== Testy konwersji dyrektyw blokowych {block_start}/{block_end} → xN(L) ==========

        describe('block directives conversion ({block_start}/{block_end} → xN(L))', () => {
            it('should convert block directives back to xN(L) format', () => {
                const input = [
                    '{block_start: x2}',
                    'Linia 1',
                    'Linia 2',
                    'Linia 3',
                    'Linia 4',
                    '{block_end}'
                ].join('\n');

                const result = service.convertToOverText(input);

                expect(result).toContain('x2(4)');
                expect(result).not.toContain('{block_start');
                expect(result).not.toContain('{block_end}');
            });

            it('should convert x3(2) block directives', () => {
                const input = [
                    '{block_start: x3}',
                    'Pierwsza linia',
                    'Druga linia',
                    '{block_end}'
                ].join('\n');

                const result = service.convertToOverText(input);

                expect(result).toContain('Druga linia x3(2)');
            });

            it('should handle block with chords', () => {
                const input = [
                    '{block_start: x2}',
                    '[C]Linia [Am]pierwsza',
                    '[F]Linia [G]druga',
                    '{block_end}'
                ].join('\n');

                const result = service.convertToOverText(input);

                // Powinien mieć akordy nad tekstem
                expect(result).toContain('C');
                expect(result).toContain('Am');
                expect(result).toContain('F');
                expect(result).toContain('G');
                // I znacznik xN(L) na końcu
                expect(result).toContain('x2(2)');
            });

            it('should handle block_start with spaces', () => {
                const input = [
                    '{block_start:   x2  }',
                    'Linia 1',
                    '{block_end}'
                ].join('\n');

                const result = service.convertToOverText(input);

                expect(result).toContain('x2(1)');
            });

            it('should ignore unmatched {block_end}', () => {
                const input = [
                    'Linia 1',
                    '{block_end}',
                    'Linia 2'
                ].join('\n');

                const result = service.convertToOverText(input);

                expect(result).toContain('Linia 1');
                expect(result).toContain('Linia 2');
                expect(result).not.toContain('{block_end}');
            });

            it('should handle unclosed {block_start} (no xN(L) added)', () => {
                const input = [
                    '{block_start: x2}',
                    'Linia 1',
                    'Linia 2'
                ].join('\n');

                const result = service.convertToOverText(input);

                // Bez {block_end} nie powinno być xN(L)
                expect(result).not.toContain('x2(');
                expect(result).toContain('Linia 1');
                expect(result).toContain('Linia 2');
            });

            it('should be inverse of convertFromChordsOverText for multiline repeats', () => {
                const original = [
                    'Linia 1',
                    'Linia 2',
                    'Linia 3',
                    'Linia 4 x2(4)'
                ].join('\n');

                // Konwertuj do ChordPro i z powrotem
                const chordPro = service.convertFromChordsOverText(original);
                expect(chordPro).toContain('{block_start: x2}');
                expect(chordPro).toContain('{block_end}');

                const backToOverText = service.convertToOverText(chordPro);

                // Wynikowy tekst powinien zawierać xN(L)
                expect(backToOverText).toContain('x2(4)');
                expect(backToOverText).not.toContain('{block_start');
                expect(backToOverText).not.toContain('{block_end}');
                expect(backToOverText).toContain('Linia 1');
                expect(backToOverText).toContain('Linia 4');
            });

            it('should handle multiple block directives', () => {
                const input = [
                    '{block_start: x2}',
                    'Refren linia 1',
                    'Refren linia 2',
                    '{block_end}',
                    '',
                    '{block_start: x3}',
                    'Zwrotka linia 1',
                    'Zwrotka linia 2',
                    'Zwrotka linia 3',
                    '{block_end}'
                ].join('\n');

                const result = service.convertToOverText(input);

                expect(result).toContain('x2(2)');
                expect(result).toContain('x3(3)');
            });
        });
    });
});
