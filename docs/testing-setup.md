# Środowisko Testowe - StrummerBox

## Przegląd

Projekt StrummerBox wykorzystuje nowoczesny stack testowy zgodnie z dokumentem Tech Stack:

-   **Vitest** - szybkie testy jednostkowe (5-10x szybsze niż Karma)
-   **Playwright** - testy E2E z natywnym wsparciem dla wielu przeglądarek

## Struktura Projektu

```
strummerbox/
├── src/
│   ├── app/
│   │   ├── **/*.spec.ts          # Testy jednostkowe (Vitest)
│   │   └── **/*.test.ts          # Alternatywna konwencja testów
│   └── test-setup.ts              # Konfiguracja środowiska testowego Angular
├── e2e/
│   ├── pages/                     # Page Object Models
│   │   └── login.page.ts
│   ├── fixtures/                  # Dane testowe
│   │   └── test-users.ts
│   ├── utils/                     # Funkcje pomocnicze
│   │   └── test-helpers.ts
│   └── *.spec.ts                  # Testy E2E (Playwright)
├── vitest.config.ts               # Konfiguracja Vitest
└── playwright.config.ts           # Konfiguracja Playwright
```

## Testy Jednostkowe (Vitest)

### Uruchamianie Testów

```bash
# Tryb watch (automatyczne przeładowanie)
npm run test

# Jednorazowe uruchomienie wszystkich testów
npm run test:run

# Interfejs graficzny
npm run test:ui

# Raport pokrycia kodu
npm run test:coverage
```

### Pisanie Testów

Testy jednostkowe powinny być umieszczane obok testowanych plików z rozszerzeniem `.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyComponent],
        }).compileComponents();
    });

    it('powinien utworzyć komponent', () => {
        const fixture = TestBed.createComponent(MyComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
```

### Mockowanie

Vitest posiada wbudowane API do mockowania:

```typescript
import { vi } from 'vitest';

const mockService = {
    getData: vi.fn().mockResolvedValue({ data: 'test' }),
};
```

## Testy E2E (Playwright)

### Uruchamianie Testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Interfejs graficzny
npm run test:e2e:ui

# Tryb debug
npm run test:e2e:debug

# Tryb headed (z widoczną przeglądarką)
npm run test:e2e:headed

# Testy dla konkretnej przeglądarki
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Testy mobilne
npm run test:e2e:mobile

# Raport HTML
npm run test:e2e:report
```

### Page Object Model

Używamy wzorca Page Object Model dla lepszej organizacji testów:

```typescript
// e2e/pages/my-page.page.ts
import { Page, Locator } from '@playwright/test';

export class MyPage {
    readonly page: Page;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.submitButton = page.getByRole('button', { name: 'Submit' });
    }

    async goto() {
        await this.page.goto('/my-page');
    }
}
```

### Pisanie Testów E2E

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/my-page.page';

test.describe('Moja funkcjonalność', () => {
    test('powinien wykonać akcję', async ({ page }) => {
        const myPage = new MyPage(page);
        await myPage.goto();
        
        await expect(myPage.submitButton).toBeVisible();
    });
});
```

## Fixtures i Dane Testowe

Dane testowe przechowujemy w katalogu `e2e/fixtures/`:

```typescript
// e2e/fixtures/test-users.ts
export const testUsers = {
    validUser: {
        email: 'test@example.com',
        password: 'TestPassword123!',
    },
};
```

## Funkcje Pomocnicze

Wspólne funkcje pomocnicze w `e2e/utils/test-helpers.ts`:

```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
}
```

## Konfiguracja

### Vitest (vitest.config.ts)

-   Środowisko: jsdom
-   Pokrycie kodu: v8 provider
-   Reportery: default, html
-   Setup: `src/test-setup.ts`

### Playwright (playwright.config.ts)

-   Przeglądarki: Chromium, Firefox, WebKit
-   Mobile: Pixel 5, iPhone 12
-   Base URL: http://localhost:4200
-   Retries: 2 na CI, 0 lokalnie
-   Trace: przy pierwszym retry
-   Screenshots i Video: przy niepowodzeniu

## Best Practices

### Testy Jednostkowe

1. **Testuj w izolacji** - używaj mocków dla zależności
2. **AAA Pattern** - Arrange, Act, Assert
3. **Opisowe nazwy** - jasno określ co test sprawdza
4. **Jeden koncept na test** - jeden test = jedna funkcjonalność
5. **Niezależność** - testy nie powinny na siebie wpływać

### Testy E2E

1. **Używaj Page Object Model** - enkapsuluj interakcje ze stroną
2. **Stabilne selektory** - preferuj role i labels nad CSS
3. **Auto-waiting** - Playwright automatycznie czeka na elementy
4. **Fixtures** - przygotuj dane testowe wcześniej
5. **Cleanup** - upewnij się, że testy czyszczą po sobie

## CI/CD

Testy można łatwo zintegrować z CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Unit Tests
  run: npm run test:run

- name: Run E2E Tests
  run: npm run test:e2e
```

## Debugowanie

### Vitest

```bash
# Interfejs graficzny z możliwością debugowania
npm run test:ui
```

### Playwright

```bash
# Tryb debug z step-by-step wykonaniem
npm run test:e2e:debug

# Inspector z możliwością pauzowania
npx playwright test --debug
```

## Pokrycie Kodu

Generowanie raportu pokrycia kodu:

```bash
npm run test:coverage
```

Raport zostanie wygenerowany w katalogu `coverage/`.

## Troubleshooting

### Vitest

**Problem**: Testy nie znajdują modułów Angular
**Rozwiązanie**: Upewnij się, że `@analogjs/vite-plugin-angular` jest zainstalowany i skonfigurowany w `vitest.config.ts`

**Problem**: Zone.js errors
**Rozwiązanie**: Sprawdź czy `src/test-setup.ts` jest poprawnie skonfigurowany i importuje zone.js

### Playwright

**Problem**: Testy timeout'ują
**Rozwiązanie**: Zwiększ timeout w `playwright.config.ts` lub upewnij się, że aplikacja uruchamia się poprawnie

**Problem**: Testy działają lokalnie ale nie na CI
**Rozwiązanie**: Upewnij się, że przeglądarki są zainstalowane: `npx playwright install --with-deps`

## Instalacja i Konfiguracja

### Szybka instalacja

**Linux/macOS:**

```bash
./scripts/setup-testing.sh
```

**Windows PowerShell:**

```powershell
.\scripts\setup-testing.ps1
```

### Manualna instalacja

```bash
# Zainstaluj zależności
npm ci

# Zainstaluj przeglądarki Playwright
npx playwright install

# Uruchom testy
npm run test:run
npm run test:e2e:chromium
```

## Dokumentacja

-   **[Quick Start](./testing-quick-start.md)** - szybkie rozpoczęcie pracy z testami
-   **[Testing Guide](./testing-guide.md)** - kompletny przewodnik testowania
-   **[Troubleshooting](./troubleshooting-tests.md)** - rozwiązywanie problemów
-   **[E2E README](../e2e/README.md)** - szczegóły testów E2E
-   **[Przykłady testów](../src/app/shared/utils/test-examples.spec.ts)** - przykłady różnych technik testowania

## Dalsze Kroki

1. Przeczytaj [Quick Start Guide](./testing-quick-start.md)
2. Zapoznaj się z [przykładami testów](../src/app/shared/utils/test-examples.spec.ts)
3. Dodaj więcej testów jednostkowych dla komponentów i serwisów
4. Rozszerz testy E2E o krytyczne ścieżki użytkownika
5. Skonfiguruj visual regression testing w Playwright
6. Dodaj testy integracyjne dla Edge Functions (Deno Test)
7. Zintegruj testy z CI/CD pipeline (już skonfigurowane w `.github/workflows/`)

## Przydatne Linki

-   [Vitest Documentation](https://vitest.dev/)
-   [Playwright Documentation](https://playwright.dev/)
-   [Angular Testing Guide](https://angular.dev/guide/testing)
-   [Analog Vite Plugin](https://analogjs.org/docs/packages/vite-plugin-angular/overview)

