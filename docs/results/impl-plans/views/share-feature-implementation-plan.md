# Plan implementacji widoku - Funkcja Udostępniania (Piosenki i Repertuary)

## 1. Przegląd
Celem jest wdrożenie funkcji udostępniania dla piosenek i repertuarów, zgodnie z historyjką użytkownika US-012. Użytkownik (Organizator) z poziomu listy piosenek oraz listy repertuarów będzie mógł wywołać okno modalne, które wyświetli publiczny link do zasobu oraz kod QR. Plan zakłada stworzenie jednego reużywalnego komponentu `ShareDialogComponent` oraz serwisu `ShareService` do obsługi logiki.

## 2. Routing widoku
Funkcjonalność nie wprowadza nowych, dedykowanych ścieżek routingu. Zostanie zintegrowana z istniejącymi widokami:
-   `/management/songs` (Lista Piosenek)
-   `/management/repertoires` (Lista Repertuarów)

## 3. Struktura komponentów
Nowa funkcja będzie opierać się na jednym, nowym, reużywalnym komponencie oraz modyfikacji dwóch istniejących:

```
- SongListComponent (modyfikacja)
  - [przycisk "Udostępnij"] => otwiera ShareDialogComponent

- RepertoireListComponent (modyfikacja)
  - [przycisk "Udostępnij"] => otwiera ShareDialogComponent

- ShareDialogComponent (nowy)
  - Wyświetla link publiczny
  - Wyświetla kod QR
  - [przycisk "Kopiuj"]
```

## 4. Szczegóły komponentów

### ShareDialogComponent
-   **Opis komponentu:** Reużywalne okno modalne (`mat-dialog`) do wyświetlania informacji potrzebnych do udostępnienia zasobu. Komponent jest generyczny i nie zależy od typu udostępnianego zasobu (piosenka/repertuar).
-   **Główne elementy:**
    -   `mat-dialog-title`: Tytuł okna, np. "Udostępnij piosenkę".
    -   `mat-dialog-content`:
        -   Element `<a>` wyświetlający publiczny link (`publicUrl`).
        -   `mat-icon-button` z ikoną `content_copy` do kopiowania linku.
        -   Komponent `qrcode` (`angularx-qrcode`) do wyrenderowania kodu QR na podstawie `qrPayload`.
    -   `mat-dialog-actions`: Przycisk "Zamknij" do zamknięcia okna.
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "Kopiuj" powoduje skopiowanie `publicUrl` do schowka.
    -   Kliknięcie przycisku "Zamknij" zamyka dialog.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `ShareDialogData` (ViewModel).
-   **Propsy (interfejs `data` w MatDialog):**
    -   `data: ShareDialogData`

### SongListComponent (modyfikacja)
-   **Opis komponentu:** Istniejący komponent zostanie zmodyfikowany, aby dodać przycisk udostępniania do każdej piosenki na liście.
-   **Główne elementy (dodawane):**
    -   W tabeli (`mat-table`) lub na karcie (`mat-card`) dla każdego utworu zostanie dodany `mat-icon-button` z ikoną `share`.
-   **Obsługiwane interakcje (dodawane):**
    -   Kliknięcie przycisku "Udostępnij" wywołuje metodę w komponencie, która:
        1.  Wywołuje `ShareService.getSongShareMeta(songId)`.
        2.  Po otrzymaniu danych, otwiera `ShareDialogComponent`, przekazując zmapowane dane.
-   **Typy:** `SongShareMetaDto`.

### RepertoireListComponent (modyfikacja)
-   **Opis komponentu:** Analogiczne modyfikacje jak w `SongListComponent`, ale dla repertuarów.
-   **Główne elementy (dodawane):**
    -   `mat-icon-button` z ikoną `share` dla każdego repertuaru.
-   **Obsługiwane interakcje (dodawane):**
    -   Kliknięcie przycisku "Udostępnij" wywołuje `ShareService.getRepertoireShareMeta(repertoireId)` i otwiera `ShareDialogComponent`.
-   **Typy:** `RepertoireShareMetaDto`.

## 5. Typy

### DTO (zgodne z `packages/contracts/types.ts`)
-   `SongShareMetaDto`:
    ```typescript
    export type SongShareMetaDto = {
        id: string;
        publicId: string;
        publicUrl: string;
        qrPayload: string;
    };
    ```
-   `RepertoireShareMetaDto`:
    ```typescript
    export type RepertoireShareMetaDto = {
        id: string;
        publicId: string;
        publicUrl: string;
        qrPayload: string;
    };
    ```

### ViewModel (nowy)
-   `ShareDialogData`: Interfejs definiujący dane wejściowe dla `ShareDialogComponent`. Ujednolica dane z różnych DTO.
    ```typescript
    export interface ShareDialogData {
      title: string; // np. "Udostępnij piosenkę 'Tytuł Piosenki'"
      publicUrl: string;
      qrPayload: string;
    }
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie lokalne wewnątrz komponentów list (`SongListComponent`, `RepertoireListComponent`).
-   Każdy komponent będzie zarządzał stanem ładowania (`isLoading: boolean`) na czas pobierania metadanych do udostępnienia. Stan ten będzie używany do wyświetlania wskaźnika ładowania (np. `mat-spinner`) i blokowania przycisku "Udostępnij", aby zapobiec wielokrotnym kliknięciom.
-   Nie ma potrzeby wprowadzania globalnego stanu (np. w NgRx), ponieważ proces jest krótki i w całości zamknięty w interakcji użytkownika z jednym elementem.

## 7. Integracja API
Integracja zostanie zrealizowana poprzez nowy, dedykowany serwis `ShareService`.

-   **ShareService:**
    -   Będzie zawierał dwie publiczne metody, każda zwracająca `Observable`.
    -   **Metoda 1: `getSongShareMeta(songId: string): Observable<SongShareMetaDto>`**
        -   Wykonuje żądanie `GET /share/songs/{id}`.
        -   Typ odpowiedzi: `SongShareMetaDto`.
    -   **Metoda 2: `getRepertoireShareMeta(repertoireId: string): Observable<RepertoireShareMetaDto>`**
        -   Wykonuje żądanie `GET /share/repertoires/{id}`.
        -   Typ odpowiedzi: `RepertoireShareMetaDto`.
-   Serwis będzie wstrzykiwany do `SongListComponent` i `RepertoireListComponent`.

## 8. Interakcje użytkownika
1.  **Użytkownik klika przycisk "Udostępnij"** na liście piosenek/repertuarów.
    -   Na przycisku pojawia się wskaźnik ładowania, a sam przycisk jest tymczasowo blokowany.
2.  Aplikacja wysyła żądanie do API w celu pobrania metadanych.
3.  Po otrzymaniu odpowiedzi, **otwiera się okno modalne (`ShareDialogComponent`)**.
    -   Okno wyświetla pełny link publiczny i kod QR.
4.  **Użytkownik klika przycisk "Kopiuj"** obok linku.
    -   Link zostaje skopiowany do schowka.
    -   Na ekranie pojawia się komunikat `SnackBar` z potwierdzeniem: "Link skopiowano do schowka".
5.  **Użytkownik klika "Zamknij"** lub klika poza obszarem okna.
    -   Okno modalne zamyka się.

## 9. Warunki i walidacja
-   Interfejs nie będzie przeprowadzał walidacji.
-   Przycisk "Udostępnij" będzie dostępny dla każdego elementu na liście.
-   Warunki autoryzacji (czy użytkownik ma prawo udostępnić dany zasób) są weryfikowane po stronie backendu.

## 10. Obsługa błędów
-   **Błąd API (np. 404, 500):**
    -   W przypadku błędu podczas pobierania metadanych, `ShareService` zwróci błąd w strumieniu `Observable`.
    -   Komponent (`SongListComponent` lub `RepertoireListComponent`) obsłuży błąd w subskrypcji.
    -   Użytkownikowi zostanie wyświetlony komunikat `SnackBar` o treści: "Wystąpił błąd. Nie udało się wygenerować linku."
    -   Wskaźnik ładowania zostanie ukryty, a przycisk odblokowany.
-   **Błąd kopiowania do schowka:**
    -   W mało prawdopodobnym przypadku błędu (np. brak uprawnień przeglądarki), użytkownik zobaczy komunikat w `SnackBar`: "Nie udało się skopiować linku."

## 11. Kroki implementacji
1.  **Zainstaluj bibliotekę do generowania kodów QR:**
    ```bash
    npm install angularx-qrcode
    ```
2.  **Stwórz serwis `ShareService`:**
    -   Utwórz plik `src/app/core/services/share.service.ts`.
    -   Zaimplementuj w nim metody `getSongShareMeta` i `getRepertoireShareMeta` wykorzystujące `HttpClient`.
3.  **Zdefiniuj ViewModel `ShareDialogData`:**
    -   Utwórz plik `src/app/shared/models/share-dialog.model.ts` i zdefiniuj w nim interfejs `ShareDialogData`.
4.  **Stwórz komponent `ShareDialogComponent`:**
    -   Wygeneruj nowy, samodzielny komponent: `ng g c shared/components/share-dialog --standalone`.
    -   Zaimplementuj szablon HTML z użyciem `MatDialogModule`, wyświetlający dane z `ShareDialogData`.
    -   Dodaj `QRCodeModule` do importów komponentu.
    -   Użyj `Clipboard` z `@angular/cdk/clipboard` do implementacji funkcji kopiowania.
    -   Wstrzyknij `MAT_DIALOG_DATA` w konstruktorze, aby uzyskać dostęp do danych.
5.  **Zmodyfikuj `SongListComponent`:**
    -   Dodaj do szablonu HTML przycisk `mat-icon-button` z ikoną `share` w każdej komórce/karcie piosenki.
    -   Wstrzyknij `ShareService` i `MatDialog`.
    -   Zaimplementuj metodę `onShareSong(songId: string)`, która będzie wywoływana po kliknięciu przycisku. Metoda ta powinna obsługiwać stan ładowania, wywoływać serwis, mapować `SongShareMetaDto` na `ShareDialogData` i otwierać `ShareDialogComponent`.
6.  **Zmodyfikuj `RepertoireListComponent`:**
    -   Wykonaj analogiczne kroki jak dla `SongListComponent`, dostosowując logikę do repertuarów (wywołanie `getRepertoireShareMeta`).
7.  **Dodaj obsługę informacji zwrotnej:**
    -   Wstrzyknij `MatSnackBar` w `ShareDialogComponent` (dla kopiowania) oraz w komponentach list (dla obsługi błędów API).
    -   Skonfiguruj i wywołuj `snackBar.open()` w odpowiednich miejscach.
