# Plan implementacji widoku listy repertuarów

## 1. Przegląd
Widok "Lista Repertuarów" jest kluczowym elementem panelu zarządzania, przeznaczonym dla uwierzytelnionych użytkowników (Organizatorów). Jego głównym celem jest umożliwienie przeglądania, wyszukiwania i zarządzania własną biblioteką repertuarów. Widok ten będzie spójny wizualnie i funkcjonalnie z istniejącym widokiem listy piosenek, oferując responsywny interfejs, który na większych ekranach wyświetla dane w formie tabeli, a na urządzeniach mobilnych jako lista kart. Zapewni on podstawowe operacje CRUD poprzez opcje edycji, usuwania oraz funkcję udostępniania.

## 2. Routing widoku
Widok będzie dostępny pod chronioną ścieżką, dostępną tylko dla zalogowanych użytkowników.
- **Ścieżka:** `/management/repertoires`

## 3. Struktura komponentów
Struktura będzie opierać się na jednym komponencie "smart" (`RepertoireListPageComponent`), który zarządza stanem i logiką, oraz jednym komponencie "presentational" (`RepertoireListComponent`), odpowiedzialnym za wyświetlanie danych.

```
RepertoireListPageComponent (Smart)
│
├── RepertoireListComponent (Presentational)
│   ├── MatTable (dla widoku desktopowego)
│   └── MatCard[] (dla widoku mobilnego)
│
├── MatPaginator
│
├── EmptyStateComponent (wyświetlany, gdy brak danych)
│
└── MatProgressSpinner (wyświetlany podczas ładowania)
```

## 4. Szczegóły komponentów

### `RepertoireListPageComponent` (Container)
- **Opis komponentu:** Główny komponent strony, odpowiedzialny za zarządzanie stanem (ładowanie, błędy, paginacja, sortowanie, wyszukiwanie), komunikację z `RepertoireListService` oraz obsługę wszystkich interakcji użytkownika.
- **Główne elementy:**
    -   Nagłówek (`<h1>`) z tytułem "Repertuary".
    -   Przycisk `mat-raised-button` ("Dodaj repertuar") nawigujący do strony tworzenia.
    -   Pole `mat-form-field` do wyszukiwania repertuarów.
    -   Komponent `<stbo-repertoire-list>` do wyświetlania danych.
    -   Komponent `<mat-paginator>` do obsługi paginacji.
    -   Komponent `<stbo-empty-state>`, gdy lista jest pusta.
    -   Obsługa stanu ładowania i błędów.
- **Obsługiwane interakcje:**
    -   `onSearchChange(term: string)`: Aktualizuje stan wyszukiwania (z debouncingiem).
    -   `onPageChange(event: PageEvent)`: Aktualizuje stan paginacji.
    -   `onSortChange(sort: Sort)`: Aktualizuje stan sortowania.
    -   `onDeleteRepertoire(repertoireId: string)`: Otwiera dialog potwierdzający i wywołuje usługę usuwania.
    -   `onEditRepertoire(repertoireId: string)`: Nawiguje do strony edycji repertuaru.
    -   `onShareRepertoire(repertoireId: string)`: Otwiera dialog udostępniania.
    -   `navigateToCreateRepertoire()`: Nawiguje do strony tworzenia repertuaru.
    -   `retryLoad()`: Ponawia próbę załadowania danych w przypadku błędu.
- **Typy:** `RepertoireListState`, `RepertoireSummaryVM`.
- **Propsy:** Brak (komponent routowalny).

### `RepertoireListComponent` (Presentation)
- **Opis komponentu:** Reużywalny komponent do wyświetlania listy repertuarów. Działa w dwóch trybach (tabela/karty) w zależności od szerokości ekranu. Jest w pełni sterowany przez propsy i emituje zdarzenia.
- **Główne elementy:**
    -   Logika `@if` do przełączania między widokiem tabeli a kartami.
    -   `mat-table` z kolumnami: "Nazwa", "Liczba piosenek", "Utworzono", "Zaktualizowano", "Status", "Akcje".
    -   Pętla `@for` renderująca `mat-card` dla widoku mobilnego.
    -   Przyciski `mat-icon-button` dla akcji (edycja, usuwanie, udostępnianie).
- **Obsługiwane interakcje (jako `@Output`):**
    -   `editRepertoire = new EventEmitter<string>()`
    -   `deleteRepertoire = new EventEmitter<string>()`
    -   `shareRepertoire = new EventEmitter<string>()`
    -   `sortChange = new EventEmitter<Sort>()`
- **Typy:** `RepertoireSummaryVM`, `Sort`.
- **Propsy (`@Input`):**
    -   `repertoires: RepertoireSummaryVM[]`
    -   `isLoading: boolean`
    -   `currentSort: { active: RepertoireListSortField; direction: 'asc' | 'desc' }`

## 5. Typy

### DTO (Data Transfer Object)
Pobierane bezpośrednio z `packages/contracts/types.ts`:
-   `RepertoireSummaryDto`: Reprezentuje pojedynczy repertuar w liście.
-   `RepertoireListResponseDto`: Reprezentuje odpowiedź API z paginowaną listą repertuarów.

### ViewModel
Nowy, niestandardowy typ na potrzeby widoku, zapewniający odpowiednie formatowanie danych.
-   **`RepertoireSummaryVM`**:
    ```typescript
    export interface RepertoireSummaryVM {
        id: string;
        name: string;
        songCount: number;
        createdAt: string; // Sformatowana data, np. '23.10.2025'
        updatedAt: string; // Sformatowana data
        isPublished: boolean;
    }
    ```

### Typy dla serwisu i stanu
-   **`RepertoireListSortField`**: `'name' | 'createdAt' | 'updatedAt' | 'publishedAt'`
-   **`RepertoireListQueryParams`**: Interfejs dla parametrów zapytania do serwisu.
-   **`RepertoireListState`**: Interfejs opisujący kompletny stan widoku zarządzany w `RepertoireListPageComponent`.

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane lokalnie w `RepertoireListPageComponent` przy użyciu sygnałów (`signals`) z Angulara, zgodnie z wzorcem zaimplementowanym w `SongListPageComponent`.

-   **Główny sygnał stanu:**
    `private readonly state: WritableSignal<RepertoireListState> = signal({...});`
-   **Sygnały wyzwalające (`trigger signals`):**
    -   `paginationState`: Przechowuje aktualną stronę i rozmiar strony.
    -   `searchQueryState`: Przechowuje finalny (po debounce) termin wyszukiwania.
    -   `sortState`: Przechowuje aktywne pole i kierunek sortowania.
    -   `refreshState`: Inkrementowany, aby wymusić ponowne załadowanie danych.
-   **Efekt (`effect`):** Będzie obserwował zmiany w sygnałach wyzwalających i automatycznie wywoływał metodę `loadRepertoires`, aby pobrać aktualne dane z serwera.
-   **Sygnały pochodne (`computed signals`):** Zostaną użyte do wyliczania wartości takich jak `isLoading`, `hasResults`, `shouldShowEmptyState` na podstawie głównego sygnału stanu.

## 7. Integracja API
Zostanie stworzony nowy serwis `RepertoireListService`, analogiczny do `SongListService`.

-   **Serwis:** `RepertoireListService`
-   **Metody:**
    -   `fetchRepertoires(params: RepertoireListQueryParams): Promise<RepertoireListResponseDto>`
        -   Wysyła żądanie `GET` na endpoint `/functions/v1/repertoires`.
        -   Buduje `HttpParams` na podstawie `params`, w tym `page`, `pageSize`, `search`, `sort` (np. `-createdAt`) oraz `includeCounts=true`.
        -   Dołącza token autoryzacyjny do nagłówka.
    -   `deleteRepertoire(repertoireId: string): Promise<void>`
        -   Wysyła żądanie `DELETE` na endpoint `/functions/v1/repertoires/{repertoireId}`.
-   **Mapowanie danych:** W `RepertoireListPageComponent` znajdzie się funkcja `mapRepertoireDtoToViewModel`, która przekształci `RepertoireSummaryDto` z API na `RepertoireSummaryVM` używany przez komponenty.

## 8. Interakcje użytkownika
-   **Wyszukiwanie:** Użytkownik wpisuje tekst w polu wyszukiwania. Po 300ms bezczynności (`debounce`) wywoływane jest zapytanie do API.
-   **Sortowanie:** Użytkownik klika na nagłówek kolumny w tabeli. Wywoływane jest zdarzenie `sortChange`, które aktualizuje `sortState` i odświeża dane.
-   **Paginacja:** Użytkownik zmienia stronę lub rozmiar strony. Zdarzenie `page` aktualizuje `paginationState`, co prowadzi do pobrania nowej strony danych.
-   **Usuwanie:** Użytkownik klika ikonę kosza. Otwiera się `ConfirmationDialog`. Po potwierdzeniu, wywoływana jest metoda `deleteRepertoire`. Po sukcesie, lista jest odświeżana, a użytkownik widzi `MatSnackBar` z potwierdzeniem.
-   **Edycja:** Kliknięcie ikony edycji przekierowuje użytkownika na stronę `/management/repertoires/:id/edit`.

## 9. Warunki i walidacja
Walidacja w tym widoku dotyczy głównie parametrów przesyłanych do API:
-   **Paginacja:** `page` musi być liczbą całkowitą >= 0. `pageSize` musi być jedną z predefiniowanych wartości (np. 10, 20, 50).
-   **Sortowanie:** Kierunek sortowania może być tylko `asc` lub `desc`. Pole sortowania musi należeć do dozwolonego zbioru (`RepertoireListSortField`). Domyślne sortowanie zostanie ustawione na "data utworzenia, malejąco".
-   **Wyszukiwanie:** Wyszukiwana fraza jest trimowana przed wysłaniem do API.

## 10. Obsługa błędów
-   **Błąd pobierania listy:** Jeśli `fetchRepertoires` zakończy się błędem, stan `error` w komponencie zostanie ustawiony. Użytkownik zobaczy komunikat o błędzie oraz przycisk "Spróbuj ponownie".
-   **Błąd usuwania:** Jeśli `deleteRepertoire` się nie powiedzie, zostanie wyświetlony `MatSnackBar` z informacją o błędzie, a stan aplikacji pozostanie niezmieniony.
-   **Brak autoryzacji (401):** Globalny `HttpInterceptor` powinien przechwycić ten błąd i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:**
    -   Stworzenie folderu `src/app/pages/repertoire-list`.
    -   Wewnątrz, utworzenie podfolderów `components`, `services` oraz `repertoire-list-page`.
    -   Dodanie nowej ścieżki `/management/repertoires` do `app.routes.ts`, leniwie ładując `RepertoireListPageComponent`.

2.  **Implementacja serwisu (`RepertoireListService`):**
    -   Stworzenie pliku `repertoire-list.service.ts`.
    -   Zaimplementowanie metod `fetchRepertoires` i `deleteRepertoire` z użyciem `HttpClient` i `SupabaseService` do pobierania tokenu (na wzór `SongListService`).

3.  **Implementacja komponentu `RepertoireListComponent`:**
    -   Stworzenie plików `.ts`, `.html`, `.scss`.
    -   Zdefiniowanie `Input`-ów (`repertoires`, `isLoading`, `currentSort`) i `Output`-ów.
    -   Zaimplementowanie logiki responsywnej z `BreakpointObserver` do przełączania między tabelą a kartami.
    -   Stworzenie szablonu HTML dla tabeli (`mat-table`) i kart (`mat-card`).

4.  **Implementacja komponentu `RepertoireListPageComponent`:**
    -   Stworzenie plików `.ts`, `.html`, `.scss`.
    -   Zdefiniowanie sygnałów dla stanu (`state`), paginacji, sortowania, wyszukiwania i odświeżania.
    -   Implementacja `effect`-u do ładowania danych na podstawie zmian w sygnałach.
    -   Implementacja metody `loadRepertoires`, która wywołuje serwis i aktualizuje stan.
    -   Implementacja publicznych metod do obsługi zdarzeń (np. `onPageChange`, `onDeleteRepertoire`).
    -   Stworzenie szablonu HTML, który łączy wszystkie elementy: filtry, listę, paginator, stany ładowania/błędu/pustego.

5.  **Aktualizacja typów i modeli:**
    -   Zdefiniowanie `RepertoireSummaryVM` i innych potrzebnych typów lokalnych.
    -   Stworzenie funkcji mapującej `mapRepertoireDtoToViewModel`.

6.  **Integracja z modułami i routingiem:**
    -   Upewnienie się, że wszystkie potrzebne moduły Angular Material są importowane w odpowiednich komponentach.
    -   Dodanie nowej strony do nawigacji bocznej w `DefaultLayoutComponent`.
