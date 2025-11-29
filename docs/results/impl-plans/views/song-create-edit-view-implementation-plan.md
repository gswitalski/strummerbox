# Plan implementacji widoku: Tworzenie / Edycja Piosenki

## 1. Przegląd

Widok "Tworzenie / Edycja Piosenki" umożliwia Organizatorowi dodawanie nowych piosenek do swojej biblioteki oraz modyfikowanie już istniejących. Centralnym elementem widoku jest edytor "side-by-side", który pozwala na wprowadzanie tekstu w intuicyjnym formacie "akordy nad tekstem" i jednoczesne obserwowanie podglądu na żywo w formacie ChordPro, który jest zapisywany w bazie danych. Widok jest w pełni responsywny, dostosowując swój układ do urządzeń mobilnych.

## 2. Routing widoku

Widok będzie dostępny pod następującymi ścieżkami w module `management`:

-   Tworzenie nowej piosenki: `/management/songs/new`
-   Edycja istniejącej piosenki: `/management/songs/:id/edit`

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku będzie następująca:

```
SongEditPageComponent (Komponent-strona, "smart")
└── SongEditFormComponent (Komponent prezentacyjny, "dumb")
    ├── MatFormField (dla tytułu)
    ├── SongEditorLayoutComponent (Komponent prezentacyjny dla responsywnego layoutu)
    │   ├── <ng-content select="[editor]"> (miejsce na textarea)
    │   └── <ng-content select="[preview]"> (miejsce na SongDisplayComponent)
    └── Akcje formularza (przyciski Zapisz, Anuluj)
```

## 4. Szczegóły komponentów

### `SongEditPageComponent`

-   **Opis komponentu:** Komponent "smart" zarządzający całą logiką strony. Odpowiada za pobieranie danych piosenki w trybie edycji, komunikację z API w celu zapisu lub aktualizacji, obsługę stanu (ładowanie, błędy) oraz nawigację po zakończeniu akcji.
-   **Główne elementy:** Komponent będzie renderował `SongEditFormComponent` i przekazywał do niego wymagane dane oraz nasłuchiwał na jego zdarzenia.
-   **Obsługiwane zdarzenia:** `(saveSong)` od `SongEditFormComponent` - wyzwala logikę zapisu/aktualizacji piosenki.
-   **Warunki walidacji:** Brak - walidacja jest delegowana do `SongEditFormComponent`.
-   **Typy:** `SongDetailDto` (do odczytu), `SongCreateCommand` (do zapisu), `SongPatchCommand` (do aktualizacji).
-   **Propsy:** Brak.

### `SongEditFormComponent`

-   **Opis komponentu:** Komponent prezentacyjny zawierający `ReactiveForm` do edycji piosenki. Obejmuje pole na tytuł, edytor (`textarea`), podgląd oraz przyciski akcji. Odpowiada za walidację pól i emitowanie zdarzenia zapisu.
-   **Główne elementy:** `form` z `FormGroup`, `mat-form-field` dla tytułu, `SongEditorLayoutComponent` do układu edytora i podglądu, `mat-button` dla akcji.
-   **Obsługiwane interakcje:** `(ngSubmit)` - emituje zdarzenie `saveSong` z danymi z formularza.
-   **Obsługiwana walidacja:**
    -   `title`: `Validators.required`. Dodatkowo, asynchroniczny walidator sprawdzający unikalność tytułu w bazie danych (z `debounceTime`).
    -   `content`: `Validators.required`.
-   **Typy:** `FormGroup` z kontrolkami `title` i `content`.
-   **Propsy:**
    -   `@Input() initialData: { title: string; content: string } | null` - dane do wypełnienia formularza w trybie edycji.
    -   `@Input() isSaving: boolean` - informuje o trwającym procesie zapisu, aby zablokować przycisk.

### `SongEditorLayoutComponent`

-   **Opis komponentu:** Komponent czysto prezentacyjny, odpowiedzialny za responsywny układ. Na szerokich ekranach wyświetla edytor i podgląd obok siebie. Na wąskich ekranach używa `mat-tab-group` do przełączania się między nimi.
-   **Główne elementy:** `mat-tab-group` i `div` z stylami flexbox. Wykorzystuje `ng-content` z selektorami `[editor]` i `[preview]` do umieszczenia odpowiednich kontrolek.
-   **Obsługiwane interakcje:** Brak.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:** Brak.

## 5. Typy

Poza typami DTO z `packages/contracts/types.ts` (`SongDetailDto`, `SongCreateCommand`, `SongPatchCommand`), nie przewiduje się tworzenia nowych, złożonych typów ViewModel. Stan komponentu `SongEditPageComponent` będzie zarządzany przez prosty interfejs:

```typescript
interface SongEditState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  song: SongDetailDto | null; // Dane piosenki w trybie edycji
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `SongEditPageComponent` przy użyciu sygnałów (`signal`) z Angulara, zgodnie z najlepszymi praktykami.

-   **`state = signal<SongEditState>(...)`**: Główny sygnał przechowujący stan strony.
-   **`form: FormGroup`**: Formularz reaktywny do zarządzania danymi wprowadzanymi przez użytkownika.
-   **`previewContent = signal<string>('')`**: Sygnał przechowujący skonwertowaną treść piosenki w formacie ChordPro, przekazywaną do komponentu podglądu. Będzie on aktualizowany w reakcji na zmiany w polu `content` formularza, z użyciem `debounceTime` dla optymalizacji.

## 7. Integracja API

Komponent `SongEditPageComponent` będzie korzystał z dedykowanego serwisu (np. `SongsApiService`) do komunikacji z backendem.

-   **Tryb edycji (OnInit):**
    -   Wywołanie: `GET /songs/:id`
    -   Po otrzymaniu `SongDetailDto`, jego pole `content` (ChordPro) zostanie przekonwertowane przez `ChordConversionService` na format "akordy nad tekstem" i użyte do zainicjowania formularza.
-   **Zapis (nowa piosenka):**
    -   Wywołanie: `POST /songs`
    -   Typ żądania: `SongCreateCommand`. Pole `content` zostanie utworzone przez konwersję wartości z `textarea` (format "akordy nad tekstem") na ChordPro.
-   **Aktualizacja (edycja piosenki):**
    -   Wywołanie: `PATCH /songs/:id`
    -   Typ żądania: `SongPatchCommand`. Pole `content` (jeśli zmienione) zostanie również skonwertowane na ChordPro przed wysłaniem.

## 8. Interakcje użytkownika

-   **Wprowadzanie tekstu w edytorze:** Zmiany w `textarea` są obserwowane. Po krótkim opóźnieniu (`debounceTime`), tekst jest konwertowany na ChordPro i aktualizowany jest podgląd w `SongDisplayComponent`.
-   **Wprowadzanie tytułu:** Zmiany w polu tytułu wyzwalają walidację, w tym asynchroniczne sprawdzanie unikalności.
-   **Kliknięcie "Zapisz":** Uruchamia walidację całego formularza. Jeśli jest poprawny, dane są wysyłane do API. Przycisk jest zablokowany podczas operacji zapisu.
-   **Kliknięcie "Anuluj":** Użytkownik jest nawigowany z powrotem do listy piosenek (`/management/songs`) bez zapisywania zmian.

## 9. Warunki i walidacja

-   **Pole `title`:** Musi być wypełnione (`required`). Musi być unikalne w ramach piosenek danego użytkownika (walidacja asynchroniczna). Komunikat o błędzie jest wyświetlany pod polem.
-   **Pole `content` (`textarea`):** Musi być wypełnione (`required`).
-   **Przycisk "Zapisz":** Jest nieaktywny (`disabled`), jeśli formularz jest niepoprawny (`form.invalid`), oczekuje na wynik walidacji asynchronicznej (`form.pending`) lub trwa proces zapisu (`isSaving`).

## 10. Obsługa błędów

-   **Błąd wczytywania piosenki:** Jeśli `GET /songs/:id` zwróci błąd, zostanie wyświetlony komunikat o błędzie na całą stronę z opcją powrotu.
-   **Błąd unikalności tytułu:** Jeśli API zwróci błąd konfliktu (409) podczas zapisu, błąd walidacji zostanie programowo ustawiony na kontrolce `title`, co wyświetli użytkownikowi stosowny komunikat.
-   **Inne błędy zapisu:** W przypadku ogólnych błędów serwera (5xx), użytkownik zobaczy komunikat (np. w `MatSnackBar`) informujący o niepowodzeniu operacji.

## 11. Kroki implementacji

1.  **Stworzenie `ChordConversionService`:**
    -   Utworzenie serwisu `ChordConversionService`.
    -   Wydzielenie i przeniesienie logiki konwersji `ChordPro -> Akordy nad tekstem` z `SongDisplayComponent`.
    -   Wydzielenie i przeniesienie logiki konwersji `Akordy nad tekstem -> ChordPro` z (usuniętego) `ImportFromTextDialogComponent`.
    -   Dodanie testów jednostkowych dla serwisu.
2.  **Refaktoryzacja `SongEditPageComponent`:**
    -   Zastąpienie `NgOnInit` logiką bazującą na sygnałach.
    -   Implementacja wstrzykiwania serwisu `ChordConversionService`.
    -   W trybie edycji, po pobraniu danych, użycie serwisu do konwersji `content` dla formularza.
    -   Przy zapisie, użycie serwisu do konwersji `content` z formularza do formatu ChordPro.
3.  **Implementacja `SongEditFormComponent`:**
    -   Stworzenie formularza reaktywnego (`FormGroup`).
    -   Dodanie kontrolek `title` i `content` z odpowiednimi walidatorami.
    -   Implementacja asynchronicznego walidatora dla unikalności tytułu.
    -   Podpięcie `valueChanges` z kontrolki `content` do aktualizacji podglądu (z `debounceTime`).
4.  **Implementacja `SongEditorLayoutComponent`:**
    -   Stworzenie komponentu z użyciem `BreakpointObserver` z Angular CDK.
    -   Implementacja dwóch stanów widoku: "side-by-side" dla `(min-width: 768px)` i `mat-tab-group` dla mniejszych ekranów.
    -   Użycie `ng-content` do projekcji edytora i podglądu.
5.  **Integracja i testowanie:**
    -   Złożenie wszystkich komponentów w `SongEditPageComponent`.
    -   Usunięcie nieużywanego komponentu `ImportFromTextDialogComponent` z projektu.
    -   Przeprowadzenie testów manualnych dla obu trybów (tworzenie/edycja) na różnych rozmiarach ekranu.
    -   Weryfikacja obsługi błędów walidacji i błędów API.
