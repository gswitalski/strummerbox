import { Injectable } from '@angular/core';
import { FontSize } from '../../shared/models/font-size.model';

/**
 * Serwis do zarządzania wielkością czcionki w localStorage.
 * Zapewnia abstrakcję dla odczytu i zapisu ustawień wielkości czcionki.
 */
@Injectable({
    providedIn: 'root',
})
export class FontSizeService {
    private readonly STORAGE_KEY = 'strummerbox_font_size';
    private readonly DEFAULT_SIZE: FontSize = 'small';
    private readonly VALID_SIZES: FontSize[] = ['small', 'medium', 'large'];

    /**
     * Odczytuje wartość wielkości czcionki z localStorage.
     * Jeśli wartość nie istnieje lub jest nieprawidłowa, zwraca domyślną wartość 'small'.
     * @returns Wielkość czcionki z localStorage lub wartość domyślna
     */
    getFontSize(): FontSize {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);

            if (stored && this.isValidFontSize(stored)) {
                return stored as FontSize;
            }

            return this.DEFAULT_SIZE;
        } catch (error) {
            console.warn('FontSizeService: Nie można odczytać z localStorage', error);
            return this.DEFAULT_SIZE;
        }
    }

    /**
     * Zapisuje wielkość czcionki w localStorage.
     * @param size - Wielkość czcionki do zapisania
     */
    setFontSize(size: FontSize): void {
        try {
            if (!this.isValidFontSize(size)) {
                console.warn(`FontSizeService: Nieprawidłowy rozmiar czcionki: ${size}`);
                return;
            }

            localStorage.setItem(this.STORAGE_KEY, size);
        } catch (error) {
            console.warn('FontSizeService: Nie można zapisać do localStorage', error);
        }
    }

    /**
     * Sprawdza, czy podana wartość jest prawidłową wielkością czcionki.
     * @param value - Wartość do sprawdzenia
     * @returns true jeśli wartość jest prawidłowa, false w przeciwnym razie
     */
    private isValidFontSize(value: string): value is FontSize {
        return this.VALID_SIZES.includes(value as FontSize);
    }
}

