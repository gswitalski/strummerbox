# GitHub Actions CI/CD Setup - StrummerBox

## Przegląd

Został utworzony minimalny pipeline CI/CD dla projektu StrummerBox, który automatycznie weryfikuje poprawność kodu poprzez uruchomienie testów jednostkowych i buildu produkcyjnego.

### Użyte wersje GitHub Actions

Pipeline wykorzystuje najnowsze wersje oficjalnych akcji GitHub (stan na listopad 2025):

- **actions/checkout@v5** - Pobieranie kodu z repozytorium
- **actions/setup-node@v6** - Konfiguracja środowiska Node.js
- **actions/upload-artifact@v5** - Upload artefaktów buildu

Wszystkie akcje są aktywnie wspierane i nie są oznaczone jako deprecated.

## Lokalizacja

```
.github/workflows/ci.yml
```

## Funkcjonalność

Pipeline składa się z dwóch jobów wykonywanych sekwencyjnie:

### Job 1: `unit-tests` (Testy jednostkowe)

Pierwszy job, który uruchamia się zawsze:

1. **Checkout repository** - Pobiera kod źródłowy z repozytorium.
2. **Setup Node.js** - Konfiguruje środowisko Node.js w wersji 22.x z cache'owaniem npm.
3. **Instalacja zależności** - Używa `npm ci` dla deterministycznej instalacji.
4. **Uruchomienie testów jednostkowych** - Wykonuje `npm run test:run` (Vitest).

### Job 2: `build` (Build produkcyjny)

Drugi job, który uruchamia się **tylko po pomyślnym zakończeniu testów** (dzięki `needs: unit-tests`):

1. **Checkout repository** - Pobiera kod źródłowy z repozytorium.
2. **Setup Node.js** - Konfiguruje środowisko Node.js w wersji 22.x z cache'owaniem npm.
3. **Instalacja zależności** - Używa `npm ci` dla deterministycznej instalacji.
4. **Build produkcyjny** - Wykonuje `npm run build`, tworząc zoptymalizowaną wersję produkcyjną aplikacji Angular.
5. **Weryfikacja buildu** - Sprawdza, czy folder `dist/strummerbox` został poprawnie utworzony.
6. **Upload artefaktów** - Jeśli wszystkie poprzednie kroki się powiodą, artefakty buildu są przechowywane przez 7 dni.

### Zależności między jobami

```
┌─────────────┐
│ unit-tests  │
│   (Job 1)   │
└──────┬──────┘
       │
       │ needs: unit-tests
       │
       ▼
  ┌─────────┐
  │  build  │
  │ (Job 2) │
  └─────────┘
```

**Możliwe scenariusze:**
- `unit-tests (✅)` → `build (✅)` - Oba joby wykonane pomyślnie
- `unit-tests (❌)` → `build (⏭️ pominięty)` - Build nie zostanie uruchomiony

Jeśli testy jednostkowe failują, job `build` w ogóle się nie uruchomi, co oszczędza czas i zasoby.

**Kluczowa implementacja:**
```yaml
build:
  name: Build produkcyjny
  needs: unit-tests  # ← Ta linia sprawia, że build czeka na testy
  runs-on: ubuntu-latest
```

## Triggery

Pipeline uruchamia się w dwóch scenariuszach:

### Automatycznie
```yaml
on:
  push:
    branches:
      - main
```
Po każdym push'u do brancha `main`.

### Manualnie
```yaml
on:
  workflow_dispatch:
```
Z poziomu zakładki "Actions" w GitHub poprzez przycisk "Run workflow".

## Wymagania

- **Node.js**: 22.x
- **Package Manager**: npm
- **System operacyjny**: Ubuntu (latest)

## Uprawnienia

Pipeline używa minimalnych uprawnień:
```yaml
permissions:
  contents: read
```

## Monitoring

### Status Pipeline

Status pipeline można sprawdzić w kilku miejscach:

1. **GitHub Repository** - badge na głównej stronie README (opcjonalnie)
2. **Zakładka Actions** - pełna historia uruchomień
3. **Pull Requests** - automatyczne sprawdzenie przed merge'em (jeśli skonfigurowane branch protection rules)

### Artefakty

Po pomyślnym zakończeniu buildu:
- Artefakty są dostępne do pobrania przez 7 dni
- Zawierają kompletny build produkcyjny z folderu `dist/strummerbox`

## Przyszłe rozszerzenia

Pipeline można rozszerzyć o:

### Testy E2E
```yaml
- name: Uruchomienie testów E2E
  run: npm run test:e2e
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

### Linting
```yaml
- name: Uruchomienie lintera
  run: npm run lint
```

### Coverage Report
```yaml
- name: Generowanie coverage report
  run: npm run test:coverage

- name: Upload coverage do Codecov
  uses: codecov/codecov-action@v4
```

### Deploy do środowiska stagingowego/produkcyjnego
```yaml
- name: Deploy do DigitalOcean
  if: github.ref == 'refs/heads/master'
  run: |
    # Skrypt deploymentu
```

### Cache Dependencies
Już zaimplementowane poprzez:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

## Rozwiązywanie problemów

### Pipeline się nie uruchamia

**Problem**: Workflow nie pojawia się w zakładce Actions.

**Rozwiązanie**: 
1. Upewnij się, że plik znajduje się w `.github/workflows/ci.yml`
2. Sprawdź składnię YAML (nie może być błędów)
3. Zcommituj i wypchnij zmiany do brancha `master`

### Testy jednostkowe failują

**Problem**: Krok "Uruchomienie testów jednostkowych" kończy się błędem.

**Rozwiązanie**:
1. Uruchom testy lokalnie: `npm run test:run`
2. Sprawdź logi w GitHub Actions, aby zidentyfikować konkretny test
3. Popraw test lub kod źródłowy
4. Upewnij się, że wszystkie zmienne środowiskowe są ustawione

### Build produkcyjny failuje

**Problem**: Krok "Build produkcyjny" kończy się błędem.

**Rozwiązanie**:
1. Uruchom build lokalnie: `npm run build`
2. Sprawdź błędy kompilacji TypeScript
3. Upewnij się, że wszystkie zależności są zainstalowane
4. Sprawdź konfigurację Angular w `angular.json`

### Brak artefaktów

**Problem**: Artefakty buildu nie są dostępne do pobrania.

**Rozwiązanie**:
1. Sprawdź, czy poprzednie kroki zakończyły się sukcesem
2. Warunek `if: success()` musi być spełniony
3. Sprawdź uprawnienia workflow - mogą być za restrykcyjne

## Koszty

GitHub Actions dla repozytoriów publicznych:
- **Darmowe** - nielimitowane minuty

GitHub Actions dla repozytoriów prywatnych:
- **2000 minut/miesiąc** w planie darmowym
- Przeciętny czas jednego uruchomienia: ~3-5 minut
- Szacowana ilość uruchomień: ~400-600/miesiąc

## Podsumowanie

✅ **Utworzony minimalny pipeline CI/CD**
✅ **Automatyczne uruchamianie po push do master**
✅ **Możliwość manualnego uruchomienia**
✅ **Testy jednostkowe (Vitest)**
✅ **Build produkcyjny (Angular)**
✅ **Weryfikacja poprawności buildu**
✅ **Upload artefaktów**

Pipeline jest gotowy do użycia i stanowi solidną podstawę do dalszego rozwoju procesu CI/CD w projekcie StrummerBox.

