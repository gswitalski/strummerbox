# Plan implementacji widoku - Dostosowanie wielkości czcionki

## 1. Przegląd
Celem jest wdrożenie funkcjonalności pozwalającej użytkownikom na dynamiczną zmianę wielkości czcionki w widokach piosenek (publicznym oraz w trybie "Biesiada"). Funkcjonalność zostanie zrealizowana poprzez dodanie nowego, reużywalnego komponentu z trzema predefiniowanymi opcjami rozmiaru. Wybór użytkownika będzie zapisywany w `localStorage`, aby zapewnić spójne doświadczenie przy kolejnych wizytach. Implementacja jest w całości po stronie klienta i nie wymaga zmian w API.

## 2. Routing widoku
Funkcjonalność nie wprowadza nowych tras. Zostanie zintegrowana z istniejącymi widokami, które używają `SongViewerComponent`:
-   **Publiczny widok piosenki:** `/public/songs/:publicId`
-   **Publiczny widok piosenki w repertuarze:** `/public/repertoires/:publicId/songs/:songPublicId`
-   **Widok piosenki w trybie Biesiada:** `/biesiada/repertoires/:id/songs/:songId`

## 3. Struktura komponentów
Hierarchia komponentów pozostaje w dużej mierze niezmieniona, ale zostanie rozszerzona o nowy komponent. Zmiany dotkną istniejące komponenty w celu przekazywania stanu i obsługi zdarzeń.

```
- [STRONA] PublicSongPageComponent | BiesiadaSongViewPageComponent (Komponenty Smart)
  - Zarządza stanem `fontSize`.
  - Wstrzykuje i używa `FontSizeService` do interakcji z localStorage.
  - Nasłuchuje na zdarzenie (fontSizeChanged) z SongViewerComponent.
  
  - <stbo-song-viewer>
    - Przyjmuje [fontSize] jako @Input.
    - Emituje (fontSizeChanged) jako @Output.

    - <mat-toolbar>
      - <stbo-font-size-controls> (Nowy Komponent Prezentacyjny)
        - Przyjmuje [selectedSize] jako @Input.
        - Emituje (sizeChanged) jako @Output.

    - <stbo-song-display>
      - Przyjmuje [fontSize] jako @Input.
      - Aplikuje odpowiednią klasę CSS do swojego hosta.
```

## 4. Szczegóły komponentów

### `FontSizeControlsComponent` (Nowy)
-   **Opis komponentu:** Reużywalny, w pełni sterowalny komponent prezentacyjny, który wyświetla trzy przyciski do wyboru wielkości czcionki. Nie posiada własnej logiki ani stanu wewnętrznego.
-   **Główne elementy:**
    -   `mat-button-toggle-group` jako kontener.
    -   Trzy elementy `mat-button-toggle`, każdy z wartością: `'small'`, `'medium'`, `'large'`.
    -   Wewnątrz każdego przycisku `<span>` ze stylizowaną literą "A", aby wizualnie reprezentować rozmiar.
-   **Obsługiwane interakcje:**
    -   `selectionChange`: Zdarzenie z `mat-button-toggle-group`, które emituje nową wybraną wartość.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FontSize` (`'small' | 'medium' | 'large'`).
-   **Propsy (API komponentu):**
    -   `@Input() selectedSize: FontSize;`
    -   `@Output() sizeChanged = new EventEmitter<FontSize>();`

### `SongViewerComponent` (Aktualizacja)
-   **Opis komponentu:** Główny kontener UI dla widoku piosenki. Zostanie zaktualizowany, aby zintegrować `FontSizeControlsComponent` i przekazywać stan dotyczący rozmiaru czcionki w dół hierarchii.
-   **Główne elementy:**
    -   W `mat-toolbar` zostanie dodany `<stbo-font-size-controls>`.
-   **Obsługiwane interakcje:**
    -   Nasłuchuje na zdarzenie `(sizeChanged)` z `FontSizeControlsComponent` i propaguje je na zewnątrz przez własne zdarzenie `(fontSizeChanged)`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FontSize`.
-   **Propsy (API komponentu) - nowe/zmienione:**
    -   `@Input() fontSize: FontSize;`
    -   `@Output() fontSizeChanged = new EventEmitter<FontSize>();`

### `SongDisplayComponent` (Aktualizacja)
-   **Opis komponentu:** Komponent odpowiedzialny za renderowanie treści piosenki. Zostanie zaktualizowany, aby dynamicznie zmieniać wielkość czcionki na podstawie otrzymanego propa.
-   **Główne elementy:** Bez zmian w szablonie HTML. Zmiany w logice i stylach komponentu.
-   **Obsługiwane interakcje:** Brak.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FontSize`.
-   **Propsy (API komponentu) - nowe/zmienione:**
    -   `@Input() fontSize: FontSize;`

## 5. Typy
Wprowadzony zostanie jeden kluczowy typ oraz stała do zarządzania opcjami.

```typescript
// src/app/shared/models/font-size.model.ts

/**
 * Reprezentuje możliwe do wyboru wielkości czcionki.
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Definiuje strukturę opcji wielkości czcionki.
 */
export interface FontSizeOption {
  key: FontSize;
  value: string; // Wartość CSS, np. '1rem'
  label: string; // Etykieta dla przycisku, np. 'A'
}

/**
 * Mapa konfiguracji dla dostępnych wielkości czcionek.
 */
export const FONT_SIZE_OPTIONS: Record<FontSize, FontSizeOption> = {
  small: { key: 'small', value: '1rem', label: 'A' },
  medium: { key: 'medium', value: '1.3rem', label: 'A' },
  large: { key: 'large', value: '1.6rem', label: 'A' },
};
```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane na poziomie komponentów "smart" (stron) przy użyciu sygnałów Angulara, a logika interakcji z `localStorage` zostanie wyizolowana w dedykowanym serwisie.

-   **`FontSizeService` (Nowy serwis):**
    -   **Cel:** Abstrakcja odczytu i zapisu ustawień wielkości czcionki w `localStorage`. Zapewnia pojedyncze źródło prawdy i czystość w komponentach.
    -   **Metody:**
        -   `getFontSize(): FontSize`: Odczytuje wartość z `localStorage`. Jeśli wartość nie istnieje lub jest nieprawidłowa, zwraca domyślne `'small'`.
        -   `setFontSize(size: FontSize): void`: Zapisuje podaną wartość w `localStorage`.
    -   Serwis będzie dostarczony w `root` (`providedIn: 'root'`), aby zapewnić jedną instancję w całej aplikacji.
    -   Implementacja powinna zawierać obsługę błędów na wypadek, gdyby `localStorage` było niedostępne.

-   **Stan w komponencie Smart:**
    -   Każdy komponent-strona (`PublicSongPageComponent`, `BiesiadaSongViewPageComponent`) będzie posiadał sygnał do przechowywania aktualnie wybranej wielkości czcionki.
    -   `fontSize = signal<FontSize>(this.fontSizeService.getFontSize());`
    -   Metoda obsługująca zdarzenie z `SongViewerComponent` będzie aktualizować sygnał i wywoływać `fontSizeService.setFontSize()`.

## 7. Integracja API
Brak. Funkcjonalność jest w 100% frontendowa.

## 8. Interakcje użytkownika
1.  **Użytkownik wchodzi na stronę piosenki:**
    -   Komponent strony inicjalizuje swój stan, pobierając zapisaną wielkość czcionki (lub domyślną) za pomocą `FontSizeService`.
    -   Wartość jest przekazywana w dół do `SongViewerComponent` i `FontSizeControlsComponent`.
    -   `SongDisplayComponent` renderuje tekst z odpowiednią wielkością czcionki.
2.  **Użytkownik klika przycisk zmiany rozmiaru (np. na "duży"):**
    -   `FontSizeControlsComponent` emituje zdarzenie `(sizeChanged)` z wartością `'large'`.
    -   `SongViewerComponent` przechwytuje to zdarzenie i emituje własne `(fontSizeChanged)` z tą samą wartością.
    -   Komponent strony (smart) przechwytuje zdarzenie `(fontSizeChanged)`.
    -   Handler w komponencie strony:
        -   Aktualizuje swój sygnał `fontSize` na `'large'`.
        -   Wywołuje `fontSizeService.setFontSize('large')`, aby zapisać wybór.
    -   Zmiana sygnału powoduje ponowne renderowanie komponentów z nową wartością `fontSize`, co natychmiastowo zmienia wygląd tekstu na ekranie.

## 9. Warunki i walidacja
-   **Walidacja w `FontSizeService`:** Serwis podczas odczytu z `localStorage` powinien weryfikować, czy zapisana wartość jest jedną z dozwolonych (`'small'`, `'medium'`, `'large'`). W przypadku niepowodzenia walidacji, powinien zwrócić wartość domyślną (`'small'`).

## 10. Obsługa błędów
-   **Błąd dostępu do `localStorage`:** Metody w `FontSizeService` (`getFontSize`, `setFontSize`) powinny być owinięte w bloki `try...catch`. W przypadku wystąpienia błędu (np. `localStorage` jest wyłączone w przeglądarce), operacja powinna zakończyć się niepowodzeniem w sposób cichy. Aplikacja będzie nadal działać, a zmiana rozmiaru czcionki będzie możliwa w ramach bieżącej sesji, ale wybór nie zostanie zapisany.

## 11. Kroki implementacji
1.  **Utworzenie typów:** Stworzyć plik `src/app/shared/models/font-size.model.ts` i zdefiniować w nim typ `FontSize` oraz stałą `FONT_SIZE_OPTIONS`.
2.  **Implementacja `FontSizeService`:**
    -   Utworzyć plik `src/app/core/services/font-size.service.ts`.
    -   Zaimplementować serwis z metodami `getFontSize` i `setFontSize` oraz obsługą błędów `localStorage`.
3.  **Implementacja `FontSizeControlsComponent`:**
    -   Wygenerować nowy, samodzielny komponent: `ng g c shared/components/font-size-controls --standalone`.
    -   Zaimplementować szablon HTML z `mat-button-toggle-group`.
    -   Dodać logikę `@Input` i `@Output` w pliku `.ts`.
    -   Dodać style SCSS do wizualnego rozróżnienia przycisków (różne rozmiary litery "A").
4.  **Aktualizacja `SongDisplayComponent`:**
    -   Dodać `@Input() fontSize: FontSize;`.
    -   Użyć host binding (`@HostBinding`) do dynamicznego dodawania klas CSS (np. `font-size-small`, `font-size-medium`) do hosta komponentu.
    -   W pliku SCSS komponentu zdefiniować style dla tych klas, ustawiając odpowiednią `font-size`.
5.  **Aktualizacja `SongViewerComponent`:**
    -   Dodać `@Input() fontSize: FontSize;` oraz `@Output() fontSizeChanged`.
    -   Zaimportować i umieścić `FontSizeControlsComponent` w szablonie HTML wewnątrz `mat-toolbar`.
    -   Połączyć wejścia i wyjścia nowego komponentu (przekazać `fontSize` i nasłuchiwać na `sizeChanged`).
6.  **Aktualizacja komponentów "Smart" (np. `PublicSongPageComponent`):**
    -   Wstrzyknąć `FontSizeService`.
    -   Zadeklarować sygnał `fontSize` i zainicjalizować go wartością z serwisu.
    -   W szablonie, w miejscu użycia `<stbo-song-viewer>`, powiązać `[fontSize]` z sygnałem i nasłuchiwać na `(fontSizeChanged)`.
    -   Zaimplementować metodę obsługującą `(fontSizeChanged)`, która aktualizuje sygnał i wywołuje `fontSizeService.setFontSize()`.
7.  **Powtórzenie kroku 6:** Zastosować te same zmiany we wszystkich pozostałych komponentach "smart", które korzystają z `SongViewerComponent` (np. `BiesiadaSongViewPageComponent`).
