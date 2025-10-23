# Plan implementacji widoku Logowania (Login View)

## 1. Przegląd

Widok logowania umożliwia zarejestrowanemu użytkownikowi typu "Organizator" zalogowanie się do aplikacji przy użyciu adresu e-mail i hasła. Formularz jest zabezpieczony podstawową walidacją, a proces logowania jest obsługiwany przez Supabase. Po pomyślnym uwierzytelnieniu użytkownik jest przekierowywany do panelu zarządzania.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:
-   **Ścieżka:** `/login`
-   **Moduł:** `app.routes.ts` (lub dedykowany moduł routingu)

## 3. Struktura komponentów

Struktura będzie prosta i składać się z jednego komponentu-strony.

```
- LoginComponent (/login)
  - mat-card
    - h1 (Tytuł "Logowanie")
    - form [formGroup]
      - mat-form-field (dla e-mail)
        - mat-label
        - input (matInput, type="email", formControlName="email")
        - mat-error (dla błędów walidacji)
      - mat-form-field (dla hasła)
        - mat-label
        - input (matInput, type="password", formControlName="password")
        - mat-error (dla błędów walidacji)
      - mat-progress-bar (widoczna podczas wysyłania żądania)
      - div (kontener na błąd logowania)
      - button (mat-raised-button, color="primary", type="submit")
```

## 4. Szczegóły komponentów

### `LoginComponent`

-   **Opis komponentu:** Komponent odpowiedzialny za renderowanie i obsługę formularza logowania. Będzie zawierał logikę walidacji, komunikację z serwisem autentykacji oraz obsługę stanu ładowania i błędów.
-   **Główne elementy:** Komponent będzie używał `mat-card` jako kontenera. Wewnątrz znajdzie się formularz (`<form>`) zbudowany przy użyciu `ReactiveFormsModule` z Angulara. Pola formularza (`mat-form-field`, `mat-input`) i przycisk (`mat-button`) będą pochodzić z biblioteki Angular Material. Pasek postępu `mat-progress-bar` będzie informował o stanie wysyłania żądania.
-   **Obsługiwane zdarzenia:**
    -   `ngSubmit`: Uruchamiane po wysłaniu formularza, wywołuje metodę `onSubmit()` w komponencie.
-   **Warunki walidacji:**
    -   **Email:**
        -   Pole wymagane (`Validators.required`).
        -   Poprawny format adresu e-mail (`Validators.email`).
    -   **Hasło:**
        -   Pole wymagane (`Validators.required`).
-   **Typy:**
    -   `FormGroup`
    -   `LoginFormViewModel`
-   **Propsy (wejścia `@Input`):** Brak, komponent jest komponentem-stroną.

## 5. Typy

Do implementacji widoku potrzebny będzie jeden nowy typ dla modelu formularza.

### `LoginFormViewModel`

Prosty interfejs opisujący strukturę danych formularza logowania.

```typescript
export interface LoginFormViewModel {
    email: string;
    password: string;
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w `LoginComponent` za pomocą `ReactiveFormsModule` oraz właściwości komponentu.

-   **`loginForm: FormGroup`**: Obiekt `FormGroup` do zarządzania stanem pól `email` i `password`, ich wartościami i statusem walidacji.
-   **`isLoading: boolean`**: Flaga wskazująca, czy żądanie logowania jest w toku. Używana do wyświetlania `mat-progress-bar` i blokowania przycisku "Zaloguj".
-   **`errorMessage: string | null`**: Przechowuje komunikat o błędzie zwrócony przez API, który jest wyświetlany użytkownikowi w przypadku nieudanego logowania.

## 7. Integracja API

Integracja z backendem będzie realizowana poprzez serwis `SupabaseService`, który enkapsuluje klienta Supabase.

-   **Serwis:** `SupabaseService` (należy go wstrzyknąć do `LoginComponent`).
-   **Metoda:** `supabase.auth.signInWithPassword(credentials)`
-   **Typy żądania:** `SignInWithPasswordCredentials` z biblioteki `@supabase/supabase-js`.
    ```typescript
    {
      email: string,
      password: string
    }
    ```
-   **Typy odpowiedzi:** `AuthResponse` z `@supabase/supabase-js`.
    -   **Sukces:** Obiekt zawierający `data.user` i `data.session`.
    -   **Błąd:** Obiekt zawierający `error` z informacjami o przyczynie niepowodzenia.

## 8. Interakcje użytkownika

-   **Wprowadzanie danych:** Użytkownik wpisuje e-mail i hasło. Walidatory `ReactiveFormsModule` na bieżąco sprawdzają poprawność danych. Komunikaty o błędach walidacji pojawiają się pod odpowiednimi polami.
-   **Wysyłanie formularza:**
    1.  Użytkownik klika przycisk "Zaloguj".
    2.  Przycisk jest nieaktywny, jeśli formularz jest nieprawidłowy lub żądanie jest w toku.
    3.  Po kliknięciu, komponent ustawia `isLoading = true`.
    4.  Wywoływana jest metoda `supabase.auth.signInWithPassword()` z danymi z formularza.
-   **Wynik operacji:**
    -   **Sukces:** `isLoading` wraca na `false`, a użytkownik jest przekierowywany do `/dashboard` za pomocą `Router` z Angulara.
    -   **Błąd:** `isLoading` wraca na `false`, `errorMessage` jest ustawiany na podstawie odpowiedzi z API, a komunikat o błędzie jest wyświetlany w widoku.

## 9. Warunki i walidacja

-   **Formularz:** Przycisk "Zaloguj" jest nieaktywny (`disabled`), gdy formularz jest niepoprawny (`loginForm.invalid`) lub gdy trwa proces logowania (`isLoading`).
-   **Pole Email:**
    -   Komunikat "Adres e-mail jest wymagany." jest wyświetlany, gdy pole jest puste i dotknięte.
    -   Komunikat "Proszę podać poprawny adres e-mail." jest wyświetlany, gdy wprowadzona wartość nie pasuje do wzorca e-mail.
-   **Pole Hasło:**
    -   Komunikat "Hasło jest wymagane." jest wyświetlany, gdy pole jest puste i dotknięte.

## 10. Obsługa błędów

-   **Błędy walidacji:** Obsługiwane przez `mat-error` w szablonie, powiązane ze stanem błędów `FormControl`.
-   **Błędy API:**
    -   Po otrzymaniu błędu z `signInWithPassword` (np. `Invalid login credentials`), jego treść zostanie przypisana do zmiennej `errorMessage`.
    -   W szablonie zostanie umieszczony element (np. `<div>` z odpowiednią klasą CSS), który wyświetli ten błąd, np. nad przyciskiem "Zaloguj".
-   **Błędy sieciowe:** Będą traktowane tak samo jak błędy API, wyświetlając ogólny komunikat o problemie z logowaniem.

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:**
    -   Utwórz nowy komponent `LoginComponent` w katalogu `src/app/pages/login/`.
    -   Użyj polecenia `ng generate component pages/login`.
2.  **Konfiguracja routingu:**
    -   W pliku `src/app/app.routes.ts` dodaj nową ścieżkę dla widoku logowania:
        ```typescript
        {
            path: 'login',
            loadComponent: () =>
                import('./pages/login/login.component').then(
                    (m) => m.LoginComponent
                ),
        }
        ```
3.  **Implementacja szablonu (`login.component.html`):**
    -   Zbuduj strukturę HTML z użyciem komponentów Angular Material (`mat-card`, `mat-form-field`, `mat-input`, `mat-button`, `mat-progress-bar`).
    -   Powiąż formularz z `FormGroup` za pomocą dyrektywy `[formGroup]`.
    -   Dodaj `formControlName` do inputów.
    -   Zaimplementuj wyświetlanie błędów walidacji za pomocą `mat-error`.
    -   Dodaj `mat-progress-bar` i powiąż jego widoczność ze zmienną `isLoading`.
    -   Dodaj element do wyświetlania `errorMessage` pod przyciskiem.
4.  **Implementacja logiki komponentu (`login.component.ts`):**
    -   Zaimportuj niezbędne moduły: `ReactiveFormsModule` oraz komponenty Angular Material w module nadrzędnym lub w `imports` komponentu.
    -   Wstrzyknij `FormBuilder`, `Router` i `SupabaseService` (przez `inject`).
    -   W konstruktorze lub inicjalizacji utwórz `loginForm` za pomocą `FormBuilder`, definiując `FormControl` dla `email` i `password` wraz z walidatorami.
    -   Zdefiniuj sygnały `isLoading` i `errorMessage`.
    -   Zaimplementuj metodę `onSubmit()`, która:
        -   Sprawdza, czy formularz jest poprawny.
        -   Ustawia `isLoading = true`.
        -   Wywołuje metodę logowania z `SupabaseService`.
        -   Obsługuje odpowiedź sukcesu (nawigacja) i błędu (ustawienie `errorMessage`).
        -   W bloku `finally` ustawia `isLoading = false`.
5.  **Stylowanie (`login.component.scss`):**
    -   Dodaj podstawowe style, aby wycentrować kartę logowania na stronie i zapewnić odpowiednie marginesy.
6.  **Ochrona tras:**
    -   Upewnij się, że `AuthGuard` (jeśli istnieje) poprawnie przekierowuje niezalogowanych użytkowników z chronionych tras (np. `/dashboard`) na `/login`.
