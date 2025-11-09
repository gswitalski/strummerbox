# Kompletny Przewodnik Wdrożenia Aplikacji Webowej: Od Zera do Produkcji

Ten dokument to szczegółowa instrukcja krok po kroku, jak wdrożyć nową aplikację webową, która do tej pory była rozwijana tylko lokalnie. Przewodnik opiera się na sprawdzonym stosie technologicznym i uwzględnia realne problemy napotkane podczas procesu wdrożenia, oferując gotowe rozwiązania.

**Stos technologiczny:**
-   **Frontend:** Angular
-   **Backend & Baza Danych:** Supabase (PostgreSQL + Edge Functions)
-   **Hosting Frontendu:** Firebase Hosting
-   **Automatyzacja CI/CD:** GitHub Actions

---

## Spis Treści

**Faza 1: Konfiguracja Środowiska Produkcyjnego w Chmurze**
1. [Krok 1: Wdrożenie Backendu i Bazy Danych na Supabase](#krok-1-wdrożenie-backendu-i-bazy-danych-na-supabase)
2. [Krok 2: Konfiguracja Hostingu dla Frontendu na Firebase](#krok-2-konfiguracja-hostingu-dla-frontendu-na-firebase)

**Faza 2: Konfiguracja Lokalnego Projektu i Automatyzacji**
3. [Krok 3: Połączenie Lokalnego Kodu z Usługami Chmurowymi](#krok-3-połączenie-lokalnego-kodu-z-usługami-chmurowymi)
4. [Krok 4: Konfiguracja Zmiennych Środowiskowych i Sekretów](#krok-4-konfiguracja-zmiennych-środowiskowych-i-sekretów)
5. [Krok 5: Stworzenie Kompletnego Potoku CI/CD](#krok-5-stworzenie-kompletnego-potoku-cicd)

**Faza 3: Rozwiązywanie Problemów (Na podstawie doświadczeń)**
6. [FAQ i Rozwiązywanie Typowych Błędów](#faq-i-rozwiązywanie-typowych-błędów)
   - [Pytanie: Jakie opcje wybrać podczas `firebase init`?](#pytanie-jakie-opcje-wybrać-podczas-firebase-init)
   - [Problem: Błędy kompilacji frontendu po konfiguracji](#problem-błędy-kompilacji-frontendu-po-konfiguracji)
   - [Problem: Błędy podczas wdrażania funkcji Supabase (`npm:` specifier)](#problem-błędy-podczas-wdrażania-funkcji-supabase-npm-specifier)
   - [Problem: Błąd autoryzacji w GitHub Actions przy wdrażaniu na Firebase](#problem-błąd-autoryzacji-w-github-actions-przy-wdrażaniu-na-firebase)
   - [Problem: Aplikacja wdrożona, ale występuje błąd CORS](#problem-aplikacja-wdrożona-ale-występuje-błąd-cors)

---

### **Faza 1: Konfiguracja Środowiska Produkcyjnego w Chmurze**

#### Krok 1: Wdrożenie Backendu i Bazy Danych na Supabase

Zanim wdrożymy frontend, musimy mieć działający backend w chmurze.

1.  **Stwórz projekt w panelu Supabase:**
    -   Zaloguj się na [app.supabase.com](https://app.supabase.com/).
    -   Stwórz nową organizację i projekt (np. `nowy-projekt-prod`).
    -   Podczas tworzenia projektu **zapisz bezpiecznie hasło do bazy danych** – będzie potrzebne później.

2.  **Połącz lokalne środowisko Supabase z chmurą:**
    -   W terminalu, w głównym katalogu projektu, uruchom:
        ```bash
        # Zaloguj się do Supabase CLI (jeśli jeszcze nie jesteś)
        supabase login
        
        # Połącz projekt, podając ID z panelu Supabase (Settings -> General -> Reference ID)
        supabase link --project-ref <ID_TWOJEGO_PROJEKTU>
        ```

3.  **Wdróż strukturę bazy danych:**
    -   To polecenie wykona wszystkie lokalne migracje na produkcyjnej bazie danych.
        ```bash
        supabase db push
        ```

4.  **Wdróż funkcje Edge:**
    -   To polecenie wdroży całą logikę backendu.
        ```bash
        supabase functions deploy
        ```
    -   *Uwaga: Jeśli napotkasz błędy, przejdź do sekcji "Rozwiązywanie Problemów".*

#### Krok 2: Konfiguracja Hostingu dla Frontendu na Firebase

1.  **Stwórz projekt w panelu Firebase:**
    -   Zaloguj się na [console.firebase.google.com](https://console.firebase.google.com/).
    -   Stwórz nowy projekt (np. `nowy-projekt-prod`).
    -   Przejdź do sekcji "Hosting" i kliknij "Get started". Nie musisz na razie nic więcej robić w panelu.

---

### **Faza 2: Konfiguracja Lokalnego Projektu i Automatyzacji**

#### Krok 3: Połączenie Lokalnego Kodu z Usługami Chmurowymi

1.  **Zainicjuj Firebase w projekcie:**
    -   W terminalu, w głównym katalogu projektu, uruchom:
        ```bash
        firebase init
        ```
    -   Postępuj zgodnie z instrukcjami, odpowiadając na pytania. *Zobacz sekcję "FAQ" poniżej, aby dowiedzieć się, co dokładnie wybrać.*
    -   To utworzy w projekcie pliki `firebase.json` i `.firebaserc`. Zatwierdź je w Git.

2.  **Skonfiguruj pliki środowiskowe Angulara:**
    -   Upewnij się, że pliki `src/environments/environment.ts` (dla dewelopmentu) i `src/environments/environment.prod.ts` (dla produkcji) mają poprawną strukturę, której oczekuje Twój kod:
        ```typescript
        // Przykład src/environments/environment.prod.ts
        export const environment = {
            production: true,
            supabase: {
                url: '#{SUPABASE_URL}#', // Znacznik do podmiany w CI/CD
                anonKey: '#{SUPABASE_ANON_KEY}#', // Znacznik do podmiany w CI/CD
            },
        };
        ```
    -   Sprawdź również `angular.json`, aby upewnić się, że w konfiguracji `production` istnieje reguła `fileReplacements`, która podmienia plik `environment.ts` na `environment.prod.ts`.

#### Krok 4: Konfiguracja Zmiennych Środowiskowych i Sekretów

To najważniejszy krok dla bezpieczeństwa i automatyzacji.

1.  **Zbierz wszystkie potrzebne klucze i tokeny:**
    -   **Klucz serwisowy Firebase:** Wygeneruj go w panelu Firebase (`Project settings` -> `Service accounts` -> `Generate new private key`). Skopiuj całą zawartość pobranego pliku JSON.
    -   **Klucze i ID Supabase:** Znajdziesz je w panelu Supabase w `Settings` (`API` i `General`).
    -   **Token dostępu Supabase:** Wygeneruj go w [panelu konta Supabase](https://supabase.com/dashboard/account/tokens).

2.  **Dodaj je jako sekrety w repozytorium GitHub:**
    -   Przejdź do `Settings` > `Secrets and variables` > `Actions` w swoim repozytorium.
    -   Dodaj wszystkie sekrety z poniższej listy, wklejając odpowiednie wartości:

| Nazwa Sekretu                               | Opis i Źródło                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_..._PROD`         | Klucz serwisowy Firebase w formacie JSON.                                                           |
| `SUPABASE_URL`                              | Publiczny adres URL projektu Supabase.                                                              |
| `SUPABASE_ANON_KEY`                         | Publiczny klucz `anon` do API Supabase.                                                             |
| `SUPABASE_PROJECT_ID`                       | Unikalny identyfikator (Reference ID) projektu Supabase.                                            |
| `SUPABASE_DB_PASSWORD`                      | Hasło do produkcyjnej bazy danych.                                                                  |
| `SUPABASE_ACCESS_TOKEN`                     | Osobisty token dostępu do zarządzania projektami Supabase przez CLI.                                |
| `APP_PUBLIC_URL`                            | Publiczny adres URL wdrożonej aplikacji na Firebase (np. `https://nowy-projekt-prod.web.app`).      |

#### Krok 5: Stworzenie Kompletnego Potoku CI/CD

Utwórz plik `.github/workflows/main-deploy.yml` i wklej poniższy kod. Ten workflow automatycznie wdroży backend i frontend po każdym `push` do gałęzi `main`.

```yaml
name: Deploy to Production (Firebase & Supabase)

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # --- KROKI DLA BACKENDU (SUPABASE) ---
      - name: Install Supabase CLI
        run: npm install supabase --save-dev
      - name: Link Supabase project
        run: npx supabase link --project-ref $SUPABASE_PROJECT_ID
      - name: Push Database Migrations
        run: npx supabase db push
      - name: Set Supabase Secrets
        run: |
          echo "APP_PUBLIC_URL=${{ secrets.APP_PUBLIC_URL }}" > .env.production
          npx supabase secrets set --env-file .env.production
      - name: Deploy Supabase Functions
        run: npx supabase functions deploy --project-ref $SUPABASE_PROJECT_ID

      # --- KROKI DLA FRONTENDU (FIREBASE) ---
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install Frontend dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:run
      - name: Replace environment variables for Frontend
        run: |
          sed -i "s|#{SUPABASE_URL}#|${{ secrets.SUPABASE_URL }}|g" src/environments/environment.prod.ts
          sed -i "s|#{SUPABASE_ANON_KEY}#|${{ secrets.SUPABASE_ANON_KEY }}|g" src/environments/environment.prod.ts
      - name: Build Angular application
        run: npm run build -- --configuration production
      - name: Deploy Frontend to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_NOWY_PROJEKT_PROD }}'
          channelId: live
          projectId: nowy-projekt-prod
```

---

### **Faza 3: Rozwiązywanie Problemów (Na podstawie doświadczeń)**

#### Pytanie: Jakie opcje wybrać podczas `firebase init`?

-   **Którą funkcję chcesz skonfigurować?**
    -   Wybierz: `Hosting: Set up deployments for static web apps`
-   **Wybierz opcję projektu:**
    -   Wybierz: `Use an existing project` (i wskaż projekt utworzony w panelu Firebase).
-   **Jaki jest Twój katalog publiczny?**
    -   Wpisz: `dist/nazwa-twojego-projektu/browser`.
-   **Skonfigurować jako aplikację jednostronicową (single-page app)?**
    -   Wpisz: `y` (Tak).
-   **Nadpisać plik `index.html`?**
    -   Wpisz: `N` (Nie).

#### Problem: Błędy kompilacji frontendu po konfiguracji

-   **Błąd:** `Could not resolve "server.ts"` lub `Could not resolve "src/polyfills.ts"`.
-   **Przyczyna:** Błędna konfiguracja w pliku `angular.json`, która aktywowała tryb Server-Side Rendering (SSR) lub wskazywała na nieistniejący plik polyfills.
-   **Rozwiązanie:** Upewnij się, że sekcja `build` -> `options` w `angular.json` wygląda jak dla standardowej aplikacji SPA i nie zawiera wpisów `server`, `prerender` ani `ssr`.
    ```json
    "options": {
        "outputPath": "dist/nazwa-twojego-projektu",
        "index": "src/index.html",
        "browser": "src/main.ts",
        "polyfills": ["zone.js"], // Upewnij się, że to jest "zone.js"
        "tsConfig": "tsconfig.app.json",
        // ... reszta opcji
    },
    ```
-   **Błąd:** `Property 'supabase' does not exist on type '...'`.
-   **Przyczyna:** Niespójna struktura obiektu `environment` między plikami `.ts` a kodem serwisów.
-   **Rozwiązanie:** Ujednolić strukturę do zagnieżdżonej formy: `environment.supabase.url`.

#### Problem: Błędy podczas wdrażania funkcji Supabase (`npm:` specifier)

-   **Błąd:** `Relative import path "zod" not prefixed with / or ./ or ../`.
-   **Przyczyna:** Deno (środowisko uruchomieniowe funkcji Supabase) wymaga, aby importy pakietów z npm były jawnie oznaczone.
-   **Rozwiązanie:** W każdym pliku funkcji, gdzie importujesz zewnętrzną bibliotekę, dodaj prefiks `npm:`.
    ```typescript
    // ŹLE
    import { z } from 'zod';
    
    // DOBRZE
    import { z } from 'npm:zod';
    ```

#### Problem: Błąd autoryzacji w GitHub Actions przy wdrażaniu na Firebase

-   **Błąd:** `Error: Input required and not supplied: firebaseServiceAccount` lub `Failed to authenticate`.
-   **Przyczyna:** Użyto nieprawidłowego typu tokenu w sekrecie GitHub.
-   **Rozwiązanie:** Akcja `FirebaseExtended/action-hosting-deploy@v0` wymaga **całej zawartości pliku JSON klucza serwisowego**, a nie tokenu z `firebase login:ci`. Wygeneruj klucz w panelu Firebase i wklej całą jego zawartość jako sekret.

#### Problem: Aplikacja wdrożona, ale występuje błąd CORS

-   **Błąd:** Przeglądarka blokuje zapytania z frontendu do API Supabase z powodu polityki CORS.
-   **Przyczyna:** Funkcje Edge domyślnie nie zwracają nagłówków zezwalających na żądania z innej domeny.
-   **Rozwiązanie:** Zmodyfikuj wszystkie funkcje Edge, aby:
    1.  Dodawały nagłówki CORS do każdej odpowiedzi.
    2.  Obsługiwały żądania `OPTIONS` (preflight).
    -   Najlepiej stworzyć współdzielony plik `_shared/http.ts` z funkcjami pomocniczymi `jsonResponse` i `handleCorsPreFlight` i używać ich w każdej funkcji.
        ```typescript
        // Na początku każdej funkcji index.ts
        if (request.method === 'OPTIONS') {
            return handleCorsPreFlight();
        }
        ```
