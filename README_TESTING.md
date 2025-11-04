# 🧪 Testowanie w StrummerBox - Quick Reference

## ⚡ Szybki start

### Uruchom testy
```bash
# Testy jednostkowe - interaktywny UI (POLECANE)
npm run test:ui

# Testy jednostkowe - watch mode
npm run test

# Testy E2E - interaktywny UI
npm run test:e2e:ui

# Raport pokrycia kodu
npm run test:coverage
```

---

## 📚 Dokumentacja

| Dokument | Co znajdziesz | Kiedy czytać |
|----------|---------------|--------------|
| **[testing-quick-start.md](./docs/testing-quick-start.md)** | Szybki start, podstawy, pierwsze testy | **START TUTAJ** |
| **[testing-guide.md](./docs/testing-guide.md)** | Kompletny przewodnik, wszystkie techniki | Gdy chcesz pogłębić wiedzę |
| **[troubleshooting-tests.md](./docs/troubleshooting-tests.md)** | Rozwiązywanie problemów | Gdy coś nie działa |
| **[e2e/README.md](./e2e/README.md)** | Page Object Model, testy E2E | Gdy piszesz testy E2E |

---

## 💡 Przykłady

### Gdzie znaleźć przykłady?

| Plik | Co zawiera |
|------|------------|
| `src/app/shared/utils/test-examples.spec.ts` | **38 przykładów** różnych technik testowania |
| `src/app/shared/components/button/button.component.spec.ts` | Szablon testu komponentu |
| `e2e/pages/login.page.ts` | Przykład Page Object Model |
| `e2e/fixtures/test-users.ts` | Dane testowe |

### Szybkie szablony

#### Test komponentu:
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

#### Test serwisu:
```typescript
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { MyService } from './my.service';

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
});
```

---

## 🎯 Najczęstsze komendy

```bash
# DEVELOPMENT
npm run test                # Watch mode - auto reload
npm run test:ui             # Interactive UI ⭐
npm run test:coverage       # Coverage report

# E2E
npm run test:e2e:ui         # Interactive Playwright UI ⭐
npm run test:e2e:debug      # Debug mode - step by step
npm run test:e2e:chromium   # Only Chrome

# CI
npm run test:run            # Run once (CI mode)
npm run test:e2e            # All browsers
```

---

## 📊 Status środowiska

✅ **Vitest 4.0.7** - testy jednostkowe  
✅ **Playwright 1.56.1** - testy E2E  
✅ **41 przykładowych testów** - wszystkie przechodzą  
✅ **1800+ linii dokumentacji** - kompletna  
✅ **CI/CD** - GitHub Actions gotowe  

---

## 🆘 Potrzebujesz pomocy?

1. **Sprawdź:** [troubleshooting-tests.md](./docs/troubleshooting-tests.md)
2. **Zobacz przykłady:** `test-examples.spec.ts` (38 przykładów)
3. **Debuguj:** `npm run test:ui`

---

## 🎓 Ścieżka nauki

### Dzień 1: Podstawy
- Przeczytaj: `docs/testing-quick-start.md`
- Uruchom: `npm run test:ui`

### Dzień 2: Praktyka
- Zobacz: `test-examples.spec.ts`
- Napisz: Swój pierwszy test

### Dzień 3: Pogłębienie
- Przeczytaj: `docs/testing-guide.md`
- Napisz: Testy dla komponentu

### Dzień 4: E2E
- Przeczytaj: `e2e/README.md`
- Eksperymentuj: `npm run test:e2e:ui`

---

## 🌟 Tips & Tricks

### Uruchom konkretny test:
```bash
npm run test -- songs
npm run test -- button
```

### Debugowanie:
```bash
# Vitest - interaktywny UI
npm run test:ui

# Playwright - step by step
npm run test:e2e:debug
```

### Zobacz pokrycie:
```bash
npm run test:coverage
# Otwórz: coverage/index.html
```

---

**Status:** ✅ GOTOWE DO UŻYCIA

**Start:** Przeczytaj [testing-quick-start.md](./docs/testing-quick-start.md)

