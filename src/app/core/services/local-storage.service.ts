import { Injectable } from '@angular/core';

/**
 * Serwis do bezpiecznej obsługi localStorage.
 * 
 * Opakowanie localStorage w serwis pozwala na:
 * - Obsługę błędów (np. gdy localStorage jest wyłączony)
 * - Łatwiejsze testowanie (mockowanie)
 * - Spójne zarządzanie prefiksami kluczy
 */
@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    private readonly prefix = 'strummerbox:';

    /**
     * Pobiera wartość z localStorage.
     * 
     * @param key - Klucz (bez prefiksu)
     * @returns Wartość jako string lub null jeśli nie istnieje lub wystąpił błąd
     */
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(this.prefix + key);
        } catch {
            console.warn(`LocalStorageService: Unable to read key "${key}"`);
            return null;
        }
    }

    /**
     * Zapisuje wartość w localStorage.
     * 
     * @param key - Klucz (bez prefiksu)
     * @param value - Wartość do zapisania
     * @returns true jeśli zapis się powiódł, false w przeciwnym razie
     */
    setItem(key: string, value: string): boolean {
        try {
            localStorage.setItem(this.prefix + key, value);
            return true;
        } catch {
            console.warn(`LocalStorageService: Unable to write key "${key}"`);
            return false;
        }
    }

    /**
     * Usuwa wartość z localStorage.
     * 
     * @param key - Klucz (bez prefiksu)
     * @returns true jeśli usunięcie się powiodło, false w przeciwnym razie
     */
    removeItem(key: string): boolean {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch {
            console.warn(`LocalStorageService: Unable to remove key "${key}"`);
            return false;
        }
    }
}

