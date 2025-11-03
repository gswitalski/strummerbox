# Plan implementacji widoku - Rozszerzenie Listy Piosenek o Usuwanie

## 1. Przegląd
Celem tego zadania jest rozszerzenie istniejącego widoku `Song List View` (`/management/songs`) o funkcjonalność usuwania piosenek. Użytkownik (Organizator) będzie mógł usunąć wybraną piosenkę ze swojej biblioteki po uprzednim potwierdzeniu akcji w oknie dialogowym. Dialog ten będzie zawierał dodatkowe ostrzeżenie, jeśli usuwana piosenka jest częścią jednego lub więcej repertuarów.

## 2. Routing widoku
Funkcjonalność zostanie dodana do istniejącego widoku, więc routing pozostaje bez zmian:
-   **Ścieżka:** `/management/songs`

## 3. Struktura komponentów
Struktura komponentów pozostaje w dużej mierze niezmieniona. Główne modyfikacje dotyczyć będą logiki w komponencie strony oraz dodania interakcji z nowym, reużywalnym komponentem dialogowym.

```
/src/app/pages/song-list/
├── song-list-page/
│   └── song-list-page.component.ts         // <- Główna logika, obsługa eventów, wywołanie dialogu i API
├── components/
│   └── song-list/
│       ├── song-list.component.ts          // <- Dodanie przycisku "usuń" i emitowanie zdarzenia
│       └── song-list.component.html

/src/app/shared/components/
└── confirmation-dialog/                  // <- Nowy lub istniejący reużywalny komponent
    ├── confirmation-dialog.component.ts
    └── confirmation-dialog.component.html
```

## 4. Szczegóły komponentów

### `SongListComponent` (Modyfikacja)
-   **Opis komponentu:** Komponent wyświetlający listę piosenek w formie tabeli (`mat-table`). Zostanie rozszerzony o kolumnę z akcjami, w tym przyciskiem usuwania.
-   **Główne elementy:**
    -   Dodanie nowej kolumny `actions` w `mat-table`.
    -   W komórce tej kolumny (`mat-cell`) dla każdego wiersza znajdzie się `mat-icon-button` z ikoną `delete`.
-   **Obsługiwane interakcje:**
    -   `click` na przycisku usuwania.
-   **Emitowane zdarzenia:**
    -   `deleteSongRequest: EventEmitter<{ songId: string, songTitle: string }>`: emitowane po kliknięciu ikony usuwania, przekazując ID i tytuł piosenki do komponentu nadrzędnego.
-   **Typy:** `SongSummaryDto[]` jako `Input`.
-   **Propsy:** Bez zmian (`songs: SongSummaryDto[]`).

### `SongListPageComponent` (Modyfikacja)
-   **Opis komponentu:** Komponent-kontener dla widoku listy piosenek. Będzie odpowiedzialny za całą logikę usuwania: nasłuchiwanie na zdarzenie z `SongListComponent`, pobieranie szczegółów piosenki, otwieranie dialogu potwierdzającego i wywoływanie usługi API.
-   **Główne elementy:** Logika w pliku `.ts`.
-   **Obsługiwane interakcje:**
    -   Obsługa zdarzenia `deleteSongRequest` z komponentu `SongListComponent`.
-   **Metody do implementacji:**
    -   `onDeleteSongRequest(song: { songId: string, songTitle: string })`:
        1.  Wywołuje `SongsApiService.getSongDetails(songId, true)` w celu sprawdzenia użycia piosenki.
        2.  Na podstawie odpowiedzi konstruuje wiadomość dla okna dialogowego.
        3.  Otwiera `ConfirmationDialogComponent`.
        4.  Jeśli użytkownik potwierdzi, wywołuje `deleteSong(songId)`.
    -   `deleteSong(songId: string)`:
        1.  Wywołuje `SongsApiService.deleteSong(songId)`.
        2.  Po pomyślnej odpowiedzi, aktualizuje stan (sygnał `songs`), usuwając piosenkę z listy.
        3.  Wyświetla powiadomienie `MatSnackBar` o sukcesie.
        4.  Obsługuje ewentualne błędy z API.
-   **Typy:** `signal<SongSummaryDto[]>` do przechowywania stanu listy.
-   **Propsy:** Brak.

### `ConfirmationDialogComponent` (Reużywalny)
-   **Opis komponentu:** Generyczny komponent dialogowy (`MatDialog`) do potwierdzania akcji. Wyświetla tytuł, wiadomość i dwa przyciski (potwierdź/anuluj).
-   **Główne elementy:** `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`, `mat-button`.
-   **Obsługiwane interakcje:** Kliknięcie na przycisk "Potwierdź" lub "Anuluj".
-   **Typy:** `ConfirmationDialogData` wstrzykiwane przez `MAT_DIALOG_DATA`.
-   **Propsy (przez `data`):** `title: string`, `message: string`, `confirmButtonText: string`, `cancelButtonText: string`.

## 5. Typy
-   **`SongSummaryDto` (istniejący):** Używany do wyświetlania listy piosenek.
-   **`SongDetailDto` (istniejący):** Używany do pobrania szczegółów piosenki, w tym informacji o jej wykorzystaniu w repertuarach (`repertoires?: SongUsageDto[]`).
-   **`SongDeleteResponseDto` (istniejący):** Oczekiwany typ odpowiedzi z API po usunięciu piosenki.
-   **`ConfirmationDialogData` (nowy ViewModel):**
    ```typescript
    export interface ConfirmationDialogData {
      title: string;
      message: string; // Może zawierać proste HTML do formatowania
      confirmButtonText?: string;
      cancelButtonText?: string;
    }
    ```

## 6. Zarządzanie stanem
Stan listy piosenek będzie zarządzany lokalnie w serwisie powiązanym z `SongListPageComponent` przy użyciu sygnałów (`signals`) z Angulara.
-   `songs = signal<SongSummaryDto[]>([]):` Przechowuje aktualną listę piosenek.
-   Po pomyślnym usunięciu piosenki, sygnał zostanie zaktualizowany przez odfiltrowanie usuniętego elementu, co spowoduje automatyczne odświeżenie widoku.
    ```typescript
    // W metodzie obsługującej sukces usunięcia
    this.songs.update(currentSongs => 
      currentSongs.filter(song => song.id !== deletedSongId)
    );
    ```
-   Nie ma potrzeby implementacji customowego hooka; logika będzie zawarta w komponencie strony.

## 7. Integracja API
Będą wykorzystane dwa endpointy API, dla których zostaną stworzone lub zaktualizowane metody w `SongsApiService`.

1.  **Pobranie szczegółów piosenki (w celu sprawdzenia użycia):**
    -   **Metoda:** `GET`
    -   **Ścieżka:** `/api/songs/{id}?includeUsage=true`
    -   **Typ żądania:** Brak (ID w ścieżce)
    -   **Typ odpowiedzi:** `Observable<SongDetailDto>`

2.  **Usunięcie piosenki:**
    -   **Metoda:** `DELETE`
    -   **Ścieżka:** `/api/songs/{id}`
    -   **Typ żądania:** Brak (ID w ścieżce)
    -   **Typ odpowiedzi:** `Observable<SongDeleteResponseDto>`

## 8. Interakcje użytkownika
1.  Użytkownik klika ikonę kosza przy wybranej piosence na liście.
2.  Aplikacja wysyła zapytanie w tle o szczegóły piosenki. Może pojawić się chwilowy wskaźnik ładowania przy przycisku.
3.  Pojawia się okno dialogowe z prośbą o potwierdzenie.
    -   **Scenariusz A (piosenka nieużywana):** Tytuł: "Potwierdzenie usunięcia", Treść: "Czy na pewno chcesz usunąć piosenkę 'Tytuł Piosenki'? Tej akcji nie można cofnąć."
    -   **Scenariusz B (piosenka używana):** Tytuł: "Potwierdzenie usunięcia", Treść: "Czy na pewno chcesz usunąć piosenkę 'Tytuł Piosenki'?<br><b>Uwaga: Piosenka jest częścią 2 repertuarów i zostanie z nich usunięta.</b><br>Tej akcji nie można cofnąć."
4.  Użytkownik klika "Anuluj": Dialog zostaje zamknięty, stan aplikacji nie zmienia się.
5.  Użytkownik klika "Usuń":
    -   Dialog zostaje zamknięty.
    -   Aplikacja wysyła żądanie `DELETE` do API.
    -   Po pomyślnej odpowiedzi, piosenka znika z listy w UI.
    -   Na dole ekranu pojawia się komunikat `MatSnackBar` "Pomyślnie usunięto piosenkę 'Tytuł Piosenki'".

## 9. Warunki i walidacja
-   Brak walidacji po stronie frontendu. Logika biznesowa (np. uprawnienia do usunięcia) jest weryfikowana przez backend. Frontend musi jedynie poprawnie obsłużyć ewentualne błędy autoryzacji (401, 403) zwrócone przez API.

## 10. Obsługa błędów
-   **Błąd pobierania szczegółów piosenki:** Jeśli zapytanie `GET /api/songs/{id}` zakończy się niepowodzeniem, dialog potwierdzający nie zostanie wyświetlony. Użytkownik zobaczy komunikat `MatSnackBar` o treści np. "Wystąpił błąd podczas sprawdzania piosenki. Spróbuj ponownie."
-   **Błąd usuwania piosenki:** Jeśli zapytanie `DELETE /api/songs/{id}` zakończy się niepowodzeniem, piosenka pozostanie na liście. Użytkownik zobaczy komunikat `MatSnackBar` o treści np. "Nie udało się usunąć piosenki. Spróbuj ponownie."
-   Wszystkie błędy API powinny być logowane w konsoli lub systemie monitorowania.

## 11. Kroki implementacji
1.  **Aktualizacja `SongListComponent`:**
    -   W pliku `song-list.component.html`, do `mat-table` dodać nową kolumnę `actions`.
    -   W definicji kolumny umieścić `mat-icon-button` z ikoną `delete` i bindowaniem zdarzenia `(click)`.
    -   Zdefiniować `EventEmitter` o nazwie `deleteSongRequest` w `song-list.component.ts`.
    -   Zaimplementować metodę, która po kliknięciu przycisku emituje ID i tytuł piosenki.
2.  **Utworzenie/dostosowanie `ConfirmationDialogComponent`:**
    -   Upewnić się, że istnieje reużywalny komponent dialogowy lub stworzyć go zgodnie ze specyfikacją w sekcji 4.
    -   Upewnić się, że komponent poprawnie przyjmuje `ConfirmationDialogData` i zwraca `true/false`.
3.  **Aktualizacja `SongsApiService`:**
    -   Dodać metodę `getSongDetails(id: string, includeUsage: boolean): Observable<SongDetailDto>`.
    -   Dodać metodę `deleteSong(id: string): Observable<SongDeleteResponseDto>`.
4.  **Implementacja logiki w `SongListPageComponent`:**
    -   W szablonie `song-list-page.component.html` dodać nasłuchiwanie na zdarzenie `(deleteSongRequest)` w komponencie `<stbo-song-list>`.
    -   W pliku `song-list-page.component.ts` zaimplementować metodę `onDeleteSongRequest` opisaną w sekcji 4.
    -   Wstrzyknąć `MatDialog` i `MatSnackBar`.
    -   Zaimplementować logikę otwierania dialogu z dynamicznie generowaną wiadomością na podstawie `song.repertoires.length`.
    -   Po otrzymaniu pozytywnej odpowiedzi z dialogu, wywołać metodę z serwisu API.
    -   W subskrypcji (lub `pipe` z `tap/catchError`) obsłużyć sukces (aktualizacja sygnału `songs`, pokazanie snackbara) oraz błąd (pokazanie snackbara z błędem).
