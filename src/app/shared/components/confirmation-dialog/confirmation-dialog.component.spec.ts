import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
    // Inicjalizacja środowiska testowego Angular przed wszystkimi testami
    beforeAll(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );
    });

    /**
     * Funkcja pomocnicza do konfiguracji i renderowania komponentu z danymi testowymi
     * @param testData - dane dialogu do przetestowania
     * @returns obiekt zawierający fixture, compiled HTML oraz mockDialogRef
     */
    async function setupComponentWithData(testData: ConfirmationDialogData) {
        const mockDialogRef = { close: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [ConfirmationDialogComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: testData },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(ConfirmationDialogComponent);
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;

        return { fixture, compiled, mockDialogRef };
    }

    describe('Renderowanie', () => {
        it('powinien poprawnie wyświetlić tytuł i treść wiadomości', async () => {
            // Arrange - przygotowanie danych testowych
            const testData: ConfirmationDialogData = {
                title: 'Testowy Tytuł',
                message: 'To jest testowa wiadomość',
            };

            // Act - wyrenderowanie komponentu
            const { compiled } = await setupComponentWithData(testData);

            // Assert - sprawdzenie czy tytuł i treść są widoczne
            const titleElement = compiled.querySelector('h2[mat-dialog-title]');
            expect(titleElement?.textContent?.trim()).toBe('Testowy Tytuł');

            const contentElement = compiled.querySelector('mat-dialog-content');
            expect(contentElement?.textContent?.trim()).toBe('To jest testowa wiadomość');
        });

        it('powinien wyświetlić domyślne etykiety przycisków, gdy nie są podane', async () => {
            // Arrange - przygotowanie danych bez niestandardowych etykiet
            const testData: ConfirmationDialogData = {
                title: 'Tytuł',
                message: 'Wiadomość',
            };

            // Act - wyrenderowanie komponentu
            const { compiled } = await setupComponentWithData(testData);

            // Assert - sprawdzenie domyślnych etykiet
            const buttons = compiled.querySelectorAll('button');
            const buttonTexts = Array.from(buttons).map((btn) => btn.textContent?.trim());

            expect(buttonTexts).toContain('Anuluj');
            expect(buttonTexts).toContain('Potwierdź');
        });

        it('powinien wyświetlić niestandardowe etykiety przycisków, gdy są podane', async () => {
            // Arrange - przygotowanie danych z niestandardowymi etykietami
            const testData: ConfirmationDialogData = {
                title: 'Usuń piosenkę',
                message: 'Czy na pewno chcesz usunąć tę piosenkę?',
                confirmButtonText: 'Tak, usuń',
                cancelButtonText: 'Nie, wróć',
            };

            // Act - wyrenderowanie komponentu
            const { compiled } = await setupComponentWithData(testData);

            // Assert - sprawdzenie niestandardowych etykiet
            const buttons = compiled.querySelectorAll('button');
            const buttonTexts = Array.from(buttons).map((btn) => btn.textContent?.trim());

            expect(buttonTexts).toContain('Nie, wróć');
            expect(buttonTexts).toContain('Tak, usuń');
        });

        it('powinien poprawnie renderować treść wiadomości jako HTML', async () => {
            // Arrange - przygotowanie wiadomości z tagami HTML
            const testData: ConfirmationDialogData = {
                title: 'Uwaga',
                message: 'To jest <strong>ważna</strong> wiadomość z <em>formatowaniem</em>.',
            };

            // Act - wyrenderowanie komponentu
            const { compiled } = await setupComponentWithData(testData);

            // Assert - sprawdzenie czy HTML jest prawidłowo zinterpretowany
            const contentElement = compiled.querySelector('mat-dialog-content');
            const strongElement = contentElement?.querySelector('strong');
            const emElement = contentElement?.querySelector('em');

            expect(strongElement?.textContent).toBe('ważna');
            expect(emElement?.textContent).toBe('formatowaniem');
        });
    });

    describe('Interakcje użytkownika', () => {
        it('powinien zamknąć dialog z wynikiem `true` po kliknięciu przycisku potwierdzenia', async () => {
            // Arrange - przygotowanie danych
            const testData: ConfirmationDialogData = {
                title: 'Potwierdź',
                message: 'Czy chcesz kontynuować?',
            };

            const { fixture, compiled, mockDialogRef } = await setupComponentWithData(testData);

            // Act - znalezienie i kliknięcie przycisku potwierdzenia
            const buttons = compiled.querySelectorAll('button');
            const confirmButton = Array.from(buttons).find(
                (btn) => btn.textContent?.trim() === 'Potwierdź'
            );
            confirmButton?.click();
            fixture.detectChanges();

            // Assert - weryfikacja czy dialogRef.close został wywołany z true
            expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
            expect(mockDialogRef.close).toHaveBeenCalledWith(true);
        });

        it('powinien zamknąć dialog z wynikiem `false` po kliknięciu przycisku anulowania', async () => {
            // Arrange - przygotowanie danych
            const testData: ConfirmationDialogData = {
                title: 'Potwierdź',
                message: 'Czy chcesz kontynuować?',
            };

            const { fixture, compiled, mockDialogRef } = await setupComponentWithData(testData);

            // Act - znalezienie i kliknięcie przycisku anulowania
            const buttons = compiled.querySelectorAll('button');
            const cancelButton = Array.from(buttons).find(
                (btn) => btn.textContent?.trim() === 'Anuluj'
            );
            cancelButton?.click();
            fixture.detectChanges();

            // Assert - weryfikacja czy dialogRef.close został wywołany z false
            expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
            expect(mockDialogRef.close).toHaveBeenCalledWith(false);
        });
    });
});

