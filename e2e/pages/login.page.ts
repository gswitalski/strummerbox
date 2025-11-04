import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model dla strony logowania
 * Enkapsuluje interakcje ze stroną logowania
 */
export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly registerLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByLabel('Email', { exact: true });
        this.passwordInput = page.getByLabel('Hasło', { exact: true });
        this.loginButton = page.getByRole('button', { name: 'Zaloguj się' });
        this.errorMessage = page.locator('.error-message');
        this.registerLink = page.getByRole('link', { name: 'Zarejestruj się' });
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async isLoginSuccessful() {
        // Sprawdź czy użytkownik został przekierowany do dashboardu
        await this.page.waitForURL('/dashboard');
        return this.page.url().includes('/dashboard');
    }

    async getErrorMessage() {
        return await this.errorMessage.textContent();
    }
}

