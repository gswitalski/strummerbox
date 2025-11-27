# Plan implementacji widoku – Transpozycja Ad-Hoc

## 1. Przegląd

Celem jest implementacja funkcjonalności transpozycji akordów w czasie rzeczywistym w widokach piosenek. Funkcjonalność ta będzie w pełni realizowana po stronie klienta, bez zmian w API. Użytkownicy (zarówno anonimowi "Biesiadnicy", jak i zalogowani "Organizatorzy") otrzymają narzędzia do dynamicznej zmiany tonacji piosenki. Wprowadzone zostaną nowy, reużywalny komponent kontrolek oraz modyfikacje w istniejącej architekturze komponentów widoku piosenki w celu zapewnienia spójnego i elastycznego działania.

## 2. Routing widoku

Zmiany nie wprowadzają nowych ścieżek routingu. Modyfikacje dotyczą istniejących widoków komponentów-rodziców, które są dostępne pod następującymi ścieżkami:

-   **Publiczny widok piosenki**: `/public/songs/:publicId` oraz `/public/repertoires/:publicId/songs/:songPublicId`
-   **Widok piosenki w trybie Biesiada**: `/biesiada/repertoires/:id/songs/:songId`

## 3. Struktura komponentów

Architektura opiera się na rozbudowie istniejącej struktury z jednym nowym komponentem. Stan i logika będą zarządzane w komponentach nadrzędnych (stronach), podczas gdy komponenty podrzędne będą czysto prezentacyjne.

```
// Struktura dla Publicznego Widoku Piosenki i Trybu Biesiada
[PageComponent] (PublicSongPageComponent | BiesiadaSongPageComponent) // Komponent "Smart"
└── SongViewerComponent // Komponent "Dumb"
    ├── MatToolbar
    │   ├── (opcjonalnie) MatButtonToggleGroup ("Tekst" / "Akordy")
    │   └── TransposeControlsComponent (Nowy) // Komponent "Dumb"
    └── SongDisplayComponent // Komponent "Dumb"
```

## 4. Szczegóły komponentów

### TransposeControlsComponent (Nowy)

-   **Opis komponentu**: Mały, reużywalny, w pełni prezentacyjny komponent, który dostarcza interfejs do zmiany wartości transpozycji. Składa się z dwóch przycisków (`mat-icon-button`) z ikonami `-` i `+` oraz wyświetlacza tekstowego pokazującego aktualne przesunięcie (np. "+2", "-1", "0").
-   **Główne elementy**:
    -   `button[mat-icon-button]` z ikoną `remove` do dekrementacji.
    -   `span` do wyświetlania sformatowanej wartości `offset`.
    -   `button[mat-icon-button]` z ikoną `add` do inkrementacji.
-   **Obsługiwane interakcje**:
    -   Kliknięcie przycisku `-`: emituje zdarzenie `change` z wartością `offset - 1`.
    -   Kliknięcie przycisku `+`: emituje zdarzenie `change` z wartością `offset + 1`.
-   **Propsy (interfejs komponentu)**:
    -   `@Input() offset: number`: Aktualna wartość przesunięcia tonacji.
    -   `@Output() change = new EventEmitter<number>()`: Emituje nową wartość przesunięcia po interakcji użytkownika.
-   **Selektor**: `stbo-transpose-controls`
-   **Tryb**: `standalone: true`

### SongViewerComponent (Zmodyfikowany)

-   **Opis komponentu**: Istniejący komponent prezentacyjny, który zostanie rozszerzony o możliwość wyświetlania i obsługi kontrolek transpozycji.
-   **Główne elementy (zmiany)**:
    -   Warunkowe renderowanie komponentu `<stbo-transpose-controls>` wewnątrz `mat-toolbar`.
-   **Obsługiwane zdarzenia (zmiany)**:
    -   Nasłuchuje na zdarzenie `(change)` z `TransposeControlsComponent` i propaguje je na zewnątrz poprzez własne zdarzenie `(transposeChanged)`.
-   **Propsy (interfejs komponentu - zmiany)**:
    -   `@Input() transposeOffset: number`: Przyjmuje aktualny offset transpozycji i przekazuje go do `TransposeControlsComponent`.
    -   `@Input() config: SongViewerConfig`: Obiekt konfiguracyjny, rozszerzony o flagę `showTransposeControls: boolean`.
    -   `@Output() transposeChanged = new EventEmitter<number>()`: Nowe zdarzenie emitowane po zmianie wartości transpozycji.

### SongDisplayComponent (Zmodyfikowany)

-   **Opis komponentu**: Komponent odpowiedzialny za logikę renderowania treści piosenki. Zostanie zaktualizowany, aby faktycznie wykorzystywać istniejący `transposeOffset` do transponowania akordów przed wyświetleniem.
-   **Logika wewnętrzna**:
    -   Wykorzysta `computed` signal do transformacji treści piosenki.
    -   Jeśli `showChords` jest `false`, usunie akordy.
    -   Jeśli `showChords` jest `true`, użyje `TransposeService` do przetworzenia `content` z uwzględnieniem `transposeOffset`.
-   **Propsy (interfejs komponentu)**:
    -   `@Input() transposeOffset: number`: Przyjmuje aktualny offset transpozycji (prop już istnieje, teraz zostanie użyty).

## 5. Typy

Jedyny typ, który wymaga modyfikacji, to interfejs konfiguracyjny dla `SongViewerComponent`.

```typescript
// src/app/shared/components/song-viewer/song-viewer.config.ts

export interface SongViewerConfig {
    showChordsToggle: boolean;
    showTransposeControls: boolean; // <-- NOWA WŁAŚCIWOŚĆ
    showQrButton: boolean;
    titleLocation: 'toolbar' | 'content';
}
```

## 6. Zarządzanie stanem

Stan transpozycji jest stanem lokalnym, zarządzanym w obrębie komponentów-rodziców (stron) i nie wymaga globalnego store'a (np. NgRx). Do zarządzania stanem zostaną użyte sygnały Angulara (`signal`).

-   **W `PublicSongPageComponent`**:
    -   `showChords = signal(false);`
    -   `transposeOffset = signal(0);`
-   **W `BiesiadaSongPageComponent`**:
    -   `transposeOffset = signal(0);`

Zmiana wartości sygnału `transposeOffset` w komponencie nadrzędnym automatycznie spowoduje ponowne przeliczenie i wyrenderowanie transponowanej treści w `SongDisplayComponent` dzięki reaktywności sygnałów.

## 7. Integracja API

**Brak zmian w integracji API.** Funkcjonalność jest w 100% realizowana po stronie klienta. Aplikacja będzie korzystać z istniejących endpointów do pobierania danych o piosenkach, a następnie operować na otrzymanej treści (`content`).

## 8. Interakcje użytkownika

-   **Biesiadnik (widok publiczny)**:
    1.  Domyślnie widzi tylko tekst. Kontrolki transpozycji są ukryte.
    2.  Klika przełącznik "Akordy".
    3.  Na ekranie pojawiają się akordy oraz, obok przełącznika, kontrolki `TransposeControlsComponent` (`- 0 +`).
    4.  Klika `+`. Licznik zmienia się na `+1`, a wszystkie akordy w tekście są natychmiast transponowane o jeden półton w górę.
    5.  Klika przełącznik "Tekst". Akordy oraz kontrolki transpozycji znikają.

-   **Organizator (tryb Biesiada)**:
    1.  Domyślnie widzi tekst z akordami. Kontrolki `TransposeControlsComponent` są widoczne od początku.
    2.  Klika `-`. Licznik zmienia się na `-1`, a akordy są natychmiast transponowane o jeden półton w dół.

## 9. Warunki i walidacja

Walidacja dotyczy logiki po stronie klienta.

-   **Logika transpozycji**: `TransposeService` musi być odporny na niepoprawne formaty wewnątrz nawiasów kwadratowych (np. `[komentarz]`). W takim przypadku powinien zwracać oryginalny ciąg znaków bez modyfikacji i bez generowania błędu.
-   **Zakres transpozycji**: Można rozważyć ograniczenie zakresu `offset` np. od -12 do +12, aby uniknąć niepotrzebnie dużych wartości, chociaż matematycznie (modulo 12) nie ma to wpływu na wynik.

## 10. Obsługa błędów

Obsługa błędów związanych z pobieraniem danych o piosence pozostaje bez zmian. Nowa logika transpozycji nie powinna wprowadzać nowych scenariuszy błędów krytycznych dla aplikacji. Ewentualne błędy parsowania akordów będą obsługiwane "cicho" (przez ignorowanie nieprawidłowych fragmentów), aby nie zakłócać działania interfejsu.

## 11. Kroki implementacji

1.  **Stworzenie `TransposeService`**:
    -   Utworzyć nowy serwis (`ng g s core/services/transpose`).
    -   Zaimplementować w nim logikę transpozycji pojedynczego akordu oraz całej treści piosenki. Należy uwzględnić akordy z `#` i `b`, akordy molowe, septymowe, z przewrotami basowymi itp.
    -   Dodać testy jednostkowe dla serwisu, pokrywające różne przypadki akordów.

2.  **Utworzenie `TransposeControlsComponent`**:
    -   Wygenerować nowy, samodzielny komponent (`ng g c shared/components/transpose-controls --standalone`).
    -   Zaimplementować szablon z przyciskami i wyświetlaczem, używając komponentów Angular Material (`mat-icon-button`, `mat-icon`).
    -   Dodać logikę wejść (`@Input`) i wyjść (`@Output`).

3.  **Aktualizacja `SongViewerComponent`**:
    -   Zmodyfikować interfejs `SongViewerConfig`, dodając pole `showTransposeControls`.
    -   Zaktualizować propsy komponentu, dodając `transposeOffset` i `transposeChanged`.
    -   W szablonie komponentu dodać `<stbo-transpose-controls>` z odpowiednimi dyrektywami warunkowymi (`@if`) i powiązaniami danych.

4.  **Aktualizacja `SongDisplayComponent`**:
    -   Wstrzyknąć `TransposeService`.
    -   Zaimplementować logikę z użyciem `computed` signal, która na podstawie `content`, `showChords` i `transposeOffset` będzie zwracać przetworzoną treść piosenki do wyświetlenia.

5.  **Aktualizacja `PublicSongPageComponent`**:
    -   Dodać do komponentu sygnały do zarządzania stanem: `showChords` i `transposeOffset`.
    -   Zaktualizować przekazywaną konfigurację i propsy do `<stbo-song-viewer>`.
    -   Zaimplementować metody do obsługi zdarzeń `(chordsToggled)` i `(transposeChanged)`.

6.  **Aktualizacja `BiesiadaSongPageComponent`**:
    -   Dodać sygnał `transposeOffset`.
    -   Zaktualizować przekazywaną konfigurację i propsy do `<stbo-song-viewer>`.
    -   Zaimplementować metodę do obsługi zdarzenia `(transposeChanged)`.
