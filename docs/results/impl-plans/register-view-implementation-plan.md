# Plan implementacji widoku: Rejestracja (Register View)

## 1. Przegląd
Widok Rejestracji umożliwia nowym użytkownikom (Organizatorom) utworzenie konta w aplikacji StrummerBox. Składa się z formularza, który zbiera adres e-mail, nazwę wyświetlaną (nick) oraz hasło. Po pomyślnej walidacji i przesłaniu danych, system tworzy nowego użytkownika, automatycznie go loguje i przekierowuje do panelu głównego (Dashboard). Widok ten jest kluczowy dla pozyskiwania nowych Organizatorów i stanowi pierwszy krok w ich interakcji z aplikacją.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką URL:
-   **Ścieżka:** `/register`

Dostęp do tego widoku powinien być publiczny i nie wymagać uwierzytelnienia. Użytkownik będzie na niego trafiał głównie poprzez kliknięcie przycisku "Zarejestruj się" w widoku logowania.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie prosta, oddzielając logikę (komponent "smart") od prezentacji (komponent "dumb").

```
/register (RegisterPageComponent)
└── app-register-form (RegisterFormComponent)
```

-   `RegisterPageComponent`: Komponent "smart", odpowiedzialny za zarządzanie stanem (ładowanie, błędy), komunikację z `AuthService` oraz nawigację po pomyślnej rejestracji.
-   `RegisterFormComponent`: Komponent "dumb", odpowiedzialny za renderowanie formularza, walidację pól po stronie klienta i emitowanie zdarzenia z danymi formularza po jego wysłaniu.

## 4. Szczegóły komponentów

### `RegisterPageComponent`
-   **Opis:** Główny komponent strony `/register`. Jego zadaniem jest obsługa logiki związanej z procesem rejestracji. Renderuje on komponent formularza `RegisterFormComponent` i nasłuchuje na jego zdarzenia, aby zainicjować komunikację z API. Odpowiada za wyświetlanie globalnych informacji zwrotnych, takich jak wskaźnik ładowania czy komunikaty o błędach serwera.
-   **Główne elementy:**
    -   Komponent `<app-register-form>`.
    -   Potencjalnie komponent `MatProgressBar` lub `MatSpinner` do wizualizacji stanu ładowania.
    -   Element do wyświetlania komunikatów o błędach (np. `mat-error` lub niestandardowy komponent alertu).
-   **Obsługiwane interakcje:**
    -   Odbiera zdarzenie `formSubmit` z `RegisterFormComponent`.
    -   Po otrzymaniu zdarzenia wywołuje metodę `register` w `AuthService`.
    -   Po pomyślnej rejestracji, wywołuje metodę `login` w `AuthService` w celu automatycznego zalogowania.
    -   Po pomyślnym zalogowaniu, przekierowuje użytkownika na ścieżkę `/dashboard`.
-   **Obsługiwana walidacja:** Brak – walidacja odbywa się w komponencie formularza.
-   **Typy:** `OrganizerRegisterCommand`.
-   **Propsy:** Brak.

### `RegisterFormComponent`
-   **Opis:** Reużywalny komponent formularza rejestracyjnego. Zawiera wszystkie pola `(email, displayName, password, confirmPassword)`, logikę walidacji w czasie rzeczywistym oraz przycisk do wysłania formularza. Jest komponentem prezentacyjnym, który nie posiada wiedzy o serwisach ani stanie aplikacji.
-   **Główne elementy:**
    -   `<form [formGroup]="registerForm">` opakowany w `<mat-card>`.
    -   `<mat-form-field>` dla każdego pola formularza z odpowiednimi dyrektywami `matInput`.
    -   `<mat-error>` do wyświetlania komunikatów walidacji dla poszczególnych pól.
    -   `<button mat-raised-button color="primary">` do wysłania formularza.
    -   `<p>` z linkiem `<a>` do strony logowania (`/login`).
-   **Obsługiwane interakcje:**
    -   Emituje zdarzenie `(formSubmit)` z wartością formularza (`OrganizerRegisterCommand`) po kliknięciu przycisku "Zarejestruj", pod warunkiem, że formularz jest poprawny.
    -   Wyświetla błędy walidacji, gdy użytkownik wejdzie w interakcję z polami.
-   **Obsługiwana walidacja (zgodnie z API):**
    -   `email`: Pole wymagane (`Validators.required`), musi być w poprawnym formacie e-mail (`Validators.email`).
    -   `displayName`: Pole wymagane (`Validators.required`), minimalna długość 1 znak (`Validators.minLength(1)`), maksymalna 120 znaków (`Validators.maxLength(120)`).
    -   `password`: Pole wymagane (`Validators.required`), minimalna długość 8 znaków (`Validators.minLength(8)`), maksymalna 256 znaków (`Validators.maxLength(256)`).
    -   `confirmPassword`: Pole wymagane (`Validators.required`). Dodatkowo, cały formularz musi mieć walidator sprawdzający, czy wartość tego pola jest identyczna z wartością pola `password`.
-   **Typy:** `RegisterFormViewModel`, `OrganizerRegisterCommand`.
-   **Propsy:**
    -   `@Input() isLoading: boolean`: Kontroluje stan ładowania (np. wyłącza przycisk i pokazuje progress bar).
    -   `@Input() serverError: string | null`: Wyświetla błąd zwrócony przez serwer (np. "Użytkownik już istnieje").

## 5. Typy
Do implementacji widoku, oprócz istniejących typów DTO, potrzebny będzie jeden nowy typ `ViewModel` dla formularza.

-   **`OrganizerRegisterCommand` (DTO):**
    -   **Źródło:** `packages/contracts/types.ts`
    -   **Cel:** Struktura danych wysyłana w ciele żądania `POST /me/register`.
    -   **Pola:**
        -   `email: string`
        -   `password: string`
        -   `displayName: string`

-   **`RegisterFormViewModel` (ViewModel - nowy):**
    -   **Cel:** Reprezentuje strukturę i typy kontrolek w `FormGroup` w `RegisterFormComponent`, zapewniając bezpieczeństwo typów.
    -   **Pola:**
        -   `email: FormControl<string>`
        -   `displayName: FormControl<string>`
        -   `password: FormControl<string>`
        -   `confirmPassword: FormControl<string>`

## 6. Zarządzanie stanem
Stan dla tego widoku będzie zarządzany lokalnie w `RegisterPageComponent` przy użyciu `BehaviorSubject` z biblioteki RxJS. Nie ma potrzeby wprowadzania globalnego zarządcy stanu (np. NgRx) dla tak prostego przypadku.

-   `isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);`
    -   **Cel:** Śledzi stan operacji asynchronicznej (rejestracja i logowanie). Jest przekazywany do `RegisterFormComponent`, aby wyłączyć przycisk i wyświetlić wskaźnik postępu.
-   `error$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);`
    -   **Cel:** Przechowuje komunikaty o błędach pochodzące z serwera (np. błąd walidacji, konflikt e-mail). Przekazywany do `RegisterFormComponent` w celu wyświetlenia użytkownikowi.

## 7. Integracja API
Integracja z backendem będzie realizowana poprzez `AuthService`, który będzie zawierał metody do rejestracji i logowania.

1.  **Rejestracja Użytkownika:**
    -   **Endpoint:** `POST /functions/v1/me/register`
    -   **Akcja:** `RegisterPageComponent` wywołuje `authService.register(command)`.
    -   **Typ żądania:** `OrganizerRegisterCommand`
    -   **Typ odpowiedzi (sukces):** `OrganizerProfileDto`
    -   **Obsługa:** Po otrzymaniu odpowiedzi 201 Created, komponent inicjuje proces automatycznego logowania.

2.  **Logowanie Użytkownika (wymagane do auto-logowania):**
    -   **Endpoint:** `POST /token?grant_type=password` (standardowy endpoint Supabase Auth)
    -   **Akcja:** `RegisterPageComponent` wywołuje `authService.login(email, password)`.
    -   **Typ żądania:** `{ email: string, password: string }`
    -   **Typ odpowiedzi (sukces):** `Session` (obiekt sesji z tokenem JWT)
    -   **Obsługa:** Po pomyślnym zalogowaniu, sesja jest zapisywana (np. w `localStorage`), a użytkownik jest przekierowywany.

## 8. Interakcje użytkownika
-   **Wpisywanie danych w formularz:** Walidacja odbywa się na bieżąco, a komunikaty o błędach pojawiają się pod polami po ich dotknięciu (`touched`).
-   **Kliknięcie przycisku "Zarejestruj się":**
    -   Jeśli formularz jest niepoprawny, przycisk jest nieaktywny lub kliknięcie nic nie robi, a błędy walidacji są wyraźnie widoczne.
    -   Jeśli formularz jest poprawny, przycisk zostaje zablokowany, pojawia się wskaźnik ładowania, a żądanie jest wysyłane do API.
-   **Sukces rejestracji:** Wskaźnik ładowania znika, a użytkownik jest natychmiast przekierowywany do `/dashboard`.
-   **Błąd rejestracji:** Wskaźnik ładowania znika, przycisk zostaje odblokowany, a pod formularzem lub w jego obrębie pojawia się czytelny komunikat o błędzie (np. "Użytkownik o tym adresie e-mail już istnieje.").
-   **Kliknięcie linku "Masz już konto? Zaloguj się":** Użytkownik jest przekierowywany na stronę `/login`.

## 9. Warunki i walidacja
-   **Przycisk "Zarejestruj się"** jest w stanie `disabled`, dopóki cały `registerForm` nie jest w stanie `valid`.
-   **Walidator `email`** (`RegisterFormComponent`) sprawdza, czy wartość jest wymagana i czy pasuje do wzorca adresu e-mail.
-   **Walidator `displayName`** (`RegisterFormComponent`) sprawdza, czy pole nie jest puste oraz czy jego długość mieści się w przedziale 1-120 znaków.
-   **Walidator `password`** (`RegisterFormComponent`) sprawdza, czy hasło ma co najmniej 8 znaków i nie więcej niż 256.
-   **Walidator `confirmPassword`** (`RegisterFormComponent`) jest walidatorem na poziomie całego formularza, który porównuje wartości pól `password` i `confirmPassword`. Jeśli są różne, formularz jest nieważny.

## 10. Obsługa błędów
-   **Błędy walidacji klienta:** Obsługiwane przez `ReactiveFormsModule` i wyświetlane jako komunikaty `mat-error` pod odpowiednimi polami formularza.
-   **Błędy sieciowe / serwera (np. 500):** W bloku `catchError` subskrypcji API, `error$` w `RegisterPageComponent` jest ustawiany na generyczny komunikat, np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.".
-   **Błąd `409 Conflict` (Email już istnieje):** `AuthService` powinien przechwycić ten konkretny status błędu i zwrócić go do komponentu. `RegisterPageComponent` ustawi `error$` na "Użytkownik o tym adresie e-mail już istnieje.".
-   **Błąd `400 Bad Request`:** Zazwyczaj nie powinien wystąpić przy poprawnej walidacji klienta, ale jeśli tak się stanie, `error$` zostanie ustawiony na komunikat błędu z odpowiedzi API.

## 11. Kroki implementacji
1.  **Struktura plików:**
    -   Utwórz katalog `src/app/pages/register`.
    -   Wewnątrz niego utwórz pliki dla `RegisterPageComponent`: `register-page.component.ts`, `register-page.component.html`, `register-page.component.scss`.
    -   Wewnątrz `src/app/pages/register/components` utwórz pliki dla `RegisterFormComponent`: `register-form.component.ts`, `register-form.component.html`, `register-form.component.scss`.
2.  **Routing:**
    -   W `src/app/app.routes.ts`, dodaj nową ścieżkę do `RegisterPageComponent`: `{ path: 'register', component: RegisterPageComponent }`.
3.  **Aktualizacja `AuthService`:**
    -   W `src/app/core/services/auth.service.ts`, dodaj nową metodę `register(command: OrganizerRegisterCommand): Observable<OrganizerProfileDto>`. Metoda ta powinna wykonywać żądanie `POST` do API.
    -   Upewnij się, że metoda `login` jest zaimplementowana i obsługuje logowanie na podstawie e-maila i hasła.
4.  **Implementacja `RegisterFormComponent`:**
    -   Zdefiniuj `@Input()` dla `isLoading` i `serverError` oraz `@Output()` dla `formSubmit`.
    -   Użyj `FormBuilder` do stworzenia `FormGroup` z kontrolkami i walidatorami opisanymi w sekcji 9.
    -   Zbuduj szablon HTML z użyciem komponentów Angular Material (`mat-card`, `mat-form-field`, `mat-input`, `mat-button`).
    -   Połącz formularz z szablonem za pomocą `[formGroup]` i `formControlName`.
    -   Implementuj metodę `onSubmit`, która emituje zdarzenie `formSubmit` jeśli formularz jest valid.
5.  **Implementacja `RegisterPageComponent`:**
    -   Zdefiniuj `isLoading$` i `error$` jako `BehaviorSubject`.
    -   Wstrzyknij `AuthService` i `Router`.
    -   W szablonie HTML, umieść `<app-register-form>` i przekaż mu stany `isLoading$` i `error$` przez powiązania `[isLoading]` i `[serverError]`.
    -   Implementuj metodę, która obsługuje zdarzenie `(formSubmit)`, wywołuje `authService.register`, a następnie `authService.login` w potoku RxJS (`concatMap`), obsługując błędy i nawigując w przypadku sukcesu.
6.  **Aktualizacja widoku logowania:**
    -   W `src/app/pages/login/login.component.html`, dodaj przycisk lub link (`<a routerLink="/register">Zarejestruj się</a>`) nawigujący do nowo utworzonego widoku.
7.  **Stylowanie i testowanie:**
    -   Dodaj podstawowe style w plikach `.scss`, aby formularz był wyśrodkowany i czytelny.
    -   Przetestuj ręcznie wszystkie ścieżki użytkownika: pomyślną rejestrację, błędy walidacji, próbę rejestracji z istniejącym e-mailem.
