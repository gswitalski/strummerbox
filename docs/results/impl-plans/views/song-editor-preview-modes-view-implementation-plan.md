# Plan implementacji widoku: Tryby podglądu w edytorze piosenek

## 1. Przegląd
Celem jest rozszerzenie istniejącego widoku tworzenia i edycji piosenki (`Song Create/Edit View`) o nową funkcjonalność pozwalającą na przełączanie trybu podglądu. Użytkownik (Organizator) będzie mógł dynamicznie wybierać pomiędzy widokiem surowego formatu ChordPro a renderowanym podglądem w stylu "Biesiada", który dokładnie odzwierciedla finalny wygląd piosenki dla uczestników. Wybór użytkownika będzie zapamiętywany w `localStorage`, aby zapewnić spójne doświadczenie podczas edycji wielu utworów.

## 2. Routing widoku
Zmiany zostaną wprowadzone w istniejących widokach, dostępnych pod następującymi ścieżkami:
-   `/management/songs/new` (tworzenie nowej piosenki)
-   `/management/songs/:id/edit` (edycja istniejącej piosenki)

## 3. Struktura komponentów
Hierarchia komponentów zostanie zaktualizowana w celu wyizolowania logiki podglądu. Główny komponent widoku (`SongEditPageComponent`) będzie zarządzał stanem, a nowy komponent prezentacyjny (`SongEditorPreviewComponent`) będzie odpowiedzialny za wyświetlanie odpowiedniego podglądu.

```
SongEditPageComponent (Komponent inteligentny)
│
├── SongEditFormComponent (Formularz, pole tytułu)
│
├── ChordInputComponent (Edytor tekstu "akordy nad tekstem")
│
└── SongEditorPreviewComponent (Nowy komponent prezentacyjny)
    │
    ├── MatButtonToggleGroup (Przełącznik trybu: "ChordPro" / "Biesiada")
    │
    ├── @if (tryb === 'chordpro')
    │   └── <textarea> (Podgląd surowego tekstu ChordPro)
    │
    └── @if (tryb === 'biesiada')
        └── SongViewerComponent (Podgląd renderowany w stylu "Biesiada")
```

## 4. Szczegóły komponentów
### `SongEditPageComponent` (istniejący, do modyfikacji)
-   **Opis komponentu:** Komponent inteligentny (strona), który zarządza logiką formularza, pobieraniem danych piosenki, zapisywaniem zmian oraz nowym stanem trybu podglądu.
-   **Główne elementy:** Integruje formularz, edytor tekstu oraz nowy `SongEditorPreviewComponent`.
-   **Obsługiwane interakcje:**
    -   Pobieranie danych piosenki do edycji.
    -   Obsługa zmian w formularzu (tytuł, treść).
    -   Zapisywanie nowej lub zaktualizowanej piosenki.
    -   **Nowość:** Odbieranie zdarzenia `modeChange` z `SongEditorPreviewComponent` i aktualizacja stanu trybu podglądu.
    -   **Nowość:** Odczyt i zapis preferowanego trybu podglądu do `localStorage`.
-   **Warunki walidacji:** Tytuł piosenki jest wymagany (istniejąca logika).
-   **Typy:** `SongDto`, `SongEditViewModel`.
-   **Propsy:** Brak (jest to komponent routowalny).

### `SongEditorPreviewComponent` (nowy)
-   **Opis komponentu:** Komponent prezentacyjny odpowiedzialny za wyświetlanie UI panelu podglądu. Zawiera przełącznik trybów i warunkowo renderuje surowy tekst ChordPro lub komponent `SongViewerComponent`.
-   **Główne elementy:** `mat-button-toggle-group`, `textarea` (dla ChordPro), `SongViewerComponent` (dla Biesiada).
-   **Obsługiwane interakcje:**
    -   Kliknięcie na przełącznik trybu emituje zdarzenie `modeChange` z nową wartością.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `SongEditPreviewMode`.
-   **Propsy:**
    -   `@Input() content: string` - Dynamicznie generowana treść piosenki w formacie ChordPro.
    -   `@Input() title: string` - Tytuł piosenki, przekazywany do `SongViewerComponent`.
    -   `@Input() mode: SongEditPreviewMode` - Aktualnie wybrany tryb podglądu.
    -   `@Output() modeChange = new EventEmitter<SongEditPreviewMode>()` - Zdarzenie emitowane przy zmianie trybu.

### `SongViewerComponent` (istniejący, reużywany)
-   **Opis komponentu:** Istniejący komponent prezentacyjny do renderowania piosenki w stylu "Biesiada".
-   **Propsy (konfiguracja):** Zostanie użyty z niestandardowym obiektem konfiguracyjnym, aby ukryć niepotrzebne elementy UI.
    -   `@Input() content: string`
    -   `@Input() title: string`
    -   `@Input() config: SongViewerConfig` - Obiekt konfiguracyjny, który ukryje m.in. kontrolki transpozycji.

## 5. Typy
Do implementacji widoku potrzebne będą następujące typy:

-   **`SongDto` (istniejący):** Standardowy obiekt transferu danych dla piosenki, używany do komunikacji z API.
    ```typescript
    import { SongDto } from '@strummerbox/contracts';
    ```

-   **`SongEditPreviewMode` (nowy):** Typ wyliczeniowy dla trybów podglądu.
    ```typescript
    export type SongEditPreviewMode = 'chordpro' | 'biesiada';
    ```

-   **`SongViewerConfig` (istniejący):** Obiekt konfiguracyjny dla `SongViewerComponent`. Utworzymy specyficzną instancję dla tego widoku.
    ```typescript
    // docs/results/011 High-Level UI Plan.md
    export interface SongViewerConfig {
        showTransposeControls: boolean; // Ustawione na false
        // ... inne opcje
    }
    ```

## 6. Zarządzanie stanem
Stan będzie zarządzany wewnątrz `SongEditPageComponent` przy użyciu sygnałów Angulara.

-   **`previewMode = signal<SongEditPreviewMode>('chordpro')`**:
    -   Główny sygnał przechowujący aktualny tryb podglądu (`'chordpro'` lub `'biesiada'`).
    -   Wartość początkowa będzie odczytywana z `localStorage` przy inicjalizacji komponentu. Jeśli w `localStorage` nie ma zapisanej wartości, domyślnie zostanie użyte `'chordpro'`.
-   **Efekt (`effect`):**
    -   Zostanie użyty do obserwacji zmian w sygnale `previewMode`.
    -   Każda zmiana wartości `previewMode` spowoduje automatyczne zapisanie nowej wartości w `localStorage` pod kluczem, np. `strummerbox:song-editor-preview-mode`.
-   **Abstrakcja `localStorage`:**
    -   Dostęp do `localStorage` zostanie opakowany w prosty, wstrzykiwalny serwis `LocalStorageService`, aby odizolować logikę, ułatwić testowanie i obsłużyć ewentualne błędy (np. gdy `localStorage` jest niedostępny).

## 7. Integracja API
Ta funkjonalność jest w pełni frontendowa i **nie wymaga żadnych zmian ani nowych integracji z API**. Komponent będzie nadal korzystał z istniejących endpointów do pobierania (`GET /songs/:id`) i zapisywania (`POST /songs`, `PATCH /songs/:id`) danych piosenki.

## 8. Interakcje użytkownika
-   **Wejście do edytora:** Aplikacja odczytuje ostatnio używany tryb podglądu z `localStorage` i ustawia go jako aktywny. Jeśli brak zapisu, domyślnym trybem jest "Podgląd ChordPro".
-   **Zmiana trybu podglądu:** Użytkownik klika na przycisk w `mat-button-toggle-group`.
    -   Komponent `SongEditorPreviewComponent` emituje zdarzenie `modeChange`.
    -   `SongEditPageComponent` aktualizuje sygnał `previewMode`.
    -   Efekt zapisuje nową wartość w `localStorage`.
    -   Widok podglądu jest dynamicznie przełączany przy użyciu dyrektywy `@if`.
-   **Edycja treści piosenki:** Niezależnie od wybranego trybu podglądu, zmiany wprowadzane w edytorze są natychmiast odzwierciedlane w panelu podglądu (zarówno w surowym tekście ChordPro, jak i w renderowanym `SongViewerComponent`).

## 9. Warunki i walidacja
Funkcjonalność nie wprowadza nowych warunków walidacji. Istniejące zasady (np. wymagalność tytułu) pozostają bez zmian.

## 10. Obsługa błędów
-   **Problem z `localStorage`:** W przypadku, gdy `localStorage` jest niedostępny (np. wyłączony w przeglądarce), `LocalStorageService` powinien przechwycić błąd i obsłużyć go w sposób "cichy". Aplikacja będzie w pełni funkcjonalna, z tą różnicą, że preferencja trybu podglądu nie będzie zapamiętywana między sesjami, a domyślnym trybem zawsze będzie 'chordpro'.

## 11. Kroki implementacji
1.  **Utworzenie serwisu `LocalStorageService`:**
    -   Stworzyć prosty serwis z metodami `getItem(key)` i `setItem(key, value)`.
    -   Obie metody opakować w bloki `try...catch` w celu obsługi błędów.
2.  **Utworzenie typu `SongEditPreviewMode`:**
    -   Zdefiniować typ `export type SongEditPreviewMode = 'chordpro' | 'biesiada';` w odpowiednim pliku z modelami.
3.  **Utworzenie komponentu `SongEditorPreviewComponent`:**
    -   Zdefiniować `Inputs` (`content`, `title`, `mode`) i `Outputs` (`modeChange`).
    -   W szablonie HTML dodać `mat-button-toggle-group` powiązany z wejściem `mode` i emitujący zdarzenie `modeChange`.
    -   Dodać logikę warunkowego renderowania (`@if`) dla `textarea` oraz `SongViewerComponent`.
    -   Przygotować stałą konfigurację `SongViewerConfig` z `showTransposeControls: false` i przekazać ją do `SongViewerComponent`.
4.  **Modyfikacja `SongEditPageComponent`:**
    -   Wstrzyknąć `LocalStorageService`.
    -   Dodać do stanu komponentu sygnał `previewMode = signal<SongEditPreviewMode>('chordpro')`.
    -   W `ngOnInit` odczytać wartość z `localStorage` i zainicjować sygnał `previewMode`.
    -   Dodać `effect`, który będzie obserwował `previewMode` i zapisywał jego zmiany w `localStorage`.
    -   Zaimplementować metodę do obsługi zdarzenia `modeChange` z komponentu dziecka, która będzie aktualizować sygnał `previewMode`.
5.  **Aktualizacja szablonu `SongEditPageComponent`:**
    -   Zastąpić dotychczasowy panel podglądu nowym komponentem `<stbo-song-editor-preview>`.
    -   Przekazać do niego wymagane `Inputs` (dynamicznie generowany `content` z formularza, `title` oraz `previewMode` z sygnału) i podpiąć obsługę `Output` (`modeChange`).
6.  **Testowanie:**
    -   Sprawdzić, czy domyślny tryb to "ChordPro".
    -   Zweryfikować, czy przełączanie trybów działa poprawnie.
    -   Upewnić się, że `SongViewerComponent` nie wyświetla kontrolek transpozycji.
    -   Sprawdzić, czy wybór trybu jest poprawnie zapisywany w `localStorage` i odtwarzany po odświeżeniu strony.
    -   Przetestować scenariusz z wyłączonym `localStorage`.
