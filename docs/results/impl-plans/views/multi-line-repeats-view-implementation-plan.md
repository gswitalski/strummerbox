# Plan implementacji widoku - Powtórzenia Wielowierszowe

## 1. Przegląd

Celem jest rozszerzenie funkcjonalności edytora piosenek o możliwość definiowania wielowierszowych bloków powtórzeń za pomocą uproszczonej składni `xN(L)`. Ta składnia będzie automatycznie konwertowana do formatu ChordPro (`{block_start: xN}` / `{block_end}`) w celu zapisania w bazie danych. Widok piosenki zostanie zaktualizowany, aby wizualnie oznaczać te bloki, poprawiając czytelność zarówno dla Organizatora, jak i Biesiadnika. Implementacja skupi się na modyfikacji istniejących komponentów edytora i wyświetlania piosenek oraz na rozszerzeniu istniejącego serwisu do logiki konwersji.

## 2. Routing widoku

Implementacja nie wprowadza żadnych nowych ścieżek. Zmiany zostaną wprowadzone w istniejących widokach:
-   **Widok edycji/tworzenia piosenki:** `/management/songs/new`, `/management/songs/:id/edit`
-   **Widok podglądu piosenki:** `/management/songs/:id/preview`
-   **Widok piosenki w trybie Biesiada:** `/biesiada/repertoires/:id/songs/:songId`
-   **Publiczny widok piosenki:** `/public/songs/:publicId`, `/public/repertoires/:publicId/songs/:songPublicId`

## 3. Struktura komponentów

Architektura nie ulega zmianie. Zmiany obejmą modyfikację istniejących komponentów i serwisu:

-   `ChordConverterService` **(Modyfikacja)**: Istniejący serwis zostanie rozszerzony o logikę biznesową odpowiedzialną za dwukierunkową konwersję pomiędzy składnią uproszczoną (`xN(L)`) a formatem ChordPro.
-   `SongEditorComponent` **(Modyfikacja)**: Komponent edytora piosenek zostanie zintegrowany ze zmodyfikowanym `ChordConverterService`, aby na bieżąco tłumaczyć wprowadzany przez użytkownika tekst na format ChordPro do podglądu i zapisu.
-   `SongDisplayComponent` **(Modyfikacja)**: Komponent odpowiedzialny za renderowanie treści piosenki zostanie rozbudowany o logikę parsowania i wizualnego przedstawiania bloków powtórzeń.

```
SongEditPageComponent
└── SongEditorComponent (używa ChordConverterService)
    ├── Textarea (input dla składni xN(L))
    └── PreviewPanel
        └── SongDisplayComponent (renderuje wizualnie bloki powtórzeń)

*SongViewPageComponent (Public/Biesiada/Preview)
└── SongViewerComponent
    └── SongDisplayComponent (renderuje wizualnie bloki powtórzeń)
```

## 4. Szczegóły komponentów

### `ChordConverterService` (Modyfikacja)

-   **Opis komponentu:** Istniejący serwis zostanie rozszerzony o logikę obsługi wielowierszowych powtórzeń. Odizoluje złożoną logikę manipulacji stringami od komponentów.
-   **Modyfikacja metod:**
    -   `convertFromChordsOverText(text: string): string` **(Modyfikacja)**: Metoda zostanie rozszerzona o parsowanie nowej składni `xN(L)`. Po wykryciu tego znacznika na końcu linii, metoda będzie musiała cofnąć się o `L` linii i wstawić dyrektywę `{block_start: xN}` na początku bloku, a dyrektywę `{block_end}` na końcu.
    -   `convertToOverText(chordPro: string): string` **(Modyfikacja)**: Metoda zostanie zaktualizowana, aby rozpoznawać dyrektywy `{block_start: xN}` i `{block_end}`. Będzie śledzić stan bloku powtórzenia, aby na końcu bloku (przy dyrektywie `{block_end}`) dodać odpowiedni znacznik `xN(L)` do ostatniej linii tekstu wewnątrz bloku.
-   **Typy:** `string`
-   **Propsy:** Brak.

### `SongEditorComponent` (Modyfikacja)

-   **Opis komponentu:** Logika komponentu zostanie zaktualizowana, aby wykorzystać zmodyfikowany `ChordConverterService`. Będzie przechowywać stan edytora (tekst w formacie uproszczonym) i na bieżąco generować wynik w formacie ChordPro dla podglądu i zapisu.
-   **Główne elementy:** `textarea` dla wprowadzania danych, panel podglądu wykorzystujący `SongDisplayComponent`.
-   **Obsługiwane interakcje:** Wprowadzanie tekstu w `textarea` (`(input)`) będzie na żywo aktualizować podgląd.
-   **Typy:** `SongDto`.

### `SongDisplayComponent` (Modyfikacja)

-   **Opis komponentu:** Komponent zostanie rozbudowany o logikę renderowania bloków powtórzeń. Przed renderowaniem, treść piosenki w formacie ChordPro zostanie przetworzona na wewnętrzną strukturę danych (`SongLineViewModel[]`), która ułatwi logikę w szablonie HTML.
-   **Główne elementy:** Szablon zostanie zaktualizowany, aby na podstawie `SongLineViewModel` renderować dodatkowe elementy `div` (dla pionowej linii) oraz `span` (dla wskaźnika `× N`).
-   **Typy:** `SongLineViewModel` (nowy typ wewnętrzny).
-   **Propsy:** `@Input() content: string` pozostaje bez zmian.

## 5. Typy

Nie są wymagane żadne nowe typy DTO. Zostanie wprowadzony jeden wewnętrzny typ `ViewModel` dla `SongDisplayComponent`.

-   **`SongLineViewModel`**
    ```typescript
    interface SongLineViewModel {
        content: string; // Oryginalna treść linii (po usunięciu dyrektyw)
        isRepeatBlockStart: boolean; // Czy ta linia rozpoczyna blok powtórzenia
        isInRepeatBlock: boolean; // Czy ta linia znajduje się wewnątrz bloku
        isRepeatBlockEnd: boolean; // Czy ta linia kończy blok
        repeatCount: number | null; // Liczba powtórzeń (np. 2 dla "× 2"), tylko dla isRepeatBlockEnd
    }
    ```

## 6. Zarządzanie stanem

Stan w `SongEditorComponent` będzie zarządzany lokalnie przy użyciu sygnałów (`signal` i `computed` z Angulara), co zapewni reaktywność i wydajność.

-   `editorContent = signal<string>('')`: Przechowuje tekst z `textarea` w formacie uproszczonym.
-   `chordProContent = computed(() => this.converterService.convertFromChordsOverText(this.editorContent()))`: Oblicza na bieżąco format ChordPro, który jest przekazywany do podglądu i używany podczas zapisu.
-   Przy ładowaniu piosenki do edycji, jej treść (`song.content`) zostanie jednorazowo przekonwertowana za pomocą `converterService.convertToOverText()` i ustawiona w sygnale `editorContent`.

## 7. Integracja API

Brak zmian. Komponent edytora będzie wysyłał do API (endpoints `POST /songs` i `PATCH /songs/{id}`) treść piosenki w finalnym formacie ChordPro, wygenerowaną przez `ChordConverterService`.

## 8. Interakcje użytkownika

1.  **Organizator edytuje piosenkę:** Wpisuje w polu tekstowym treść, a na końcu ostatniego z czterech wierszy, które chce powtórzyć dwukrotnie, dopisuje `x2(4)`.
2.  **Aplikacja reaguje:**
    -   Sygnał `editorContent` w `SongEditorComponent` zostaje zaktualizowany.
    -   Sygnał `chordProContent` przelicza się, wywołując `converterService.convertFromChordsOverText()`.
    -   Serwis konwertuje `x2(4)` na dyrektywy `{block_start: x2}` (wstawioną 4 linie wyżej) i `{block_end}`.
    -   Panel podglądu (`SongDisplayComponent`) otrzymuje nową treść ChordPro.
    -   `SongDisplayComponent` parsuje treść, identyfikuje 4 linie bloku i renderuje je z pionową linią po prawej stronie oraz wskaźnikiem `× 2` przy ostatniej linii.
3.  **Organizator zapisuje piosenkę:** Aktualna wartość `chordProContent` jest wysyłana na serwer.

## 9. Warunki i walidacja

-   Logika konwersji w `ChordConverterService` będzie oparta na wyrażeniach regularnych, aby zapewnić poprawność składni:
    -   Dla powtórzeń wielowierszowych: `/x(\d+)\((\d+)\)$/` do walidacji i ekstrakcji `N` i `L` z `xN(L)`.
-   Niepoprawna składnia (np. `x2()`, `x(3)`) będzie traktowana jako zwykły tekst i nie zostanie poddana konwersji.
-   Jeśli `L` w `xN(L)` będzie większe niż liczba dostępnych wierszy powyżej, konwersja potraktuje wszystkie poprzedzające wiersze jako blok.

## 10. Obsługa błędów

-   Głównym przypadkiem brzegowym jest niepoprawna struktura dyrektyw w danych pochodzących z bazy (np. brak `{block_end}`).
-   Parser w `SongDisplayComponent` musi być odporny na takie sytuacje. Jeśli napotka `{block_start}` bez zamknięcia, blok powtórzenia będzie renderowany do końca piosenki. Jeśli napotka `{block_end}` bez wcześniejszego otwarcia, dyrektywa zostanie zignorowana.

## 11. Kroki implementacji

1.  **Rozszerzenie serwisu `ChordConverterService`:**
    -   Dodać nowe stałe z wyrażeniami regularnymi dla składni `xN(L)` oraz dyrektyw `{block_start}` i `{block_end}`.
    -   Zmodyfikować logikę `convertFromChordsOverText`, aby obsługiwała nową składnię. Będzie to wymagało przetwarzania linii w kontekście (patrzenia wstecz), a nie tylko pojedynczo.
    -   Zmodyfikować logikę `convertToOverText`, aby poprawnie rekonstruowała składnię `xN(L)` z dyrektyw blokowych. Będzie to wymagało śledzenia stanu (czy parser jest wewnątrz bloku).
    -   Rozszerzyć istniejące testy jednostkowe w `chord-converter.service.spec.ts` o przypadki testowe dla powtórzeń wielowierszowych, w tym scenariusze poprawne i brzegowe.

2.  **Integracja zaktualizowanego serwisu z edytorem:**
    -   Wstrzyknąć `ChordConverterService` do `SongEditorComponent` (jeśli jeszcze nie jest).
    -   Zrefaktoryzować logikę komponentu do użycia sygnałów (`editorContent`, `chordProContent`) do zarządzania stanem tekstu.
    -   Połączyć `textarea` z sygnałem `editorContent`.
    -   Przekazać `chordProContent` do komponentu podglądu.

3.  **Aktualizacja komponentu wyświetlającego:**
    -   Zdefiniować interfejs `SongLineViewModel` w pliku `song-display.component.ts`.
    -   W `SongDisplayComponent` stworzyć prywatną metodę `parseContent(content: string): SongLineViewModel[]`, która przetworzy string ChordPro na tablicę modeli widoku.
    -   Zaktualizować szablon HTML komponentu (`song-display.component.html`), aby iterował po tablicy `SongLineViewModel[]` i używał dyrektyw `@if` do warunkowego dodawania klas CSS i elementów dla bloków powtórzeń.

4.  **Dodanie stylów:**
    -   W pliku `song-display.component.scss` dodać style dla pionowej linii (np. używając `border-right`) oraz dla wskaźnika `× N`.
    -   Użyć zmiennych z palety Angular Material (np. `mat.get-theme-color($theme, secondary-text)`) do kolorowania, zgodnie z wymaganiami.

5.  **Testowanie manualne E2E:**
    -   Przetestować cały przepływ: tworzenie piosenki z powtórzeniami, zapis, ponowną edycję oraz poprawne wyświetlanie we wszystkich trybach (Biesiada, publiczny, podgląd).
