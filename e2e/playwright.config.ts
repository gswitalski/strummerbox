import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów E2E projektu StrummerBox
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    // Katalog z plikami testowymi
    testDir: './specs',

    // Maksymalny czas wykonania pojedynczego testu
    timeout: 30 * 1000,

    // Konfiguracja asercji
    expect: {
        timeout: 5000
    },

    // Uruchom testy równolegle
    fullyParallel: true,

    // Liczba ponowień dla niestabilnych testów (tylko w CI)
    retries: process.env.CI ? 1 : 0,

    // Liczba workerów (równoległych procesów testowych)
    workers: process.env.CI ? 1 : undefined,

    // Konfiguracja raportowania
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    // Wspólne ustawienia dla wszystkich projektów
    use: {
        // URL bazowy aplikacji
        baseURL: process.env.BASE_URL || 'http://localhost:4200',

        // Zbieraj trace dla nieudanych testów
        trace: 'on-first-retry',

        // Screenshoty dla nieudanych testów
        screenshot: 'only-on-failure',

        // Nagrywaj video dla nieudanych testów
        video: 'retain-on-failure',
    },

    // Konfiguracja dla różnych przeglądarek
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Uruchom serwer deweloperski przed testami (opcjonalnie)
    // webServer: {
    //     command: 'npm run start',
    //     url: 'http://localhost:4200',
    //     reuseExistingServer: !process.env.CI,
    // },
});


