# Instrukcja Wdrożenia Lokalnego Projektu Supabase do Chmury

Ten dokument opisuje, jak przenieść lokalne środowisko deweloperskie Supabase (schemat bazy danych, migracje) do projektu produkcyjnego w chmurze Supabase.

## Spis Treści
1. [Wymagania Wstępne](#1-wymagania-wstępne)
2. [Tworzenie Projektu w Chmurze Supabase](#2-tworzenie-projektu-w-chmurze-supabase)
3. [Łączenie Projektu Lokalnego z Chmurą](#3-łączenie-projektu-lokalnego-z-chmurą)
4. [Wdrażanie Schematu Bazy Danych](#4-wdrażanie-schematu-bazy-danych)
5. [Zarządzanie Danymi (Seeding)](#5-zarządzanie-danymi-seeding)
6. [Kolejne Kroki: Aktualizacja Sekretów na GitHub](#6-kolejne-kroki-aktualizacja-sekretów-na-github)
7. [Wdrażanie Funkcji Edge Functions](#7-wdrażanie-funkcji-edge-functions)

---

### 1. Wymagania Wstępne

-   [ ] Zainstalowany [Supabase CLI](https://supabase.com/docs/guides/cli) i możliwość jego uruchomienia w terminalu.
-   [ ] Jesteś zalogowany do Supabase CLI. Możesz to sprawdzić i zalogować się poleceniem:
    ```sh
    supabase login
    ```
-   [ ] Posiadasz lokalny projekt Supabase zainicjowany w folderze `supabase` w Twoim repozytorium.
-   [ ] Wszystkie zmiany w schemacie bazy danych zostały zapisane jako migracje lokalne. Jeśli dokonywałeś zmian w `supabase/migrations`, to wszystko jest w porządku.

---

### 2. Tworzenie Projektu w Chmurze Supabase

Najpierw musimy stworzyć "pusty" projekt w panelu Supabase, który będzie naszym celem wdrożenia.

1.  **Przejdź do panelu Supabase:**
    -   Otwórz [app.supabase.com](https://app.supabase.com/) i zaloguj się.

2.  **Stwórz nową organizację (jeśli nie masz):**
    -   Projekty są grupowane w organizacje. Jeśli to Twój pierwszy projekt, zostaniesz poproszony o stworzenie organizacji (np. o nazwie `strummerbox-org`).

3.  **Stwórz nowy projekt:**
    -   Kliknij przycisk `New Project` w swojej organizacji.
    -   **Nazwa:** Wpisz nazwę, np. `strummerbox-prod`.
    -   **Hasło Bazy Danych:** Wygeneruj i **bezpiecznie zapisz** silne hasło. Będzie ono potrzebne do bezpośredniego dostępu do bazy danych.
    -   **Region:** Wybierz region geograficznie najbliższy Twoim przyszłym użytkownikom (np. `EU (Frankfurt)`).
    -   **Plan cenowy:** Na start wystarczy plan `Free`. Możesz go później uaktualnić.
    -   Kliknij `Create new project`. Poczekaj kilka minut, aż projekt zostanie w pełni zainicjowany.

---

### 3. Łączenie Projektu Lokalnego z Chmurą

Teraz połączymy Twój lokalny folder `supabase` z nowo utworzonym projektem w chmurze.

1.  **Otwórz terminal** w głównym katalogu swojego projektu (`strummerbox`).

2.  **Uruchom polecenie `link`:**
    ```sh
    supabase link --project-ref <ID_TWOJEGO_PROJEKTU>
    ```
    -   `<ID_TWOJEGO_PROJEKTU>` znajdziesz w panelu Supabase:
        -   Przejdź do swojego projektu na [app.supabase.com](https://app.supabase.com/).
        -   Wybierz `Settings` (ikona zębatki) > `General`.
        -   Skopiuj wartość z pola **Reference ID**.
    -   Po uruchomieniu polecenia zostaniesz poproszony o podanie hasła do bazy danych, które zapisałeś w poprzednim kroku.

3.  **Weryfikacja:**
    -   Po pomyślnym wykonaniu polecenia, w folderze `.supabase` zostanie utworzony plik `project.json` zawierający informacje o połączeniu.

---

### 4. Wdrażanie Schematu Bazy Danych

Ten krok "wypchnie" wszystkie Twoje lokalne migracje (czyli strukturę tabel, polityki RLS, funkcje itp.) do bazy danych w chmurze.

1.  **Uruchom polecenie `db push`:**
    ```sh
    supabase db push
    ```
    -   Narzędzie CLI przeanalizuje folder `supabase/migrations` i wykona wszystkie skrypty SQL na zdalnej bazie danych, odtwarzając jej strukturę.

2.  **Sprawdź wynik:**
    -   Po zakończeniu operacji przejdź do panelu Supabase.
    -   Wejdź w `Table Editor`. Powinieneś zobaczyć wszystkie swoje tabele (`songs`, `repertoires` itd.) dokładnie tak, jak miałeś je lokalnie.
    -   Sprawdź również sekcję `Authentication` > `Policies`, aby upewnić się, że Twoje reguły Row Level Security zostały poprawnie wdrożone.

---

### 5. Zarządzanie Danymi (Seeding)

Polecenie `db push` wdraża tylko **strukturę** bazy danych, a nie **dane**. Jeśli posiadasz plik `supabase/seed.sql` z danymi początkowymi (np. domyślne kategorie, dane testowe), musisz je wgrać ręcznie.

1.  **Skopiuj zawartość pliku `supabase/seed.sql`.**
2.  **Przejdź do panelu Supabase** > `SQL Editor`.
3.  **Wklej skopiowaną zawartość** do edytora zapytań.
4.  **Uruchom zapytanie**, klikając przycisk `RUN`.

**Uwaga:** Rób to tylko dla danych, które są niezbędne na start. Dane użytkowników i piosenek będą dodawane przez aplikację w trakcie jej działania.

---

### 6. Kolejne Kroki: Aktualizacja Sekretów na GitHub

Twój backend jest już gotowy w chmurze! Ostatnim krokiem jest upewnienie się, że Twoja aplikacja frontendowa (wdrażana na Firebase) używa nowych, produkcyjnych kluczy do Supabase.

1.  **Przejdź do panelu Supabase** > `Settings` > `API`.
2.  Skopiuj **Project URL** oraz klucz **`anon` `public`**.
3.  **Zaktualizuj sekrety w repozytorium GitHub:**
    -   Przejdź do `Settings` > `Secrets and variables` > `Actions`.
    -   Zaktualizuj wartości dla `SUPABASE_URL` i `SUPABASE_ANON_KEY` na te z Twojego nowego, chmurowego projektu.
4.  **Uruchom ponownie workflow wdrożeniowy** na GitHub Actions (np. poprzez `git push` do gałęzi `main`), aby Twoja aplikacja na Firebase została przebudowana z nowymi kluczami.

---

### 7. Wdrażanie Funkcji Edge Functions

Jeśli Twój projekt korzysta z Supabase Edge Functions (funkcje w folderze `supabase/functions`), muszą one zostać wdrożone osobno.

1.  **Upewnij się, że jesteś połączony z projektem:**
    -   Kroki z sekcji 3 (`Łączenie Projektu Lokalnego z Chmurą`) muszą być zakończone.

2.  **Wdróż wszystkie funkcje:**
    -   Uruchom w terminalu następujące polecenie:
        ```sh
        supabase functions deploy
        ```
    -   Narzędzie CLI wdroży wszystkie funkcje znajdujące się w folderze `supabase/functions` do Twojego projektu w chmurze.

3.  **Wdrażanie pojedynczej funkcji:**
    -   Jeśli chcesz wdrożyć tylko jedną, konkretną funkcję (np. o nazwie `share`), możesz to zrobić poleceniem:
        ```sh
        supabase functions deploy share
        ```

4.  **Weryfikacja:**
    -   Przejdź do panelu Supabase > `Edge Functions`.
    -   Powinieneś zobaczyć na liście wdrożone funkcje wraz z ich statusami. Możesz stąd również przeglądać ich logi i zarządzać nimi.
