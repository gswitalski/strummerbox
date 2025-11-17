# Plan implementacji widoku Public Song View z przełącznikiem akordów

## 1. Przegląd

Celem jest wdrożenie nowej, kluczowej funkcjonalności w aplikacji StrummerBox, która umożliwi użytkownikom anonimowym ("Biesiadnikom") włączanie i wyłączanie widoczności akordów w publicznym widoku piosenki. Aby zapewnić spójność i reużywalność kodu, zostanie stworzony dedykowany komponent `SongDisplayComponent`, odpowiedzialny za renderowanie treści piosenki w formacie ChordPro. Komponent ten zostanie wykorzystany zarówno w widoku publicznym, jak i w trybie "Biesiada" dla zalogowanego organizatora, co uprości logikę i ujednolici sposób wyświetlania piosenek w całej aplikacji.

## 2. Routing widoku

Implementacja nie wprowadza nowych ścieżek, lecz modyfikuje komponenty obsługujące istniejące:

-   **Publiczny widok piosenki (standalone):** `/public/songs/:publicId`
-   **Publiczny widok piosenki (w ramach repertuaru):** `/public/repertoires/:publicId/songs/:songPublicId`
-   **Widok piosenki w trybie Biesiada (dla Organizatora):** `/biesiada/repertoires/:id/songs/:songId`

## 3. Struktura komponentów

Hierarchia komponentów zostanie zaktualizowana w następujący sposób:

```
- ...
  - PublicSongViewComponent (strona)
    - mat-toolbar (tytuł piosenki)
    - mat-button-toggle-group (przełącznik "Tekst" / "Akordy")
    - stbo-song-display (nowy, reużywalny komponent)
- ...
  - BiesiadaSongViewComponent (strona)
    - mat-toolbar (nawigacja)
    - stbo-song-display (nowy, reużywalny komponent)
    - mat-fab (przycisk QR)
- ...
```

## 4. Szczegóły komponentów

### `SongDisplayComponent` (Nowy)

-   **Opis komponentu:** Reużywalny, "głupi" komponent, którego jedynym zadaniem jest parsowanie i renderowanie treści piosenki w formacie ChordPro. Jego wygląd jest sterowany przez dane wejściowe.
-   **Główne elementy:** Komponent będzie renderował strukturę DIV-ów i SPAN-ów w oparciu o sparsowaną treść. Nie będzie zawierał żadnych złożonych komponentów Angular Material.
-   **Obsługiwane interakcje:** Brak. Komponent jest tylko do wyświetlania.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `SongDisplayVm`.
-   **Propsy (Inputs):**
    -   `content: string | undefined | null` - Treść piosenki w formacie ChordPro.
    -   `showChords: boolean` - Flaga decydująca o wyświetlaniu akordów.

### `PublicSongViewComponent` (Zmodyfikowany)

-   **Opis komponentu:** Komponent-strona odpowiedzialny za pobranie danych piosenki i wyświetlenie ich publicznie. Zostanie zaktualizowany o logikę przełącznika widoczności akordów.
-   **Główne elementy:** `mat-toolbar`, `mat-button-toggle-group`, `stbo-song-display`.
-   **Obsługiwane interakcje:**
    -   Kliknięcie przełącznika "Tekst" / "Akordy" zmienia lokalny stan i tryb wyświetlania komponentu `SongDisplayComponent`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `PublicSongDto`, `PublicRepertoireSongDto`.

### `BiesiadaSongViewComponent` (Zmodyfikowany)

-   **Opis komponentu:** Komponent-strona dla zalogowanego organizatora w trybie "Biesiada". Zostanie zrefaktoryzowany, aby używać nowego, reużywalnego komponentu do wyświetlania treści.
-   **Główne elementy:** `mat-toolbar`, `stbo-song-display`, `mat-fab`.
-   **Obsługiwane interakcje:** Brak zmian w interakcjach użytkownika.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `BiesiadaRepertoireSongDetailDto`.

## 5. Typy

Nie są wymagane żadne nowe typy DTO. Zostanie wprowadzony jeden wewnętrzny typ ViewModelu na potrzeby renderowania.

-   **`SongDisplayVm` (ViewModel):** Struktura danych używana wewnętrznie przez `SongDisplayComponent` do renderowania.
    ```typescript
    // Struktura reprezentująca pojedynczy segment linii (tekst z opcjonalnym akordem)
    type SongSegment = {
        chord: string | null;
        text: string;
    };

    // Struktura reprezentująca całą linię piosenki
    type SongLine = SongSegment[];

    // Główny ViewModel komponentu
    type SongDisplayVm = SongLine[];
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w komponentach za pomocą sygnałów, zgodnie z nowymi standardami Angulara.

-   **`PublicSongViewComponent`:**
    -   Użyje `signal()` do przechowywania danych piosenki pobranych z serwisu.
    -   Użyje `writableSignal<boolean>` do zarządzania stanem przełącznika widoczności akordów.
        ```typescript
        showChords = signal(false); // Domyślnie false
        ```

-   **`SongDisplayComponent`:**
    -   Będzie komponentem bezstanowym (`OnPush`).
    -   Użyje `computed()` do transformacji `content` (string) na `SongDisplayVm` (struktura do renderowania). Sygnał ten będzie automatycznie przeliczany, gdy zmieni się wejściowy `content`.

## 7. Integracja API

Nie są wymagane żadne zmiany w integracji z API. Istniejące endpointy (`GET /public/songs/...`, `GET /me/biesiada/...`) już teraz zwracają pełną treść piosenki w formacie ChordPro w polu `content`. Zmiany dotyczą wyłącznie warstwy prezentacji.

## 8. Interakcje użytkownika

-   **Użytkownik (Biesiadnik) wchodzi na stronę piosenki:**
    -   Widzi domyślnie tylko tekst, bez akordów.
    -   Widzi przełącznik z aktywną opcją "Tekst".
-   **Użytkownik klika opcję "Akordy":**
    -   Lokalny sygnał `showChords` w `PublicSongViewComponent` zmienia wartość na `true`.
    -   Wartość ta jest przekazywana do `SongDisplayComponent`.
    -   Komponent natychmiastowo przerysowuje widok, wyświetlając tekst wraz z akordami.
-   **Użytkownik klika ponownie "Tekst":**
    -   Proces odwrotny, akordy znikają.

## 9. Warunki i walidacja

-   Komponent `SongDisplayComponent` musi być odporny na niepoprawny format ChordPro. W przypadku błędu parsowania (np. niezamknięty nawias), nie powinien przerywać działania, lecz renderować treść w najlepszy możliwy sposób (np. traktując błędny fragment jako zwykły tekst).
-   Komponent powinien poprawnie obsługiwać puste lub niezdefiniowane `content`, nie wyświetlając niczego lub pokazując pusty stan.

## 10. Obsługa błędów

-   **Błąd ładowania danych piosenki:** Obsługa błędów API pozostaje bez zmian w komponentach-rodzicach (`PublicSongViewComponent`, `BiesiadaSongViewComponent`). Powinny one wyświetlać odpowiedni komunikat błędu, jeśli serwis zwróci błąd.
-   **Błąd parsowania ChordPro:** Logika parsowania w `SongDisplayComponent` zostanie zaimplementowana w bloku `try...catch` lub w sposób, który jest odporny na błędy (np. używając wyrażeń regularnych, które nie rzucają wyjątków).

## 11. Kroki implementacji

1.  **Utworzenie `SongDisplayComponent`:**
    -   Wygenerować nowy, samodzielny komponent: `ng g c shared/components/song-display --standalone`.
    -   Dodać prefix `stbo` do selektora: `selector: 'stbo-song-display'`.
    -   Zaimplementować wejścia (`@Input()`) `content` i `showChords`.
    -   Ustawić `changeDetection: ChangeDetectionStrategy.OnPush`.
    -   Stworzyć logikę parsowania ChordPro do struktury `SongDisplayVm` wewnątrz `computed()` sygnału.
    -   Zaimplementować szablon HTML, który renderuje sparsowaną strukturę z użyciem dyrektyw `@if` (dla `showChords`) i `@for`.
    -   Dodać style SCSS do pozycjonowania akordów nad tekstem, korzystając ze zmiennych Angular Material.

2.  **Modyfikacja `PublicSongViewComponent`:**
    -   Zaimportować `SongDisplayComponent` oraz `MatButtonToggleModule`.
    -   W szablonie HTML, usunąć starą logikę wyświetlania treści.
    -   Dodać `mat-button-toggle-group` z opcjami "Tekst" i "Akordy".
    -   Dodać w szablonie `<stbo-song-display>`.
    -   W logice komponentu, stworzyć sygnał `showChords = signal(false)`.
    -   Powiązać wartość przełącznika z sygnałem `showChords`.
    -   Przekazać dane piosenki oraz sygnał `showChords` do propsów komponentu `<stbo-song-display>`.

3.  **Refaktoryzacja `BiesiadaSongViewComponent`:**
    -   Zaimportować `SongDisplayComponent`.
    -   W szablonie HTML, zastąpić istniejącą logikę renderowania piosenki komponentem `<stbo-song-display>`.
    -   Przekazać do komponentu `content` piosenki oraz `showChords` ustawione na sztywno na `true`.
        ```html
        <stbo-song-display [content]="song()?.content" [showChords]="true" />
        ```
