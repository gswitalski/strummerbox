import { test, expect } from '@playwright/test';
import { LoginPage } from '../poms/LoginPage';

/**
 * Test Suite: Strona logowania
 * Tag: @smoke - test podstawowej dostępności aplikacji
 *
 * Ten test weryfikuje, czy strona logowania jest dostępna
 * i zawiera wszystkie kluczowe elementy UI.
 */
test.describe('Strona logowania @smoke', () => {

    /**
     * Test: Wyświetlanie strony logowania
     *
     * Weryfikuje najbardziej podstawową funkcjonalność:
     * - Aplikacja jest uruchomiona i dostępna
     * - Strona logowania się ładuje
     * - Wszystkie kluczowe elementy są widoczne
     *
     * Jest to najprostszy możliwy test e2e, który stanowi
     * fundament dla bardziej złożonych scenariuszy testowych.
     */
    test('powinna wyświetlić formularz logowania ze wszystkimi niezbędnymi elementami', async ({ page }) => {
        // Arrange - Przygotowanie
        const loginPage = new LoginPage(page);

        // Act - Akcja
        await loginPage.goto();

        // Assert - Weryfikacja
        // Sprawdź, czy strona się załadowała
        const isPageLoaded = await loginPage.isLoaded();
        expect(isPageLoaded).toBe(true);

        // Sprawdź, czy pole email jest widoczne
        await expect(loginPage.emailInput).toBeVisible();

        // Sprawdź, czy pole hasła jest widoczne
        await expect(loginPage.passwordInput).toBeVisible();

        // Sprawdź, czy przycisk logowania jest widoczny
        await expect(loginPage.loginButton).toBeVisible();

        // Sprawdź, czy przycisk jest wyłączony dla pustego formularza (poprawne zachowanie UX)
        await expect(loginPage.loginButton).toBeDisabled();

        // Sprawdź, czy link do rejestracji jest widoczny
        await expect(loginPage.registerLink).toBeVisible();
    });

    /**
     * Test: Sprawdzenie URL strony logowania
     *
     * Prosty test weryfikujący, czy routing działa poprawnie
     */
    test('powinna mieć poprawny URL', async ({ page }) => {
        // Arrange & Act
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // Assert
        // Sprawdź, czy URL zawiera '/login'
        expect(page.url()).toContain('/login');
    });

    /**
     * Test: Walidacja formularza
     *
     * Sprawdza, czy przycisk logowania jest wyłączony dla pustego formularza
     * i włącza się po wypełnieniu wszystkich pól.
     */
    test('powinna włączyć przycisk logowania po wypełnieniu formularza', async ({ page }) => {
        // Arrange
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // Assert - Przycisk wyłączony dla pustego formularza
        await expect(loginPage.loginButton).toBeDisabled();

        // Act - Wypełnij email
        await loginPage.emailInput.fill('test@example.com');

        // Assert - Przycisk nadal wyłączony (brak hasła)
        await expect(loginPage.loginButton).toBeDisabled();

        // Act - Wypełnij hasło
        await loginPage.passwordInput.fill('password123');

        // Assert - Przycisk włączony po wypełnieniu wszystkich pól
        await expect(loginPage.loginButton).toBeEnabled();
    });
});

