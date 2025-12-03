# Plan implementacji: Szybki powrót do Dashboardu z trybu Biesiada

## 1. Przegląd

Celem wdrożenia jest implementacja funkcjonalności "szybkiego wyjścia" z trybu Biesiada, zgodnie z historyjką użytkownika US-031. Umożliwi to Organizatorowi natychmiastowy powrót do głównego panelu zarządzania (`/dashboard`) z dowolnego ekranu w trybie Biesiada za pomocą dedykowanego przycisku "Zamknij". Zmiany obejmą modyfikację trzech istniejących widoków oraz jednego komponentu reużywalnego.

## 2. Routing widoku

Nie są tworzone żadne nowe ścieżki routingu. Modyfikacje zostaną wprowadzone w następujących, istniejących widokach chronionych:

*   `/biesiada/repertoires` (Lista repertuarów w trybie Biesiada)
*   `/biesiada/repertoires/:id` (Lista piosenek w repertuarze, tryb Biesiada)
*   `/biesiada/repertoires/:id/songs/:songId` (Widok piosenki w trybie Biesiada)

## 3. Struktura komponentów

Zmiany dotkną następujących komponentów:

```
- BiesiadaRepertoireListPageComponent (komponent-strona, modyfikacja)
  - MatToolbar
    - MatIconButton (nowy przycisk "Zamknij")

- BiesiadaRepertoireSongListPageComponent (komponent-strona, modyfikacja)
  - MatToolbar
    - MatIconButton (istniejący przycisk "Wstecz")
    - MatIconButton (nowy przycisk "Zamknij")

- BiesiadaRepertoireSongDetailPageComponent (komponent-strona, modyfikacja)
  - SongViewerComponent (komponent prezentacyjny, modyfikacja)
    - MatToolbar
      - MatIconButton (istniejący przycisk "Wstecz")
      - MatIconButton (nowy, opcjonalny przycisk "Zamknij")
```

## 4. Szczegóły komponentów

### `BiesiadaRepertoireListPageComponent` (modyfikacja)

*   **Opis komponentu:** "Inteligentny" komponent-strona, wyświetlający listę repertuarów w trybie Biesiada. Jego pasek narzędzi (`mat-toolbar`) zostanie zmodyfikowany.
*   **Główne elementy:**
    *   `mat-toolbar`: W jego lewej części zostanie dodany `mat-icon-button` z ikoną `close`.
*   **Obsługiwane zdarzenia:**
    *   `(click)` na przycisku "Zamknij": Uruchamia nawigację do ścieżki `/dashboard`.
*   **Warunki walidacji:** Brak.
*   **Typy:** `BiesiadaRepertoireSummaryDto[]`.
*   **Propsy:** Brak.

### `BiesiadaRepertoireSongListPageComponent` (modyfikacja)

*   **Opis komponentu:** "Inteligentny" komponent-strona, wyświetlający listę piosenek w ramach wybranego repertuaru w trybie Biesiada.
*   **Główne elementy:**
    *   `mat-toolbar`:
        *   Po lewej stronie pozostaje istniejący `mat-icon-button` z ikoną `arrow_back`.
        *   Po prawej stronie zostanie dodany `mat-icon-button` z ikoną `close`. Do oddzielenia przycisków zostanie użyty `<span>` z `flex: 1 1 auto`.
*   **Obsługiwane zdarzenia:**
    *   `(click)` na przycisku "Zamknij": Uruchamia nawigację do `/dashboard`.
    *   `(click)` na przycisku "Wstecz": Zachowuje dotychczasową funkcjonalność powrotu do listy repertuarów.
*   **Warunki walidacji:** Brak.
*   **Typy:** `BiesiadaRepertoireSongEntryDto[]`.
*   **Propsy:** Brak.

### `BiesiadaRepertoireSongDetailPageComponent` (modyfikacja)

*   **Opis komponentu:** "Inteligentny" komponent-strona, który pobiera dane piosenki i konfiguruje reużywalny `SongViewerComponent`. Będzie odpowiedzialny za przekazanie nowej konfiguracji oraz obsługę zdarzenia wyjścia.
*   **Główne elementy:**
    *   `stbo-song-viewer`: Komponent potomny, który otrzyma nową konfigurację.
*   **Obsługiwane zdarzenia:**
    *   `(exitClicked)` od `SongViewerComponent`: Komponent będzie nasłuchiwał na to zdarzenie i w odpowiedzi uruchamiał nawigację do `/dashboard`.
*   **Warunki walidacji:** Brak.
*   **Typy:** `BiesiadaRepertoireSongDetailDto`, `SongViewerConfig`.
*   **Propsy:** Brak.

### `SongViewerComponent` (modyfikacja)

*   **Opis komponentu:** Reużywalny komponent prezentacyjny do wyświetlania piosenki. Zostanie rozszerzony o możliwość wyświetlania przycisku "Zamknij".
*   **Główne elementy:**
    *   `mat-toolbar`: Wewnątrz, z prawej strony, zostanie dodany warunkowo renderowany (`@if`) `mat-icon-button` z ikoną `close`.
*   **Obsługiwane zdarzenia:**
    *   `@Output() exitClicked = new EventEmitter<void>()`: Nowe zdarzenie emitowane po kliknięciu przycisku "Zamknij".
*   **Warunki walidacji:** Brak.
*   **Typy:** `SongViewerConfig`.
*   **Propsy:**
    *   `@Input() config: SongViewerConfig`: Istniejący (lub do stworzenia) obiekt wejściowy. Zostanie rozszerzony o nową, opcjonalną właściwość `showExitButton: boolean`.

## 5. Typy

Wprowadzony zostanie jeden nowy typ/interfejs (lub zmodyfikowany istniejący) dla celów konfiguracyjnych.

```typescript
// src/app/shared/models/song-viewer.models.ts

/**
 * Konfiguracja określająca, które elementy UI mają być widoczne
 * w komponencie SongViewerComponent.
 */
export interface SongViewerConfig {
    // ...istniejące właściwości, np. showTransposeControls, showFontSizeControls
    
    /**
     * Określa, czy w prawym górnym rogu paska narzędzi
     * ma być widoczny przycisk "Zamknij" (ikona 'close').
     * @default false
     */
    showExitButton?: boolean;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem dla tej funkcjonalności opiera się wyłącznie na mechanizmach routingu Angulara. Nie ma potrzeby wprowadzania nowych serwisów, sygnałów czy złożonych mechanizmów zarządzania stanem. Nawigacja będzie realizowana poprzez wstrzyknięcie serwisu `Router` (`inject(Router)`) w odpowiednich komponentach.

## 7. Integracja API

Zmiany nie wymagają żadnej integracji z API. Funkcjonalność jest w 100% po stronie klienta.

## 8. Interakcje użytkownika

1.  **Użytkownik na liście repertuarów Biesiady (`/biesiada/repertoires`):**
    *   **Akcja:** Klika przycisk "Zamknij" (ikona `close`) w lewym górnym rogu.
    *   **Rezultat:** Zostaje przekierowany na stronę `/dashboard`.
2.  **Użytkownik na liście piosenek Biesiady (`/biesiada/repertoires/:id`):**
    *   **Akcja:** Klika przycisk "Zamknij" (ikona `close`) w prawym górnym rogu.
    *   **Rezultat:** Zostaje przekierowany na stronę `/dashboard`.
    *   **Akcja 2:** Klika przycisk "Wstecz" (ikona `arrow_back`) w lewym górnym rogu.
    *   **Rezultat 2:** Zostaje przekierowany z powrotem na listę repertuarów Biesiady (`/biesiada/repertoires`).
3.  **Użytkownik na widoku piosenki Biesiady (`/biesiada/repertoires/:id/songs/:songId`):**
    *   **Akcja:** Klika przycisk "Zamknij" (ikona `close`) w prawym górnym rogu.
    *   **Rezultat:** Zostaje przekierowany na stronę `/dashboard`.
    *   **Akcja 2:** Klika przycisk "Wstecz" (ikona `arrow_back`) w lewym górnym rogu.
    *   **Rezultat 2:** Zostaje przekierowany z powrotem na listę piosenek Biesiady (`/biesiada/repertoires/:id`).

## 9. Warunki i walidacja

Jedynym warunkiem jest uwierzytelnienie użytkownika. Jest to już zapewnione przez `CanActivate` guard na ścieżkach `/biesiada/*`, co gwarantuje, że opisane widoki i przyciski będą dostępne tylko dla zalogowanego Organizatora.

## 10. Obsługa błędów

Funkcjonalność nie wprowadza nowych scenariuszy błędów. Potencjalne błędy nawigacji będą obsługiwane przez standardowe mechanizmy Angular Router.

## 11. Kroki implementacji

1.  **Aktualizacja `SongViewerComponent`:**
    *   Zdefiniuj (lub zaktualizuj) interfejs `SongViewerConfig` w `src/app/shared/models/`, dodając pole `showExitButton?: boolean`.
    *   W pliku `song-viewer.component.ts` dodaj `@Input() config: SongViewerConfig` oraz `@Output() exitClicked = new EventEmitter<void>()`.
    *   W szablonie `song-viewer.component.html`, wewnątrz `mat-toolbar`, dodaj przycisk:
        ```html
        @if (config?.showExitButton) {
          <button mat-icon-button (click)="exitClicked.emit()">
            <mat-icon>close</mat-icon>
          </button>
        }
        ```
    *   Upewnij się, że przycisk jest umieszczony po prawej stronie toolbara.

2.  **Aktualizacja `BiesiadaRepertoireSongDetailPageComponent`:**
    *   W szablonie, podczas wywołania `<stbo-song-viewer>`, przekaż nową konfigurację: `[config]="songViewerConfig"`.
    *   W logice komponentu (`.ts`), zdefiniuj `songViewerConfig`: `public songViewerConfig: SongViewerConfig = { showExitButton: true, ... };`.
    *   Dodaj obsługę zdarzenia: `(exitClicked)="navigateToDashboard()"`.
    *   Zaimplementuj metodę `navigateToDashboard()`, która użyje `this.router.navigate(['/dashboard'])`.

3.  **Aktualizacja `BiesiadaRepertoireSongListPageComponent`:**
    *   W szablonie komponentu, w `mat-toolbar`, dodaj `mat-icon-button` z ikoną `close` i obsługą zdarzenia `(click)`, które wywoła metodę nawigującą do `/dashboard`.
    *   Użyj pustego `<span>` z `style="flex: 1 1 auto;"` pomiędzy przyciskiem "Wstecz" a przyciskiem "Zamknij", aby rozmieścić je na przeciwnych końcach toolbara.

4.  **Aktualizacja `BiesiadaRepertoireListPageComponent`:**
    *   W szablonie komponentu, w `mat-toolbar`, dodaj `mat-icon-button` z ikoną `close` na początku (po lewej stronie).
    *   Dodaj obsługę zdarzenia `(click)`, która wywoła metodę nawigującą do `/dashboard`.

