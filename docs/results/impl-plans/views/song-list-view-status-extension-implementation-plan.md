# Plan implementacji widoku - Rozszerzenie Listy Piosenek o Zmianę Statusu

## 1. Przegląd
Celem tego zadania jest rozszerzenie istniejącego widoku listy piosenek (`/management/songs`) o funkcjonalność umożliwiającą Organizatorowi zmianę statusu każdej piosenki z 'Szkic' na 'Opublikowana' i odwrotnie. Zmiana statusu będzie odbywać się za pomocą dedykowanego przełącznika (`mat-slide-toggle`) i będzie bezpośrednio komunikować się z API w celu aktualizacji stanu piosenki w bazie danych.

## 2. Routing widoku
Zmiany zostaną wprowadzone w istniejącym widoku, dostępnym pod ścieżką:
-   `/management/songs`

Nie ma potrzeby tworzenia nowych ścieżek.

## 3. Struktura komponentów
Hierarchia komponentów pozostaje w dużej mierze niezmieniona. Modyfikacje skupią się na komponencie odpowiedzialnym za wyświetlanie tabeli lub listy piosenek.

```
- SongListPageComponent (strona główna widoku)
  - ... (nagłówek, przycisk dodawania)
  - SongsTableComponent (komponent tabeli, w którym zostaną wprowadzone zmiany)
    - (dla każdego wiersza/piosenki)
      - ... (kolumna z tytułem)
      - Kolumna "Status" (nowa lub zmodyfikowana)
        - MatSlideToggleComponent (przełącznik do zmiany statusu)
      - ... (kolumna z akcjami: edytuj, usuń, udostępnij)
```

## 4. Szczegóły komponentów
### SongsTableComponent (Modyfikacja)
-   **Opis komponentu:** Komponent jest odpowiedzialny za wyświetlanie listy piosenek w formie tabelarycznej na urządzeniach desktopowych. Zostanie rozszerzony o nową kolumnę "Status", która pozwoli na interaktywną zmianę statusu publikacji piosenki.
-   **Główne elementy:**
    -   `mat-table`: Główny kontener tabeli.
    -   Nowa definicja kolumny `mat-header-cell` o nazwie "Status".
    -   W komórce `mat-cell` dla tej kolumny znajdzie się:
        -   `mat-slide-toggle`: Przełącznik do zmiany statusu.
        -   `mat-progress-spinner` (o małej średnicy): Wyświetlany obok przełącznika w trakcie komunikacji z API, aby zasygnalizować operację w toku.
-   **Obsługiwane zdarzenia:**
    -   `(change)` na `mat-slide-toggle`: Wywoła metodę, która zainicjuje proces zmiany statusu piosenki (publikacji lub cofnięcia publikacji).
-   **Warunki walidacji:** Brak walidacji po stronie frontendu. Logika opiera się na istniejącym stanie piosenki.
-   **Typy:**
    -   `SongListViewModel[]`: Tablica obiektów piosenek do wyświetlenia.
-   **Propsy (Inputs):**
    -   `@Input() songs: SongListViewModel[]`: Lista piosenek do wyświetlenia.
-   **Propsy (Outputs):**
    -   `@Output() statusChange = new EventEmitter<{ songId: string; newStatus: boolean }>()`: Emituje zdarzenie, gdy użytkownik próbuje zmienić status piosenki.

## 5. Typy
Aby obsłużyć stan ładowania dla każdej piosenki indywidualnie, rozszerzymy istniejący DTO o dodatkowe pole po stronie klienta.

-   **`SongSummaryDto` (z `packages/contracts/types.ts`)** - Bazowy typ danych z API.
    ```typescript
    export type SongSummaryDto = {
        id: string;
        publicId: string;
        title: string;
        publishedAt: string | null; // Kluczowe pole do określania statusu
        createdAt: string;
        updatedAt: string;
    };
    ```

-   **`SongListViewModel` (nowy typ widoku)** - Rozszerzenie `SongSummaryDto` o stan UI.
    ```typescript
    export interface SongListViewModel extends SongSummaryDto {
        isPublished: boolean; // Wygodna flaga pochodna od `publishedAt`
        isTogglingStatus: boolean; // Flaga do kontrolowania wskaźnika ładowania
    }
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem listy piosenek będzie realizowane przez dedykowany serwis `SongsStateService`, który będzie singletonem dostarczanym w komponencie `SongListPageComponent`. Serwis będzie używał sygnałów (`Signal`) do przechowywania i aktualizacji stanu w sposób reaktywny.

-   **`SongsStateService`:**
    -   **Właściwości:**
        -   `songs = signal<SongListViewModel[]>([])`: Przechowuje listę piosenek.
        -   `isLoading = signal<boolean>(false)`: Ogólny stan ładowania listy.
        -   `error = signal<string | null>(null)`: Przechowuje komunikaty o błędach.
    -   **Metody:**
        -   `fetchSongs()`: Pobiera listę piosenek z API, mapuje `SongSummaryDto` na `SongListViewModel` i aktualizuje sygnał `songs`.
        -   `toggleSongStatus(songId: string, isPublished: boolean)`:
            1.  Znajduje piosenkę o danym `songId` w sygnale `songs`.
            2.  Ustawia jej flagę `isTogglingStatus` na `true`.
            3.  Wywołuje odpowiednią metodę serwisu API (`publishSong` lub `unpublishSong`).
            4.  Po otrzymaniu odpowiedzi z API, aktualizuje piosenkę w sygnale `songs` nowymi danymi i ustawia `isTogglingStatus` na `false`.
            5.  W przypadku błędu, przywraca pierwotny stan przełącznika i ustawia komunikat o błędzie.

## 7. Integracja API
Będziemy korzystać z dwóch istniejących endpointów, które zostaną udostępnione przez nową lub istniejącą warstwę `SongsApiService`.

-   **Publikowanie piosenki:**
    -   **Endpoint:** `POST /songs/{id}/publish`
    -   **Typ żądania:** Brak (puste body)
    -   **Typ odpowiedzi:** `SongDto` - zaktualizowany obiekt piosenki z wypełnionym polem `publishedAt`.
    -   **Akcja:** Wywoływane, gdy przełącznik zmienia stan z `false` na `true`.

-   **Cofanie publikacji piosenki:**
    -   **Endpoint:** `POST /songs/{id}/unpublish`
    -   **Typ żądania:** Brak (puste body)
    -   **Typ odpowiedzi:** `SongDto` - zaktualizowany obiekt piosenki z polem `publishedAt` ustawionym na `null`.
    -   **Akcja:** Wywoływane, gdy przełącznik zmienia stan z `true` na `false`.

## 8. Interakcje użytkownika
1.  Użytkownik wchodzi na stronę `/management/songs`.
2.  Aplikacja wyświetla listę piosenek. W nowej kolumnie "Status" dla każdej piosenki widoczny jest przełącznik (`mat-slide-toggle`).
3.  Przełącznik jest w pozycji "włączony" (opublikowana), jeśli `song.publishedAt` ma wartość, i "wyłączony" (szkic) w przeciwnym razie.
4.  Użytkownik klika przełącznik, aby zmienić status piosenki.
5.  Przełącznik natychmiast staje się nieaktywny (`disabled`), a obok niego pojawia się mały wskaźnik ładowania (`mat-progress-spinner`).
6.  Aplikacja wysyła żądanie do odpowiedniego endpointu API.
7.  Po pomyślnym zakończeniu operacji, wskaźnik ładowania znika, a przełącznik staje się ponownie aktywny, odzwierciedlając nowy, zapisany stan.
8.  W przypadku błędu, wskaźnik ładowania znika, przełącznik wraca do pierwotnego stanu, a na ekranie pojawia się komunikat o błędzie (np. `mat-snackbar`).

## 9. Warunki i walidacja
-   Przełącznik statusu dla danej piosenki powinien być nieaktywny (`disabled`) podczas trwania operacji zmiany statusu (`isTogglingStatus === true`), aby zapobiec wielokrotnym kliknięciom i niespójności stanu.
-   Stan przełącznika (`checked`) jest bezpośrednio powiązany z flagą `song.isPublished` w modelu widoku.

## 10. Obsługa błędów
-   **Błąd pobierania listy piosenek:** `SongListPageComponent` powinien wyświetlić ogólny komunikat o błędzie, jeśli `SongsStateService` zgłosi problem z pobraniem danych.
-   **Błąd zmiany statusu:**
    -   Jeśli API zwróci błąd (np. 404, 500), `SongsStateService` powinien przechwycić błąd.
    -   Stan `isTogglingStatus` dla danej piosenki jest resetowany do `false`.
    -   Stan `isPublished` jest przywracany do wartości sprzed próby zmiany.
    -   Użytkownikowi wyświetlany jest komunikat za pomocą `MatSnackBar` informujący o niepowodzeniu operacji (np. "Nie udało się zaktualizować statusu piosenki").

## 11. Kroki implementacji
1.  **Aktualizacja Typów:** Zdefiniuj interfejs `SongListViewModel` w odpowiednim pliku (np. `song-list.types.ts`).
2.  **Rozbudowa Serwisu Stanu (`SongsStateService`):**
    -   Wprowadź sygnały do zarządzania stanem (`songs`, `isLoading`, `error`).
    -   Zaimplementuj metodę `fetchSongs`, która pobierze dane i zmapuje je na `SongListViewModel[]`, poprawnie ustawiając flagę `isPublished` na podstawie `publishedAt`.
    -   Zaimplementuj metodę `toggleSongStatus(songId, isPublished)`, która będzie zarządzać stanem `isTogglingStatus` i komunikować się z `SongsApiService`.
3.  **Rozbudowa Serwisu API (`SongsApiService`):**
    -   Dodaj dwie nowe metody: `publish(songId: string): Observable<SongDto>` oraz `unpublish(songId: string): Observable<SongDto>`, które będą wysyłać żądania POST do odpowiednich endpointów.
4.  **Modyfikacja Komponentu `SongListPageComponent`:**
    -   Wstrzyknij `SongsStateService`.
    -   Pobierz listę piosenek z serwisu i przekaż ją jako `Input` do `SongsTableComponent`.
    -   Podłącz metodę `toggleSongStatus` z serwisu do `Output` `statusChange` z `SongsTableComponent`.
5.  **Modyfikacja Komponentu `SongsTableComponent`:**
    -   Dodaj nową kolumnę "Status" do definicji tabeli w szablonie HTML.
    -   W komórce tej kolumny umieść `mat-slide-toggle` powiązany z właściwością `song.isPublished`.
    -   Ustaw `[disabled]="song.isTogglingStatus"` na przełączniku.
    -   Dodaj `mat-progress-spinner` z dyrektywą `@if (song.isTogglingStatus)`.
    -   Podłącz zdarzenie `(change)` przełącznika do emitera `statusChange`.
    -   Zaktualizuj `displayedColumns` o nową kolumnę.
6.  **Obsługa Błędów:** Zaimplementuj wyświetlanie komunikatów o błędach za pomocą `MatSnackBar` w `SongListPageComponent` po otrzymaniu informacji o błędzie z serwisu stanu.
