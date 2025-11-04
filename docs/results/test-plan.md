# Kompleksowy Plan Testów dla Aplikacji StrummerBox

## 1. Wprowadzenie i Cel Testów

### 1.1 Wprowadzenie

StrummerBox to aplikacja internetowa dla gitarzystów i organizatorów spotkań towarzyskich, mająca na celu zastąpienie tradycyjnych, papierowych śpiewników. Umożliwia tworzenie prywatnej biblioteki piosenek, układanie repertuarów i udostępnianie ich za pomocą kodów QR i linków. Aplikacja oparta jest o stos technologiczny składający się z Angular 19 na frontendzie oraz Supabase (Edge Functions + PostgreSQL) jako Backend-as-a-Service (BaaS).

### 1.2 Cel Testów

Głównym celem testów jest zapewnienie wysokiej jakości, stabilności, bezpieczeństwa i użyteczności aplikacji StrummerBox przed jej wdrożeniem. Testy mają na celu weryfikację, czy aplikacja spełnia założenia funkcjonalne i niefunkcjonalne, identyfikację i eliminację defektów oraz zapewnienie pozytywnego doświadczenia użytkownika końcowego.

## 2. Zakres Testów

### 2.1 Funkcjonalności objęte testami:

**Frontend (Angular 19):**
-   **Moduł Uwierzytelniania:** Rejestracja, logowanie, wylogowywanie, ochrona tras (route guards).
-   **Zarządzanie Piosenkami (CRUD):** Tworzenie, odczyt, aktualizacja i usuwanie piosenek z biblioteki użytkownika.
-   **Zarządzanie Repertuarami (CRUD):** Tworzenie, odczyt, aktualizacja (dodawanie/usuwanie piosenek, zmiana nazwy) i usuwanie repertuarów.
-   **Tryb "Biesiada":** Uproszczony widok repertuaru dla uczestników, dostępny publicznie przez link.
-   **Mechanizm Udostępniania:** Generowanie linków publicznych i kodów QR do repertuarów.
-   **Interfejs Użytkownika:** Responsywność, spójność wizualna, dostępność (WCAG) i użyteczność na różnych urządzeniach.

**Backend (Supabase Edge Functions):**
-   **Logika Biznesowa:** Walidacja danych, przetwarzanie żądań, obsługa błędów.
-   **Integracja z Bazą Danych:** Operacje CRUD przez Supabase Client.
-   **Bezpieczeństwo:** Row Level Security (RLS), autoryzacja, walidacja tokenów JWT.
-   **API Endpoints:** Poprawność odpowiedzi HTTP, obsługa błędnych żądań.

### 2.2 Funkcjonalności wyłączone z testów:

-   Infrastruktura Supabase (zakładamy jej stabilność, testujemy jedynie integrację z nią).
-   Testy obciążeniowe bazy danych PostgreSQL (poza zakresem odpowiedzialności deweloperskiej aplikacji klienckiej).
-   Zewnętrzne biblioteki (np. Angular Material) - testujemy jedynie ich poprawną implementację.

## 3. Strategia Testowania

Strategia opiera się na piramidzie testów, kładąc nacisk na solidne fundamenty w postaci testów jednostkowych i integracyjnych, uzupełnionych przez testy End-to-End (E2E) symulujące rzeczywiste scenariusze użytkownika.

-   **Poziom 1: Testy Jednostkowe:** Weryfikacja najmniejszych, izolowanych części aplikacji (serwisy, potoki, funkcje pomocnicze).
-   **Poziom 2: Testy Integracyjne:** Weryfikacja współpracy między komponentami a serwisami oraz między komponentami nadrzędnymi i podrzędnymi.
-   **Poziom 3: Testy End-to-End (E2E):** Weryfikacja kompletnych przepływów biznesowych z perspektywy użytkownika.

Testy manualne będą wykorzystywane do testów eksploracyjnych oraz weryfikacji aspektów trudnych do automatyzacji (np. ocena UX).

## 4. Typy Testów

### 4.1 Testy Jednostkowe

#### 4.1.1 Frontend (Angular 19)

-   **Cel:** Weryfikacja poprawności działania izolowanych fragmentów logiki biznesowej w komponentach, serwisach i funkcjach pomocniczych.
-   **Narzędzia:** **Vitest** + **@vitest/ui** (do debugowania)
-   **Uzasadnienie wyboru Vitest:**
    -   ⚡ Znacznie szybszy niż Karma (brak uruchamiania przeglądarki)
    -   🔥 HMR (Hot Module Replacement) dla testów - błyskawiczny watch mode
    -   📸 Snapshot testing wbudowany
    -   🎯 Kompatybilny z API Jest - łatwa migracja w przyszłości
    -   🚀 Natywna obsługa ESM i TypeScript
    -   💪 Lepsze wsparcie dla Vite i nowoczesnych projektów
-   **Przykładowe przypadki testowe:**
    -   **`AuthService` (`src/app/core/services/auth.service.ts`):**
        -   Czy metoda `signIn()` poprawnie wywołuje `supabase.auth.signInWithPassword()` z odpowiednimi danymi.
        -   Czy metoda `signOut()` poprawnie wywołuje `supabase.auth.signOut()`.
        -   Czy `authState$` poprawnie emituje status zalogowanego/wylogowanego użytkownika.
    -   **`chord-stripper.ts` (`src/app/pages/public-song/utils/chord-stripper.ts`):**
        -   Czy funkcja `stripHtmlTags` poprawnie usuwa tagi HTML z podanego ciągu znaków.
        -   Czy funkcja `removeChordPro` poprawnie usuwa znaczniki akordów (np. `[C]`, `[G7]`) z tekstu piosenki.
    -   **Pipes i Validators:**
        -   Testowanie custom pipes (formatowanie tekstu, filtrowanie).
        -   Testowanie custom validators dla formularzy.

#### 4.1.2 Backend (Supabase Edge Functions)

-   **Cel:** Weryfikacja poprawności logiki biznesowej w Edge Functions działających na Deno runtime.
-   **Narzędzia:** **Deno Test** (wbudowany test runner) + **Deno BDD** (dla czytelności)
-   **Uzasadnienie wyboru Deno Test:**
    -   🎯 Wbudowany w Deno - zero konfiguracji
    -   ⚡ Natywne wsparcie TypeScript bez transpilacji
    -   🔒 Bezpieczny runtime z kontrolą uprawnień
    -   📦 Import z URL - brak node_modules
    -   ✅ Oficjalnie wspierany przez Supabase
-   **Przykładowe przypadki testowe:**
    -   **Walidacja danych wejściowych:**
        -   Czy funkcja zwraca błąd 400 dla nieprawidłowych danych.
        -   Czy wymagane pola są poprawnie walidowane.
    -   **Operacje na bazie danych:**
        -   Czy funkcja poprawnie tworzy rekord w bazie (test z mockami).
        -   Czy funkcja obsługuje błędy bazy danych.
    -   **Autoryzacja:**
        -   Czy funkcja weryfikuje token JWT.
        -   Czy funkcja odmawia dostępu nieautoryzowanym użytkownikom.

### 4.2 Testy Integracyjne

#### 4.2.1 Frontend (Angular 19)

-   **Cel:** Weryfikacja poprawnej komunikacji między komponentami, serwisami i zewnętrznymi API.
-   **Narzędzia:** **@testing-library/angular** + **MSW (Mock Service Worker)**
-   **Uzasadnienie wyboru:**
    -   🎭 **Testing Library:** Skupia się na testowaniu zachowania, nie implementacji
    -   👤 **User-centric approach:** Testuje aplikację tak, jak używa jej użytkownik
    -   🌐 **MSW:** Mockowanie na poziomie sieciowym (nie serwisów) - testy bardziej realistyczne
    -   🔄 **Łatwiejszy refactoring:** Testy nie pękają przy zmianach wewnętrznych komponentów
    -   ♿ **Promuje dostępność:** Zachęca do używania semantycznych selektorów
-   **Przykładowe przypadki testowe:**
    -   **Komponent `repertoire-list-page` i `RepertoireService`:**
        -   Czy po załadowaniu strony wyświetlana jest lista repertuarów (mockowana przez MSW).
        -   Czy użytkownik może kliknąć przycisk "Usuń" i repertuar znika z listy.
        -   Czy wyświetlany jest komunikat o błędzie, gdy API zwraca błąd.
    -   **Formularz tworzenia piosenki (`song-create-page`):**
        -   Czy formularz wyświetla błędy walidacji przy próbie wysłania pustego tytułu.
        -   Czy po poprawnym wypełnieniu formularza i kliknięciu "Zapisz", wysyłane jest żądanie POST (przechwycone przez MSW).
        -   Czy użytkownik jest przekierowywany po udanym utworzeniu piosenki.
    -   **Interakcje użytkownika:**
        -   Czy kliknięcie w piosenkę otwiera szczegóły.
        -   Czy drag & drop piosenek w repertuarze zmienia kolejność.

#### 4.2.2 Backend (Supabase Edge Functions)

-   **Cel:** Weryfikacja integracji Edge Functions z lokalną bazą danych Supabase.
-   **Narzędzia:** **Deno Test** + **Supabase CLI** (lokalne środowisko) + **Test Helpers**
-   **Przykładowe przypadki testowe:**
    -   **Integracja z bazą danych:**
        -   Czy Edge Function poprawnie zapisuje dane do lokalnej bazy Supabase.
        -   Czy Edge Function respektuje polityki RLS (Row Level Security).
    -   **Pełny przepływ:**
        -   Stworzenie testowego użytkownika → logowanie → wywołanie funkcji → weryfikacja danych w bazie → cleanup.
    -   **Obsługa transakcji:**
        -   Czy funkcja poprawnie obsługuje rollback przy błędzie.

### 4.3 Testy Funkcjonalne (E2E)

-   **Cel:** Weryfikacja kompletnych scenariuszy biznesowych z perspektywy użytkownika, obejmujących frontend i backend.
-   **Narzędzie:** **Playwright**
-   **Uzasadnienie wyboru Playwright:**
    -   🚀 **Szybszy** - lepsze równoległe wykonanie testów niż Cypress
    -   🌐 **Multi-browser** - Chrome, Firefox, Safari, Edge z pudełka
    -   📱 **Emulacja urządzeń mobilnych** - testy responsywności
    -   🎯 **Auto-waiting** - automatyczne czekanie na elementy, mniej flaky testów
    -   🔧 **Lepsze narzędzia deweloperskie** - Trace Viewer, Codegen, UI Mode
    -   📸 **Screenshots i video** - automatyczne nagrywanie przy błędach
    -   🌍 **Multi-tab i multi-context** - testowanie w wielu kartach i kontekstach
    -   ⚡ **Built-in parallelization** - szybkie wykonanie na CI/CD
    -   💰 **W pełni darmowy** - wszystkie funkcje bez ograniczeń
-   **Przykładowe przypadki testowe:**
    -   **Pełny cykl życia repertuaru:**
        1.  Użytkownik rejestruje się i loguje do aplikacji.
        2.  Tworzy dwie nowe piosenki.
        3.  Tworzy nowy repertuar.
        4.  Przechodzi do edycji repertuaru i dodaje do niego obie piosenki.
        5.  Otwiera okno udostępniania i kopiuje link publiczny.
        6.  W nowym kontekście incognito otwiera skopiowany link i weryfikuje, czy widzi uproszczony widok repertuaru z dwiema piosenkami.
        7.  Wraca do głównej aplikacji, usuwa jedną piosenkę z repertuaru.
        8.  Usuwa cały repertuar.
        9.  Wylogowuje się.
    -   **Responsywność:**
        -   Wykonanie kluczowych scenariuszy na różnych rozmiarach ekranu (mobile, tablet, desktop).
    -   **Multi-browser:**
        -   Wykonanie testów regresji na Chrome, Firefox i Safari.

### 4.4 Testy Wydajnościowe

-   **Cel:** Ocena szybkości ładowania, responsywności aplikacji i identyfikacja wąskich gardeł wydajnościowych.
-   **Narzędzia:** **Google Lighthouse CI** + **Lighthouse** + **WebPageTest** (opcjonalnie)
-   **Uzasadnienie:**
    -   📊 **Lighthouse CI** - automatyczne testy wydajnościowe w pipeline CI/CD
    -   🎯 **Metryki Core Web Vitals** - LCP, FID, CLS
    -   📦 **Bundle size monitoring** - śledzenie rozmiaru paczek
    -   ⚡ **Performance budgets** - alerty przy pogorszeniu wydajności
-   **Przykładowe przypadki testowe:**
    -   **Metryki ładowania:**
        -   Time to Interactive (TTI) < 3.8s dla strony głównej
        -   First Contentful Paint (FCP) < 1.8s
        -   Largest Contentful Paint (LCP) < 2.5s
    -   **Wydajność runtime:**
        -   Pomiar wydajności renderowania strony z repertuarem zawierającym 100 piosenek
        -   Sprawdzenie płynności scrollowania długiej listy (virtual scrolling)
    -   **Optymalizacja zasobów:**
        -   Analiza rozmiaru paczki produkcyjnej (bundle size) - cel: < 500KB initial bundle
        -   Identyfikacja nieużywanych zależności
        -   Weryfikacja lazy loading dla route'ów
    -   **Edge Functions:**
        -   Pomiar cold start time dla Edge Functions (< 100ms)
        -   Pomiar czasu wykonania funkcji (< 1s dla operacji CRUD)

### 4.5 Testy Bezpieczeństwa

-   **Cel:** Identyfikacja i eliminacja potencjalnych luk bezpieczeństwa w aplikacji i zależnościach.
-   **Narzędzia:** **Snyk** + **OWASP ZAP** + **Przegląd kodu** + **Testy manualne**
-   **Uzasadnienie:**
    -   🔍 **Snyk** - automatyczne skanowanie zależności npm i wykrywanie podatności
    -   🤖 **Automatyczne PR** - propozycje fixów dla znalezionych podatności
    -   🛡️ **OWASP ZAP** - testowanie dynamiczne aplikacji webowej
    -   📊 **Integracja z CI/CD** - blokowanie buildu przy krytycznych podatnościach
-   **Przykładowe przypadki testowe:**
    -   **Weryfikacja Row Level Security (RLS) w Supabase:**
        -   Zaloguj się jako Użytkownik A i stwórz repertuar.
        -   Zaloguj się jako Użytkownik B i spróbuj (np. przez manipulację URL lub bezpośrednie wywołanie API) uzyskać dostęp do repertuaru Użytkownika A. Dostęp powinien być zablokowany z błędem 403.
        -   Testowanie wszystkich operacji CRUD dla różnych ról użytkowników.
    -   **Ochrona tras (Route Guards):**
        -   Spróbuj uzyskać dostęp do chronionej strony jako niezalogowany użytkownik. Aplikacja powinna przekierować na stronę logowania.
        -   Weryfikacja, czy token JWT jest wymagany dla wszystkich chronionych endpoint'ów.
    -   **Cross-Site Scripting (XSS):**
        -   Stwórz piosenkę z nazwą zawierającą skrypt (np. `<script>alert('XSS')</script>`).
        -   Zweryfikuj, czy skrypt nie jest wykonywany podczas wyświetlania (Angular automatycznie sanityzuje, ale należy to przetestować).
    -   **SQL Injection:**
        -   Próba wstrzyknięcia SQL przez parametry zapytań do Edge Functions.
        -   Weryfikacja, czy Supabase Client poprawnie parametryzuje zapytania.
    -   **Skanowanie zależności (Snyk):**
        -   Automatyczne codzienne skanowanie zależności npm.
        -   Weryfikacja braku krytycznych podatności przed wdrożeniem.
    -   **Uwierzytelnianie i Sesje:**
        -   Testowanie expired tokens.
        -   Weryfikacja, czy session timeout działa poprawnie.
        -   Testowanie brute-force protection (Supabase ma wbudowane).

### 4.6 Testy Interfejsu Użytkownika (UI/UX)

-   **Cel:** Zapewnienie spójności, responsywności, dostępności i użyteczności interfejsu.
-   **Narzędzia:** **Playwright Visual Regression** + **@axe-core/playwright** + **Testy manualne** + **Storybook** (opcjonalnie)
-   **Uzasadnienie:**
    -   📸 **Visual Regression** - automatyczne wykrywanie niechcianych zmian w UI
    -   ♿ **Axe-core** - automatyczne testy dostępności WCAG 2.1
    -   🎨 **Spójność Material Design** - weryfikacja zgodności z Angular Material
    -   🔍 **Szczegółowe raporty** - konkretne wskazówki naprawy problemów accessibility
-   **Przykładowe przypadki testowe:**
    -   **Responsywność:**
        -   Weryfikacja poprawnego wyświetlania wszystkich stron na popularnych rozdzielczościach:
            -   Mobile: 375x667 (iPhone SE), 390x844 (iPhone 12)
            -   Tablet: 768x1024 (iPad)
            -   Desktop: 1366x768, 1920x1080
        -   Sprawdzenie, czy wszystkie elementy interaktywne są łatwe w obsłudze na ekranach dotykowych (min. 44x44px).
    -   **Spójność wizualna:**
        -   Weryfikacja spójności kolorów, czcionek i spacing z Angular Material.
        -   Visual regression testing - porównanie screenshotów przed i po zmianach.
        -   Sprawdzenie, czy wszystkie ikony Material Icons są poprawnie wyświetlane.
    -   **Dostępność (WCAG 2.1 poziom AA):**
        -   Automatyczne testy Axe-core wykrywające ~57% problemów accessibility.
        -   Nawigacja za pomocą klawiatury (Tab, Enter, Escape).
        -   Kontrast kolorów minimum 4.5:1 dla tekstu normalnego.
        -   Atrybuty `alt` dla wszystkich obrazów.
        -   Etykiety ARIA dla elementów interaktywnych.
        -   Focus indicators dla wszystkich elementów fokusujących.
        -   Semantyczny HTML (proper heading hierarchy).
    -   **Cross-browser testing:**
        -   Testy manualne/automatyczne na Chrome, Firefox, Safari, Edge.
    -   **Użyteczność:**
        -   Weryfikacja czytelności i intuicyjności nawigacji.
        -   Testowanie z rzeczywistymi użytkownikami (opcjonalnie).

## 5. Środowiska Testowe

-   **Lokalne (Development):**
    -   Środowisko deweloperskie na maszynach programistów.
    -   **Supabase Local** - lokalna instancja Supabase uruchamiana przez `supabase start` (Docker).
    -   Testy jednostkowe i integracyjne uruchamiane lokalnie przed commitem.
    -   Edge Functions serwowane lokalnie przez `supabase functions serve`.
-   **Testowe (Staging):**
    -   Dedykowane środowisko będące wierną kopią środowiska produkcyjnego.
    -   Osobna instancja Supabase (staging project).
    -   Testy automatyczne E2E uruchamiane w CI/CD (GitHub Actions).
    -   Dostępne dla zespołu do testów manualnych.
-   **Produkcyjne (Production):**
    -   Środowisko dostępne dla użytkowników końcowych.
    -   Produkcyjna instancja Supabase.
    -   Jedynie testy typu "smoke" po każdym wdrożeniu.
    -   Monitoring i alerty błędów w czasie rzeczywistym.

## 6. Narzędzia Testowe

### 6.1 Stack Testowy - Frontend (Angular 19)

| Typ Testu             | Narzędzie                              | Cel |
| --------------------- | -------------------------------------- | --- |
| **Testy Jednostkowe** | **Vitest** + @vitest/ui                | Testy serwisów, pipes, validators |
| **Testy Integracyjne** | **@testing-library/angular** + **MSW** | Testy komponentów z interakcjami użytkownika |
| **Testy E2E**         | **Playwright**                         | Pełne przepływy użytkownika |
| **Visual Regression** | **Playwright Visual**                  | Wykrywanie zmian w UI |
| **Accessibility**     | **@axe-core/playwright**               | Automatyczne testy WCAG |
| **Wydajność**         | **Lighthouse CI**                      | Metryki Core Web Vitals |
| **Coverage**          | **@vitest/coverage-v8**                | Pokrycie kodu testami |

### 6.2 Stack Testowy - Backend (Supabase Edge Functions)

| Typ Testu             | Narzędzie                              | Cel |
| --------------------- | -------------------------------------- | --- |
| **Testy Jednostkowe** | **Deno Test**                          | Testy logiki biznesowej |
| **Testy Integracyjne** | **Deno Test** + **Supabase Local**    | Testy z lokalną bazą danych |
| **BDD Style**         | **Deno BDD** (std/testing/bdd)         | Czytelne testy describe/it |
| **Mockowanie**        | **Deno std/testing/mock**              | Stub, spy dla testów |
| **Coverage**          | **Deno coverage**                      | Pokrycie kodu testami |

### 6.3 Narzędzia Wspólne

| Kategoria             | Narzędzie                              | Cel |
| --------------------- | -------------------------------------- | --- |
| **Bezpieczeństwo**    | **Snyk** + **OWASP ZAP**              | Skanowanie podatności |
| **Kontrola Wersji**   | **Git** + **GitHub**                   | Wersjonowanie kodu |
| **CI/CD**             | **GitHub Actions**                     | Automatyzacja testów i wdrożeń |
| **Zarządzanie**       | **GitHub Issues/Projects**             | Tracking zadań i bugów |
| **Code Quality**      | **ESLint** + **Prettier**              | Jakość i formatowanie kodu |
| **Pre-commit**        | **Husky** + **lint-staged**            | Testy przed commitem |

## 7. Kryteria Wejścia i Wyjścia

### 7.1 Kryteria Wejścia (Rozpoczęcia Testów)

-   Zakończenie implementacji danej funkcjonalności.
-   Pomyślne przejście testów jednostkowych i integracyjnych lokalnie (`npm test` / `deno test`).
-   Kod przeszedł code review.
-   Brak błędów lintingu i formatowania (ESLint, Prettier).
-   Dostępność stabilnego środowiska testowego (Staging z działającą instancją Supabase).
-   Dokumentacja API/komponentów zaktualizowana (jeśli dotyczy).

### 7.2 Kryteria Wyjścia (Zakończenia Testów)

-   **Testy automatyczne:**
    -   ✅ Pomyślne wykonanie 100% testów jednostkowych i integracyjnych.
    -   ✅ Pomyślne wykonanie 100% zdefiniowanych testów E2E na Staging.
    -   ✅ Pokrycie kodu testami jednostkowymi ≥ 80% (frontend i backend).
    -   ✅ Brak regresji w testach visual regression.
-   **Bezpieczeństwo:**
    -   ✅ Brak krytycznych podatności wykrytych przez Snyk.
    -   ✅ Wszystkie polityki RLS przetestowane i działające poprawnie.
-   **Wydajność:**
    -   ✅ Lighthouse Score ≥ 90 dla Performance.
    -   ✅ Core Web Vitals w zielonym zakresie (LCP < 2.5s, FID < 100ms, CLS < 0.1).
-   **Accessibility:**
    -   ✅ Brak błędów krytycznych wykrytych przez Axe-core.
    -   ✅ WCAG 2.1 poziom AA spełniony dla kluczowych przepływów.
-   **Błędy:**
    -   ✅ Brak nierozwiązanych błędów krytycznych (severity: critical).
    -   ✅ Brak nierozwiązanych błędów blokujących (severity: blocker).
    -   ✅ Wszystkie błędy wysokiego priorytetu naprawione i przetestowane regresywnie.

## 8. Harmonogram Testów

Testowanie jest procesem ciągłym, zintegrowanym z cyklem deweloperskim (Continuous Testing).

### 8.1 Lokalne (Deweloper)

-   **Podczas development:**
    -   Vitest w watch mode dla błyskawicznego feedback.
    -   Deno Test w watch mode dla Edge Functions.
-   **Przed commitem (pre-commit hook):**
    -   Husky uruchamia lint-staged.
    -   Testy jednostkowe dla zmienionych plików.
    -   Linting (ESLint) i formatowanie (Prettier).

### 8.2 Pull Request (CI/CD)

-   **Automatycznie po każdym push do PR:**
    -   Wszystkie testy jednostkowe (Frontend: Vitest, Backend: Deno Test).
    -   Wszystkie testy integracyjne.
    -   Linting i type checking.
    -   Snyk scan dla zależności.
    -   Build verification.
-   **Warunki merge:**
    -   ✅ Wszystkie testy przeszły pomyślnie.
    -   ✅ Code review approved.
    -   ✅ Brak krytycznych podatności.

### 8.3 Przed Wdrożeniem (Pre-deployment - Staging)

-   **Uruchomienie na środowisku Staging:**
    -   Pełny zestaw testów E2E (Playwright) na wielu przeglądarkach.
    -   Testy regresji visual (Playwright Visual).
    -   Testy accessibility (Axe-core).
    -   Lighthouse CI - weryfikacja wydajności.
    -   Testy eksploracyjne (manualne).
    -   OWASP ZAP scan.

### 8.4 Po Wdrożeniu (Post-deployment - Production)

-   **Natychmiast po wdrożeniu:**
    -   Smoke tests - weryfikacja kluczowych funkcjonalności (2-3 minuty).
    -   Health check endpoints.
-   **Monitoring ciągły:**
    -   Error tracking (Sentry lub podobne).
    -   Performance monitoring (Core Web Vitals).
    -   Alerty przy anomaliach.

## 9. Zasoby i Odpowiedzialności

-   **Deweloperzy:** Odpowiedzialni za pisanie testów jednostkowych i integracyjnych, naprawę błędów.
-   **Analityk QA / Tester:** Odpowiedzialny za tworzenie i utrzymanie testów E2E, wykonywanie testów manualnych, raportowanie błędów i tworzenie planów testów.
-   **Product Owner:** Odpowiedzialny za akceptację funkcjonalności i priorytetyzację błędów.

## 10. Zarządzanie Ryzykiem

| Ryzyko | Prawdopodobieństwo | Wpływ | Plan Mitygacji |
| ------ | ------------------ | ----- | -------------- |
| **Błędy w integracji z Supabase (RLS, Edge Functions)** | Średnie | Wysoki | • Dedykowane testy integracyjne z lokalnym Supabase<br>• Code review polityk RLS przez minimum 2 osoby<br>• Automatyczne testy bezpieczeństwa dla każdej polityki RLS<br>• Testy z różnymi rolami użytkowników |
| **Niska wydajność przy dużej ilości danych** | Niskie | Średnie | • Testy wydajnościowe z syntetycznymi danymi (100+ piosenek)<br>• Virtual scrolling dla długich list<br>• Lazy loading dla route'ów<br>• Bundle size monitoring w CI/CD<br>• Lighthouse CI z performance budgets |
| **Problemy z responsywnością na urządzeniach mobilnych** | Średnie | Wysoki | • Automatyczne testy Playwright na wielu rozmiarach ekranu<br>• Testy manualne na rzeczywistych urządzeniach (iOS, Android)<br>• Mobile-first approach w development<br>• Touch targets minimum 44x44px |
| **Regresja w istniejących funkcjonalnościach** | Wysokie | Wysoki | • Rozbudowany zestaw testów E2E (Playwright) w CI/CD<br>• Visual regression testing<br>• Testy regresji przed każdym wdrożeniem<br>• Automatyczne rollback przy failed smoke tests |
| **Podatności w zależnościach (npm packages)** | Średnie | Wysoki | • Automatyczne skanowanie Snyk w CI/CD<br>• Blokowanie merge przy krytycznych podatnościach<br>• Regularne aktualizacje zależności<br>• Dependabot alerts |
| **Flaky testy E2E** | Średnie | Średnie | • Playwright z auto-waiting (stabilniejsze niż Cypress)<br>• Retry mechanism dla testów<br>• Izolacja testów (każdy test niezależny)<br>• Używanie data-testid zamiast selektorów CSS |
| **Długi czas wykonania testów w CI/CD** | Średnie | Średnie | • Parallelizacja testów (Playwright built-in)<br>• Cache dla node_modules i build artifacts<br>• Selective testing - tylko testy dla zmienionych plików<br>• Matrix strategy dla multi-browser tests |
| **Problemy z cold start Edge Functions** | Niskie | Średnie | • Monitoring cold start time<br>• Optymalizacja rozmiaru funkcji<br>• Keep-alive dla krytycznych funkcji<br>• Testy wydajnościowe Edge Functions |

## 11. Raportowanie

### 11.1 Zgłaszanie Błędów (Bug Reporting)

-   **Platforma:** GitHub Issues w repozytorium projektu.
-   **Szablon zgłoszenia powinien zawierać:**
    -   **Tytuł:** Zwięzły opis problemu (max 80 znaków).
    -   **Severity/Priority:** Critical, High, Medium, Low.
    -   **Środowisko:** Browser, wersja, system operacyjny, rozdzielczość.
    -   **Kroki do reprodukcji:** Szczegółowa lista kroków (numerowana).
    -   **Wynik oczekiwany:** Co powinno się wydarzyć.
    -   **Wynik rzeczywisty:** Co się wydarzyło.
    -   **Screenshoty/Video:** Dokumentacja wizualna problemu.
    -   **Logi:** Console logs, network logs (jeśli dotyczy).
    -   **Dodatkowe informacje:** Czy błąd występuje konsekwentnie, od kiedy występuje, itp.

### 11.2 Raporty z Testów Automatycznych

-   **GitHub Actions Dashboard:**
    -   Status wszystkich testów widoczny bezpośrednio w PR.
    -   Historia wykonania testów.
    -   Artifacts z logami i screenshotami z failed testów.
-   **Playwright HTML Report:**
    -   Interaktywny raport z timeline wykonania.
    -   Screenshots i videos z failed testów.
    -   Trace viewer dla debugowania.
-   **Vitest Coverage Report:**
    -   Raport coverage generowany automatycznie.
    -   Visualizacja pokrycia kodu (HTML report).
    -   Badge z % coverage w README.
-   **Lighthouse CI:**
    -   Raport wydajności dla każdego PR.
    -   Porównanie z poprzednimi buildami.
    -   Alerty przy pogorszeniu metryk.

### 11.3 Raporty Okresowe (Staging/Production)

-   **Po każdym wdrożeniu na Staging:**
    -   📊 **Test Summary Report:**
        -   Liczba wykonanych testów (jednostkowe, integracyjne, E2E).
        -   Pass rate (% testów przeszło pomyślnie).
        -   Lista nowych błędów.
        -   Lista naprawionych błędów.
    -   🔒 **Security Report:**
        -   Wyniki Snyk scan.
        -   Wyniki OWASP ZAP scan.
        -   Lista podatności i plan naprawy.
    -   ⚡ **Performance Report:**
        -   Lighthouse scores.
        -   Core Web Vitals metrics.
        -   Bundle size analysis.
    -   ♿ **Accessibility Report:**
        -   Wyniki Axe-core scan.
        -   Lista problemów WCAG i priorytetyzacja.
    -   ✅ **Go/No-Go Decision:**
        -   Rekomendacja wdrożenia na produkcję.
        -   Lista warunków blokujących (jeśli istnieją).

### 11.4 Monitoring Produkcyjny

-   **Real-time monitoring:**
    -   Error tracking (np. Sentry, Rollbar).
    -   Performance monitoring (Real User Monitoring - RUM).
    -   Uptime monitoring.
-   **Weekly/Monthly Reports:**
    -   Error rate trends.
    -   Performance metrics trends.
    -   User-reported issues vs. automated detection.
    -   Test effectiveness metrics (escaped defects).

---

## 12. Podsumowanie Wyboru Technologii

### 12.1 Kluczowe Decyzje Technologiczne

#### **Frontend (Angular 19)**

| Decyzja | Wybór | Odrzucono | Uzasadnienie |
|---------|-------|-----------|--------------|
| **Testy Jednostkowe** | ✅ **Vitest** | ❌ Karma + Jasmine | Karma deprecated od Angular 16, Vitest 5-10x szybszy, HMR dla testów |
| **Testy Integracyjne** | ✅ **Testing Library + MSW** | ❌ TestBed + Spectator | User-centric testing, łatwiejszy refactoring, mockowanie na poziomie network |
| **Testy E2E** | ✅ **Playwright** | ❌ Cypress | Szybszy, multi-browser, lepsze narzędzia, w pełni darmowy |
| **Visual Regression** | ✅ **Playwright Visual** | ❌ Percy, Chromatic | Wbudowane w Playwright, zero kosztów |
| **Accessibility** | ✅ **@axe-core/playwright** | ❌ Manual only | Automatyzacja ~57% testów WCAG |
| **Wydajność** | ✅ **Lighthouse CI** | ❌ WebPageTest tylko | Integracja z CI/CD, performance budgets |

#### **Backend (Supabase Edge Functions)**

| Decyzja | Wybór | Uzasadnienie |
|---------|-------|--------------|
| **Testy Jednostkowe** | ✅ **Deno Test** | Wbudowany w Deno, zero config, natywne TS |
| **Testy Integracyjne** | ✅ **Deno Test + Supabase Local** | Testy z rzeczywistą bazą danych lokalnie |
| **BDD Style** | ✅ **Deno BDD** | Czytelność testów (describe/it) |
| **Mockowanie** | ✅ **Deno std/testing/mock** | Standardowa biblioteka Deno |

#### **Bezpieczeństwo i Jakość**

| Kategoria | Narzędzie | Uzasadnienie |
|-----------|-----------|--------------|
| **Skanowanie Zależności** | ✅ **Snyk** | Automatyczne PR z fixami, integracja CI/CD |
| **Dynamic Security Testing** | ✅ **OWASP ZAP** | Standard branżowy dla web apps |
| **Pre-commit Hooks** | ✅ **Husky + lint-staged** | Zapobiega commitowaniu złego kodu |
| **Code Quality** | ✅ **ESLint + Prettier** | Standard dla TypeScript/Angular |

### 12.2 Korzyści z Wybranego Stacku

#### **Szybkość Wykonania Testów**
-   **Vitest:** 5-10x szybszy niż Karma - feedback w sekundach zamiast minut
-   **Playwright:** Parallelizacja built-in - wszystkie testy w 1/4 czasu
-   **Deno Test:** Natywny TypeScript - brak transpilacji

#### **Developer Experience**
-   **Watch mode:** Vitest i Deno z instant feedback
-   **UI Mode:** @vitest/ui i Playwright UI dla debugowania
-   **Trace Viewer:** Playwright - timeline wykonania testów
-   **Auto-waiting:** Playwright - mniej flaky testów

#### **Oszczędności Kosztów**
-   **Playwright:** W pełni darmowy (vs. Cypress płatne funkcje)
-   **Visual Regression:** Wbudowane (vs. Percy $149/msc)
-   **Snyk:** Free tier dla open source
-   **Lighthouse CI:** Całkowicie darmowe

#### **Maintainability**
-   **Testing Library:** Testy odporne na refactoring
-   **MSW:** Mockowanie niezależne od implementacji
-   **Playwright:** Auto-update selektorów (Codegen)
-   **Deno:** Brak node_modules - deterministyczne buildy

#### **Coverage i Jakość**
-   **Automatyzacja:** 80%+ testów coverage automatycznie
-   **Multi-browser:** Chrome, Firefox, Safari bez dodatkowej pracy
-   **Accessibility:** 57% problemów WCAG wykrywanych automatycznie
-   **Security:** Codzienne skanowanie podatności

### 12.3 Migracja z Obecnych Narzędzi

Jeśli projekt już używa Karma/Jasmine/Cypress:

#### **Krok 1: Vitest (1-2 dni)**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @angular/build@next # Vite support dla Angular
```

#### **Krok 2: Testing Library (równolegle z pisaniem nowych testów)**
```bash
npm install -D @testing-library/angular @testing-library/user-event
npm install -D msw
```

#### **Krok 3: Playwright (1 dzień)**
```bash
npm install -D @playwright/test
npx playwright install
```

#### **Krok 4: Tooling (1 dzień)**
```bash
npm install -D @axe-core/playwright snyk @lhci/cli
```

**Całkowity czas migracji:** 3-5 dni roboczych dla średniego projektu.

### 12.4 Metryki Sukcesu

Po wdrożeniu nowego stacku testowego, oczekujemy:

| Metryka | Przed (Karma/Jasmine/Cypress) | Po (Vitest/Playwright) | Poprawa |
|---------|-------------------------------|------------------------|---------|
| **Czas testów jednostkowych** | ~5 min | ~30 sek | **10x** |
| **Czas testów E2E (lokalne)** | ~10 min | ~2 min | **5x** |
| **Flaky tests rate** | ~15% | ~3% | **5x** |
| **Test coverage** | ~60% | ~85% | **+25%** |
| **Time to fix (z Trace Viewer)** | ~30 min | ~5 min | **6x** |
| **CI/CD czas wykonania** | ~20 min | ~8 min | **2.5x** |

### 12.5 Rekomendacje Wdrożenia

**Priorytet 1 (Natychmiastowe):**
1. ✅ Migracja z Karma na Vitest - Karma deprecated
2. ✅ Dodanie Snyk - bezpieczeństwo krytyczne
3. ✅ Setup Playwright - lepszy ROI niż Cypress

**Priorytet 2 (W ciągu miesiąca):**
4. ✅ Testing Library dla nowych komponentów
5. ✅ Axe-core dla accessibility
6. ✅ Lighthouse CI w pipeline

**Priorytet 3 (Nice to have):**
7. ✅ Visual Regression Testing
8. ✅ Deno Test dla Edge Functions (gdy powstaną)
9. ✅ Storybook dla dokumentacji komponentów

### 12.6 Wsparcie i Dokumentacja

-   **Vitest:** https://vitest.dev
-   **Playwright:** https://playwright.dev
-   **Testing Library:** https://testing-library.com/docs/angular-testing-library/intro
-   **MSW:** https://mswjs.io
-   **Deno Test:** https://deno.land/manual/testing
-   **Supabase Local Testing:** https://supabase.com/docs/guides/functions/unit-test
-   **Axe-core:** https://github.com/dequelabs/axe-core
-   **Snyk:** https://docs.snyk.io

---

**Dokument zaktualizowany:** Listopad 2025  
**Następna aktualizacja:** Co 6 miesięcy lub przy znaczących zmianach technologicznych  
**Wersja:** 2.0 (Zaktualizowano o nowoczesne technologie testowe 2025)
