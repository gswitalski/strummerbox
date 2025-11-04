# Plan implementacji rozszerzenia widoku: Lista Repertuarów - Usuwanie

## 1. Przegląd

Niniejszy dokument opisuje plan wdrożenia funkcjonalności usuwania repertuaru w istniejącym widoku listy repertuarów (`Repertoire List View`). Celem jest umożliwienie zalogowanemu użytkownikowi (Organizatorowi) trwałego usunięcia wybranego repertuaru po uprzednim potwierdzeniu tej akcji w oknie modalnym. Implementacja będzie zgodna z aktualnymi standardami projektu, włączając w to wykorzystanie reużywalnych komponentów i zarządzanie stanem za pomocą sygnałów.

## 2. Routing widoku

Funkcjonalność zostanie dodana do istniejącego widoku, więc routing pozostaje bez zmian.

-   **Ścieżka:** `/management/repertoires`

## 3. Struktura komponentów

Struktura komponentów zostanie rozszerzona o interakcję z reużywalnym komponentem `ConfirmationDialogComponent`.

```
/management/repertoires
└── RepertoireListPageComponent
    └── RepertoireListComponent (Modyfikacja)
        ├── Tabela/Lista (`mat-table` / `mat-card`)
        │   └── Wiersz/Karta repertuaru (*ngFor)
        │       ├── ... (istniejące kolumny/dane)
        │       └── Kolumna akcji
        │           ├── ... (istniejące przyciski)
        │           └── MatIconButton (nowy przycisk "Usuń")
        └── (Wywoływany) MatDialog
            └── ConfirmationDialogComponent (Reużywalny)
```

## 4. Szczegóły komponentów

### `RepertoireListComponent` (Modyfikacja)

-   **Opis komponentu:** Komponent odpowiedzialny za wyświetlanie listy repertuarów użytkownika. Zostanie rozszerzony o logikę obsługi akcji usuwania. Do każdego wiersza na liście zostanie dodany przycisk "Usuń". Kliknięcie przycisku otworzy modal z prośbą o potwierdzenie, a po zatwierdzeniu wywoła odpowiednią metodę serwisu API.
-   **Główne elementy:**
    -   `mat-table` lub kontener z `mat-card`: Wewnątrz pętli renderującej listę.
    -   `mat-icon-button`: Nowy przycisk z ikoną `delete` w kolumnie/sekcji akcji dla każdego repertuaru.
    -   `mat-spinner`: Wyświetlany w miejscu przycisku "Usuń" dla wiersza, którego repertuar jest aktualnie usuwany.
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "Usuń": Otwiera `ConfirmationDialogComponent`.
    -   Potwierdzenie w dialogu: Uruchamia proces usuwania.
    -   Anulowanie w dialogu: Zamyka dialog bez podejmowania akcji.
-   **Typy:**
    -   `RepertoireSummaryDto`: Typ danych dla każdego elementu na liście.
    -   `RepertoireDeleteResponseDto`: Oczekiwany typ odpowiedzi z API po pomyślnym usunięciu.
-   **Propsy (Inputs):**
    -   `repertoires: Signal<RepertoireSummaryDto[]>`: Sygnał z listą repertuarów do wyświetlenia.

### `ConfirmationDialogComponent` (Reużywalny)

-   **Opis komponentu:** Generyczny komponent okna modalnego służący do potwierdzania akcji. Jest już zdefiniowany w UI Plan jako komponent reużywalny.
-   **Główne elementy:** `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions` z przyciskami "Potwierdź" i "Anuluj".
-   **Propsy (Inputs przez `MAT_DIALOG_DATA`):**
    ```typescript
    export interface ConfirmationDialogData {
      title: string;
      message: string;
      confirmButtonText?: string;
      cancelButtonText?: string;
    }
    ```
-   **Zwracana wartość:** `MatDialogRef.afterClosed()` zwraca `true`, jeśli użytkownik potwierdził akcję.

## 5. Typy

Większość typów już istnieje w projekcie. Nie ma potrzeby tworzenia nowych, złożonych modeli widoku (ViewModel).

-   **`RepertoireSummaryDto`**: Używany do wyświetlania danych na liście.
-   **`RepertoireDeleteResponseDto`**: Oczekiwany typ odpowiedzi z serwisu API po usunięciu.
    ```typescript
    // packages/contracts/types.ts
    export type RepertoireDeleteResponseDto = {
      id: string; // ID usuniętego repertuaru
      deleted: true;
    };
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane w dedykowanym serwisie (np. `RepertoireStateService`) przy użyciu sygnałów (Angular Signals), zgodnie z przyjętymi standardami.

-   **Sygnały stanu:**
    -   `repertoires = signal<RepertoireSummaryDto[]>([]):` Przechowuje aktualną listę repertuarów.
    -   `deletingRepertoireId = signal<string | null>(null):` Przechowuje ID repertuaru, który jest w trakcie usuwania. Pozwala to na wyświetlenie wskaźnika ładowania tylko dla konkretnego wiersza, bez blokowania całego interfejsu.
-   **Metody w serwisie stanu:**
    -   `deleteRepertoire(id: string): void`:
        1.  Ustawia `deletingRepertoireId.set(id)`.
        2.  Wywołuje metodę `delete()` z serwisu API.
        3.  Po pomyślnym usunięciu, aktualizuje sygnał `repertoires`, usuwając z niego element o danym ID (`repertoires.update(...)`).
        4.  W przypadku błędu, obsługuje go (np. przez serwis notyfikacji).
        5.  W bloku `finally` resetuje `deletingRepertoireId.set(null)`.

## 7. Integracja API

Integracja z backendem będzie polegać na wywołaniu zdefiniowanego endpointu `DELETE /repertoires/{id}`.

-   **Serwis API (`RepertoireApiService`):** Należy dodać lub zweryfikować istnienie metody `delete`.
    ```typescript
    // Przykład implementacji w RepertoireApiService
    import { RepertoireDeleteResponseDto } from '@contracts/types';

    delete(id: string): Observable<RepertoireDeleteResponseDto> {
      return this.http.delete<RepertoireDeleteResponseDto>(`/api/repertoires/${id}`);
    }
    ```
-   **Typ żądania:** Brak ciała (body).
-   **Typ odpowiedzi (sukces):** `RepertoireDeleteResponseDto`.

## 8. Interakcje użytkownika

1.  **Kliknięcie przycisku "Usuń"**: Użytkownik klika ikonę usuwania przy wybranym repertuarze.
2.  **Wyświetlenie dialogu**: Aplikacja otwiera modal `ConfirmationDialogComponent` z tekstem: `"Czy na pewno chcesz usunąć repertuar '[Nazwa Repertuaru]'? Tej operacji nie można cofnąć."`.
3.  **Anulowanie**: Użytkownik klika "Anuluj". Dialog zamyka się, stan aplikacji pozostaje bez zmian.
4.  **Potwierdzenie**: Użytkownik klika "Potwierdź".
    -   Dialog zamyka się.
    -   Przycisk "Usuń" w danym wierszu zostaje zastąpiony przez komponent `mat-spinner`.
    -   Wysyłane jest żądanie `DELETE` do API.
    -   Po otrzymaniu pomyślnej odpowiedzi, wiersz z repertuarem jest usuwany z listy, a użytkownik otrzymuje powiadomienie "toast" o sukcesie.
    -   W przypadku błędu, `mat-spinner` znika, pojawia się ponownie przycisk "Usuń", a użytkownik widzi powiadomienie o błędzie.

## 9. Warunki i walidacja

Walidacja odbywa się głównie po stronie serwera. Frontend musi jedynie zapewnić, że przekazywane ID pochodzi z obiektu pobranego wcześniej z API.

-   **Warunek:** Użytkownik musi być zalogowany. (Zapewnione przez `AuthGuard` na całej trasie `/management`).
-   **Warunek:** ID repertuaru musi być prawidłowym UUID. (Zapewnione przez pobranie danych z serwera).

## 10. Obsługa błędów

-   **Błąd sieci / 5xx**: W przypadku problemów z połączeniem lub błędu serwera, serwis API powinien przechwycić błąd. Użytkownikowi należy wyświetlić generyczne powiadomienie "toast" (np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."). Stan ładowania dla danego wiersza musi zostać zresetowany.
-   **Błąd 404 (Not Found)**: Może wystąpić, jeśli repertuar został już usunięty (np. w innej karcie przeglądarki). Należy usunąć element z lokalnej listy i wyświetlić informację, np. "Ten repertuar został już usunięty".
-   **Błąd 401/403 (Unauthorized/Forbidden)**: Obsługiwany globalnie przez `HttpInterceptor`, który powinien wylogować użytkownika i przekierować go na stronę logowania.

## 11. Kroki implementacji

1.  **Aktualizacja serwisu API**: W `RepertoireApiService` dodać metodę `delete(id: string)` wysyłającą żądanie `DELETE /api/repertoires/{id}` i zwracającą `Observable<RepertoireDeleteResponseDto>`.
2.  **Aktualizacja serwisu stanu**: W `RepertoireStateService` (lub analogicznym) dodać sygnał `deletingRepertoireId = signal<string | null>(null)` oraz metodę `deleteRepertoire(id: string)`, która będzie zarządzać stanem ładowania i aktualizować listę repertuarów.
3.  **Modyfikacja szablonu `RepertoireListComponent`**:
    -   Dodać nową kolumnę "Akcje" w tabeli `mat-table` (jeśli jeszcze nie istnieje).
    -   W komórce tej kolumny dodać `mat-icon-button` z ikoną `delete`.
    -   Dodać logikę warunkowego wyświetlania: `@if (deletingRepertoireId() === repertoire.id) { <mat-spinner> } @else { <button>... }`.
4.  **Modyfikacja logiki `RepertoireListComponent`**:
    -   Wstrzyknąć `MatDialog` oraz serwis stanu.
    -   Utworzyć metodę `onDeleteRepertoire(repertoire: RepertoireSummaryDto)`:
        a. Metoda ta otwiera `ConfirmationDialogComponent`, przekazując w `data` dynamicznie zbudowany tytuł i komunikat.
        b. Subskrybować `dialogRef.afterClosed()`. Jeśli wynikiem jest `true`, wywołać metodę `deleteRepertoire(repertoire.id)` z serwisu stanu.
5.  **Dodanie obsługi notyfikacji**: Zintegrować z istniejącym w aplikacji serwisem do wyświetlania powiadomień "toast" w celu informowania użytkownika o sukcesie lub porażce operacji usuwania.
