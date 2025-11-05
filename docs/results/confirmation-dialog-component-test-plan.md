# Plan Implementacji Testów Jednostkowych dla ConfirmationDialogComponent

## 1. Przegląd komponentu

`ConfirmationDialogComponent` to współdzielony, generyczny komponent UI służący do wyświetlania modalnego okna dialogowego z prośbą o potwierdzenie akcji przez użytkownika. Komponent przyjmuje tytuł, treść wiadomości oraz opcjonalne teksty dla przycisków potwierdzenia i anulowania. Zwraca wartość `true` w przypadku potwierdzenia lub `false` w przypadku anulowania.

## 2. Zakres testowania

Testy jednostkowe/integracyjne dla tego komponentu zweryfikują następujące funkcjonalności:

-   **Poprawne renderowanie:** Sprawdzenie, czy komponent prawidłowo wyświetla dane wejściowe (tytuł, wiadomość).
-   **Domyślne wartości:** Weryfikacja, czy przyciski mają domyślne etykiety ("Potwierdź", "Anuluj"), gdy nie zostaną one nadpisane.
-   **Niestandardowe wartości:** Weryfikacja, czy przyciski wyświetlają niestandardowe etykiety przekazane w danych.
-   **Interakcje użytkownika:** Sprawdzenie, czy kliknięcie odpowiednich przycisków zamyka dialog z poprawną wartością (`true` dla potwierdzenia, `false` dla anulowania).
-   **Renderowanie HTML:** Potwierdzenie, że treść wiadomości jest poprawnie renderowana jako HTML (ze względu na użycie `[innerHTML]`).

## 3. Struktura testów

Plik testowy `confirmation-dialog.component.spec.ts` zostanie umieszczony w tym samym katalogu co pliki komponentu. Struktura testów będzie oparta na zagnieżdżonych blokach `describe` w celu logicznego pogrupowania przypadków testowych:

```typescript
describe('ConfirmationDialogComponent', () => {
  // Konfiguracja beforeEach

  describe('Renderowanie', () => {
    // Testy dotyczące wyświetlania danych
  });

  describe('Interakcje użytkownika', () => {
    // Testy dotyczące kliknięć przycisków
  });
});
```

## 4. Szczegółowe przypadki testowe

Poniżej znajduje się lista szczegółowych przypadków testowych do zaimplementowania. Testy będą pisane zgodnie z podejściem `@testing-library/angular`, koncentrując się na zachowaniu z perspektywy użytkownika.

---

### Grupa: Renderowanie

#### **Test 1: Powinien poprawnie wyświetlić tytuł i treść wiadomości**

-   **Nazwa testu:** `should display the title and message provided in the data`
-   **Opis:** Test sprawdza, czy po wyrenderowaniu komponentu, na ekranie widoczny jest tytuł oraz treść wiadomości przekazana w obiekcie `MAT_DIALOG_DATA`.
-   **Kroki do wykonania:**
    1.  Zdefiniuj mockowe dane wejściowe z `title` i `message`.
    2.  Wyrenderuj komponent, dostarczając mockowe dane.
    3.  Użyj selektorów `@testing-library` (`screen.getByRole`, `screen.getByText`), aby sprawdzić obecność tytułu i treści w DOM.
-   **Oczekiwany rezultat:** Tytuł (jako `heading`) i treść wiadomości są widoczne na ekranie.
-   **Uwagi:** Należy pamiętać, że tytuł będzie w elemencie z rolą `heading`, a wiadomość wewnątrz `mat-dialog-content`.

#### **Test 2: Powinien wyświetlić domyślne etykiety przycisków, gdy nie są podane**

-   **Nazwa testu:** `should display default button labels when not provided`
-   **Opis:** Test weryfikuje, czy przyciski akcji mają domyślne etykiety "Potwierdź" i "Anuluj", jeśli `confirmButtonText` i `cancelButtonText` nie zostaną zdefiniowane w danych wejściowych.
-   **Kroki do wykonania:**
    1.  Zdefiniuj mockowe dane wejściowe zawierające tylko `title` i `message`.
    2.  Wyrenderuj komponent.
    3.  Sprawdź obecność przycisku z etykietą "Potwierdź" (`getByRole('button', { name: /potwierdź/i })`).
    4.  Sprawdź obecność przycisku z etykietą "Anuluj" (`getByRole('button', { name: /anuluj/i })`).
-   **Oczekiwany rezultat:** Oba przyciski są widoczne z domyślnymi etykietami.

#### **Test 3: Powinien wyświetlić niestandardowe etykiety przycisków, gdy są podane**

-   **Nazwa testu:** `should display custom button labels when provided`
-   **Opis:** Test sprawdza, czy komponent poprawnie nadpisuje domyślne etykiety przycisków, gdy zostaną one przekazane w danych wejściowych.
-   **Kroki do wykonania:**
    1.  Zdefiniuj mockowe dane wejściowe zawierające `title`, `message` oraz niestandardowe `confirmButtonText` (np. "Tak, usuń") i `cancelButtonText` (np. "Nie, wróć").
    2.  Wyrenderuj komponent.
    3.  Sprawdź, czy przyciski mają niestandardowe etykiety.
-   **Oczekiwany rezultat:** Przyciski są widoczne z etykietami "Tak, usuń" i "Nie, wróć".

#### **Test 4: Powinien poprawnie renderować treść wiadomości jako HTML**

-   **Nazwa testu:** `should correctly render message content as HTML`
-   **Opis:** Ze względu na użycie `[innerHTML]`, ten test weryfikuje, czy tagi HTML przekazane w `message` są poprawnie interpretowane przez przeglądarkę.
-   **Kroki do wykonania:**
    1.  Zdefiniuj mockowe dane, gdzie `message` zawiera proste tagi HTML, np. `To jest <strong>ważna</strong> wiadomość.`.
    2.  Wyrenderuj komponent.
    3.  Sprawdź, czy wewnątrz `mat-dialog-content` znajduje się element `strong` z tekstem "ważna".
-   **Oczekiwany rezultat:** Treść wiadomości jest sformatowana zgodnie z przekazanymi tagami HTML.

---

### Grupa: Interakcje użytkownika

#### **Test 5: Powinien zamknąć dialog z wynikiem `true` po kliknięciu przycisku potwierdzenia**

-   **Nazwa testu:** `should close the dialog with 'true' when the confirm button is clicked`
-   **Opis:** Test weryfikuje, czy interakcja użytkownika polegająca na kliknięciu przycisku potwierdzającego powoduje zamknięcie dialogu z wartością `true`.
-   **Kroki do wykonania:**
    1.  Wyrenderuj komponent z podstawowymi danymi.
    2.  Stwórz szpiega (`spyOn`) na metodzie `close` mockowego `MatDialogRef`.
    3.  Znajdź przycisk potwierdzenia (np. po domyślnej etykiecie "Potwierdź").
    4.  Zasymuluj kliknięcie przycisku za pomocą `userEvent.click()`.
    5.  Sprawdź, czy metoda `dialogRef.close` została wywołana dokładnie jeden raz z argumentem `true`.
-   **Oczekiwany rezultat:** `mockDialogRef.close` zostało wywołane z `true`.

#### **Test 6: Powinien zamknąć dialog z wynikiem `false` po kliknięciu przycisku anulowania**

-   **Nazwa testu:** `should close the dialog with 'false' when the cancel button is clicked`
-   **Opis:** Test weryfikuje, czy kliknięcie przycisku anulującego powoduje zamknięcie dialogu z wartością `false`.
-   **Kroki do wykonania:**
    1.  Wyrenderuj komponent z podstawowymi danymi.
    2.  Stwórz szpiega (`spyOn`) na metodzie `close` mockowego `MatDialogRef`.
    3.  Znajdź przycisk anulowania (np. po etykiecie "Anuluj").
    4.  Zasymuluj kliknięcie przycisku.
    5.  Sprawdź, czy metoda `dialogRef.close` została wywołana dokładnie jeden raz z argumentem `false`.
-   **Oczekiwany rezultat:** `mockDialogRef.close` zostało wywołane z `false`.

## 5. Wymagane mocki i stuby

Do przeprowadzenia testów potrzebne będą następujące mocki, które zostaną dostarczone przez `TestBed` (lub odpowiednik w `@testing-library/angular`):

1.  **`MatDialogRef`**:
    -   Należy stworzyć mock obiektu `MatDialogRef`.
    -   Kluczowe jest dostarczenie mockowej implementacji metody `close()`, aby można było na niej ustawić szpiega (`spyOn`) i weryfikować, z jakimi argumentami jest wywoływana.
    -   Przykład: `const mockDialogRef = { close: vi.fn() };`

2.  **`MAT_DIALOG_DATA`**:
    -   Należy dostarczyć mock obiektu `ConfirmationDialogData` dla każdego testu lub grupy testów, aby symulować różne scenariusze (z domyślnymi i niestandardowymi danymi).
    -   Przykład: `{ provide: MAT_DIALOG_DATA, useValue: { title: 'Test', message: 'Test message' } }`

## 6. Konfiguracja testów

Dla tego komponentu nie jest wymagana żadna specyficzna, zaawansowana konfiguracja Vitest. Należy skonfigurować środowisko testowe Angulara do pracy z Vitest, co zazwyczaj obejmuje:

-   Użycie `@angular-builders/vitest` w `angular.json`.
-   Stworzenie pliku `vitest.config.ts` z podstawową konfiguracją dla Angulara (np. z pluginem `analogjs/vitest-angular-plugin`).
-   Zapewnienie, że `jsdom` jest używane jako środowisko testowe.
-   Globalna konfiguracja `testing-library` i `user-event` w pliku `test-setup.ts`.

## 7. Kryteria akceptacji

Implementację testów dla tego komponentu można uznać za zakończoną, gdy:

-   Wszystkie 6 zdefiniowanych powyżej przypadków testowych zostało zaimplementowanych.
-   Wszystkie testy przechodzą pomyślnie po uruchomieniu komendy `npm test`.
-   Pokrycie kodu (code coverage) dla pliku `confirmation-dialog.component.ts` wynosi co najmniej 90% dla linii, funkcji i instrukcji.
-   Testy są w pełni zgodne z zasadami `@testing-library`, tzn. nie odwołują się do wewnętrznych metod komponentu ani jego stanu, a jedynie do tego, co jest widoczne w DOM i jakie akcje może wykonać użytkownik.
