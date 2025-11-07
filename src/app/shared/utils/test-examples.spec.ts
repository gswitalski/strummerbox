/**
 * Plik z przykładami różnych technik testowania w Vitest + Angular
 * Ten plik służy jako dokumentacja i referencyjna
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, computed } from '@angular/core';

/**
 * PRZYKŁAD 1: Testowanie funkcji pomocniczych
 */
describe('Testowanie funkcji pomocniczych', () => {
    function formatPrice(price: number): string {
        return `${price.toFixed(2)} PLN`;
    }

    it('powinien formatować cenę', () => {
        expect(formatPrice(10)).toBe('10.00 PLN');
        expect(formatPrice(10.5)).toBe('10.50 PLN');
    });

    it('powinien zaokrąglać do 2 miejsc', () => {
        expect(formatPrice(10.123)).toBe('10.12 PLN');
    });
});

/**
 * PRZYKŁAD 2: Testowanie z mockami
 */
describe('Testowanie z mockami', () => {
    it('powinien wywołać funkcję callback', () => {
        const callback = vi.fn();

        callback('test');
        callback('test2');

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith('test');
        expect(callback).toHaveBeenLastCalledWith('test2');
    });

    it('powinien zwrócić wartość z mocka', () => {
        const mockFn = vi.fn().mockReturnValue('mocked value');

        const result = mockFn();

        expect(result).toBe('mocked value');
        expect(mockFn).toHaveBeenCalled();
    });

    it('powinien symulować async funkcję', async () => {
        const asyncMock = vi.fn().mockResolvedValue({ data: 'test' });

        const result = await asyncMock();

        expect(result).toEqual({ data: 'test' });
    });

    it('powinien symulować błąd', async () => {
        const errorMock = vi.fn().mockRejectedValue(new Error('Test error'));

        await expect(errorMock()).rejects.toThrow('Test error');
    });
});

/**
 * PRZYKŁAD 3: Testowanie Angular Signals
 */
describe('Testowanie Angular Signals', () => {
    it('powinien aktualizować signal', () => {
        const count = signal(0);

        expect(count()).toBe(0);

        count.set(5);
        expect(count()).toBe(5);

        count.update((val) => val + 1);
        expect(count()).toBe(6);
    });

    it('powinien obliczać computed signal', () => {
        const count = signal(5);
        const doubled = computed(() => count() * 2);

        expect(doubled()).toBe(10);

        count.set(10);
        expect(doubled()).toBe(20);
    });

    it('powinien obsługiwać złożone computed', () => {
        const firstName = signal('Jan');
        const lastName = signal('Kowalski');
        const fullName = computed(() => `${firstName()} ${lastName()}`);

        expect(fullName()).toBe('Jan Kowalski');

        firstName.set('Anna');
        expect(fullName()).toBe('Anna Kowalski');
    });
});

/**
 * PRZYKŁAD 4: Testowanie operacji asynchronicznych
 */
describe('Testowanie async', () => {
    it('powinien poczekać na Promise', async () => {
        const fetchData = async () => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ data: 'test' }), 100);
            });
        };

        const result = await fetchData();

        expect(result).toEqual({ data: 'test' });
    });

    it('powinien obsłużyć błąd async', async () => {
        const fetchError = async () => {
            throw new Error('Network error');
        };

        await expect(fetchError()).rejects.toThrow('Network error');
    });

    it('powinien testować timeout', async () => {
        const delayedFunction = () => {
            return new Promise((resolve) => {
                setTimeout(() => resolve('done'), 1000);
            });
        };

        const result = await delayedFunction();
        expect(result).toBe('done');
    }, 2000); // zwiększony timeout dla testu
});

/**
 * PRZYKŁAD 5: Testowanie z beforeEach i afterEach
 */
describe('Setup i teardown', () => {
    let testData: string[];

    beforeEach(() => {
        // Wykonuje się przed każdym testem
        testData = ['item1', 'item2'];
    });

    it('test 1 - ma dostęp do testData', () => {
        expect(testData).toHaveLength(2);
    });

    it('test 2 - również ma świeże testData', () => {
        testData.push('item3');
        expect(testData).toHaveLength(3);
    });

    it('test 3 - testData są resetowane', () => {
        // testData zostały zresetowane w beforeEach
        expect(testData).toHaveLength(2);
    });
});

/**
 * PRZYKŁAD 6: Testowanie walidacji
 */
describe('Testowanie walidacji', () => {
    function validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    describe('poprawne emaile', () => {
        const validEmails = [
            'test@example.com',
            'user.name@example.com',
            'user+tag@example.co.uk',
        ];

        validEmails.forEach((email) => {
            it(`powinien zaakceptować ${email}`, () => {
                expect(validateEmail(email)).toBe(true);
            });
        });
    });

    describe('niepoprawne emaile', () => {
        const invalidEmails = [
            'invalid',
            '@example.com',
            'user@',
            'user @example.com',
        ];

        invalidEmails.forEach((email) => {
            it(`powinien odrzucić ${email}`, () => {
                expect(validateEmail(email)).toBe(false);
            });
        });
    });
});

/**
 * PRZYKŁAD 7: Testowanie edge cases
 */
describe('Testowanie edge cases', () => {
    function divide(a: number, b: number): number {
        if (b === 0) {
            throw new Error('Division by zero');
        }
        return a / b;
    }

    it('powinien podzielić normalne liczby', () => {
        expect(divide(10, 2)).toBe(5);
    });

    it('powinien obsłużyć liczby ujemne', () => {
        expect(divide(-10, 2)).toBe(-5);
        expect(divide(10, -2)).toBe(-5);
    });

    it('powinien obsłużyć zero jako licznik', () => {
        expect(divide(0, 5)).toBe(0);
    });

    it('powinien rzucić błąd przy dzieleniu przez zero', () => {
        expect(() => divide(10, 0)).toThrow('Division by zero');
    });

    it('powinien obsłużyć bardzo małe liczby', () => {
        expect(divide(0.1, 0.2)).toBeCloseTo(0.5, 5);
    });
});

/**
 * PRZYKŁAD 8: Testowanie z różnymi matcherami
 */
describe('Różne matchery', () => {
    it('equality matchers', () => {
        expect(2 + 2).toBe(4); // ścisła równość
        expect({ a: 1 }).toEqual({ a: 1 }); // głęboka równość
        expect({ a: 1, b: 2 }).toMatchObject({ a: 1 }); // częściowa równość
    });

    it('truthiness matchers', () => {
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
        expect(null).toBeNull();
        expect(undefined).toBeUndefined();
        expect('text').toBeDefined();
    });

    it('number matchers', () => {
        expect(10).toBeGreaterThan(5);
        expect(5).toBeLessThan(10);
        expect(10).toBeGreaterThanOrEqual(10);
        expect(0.1 + 0.2).toBeCloseTo(0.3);
    });

    it('string matchers', () => {
        expect('Hello World').toContain('World');
        expect('test@example.com').toMatch(/^[\w.]+@[\w.]+$/);
    });

    it('array matchers', () => {
        const arr = [1, 2, 3, 4];
        expect(arr).toHaveLength(4);
        expect(arr).toContain(2);
        expect(arr).toEqual(expect.arrayContaining([2, 3]));
    });

    it('object matchers', () => {
        const obj = { name: 'Test', age: 25, active: true };
        expect(obj).toHaveProperty('name');
        expect(obj).toHaveProperty('name', 'Test');
        expect(Object.keys(obj)).toHaveLength(3);
    });
});

/**
 * PRZYKŁAD 9: Testowanie z parametrami (data-driven tests)
 */
describe('Data-driven tests', () => {
    const testCases = [
        { input: 'hello', expected: 'HELLO' },
        { input: 'WORLD', expected: 'WORLD' },
        { input: 'TeSt', expected: 'TEST' },
    ];

    testCases.forEach(({ input, expected }) => {
        it(`powinien przekonwertować "${input}" na "${expected}"`, () => {
            expect(input.toUpperCase()).toBe(expected);
        });
    });
});

/**
 * PRZYKŁAD 10: Testowanie z spy
 */
describe('Testowanie z spy', () => {
    class Logger {
        log(message: string) {
            console.log(message);
        }

        error(message: string) {
            console.error(message);
        }
    }

    it('powinien wywołać metodę log', () => {
        const logger = new Logger();
        const logSpy = vi.spyOn(logger, 'log');

        logger.log('test message');

        expect(logSpy).toHaveBeenCalledWith('test message');
    });

    it('powinien zastąpić implementację', () => {
        const logger = new Logger();
        const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {
            // niestandardowa implementacja
        });

        logger.log('test');

        expect(logSpy).toHaveBeenCalled();
    });
});

