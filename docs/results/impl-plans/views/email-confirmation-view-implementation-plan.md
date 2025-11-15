# Plan implementacji widoku Potwierdzenia E-mail

## 1. Przegląd

Widok Potwierdzenia E-mail jest kluczowym elementem procesu rejestracji nowego użytkownika (Organizatora). Jego celem jest obsługa powrotu użytkownika do aplikacji po kliknięciu w unikalny link aktywacyjny wysłany na jego adres e-mail. Widok ten musi w sposób jasny i jednoznaczny poinformować użytkownika o wyniku procesu weryfikacji – sukcesie lub porażce – i wskazać mu kolejne kroki.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką, która musi zostać skonfigurowana jako docelowy adres URL dla linków potwierdzających w panelu Supabase.

-   **Ścieżka:** `/auth/confirm-email`

## 3. Struktura komponentów

Struktura tego widoku jest bardzo prosta i opiera się na jednym, inteligentnym komponencie strony, który zarządza całą logiką i renderuje odpowiedni stan.

```
/auth/confirm-email (EmailConfirmationPageComponent)
|
+-- (stan: ładowanie)
|   |
|   +-- <mat-spinner>
|
+-- (stan: sukces)
|   |
|   +-- <mat-card>
|       |
|       +-- Tytuł i komunikat o sukcesie
|       +-- Przycisk <button mat-flat-button> "Przejdź do logowania"
|
+-- (stan: błąd)
    |
    +-- <mat-card>
        |
        +-- Tytuł i komunikat o błędzie
        +-- Przycisk <button mat-stroked-button> "Wyślij nowy link aktywacyjny"
```

## 4. Szczegóły komponentów

### `EmailConfirmationPageComponent`

-   **Opis komponentu:** Jest to routowalny, samodzielny komponent typu "smart", odpowiedzialny za obsługę logiki weryfikacji tokenu z Supabase. Na podstawie wyniku tej operacji, komponent renderuje jeden z trzech stanów: ładowanie, sukces lub błąd.
-   **Główne elementy:**
    -   `mat-card` do opakowania treści.
    -   `mat-spinner` do wizualizacji stanu ładowania.
    -   `mat-button` (w dwóch wariantach: `mat-flat-button` i `mat-stroked-button`) do obsługi akcji użytkownika.
-   **Obsługiwane zdarzenia:**
    -   `ngOnInit`: Inicjuje proces weryfikacji tokenu poprzez wywołanie odpowiedniej metody w `AuthService`.
    -   `goToLogin()`: Obsługuje kliknięcie przycisku "Przejdź do logowania", nawigując użytkownika do strony `/login`.
    -   `resendConfirmationLink()`: Obsługuje kliknięcie przycisku "Wyślij nowy link aktywacyjny", nawigując użytkownika do strony, gdzie może on ponownie poprosić o link (np. `/auth/resend-confirmation`).
-   **Warunki walidacji:** Komponent nie zawiera pól formularza i nie wymaga walidacji po stronie klienta. Logika opiera się wyłącznie na wyniku operacji przeprowadzonej przez Supabase.
-   **Typy:** Komponent będzie zarządzał swoim stanem za pomocą sygnału: `state = signal<'loading' | 'success' | 'error'>('loading')`.
-   **Propsy:** Komponent nie przyjmuje żadnych właściwości wejściowych (`@Input`).

## 5. Typy

Dla implementacji tego widoku nie są wymagane żadne nowe, niestandardowe typy DTO ani ViewModel. Komponent operuje na prostym typie unii (`'loading' | 'success' | 'error'`) do zarządzania swoim stanem wewnętrznym.

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w obrębie komponentu `EmailConfirmationPageComponent` przy użyciu Angular Signals, zgodnie z najlepszymi praktykami.

-   **Zmienna stanu:**
    -   `state = signal<'loading' | 'success' | 'error'>('loading');`
-   **Opis:** Sygnał `state` będzie przechowywał aktualny stan widoku. Jego wartość początkowa to `'loading'`. Po zakończeniu operacji weryfikacji, jego wartość zostanie zaktualizowana na `'success'` lub `'error'`. Ta zmiana automatycznie wywoła odpowiedni blok w szablonie komponentu, renderując właściwy interfejs dzięki zastosowaniu składni `@switch`.

## 7. Integracja API

Integracja w tym przypadku jest nietypowa, ponieważ nie polega na bezpośrednim wywołaniu endpointu API przez frontend w celu potwierdzenia e-maila. Cały proces jest obsługiwany przez Supabase.

1.  **Inicjacja:** Użytkownik klika w link w mailu, który prowadzi go na adres `/auth/confirm-email`. URL zawiera specjalny fragment hasha (np. `#access_token=...`), który jest generowany przez Supabase.
2.  **Obsługa w aplikacji:**
    -   Biblioteka kliencka Supabase (`@supabase/supabase-js`) automatycznie wykrywa ten fragment w URL-u.
    -   W komponencie, w cyklu życia `ngOnInit`, wywołana zostanie metoda z serwisu `AuthService`, np. `authService.handleEmailConfirmation()`.
    -   Metoda w serwisie będzie nasłuchiwać na zdarzenie `onAuthStateChange` od klienta Supabase.
    -   Jeśli token jest poprawny, Supabase wyemituje zdarzenie `SIGNED_IN`. Serwis `AuthService` przechwyci to zdarzenie i zwróci pomyślne rozwiązanie (np. `Promise.resolve()`). Komponent ustawi wtedy swój stan na `'success'`.
    -   Jeśli token jest nieprawidłowy lub wygasł, zdarzenie `SIGNED_IN` nie zostanie wyemitowane. Aby obsłużyć ten przypadek, serwis zastosuje mechanizm `timeout`. Jeśli w ciągu określonego czasu (np. 5 sekund) zdarzenie nie wystąpi, `Promise` zostanie odrzucony, a komponent ustawi swój stan na `'error'`.
    -   Po pomyślnej weryfikacji i ustawieniu stanu na `'success'`, zaleca się wylogowanie użytkownika (`supabase.auth.signOut()`), aby zapewnić spójny przepływ, w którym użytkownik musi świadomie przejść do strony logowania.

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Użytkownik ląduje na widoku. Od razu widzi wskaźnik ładowania.
2.  **Wynik operacji:**
    -   **Scenariusz pomyślny:** Wskaźnik ładowania znika, pojawia się komunikat o sukcesie i przycisk "Przejdź do logowania". Użytkownik klika przycisk i zostaje przeniesiony na stronę logowania.
    -   **Scenariusz błędny:** Wskaźnik ładowania znika, pojawia się komunikat o błędzie i przycisk "Wyślij nowy link aktywacyjny". Użytkownik klika przycisk i zostaje przeniesiony na stronę, gdzie może ponownie zainicjować proces wysyłki linku.

## 9. Warunki i walidacja

Weryfikacja tokenu (jego poprawność, ważność czasowa) jest w całości realizowana po stronie serwera przez Supabase. Frontend nie implementuje żadnej logiki walidacyjnej; jego zadaniem jest jedynie odpowiednie zareagowanie na wynik tej serwerowej weryfikacji.

## 10. Obsługa błędów

-   **Główny scenariusz błędu:** Link aktywacyjny jest nieprawidłowy, został już użyty lub wygasł.
    -   **Sposób obsługi:** Jak opisano w sekcji 7, mechanizm `timeout` w `AuthService` wykryje brak pomyślnego zdarzenia `SIGNED_IN`. Komponent `EmailConfirmationPageComponent` ustawi swój stan na `'error'`, wyświetlając stosowny komunikat i dając użytkownikowi możliwość ponownego wysłania linku.
-   **Błąd sieciowy:** Brak połączenia z serwerami Supabase podczas próby weryfikacji.
    -   **Sposób obsługi:** Klient Supabase może zwrócić błąd sieciowy. Ten przypadek również powinien być przechwycony i skutkować ustawieniem stanu na `'error'`, potencjalnie z bardziej ogólnym komunikatem, np. "Wystąpił błąd. Spróbuj ponownie później."

## 11. Kroki implementacji

1.  **Utworzenie serwisu:** Stworzyć lub rozszerzyć istniejący `AuthService`, dodając metodę `handleEmailConfirmation()`, która implementuje logikę nasłuchiwania na `onAuthStateChange` z mechanizmem `timeout`, jak opisano w sekcji 7.
2.  **Utworzenie komponentu:** Wygenerować nowy, samodzielny komponent `EmailConfirmationPageComponent` za pomocą Angular CLI (`ng g c pages/auth/email-confirmation --standalone`).
3.  **Implementacja szablonu HTML:** W pliku `email-confirmation.component.html` zaimplementować strukturę z trzema blokami warunkowymi (`@switch`) dla stanów `loading`, `success` i `error`, używając komponentów Angular Material (`mat-card`, `mat-spinner`, `mat-button`).
4.  **Implementacja logiki komponentu:** W pliku `email-confirmation.component.ts`:
    -   Zdefiniować sygnał `state = signal<'loading' | 'success' | 'error'>('loading');`.
    -   Wstrzyknąć `AuthService` oraz `Router`.
    -   W `ngOnInit` wywołać asynchronicznie metodę `authService.handleEmailConfirmation()` i na podstawie jej wyniku (`.then()` / `.catch()`) zaktualizować sygnał `state`.
    -   Zaimplementować metody `goToLogin()` i `resendConfirmationLink()`, które będą nawigować do odpowiednich ścieżek.
5.  **Konfiguracja routingu:** W głównym pliku routingowym aplikacji dodać nową ścieżkę `/auth/confirm-email`, która będzie mapowana na `EmailConfirmationPageComponent`.
6.  **Stylowanie:** Dodać proste style w pliku `email-confirmation.component.scss`, aby wycentrować zawartość na stronie i zapewnić odpowiednie marginesy.
7.  **Konfiguracja Supabase:** Upewnić się, że w ustawieniach autentykacji projektu Supabase, "Site URL" oraz "Redirect URLs" są poprawnie skonfigurowane, aby wskazywały na ścieżkę `/auth/confirm-email` we wdrożonej aplikacji.
