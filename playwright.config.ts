import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    
    /* Uruchom testy równolegle */
    fullyParallel: true,
    
    /* Niepowodzenie build jeśli przypadkowo zostawisz test.only w źródle */
    forbidOnly: !!process.env.CI,
    
    /* Retry tylko na CI */
    retries: process.env.CI ? 2 : 0,
    
    /* Optymalna liczba workerów */
    workers: process.env.CI ? 1 : undefined,
    
    /* Reporter */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],
    
    /* Wspólna konfiguracja dla wszystkich projektów */
    use: {
        /* URL bazowy */
        baseURL: 'http://localhost:4200',
        
        /* Zbieraj trace tylko przy pierwszym retry */
        trace: 'on-first-retry',
        
        /* Zrzuty ekranu przy niepowodzeniu */
        screenshot: 'only-on-failure',
        
        /* Wideo przy niepowodzeniu */
        video: 'retain-on-failure',
    },

    /* Konfiguracja projektów dla różnych przeglądarek */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        /* Testowanie na urządzeniach mobilnych */
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    /* Uruchom dev server przed testami */
    webServer: {
        command: 'npm run start',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});

