import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeAll } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { SongDisplayComponent } from './song-display.component';

describe('SongDisplayComponent', () => {
    // Inicjalizacja środowiska testowego Angular przed wszystkimi testami
    beforeAll(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );
    });

    /**
     * Funkcja pomocnicza do konfiguracji i renderowania komponentu z treścią
     */
    async function setupComponent(content: string, showChords = false) {
        await TestBed.configureTestingModule({
            imports: [SongDisplayComponent, NoopAnimationsModule],
        }).compileComponents();

        const fixture = TestBed.createComponent(SongDisplayComponent);
        fixture.componentRef.setInput('content', content);
        fixture.componentRef.setInput('showChords', showChords);
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;

        return { fixture, compiled };
    }

    describe('Renderowanie wskaźnika repetycji', () => {
        it('powinien wyrenderować wskaźnik × 2 dla dyrektywy {c: x2}', async () => {
            const content = 'La la la {c: x2}';

            const { compiled } = await setupComponent(content);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).not.toBeNull();
            expect(repetitionMarker?.textContent?.trim()).toBe('× 2');
        });

        it('powinien wyrenderować wskaźnik × 3 dla linii z akordami i dyrektywą', async () => {
            const content = '[C]Tekst [Am]piosenki {c: x3}';

            const { compiled } = await setupComponent(content);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).not.toBeNull();
            expect(repetitionMarker?.textContent?.trim()).toBe('× 3');

            // Sprawdź że tekst jest wyrenderowany
            const lyrics = compiled.querySelector('.song-display__lyrics');
            expect(lyrics?.textContent).toContain('Tekst');
            expect(lyrics?.textContent).toContain('piosenki');
        });

        it('powinien wyrenderować wskaźnik × 10 dla wielocyfrowej liczby', async () => {
            const content = 'Refren {c: x10}';

            const { compiled } = await setupComponent(content);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).not.toBeNull();
            expect(repetitionMarker?.textContent?.trim()).toBe('× 10');
        });

        it('powinien wyrenderować wskaźnik dla linii z samymi akordami', async () => {
            const content = '[C]  [Am]  [F]  [G] {c: x2}';

            const { compiled } = await setupComponent(content, true);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).not.toBeNull();
            expect(repetitionMarker?.textContent?.trim()).toBe('× 2');

            // Sprawdź że akordy są wyrenderowane
            const chords = compiled.querySelector('.song-display__chords');
            expect(chords?.textContent).toContain('C');
            expect(chords?.textContent).toContain('Am');
        });

        it('NIE powinien wyrenderować wskaźnika repetycji dla zwykłej linii', async () => {
            const content = 'Zwykły tekst bez repetycji';

            const { compiled } = await setupComponent(content);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).toBeNull();

            // Sprawdź że tekst jest wyrenderowany
            const lyrics = compiled.querySelector('.song-display__lyrics');
            expect(lyrics?.textContent).toContain('Zwykły tekst bez repetycji');
        });

        it('powinien obsługiwać dyrektywę {c:x2} bez spacji', async () => {
            const content = 'Tekst {c:x2}';

            const { compiled } = await setupComponent(content);

            const repetitionMarker = compiled.querySelector('.song-display__repetition-marker');
            expect(repetitionMarker).not.toBeNull();
            expect(repetitionMarker?.textContent?.trim()).toBe('× 2');
        });

        it('powinien usunąć dyrektywę z tekstu po wyodrębnieniu', async () => {
            const content = 'Śpiewaj głośno {c: x2}';

            const { compiled } = await setupComponent(content);

            const lyrics = compiled.querySelector('.song-display__lyrics');
            // Tekst nie powinien zawierać dyrektywy {c: x2}
            expect(lyrics?.textContent).not.toContain('{c:');
            expect(lyrics?.textContent).toContain('Śpiewaj głośno');
            expect(lyrics?.textContent).toContain('× 2'); // wskaźnik powinien być częścią lyrics span
        });

        it('powinien wyrenderować wieloliniową piosenkę z repetycją na różnych liniach', async () => {
            const content = `[C]Pierwsza linia
[G]Druga linia {c: x2}
Trzecia linia {c: x3}`;

            const { compiled } = await setupComponent(content, true);

            const repetitionMarkers = compiled.querySelectorAll('.song-display__repetition-marker');
            expect(repetitionMarkers.length).toBe(2);

            const markerTexts = Array.from(repetitionMarkers).map(m => m.textContent?.trim());
            expect(markerTexts).toContain('× 2');
            expect(markerTexts).toContain('× 3');
        });
    });

    describe('Renderowanie podstawowe', () => {
        it('powinien wyrenderować pusty komponent gdy content jest null', async () => {
            const { compiled } = await setupComponent('');

            const emptyMessage = compiled.querySelector('.song-display__empty');
            expect(emptyMessage).not.toBeNull();
        });

        it('powinien wyrenderować tekst bez akordów', async () => {
            const content = 'Zwykły tekst piosenki';

            const { compiled } = await setupComponent(content);

            const lyrics = compiled.querySelector('.song-display__lyrics');
            expect(lyrics?.textContent).toContain('Zwykły tekst piosenki');
        });

        it('powinien wyrenderować akordy gdy showChords jest true', async () => {
            const content = '[C]Tekst z [G]akordami';

            const { compiled } = await setupComponent(content, true);

            const chords = compiled.querySelector('.song-display__chords');
            expect(chords?.textContent).toContain('C');
            expect(chords?.textContent).toContain('G');
        });

        it('NIE powinien wyrenderować akordów gdy showChords jest false', async () => {
            const content = '[C]Tekst z [G]akordami';

            const { compiled } = await setupComponent(content, false);

            const chords = compiled.querySelector('.song-display__chords');
            expect(chords).toBeNull();
        });
    });
});

