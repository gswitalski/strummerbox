# Przewodnik Konfiguracji Środowiska Testowego

Ten dokument opisuje krok po kroku, jak skonfigurować i wdrożyć w pełni funkcjonalne, odizolowane środowisko testowe dla aplikacji StrummerBox. Środowisko to będzie repliką środowiska produkcyjnego, z własną bazą danych i hostingiem.

## Spis Treści
1. [Założenia](#1-założenia)
2. [Krok 1: Utworzenie nowego projektu Supabase](#2-krok-1-utworzenie-nowego-projektu-supabase)
3. [Krok 2: Utworzenie nowego projektu Firebase](#3-krok-2-utworzenie-nowego-projektu-firebase)
4. [Krok 3: Konfiguracja sekretów w GitHub](#4-krok-3-konfiguracja-sekretów-w-github)
5. [Krok 4: Konfiguracja aplikacji Angular](#5-krok-4-konfiguracja-aplikacji-angular)
6. [Krok 5: Utworzenie nowego workflow CI/CD](#6-krok-5-utworzenie-nowego-workflow-cicd)
7. [Krok 6: Testowanie lokalne](#7-krok-6-testowanie-lokalne-opcjonalne-ale-zalecane)
8. [Krok 7: Uruchomienie i weryfikacja](#8-krok-7-uruchomienie-i-weryfikacja)
9. [Rozwiązywanie problemów](#9-rozwiązywanie-problemów)
10. [Najlepsze praktyki](#10-najlepsze-praktyki)
11. [Dokumenty wymagające aktualizacji](#11-dokumenty-wymagające-aktualizacji)
12. [Podsumowanie zmian](#12-podsumowanie-zmian)

---

### 1. Założenia

- Masz dostęp do konta Supabase i uprawnienia do tworzenia nowych projektów.
- Masz dostęp do konsoli Firebase i uprawnienia do tworzenia nowych projektów.
- Masz uprawnienia administracyjne do repozytorium GitHub projektu, aby zarządzać sekretami i dodawać nowe pliki workflow.
- Workflow dla środowiska testowego będzie uruchamiany po każdym `push` do gałęzi `develop`.

### 2. Krok 1: Utworzenie nowego projektu Supabase

Środowisko testowe wymaga własnej, niezależnej bazy danych i API.

1. Zaloguj się na [supabase.com](https://supabase.com).
2. Utwórz nową organizację (jeśli to konieczne) i nowy projekt.
    - **Nazwa projektu**: `strummerbox-test` (lub inna, łatwa do zidentyfikowania).
    - **Region**: Wybierz region geograficznie bliski użytkownikom.
3. Po utworzeniu projektu, przejdź do ustawień i zanotuj następujące wartości. Będą potrzebne w kolejnych krokach:
    - **Project URL**: `Project Settings` > `API` > `URL`
    - **Project `anon` key**: `Project Settings` > `API` > `Project API keys` > `anon` `public`
    - **Project ID**: `Project Settings` > `General` > `Reference ID`
    - **Hasło do bazy danych**: Zostało ustawione podczas tworzenia projektu. Jeśli go nie pamiętasz, możesz je zresetować w `Project Settings` > `Database` > `Password`.

### 3. Krok 2: Utworzenie nowego projektu Firebase

Frontend aplikacji testowej będzie hostowany na oddzielnym projekcie Firebase.

1. Zaloguj się na [console.firebase.google.com](https://console.firebase.google.com).
2. Kliknij **"Add project"** i utwórz nowy projekt.
    - **Nazwa projektu**: `strummerbox-test` (lub podobna).
3. W panelu projektu przejdź do sekcji **Hosting** i skonfiguruj go. Zanotuj domyślny adres URL (np. `strummerbox-test.web.app`). Będzie to publiczny adres URL aplikacji testowej.
4. Wygeneruj klucz konta serwisowego, który pozwoli GitHub Actions na wdrażanie aplikacji:
    - Przejdź do `Project Settings` > `Service accounts`.
    - Kliknij **"Generate new private key"**.
    - Zapisz pobrany plik JSON. Jego zawartość będzie potrzebna w następnym kroku.

### 4. Krok 3: Konfiguracja sekretów w GitHub

Nowe środowisko wymaga własnego zestawu sekretów w repozytorium GitHub.

1. Przejdź do swojego repozytorium na GitHub.
2. Idź do `Settings` > `Secrets and variables` > `Actions`.
3. Dodaj następujące sekrety, używając wartości uzyskanych w poprzednich krokach. Sugerujemy użycie sufiksu `_TEST` dla odróżnienia od sekretów produkcyjnych.

    - `FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_TEST`:
        - **Wartość**: Cała zawartość pliku JSON pobranego z Firebase w Kroku 2.

    - `SUPABASE_URL_TEST`:
        - **Wartość**: Project URL z Supabase.

    - `SUPABASE_ANON_KEY_TEST`:
        - **Wartość**: Klucz `anon` `public` z Supabase.

    - `SUPABASE_PROJECT_ID_TEST`:
        - **Wartość**: Project ID (Reference ID) z Supabase.

    - `SUPABASE_DB_PASSWORD_TEST`:
        - **Wartość**: Hasło do bazy danych Supabase.

    - `APP_PUBLIC_URL_TEST`:
        - **Wartość**: Publiczny adres URL aplikacji z Firebase Hosting (np. `https://strummerbox-test.web.app`).

    - `SUPABASE_ACCESS_TOKEN`:
        - **Wartość**: Ten sekret jest prawdopodobnie już skonfigurowany dla środowiska produkcyjnego. Możesz użyć tego samego tokenu, ponieważ jest to osobisty token dostępu do Twojego konta Supabase.

### 5. Krok 4: Konfiguracja aplikacji Angular

Musimy poinformować aplikację Angular o nowym środowisku i przekazać jej odpowiednie klucze.

1. **Utwórz nowy plik środowiskowy**
    Stwórz plik `src/environments/environment.test.ts` i wklej do niego poniższą zawartość. Zmienne `url` i `anonKey` zostaną dynamicznie podmienione przez CI/CD.

    ```typescript
    // src/environments/environment.test.ts
    export const environment = {
        production: false,
        supabase: {
            url: '#{SUPABASE_URL_TEST}#',
            anonKey: '#{SUPABASE_ANON_KEY_TEST}#',
        },
    };
    ```

    > **⚠️ Uwaga**: Struktura musi być zgodna z `environment.prod.ts` (zagnieżdżony obiekt `supabase`).

2. **Zaktualizuj konfigurację Angulara**
    Otwórz plik `angular.json` i dodaj nową konfigurację `test` w sekcjach `build` i `serve`.

    W sekcji `projects.strummerbox.architect.build.configurations` dodaj:
    ```json
    "test": {
        "budgets": [
            {
                "type": "initial",
                "maximumWarning": "500kB",
                "maximumError": "1MB"
            },
            {
                "type": "anyComponentStyle",
                "maximumWarning": "4kB",
                "maximumError": "8kB"
            }
        ],
        "fileReplacements": [
            {
                "replace": "src/environments/environment.ts",
                "with": "src/environments/environment.test.ts"
            }
        ],
        "outputHashing": "all"
    }
    ```

    W sekcji `projects.strummerbox.architect.serve.configurations` dodaj:
    ```json
    "test": {
        "buildTarget": "strummerbox:build:test"
    }
    ```

3. **Zaktualizuj konfigurację Firebase**
    Otwórz plik `.firebaserc` i dodaj wpis dla środowiska testowego:
    ```json
    {
      "projects": {
        "default": "strummerbox-prod",
        "production": "strummerbox-prod",
        "test": "strummerbox-test"
      }
    }
    ```

### 6. Krok 5: Utworzenie nowego workflow CI/CD

Stworzymy nowy workflow, który będzie odpowiedzialny za automatyczne wdrażanie środowiska testowego.

1. Stwórz nowy plik `.github/workflows/test-deploy.yml`.
2. Wklej do niego poniższą zawartość. Jest to zmodyfikowana wersja workflow produkcyjnego, dostosowana do środowiska testowego:
    - Uruchamia się na `push` do gałęzi `develop` oraz obsługuje manualne uruchomienie (`workflow_dispatch`).
    - Używa sekretów z sufiksem `_TEST`.
    - Buduje aplikację z konfiguracją `test`.
    - Używa tego samego podejścia do instalacji Supabase CLI co środowisko produkcyjne (`npm install`).

    ```yaml
    # .github/workflows/test-deploy.yml
    name: Deploy to Test Environment (Firebase & Supabase)

    on:
      push:
        branches:
          - develop
      workflow_dispatch:

    jobs:
      # ==========================================
      # JOB 1: Testy Jednostkowe (Gate Keeper)
      # ==========================================
      test:
        name: 🧪 Testy Jednostkowe
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'npm'

          - name: Install dependencies
            run: npm ci

          - name: Run unit tests
            run: npm run test:run

      # ==========================================
      # JOB 2: Deploy Backendu (Supabase)
      # ==========================================
      deploy-backend:
        name: 🚀 Deploy Backendu (Supabase)
        runs-on: ubuntu-latest
        needs: test  # Czeka na zakończenie testów

        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD_TEST }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID_TEST }}

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'

          - name: Install Supabase CLI
            run: npm install supabase --save-dev

          - name: Link Supabase project (non-interactive)
            run: npx supabase link --project-ref $SUPABASE_PROJECT_ID

          - name: Push Database Migrations
            run: npx supabase db push

          - name: Set Supabase Secrets
            run: |
              echo "APP_PUBLIC_URL=${{ secrets.APP_PUBLIC_URL_TEST }}" > .env.test
              npx supabase secrets set --env-file .env.test

          - name: Deploy Supabase Functions
            run: npx supabase functions deploy --project-ref $SUPABASE_PROJECT_ID

      # ==========================================
      # JOB 3: Deploy Frontendu (Firebase)
      # ==========================================
      deploy-frontend:
        name: 🌐 Deploy Frontendu (Firebase)
        runs-on: ubuntu-latest
        needs: deploy-backend  # Czeka na zakończenie deploy backendu

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'npm'

          - name: Install dependencies
            run: npm ci

          - name: Replace environment variables for Frontend
            run: |
              sed -i "s|#{SUPABASE_URL_TEST}#|${{ secrets.SUPABASE_URL_TEST }}|g" src/environments/environment.test.ts
              sed -i "s|#{SUPABASE_ANON_KEY_TEST}#|${{ secrets.SUPABASE_ANON_KEY_TEST }}|g" src/environments/environment.test.ts

          - name: Build Angular application
            run: ng build --configuration test

          - name: Deploy Frontend to Firebase Hosting
            uses: FirebaseExtended/action-hosting-deploy@v0
            with:
              repoToken: '${{ secrets.GITHUB_TOKEN }}'
              firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_TEST }}'
              channelId: live
              projectId: strummerbox-test
              target: test
    ```

    > **⚠️ Kluczowe poprawki**:
    > - `projectId` używa nazwy projektu Firebase (`strummerbox-test`), a nie `SUPABASE_PROJECT_ID_TEST`
    > - Dodano `target: test` aby użyć właściwego projektu Firebase z `.firebaserc`
    > - Sekrety Supabase są tworzone w tymczasowym pliku `.env.test` (analogicznie do `.env.production`)
    > - Używany jest `npm install supabase` zamiast `supabase/setup-cli` action dla spójności z produkcją

### 7. Krok 6: Testowanie lokalne (opcjonalne, ale zalecane)

Przed wypchnieniem zmian możesz przetestować konfigurację lokalnie:

1. **Sprawdź czy build działa z konfiguracją test**:
   ```bash
   ng build --configuration test
   ```

2. **Uruchom aplikację lokalnie z konfiguracją test**:
   ```bash
   ng serve --configuration test
   ```

3. **Zweryfikuj strukturę pliku environment.test.ts**:
   - Upewnij się, że struktura jest zgodna z `environment.prod.ts`
   - Sprawdź czy placeholdery `#{SUPABASE_URL_TEST}#` i `#{SUPABASE_ANON_KEY_TEST}#` są obecne

### 8. Krok 7: Uruchomienie i weryfikacja

1. **Zatwierdź wszystkie zmiany**:
   ```bash
   git add .
   git commit -m "Add test environment configuration"
   ```

2. **Stwórz i wypchnij gałąź `develop`** (jeśli jeszcze nie istnieje):
   ```bash
   git checkout -b develop
   git push --set-upstream origin develop
   ```

   Jeśli gałąź `develop` już istnieje:
   ```bash
   git checkout develop
   git push
   ```

3. Po wypchnięciu zmian przejdź do zakładki **"Actions"** w repozytorium GitHub.

4. Powinieneś zobaczyć nowo uruchomiony workflow **"Deploy to Test Environment (Firebase & Supabase)"**.

5. Zweryfikuj każdy job:
   - ✅ **Testy Jednostkowe** - muszą przejść, aby kontynuować
   - ✅ **Deploy Backendu** - sprawdź logi czy migracje i funkcje zostały wdrożone
   - ✅ **Deploy Frontendu** - sprawdź czy build się udał i czy aplikacja została wdrożona na Firebase

6. Po pomyślnym zakończeniu wszystkich jobów, Twoje środowisko testowe powinno być dostępne pod adresem:
   ```
   https://strummerbox-test.web.app
   ```

7. **Weryfikacja działania**:
   - Sprawdź, czy aplikacja się ładuje
   - Sprawdź, czy logowanie/rejestracja działa (łączność z Supabase)
   - Sprawdź w konsoli przeglądarki czy nie ma błędów połączenia z API
   - Sprawdź logi w Supabase Dashboard czy funkcje Edge działają poprawnie

### 9. Rozwiązywanie problemów

#### Problem: `Error: Invalid values: Argument: project, Given: "test"`
**Rozwiązanie**: Używasz niepoprawnej składni polecenia build. Użyj:
```bash
ng build --configuration test
```
Zamiast `npm run build -- --configuration test` (spacja zamiast `=` powoduje, że Angular CLI interpretuje `test` jako nazwę projektu).

#### Problem: `Error: No test suite found in file .../environment.test.ts`
**Rozwiązanie**: Vitest próbuje uruchomić plik środowiskowy jako test. Dodaj wykluczenie w `vitest.config.ts`:
```typescript
exclude: ['node_modules', 'dist', '.angular', 'src/environments/**']
```

#### Problem: Build się nie udaje z błędem o brakujących zmiennych środowiskowych
**Rozwiązanie**: Sprawdź czy plik `environment.test.ts` ma poprawną strukturę (zagnieżdżony obiekt `supabase`) i czy placeholdery są dokładnie takie jak w workflow (`#{SUPABASE_URL_TEST}#`).

#### Problem: Firebase deployment kończy się błędem "Invalid project ID"
**Rozwiązanie**: 
- Upewnij się, że projekt Firebase został utworzony i ma nazwę `strummerbox-test`
- Sprawdź czy `.firebaserc` zawiera wpis dla `test`
- W workflow sprawdź czy `projectId` i `target` są ustawione poprawnie

#### Problem: Supabase functions nie mogą się połączyć z bazą
**Rozwiązanie**: 
- Sprawdź czy sekret `APP_PUBLIC_URL_TEST` jest ustawiony poprawnie
- Zweryfikuj czy migracje zostały poprawnie wdrożone (`supabase db push`)
- Sprawdź logi funkcji Edge w Supabase Dashboard

#### Problem: Workflow kończy się błędem podczas testów
**Rozwiązanie**: Workflow nie będzie kontynuował jeśli testy nie przejdą. Uruchom testy lokalnie `npm run test:run` aby zidentyfikować problem.

#### Problem: "sed: command not found" na Windows runners
**Rozwiązanie**: Workflow używa `ubuntu-latest`, więc ten problem nie powinien wystąpić. Jeśli jednak tak się stanie, można użyć cross-platform zamiennika lub PowerShell.

### 10. Najlepsze praktyki

1. **Zawsze testuj lokalnie** przed wypychaniem na `develop`:
   ```bash
   ng build --configuration test
   ```

2. **Użyj workflow_dispatch** do manualnego wdrożenia:
   - Przejdź do Actions → Deploy to Test Environment
   - Kliknij "Run workflow"

3. **Regularnie synchronizuj środowiska**:
   - Migracje bazy danych powinny być najpierw testowane na środowisku testowym
   - Merge do `main` dopiero po weryfikacji na `test`

4. **Monitoruj koszty**:
   - Środowisko testowe też generuje koszty w Supabase i Firebase
   - Rozważ usunięcie starych danych testowych

5. **Dokumentuj zmiany w sekretach**:
   - Jeśli dodajesz nowy sekret do produkcji, dodaj też jego wersję `_TEST`

### 11. Dokumenty wymagające aktualizacji

Po pomyślnym wdrożeniu środowiska testowego, następujące dokumenty powinny zostać zaktualizowane, aby odzwierciedlić nową architekturę:

1.  **`docs/hosting.md`**:
    - Należy dodać nową sekcję opisującą architekturę środowiska testowego
    - Opisać nowy workflow (`test-deploy.yml`), jego przeznaczenie, branch (`develop`), oraz zestaw sekretów (`_TEST`)
    - Dodać diagram architektury z dwoma środowiskami

2.  **Główny `README.md` projektu (jeśli istnieje i opisuje środowiska)**:
    - Dodać informację o istnieniu środowiska testowego
    - Podać adres URL: `https://strummerbox-test.web.app`
    - Wyjaśnić jak wdrażać zmiany (push do `develop`)

3.  **`docs/test-env-guide.md` (ten plik)**:
    - Dokument został zaktualizowany i zawiera wszystkie niezbędne informacje
    - W razie dodania nowych sekretów lub zmian w procesie, należy go aktualizować

### 12. Podsumowanie zmian

W ramach konfiguracji środowiska testowego zostały wprowadzone następujące zmiany:

#### Nowe pliki:
- ✅ `src/environments/environment.test.ts` - konfiguracja środowiskowa dla testu
- ✅ `.github/workflows/test-deploy.yml` - workflow CI/CD dla środowiska testowego

#### Zmodyfikowane pliki:
- ✅ `angular.json` - dodano konfigurację `test` w sekcjach `build` i `serve`
- ✅ `.firebaserc` - dodano wpis dla projektu testowego

#### Wymagane sekrety GitHub (do skonfigurowania ręcznie):
- `FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_TEST`
- `SUPABASE_URL_TEST`
- `SUPABASE_ANON_KEY_TEST`
- `SUPABASE_PROJECT_ID_TEST`
- `SUPABASE_DB_PASSWORD_TEST`
- `APP_PUBLIC_URL_TEST`
- `SUPABASE_ACCESS_TOKEN` (współdzielony z produkcją)

#### Infrastruktura cloud (do utworzenia ręcznie):
- Nowy projekt Supabase: `strummerbox-test`
- Nowy projekt Firebase: `strummerbox-test`
