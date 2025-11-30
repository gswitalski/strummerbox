# Plan implementacji widoku Podgląd Piosenki

## 1. Przegląd

Widok "Podgląd Piosenki" to nowa, chroniona strona przeznaczona dla zalogowanego Organizatora. Jej głównym celem jest umożliwienie szybkiego wyświetlenia pełnej wersji piosenki z akordami oraz przetestowania funkcji transpozycji bez konieczności przechodzenia do trybu "Biesiada" lub edycji. Widok ten jest dostępny bezpośrednio z listy piosenek i stanowi kluczowy element usprawniający zarządzanie biblioteką utworów, zgodnie z historyjką użytkownika US-027.

## 2. Routing widoku

Nowy widok będzie dostępny pod dynamiczną ścieżką routingu, która zawiera identyfikator piosenki jako parametr.

-   **Ścieżka:** `/management/songs/:id/preview`
-   **Ochrona:** Dostęp do tej ścieżki będzie chroniony przez `AuthGuard`, zapewniając, że tylko zalogowani użytkownicy (Organizatorzy) mogą ją otworzyć.

## 3. Struktura komponentów

Architektura widoku opiera się na ponownym wykorzystaniu istniejących komponentów prezentacyjnych, co zapewnia spójność wizualną i funkcjonalną z resztą aplikacji.

```
- SongPreviewPageComponent (Komponent inteligentny, strona)
  - SongViewerComponent (Komponent prezentacyjny)
    - MatToolbar
      - Przycisk "Zamknij" (mat-button)
      - TransposeControlsComponent
    - SongDisplayComponent
    - MatProgressBar (dla stanu ładowania)
    - ErrorDisplayComponent (dla stanu błędu)
```

## 4. Szczegóły komponentów

### SongPreviewPageComponent (nowy)

-   **Opis komponentu:** Jest to "inteligentny" komponent-strona, odpowiedzialny za logikę widoku. Jego zadania obejmują pobranie ID piosenki z adresu URL, komunikację z API w celu pobrania danych piosenki, zarządzanie stanem (ładowanie, błąd, dane) oraz obsługę interakcji użytkownika (zmiana transpozycji, zamknięcie widoku).
-   **Główne elementy:** Komponent będzie renderował reużywalny `<stbo-song-viewer>`, przekazując do niego wszystkie wymagane dane i konfigurację.
-   **Obsługiwane zdarzenia:**
    -   `transposeChanged(offset: number)`: Odbierane z `SongViewerComponent`, aktualizuje lokalny stan transpozycji.
    -   `closeClicked()`: Odbierane z `SongViewerComponent`, wywołuje nawigację powrotną do listy piosenek.
-   **Warunki walidacji:** Brak walidacji po stronie klienta. Komponent polega na obsłudze błędów z API (np. 404, gdy piosenka nie istnieje).
-   **Typy:** `SongDto`, `SongPreviewState` (ViewModel).

### SongListComponent (modyfikacja)

-   **Opis komponentu:** Istniejący komponent wyświetlający listę piosenek Organizatora.
-   **Główne elementy:** Do tabeli (`mat-table`) lub listy kart (`mat-card`) w kolumnie "Akcje" zostanie dodany nowy przycisk.
    -   `<button mat-icon-button [routerLink]="['/management/songs', song.id, 'preview']">
            <mat-icon>visibility</mat-icon>
        </button>`
-   **Obsługiwane zdarzenia:** Kliknięcie w nową ikonę spowoduje nawigację do widoku podglądu.
-   **Typy:** `SongSummaryDto`

### SongViewerComponent (reużywany)

-   **Opis komponentu:** Istniejący, wysoce konfigurowalny komponent prezentacyjny, który zostanie użyty do wyświetlenia interfejsu podglądu.
-   **Propsy (interfejs wejściowy):**
    -   `status: 'loading' | 'success' | 'error'`
    -   `song: SongDto | null`
    -   `transposeOffset: number`
    -   `config: SongViewerConfig` (obiekt konfiguracyjny, który w tym przypadku ustawi `showCloseButton: true` i `showTransposeControls: true`).

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO oraz zostanie stworzony nowy, wewnętrzny typ ViewModel do zarządzania stanem.

-   **`SongDto` (DTO, z `@strummerbox/contracts`):** Obiekt transferu danych reprezentujący pełne dane piosenki pobrane z API.
    ```typescript
    export type SongDto = {
        id: string;
        title: string;
        content: string; // Zawartość w formacie ChordPro
        // ...inne pola
    };
    ```
-   **`SongPreviewState` (ViewModel):** Interfejs opisujący strukturę stanu zarządzanego przez sygnał w `SongPreviewPageComponent`.
    ```typescript
    interface SongPreviewState {
        status: 'loading' | 'success' | 'error';
        song: SongDto | null;
        error: string | null;
        transposeOffset: number;
    }
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane wewnątrz `SongPreviewPageComponent` z wykorzystaniem sygnałów (Angular Signals), zgodnie z przyjętymi standardami projektu.

-   Zostanie utworzony jeden główny, zapisywalny sygnał: `state = signal<SongPreviewState>(...)`.
-   **Stan początkowy:** `{ status: 'loading', song: null, error: null, transposeOffset: 0 }`.
-   **Aktualizacje stanu:**
    -   Po pomyślnym pobraniu danych z API: `state.update(s => ({ ...s, status: 'success', song: data }))`.
    -   W przypadku błędu API: `state.update(s => ({ ...s, status: 'error', error: '...' }))`.
    -   Po zmianie transpozycji: `state.update(s => ({ ...s, transposeOffset: newOffset }))`.
-   **Sygnały pochodne (computed signals):** Zostaną użyte do przekazania prostych wartości do komponentu `SongViewerComponent`, np. `status = computed(() => state().status)`.

## 7. Integracja API

Integracja z backendem będzie polegać na wykorzystaniu istniejącego endpointu do pobierania szczegółów piosenki.

-   **Endpoint:** `GET /api/songs/:id`
-   **Serwis:** Zostanie wykorzystana istniejąca metoda w `SongService`, np. `getSong(id: string): Observable<SongDto>`.
-   **Przepływ:**
    1.  `SongPreviewPageComponent` w `ngOnInit` pobiera `id` z `ActivatedRoute`.
    2.  Wywołuje `songService.getSong(id)`.
    3.  Subskrybuje odpowiedź, aktualizując sygnał `state` w zależności od wyniku (sukces lub błąd).
-   **Typy żądania i odpowiedzi:**
    -   Żądanie: Brak (ID przekazywane w URL).
    -   Odpowiedź (sukces): `SongDto`.
    -   Odpowiedź (błąd): `ErrorResponseDto`.

## 8. Interakcje użytkownika

-   **Użytkownik klika ikonę "Podgląd" na liście piosenek:**
    -   **Reakcja systemu:** Aplikacja nawiguje do `/management/songs/:id/preview`. Wyświetlany jest wskaźnik ładowania, a następnie treść piosenki.
-   **Użytkownik klika przyciski `+` / `-` w kontrolkach transpozycji:**
    -   **Reakcja systemu:** `SongViewerComponent` emituje zdarzenie `transposeChanged`. `SongPreviewPageComponent` aktualizuje `transposeOffset` w swoim stanie. `SongDisplayComponent` natychmiast renderuje treść z przesuniętymi akordami.
-   **Użytkownik klika przycisk "Zamknij":**
    -   **Reakcja systemu:** `SongViewerComponent` emituje zdarzenie `closeClicked`. `SongPreviewPageComponent` używa `Router` do nawigacji z powrotem na stronę `/management/songs`.

## 9. Warunki i walidacja

Jedynym warunkiem jest uwierzytelnienie użytkownika, co jest weryfikowane na poziomie routingu przez `AuthGuard`. Widok nie implementuje żadnej logiki walidacyjnej formularzy. Poprawność ID piosenki i uprawnienia do jej wyświetlenia są weryfikowane po stronie API.

## 10. Obsługa błędów

Komponent musi być przygotowany na obsługę potencjalnych błędów API.

-   **Scenariusz:** Użytkownik próbuje otworzyć podgląd dla piosenki, która nie istnieje lub do której nie ma dostępu.
-   **Odpowiedź API:** `404 Not Found` lub `403 Forbidden`.
-   **Obsługa:** `SongPreviewPageComponent` przechwytuje błąd, ustawia `state.status` na `'error'` i zapisuje komunikat błędu. `SongViewerComponent` (korzystając z `ErrorDisplayComponent`) wyświetla użytkownikowi czytelną informację, np. "Nie znaleziono piosenki" lub "Wystąpił błąd podczas ładowania danych".

## 11. Kroki implementacji

1.  **Modyfikacja `SongListComponent`:**
    -   W pliku szablonu (`song-list.component.html`) dodać nowy `mat-icon-button` z ikoną `visibility` i dyrektywą `routerLink` do `/management/songs/:id/preview`.
2.  **Routing:**
    -   W odpowiednim pliku routingu (np. `management-routes.ts`) dodać nową ścieżkę:
        ```typescript
        {
            path: 'songs/:id/preview',
            loadComponent: () => import('./pages/song-preview/song-preview-page.component'),
            canActivate: [authGuard] // lub istniejący guard
        }
        ```
3.  **Utworzenie `SongPreviewPageComponent`:**
    -   Wygenerować nowy, samodzielny komponent: `ng g c pages/song-preview-page --standalone`.
    -   Zaimplementować logikę pobierania `id` z `ActivatedRoute`.
    -   Wstrzyknąć `SongService` i `Router`.
    -   Zaimplementować sygnał `state` do zarządzania stanem widoku.
    -   W `ngOnInit` wywołać metodę pobierającą dane piosenki i zaktualizować stan.
    -   Stworzyć metody do obsługi zdarzeń `transposeChanged` i `closeClicked`.
4.  **Implementacja szablonu `SongPreviewPageComponent`:**
    -   Dodać `<stbo-song-viewer>` do szablonu.
    -   Zbindować wszystkie wymagane `Inputs` (`[status]`, `[song]`, `[transposeOffset]`, `[config]`) do wartości z sygnałów.
    -   Podpiąć obsługę `Outputs` (`(transposeChanged)`, `(closeClicked)`) do metod w komponencie.
5.  **Testowanie:**
    -   Sprawdzić poprawność nawigacji z listy piosenek.
    -   Zweryfikować, czy dane piosenki ładują się poprawnie.
    -   Przetestować działanie kontrolek transpozycji.
    -   Sprawdzić działanie przycisku "Zamknij".
    -   Przetestować obsługę błędów dla nieistniejącego ID piosenki.
