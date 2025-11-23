# Quick Start - Testowanie w StrummerBox

Szybki przewodnik dla programistów rozpoczynających pracę z testami w projekcie StrummerBox.

## Instalacja

Wszystkie zależności testowe są już zainstalowane w projekcie. Jeśli dopiero sklonowałeś repozytorium:

```bash
npm install
```

Zainstaluj przeglądarki Playwright (tylko raz):

```bash
npx playwright install
```

## Pierwsze kroki

### 1. Uruchom testy jednostkowe

```bash
npm run test
```

Testy uruchomią się w trybie watch - będą automatycznie ponawiane przy każdej zmianie w kodzie.

### 2. Uruchom testy E2E

```bash
npm run test:e2e
```

Dev server uruchomi się automatycznie, a następnie testy zostaną wykonane we wszystkich przeglądarkach.

### 3. Zobacz raporty

**Testy jednostkowe - UI mode:**

```bash
npm run test:ui
```

Otwiera się interaktywny interfejs z listą testów.

**Testy E2E - raport HTML:**

```bash
npm run test:e2e:report
```

## Tworzenie pierwszego testu

### Test jednostkowy komponentu

1. Utwórz plik obok komponentu: `my-component.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MyComponent } from './my-component.component';

describe('MyComponent', () => {
    let component: MyComponent;
    let fixture: ComponentFixture<MyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('powinien utworzyć komponent', () => {
        expect(component).toBeTruthy();
    });
});
```

2. Uruchom test:

```bash
npm run test
```

### Test jednostkowy serwisu

1. Utwórz plik obok serwisu: `my-service.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from './my-service.service';

describe('MyService', () => {
    let service: MyService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MyService],
        });

        service = TestBed.inject(MyService);
    });

    it('powinien zostać utworzony', () => {
        expect(service).toBeTruthy();
    });

    it('powinien zwrócić dane', () => {
        const result = service.getData();
        expect(result).toBeDefined();
    });
});
```

### Test E2E

1. Utwórz plik w katalogu `e2e/`: `my-feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Moja funkcjonalność', () => {
    test('powinien wyświetlić stronę', async ({ page }) => {
        await page.goto('/my-page');

        await expect(page.getByRole('heading', { name: 'Tytuł' })).toBeVisible();
    });
});
```

2. Uruchom test:

```bash
npm run test:e2e
```

## Przykłady testów

### Test komponentu z inputami

```typescript
describe('SongComponent', () => {
    it('powinien wyświetlić tytuł piosenki', () => {
        component.song = { title: 'Test Song', artist: 'Artist' };
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h2')?.textContent).toContain('Test Song');
    });
});
```

### Test komponentu z outputami

```typescript
describe('ButtonComponent', () => {
    it('powinien emitować zdarzenie kliknięcia', () => {
        let clicked = false;
        component.onClick.subscribe(() => (clicked = true));

        component.handleClick();

        expect(clicked).toBe(true);
    });
});
```

### Test serwisu z HTTP

```typescript
import { vi } from 'vitest';

describe('SongsService', () => {
    let httpMock: any;

    beforeEach(() => {
        httpMock = {
            get: vi.fn().mockResolvedValue({ data: [] }),
        };

        TestBed.configureTestingModule({
            providers: [
                SongsService,
                { provide: HttpClient, useValue: httpMock },
            ],
        });

        service = TestBed.inject(SongsService);
    });

    it('powinien pobrać piosenki', async () => {
        await service.getSongs();

        expect(httpMock.get).toHaveBeenCalledWith('/api/songs');
    });
});
```

### Test E2E z logowaniem

```typescript
import { login } from './utils/test-helpers';
import { testUsers } from './fixtures/test-users';

test('powinien wyświetlić dashboard po zalogowaniu', async ({ page }) => {
    await login(page, testUsers.validUser.email, testUsers.validUser.password);

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Witaj!')).toBeVisible();
});
```

### Test E2E z formularzem

```typescript
test('powinien utworzyć nową piosenkę', async ({ page }) => {
    await page.goto('/songs/new');

    await page.getByLabel('Tytuł').fill('Nowa piosenka');
    await page.getByLabel('Artysta').fill('Artysta');
    await page.getByLabel('Tekst').fill('Treść piosenki');

    await page.getByRole('button', { name: 'Zapisz' }).click();

    await expect(page.getByText('Piosenka została zapisana')).toBeVisible();
});
```

## Dobre praktyki - szybki checklist

### Testy jednostkowe

-   ✅ Testuj publiczne API, nie implementację
-   ✅ Mockuj wszystkie zewnętrzne zależności
-   ✅ Jeden test = jedna koncepcja
-   ✅ Używaj opisowych nazw testów
-   ✅ Grupuj testy logicznie używając `describe`

### Testy E2E

-   ✅ Używaj Page Object Model
-   ✅ Preferuj semantyczne selektory (role, label, text)
-   ✅ Czekaj na elementy zamiast używać timeout
-   ✅ Izoluj testy - każdy test niezależny
-   ✅ Testuj critical user paths

## Najczęstsze komendy

```bash
# Testy jednostkowe
npm run test                # Watch mode
npm run test:ui             # UI mode
npm run test:run            # Raz (CI mode)
npm run test:coverage       # Z raportem pokrycia

# Testy E2E
npm run test:e2e            # Wszystkie przeglądarki
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:debug      # Debug mode
npm run test:e2e:chromium   # Tylko Chrome
npm run test:e2e:headed     # Z widoczną przeglądarką

# Linting
npm run lint                # Sprawdź błędy
npm run lint:fix            # Napraw automatycznie
```

## Debugowanie

### Vitest

```bash
# UI mode - najlepszy sposób na debugging
npm run test:ui
```

W UI mode możesz:

-   Zobaczyć wszystkie testy
-   Uruchomić pojedyncze testy
-   Zobacz szczegóły błędów
-   Zobacz pokrycie kodu

### Playwright

```bash
# Debug mode - step by step
npm run test:e2e:debug
```

W debug mode możesz:

-   Wykonywać testy krok po kroku
-   Sprawdzać selektory
-   Zobacz co widzi przeglądarka
-   Modify tests na żywo

## Struktura plików

```
src/app/
├── core/
│   └── services/
│       ├── auth.service.ts
│       └── auth.service.spec.ts          ← test obok serwisu
├── pages/
│   └── songs/
│       ├── songs.component.ts
│       └── songs.component.spec.ts       ← test obok komponentu
└── shared/
    └── components/
        └── button/
            ├── button.component.ts
            └── button.component.spec.ts  ← test obok komponentu

e2e/
├── fixtures/                              ← dane testowe
│   └── test-users.ts
├── pages/                                 ← Page Object Models
│   └── login.page.ts
├── utils/                                 ← pomocnicze funkcje
│   └── test-helpers.ts
└── auth.spec.ts                          ← testy E2E
```

## Co dalej?

1. **Przeczytaj pełną dokumentację:**

    - [Testing Guide](./testing-guide.md) - kompletny przewodnik
    - [Troubleshooting](./troubleshooting-tests.md) - rozwiązywanie problemów
    - [E2E README](../e2e/README.md) - szczegóły testów E2E

2. **Zobacz przykłady:**

    - `src/app/app.component.spec.ts` - przykład testu komponentu
    - `src/app/core/services/auth.service.spec.ts` - przykład testu serwisu
    - `e2e/auth.spec.ts` - przykład testu E2E
    - `e2e/songs.spec.ts` - zaawansowane testy E2E

3. **Eksperymentuj:**
    - Uruchom `npm run test:ui` i zobacz wszystkie testy
    - Uruchom `npm run test:e2e:debug` i zobacz jak działają testy E2E
    - Dodaj własny test i zobacz jak działa

## Wsparcie

-   **Dokumentacja:** `docs/testing-guide.md`
-   **Problemy:** `docs/troubleshooting-tests.md`
-   **Zespół:** Slack #testing
-   **Issues:** GitHub Issues

## Checklist przed PR

Przed utworzeniem Pull Request upewnij się, że:

```bash
# 1. Wszystkie testy przechodzą
npm run test:run
npm run test:e2e:chromium

# 2. Linting jest OK
npm run lint

# 3. Build działa
npm run build

# 4. Dodałeś testy dla nowego kodu
# 5. Pokrycie kodu > 80%
npm run test:coverage
```

---

**Pro tip:** Dodaj do `.git/hooks/pre-push`:

```bash
#!/bin/sh
npm run test:run && npm run lint
```

To automatycznie uruchomi testy przed każdym pushem!

