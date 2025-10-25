# Plan implementacji widoku Tworzenie / Edycja Repertuaru

## 1. Przegląd
Widok "Tworzenie / Edycja Repertuaru" to kluczowy interfejs dla Organizatora, umożliwiający tworzenie nowych zestawów piosenek (repertuarów) lub modyfikowanie już istniejących. Użytkownik może zdefiniować nazwę i opis repertuaru, a następnie zarządzać jego zawartością poprzez dodawanie piosenek z ogólnej biblioteki, usuwanie ich z repertuaru oraz zmianę ich kolejności. Interfejs wykorzystuje mechanizm "przeciągnij i upuść" (drag-and-drop) dla intuicyjnego zarządzania listą utworów.

## 2. Routing widoku
Widok będzie dostępny pod dwiema dynamicznymi ścieżkami w module `management`:
-   **Tworzenie:** `/management/repertoires/new`
-   **Edycja:** `/management/repertoires/:id/edit`

Dostęp do obu ścieżek będzie chroniony przez guard `CanActivate`, który zezwoli na wejście tylko zalogowanym użytkownikom.

## 3. Struktura komponentów
Struktura będzie opierać się na jednym komponencie "smart" (strona) oraz dwóch komponentach "dumb" (prezentacyjnych), zgodnie z poniższą hierarchią:

```
RepertoireEditPageComponent (Smart)
│
├── RepertoireEditFormComponent (Dumb)
│
└── SongManagementComponent (Dumb)
    ├── Angular CDK Drag&Drop List (Piosenki w repertuarze)
    └── Angular CDK Drag&Drop List (Dostępne piosenki)
```

## 4. Szczegóły komponentów

### `RepertoireEditPageComponent`
-   **Opis komponentu:** Główny, routowalny komponent widoku. Odpowiada za logikę biznesową: pobieranie danych (repertuaru, listy wszystkich piosenek), zarządzanie stanem formularza i list, komunikację z API w celu zapisu zmian oraz obsługę nawigacji.
-   **Główne elementy:**
    -   Komponent `stbo-repertoire-edit-form` do edycji metadanych.
    -   Komponent `stbo-song-management` do zarządzania listami piosenek.
    -   Przyciski akcji "Zapisz" i "Anuluj".
    -   Wskaźnik ładowania (`mat-progress-bar`) podczas zapisu danych.
-   **Obsługiwane interakcje:**
    -   Inicjalizacja danych w zależności od trybu (tworzenie/edycja) na podstawie parametru z URL.
    -   Obsługa zdarzenia zapisu – agregacja danych i wywołanie odpowiednich metod serwisu API.
    -   Nawigacja powrotna po zapisie lub anulowaniu.
-   **Obsługiwana walidacja:** Kontrola ogólnej poprawności formularza przed aktywacją przycisku "Zapisz".
-   **Typy:** `RepertoireDto`, `SongSummaryDto`, `RepertoireEditPageViewModel`.
-   **Propsy:** Brak (komponent routowalny).

### `RepertoireEditFormComponent`
-   **Opis komponentu:** Komponent prezentacyjny, odpowiedzialny za wyświetlanie i edycję metadanych repertuaru (nazwa, opis).
-   **Główne elementy:**
    -   Obudowa `form` z `FormGroup`.
    -   Pola `mat-form-field` dla nazwy (`name`) i opisu (`description`).
-   **Obsługiwane interakcje:**
    -   Emituje zmiany w formularzu do komponentu nadrzędnego.
-   **Obsługiwana walidacja:**
    -   `name`: pole wymagane (`Validators.required`). Wyświetla komunikat błędu, jeśli pole jest puste.
-   **Typy:** `RepertoireUpdateCommand`.
-   **Propsy:** `formGroup: FormGroup` – instancja `FormGroup` przekazywana z komponentu nadrzędnego.

### `SongManagementComponent`
-   **Opis komponentu:** Komponent prezentacyjny do zarządzania listami piosenek. Implementuje dwie połączone listy `drag-and-drop` za pomocą Angular CDK.
-   **Główne elementy:**
    -   Kontener z dyrektywą `cdkDropListGroup`.
    -   Lewa lista (`cdkDropList`) na piosenki w repertuarze, z możliwością sortowania i usuwania (przeniesienie na prawą listę).
    -   Prawa lista (`cdkDropList`) z filtrowalną listą dostępnych piosenek z biblioteki.
    -   Pole `mat-form-field` do filtrowania listy dostępnych piosenek.
-   **Obsługiwane interakcje:**
    -   Przenoszenie piosenek między listami (`transferArrayItem`).
    -   Zmiana kolejności piosenek w ramach listy repertuaru (`moveItemInArray`).
    -   Emitowanie zaktualizowanej listy piosenek repertuaru (`(repertoireSongsChange)`) po każdej operacji "przeciągnij i upuść".
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `RepertoireSongViewModel`, `SongSummaryDto`.
-   **Propsy:**
    -   `repertoireSongs: RepertoireSongViewModel[]`
    -   `availableSongs: SongSummaryDto[]`

## 5. Typy

### DTO (zgodne z `packages/contracts/types.ts`)
-   `RepertoireDto`
-   `RepertoireSongDto`
-   `SongSummaryDto`
-   `RepertoireCreateCommand`
-   `RepertoireUpdateCommand`
-   `RepertoireAddSongsCommand`
-   `RepertoireReorderCommand`

### Modele Widoku (ViewModels)

-   **`RepertoireSongViewModel`**: Typ używany do renderowania piosenek w listach. Dla spójności będzie tożsamy z `RepertoireSongDto`.
    -   `repertoireSongId: string`
    -   `songId: string`
    -   `title: string`
    -   `position: number`

-   **`RepertoireEditPageViewModel`**: Główny obiekt stanu dla `RepertoireEditPageComponent`, zarządzany za pomocą sygnałów (signals).
    -   `repertoire: Signal<RepertoireDto | null>`: Dane edytowanego repertuaru.
    -   `allSongs: Signal<SongSummaryDto[]>`: Pełna lista piosenek w bibliotece użytkownika.
    -   `repertoireSongs: WritableSignal<RepertoireSongViewModel[]>`: Piosenki aktualnie znajdujące się w repertuarze.
    -   `availableSongs: Signal<SongSummaryDto[]>`: Obliczana lista piosenek dostępnych do dodania.
    -   `isLoading: Signal<boolean>`: Status ładowania danych początkowych.
    -   `isSaving: Signal<boolean>`: Status operacji zapisu.
    -   `error: Signal<string | null>`: Komunikat błędu.

## 6. Zarządzanie stanem
Stan widoku będzie zarządzany lokalnie w `RepertoireEditPageComponent` przy użyciu **Angular Signals**.

-   **Źródło danych:**
    -   `repertoireId = input<string | null>(null)`: Wejściowy sygnał z ID repertuaru pobranym z trasy URL.
    -   `isEditMode = computed(() => !!repertoireId())`: Sygnał obliczany, określający tryb pracy (edycja/tworzenie).
-   **Logika stanu:**
    -   `effect()` będzie reagował na zmianę `repertoireId`, aby uruchomić pobieranie danych początkowych z API.
    -   `repertoireSongs` (typu `WritableSignal`) będzie modyfikowany w odpowiedzi na interakcje użytkownika w `SongManagementComponent`.
    -   `availableSongs` (typu `computed`) będzie automatycznie przeliczany na podstawie sygnałów `allSongs` i `repertoireSongs`, co zapewni reaktywność interfejsu.

## 7. Integracja API
Komponent `RepertoireEditPageComponent` będzie komunikował się z API poprzez dedykowany `RepertoireApiService`.

-   **Pobieranie danych (tryb edycji):**
    -   `GET /repertoires/{id}`: Pobranie szczegółów repertuaru. Odpowiedź typu `RepertoireDto`.
    -   `GET /songs`: Pobranie wszystkich piosenek użytkownika. Odpowiedź typu `SongListResponseDto`.
-   **Zapis (tryb tworzenia):**
    -   `POST /repertoires`: Stworzenie nowego repertuaru. Żądanie typu `RepertoireCreateCommand`.
-   **Zapis (tryb edycji):**
    -   Logika zapisu będzie analizować zmiany i wywoływać odpowiednie endpointy:
        1.  **Zmiana metadanych:** `PATCH /repertoires/{id}` z `RepertoireUpdateCommand`.
        2.  **Dodane piosenki:** `POST /repertoires/{id}/songs` z `RepertoireAddSongsCommand`.
        3.  **Usunięte piosenki:** `DELETE /repertoires/{id}/songs/{repertoireSongId}` dla każdej usuniętej piosenki.
        4.  **Zmiana kolejności:** `POST /repertoires/{id}/songs/reorder` z `RepertoireReorderCommand`.

## 8. Interakcje użytkownika
-   **Wpisywanie nazwy/opisu:** Aktualizuje stan `FormGroup` w czasie rzeczywistym.
-   **Dodawanie piosenki:** Użytkownik przeciąga element z listy "Dostępne piosenki" do listy "Piosenki w repertuarze".
-   **Usuwanie piosenki:** Użytkownik przeciąga element z listy "Piosenki w repertuarze" do listy "Dostępne piosenki".
-   **Zmiana kolejności:** Użytkownik przeciąga element w obrębie listy "Piosenki w repertuarze".
-   **Filtrowanie piosenek:** Wpisanie tekstu w polu wyszukiwania na liście dostępnych piosenek filtruje ją w czasie rzeczywistym.
-   **Kliknięcie "Zapisz":** Uruchamia logikę zapisu, blokuje interfejs i wyświetla wskaźnik postępu.
-   **Kliknięcie "Anuluj":** Powoduje powrót do poprzedniej strony bez zapisywania zmian.

## 9. Warunki i walidacja
-   **Pole `name`:** Jest wymagane. Przycisk "Zapisz" pozostaje nieaktywny, dopóki pole nie zostanie uzupełnione.
-   **Unikalność nazwy:** Walidacja odbywa się po stronie backendu. W przypadku otrzymania błędu `409 Conflict`, komponent `RepertoireEditFormComponent` wyświetli stosowny komunikat przy polu `name`.
-   **Pusta lista piosenek:** Aplikacja pozwala na stworzenie pustego repertuaru.

## 10. Obsługa błędów
-   **Błąd ładowania danych:** W przypadku niepowodzenia pobrania danych początkowych, widok wyświetli komunikat o błędzie z opcją ponowienia próby.
-   **Błąd zapisu (`409 Conflict`):** Formularz wyświetli błąd walidacji przy polu `name`: "Repertuar o tej nazwie już istnieje".
-   **Inne błędy zapisu (np. `400`, `500`):** Wyświetlony zostanie ogólny komunikat błędu (np. w komponencie `mat-snackbar`) z informacją, że zapis nie powiódł się.
-   **Brak autoryzacji (`401`, `403`):** Globalny `HttpInterceptor` powinien przechwycić błąd i przekierować użytkownika na stronę logowania.
-   **Zasób nie istnieje (`404`):** W trybie edycji, jeśli repertuar został usunięty, użytkownik zostanie poinformowany i przekierowany do listy repertuarów.

## 11. Kroki implementacji
1.  **Stworzenie plików komponentów:** `ng generate component pages/management/repertoire-edit-page`, `.../repertoire-edit-form`, `.../song-management`.
2.  **Implementacja routingu:** Dodanie ścieżek `/new` i `/:id/edit` do modułu routingu `management`.
3.  **Budowa `RepertoireEditPageComponent`:**
    -   Zdefiniowanie sygnałów do zarządzania stanem (`RepertoireEditPageViewModel`).
    -   Implementacja logiki pobierania danych w `effect()` na podstawie `repertoireId`.
    -   Dodanie logiki do przycisku "Zapisz", rozróżniającej tryb tworzenia i edycji.
4.  **Budowa `RepertoireEditFormComponent`:**
    -   Stworzenie szablonu HTML z formularzem (`mat-form-field` dla `name` i `description`).
    -   Przekazanie `FormGroup` jako `@Input`.
5.  **Budowa `SongManagementComponent`:**
    -   Implementacja szablonu HTML z dwiema połączonymi listami `cdkDropList`.
    -   Dodanie obsługi zdarzenia `(cdkDropListDropped)` do aktualizacji stanu.
    -   Implementacja filtrowania po stronie klienta dla listy dostępnych piosenek.
6.  **Integracja z API:**
    -   Stworzenie lub rozbudowa `RepertoireApiService` o metody odpowiadające wymaganym endpointom.
    -   Zaimplementowanie złożonej logiki zapisu w trybie edycji w `RepertoireEditPageComponent`.
7.  **Stylowanie i UX:**
    -   Dopracowanie wyglądu komponentów zgodnie z Angular Material i design systemem.
    -   Dodanie wskaźników ładowania, obsługi pustych stanów i komunikatów o błędach.
