# Rozwiązywanie problemów z testami

## Problemy z Vitest

### Test timeout

**Problem:** Test przekracza domyślny timeout (5000ms)

**Rozwiązanie:**

```typescript
it('długo działający test', async () => {
    // Zwiększ timeout dla tego testu
    await new Promise((resolve) => setTimeout(resolve, 10000));
}, 15000); // timeout 15s
```

Lub globalnie w `vitest.config.ts`:

```typescript
export default defineConfig({
    test: {
        testTimeout: 10000,
    },
});
```

### Mock nie działa

**Problem:** Mock jest ignorowany lub zwraca undefined

**Rozwiązanie:**

1. Upewnij się, że mock jest utworzony przed importem:

```typescript
vi.mock('./my-service', () => ({
    MyService: vi.fn().mockImplementation(() => ({
        getData: vi.fn().mockResolvedValue({ data: 'test' }),
    })),
}));

import { MyService } from './my-service';
```

2. Wyczyść mocki między testami:

```typescript
beforeEach(() => {
    vi.clearAllMocks();
});
```

### Angular TestBed błędy

**Problem:** `NullInjectorError: No provider for...`

**Rozwiązanie:**

```typescript
await TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [
        // Dodaj brakujące providery
        MyService,
        { provide: Router, useValue: mockRouter },
    ],
}).compileComponents();
```

### Błąd "Zone is needed for the async()"

**Problem:** Testy wymagają zone.js

**Rozwiązanie:**

Upewnij się, że `src/test-setup.ts` zawiera:

```typescript
import 'zone.js';
import 'zone.js/testing';
```

## Problemy z Playwright

### Selector nie znaleziony

**Problem:** `Timeout 30000ms exceeded waiting for selector`

**Rozwiązanie:**

1. Zwiększ timeout:

```typescript
await page.locator('.my-selector').waitFor({ timeout: 60000 });
```

2. Użyj bardziej niezawodnych selektorów:

```typescript
// ❌ Źle - krótkie selektory CSS
await page.locator('.btn');

// ✅ Dobrze - role i labels
await page.getByRole('button', { name: 'Zapisz' });
await page.getByLabel('Email');
await page.getByText('Tytuł strony');
```

3. Poczekaj na załadowanie:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="content"]');
```

### Test działa lokalnie, ale nie na CI

**Problem:** Test przechodzi lokalnie, ale failuje na CI

**Rozwiązanie:**

1. Sprawdź szybkość wykonania - na CI może być wolniej:

```typescript
// Zwiększ timeouty na CI
const timeout = process.env.CI ? 60000 : 30000;
await page.locator('.selector').waitFor({ timeout });
```

2. Upewnij się, że dev server jest gotowy:

```typescript
// playwright.config.ts
webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    timeout: 120 * 1000, // 2 minuty na uruchomienie
    reuseExistingServer: !process.env.CI,
},
```

3. Użyj `waitForLoadState`:

```typescript
await page.goto('/');
await page.waitForLoadState('domcontentloaded');
```

### Niestabilne testy (flaky tests)

**Problem:** Test czasami przechodzi, czasami nie

**Rozwiązanie:**

1. Unikaj `waitForTimeout` - użyj auto-waiting:

```typescript
// ❌ Źle
await page.waitForTimeout(1000);

// ✅ Dobrze
await page.locator('.element').waitFor();
```

2. Poczekaj na stabilny stan:

```typescript
// Poczekaj aż animacje się skończą
await page.waitForLoadState('networkidle');

// Poczekaj na konkretny warunek
await page.waitForFunction(() => {
    const loader = document.querySelector('.loader');
    return loader === null;
});
```

3. Użyj `strict mode` dla selektorów:

```typescript
// Rzuci błąd jeśli znajdzie więcej niż jeden element
await page.locator('.button').click(); // strict: true domyślnie
```

### Screenshot lub video nie działa

**Problem:** Brak screenshotów/wideo po nieudanym teście

**Rozwiązanie:**

Sprawdź konfigurację w `playwright.config.ts`:

```typescript
use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
},
```

Upewnij się, że katalogi istnieją:

```bash
mkdir -p playwright-report test-results
```

### Page Object Model - this.page jest undefined

**Problem:** `Cannot read property 'goto' of undefined`

**Rozwiązanie:**

Upewnij się, że konstruktor jest wywoływany:

```typescript
export class MyPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page; // ✅ Przypisz page
    }

    async goto() {
        await this.page.goto('/my-page');
    }
}

// W teście
test('mój test', async ({ page }) => {
    const myPage = new MyPage(page); // ✅ Przekaż page
    await myPage.goto();
});
```

## Problemy z pokryciem kodu

### Niekompletne pokrycie

**Problem:** Coverage report pokazuje 0% lub nieprawidłowe wartości

**Rozwiązanie:**

1. Sprawdź konfigurację w `vitest.config.ts`:

```typescript
coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: ['src/**/*.ts'],
    exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.spec.ts',
        'src/environments/**',
    ],
},
```

2. Uruchom z flagą coverage:

```bash
npm run test:coverage
```

### Nieoczekiwane pliki w pokryciu

**Problem:** Coverage zawiera pliki testowe lub node_modules

**Rozwiązanie:**

Dodaj do `exclude` w `vitest.config.ts`:

```typescript
coverage: {
    exclude: [
        'node_modules/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/test-*.ts',
        'src/test-setup.ts',
        'src/environments/**',
        'src/main.ts',
        '**/*.d.ts',
    ],
},
```

## Problemy z CI/CD

### GitHub Actions - testy nie przechodzą

**Problem:** Workflow failuje na GitHub Actions

**Rozwiązanie:**

1. Sprawdź logi:

```bash
# Lokalnie uruchom jak na CI
CI=true npm run test:run
CI=true npm run test:e2e
```

2. Upewnij się, że wszystkie zależności są zainstalowane:

```yaml
- name: Instalacja zależności
  run: npm ci # używaj ci zamiast install
```

3. Sprawdź czy playwright jest zainstalowany:

```yaml
- name: Instalacja przeglądarek Playwright
  run: npx playwright install --with-deps
```

### Artifact upload fails

**Problem:** `Error: Unable to upload artifact`

**Rozwiązanie:**

Sprawdź czy ścieżka istnieje:

```yaml
- name: Upload raportu
  uses: actions/upload-artifact@v4
  if: always() # Upload nawet jeśli test failuje
  with:
      name: test-report
      path: playwright-report/
      retention-days: 30
```

## Ogólne problemy

### "Cannot find module" podczas testów

**Problem:** Import błędy w testach

**Rozwiązanie:**

1. Sprawdź path mappings w `tsconfig.spec.json`:

```json
{
    "compilerOptions": {
        "paths": {
            "@app/*": ["src/app/*"],
            "@core/*": ["src/app/core/*"],
            "@shared/*": ["src/app/shared/*"]
        }
    }
}
```

2. Zaktualizuj konfigurację Vitest:

```typescript
// vitest.config.ts
export default defineConfig({
    resolve: {
        alias: {
            '@app': '/src/app',
            '@core': '/src/app/core',
            '@shared': '/src/app/shared',
        },
    },
});
```

### Testy są bardzo wolne

**Problem:** Testy trwają zbyt długo

**Rozwiązanie dla Vitest:**

```typescript
// vitest.config.ts
export default defineConfig({
    test: {
        pool: 'threads', // lub 'forks'
        poolOptions: {
            threads: {
                singleThread: false,
            },
        },
    },
});
```

**Rozwiązanie dla Playwright:**

```typescript
// playwright.config.ts
export default defineConfig({
    workers: process.env.CI ? 1 : undefined, // więcej workerów lokalnie
    fullyParallel: true,
});
```

### TypeScript errors w testach

**Problem:** Błędy typu w plikach testowych

**Rozwiązanie:**

1. Sprawdź czy tsconfig.spec.json jest poprawny:

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "types": ["vitest/globals", "node"]
    },
    "include": ["src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

2. Upewnij się, że importujesz typy:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
```

## Debug tips

### Włącz verbose logging

```bash
# Vitest
npm run test -- --reporter=verbose

# Playwright
DEBUG=pw:api npm run test:e2e
```

### Zatrzymaj test na błędzie

```typescript
// Vitest
test.only('konkretny test', () => {
    // tylko ten test się uruchomi
});

// Playwright
test.only('konkretny test', async ({ page }) => {
    // tylko ten test się uruchomi
});
```

### Interaktywny debug

```bash
# Vitest UI
npm run test:ui

# Playwright debug mode
npm run test:e2e:debug
```

## Kiedy szukać pomocy

Jeśli powyższe rozwiązania nie pomogły:

1. Sprawdź dokumentację:
    - [Vitest Docs](https://vitest.dev/)
    - [Playwright Docs](https://playwright.dev/)
2. Sprawdź GitHub Issues projektu
3. Zapytaj zespół na Slack #testing
4. Utwórz nowe issue z:
    - Opisem problemu
    - Krokami do reprodukcji
    - Logami błędów
    - Informacją o środowisku (OS, Node version, etc.)

