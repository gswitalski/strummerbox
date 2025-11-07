import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model dla strony logowania
 * Implementuje wzorzec POM zgodnie ze strategią testów E2E
 */
export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly registerLink: Locator;
    readonly pageTitle: Locator;

    constructor(page: Page) {
        this.page = page;

        // Selektory wykorzystujące Role Locators (priorytet według strategii)
        // Używamy getByLabel dla Angular Material mat-form-field
        this.emailInput = page.getByLabel(/adres e-mail/i);
        this.passwordInput = page.getByLabel(/hasło/i);
        this.loginButton = page.getByRole('button', { name: /zaloguj/i });
        this.registerLink = page.getByRole('link', { name: /zarejestruj/i });

        // Tytuł strony
        this.pageTitle = page.getByRole('heading', { name: /logowanie/i });
    }

    /**
     * Przechodzi do strony logowania
     */
    async goto() {
        await this.page.goto('/login');
    }

    /**
     * Sprawdza, czy strona logowania została załadowana
     * @returns true jeśli strona jest załadowana
     */
    async isLoaded(): Promise<boolean> {
        try {
            await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
            await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Wykonuje logowanie użytkownika
     * @param email - adres email użytkownika
     * @param password - hasło użytkownika
     */
    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}

