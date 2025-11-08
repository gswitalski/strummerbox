# Plan Wdrożenia Produkcyjnego dla StrummerBox na Firebase Hosting

Ten dokument opisuje krok po kroku plan wdrożenia aplikacji StrummerBox w środowisku produkcyjnym przy użyciu Firebase Hosting.

## Spis Treści
1. [Wymagania Wstępne](#1-wymagania-wstępne)
2. [Konfiguracja Projektu Firebase](#2-konfiguracja-projektu-firebase)
3. [Konfiguracja Lokalnego Projektu](#3-konfiguracja-lokalnego-projektu)
4. [Automatyzacja CI/CD z GitHub Actions](#4-automatyzacja-cicd-z-github-actions)
5. [Proces Ręcznego Wdrożenia](#5-proces-ręcznego-wdrożenia)
6. [Lista Kontrolna po Wdrożeniu](#6-lista-kontrolna-po-wdrożeniu)
7. [Strategia Wycofania Zmian (Rollback)](#7-strategia-wycofania-zmian-rollback)

---

### 1. Wymagania Wstępne

Przed rozpoczęciem procesu wdrażania upewnij się, że poniższe punkty są spełnione:

-   [ ] Utworzono konto Google, które ma dostęp do [Konsoli Firebase](https://console.firebase.google.com/).
-   [ ] Kod aplikacji StrummerBox został wysłany do gałęzi `main` w repozytorium GitHub.
-   [ ] Wszystkie wymagane testy jednostkowe i E2E przechodzą pomyślnie lokalnie oraz w potoku CI.
-   [ ] Produkcyjna kompilacja aplikacji Angular może być pomyślnie utworzona za pomocą polecenia `npm run build`.

---

### 2. Konfiguracja Projektu Firebase

Dedykowany projekt Firebase będzie zawierał środowisko produkcyjne dla StrummerBox.

1.  **Utwórz nowy projekt Firebase:**
    -   Przejdź do [Konsoli Firebase](https://console.firebase.google.com/).
    -   Kliknij "Dodaj projekt".
    -   Wprowadź nazwę projektu (np. `strummerbox-prod`).
    -   Na razie wyłącz Google Analytics dla tego projektu (można je włączyć później w razie potrzeby).
    -   Kliknij "Utwórz projekt".

2.  **Uaktualnij plan do Blaze:**
    -   W panelu projektu Firebase kliknij baner "Plan Spark" i wybierz "Uaktualnij".
    -   Wybierz plan "Blaze (Pay as you go)". Jest to wymagane do korzystania z funkcji Supabase, gdyby w przyszłości miały być migrowane do Google Cloud Functions, i jest to dobra praktyka dla aplikacji produkcyjnych.
    -   Skonfiguruj konto rozliczeniowe.

3.  **Zarejestruj aplikację internetową:**
    -   W przeglądzie projektu kliknij ikonę sieci (`</>`), aby dodać nową aplikację internetową.
    -   Wprowadź nazwę aplikacji (np. `StrummerBox Web`).
    -   Kliknij "Zarejestruj aplikację". **Nie musisz** dodawać Firebase SDK do swojej aplikacji, ponieważ na razie korzystamy tylko z Hostingu.

4.  **Skonfiguruj Hosting:**
    -   Przejdź do sekcji "Hosting" z menu po lewej stronie.
    -   Kliknij "Rozpocznij".
    -   Postępuj zgodnie z instrukcjami na ekranie, aby zainstalować Firebase CLI (co powinno być zrobione w konfiguracji lokalnej).
    -   Zostanie utworzona domyślna strona (np. `strummerbox-prod.web.app`). Będzie to nasz główny adres URL w środowisku produkcyjnym.

---

### 3. Konfiguracja Lokalnego Projektu

Połącz lokalny projekt Angular z nowo utworzonym projektem Firebase.

1.  **Zainstaluj Firebase CLI:**
    ```sh
    npm install -g firebase-tools
    ```

2.  **Zaloguj się do Firebase:**
    ```sh
    firebase login
    ```
    To polecenie otworzy okno przeglądarki w celu uwierzytelnienia za pomocą Twojego konta Google.

3.  **Zainicjuj Firebase w projekcie:**
    ```sh
    firebase init
    ```
    -   Wybierz **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**.
    -   Wybierz "Use an existing project" i wskaż wcześniej utworzony projekt `strummerbox-prod`.
    -   Ustaw katalog publiczny na `dist/strummerbox/browser`. Jest to domyślny katalog wyjściowy dla kompilacji Angulara.
    -   Skonfiguruj jako aplikację jednostronicową (single-page app), odpowiadając **Tak** na pytanie `Configure as a single-page app (rewrite all urls to /index.html)?`.
    -   Na razie zrezygnuj z automatycznej konfiguracji kompilacji i wdrożeń z GitHub Actions. Skonfigurujemy to ręcznie, aby mieć większą kontrolę.

4.  **Przejrzyj wygenerowane pliki:**
    -   Polecenie `firebase init` utworzy pliki `firebase.json` i `.firebaserc`.
    -   Sprawdź, czy `firebase.json` wygląda następująco:
        ```json
        {
          "hosting": {
            "public": "dist/strummerbox/browser",
            "ignore": [
              "firebase.json",
              "**/.*",
              "**/node_modules/**"
            ],
            "rewrites": [
              {
                "source": "**",
                "destination": "/index.html"
              }
            ]
          }
        }
        ```
    -   Sprawdź, czy `.firebaserc` wskazuje na Twój projekt:
        ```json
        {
          "projects": {
            "default": "strummerbox-prod"
          }
        }
        ```

5.  **Zatwierdź (commit) te pliki w repozytorium.**

---

### 4. Automatyzacja CI/CD z GitHub Actions

Zautomatyzuj proces wdrażania, aby uruchamiał się przy każdym pushu do gałęzi `main`.

1.  **Uzyskaj token wdrożeniowy Firebase:**
    -   Uruchom następujące polecenie w lokalnym terminalu:
        ```sh
        firebase login:ci
        ```
    -   Zostanie wygenerowany token odświeżania. Skopiuj go.

2.  **Dodaj sekrety do GitHub:**
    -   W swoim repozytorium GitHub przejdź do `Settings` > `Secrets and variables` > `Actions`.
    -   Kliknij `New repository secret` i dodaj następujące sekrety:

        -   **Token Firebase:** Służy do autoryzacji wdrożenia na Twoje konto Firebase.
            -   **Nazwa:** `FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_PROD`
            -   **Wartość:** Wklej token uzyskany z polecenia `firebase login:ci`.

        -   **Klucze Supabase:** Są niezbędne, aby aplikacja w wersji produkcyjnej mogła połączyć się z Twoim backendem.
            -   Przejdź do panelu swojego projektu na [Supabase](https://app.supabase.com/).
            -   Przejdź do `Settings` > `API`.
            -   Dodaj dwa sekrety:
                -   **Nazwa:** `SUPABASE_URL`
                -   **Wartość:** Wklej wartość z pola `Project URL`.
                -   **Nazwa:** `SUPABASE_ANON_KEY`
                -   **Wartość:** Wklej wartość z pola `Project API Keys` (klucz `anon` `public`).

3.  **Utwórz/Zaktualizuj przepływ pracy (workflow) GitHub:**
    -   Utwórz nowy plik workflow w `.github/workflows/deploy.yml` lub dodaj nowe zadanie do istniejącego pliku `ci.yml`.
    -   To zadanie będzie:
        -   Uruchamiane przy pushach do `main`.
        -   Pobierać kod (checkout).
        -   Konfigurować Node.js.
        -   Instalować zależności (`npm ci`).
        -   Uruchamiać testy (`npm run test:run`).
        -   **Podmieniać znaczniki na prawdziwe klucze Supabase w plikach środowiskowych.**
        -   Kompilować aplikację do wersji produkcyjnej (`npm run build`).
        -   Wdrażać na Firebase Hosting przy użyciu akcji `firebase-tools` i tokenu.

    **Przykładowy workflow `deploy.yml`:**
    ```yaml
    name: Deploy to Firebase Hosting

    on:
      push:
        branches:
          - main

    jobs:
      build_and_deploy:
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

          - name: Replace environment variables for Production
            run: |
              sed -i "s|#{SUPABASE_URL}#|${{ secrets.SUPABASE_URL }}|g" src/environments/environment.prod.ts
              sed -i "s|#{SUPABASE_ANON_KEY}#|${{ secrets.SUPABASE_ANON_KEY }}|g" src/environments/environment.prod.ts

          - name: Build application
            run: npm run build -- --configuration production

          - name: Deploy to Firebase Hosting
            uses: FirebaseExtended/action-hosting-deploy@v0
            with:
              repoToken: '${{ secrets.GITHUB_TOKEN }}'
              firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_PROD }}'
              channelId: live
              projectId: strummerbox-prod
    ```

---

### 5. Proces Ręcznego Wdrożenia

Dla wdrożeń awaryjnych lub wycofywania zmian powinien być dostępny proces ręczny.

1.  Upewnij się, że Twoja lokalna gałąź `main` jest zaktualizowana z repozytorium zdalnym.
2.  Zainstaluj zależności: `npm install`.
3.  Utwórz kompilację produkcyjną: `npm run build`.
4.  Wdróż na Firebase:
    ```sh
    firebase deploy --only hosting
    ```

---

### 6. Lista Kontrolna po Wdrożeniu

Po każdym pomyślnym wdrożeniu wykonaj następujące sprawdzenia:

-   [ ] Otwórz produkcyjny adres URL (np. `https://strummerbox-prod.web.app`) i sprawdź, czy aplikacja ładuje się poprawnie.
-   [ ] Przetestuj kluczowe ścieżki użytkownika:
    -   [ ] Rejestracja i logowanie użytkownika.
    -   [ ] Tworzenie nowej piosenki.
    -   [ ] Tworzenie repertuaru.
    -   [ ] Generowanie i otwieranie linku do udostępniania.
-   [ ] Sprawdź konsolę deweloperską przeglądarki pod kątem krytycznych błędów.
-   [ ] Monitoruj panel Firebase Hosting pod kątem nietypowej aktywności lub błędów.

---

### 7. Strategia Wycofania Zmian (Rollback)

Firebase Hosting przechowuje historię wdrożeń, co sprawia, że wycofywanie zmian jest proste.

1.  **Zidentyfikuj wersję do przywrócenia:**
    -   Przejdź do panelu Firebase Hosting dla swojego projektu.
    -   Na stronie głównej znajduje się historia wszystkich wdrożeń z sygnaturami czasowymi i hashami commitów.
    -   Zidentyfikuj wersję, do której chcesz wrócić.

2.  **Wykonaj wycofanie zmian:**
    -   Kliknij menu z trzema kropkami obok wybranej wersji.
    -   Wybierz "Wycofaj" (Rollback).

Poprzednia wersja zostanie natychmiast przywrócona i udostępniona użytkownikom.
