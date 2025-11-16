# Plan implementacji widoku: Okno Modalne "Konto Niepotwierdzone"

## 1. Przegląd

Celem jest implementacja okna modalnego (dialogu), które będzie informować użytkownika o próbie zalogowania się na konto, które nie zostało jeszcze aktywowane poprzez potwierdzenie adresu e-mail. Dialog zapewni użytkownikowi jasną informację o wymaganym działaniu oraz umożliwi ponowne wysłanie linku aktywacyjnego, poprawiając doświadczenie użytkownika w kluczowym momencie procesu uwierzytelniania.

## 2. Routing widoku

Komponent nie będzie posiadał własnej, dedykowanej ścieżki routingu. Będzie on komponentem dynamicznym (`mat-dialog`), wywoływanym z poziomu widoku logowania (`/login`) w odpowiedzi na specyficzny błąd API.

## 3. Struktura komponentów

Struktura jest prosta i opiera się na interakcji między istniejącym komponentem a nowym dialogiem:

```
- LoginPage
  └── LoginComponent (logika obsługi logowania)
      └── (dynamicznie otwiera) UnconfirmedAccountDialogComponent
```

-   **`LoginComponent` (modyfikacja):** Istniejący komponent strony logowania zostanie zmodyfikowany, aby przechwytywać błąd "email not confirmed" i na jego podstawie otwierać nowy dialog.
-   **`UnconfirmedAccountDialogComponent` (nowy):** Nowy, samodzielny komponent, który będzie renderowany jako okno modalne.

## 4. Szczegóły komponentów

### `UnconfirmedAccountDialogComponent` (Nowy)

-   **Opis komponentu:** Samodzielny, reużywalny komponent dialogu, zgodny ze stylistyką Angular Material. Jego zadaniem jest wyświetlenie komunikatu o nieaktywnym koncie i zaoferowanie opcji ponownego wysłania e-maila weryfikacyjnego. Będzie wstrzykiwał `MAT_DIALOG_DATA`, aby otrzymać adres e-mail, na który ma zostać wysłana wiadomość.
-   **Główne elementy:**
    -   `mat-dialog-title`: Tytuł okna, np. "Konto wymaga aktywacji".
    -   `mat-dialog-content`: Główna treść z komunikatem: "Sprawdź swoją skrzynkę e-mail, aby dokończyć rejestrację. Jeśli nie otrzymałeś wiadomości, możemy wysłać ją ponownie."
    -   `mat-dialog-actions`: Kontener na przyciski akcji.
        -   `mat-button` (Zamknij): Przycisk zamykający dialog.
        -   `mat-button` (Wyślij link ponownie): Przycisk z kolorem `primary`, który inicjuje proces ponownego wysłania linku. Będzie wyświetlał wskaźnik ładowania (`mat-progress-bar`) w trakcie operacji.
-   **Obsługiwane interakcje:**
    -   Kliknięcie "Wyślij link ponownie": Wywołuje metodę w `AuthService` w celu ponownego wysłania e-maila aktywacyjnego.
    -   Kliknięcie "Zamknij": Zamyka okno dialogowe.
-   **Obsługiwana walidacja:** Komponent nie implementuje własnej walidacji.
-   **Typy:**
    -   `UnconfirmedAccountDialogData` (dane wejściowe)
    -   `UnconfirmedAccountDialogVM` (wewnętrzny model widoku)
-   **Propsy (dane wejściowe przez `MAT_DIALOG_DATA`):**
    -   `data: UnconfirmedAccountDialogData`

### `LoginComponent` (Modyfikacja)

-   **Opis komponentu:** Należy zmodyfikować logikę obsługi formularza logowania.
-   **Główne elementy:** Bez zmian w szablonie HTML.
-   **Obsługiwane interakcje:** W metodzie odpowiedzialnej za logowanie, w bloku obsługi błędu, zostanie dodana logika sprawdzająca typ błędu zwróconego z `AuthService`.
-   **Obsługiwana walidacja:** Bez zmian.
-   **Typy:** `MatDialog` (serwis do otwierania dialogów).

## 5. Typy

W celu zapewnienia bezpieczeństwa typów, zdefiniowane zostaną następujące interfejsy:

```typescript
// Plik: src/app/pages/login/components/unconfirmed-account-dialog/unconfirmed-account-dialog.types.ts

/**
 * Definiuje strukturę danych przekazywanych do UnconfirmedAccountDialogComponent.
 */
export interface UnconfirmedAccountDialogData {
  email: string;
}

/**
 * Wewnętrzny model widoku (ViewModel) dla komponentu dialogu.
 * Wykorzystuje sygnały do zarządzania stanem.
 */
export interface UnconfirmedAccountDialogVM {
  isResending: Signal<boolean>;
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w obrębie komponentu `UnconfirmedAccountDialogComponent` przy użyciu sygnałów (`Signals`), zgodnie z najnowszymi standardami Angulara.

-   **`isResending = signal(false)`**: `WritableSignal<boolean>` będzie przechowywać stan operacji ponownego wysyłania linku.
    -   **Cel**: Sterowanie stanem interfejsu użytkownika – dezaktywacja przycisku "Wyślij link ponownie" i wyświetlanie paska postępu, gdy operacja jest w toku.
    -   **Użycie**: Wartość sygnału będzie ustawiana na `true` przed wywołaniem API i na `false` po jego zakończeniu (zarówno w przypadku sukcesu, jak i błędu).

## 7. Integracja API

Integracja z API będzie dwuetapowa i zostanie w całości obsłużona przez `AuthService`.

1.  **Logowanie (w `LoginComponent`)**:
    -   Komponent wywołuje `authService.signInWithPassword(email, password)`.
    -   Serwis musi być w stanie rozróżnić błąd `AuthApiError` z komunikatem `"Email not confirmed"` od innych błędów logowania.
    -   **Rekomendacja**: `AuthService` powinien opakowywać błędy Supabase we własne, zdefiniowane typy, np. `LoginError` z polem `reason: 'EMAIL_NOT_CONFIRMED' | 'INVALID_CREDENTIALS'`.

2.  **Ponowne wysłanie linku (w `UnconfirmedAccountDialogComponent`)**:
    -   Komponent wywołuje `authService.resendConfirmation(email)`.
    -   **Typ żądania**: `ResendConfirmationCommand` (`{ email: string; }`).
    -   **Typ odpowiedzi**: `void` w przypadku sukcesu lub błąd w przypadku niepowodzenia.
    -   Komponent będzie zarządzał stanem `isResending` na podstawie cyklu życia tego wywołania.

## 8. Interakcje użytkownika

-   **Użytkownik próbuje się zalogować na nieaktywne konto:**
    1.  `LoginComponent` wysyła żądanie logowania.
    2.  Otrzymuje błąd oznaczający niepotwierdzony e-mail.
    3.  Otwiera `UnconfirmedAccountDialogComponent`, przekazując e-mail użytkownika.
-   **Użytkownik klika "Wyślij link ponownie":**
    1.  Sygnał `isResending` ustawiany jest na `true`.
    2.  Przycisk zostaje zablokowany, pojawia się `mat-progress-bar`.
    3.  Wywoływana jest metoda `authService.resendConfirmation()`.
    4.  Po zakończeniu operacji, sygnał `isResending` jest ustawiany na `false`.
    5.  Wyświetlany jest `MatSnackBar` z informacją o sukcesie lub porażce.
    6.  W przypadku sukcesu, dialog jest automatycznie zamykany.
-   **Użytkownik klika "Zamknij":**
    1.  Dialog jest zamykany bez żadnej dodatkowej akcji.

## 9. Warunki i walidacja

Jedynym warunkiem jest walidacja błędu po stronie `LoginComponent`:

-   **Warunek**: Błąd zwrócony przez `authService.signInWithPassword` musi być instancją `AuthApiError` (z biblioteki Supabase) a jego właściwość `message` musi być równa `"Email not confirmed"`.
-   **Komponent**: `LoginComponent`.
-   **Wpływ na interfejs**: Jeśli warunek jest spełniony, standardowa obsługa błędów logowania (np. wyświetlenie komunikatu "Błędne dane") jest pomijana na rzecz otwarcia modala. W przeciwnym wypadku, aplikacja działa jak dotychczas.

## 10. Obsługa błędów

-   **Błąd podczas ponownego wysyłania linku:**
    -   Jeśli `authService.resendConfirmation()` zwróci błąd (np. z powodu problemów z siecią, błędu serwera lub przekroczenia limitu wysyłek), komponent `UnconfirmedAccountDialogComponent` przechwyci go.
    -   Stan `isResending` zostanie zresetowany do `false`.
    -   Użytkownikowi zostanie wyświetlony komunikat błędu za pomocą `MatSnackBar`, np. "Wystąpił błąd. Nie udało się wysłać linku."
-   **Niespodziewany błąd logowania:**
    -   Jeśli `LoginComponent` otrzyma błąd w nieoczekiwanym formacie, logika sprawdzająca warunek nie zadziała. W takim przypadku kluczowe jest, aby domyślna ścieżka (`else`) obsługiwała błąd, wyświetlając generyczny komunikat o niepowodzeniu logowania.

## 11. Kroki implementacji

1.  **Utworzenie plików komponentu:**
    -   Za pomocą Angular CLI wygenerować nowy, samodzielny komponent:
        `ng g c pages/login/components/unconfirmed-account-dialog --standalone`
    -   Utworzyć plik `unconfirmed-account-dialog.types.ts` w tym samym katalogu.
2.  **Zdefiniowanie typów:**
    -   W pliku `unconfirmed-account-dialog.types.ts` zaimplementować interfejsy `UnconfirmedAccountDialogData` oraz `UnconfirmedAccountDialogVM`.
3.  **Implementacja szablonu dialogu:**
    -   W `unconfirmed-account-dialog.component.html` dodać strukturę HTML z użyciem komponentów Angular Material (`mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`, `mat-button`, `mat-progress-bar`).
    -   Powiązać widoczność `mat-progress-bar` i atrybut `disabled` przycisku z sygnałem `isResending()`.
4.  **Implementacja logiki dialogu:**
    -   W `unconfirmed-account-dialog.component.ts` wstrzyknąć zależności: `MatDialogRef`, `MAT_DIALOG_DATA`, `AuthService`, `MatSnackBar`.
    -   Zainicjować sygnał `isResending = signal(false)`.
    -   Zaimplementować metodę `onResendClick()`, która będzie zarządzać stanem `isResending` i wywoływać `authService.resendConfirmation()`, przekazując e-mail z `MAT_DIALOG_DATA`.
    -   Dodać obsługę sukcesu (snackbar, zamknięcie dialogu) i błędu (snackbar) dla powyższej metody.
5.  **Modyfikacja `AuthService`:**
    -   Upewnić się, że metoda `signInWithPassword` poprawnie propaguje błędy z klienta Supabase.
    -   Dodać nową metodę `resendConfirmation(email: string)` opakowującą odpowiednią funkcję z klienta Supabase.
6.  **Modyfikacja `LoginComponent`:**
    -   Wstrzyknąć serwis `MatDialog`.
    -   W metodzie obsługującej logowanie, w bloku `catchError` (lub `.subscribe({ error: ... })`), dodać logikę warunkową sprawdzającą typ i treść błędu.
    -   Jeśli warunek zostanie spełniony, wywołać `dialog.open(UnconfirmedAccountDialogComponent, { data: { email: this.form.value.email } })`.
7.  **Stylowanie i testowanie:**
    -   Dodać minimalne style w `unconfirmed-account-dialog.component.scss`, aby zapewnić odpowiednie marginesy i wygląd.
    -   Ręcznie przetestować całą ścieżkę: próba logowania na nieaktywne konto, działanie przycisków w dialogu, obsługa błędów i sukcesu.
