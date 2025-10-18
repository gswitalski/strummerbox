### Wstęp

Poniższy dokument stanowi techniczną specyfikację implementacji modułu uwierzytelniania, autoryzacji i odzyskiwania konta w aplikacji StrummerBox. Został on opracowany na podstawie dokumentu wymagań produktowych (PRD) oraz istniejącego stosu technologicznego, z kluczowym wykorzystaniem usług Supabase Auth oraz frameworka Angular.

### Założenia Architektoniczne

1.  **Backend as a Service (BaaS):** Całość logiki związanej z zarządzaniem tożsamością użytkownika (rejestracja, logowanie, sesje, odzyskiwanie hasła) zostanie zrealizowana przy użyciu **Supabase Auth**. Frontend będzie komunikował się bezpośrednio z API Supabase za pomocą biblioteki klienckiej `supabase-js`.
2.  **Single Page Application (SPA):** Aplikacja pozostaje w architekturze SPA. Zarządzanie routingiem, widokami i ochroną poszczególnych ścieżek będzie realizowane po stronie klienta przez Angular Router i dedykowane `RouteGuards`.
3.  **Reaktywność:** Stan sesji użytkownika (zalogowany/wylogowany) będzie zarządzany w sposób reaktywny przy użyciu serwisów Angulara i biblioteki RxJS, co umożliwi dynamiczne dostosowywanie interfejsu użytkownika w czasie rzeczywistym.

---

## 1. Architektura Interfejsu Użytkownika (Frontend)

Zmiany w warstwie frontendowej obejmą rozbudowę istniejących komponentów oraz utworzenie nowych, dedykowanych widoków i logiki do obsługi procesów autentykacji.

### 1.1. Nowe i zmodyfikowane komponenty/serwisy

**Nowe Strony (Pages):**

*   **`RegisterComponent` (`src/app/pages/register/`)**
    *   **Odpowiedzialność:** Wyświetlanie i obsługa formularza rejestracyjnego.
    *   **Elementy:** Formularz oparty o `ReactiveFormsModule` z polami na e-mail i hasło (wraz z jego powtórzeniem), walidacja w czasie rzeczywistym, obsługa komunikatów o błędach (np. "Użytkownik już istnieje", "Hasła nie są zgodne") oraz link do strony logowania.
*   **`ForgotPasswordComponent` (`src/app/pages/forgot-password/`)**
    *   **Odpowiedzialność:** Wyświetlanie i obsługa formularza do inicjowania procesu odzyskiwania hasła.
    *   **Elementy:** Formularz z polem na adres e-mail, przycisk do wysłania linku resetującego oraz informacja zwrotna dla użytkownika po pomyślnym zainicjowaniu procesu.
*   **`UpdatePasswordComponent` (`src/app/pages/update-password/`)**
    *   **Odpowiedzialność:** Strona docelowa, na którą trafia użytkownik po kliknięciu linku z maila. Umożliwia ustawienie nowego hasła.
    *   **Elementy:** Formularz z polami na nowe hasło i jego powtórzenie. Logika komponentu będzie musiała obsłużyć token odzyskiwania przekazany w adresie URL.

**Modyfikowane Komponenty:**

*   **`LoginComponent` (`src/app/pages/login/login.component.ts`)**
    *   **Rozszerzenie:** Należy dodać link do strony odzyskiwania hasła (`/forgot-password`) oraz link do strony rejestracji (`/register`).
*   **`ToolbarComponent` (`src/app/layout/toolbar/toolbar.component.ts`)**
    *   **Rozszerzenie:** Komponent będzie subskrybował stan zalogowania użytkownika z `AuthService`. W zależności od statusu, będzie wyświetlał:
        *   **Stan non-auth:** Przyciski "Zaloguj" i "Zarejestruj się".
        *   **Stan auth:** Informację o zalogowanym użytkowniku (np. jego e-mail) oraz przycisk "Wyloguj".
*   **`DefaultLayoutComponent` (`src/app/layout/default-layout/default-layout.component.ts`)**
    *   **Rozszerzenie:** Główny layout aplikacji będzie nasłuchiwał na zmiany w stanie autentykacji, aby dynamicznie zarządzać dostępem do poszczególnych części interfejsu (np. menu nawigacyjne).

### 1.2. Serwisy i logika

*   **`AuthService` (`src/app/core/services/auth.service.ts`)**
    *   **Rozszerzenie:** Serwis ten stanie się centralnym punktem zarządzania stanem uwierzytelnienia w całej aplikacji.
    *   **Publiczne API serwisu:**
        *   `user$: Observable<User | null>`: Strumień emitujący aktualny stan użytkownika.
        *   `session$: Observable<Session | null>`: Strumień z informacjami o sesji.
        *   `isLoggedIn$: Observable<boolean>`: Strumień emitujący `true` lub `false`.
        *   `signUp(credentials: { email, password }): Promise<AuthResponse>`: Metoda do rejestracji.
        *   `signIn(credentials: { email, password }): Promise<AuthResponse>`: Metoda do logowania.
        *   `signOut(): Promise<void>`: Metoda do wylogowania.
        *   `recoverPassword(email: string): Promise<void>`: Metoda do wysyłania linku odzyskiwania hasła.
        *   `updatePassword(newPassword: string): Promise<AuthResponse>`: Metoda do aktualizacji hasła użytkownika.
    *   **Logika wewnętrzna:** Serwis będzie enkapsulował logikę komunikacji z `SupabaseService`, nasłuchiwał na zdarzenie `onAuthStateChange` z klienta Supabase i na jego podstawie aktualizował wewnętrzne `BehaviorSubject`, z których wystawiane będą publiczne strumienie.

### 1.3. Routing i Ochrona Tras

*   **`app.routes.ts`**
    *   **Rozszerzenie:** Plik konfiguracyjny routingu zostanie zaktualizowany o nowe ścieżki:
        *   `/register` -> `RegisterComponent`
        *   `/forgot-password` -> `ForgotPasswordComponent`
        *   `/update-password` -> `UpdatePasswordComponent`
    *   Ochrona tras zostanie zaimplementowana z użyciem `canActivate`.
*   **`AuthGuard` (`src/app/core/guards/auth.guard.ts`)**
    *   **Modyfikacja:** Guard będzie sprawdzał stan zalogowania (`isLoggedIn$`) w `AuthService`. Jeśli użytkownik nie jest zalogowany, nastąpi przekierowanie do `/login`. Będzie on przypisany do wszystkich tras wymagających autentykacji (np. `/dashboard`).
*   **`PublicGuard` (nowy plik `src/app/core/guards/public.guard.ts`)**
    *   **Nowy element:** Guard ten będzie działał odwrotnie do `AuthGuard`. Będzie chronił trasy takie jak `/login` i `/register` przed dostępem przez już zalogowanych użytkowników. W przypadku próby wejścia, użytkownik zostanie przekierowany do `/dashboard`.

### 1.4. Walidacja i obsługa błędów

*   **Walidacja formularzy:** Zostanie zrealizowana przy użyciu `Angular Reactive Forms`. Walidatory będą sprawdzać m.in. poprawność formatu e-mail, minimalną długość hasła oraz zgodność haseł.
*   **Komunikaty dla użytkownika:** Do wyświetlania błędów (np. "Nieprawidłowe hasło") oraz komunikatów o powodzeniu (np. "Link do resetu hasła został wysłany") zostanie wykorzystany komponent `MatSnackBar` z biblioteki Angular Material.

---

## 2. Logika Backendowa

Logika backendowa jest w całości obsługiwana przez Supabase, co eliminuje potrzebę tworzenia tradycyjnego serwera aplikacyjnego.

### 2.1. Interakcja z Supabase

*   **Klient Supabase:** `AuthService` będzie jedynym miejscem w aplikacji, które bezpośrednio komunikuje się z `supabase.auth`. Wszystkie operacje (logowanie, rejestracja itd.) będą wywoływane na kliencie Supabase.
*   **Modele Danych (Kontrakty):** Nie ma potrzeby tworzenia dedykowanych modeli DTO. Aplikacja będzie operować na typach `User` i `Session` dostarczanych przez bibliotekę `@supabase/supabase-js`.
*   **Bezpieczeństwo:** Klucze API Supabase (`anon key`) będą przechowywane w plikach środowiskowych (`src/environments/`).

### 2.2. Profile Użytkowników

Zgodnie z wymaganiem, aby "Organizator" mógł zarządzać piosenkami, konieczne jest rozróżnienie ról lub powiązanie danych z konkretnym użytkownikiem.

*   **Tabela `profiles` w Supabase:** Należy upewnić się, że istnieje tabela `profiles` z kluczem obcym wskazującym na `auth.users(id)`.
*   **Trigger bazodanowy:** Po pomyślnej rejestracji nowego użytkownika w tabeli `auth.users`, trigger w bazie danych PostgreSQL powinien automatycznie tworzyć dla niego powiązany wiersz w tabeli `profiles`. Zapewni to spójność danych.

### 2.3. Endpointy API

Aplikacja nie będzie implementować własnych endpointów REST API na potrzeby autentykacji. Będą wykorzystywane standardowe, wbudowane endpointy Supabase, dostępne poprzez bibliotekę kliencką. Istniejący endpoint Deno ` /me` pozostaje bez zmian - będzie on wykorzystywany przez zalogowanego użytkownika do pobierania danych profilowych.

---

## 3. System Autentykacji (Integracja z Supabase)

### 3.1. Konfiguracja Supabase Auth

*   **Dostawcy:** W panelu Supabase zostanie skonfigurowany wyłącznie dostawca "Email/Password".
*   **Szablony e-mail:** Należy dostosować szablony wiadomości e-mail (potwierdzenie rejestracji, reset hasła), aby były zgodne z identyfikacją wizualną aplikacji i zawierały poprawne linki zwrotne (np. `https://strummerbox.app/update-password`).
*   **Potwierdzenie e-mail:** Zaleca się włączenie opcji "Enable email confirmation", aby weryfikować adresy e-mail użytkowników. Należy to uwzględnić w przepływie rejestracji (informacja dla użytkownika o konieczności sprawdzenia skrzynki).

### 3.2. Przepływ danych (Flows)

*   **Rejestracja:** `RegisterComponent` -> `AuthService.signUp()` -> `supabase.auth.signUp()` -> (opcjonalnie) E-mail z linkiem weryfikacyjnym -> Użytkownik jest zalogowany -> Przekierowanie do `/dashboard`.
*   **Logowanie:** `LoginComponent` -> `AuthService.signIn()` -> `supabase.auth.signInWithPassword()` -> `onAuthStateChange` emituje nową sesję -> `AuthService` aktualizuje stan -> Przekierowanie do `/dashboard`.
*   **Wylogowanie:** `ToolbarComponent` -> `AuthService.signOut()` -> `supabase.auth.signOut()` -> `onAuthStateChange` emituje `null` -> Przekierowanie do `/login`.
*   **Odzyskiwanie hasła:**
    1.  `ForgotPasswordComponent` -> `AuthService.recoverPassword()` -> `supabase.auth.resetPasswordForEmail()`.
    2.  Użytkownik otrzymuje e-mail i klika link.
    3.  Jest przekierowany do `UpdatePasswordComponent`.
    4.  `UpdatePasswordComponent` odczytuje token, woła `AuthService.updatePassword()` -> `supabase.auth.updateUser()` -> Przekierowanie do `/login` z komunikatem o sukcesie.
