# CI/CD Quick Start Guide

## Pierwsze uruchomienie

Po stworzeniu repozytorium GitHub i wypchnięciu kodu, pipeline CI/CD automatycznie się uruchomi przy pierwszym push'u do brancha `main`.

Pipeline składa się z dwóch jobów:
1. **unit-tests** - Uruchamia testy jednostkowe (Vitest)
2. **build** - Buduje aplikację w wersji produkcyjnej (tylko jeśli testy przejdą)

Jeśli testy failują, build nie zostanie uruchomiony - oszczędza to czas i zasoby.

## Sprawdzenie statusu pipeline

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij zakładkę **"Actions"**
3. Zobaczysz listę wszystkich uruchomień workflow
4. Kliknij na konkretne uruchomienie, aby zobaczyć:
   - Status joba **unit-tests**
   - Status joba **build** (uruchamia się tylko po pomyślnym zakończeniu testów)
   - Wizualizację graficzną zależności między jobami

## Ręczne uruchomienie pipeline

Jeśli chcesz uruchomić pipeline bez push'owania kodu:

1. Przejdź do zakładki **"Actions"**
2. Wybierz workflow **"CI/CD Pipeline"** z lewej strony
3. Kliknij przycisk **"Run workflow"** po prawej stronie
4. Wybierz branch (domyślnie `main`)
5. Kliknij zielony przycisk **"Run workflow"**

## Weryfikacja poprawności workflow

Pipeline został zaprojektowany zgodnie z best practices:

✅ **Poprawny branch**: Używa `main` (zweryfikowany przez `git branch -a`)  
✅ **Najnowsze wersje akcji**: Wszystkie akcje GitHub są w najnowszych wersjach (v5/v6)  
✅ **npm ci**: Deterministyczna instalacja zależności  
✅ **Brak deprecated actions**: Wszystkie akcje są aktywnie wspierane  

## Aktualizacja badge'a w README

Badge statusu pipeline w `README.md` zawiera placeholder `YOUR_USERNAME`. Aby go zaktualizować:

1. Otwórz plik `README.md`
2. Znajdź linię:
   ```markdown
   ![CI/CD Pipeline](https://github.com/YOUR_USERNAME/strummerbox/actions/workflows/ci.yml/badge.svg)
   ```
3. Zamień `YOUR_USERNAME` na swoją nazwę użytkownika GitHub
4. Przykład:
   ```markdown
   ![CI/CD Pipeline](https://github.com/john-doe/strummerbox/actions/workflows/ci.yml/badge.svg)
   ```
5. Zapisz i wypchnij zmiany

Badge automatycznie pokaże aktualny status pipeline (✅ passing lub ❌ failing).

## Pobieranie artefaktów buildu

Jeśli pipeline zakończył się sukcesem, możesz pobrać zbudowaną aplikację:

1. Przejdź do szczegółów konkretnego uruchomienia workflow
2. Przewiń na dół strony do sekcji **"Artifacts"**
3. Kliknij **"build-artifacts"** aby pobrać plik ZIP
4. Rozpakuj plik - znajdziesz w nim zawartość folderu `dist/strummerbox`

**Uwaga**: Artefakty są przechowywane przez 7 dni, po tym czasie są automatycznie usuwane.

## Rozwiązywanie problemów

### Pipeline się nie uruchamia

Jeśli workflow nie pojawia się w zakładce Actions:

```bash
# Sprawdź, czy plik workflow istnieje
ls -la .github/workflows/ci.yml

# Sprawdź składnię YAML online
# https://www.yamllint.com/

# Upewnij się, że zmiany są zacommitowane i wypchnięte
git status
git add .github/workflows/ci.yml
git commit -m "Add CI/CD pipeline"
git push origin main
```

### Testy failują

Jeśli pipeline zatrzymuje się na etapie testów:

```bash
# Uruchom testy lokalnie, aby zobaczyć błędy
npm run test:run

# Sprawdź konkretne testy
npm run test

# Napraw kod lub testy
# Wypchnij poprawki
git add .
git commit -m "Fix failing tests"
git push origin main
```

### Build failuje

Jeśli pipeline zatrzymuje się na etapie buildu:

```bash
# Uruchom build lokalnie
npm run build

# Sprawdź błędy kompilacji TypeScript
npx tsc --noEmit

# Napraw błędy
# Wypchnij poprawki
git add .
git commit -m "Fix build errors"
git push origin main
```

## Co dalej?

Pipeline można rozszerzyć o:

### 1. Linting
Dodaj do pliku `.github/workflows/ci.yml` przed testami:

```yaml
- name: Linting
  run: npm run lint
```

### 2. Testy E2E
Dodaj po testach jednostkowych:

```yaml
- name: Uruchomienie testów E2E
  run: npm run test:e2e
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

**Uwaga**: Wymagane zmienne środowiskowe należy dodać w Settings → Secrets and variables → Actions.

### 3. Code Coverage
Zamień krok testów na:

```yaml
- name: Uruchomienie testów jednostkowych z coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage-final.json
```

### 4. Deploy
Dodaj na końcu pipeline:

```yaml
- name: Deploy do środowiska produkcyjnego
  if: github.ref == 'refs/heads/main' && success()
  run: |
    # Skrypt deploymentu do DigitalOcean
```

## Dodatkowe zasoby

- [Dokumentacja GitHub Actions](https://docs.github.com/en/actions)
- [Dokumentacja workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Szczegółowa dokumentacja CI/CD StrummerBox](./results/github-actions-ci-setup.md)

