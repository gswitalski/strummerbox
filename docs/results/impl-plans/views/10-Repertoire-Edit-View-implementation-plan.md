# Plan implementacji widoku: Edycja Repertuaru

## 1. Przegląd
Widok "Edycja Repertuaru" jest kluczowym interfejsem dla zalogowanego organizatora, umożliwiającym pełne zarządzanie zawartością pojedynczego repertuaru. Użytkownik może w czasie rzeczywistym modyfikować nazwę i opis, dodawać piosenki ze swojej biblioteki, usuwać je z repertuaru oraz zmieniać ich kolejność za pomocą mechanizmu "przeciągnij i upuść". Każda zmiana jest natychmiast zapisywana w systemie poprzez dedykowane wywołanie API, co zapewnia płynne i responsywne doświadczenie użytkownika bez potrzeby globalnego przycisku "Zapisz".

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką, która zawiera unikalny identyfikator repertuaru.

-   **Ścieżka:** `/management/repertoires/:id/edit`
-   **Ochrona:** Dostęp do widoku musi być chroniony przez `AuthGuard`, który zezwala na dostęp tylko uwierzytelnionym użytkownikom.

## 3. Struktura komponentów
Hierarchia komponentów została zaprojektowana w celu separacji odpowiedzialności, gdzie komponent nadrzędny (`PageComponent`) zarządza stanem i logiką, a komponenty podrzędne (`Dumb Components`) są odpowiedzialne wyłącznie за renderowanie UI i emitowanie zdarzeń.

```
RepertoireEditPageComponent (Routed, Smart Component)
│
├── RepertoireEditHeaderComponent (Dumb Component)
│
└── (Kontener z dwiema listami)
    ├── RepertoireSongListComponent (Dumb Component)
    └── AvailableSongListComponent (Dumb Component)
```

## 4. Szczegóły komponentów

### `RepertoireEditPageComponent`
-   **Opis komponentu**: Główny, routowalny komponent widoku. Jego rolą jest inicjalizacja stanu, koordynacja komunikacji z API poprzez dedykowany serwis (`RepertoireEditStateService`) oraz przekazywanie danych i obsługa zdarzeń z komponentów podrzędnych.
-   **Główne elementy**: Komponent będzie zawierał `stbo-repertoire-edit-header`, `stbo-repertoire-song-list` oraz `stbo-available-song-list`. Będzie również wyświetlał wskaźniki ładowania (`mat-spinner`) lub komunikaty o błędach na poziomie całego widoku.
-   **Obsługiwane interakcje**:
    -   Inicjalizacja pobierania danych o repertuarze i liście dostępnych piosenek na podstawie `:id` z URL.
    -   Przekazywanie żądań modyfikacji (zmiana nazwy, dodanie/usunięcie/zmiana kolejności piosenek) od komponentów podrzędnych do serwisu stanu.
-   **Typy**: `Signal<RepertoireEditViewModel>`
-   **Propsy (Inputs)**: Brak (komponent routowalny).

### `RepertoireEditHeaderComponent`
-   **Opis komponentu**: Odpowiada za wyświetlanie oraz edycję "in-place" nazwy i opisu repertuaru.
-   **Główne elementy**:
    -   Elementy `<h2>` i `<p>` do wyświetlania nazwy i opisu.
    -   Pola `mat-form-field` z `mat-input` i `textarea`, które pojawiają się po kliknięciu na tekst.
    -   Przyciski `mat-icon-button` (`check` i `close`) do zatwierdzania lub anulowania edycji.
-   **Obsługiwane interakcje**:
    -   Kliknięcie na tekst przełącza w tryb edycji.
    -   Kliknięcie "Zatwierdź" emituje zdarzenie z nową wartością.
    -   Kliknięcie "Anuluj" porzuca zmiany i wraca do trybu wyświetlania.
-   **Warunki walidacji**:
    -   Nazwa repertuaru (`name`) jest wymagana (`required`).
    -   Nazwa repertuaru nie może być dłuższa niż 160 znaków (`maxlength="160"`).
-   **Typy**: `RepertoireDto`
-   **Propsy (Inputs)**:
    -   `repertoire: Signal<RepertoireDto | null>`
    -   `isUpdating: Signal<boolean>`
-   **Zdarzenia (Outputs)**:
    -   `nameChange: EventEmitter<string>`
    -   `descriptionChange: EventEmitter<string>`

### `RepertoireSongListComponent`
-   **Opis komponentu**: Wyświetla listę piosenek należących do bieżącego repertuaru. Umożliwia ich usuwanie oraz zmianę kolejności za pomocą drag-and-drop.
-   **Główne elementy**:
    -   Lista `mat-list` z dyrektywami `cdkDropList` i `cdkDrag` z `DragDropModule`.
    -   Elementy `mat-list-item` dla każdej piosenki, zawierające jej tytuł, uchwyt do przeciągania (`cdkDragHandle`) oraz przycisk `mat-icon-button` (`delete`) do usuwania.
-   **Obsługiwane interakcje**:
    -   Przeciągnięcie i upuszczenie elementu na liście w celu zmiany kolejności.
    -   Kliknięcie przycisku "Usuń".
-   **Typy**: `RepertoireSongViewModel`
-   **Propsy (Inputs)**:
    -   `songs: Signal<RepertoireSongViewModel[]>`
    -   `removingSongId: Signal<string | null>`
-   **Zdarzenia (Outputs)**:
    -   `orderChanged: EventEmitter<string[]>` (emituje nową tablicę `repertoireSongId`)
    -   `songRemoved: EventEmitter<string>` (emituje `repertoireSongId` do usunięcia)

### `AvailableSongListComponent`
-   **Opis komponentu**: Wyświetla listę wszystkich piosenek organizatora, które nie należą jeszcze do bieżącego repertuaru. Umożliwia dodawanie piosenek do repertuaru.
-   **Główne elementy**:
    -   Pole `mat-form-field` do filtrowania listy piosenek.
    -   Lista `mat-list`.
    -   Elementy `mat-list-item` dla każdej piosenki, zawierające jej tytuł oraz przycisk `mat-icon-button` (`add_circle`) do dodawania.
-   **Obsługiwane interakcje**: Kliknięcie przycisku "Dodaj".
-   **Typy**: `AvailableSongViewModel`
-   **Propsy (Inputs)**:
    -   `songs: Signal<AvailableSongViewModel[]>`
    -   `addingSongId: Signal<string | null>`
-   **Zdarzenia (Outputs)**:
    -   `songAdded: EventEmitter<string>` (emituje `songId` do dodania)

## 5. Typy
Aby zarządzać stanem UI (np. wskaźnikami ładowania dla konkretnych operacji), wprowadzimy dedykowane modele widoku (ViewModel), które będą rozszerzeniem istniejących DTO.

-   **`RepertoireEditViewModel`**: Główny obiekt stanu dla całego widoku.
    ```typescript
    interface RepertoireEditViewModel {
        repertoire: RepertoireDto | null;
        allSongs: SongSummaryDto[];
        isLoading: boolean; // Ładowanie początkowe
        isUpdatingHeader: boolean;
        error: string | null;
        addingSongId: string | null; // ID piosenki właśnie dodawanej
        removingSongId: string | null; // ID piosenki (repertoireSongId) właśnie usuwanej
    }
    ```

-   **`RepertoireSongViewModel`**: Model dla elementu na liście piosenek w repertuarze.
    ```typescript
    interface RepertoireSongViewModel extends RepertoireSongDto {
        // Dziedziczy: repertoireSongId, songId, title, position
        // DTO jest wystarczające, stan ładowania będzie zarządzany przez `removingSongId` w głównym VM.
    }
    ```

-   **`AvailableSongViewModel`**: Model dla elementu na liście dostępnych piosenek.
    ```typescript
    interface AvailableSongViewModel extends SongSummaryDto {
        // Dziedziczy: id, publicId, title, etc.
        // DTO jest wystarczające, stan ładowania będzie zarządzany przez `addingSongId` w głównym VM.
    }
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane przy użyciu dedykowanego, wstrzykiwalnego serwisu (`RepertoireEditStateService`), zgodnie z zasadami "Angular Signals". Serwis ten będzie dostarczany na poziomie komponentu `RepertoireEditPageComponent`.

-   **`RepertoireEditStateService`**:
    -   Będzie zawierał prywatny `signal` przechowujący cały `RepertoireEditViewModel`.
    -   Udostępni publiczne `computed` sygnały-selektory do odczytu poszczególnych części stanu (np. `repertoire()`, `repertoireSongs()`, `availableSongs()`).
    -   Metody publiczne (`load`, `updateName`, `addSong`, `removeSong`, `reorderSongs`) będą enkapsulować logikę wywołań API i aktualizacji stanu.
    -   Aktualizacje stanu po operacjach (dodawanie, usuwanie, zmiana kolejności) będą implementowane poprzez ręczne modyfikacje sygnału stanu na podstawie odpowiedzi z API, aby uniknąć pełnego przeładowania danych i zapewnić płynność interfejsu. W przypadku błędu API, stan powinien zostać przywrócony do poprzedniej wartości.

## 7. Integracja API
Komponenty będą komunikować się z API za pośrednictwem `RepertoireEditStateService`, który będzie korzystał z dwóch nowych serwisów (`RepertoiresApiService`, `SongsApiService`) opakowujących `HttpClient`.

-   **`GET /repertoires/:id`**: Pobranie szczegółów repertuaru przy inicjalizacji widoku.
-   **`GET /songs`**: Pobranie wszystkich piosenek użytkownika. Serwis powinien obsłużyć paginację, pobierając wszystkie piosenki (np. przez ustawienie `pageSize` na dużą wartość).
-   **`PATCH /repertoires/:id`**: Aktualizacja nazwy lub opisu.
    -   **Request**: `RepertoireUpdateCommand`
    -   **Response**: `RepertoireDto`
-   **`POST /repertoires/:id/songs`**: Dodanie piosenki do repertuaru.
    -   **Request**: `RepertoireAddSongsCommand`
    -   **Response**: `RepertoireAddSongsResponseDto`
-   **`DELETE /repertoires/:id/songs/:repertoireSongId`**: Usunięcie piosenki z repertuaru.
    -   **Request**: -
    -   **Response**: `RepertoireRemoveSongResponseDto`
-   **`POST /repertoires/:id/songs/reorder`**: Zmiana kolejności piosenek.
    -   **Request**: `RepertoireReorderCommand`
    -   **Response**: `RepertoireReorderResponseDto`

## 8. Interakcje użytkownika
-   **Edycja nazwy/opisu**: Kliknięcie na tekst przełącza go w pole edycji. Zatwierdzenie (`✓`) wysyła żądanie `PATCH`. Anulowanie (`✗`) przywraca poprzedni stan.
-   **Dodawanie piosenki**: Kliknięcie ikony `+` przy piosence na liście dostępnych piosenek wysyła żądanie `POST`. W trakcie operacji ikona zamienia się na wskaźnik ładowania. Po sukcesie piosenka znika z prawej listy i pojawia się na lewej.
-   **Usuwanie piosenki**: Kliknięcie ikony `x` przy piosence na liście repertuaru wysyła żądanie `DELETE`. W trakcie operacji ikona zamienia się na wskaźnik ładowania. Po sukcesie piosenka znika z lewej listy i pojawia się na prawej.
-   **Zmiana kolejności**: Użytkownik przeciąga piosenkę na liście repertuaru. Po upuszczeniu jej w nowym miejscu, UI jest natychmiast aktualizowane, a w tle wysyłane jest żądanie `POST` z nową kolejnością.

## 9. Warunki i walidacja
-   **Formularz edycji nazwy**: Przycisk zapisu jest nieaktywny, jeśli pole jest puste lub przekracza 160 znaków. Komunikaty o błędach są wyświetlane pod polem. Walidacja odbywa się w czasie rzeczywistym.
-   **Duplikat nazwy repertuaru**: Jeśli API zwróci błąd `409 Conflict` po próbie zmiany nazwy, informacja o błędzie powinna zostać wyświetlona przy polu formularza.

## 10. Obsługa błędów
-   **Błąd początkowego ładowania danych** (np. repertuar o danym ID nie istnieje): Widok powinien wyświetlić komunikat błędu na całym ekranie z przyciskiem powrotu do listy repertuarów.
-   **Błędy sieciowe / serwera (5xx)**: Każda operacja (edycja, dodawanie, usuwanie, zmiana kolejności) powinna poinformować użytkownika o niepowodzeniu za pomocą komponentu `MatSnackBar` (toast).
-   **Błąd uprawnień (403)**: Wyświetlenie komunikatu w `MatSnackBar` i potencjalne przekierowanie użytkownika.
-   **Błąd zmiany kolejności**: W przypadku niepowodzenia żądania `reorder`, kolejność piosenek w UI musi zostać przywrócona do stanu sprzed operacji, aby zachować spójność z danymi na serwerze.

## 11. Kroki implementacji
1.  **Struktura plików**: Utworzenie folderu `repertoire-edit` w `src/app/pages/management/` i wygenerowanie podstawowych komponentów za pomocą schematów Angular CLI: `RepertoireEditPageComponent`, `RepertoireEditHeaderComponent`, `RepertoireSongListComponent`, `AvailableSongListComponent`.
2.  **Serwisy**: Stworzenie `RepertoiresApiService` i `SongsApiService` do enkapsulacji wywołań `HttpClient`.
3.  **Zarządzanie Stanem**: Implementacja `RepertoireEditStateService` z podstawową strukturą sygnałów i pustymi metodami publicznymi.
4.  **Routing**: Dodanie nowej ścieżki `/management/repertoires/:id/edit` do pliku `app.routes.ts`, wskazującej na `RepertoireEditPageComponent` i zabezpieczonej przez `AuthGuard`.
5.  **Komponent Główny**: Implementacja `RepertoireEditPageComponent` - wstrzyknięcie `ActivatedRoute` i `RepertoireEditStateService`, zainicjowanie ładowania danych w `ngOnInit`. Połączenie szablonu HTML z podkomponentami.
6.  **Implementacja List**: Stworzenie `RepertoireSongListComponent` i `AvailableSongListComponent`. Na początku tylko wyświetlanie danych przekazanych przez `[input]`.
7.  **Implementacja Nagłówka**: Implementacja `RepertoireEditHeaderComponent` z logiką przełączania trybu edycji/wyświetlania i walidacją.
8.  **Integracja API - Odczyt**: Pełna implementacja metody `load` w `RepertoireEditStateService` i upewnienie się, że dane są poprawnie pobierane i wyświetlane we wszystkich komponentach.
9.  **Integracja API - Modyfikacje**:
    a. Implementacja logiki aktualizacji nazwy/opisu (`PATCH`).
    b. Implementacja logiki usuwania piosenki (`DELETE`).
    c. Implementacja logiki dodawania piosenki (`POST`).
10. **Implementacja Drag-and-Drop**: Dodanie `DragDropModule` do `RepertoireSongListComponent`. Implementacja logiki `(cdkDropListDropped)` i podłączenie jej do metody `reorderSongs` w serwisie stanu.
11. **Obsługa Błędów i Stanów Ładowania**: Implementacja wyświetlania wskaźników ładowania dla poszczególnych akcji oraz obsługa błędów za pomocą `MatSnackBar`.
12. **Stylowanie i Finalizacja**: Dopracowanie wyglądu i responsywności widoku zgodnie z UI Planem i systemem Angular Material.
