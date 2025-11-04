# Testy E2E - StrummerBox

## Struktura katalogów

```
e2e/
├── fixtures/           # Dane testowe (użytkownicy, piosenki, repertuary)
├── pages/             # Page Object Models (POM)
├── utils/             # Pomocnicze funkcje
└── *.spec.ts          # Pliki testowe
```

## Page Object Model (POM)

Każda strona powinna mieć swój POM w katalogu `pages/`:

### Przykład POM

```typescript
// pages/songs.page.ts
import { Page, Locator } from '@playwright/test';

export class SongsPage {
    readonly page: Page;
    readonly addButton: Locator;
    readonly searchInput: Locator;
    readonly songsList: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addButton = page.getByRole('button', { name: 'Dodaj piosenkę' });
        this.searchInput = page.getByPlaceholder('Szukaj...');
        this.songsList = page.getByTestId('songs-list');
    }

    async goto() {
        await this.page.goto('/songs');
        await this.page.waitForLoadState('networkidle');
    }

    async searchSong(query: string) {
        await this.searchInput.fill(query);
        await this.page.waitForLoadState('networkidle');
    }

    async addNewSong() {
        await this.addButton.click();
        await this.page.waitForURL(/.*\/songs\/new/);
    }

    async getSongByTitle(title: string) {
        return this.songsList.getByText(title);
    }
}
```

## Fixtures

Przechowuj dane testowe w katalogu `fixtures/`:

```typescript
// fixtures/test-data.ts
export const testUsers = {
    validUser: {
        email: 'test@example.com',
        password: 'TestPassword123!',
    },
    adminUser: {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
    },
};

export const testSongs = {
    rock: {
        title: 'Rock Song',
        artist: 'Rock Band',
        lyrics: '[C]Some [G]lyrics [Am]here',
    },
    pop: {
        title: 'Pop Song',
        artist: 'Pop Artist',
        lyrics: '[D]Pop [A]song [Bm]lyrics',
    },
};
```

## Pomocnicze funkcje

Utwórz reużywalne funkcje w `utils/test-helpers.ts`:

```typescript
// utils/test-helpers.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Hasło').fill(password);
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await page.waitForURL('/dashboard');
}

export async function clearStorage(page: Page) {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.context().clearCookies();
}

export async function waitForApiResponse(
    page: Page,
    urlPattern: string,
    method: string = 'GET'
) {
    return page.waitForResponse(
        (response) =>
            response.url().includes(urlPattern) && response.request().method() === method
    );
}
```

## Pisanie testów

### Podstawowa struktura

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/my.page';

test.describe('Moja funkcjonalność', () => {
    test.beforeEach(async ({ page }) => {
        // Setup przed każdym testem
        await page.goto('/');
    });

    test('powinien wykonać akcję', async ({ page }) => {
        // Arrange
        const myPage = new MyPage(page);

        // Act
        await myPage.performAction();

        // Assert
        await expect(page.getByText('Sukces')).toBeVisible();
    });
});
```

### Testowanie autentykacji

```typescript
test.describe('Autentykacja', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test('powinien zalogować użytkownika', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.goto();
        await loginPage.login(
            testUsers.validUser.email,
            testUsers.validUser.password
        );

        await expect(page).toHaveURL(/.*dashboard/);
    });
});
```

### Testowanie formularzy

```typescript
test('powinien walidować formularz', async ({ page }) => {
    await page.goto('/songs/new');

    // Próba zapisu bez wypełnienia
    await page.getByRole('button', { name: 'Zapisz' }).click();

    // Sprawdź błędy walidacji
    await expect(page.getByText('Tytuł jest wymagany')).toBeVisible();
    await expect(page.getByText('Artysta jest wymagany')).toBeVisible();
});
```

### Testowanie interakcji

```typescript
test('powinien dodać piosenkę do ulubionych', async ({ page }) => {
    await page.goto('/songs');

    const firstSong = page.locator('[data-testid="song-item"]').first();
    const favoriteButton = firstSong.getByRole('button', { name: 'Ulubione' });

    // Kliknij przycisk
    await favoriteButton.click();

    // Sprawdź czy zmienił stan
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
});
```

## Best Practices

### 1. Używaj data-testid dla kluczowych elementów

```html
<!-- W komponencie Angular -->
<div data-testid="songs-list">
    <div data-testid="song-item" *ngFor="let song of songs">
        {{ song.title }}
    </div>
</div>
```

```typescript
// W teście
const songsList = page.getByTestId('songs-list');
const songItems = page.getByTestId('song-item');
```

### 2. Czekaj na API response

```typescript
// Czekaj na odpowiedź API przed asercją
const responsePromise = page.waitForResponse('/api/songs');
await page.getByRole('button', { name: 'Zapisz' }).click();
const response = await responsePromise;

expect(response.status()).toBe(200);
```

### 3. Grupuj powiązane testy

```typescript
test.describe('Zarządzanie piosenkami', () => {
    test.describe('Tworzenie', () => {
        test('powinien utworzyć nową piosenkę', async ({ page }) => {
            // ...
        });

        test('powinien walidować tytuł', async ({ page }) => {
            // ...
        });
    });

    test.describe('Edycja', () => {
        test('powinien edytować piosenkę', async ({ page }) => {
            // ...
        });
    });
});
```

### 4. Używaj beforeEach dla wspólnego setupu

```typescript
test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login dla wszystkich testów w tym describe
        await login(page, testUsers.validUser.email, testUsers.validUser.password);
        await page.goto('/dashboard');
    });

    test('powinien wyświetlić statystyki', async ({ page }) => {
        // Test zaczyna się już po zalogowaniu
    });
});
```

### 5. Czyść stan między testami

```typescript
test.afterEach(async ({ page }) => {
    await clearStorage(page);
});
```

## Selektory - priorytet

1. **Role** (najbardziej semantyczny)

```typescript
page.getByRole('button', { name: 'Zapisz' });
page.getByRole('heading', { name: 'Tytuł' });
```

2. **Label** (dla formularzy)

```typescript
page.getByLabel('Email');
page.getByLabel('Hasło');
```

3. **Text** (dla treści)

```typescript
page.getByText('Witaj!');
page.getByText('Brak piosenek');
```

4. **Test ID** (dla unikalnych elementów)

```typescript
page.getByTestId('song-item');
page.getByTestId('repertoire-card');
```

5. **CSS Selectors** (ostateczność)

```typescript
page.locator('.my-class'); // Unikaj jeśli możliwe
```

## Debugging

### 1. Playwright Inspector

```bash
npm run test:e2e:debug
```

### 2. Headed mode

```bash
npm run test:e2e:headed
```

### 3. Slow motion

```typescript
test.use({ launchOptions: { slowMo: 1000 } });
```

### 4. Screenshot

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 5. Pause

```typescript
await page.pause(); // Otwiera Playwright Inspector
```

## Uruchamianie testów

```bash
# Wszystkie testy
npm run test:e2e

# Z UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Konkretna przeglądarka
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Mobile
npm run test:e2e:mobile

# Konkretny plik
npx playwright test auth.spec.ts

# Z tagiem
npx playwright test --grep @smoke
```

## Tagowanie testów

```typescript
test('@smoke powinien załadować stronę główną', async ({ page }) => {
    await page.goto('/');
});

test('@critical powinien umożliwić login', async ({ page }) => {
    // ...
});
```

Uruchom tylko smoke tests:

```bash
npx playwright test --grep @smoke
```

## CI/CD

Testy E2E są automatycznie uruchamiane na GitHub Actions:

-   **Push do main/develop:** Pełna bateria testów (wszystkie przeglądarki)
-   **Pull Request:** Tylko Chromium (szybsze feedback)

Zobacz `.github/workflows/test.yml` dla szczegółów konfiguracji.

