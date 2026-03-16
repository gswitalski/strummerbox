import { describe, expect, it } from 'vitest';
import { TransposeService } from './transpose.service';

describe('TransposeService', () => {
    const service = new TransposeService();

    it('transponuje akord A do B dla offsetu +1', () => {
        const input = '[A]Test';

        const result = service.transposeContent(input, 1);

        expect(result).toBe('[B]Test');
    });

    it('transponuje akord A do G dla offsetu -1', () => {
        const input = '[A]Test';

        const result = service.transposeContent(input, -1);

        expect(result).toBe('[G]Test');
    });

    it('zachowuje sufiksy akordów podczas transpozycji', () => {
        const input = '[Am7]Linia [E/G#]druga';

        const result = service.transposeContent(input, 1);

        expect(result).toBe('[Bm7]Linia [F#/A#]druga');
    });
});
