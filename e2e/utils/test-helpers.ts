import { Page } from '@playwright/test';

/**
 * Pomocnicze funkcje dla testów E2E
 */

/**
 * Czeka aż loader/spinner zniknie ze strony
 */
export async function waitForLoader(page: Page) {
    await page.waitForSelector('.loader', { state: 'hidden' });
}

/**
 * Wypełnia formularz na podstawie obiektu z danymi
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
    for (const [fieldName, value] of Object.entries(formData)) {
        await page.fill(`[name="${fieldName}"]`, value);
    }
}

/**
 * Wykonuje login użytkownika (pomocnicza funkcja dla testów)
 */
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

/**
 * Czyści local storage i cookies
 */
export async function clearStorage(page: Page) {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.context().clearCookies();
}

/**
 * Robi zrzut ekranu z timestampem w nazwie
 */
export async function takeScreenshotWithTimestamp(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
}

/**
 * Sprawdza czy element jest widoczny i ma oczekiwaną zawartość
 */
export async function expectElementWithText(
    page: Page,
    selector: string,
    expectedText: string
) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    const text = await element.textContent();
    return text?.includes(expectedText);
}

