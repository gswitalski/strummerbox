# Plan implementacji widoku Oczekiwania na Potwierdzenie E-mail

## 1. Przegląd

Celem jest modyfikacja istniejącego procesu rejestracji oraz dodanie nowego widoku, który informuje użytkownika o konieczności potwierdzenia adresu e-mail w celu aktywacji konta. Po pomyślnej rejestracji, zamiast automatycznego logowania, użytkownik jest przekierowywany na dedykowaną stronę `/auth/awaiting-confirmation`. Strona ta wyświetla stosowny komunikat, adres e-mail, na który wysłano link, oraz umożliwia ponowne wysłanie linku aktywacyjnego.

## 2. Routing widoku

-   **Nowy widok:** `Awaiting Email Confirmation`
    -   **Ścieżka:** `/auth/awaiting-confirmation`
    -   **Parametry:** Opcjonalny parametr zapytania `email`, np. `/auth/awaiting-confirmation?email=user@example.com`
-   **Zmodyfikowany widok:** `Register View`
    -   **Ścieżka:** `/register` (bez zmian)
    -   **Zmiana w logice:** Po pomyślnej rejestracji następuje przekierowanie do `/auth/awaiting-confirmation`.

## 3. Struktura komponentów

Struktura pozostaje płaska, ponieważ oba widoki są komponentami-stronami.

```
- AppComponent
  - RouterOutlet
    - ...
    - RegisterPageComponent (istniejący, modyfikowany)
    - AwaitingConfirmationPageComponent (nowy)
    - ...
```

## 4. Szczegóły komponentów

### `RegisterPageComponent` (Modyfikacja)

-   **Opis komponentu:** Formularz umożliwiający nowym użytkownikom założenie konta. Logika komponentu zostanie zaktualizowana, aby po pomyślnej rejestracji przekierować użytkownika na nową stronę oczekiwania na potwierdzenie.
-   **Główne elementy:** `mat-card`, `mat-form-field` dla e-maila, `displayName` i hasła, `mat-button` do rejestracji i nawigacji do logowania.
-   **Obsługiwane interakcje:**
    -   Wypełnienie formularza i kliknięcie przycisku "Zarejestruj".
-   **Obsługiwana walidacja:**
    -   `email`: pole wymagane, poprawny format e-mail.
    -   `displayName`: pole wymagane.
    -   `password`: pole wymagane, minimalna długość 8 znaków.
    -   `confirmPassword`: musi być identyczne z polem `password`.
-   **Typy:**
    -   `OrganizerRegisterCommand` (dla żądania API)
-   **Propsy:** Brak (komponent-strona).

### `AwaitingConfirmationPageComponent` (Nowy)

-   **Opis komponentu:** Prosta strona informacyjna wyświetlana po rejestracji. Jej celem jest poinstruowanie użytkownika, aby sprawdził swoją skrzynkę e-mail i kliknął link aktywacyjny. Komponent odczytuje adres e-mail z parametrów zapytania URL.
-   **Główne elementy:**
    -   `mat-card` jako kontener.
    -   `mat-icon` z ikoną koperty (`email`).
    -   Statyczny tekst informacyjny.
    -   Dynamicznie wyświetlany adres e-mail użytkownika.
    -   `mat-button` z akcją "Nie otrzymałem e-maila. Wyślij ponownie".
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "Wyślij ponownie", co wywołuje API w celu ponownego wysłania linku aktywacyjnego.
-   **Obsługiwana walidacja:** Brak walidacji formularza. Przycisk "Wyślij ponownie" będzie tymczasowo blokowany po kliknięciu, aby zapobiec spamowi.
-   **Typy:**
    -   `ResendConfirmationCommand` (dla żądania API)
-   **Propsy:** Brak (komponent-strona).

## 5. Typy

Wykorzystane zostaną istniejące typy z `packages/contracts/types.ts`:

-   **`OrganizerRegisterCommand`**: Obiekt wysyłany do API podczas rejestracji.
    ```typescript
    export type OrganizerRegisterCommand = {
        email: string;
        password: string;
        displayName: ProfileRow['display_name'];
    };
    ```
-   **`ResendConfirmationCommand`**: Obiekt wysyłany do API w celu ponownego wysłania e-maila.
    ```typescript
    export type ResendConfirmationCommand = {
        email: string;
    };
    ```

Nie ma potrzeby tworzenia nowych typów ani modeli ViewModel.

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w komponentach przy użyciu Angular Signals.

-   **`RegisterPageComponent`**:
    -   `form: FormGroup`: stan formularza rejestracji.
    -   `isLoading = signal(false)`: do zarządzania wskaźnikiem ładowania podczas komunikacji z API.
    -   `errorMessage = signal<string>('')`: do wyświetlania błędów API (np. "Email już istnieje").
-   **`AwaitingConfirmationPageComponent`**:
    -   `email = signal<string>('')`: przechowuje e-mail odczytany z parametrów URL.
    -   `isResending = signal(false)`: zarządza wskaźnikiem ładowania na przycisku "Wyślij ponownie".

Globalny stan nie jest wymagany. E-mail zostanie przekazany między widokami za pomocą parametru zapytania URL.

## 7. Integracja API

Zostaną wykorzystane dwa endpointy, a logika ich obsługi znajdzie się w `AuthService`.

1.  **Rejestracja użytkownika:**
    -   **Endpoint:** `POST /auth/register`
    -   **Komponent:** `RegisterPageComponent`
    -   **Typ żądania:** `OrganizerRegisterCommand`
    -   **Typ odpowiedzi:** `OrganizerProfileDto`
    -   **Logika:** Po otrzymaniu odpowiedzi `201 Created`, komponent przekieruje użytkownika na `/auth/awaiting-confirmation`, przekazując e-mail w parametrze zapytania.

2.  **Ponowne wysłanie e-maila:**
    -   **Endpoint:** `POST /auth/resend-confirmation`
    -   **Komponent:** `AwaitingConfirmationPageComponent`
    -   **Typ żądania:** `ResendConfirmationCommand`
    -   **Typ odpowiedzi:** `200 OK` z komunikatem.
    -   **Logika:** Po pomyślnym wysłaniu, komponent wyświetli powiadomienie (np. `MatSnackBar`) i tymczasowo zablokuje przycisk.

## 8. Interakcje użytkownika

-   **Użytkownik na stronie `/register`:** Wypełnia formularz i klika "Zarejestruj". Aplikacja pokazuje wskaźnik ładowania. Po sukcesie, następuje przekierowanie na `/auth/awaiting-confirmation?email=...`. W razie błędu, pod formularzem pojawia się komunikat.
-   **Użytkownik na stronie `/auth/awaiting-confirmation`:** Widzi informację o konieczności sprawdzenia skrzynki pocztowej.
-   **Użytkownik klika "Wyślij ponownie"**: Przycisk pokazuje wskaźnik ładowania i staje się nieaktywny. Po chwili pojawia się komunikat `SnackBar` "Wysłano nowy link aktywacyjny", a przycisk pozostaje nieaktywny przez 30 sekund.

## 9. Warunki i walidacja

-   **Formularz rejestracji:**
    -   Wszystkie pola są wymagane.
    -   E-mail musi mieć prawidłowy format.
    -   Hasło musi mieć co najmniej 8 znaków.
    -   Hasła w obu polach muszą być identyczne.
    -   Przycisk "Zarejestruj" jest nieaktywny (`disabled`), dopóki formularz nie jest w pełni poprawny.
-   **Strona oczekiwania na potwierdzenie:**
    -   Jeśli użytkownik wejdzie na stronę bez parametru `email` w URL, zostanie przekierowany na stronę logowania (`/login`).
    -   Przycisk "Wyślij ponownie" jest blokowany na 30 sekund po każdym kliknięciu, aby zapobiec nadużyciom.

## 10. Obsługa błędów

-   **Rejestracja - `409 Conflict` (e-mail zajęty):** `RegisterPageComponent` wyświetli komunikat błędu: "Konto o tym adresie e-mail już istnieje."
-   **Rejestracja - `400 Bad Request` (np. słabe hasło):** `RegisterPageComponent` wyświetli komunikat: "Wprowadzone dane są nieprawidłowe."
-   **Rejestracja - Błąd sieci:** `RegisterPageComponent` wyświetli ogólny komunikat: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
-   **Ponowne wysłanie linku - Błąd API/sieci:** `AwaitingConfirmationPageComponent` wyświetli `SnackBar` z ogólnym komunikatem błędu.

## 11. Kroki implementacji

1.  **Utworzenie serwisu:**
    -   W `src/app/core/services/` zaktualizować `AuthService`, dodając metody `register(cmd: OrganizerRegisterCommand)` oraz `resendConfirmation(cmd: ResendConfirmationCommand)`. Obie metody będą wywoływać odpowiednie endpointy API.

2.  **Utworzenie nowego komponentu:**
    -   Za pomocą Angular CLI wygenerować nowy, samodzielny komponent: `ng g c pages/auth/awaiting-confirmation --standalone`.
    -   Zaimplementować logikę komponentu:
        -   W `ngOnInit` odczytać `email` z `ActivatedRoute.queryParams`. Jeśli brak, przekierować do `/login`.
        -   Stworzyć szablon HTML z `mat-card`, `mat-icon` i `mat-button` zgodnie z planem UI.
        -   Dodać metodę `resend()`, która wywołuje `authService.resendConfirmation`, zarządza stanem `isResending` i blokuje przycisk na 30 sekund po sukcesie.

3.  **Aktualizacja routingu:**
    -   W głównym pliku `app.routes.ts` dodać nową ścieżkę: `{ path: 'auth/awaiting-confirmation', component: AwaitingConfirmationPageComponent }`.

4.  **Modyfikacja `RegisterPageComponent`:**
    -   W metodzie obsługującej wysłanie formularza, w bloku `subscribe` lub `then` po pomyślnym wywołaniu `authService.register`, zastąpić obecną logikę przekierowaniem: `this.router.navigate(['/auth/awaiting-confirmation'], { queryParams: { email: formValue.email } });`.
    -   Dodać obsługę błędów specyficznych dla rejestracji (409, 400).

5.  **Stylowanie i testowanie:**
    -   Dodać style SCSS dla `AwaitingConfirmationPageComponent`, aby zapewnić odpowiedni wygląd i wyśrodkowanie na stronie.
    -   Ręcznie przetestować cały przepływ: rejestracja, przekierowanie, wyświetlanie e-maila, działanie przycisku "Wyślij ponownie" i obsługa błędów.
