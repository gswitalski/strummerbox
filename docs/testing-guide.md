# Przewodnik Testowania - StrummerBox

## Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Testy jednostkowe (Vitest)](#testy-jednostkowe-vitest)
3. [Testy E2E (Playwright)](#testy-e2e-playwright)
4. [Uruchamianie testów](#uruchamianie-testów)
5. [Najlepsze praktyki](#najlepsze-praktyki)
6. [CI/CD](#cicd)

## Wprowadzenie

StrummerBox wykorzystuje nowoczesny stack testowy:
- **Vitest** - błyskawiczne testy jednostkowe (5-10x szybsze niż Karma)
- **Playwright** - nowoczesne testy E2E dla wielu przeglądarek
- **Angular Testing Utilities** - wsparcie dla testowania komponentów Angular

## Testy jednostkowe (Vitest)

### Konfiguracja

Testy jednostkowe są skonfigurowane w pliku `vitest.config.ts`:
- Środowisko: jsdom (symulacja przeglądarki)
- Setup: `src/test-setup.ts` (inicjalizacja Angular TestBed)
- Pokrycie kodu: v8 provider
- Globalne API: describe, it, expect, vi (bez importów)

### Struktura testów

Pliki testowe powinny być umieszczone obok testowanego kodu z rozszerzeniem `.spec.ts`:

```
src/app/
├── core/
│   └── services/
│       ├── auth.service.ts
│       └── auth.service.spec.ts  ← test obok serwisu
├── pages/
│   └── songs/
│       ├── songs.component.ts
│       └── songs.component.spec.ts  ← test obok komponentu
```

### Przykłady testów

#### Test komponentu Angular

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
    let component: MyComponent;
    let fixture: ComponentFixture<MyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyComponent],
            // providers: [...], // dodaj potrzebne providery
        }).compileComponents();

        fixture = TestBed.createComponent(MyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('powinien utworzyć komponent', () => {
        expect(component).toBeTruthy();
    });

    it('powinien wyświetlić tytuł', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('Tytuł');
    });
});
```

#### Test serwisu z mockami

```typescript
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from './my.service';
import { DependencyService } from './dependency.service';

describe('MyService', () => {
    let service: MyService;
    let mockDependency: any;

    beforeEach(() => {
        // Utwórz mocka
        mockDependency = {
            getData: vi.fn().mockResolvedValue({ data: 'test' }),
        };

        TestBed.configureTestingModule({
            providers: [
                MyService,
                { provide: DependencyService, useValue: mockDependency },
            ],
        });

        service = TestBed.inject(MyService);
    });

    it('powinien wywołać dependencję', async () => {
        await service.fetchData();
        
        expect(mockDependency.getData).toHaveBeenCalled();
    });
});
```

#### Test z sygnałami Angular

```typescript
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

describe('Signal logic', () => {
    it('powinien zaktualizować signal', () => {
        const count = signal(0);
        
        count.set(5);
        
        expect(count()).toBe(5);
    });

    it('powinien użyć update do modyfikacji', () => {
        const count = signal(0);
        
        count.update(val => val + 1);
        
        expect(count()).toBe(1);
    });
});
```

### Mockowanie

#### Mockowanie funkcji

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
const mockFnWithReturn = vi.fn().mockReturnValue('test');
const mockFnAsync = vi.fn().mockResolvedValue({ data: 'test' });
```

#### Mockowanie modułów

```typescript
import { vi } from 'vitest';

vi.mock('./my-module', () => ({
    myFunction: vi.fn().mockReturnValue('mocked'),
}));
```

### Pokrycie kodu

Raporty pokrycia są generowane automatycznie przy uruchomieniu `npm run test:coverage`:
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`

Minimalne wymagania pokrycia:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Testy E2E (Playwright)

### Konfiguracja

Testy E2E są skonfigurowane w pliku `playwright.config.ts`:
- Katalog testów: `./e2e`
- Przeglądarki: Chromium, Firefox, WebKit
- Urządzenia mobilne: Pixel 5, iPhone 12
- Dev server: automatyczne uruchamianie na localhost:4200

### Struktura testów E2E

```
e2e/
├── fixtures/           ← dane testowe
│   └── test-users.ts
├── pages/             ← Page Object Models
│   └── login.page.ts
├── utils/             ← pomocnicze funkcje
│   └── test-helpers.ts
└── *.spec.ts          ← pliki testowe
```

### Page Object Model (POM)

Używamy wzorca POM do enkapsulacji interakcji ze stroną:

```typescript
import { Page, Locator } from '@playwright/test';

export class SongPage {
    readonly page: Page;
    readonly titleInput: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.titleInput = page.getByLabel('Tytuł');
        this.saveButton = page.getByRole('button', { name: 'Zapisz' });
    }

    async goto() {
        await this.page.goto('/songs/new');
    }

    async createSong(title: string) {
        await this.titleInput.fill(title);
        await this.saveButton.click();
    }
}
```

### Przykłady testów E2E

#### Test podstawowy

```typescript
import { test, expect } from '@playwright/test';

test('powinien wyświetlić stronę główną', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: 'StrummerBox' }))
        .toBeVisible();
});
```

#### Test z wykorzystaniem POM

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUsers } from './fixtures/test-users';

test('powinien zalogować użytkownika', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
    
    await expect(page).toHaveURL(/.*dashboard/);
});
```

#### Test na urządzeniach mobilnych

```typescript
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('powinien działać na iPhone', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź responsywność
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
});
```

### Fixtures i dane testowe

Przechowuj dane testowe w `e2e/fixtures/`:

```typescript
export const testUsers = {
    validUser: {
        email: 'test@example.com',
        password: 'TestPassword123!',
    },
};

export const testSongs = {
    basicSong: {
        title: 'Przykładowa piosenka',
        artist: 'Artysta',
    },
};
```

### Pomocnicze funkcje

Utwórz reużywalne funkcje w `e2e/utils/test-helpers.ts`:

```typescript
export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

export async function clearStorage(page: Page) {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.context().clearCookies();
}
```

## Uruchamianie testów

### Testy jednostkowe (Vitest)

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy z UI
npm run test:ui

# Uruchom testy raz (CI)
npm run test:run

# Wygeneruj raport pokrycia
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z UI interaktywnym
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug

# Uruchom z widocznymi przeglądarkami
npm run test:e2e:headed

# Uruchom tylko dla Chromium
npm run test:e2e:chromium

# Uruchom tylko dla Firefox
npm run test:e2e:firefox

# Uruchom tylko dla WebKit (Safari)
npm run test:e2e:webkit

# Uruchom na urządzeniach mobilnych
npm run test:e2e:mobile

# Wyświetl raport
npm run test:e2e:report
```

### Filtrowanie testów

```bash
# Vitest - uruchom tylko testy pasujące do wzorca
npm run test -- songs

# Playwright - uruchom konkretny plik
npm run test:e2e auth.spec.ts

# Playwright - uruchom testy z tagiem
npm run test:e2e -- --grep @smoke
```

## Najlepsze praktyki

### Ogólne

1. **Testy powinny być niezależne** - każdy test powinien działać samodzielnie
2. **Używaj opisowych nazw** - nazwa testu powinna jasno określać co testuje
3. **Testuj zachowanie, nie implementację** - koncentruj się na rezultatach
4. **Unikaj logiki w testach** - testy powinny być proste i czytelne
5. **Jeden assert na koncepcję** - każdy test powinien sprawdzać jedną rzecz

### Testy jednostkowe

1. **Mockuj zależności** - izoluj testowany kod
2. **Testuj edge cases** - wartości brzegowe, null, undefined
3. **Testuj błędy** - sprawdź obsługę wyjątków
4. **Używaj beforeEach** - inicjalizuj stan przed każdym testem
5. **Unikaj testów integracsjnych** - w testach jednostkowych używaj mocków

### Testy E2E

1. **Używaj Page Object Model** - enkapsuluj interakcje ze stroną
2. **Czekaj na elementy** - używaj `waitFor`, `waitForSelector`
3. **Używaj semantycznych selektorów** - role, labels, text content
4. **Testuj critical paths** - najważniejsze ścieżki użytkownika
5. **Unikaj sleep/wait** - używaj auto-waiting Playwright
6. **Grupuj testy logicznie** - używaj `describe` do organizacji

### Nazewnictwo

```typescript
// ❌ Źle
it('test 1', () => {});

// ✅ Dobrze
it('powinien wyświetlić błąd przy pustym formularzu', () => {});

// ✅ Bardzo dobrze
describe('SongForm', () => {
    describe('walidacja', () => {
        it('powinien wyświetlić błąd gdy tytuł jest pusty', () => {});
        it('powinien wyświetlić błąd gdy tytuł jest za długi', () => {});
    });
});
```

### Struktura testu (AAA Pattern)

```typescript
it('powinien dodać piosenkę do repertuaru', async () => {
    // Arrange - przygotuj
    const song = { title: 'Test Song', artist: 'Artist' };
    
    // Act - wykonaj
    await service.addSong(song);
    
    // Assert - sprawdź
    expect(service.getSongs()).toContain(song);
});
```

## CI/CD

### GitHub Actions

Testy są automatycznie uruchamiane na GitHub Actions przy każdym push i pull request.

Konfiguracja: `.github/workflows/test.yml`

Pipeline wykonuje:
1. Instalację zależności
2. Testy jednostkowe z pokryciem
3. Testy E2E dla Chromium
4. Upload raportów

### Lokalne uruchamianie pipeline CI

Przed commitem możesz uruchomić pełny pipeline lokalnie:

```bash
# Zainstaluj zależności
npm ci

# Uruchom linting
npm run lint

# Uruchom testy jednostkowe
npm run test:run

# Uruchom testy E2E
npm run test:e2e:chromium

# Sprawdź build
npm run build
```

## Debugowanie

### Debugowanie testów Vitest

1. Dodaj `debugger` w kodzie testu
2. Uruchom w trybie debug:

```bash
node --inspect-brk ./node_modules/vitest/vitest.js run
```

3. Otwórz Chrome DevTools: `chrome://inspect`

Lub użyj VS Code:
- Ustaw breakpoint
- Uruchom "Debug Vitest" z panelu Debug

### Debugowanie testów Playwright

```bash
# Tryb debug z Playwright Inspector
npm run test:e2e:debug

# Lub konkretny test
npx playwright test auth.spec.ts --debug
```

W trybie debug możesz:
- Wykonywać testy krok po kroku
- Sprawdzać selektory
- Modyfikować testy na żywo

### Debugowanie w przeglądarce

```bash
# Uruchom z widoczną przeglądarką
npm run test:e2e:headed

# Lub z wolniejszym wykonaniem
npx playwright test --slow-mo=1000
```

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)

## Wsparcie

Problemy z testami? Sprawdź:
1. [Troubleshooting](./troubleshooting-tests.md)
2. [GitHub Issues](https://github.com/your-org/strummerbox/issues)
3. Zapytaj zespół na Slack

