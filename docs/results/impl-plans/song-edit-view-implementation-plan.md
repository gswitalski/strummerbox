# Plan implementacji widoku: Edycja Piosenki

## 1. Przegląd
Widok "Edycja Piosenki" umożliwia zalogowanemu użytkownikowi (Organizatorowi) modyfikację tytułu oraz treści istniejącej piosenki. Widok ten będzie współdzielił komponent formularza z widokiem tworzenia nowej piosenki, aby zapewnić spójność i reużywalność kodu. Komponent ten będzie zawierał edytor tekstu wspierający format ChordPro oraz dynamiczny podgląd renderowanej piosenki, dostosowujący swój układ do rozmiaru ekranu (side-by-side na desktopie, zakładki na mobile).

## 2. Routing widoku
Widok będzie dostępny pod chronioną ścieżką, wymagającą uwierzytelnienia. Parametr `:id` w ścieżce odpowiada unikalnemu identyfikatorowi (UUID) piosenki.

- **Ścieżka:** `/management/songs/:id/edit`

## 3. Struktura komponentów
Hierarchia komponentów została zaprojektowana w celu oddzielenia logiki biznesowej (pobieranie danych, komunikacja z API) od logiki prezentacji (formularz, podgląd).

```
SongEditPageComponent (Komponent-kontener)
│
└─── SongFormComponent (Komponent prezentacyjny, reużywalny)
     │
     └─── ChordProPreviewComponent (Komponent prezentacyjny, współdzielony)
```

## 4. Szczegóły komponentów
### `SongEditPageComponent`
- **Opis komponentu:** "Inteligentny" komponent-kontener, który zarządza stanem całego widoku. Jego zadaniem jest pobranie identyfikatora piosenki z adresu URL, wczytanie jej danych za pomocą serwisu, przekazanie ich do formularza oraz obsługa zapisu zmian po otrzymaniu zdarzenia od komponentu dziecka.
- **Główne elementy:**
    - Kontener dla `SongFormComponent`.
    - Wyświetlanie wskaźnika ładowania (`mat-spinner`) podczas pobierania danych.
    - Wyświetlanie komunikatu błędu, jeśli piosenka nie zostanie znaleziona.
- **Obsługiwane interakcje:**
    - Odbiera zdarzenie `(songSave)` z `SongFormComponent`.
- **Obsługiwana walidacja:** Brak - walidacja jest delegowana do `SongFormComponent` i obsługi błędów API.
- **Typy:** `SongDetailDto`, `SongPatchCommand`.
- **Propsy:** Brak. Komponent pobiera dane na podstawie `ActivatedRoute`.

### `SongFormComponent`
- **Opis komponentu:** "Głupi", reużywalny komponent, który renderuje formularz edycji/tworzenia piosenki. Odpowiada za walidację pól po stronie klienta i układ responsywny.
- **Główne elementy:**
    - `form[formGroup]` opakowujący kontrolki.
    - `mat-form-field` dla pola "Tytuł".
    - `textarea` dla pola "Treść piosenki".
    - `div` z układem side-by-side (desktop) lub `mat-tab-group` (mobile) do wyświetlania edytora i podglądu.
    - `ChordProPreviewComponent` do wyświetlania podglądu.
    - Przycisk "Zapisz zmiany" (`mat-button`).
- **Obsługiwane interakcje:**
    - Emituje zdarzenie `(songSave)` z danymi formularza po kliknięciu przycisku zapisu.
- **Obsługiwana walidacja:**
    - **Tytuł:**
        - `Validators.required`: pole jest wymagane.
        - `Validators.maxLength(180)`: maksymalna długość 180 znaków.
    - **Treść:**
        - `Validators.required`: pole jest wymagane.
        - `customBracketValidator`: niestandardowy walidator sprawdzający, czy liczba otwierających `[` i zamykających `]` nawiasów jest taka sama.
- **Typy:** `SongFormViewModel`, `SongPatchCommand`.
- **Propsy:**
    - `@Input() songToEdit: SongFormViewModel | null`: Obiekt z danymi piosenki do wypełnienia formularza. Jeśli `null`, komponent działa w trybie tworzenia.
    - `@Input() isSaving: boolean`: Flaga informująca, czy trwa proces zapisu (do blokowania przycisku).

### `ChordProPreviewComponent`
- **Opis komponentu:** Prosty komponent do renderowania tekstu w formacie ChordPro jako HTML.
- **Główne elementy:** `div`, który dynamicznie generuje HTML.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    - `@Input() content: string`: Tekst piosenki z akordami do wyświetlenia.

## 5. Typy
### `SongDetailDto` (DTO)
- **Źródło:** `packages/contracts/types.ts`
- **Cel:** Reprezentuje pełny obiekt piosenki pobierany z API (`GET /songs/{id}`).

### `SongPatchCommand` (DTO)
- **Źródło:** `packages/contracts/types.ts`
- **Cel:** Reprezentuje obiekt wysyłany do API w celu aktualizacji piosenki (`PATCH /songs/{id}`).
- **Pola:**
    - `title: string`
    - `content: string`

### `SongFormViewModel` (ViewModel)
- **Cel:** Reprezentuje model danych dla `SongFormComponent`, oddzielając go od struktury DTO.
- **Pola:**
    - `title: string`
    - `content: string`

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane wewnątrz komponentu `SongEditPageComponent` przy użyciu serwisów Angulara i biblioteki RxJS.

- **`SongService`:** Serwis będzie zawierał metody do komunikacji z API:
    - `getSong(id: string): Observable<SongDetailDto>`
    - `updateSong(id: string, command: SongPatchCommand): Observable<SongDto>`
- **Stan w `SongEditPageComponent`:**
    - `song$: Observable<SongDetailDto>`: Strumień przechowujący dane wczytanej piosenki.
    - `isLoading$: BehaviorSubject<boolean>`: Podmiot zarządzający stanem ładowania (pobieranie danych i zapis).
    - `error$: BehaviorSubject<string | null>`: Podmiot przechowujący komunikaty błędów.

## 7. Integracja API
1.  **Pobieranie danych:**
    - Po inicjalizacji `SongEditPageComponent` wywołuje `songService.getSong(id)`.
    - Otrzymany `SongDetailDto` jest mapowany na `SongFormViewModel` i przekazywany do `SongFormComponent`.
2.  **Aktualizacja danych:**
    - `SongEditPageComponent` po otrzymaniu zdarzenia `(songSave)` z `SongPatchCommand` wywołuje `songService.updateSong(id, command)`.
    - **Żądanie:** `PATCH /songs/{id}` z ciałem typu `SongPatchCommand`.
    - **Odpowiedź (sukces):** `200 OK` z ciałem typu `SongDto` (zaktualizowany zasób). Po sukcesie następuje nawigacja do listy piosenek.
    - **Odpowiedź (błąd):** Obsługa kodów `400`, `404`, `409` (szczegóły w sekcji 10).

## 8. Interakcje użytkownika
- **Wejście na stronę:** Użytkownik widzi wskaźnik ładowania. Po załadowaniu danych formularz jest wypełniony, a podgląd wyrenderowany.
- **Edycja pól:** Zmiany w polu "Treść" są odzwierciedlane w podglądzie w czasie rzeczywistym (z `debounceTime`). Walidacja pól jest wykonywana na bieżąco.
- **Zapis:** Przycisk "Zapisz zmiany" jest aktywny tylko, gdy formularz jest poprawny i został zmodyfikowany (`valid && dirty`). Kliknięcie blokuje przycisk i wyświetla wskaźnik ładowania do czasu odpowiedzi z API.
- **Nawigacja:** Po pomyślnym zapisie użytkownik jest informowany (np. `MatSnackBar`) i przekierowywany na listę piosenek (`/management/songs`).

## 9. Warunki i walidacja
- **Formularz (`SongFormComponent`):**
    - **Tytuł:** Musi być uzupełniony i nie może przekraczać 180 znaków. Komunikaty walidacji pojawiają się pod polem.
    - **Treść:** Musi być uzupełniona. Niestandardowy walidator sprawdza poprawność sparowania nawiasów kwadratowych.
- **Przycisk zapisu:** Jest wyłączony, jeśli formularz jest nieprawidłowy, niezmodyfikowany (`pristine`) lub trwa proces zapisu.

## 10. Obsługa błędów
- **Błąd pobierania piosenki (404 Not Found):** `SongEditPageComponent` wyświetla komunikat "Piosenka nie została znaleziona" i przycisk powrotu do listy.
- **Błąd walidacji serwera (400 Bad Request):** Odpowiedź API może zawierać szczegóły błędów. Należy je wyświetlić przy odpowiednich polach formularza.
- **Konflikt tytułu (409 Conflict):** Wyświetlany jest błąd przy polu "Tytuł": "Piosenka o tym tytule już istnieje".
- **Inne błędy (sieciowe, 5xx):** Wyświetlany jest ogólny komunikat (np. `MatSnackBar`): "Wystąpił błąd. Spróbuj ponownie później."

## 11. Kroki implementacji
1.  **Aktualizacja routingu:** Upewnij się, że w module routingu istnieje ścieżka `/management/songs/:id/edit` chroniona przez `AuthGuard` i prowadząca do `SongEditPageComponent`.
2.  **Utworzenie `SongEditPageComponent`:**
    - Wstrzyknij `ActivatedRoute`, `Router` i `SongService`.
    - W `ngOnInit` pobierz `id` z `ActivatedRoute.params`.
    - Zaimplementuj logikę pobierania danych piosenki za pomocą `songService.getSong(id)`.
    - Dodaj obsługę stanów ładowania i błędów (szczególnie 404).
    - Zaimplementuj metodę `onSave(command: SongPatchCommand)`, która wywoła `songService.updateSong()` i obsłuży nawigację po sukcesie.
3.  **Modyfikacja `SongFormComponent`:**
    - Dodaj `@Input() songToEdit: SongFormViewModel | null` oraz `@Input() isSaving: boolean`.
    - W `ngOnInit` lub `OnChanges` implementuj logikę `form.patchValue(this.songToEdit)`, jeśli dane zostały przekazane.
    - Upewnij się, że tekst przycisku i tytuł formularza dynamicznie się zmieniają (`'Edytuj piosenkę'` vs `'Stwórz piosenkę'`).
    - Zaimplementuj walidatory dla `FormGroup`.
    - Zaimplementuj responsywny układ edytor/podgląd (side-by-side vs. `mat-tab-group`) przy użyciu `BreakpointObserver`.
4.  **Aktualizacja `SongService`:**
    - Dodaj metodę `updateSong(id: string, command: SongPatchCommand): Observable<SongDto>`, która wykonuje żądanie `PATCH` do `/api/songs/{id}`.
    - Dodaj obsługę błędów (np. `catchError`).
5.  **Aktualizacja `SongListComponent`:**
    - Dodaj przycisk "Edytuj" dla każdego elementu na liście.
    - Ustaw atrybut `routerLink` na `['/management/songs', song.id, 'edit']`.
