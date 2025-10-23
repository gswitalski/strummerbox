# Plan implementacji widoku Lista Piosenek (Song List View)

## 1. Przegląd
Widok "Lista Piosenek" jest kluczowym elementem panelu zarządzania dla zalogowanego Organizatora. Jego głównym celem jest umożliwienie użytkownikowi przeglądania, wyszukiwania i zarządzania swoją prywatną biblioteką piosenek. Widok ten będzie wyświetlał listę wszystkich piosenek dodanych przez Organizatora i zapewniał szybki dostęp do akcji takich jak edycja, usuwanie i udostępnianie. Zgodnie z planem UI, widok będzie w pełni responsywny, prezentując dane w formie tabeli na urządzeniach stacjonarnych i jako lista kart na urządzeniach mobilnych.

## 2. Routing widoku
Widok będzie dostępny pod chronioną ścieżką, dostępną wyłącznie dla zalogowanych użytkowników.

-   **Ścieżka:** `/management/songs`
-   **Guard:** Widok powinien być chroniony przez `AuthGuard` (`CanActivate`), który przekieruje niezalogowanych użytkowników do strony logowania (`/login`).

## 3. Struktura komponentów
Hierarchia komponentów została zaprojektowana w celu oddzielenia logiki biznesowej (smart component) od prezentacji (dumb components).

```
SongListPageComponent (Komponent trasowany, Smart)
├── Wyszukiwarka (mat-form-field)
├── MatProgressSpinner (wyświetlany podczas ładowania)
├── SongListComponent (Komponent prezentacyjny, Dumb)
│   ├── MatTable (dla widoku desktopowego)
│   └── MatCard (dla widoku mobilnego, w pętli *ngFor)
├── MatPaginator (dla obsługi paginacji)
└── EmptyStateComponent (wyświetlany, gdy lista jest pusta)
```

## 4. Szczegóły komponentów

### `SongListPageComponent`
-   **Opis komponentu:** Główny, "inteligentny" komponent widoku. Odpowiada za zarządzanie stanem (paginacja, sortowanie, wyszukiwanie), komunikację z API za pośrednictwem `SongListService` oraz koordynację wszystkich podkomponentów.
-   **Główne elementy:** Kontener dla pozostałych komponentów, logika w pliku TypeScript.
-   **Obsługiwane interakcje:**
    -   Zmiana strony w paginatorze.
    -   Zmiana liczby elementów na stronie.
    -   Zmiana kryteriów sortowania (w tabeli).
    -   Wprowadzanie tekstu w polu wyszukiwania (z debouncingiem).
    -   Obsługa prośby o usunięcie piosenki (otwarcie modala potwierdzającego).
-   **Obsługiwana walidacja:** Brak walidacji po stronie formularza; komponent zarządza parametrami zapytania do API.
-   **Typy:** `SongListState` (ViewModel), `SongListResponseDto` (DTO).
-   **Propsy:** Brak (komponent trasowany).

### `SongListComponent`
-   **Opis komponentu:** "Głupi" komponent prezentacyjny, odpowiedzialny wyłącznie za wyświetlanie listy piosenek. Renderuje dane w formie tabeli (`mat-table`) lub kart (`mat-card`) w zależności od rozmiaru ekranu.
-   **Główne elementy:** `mat-table`, `mat-header-row`, `mat-row`, `mat-card`, przyciski akcji (`mat-icon-button`).
-   **Obsługiwane interakcje:** Emituje zdarzenia w odpowiedzi na akcje użytkownika.
    -   `(editSong): string` - emituje ID piosenki do edycji.
    -   `(deleteSong): string` - emituje ID piosenki do usunięcia.
    -   `(shareSong): string` - emituje ID piosenki do udostępnienia.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `SongSummaryVM[]`.
-   **Propsy:**
    -   `@Input() songs: SongSummaryVM[]` - lista piosenek do wyświetlenia.
    -   `@Input() isLoading: boolean` - flaga informująca o stanie ładowania.

### `EmptyStateComponent` (współdzielony)
-   **Opis komponentu:** Reużywalny komponent wyświetlany, gdy API zwraca pustą listę piosenek.
-   **Główne elementy:** Ikona, tekst informacyjny, przycisk CTA ("Dodaj nową piosenkę").
-   **Obsługiwane interakcje:**
    -   `(ctaClick)` - emituje zdarzenie po kliknięciu przycisku.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:**
    -   `@Input() message: string`
    -   `@Input() buttonText: string`

## 5. Typy
Do implementacji widoku potrzebne będą następujące modele danych:

-   **DTO (Data Transfer Object) - zgodne z API:**
    -   `SongListResponseDto`: Obiekt odpowiedzi z API, zawiera listę piosenek i metadane paginacji.
        -   `items: SongSummaryDto[]`
        -   `page: number`
        -   `pageSize: number`
        -   `total: number`
    -   `SongSummaryDto`: Obiekt reprezentujący pojedynczą piosenkę na liście.
        -   `id: string`
        -   `title: string`
        -   `createdAt: string`
        -   `updatedAt: string`
        -   `publishedAt: string | null`

-   **ViewModel (VM) - używane w szablonach komponentów:**
    -   **`SongSummaryVM`**: Model widoku dla piosenki, przygotowany do wyświetlania.
        -   `id: string` - Do nawigacji i identyfikacji.
        -   `title: string` - Tytuł piosenki.
        -   `createdAt: string` - Sformatowana data utworzenia (np. "15.10.2025").
        -   `updatedAt: string` - Sformatowana data modyfikacji.
        -   `isPublished: boolean` - Flaga statusu publikacji, do wyświetlania ikony.
    -   **`SongListState`**: Interfejs reprezentujący kompletny stan widoku.
        -   `songs: SongSummaryVM[]`
        -   `totalCount: number`
        -   `currentPage: number` (indeks 0-based dla `mat-paginator`)
        -   `pageSize: number`
        -   `searchTerm: string`
        -   `sort: { active: string; direction: 'asc' | 'desc' }`
        -   `isLoading: boolean`
        -   `error: string | null`

## 6. Zarządzanie stanem
Stan widoku będzie zarządzany wewnątrz `SongListPageComponent` przy użyciu reaktywnego podejścia z RxJS, co zapewni czytelność i łatwość w zarządzaniu złożonymi interakcjami.

1.  **Źródła zmian stanu:** Stworzone zostaną `BehaviorSubject` lub `Subject` dla każdej interakcji użytkownika, która wywołuje ponowne pobranie danych:
    -   `pagination$ = new BehaviorSubject<{pageIndex: number, pageSize: number}>({ ... })`
    -   `searchTerm$ = new BehaviorSubject<string>('')`
    -   `sort$ = new BehaviorSubject<{active: string, direction: 'asc' | 'desc'}>({ ... })`
    -   `refresh$ = new Subject<void>()` (do ręcznego odświeżania, np. po usunięciu elementu).

2.  **Pobieranie danych:** Strumień `Observable<SongSummaryVM[]>` zostanie utworzony przez połączenie powyższych źródeł za pomocą `combineLatest`. Każda zmiana w którymkolwiek z tych strumieni wywoła operator `switchMap`, który anuluje poprzednie zapytanie HTTP i wykona nowe z aktualnymi parametrami.

3.  **Serwis:** Zostanie utworzony `SongListService` z metodą `getSongs(params: GetSongsParams): Observable<SongListResponseDto>`, która będzie hermetyzować logikę `HttpClient`.

## 7. Integracja API
Integracja z backendem będzie realizowana poprzez dedykowany serwis `SongListService`.

-   **Pobieranie listy piosenek:**
    -   **Endpoint:** `GET /songs`
    -   **Typy żądania:** Parametry zapytania (`page`, `pageSize`, `search`, `sort`) zostaną dynamicznie zbudowane na podstawie aktualnego stanu widoku (`SongListState`).
    -   **Typy odpowiedzi:** `Observable<SongListResponseDto>`. Serwis zwróci bezpośrednio odpowiedź z API, a komponent mapuje DTO na ViewModel.

-   **Usuwanie piosenki:**
    -   **Endpoint:** `DELETE /songs/{id}`
    -   **Typy żądania:** `id` piosenki jako parametr ścieżki.
    -   **Typy odpowiedzi:** `Observable<void>` lub odpowiednik sukcesu/porażki.

## 8. Interakcje użytkownika
-   **Wyszukiwanie:** Wprowadzanie tekstu w `mat-form-field` aktualizuje `searchTerm$`. Operator `debounceTime(300)` zostanie użyty, aby zapytania nie były wysyłane przy każdym naciśnięciu klawisza.
-   **Paginacja:** Zdarzenie `(page)` z komponentu `MatPaginator` zaktualizuje `pagination$`.
-   **Sortowanie:** Zdarzenie `(sortChange)` z dyrektywy `MatSort` zaktualizuje `sort$`.
-   **Usuwanie:** Kliknięcie ikony "usuń" wywoła metodę w `SongListPageComponent`, która otworzy `ConfirmationDialogComponent`. Po potwierdzeniu przez użytkownika, zostanie wywołana metoda usuwająca w serwisie, a po jej sukcesie zostanie wywołane `refresh$.next()`.
-   **Edycja:** Kliknięcie ikony "edytuj" spowoduje nawigację do ścieżki `/management/songs/{id}/edit` przy użyciu `Router.navigate()`.

## 9. Warunki i walidacja
Walidacja dotyczy głównie parametrów zapytania do API i jest zarządzana w `SongListPageComponent`.
-   **`page` i `pageSize`**: Wartości z `MatPaginator` są domyślnie poprawne (nieujemne liczby całkowite). Należy pamiętać o konwersji `pageIndex` (0-based) na `page` (1-based) dla API.
-   **`pageSize`**: Opcje w `MatPaginator` (`pageSizeOptions`) zostaną ograniczone do wartości akceptowanych przez API, np. `[10, 20, 50]`.
-   **`search`**: Wartość z pola tekstowego, bez dodatkowej walidacji po stronie klienta poza ewentualnym `trim()`.

## 10. Obsługa błędów
-   **Błędy sieci i serwera (5xx):** W subskrypcji do strumienia danych w komponencie zostanie użyty blok `catchError`. W przypadku błędu `isLoading` zostanie ustawione na `false`, a `error` w stanie na odpowiedni komunikat. W szablonie zostanie wyświetlony komunikat błędu.
-   **Błąd autoryzacji (401):** Globalny `HttpInterceptor` powinien przechwycić ten błąd, wylogować użytkownika i przekierować go na stronę logowania.
-   **Błąd usuwania piosenki:** Metoda obsługująca usuwanie będzie miała własną obsługę błędów. W przypadku niepowodzenia zostanie wyświetlony komunikat `MatSnackBar` informujący o problemie.

## 11. Kroki implementacji
1.  **Utworzenie plików komponentów:** Wygenerowanie `SongListPageComponent` i `SongListComponent` za pomocą Angular CLI.
2.  **Routing:** Dodanie nowej ścieżki `/management/songs` do modułu routingu, przypisanie jej do `SongListPageComponent` i zabezpieczenie `AuthGuard`.
3.  **Serwis API:** Stworzenie `SongListService` z metodami `getSongs` i `deleteSong`, wykorzystującymi `HttpClient`.
4.  **Implementacja `SongListPageComponent`:**
    -   Zdefiniowanie interfejsu stanu `SongListState`.
    -   Implementacja reaktywnej logiki z RxJS do zarządzania stanem i pobierania danych.
    -   Dodanie logiki do obsługi zdarzeń od komponentów podrzędnych (paginacja, sortowanie, usuwanie).
    -   Stworzenie szablonu HTML, który będzie zawierał `SongListComponent`, `MatPaginator` i `EmptyStateComponent`.
5.  **Implementacja `SongListComponent`:**
    -   Zdefiniowanie `@Input` dla `songs` i `isLoading` oraz `@Output` dla akcji.
    -   Stworzenie szablonu HTML z `mat-table` dla widoku desktopowego.
    -   Stworzenie szablonu z `*ngFor` i `mat-card` dla widoku mobilnego.
    -   Użycie `BreakpointObserver` z Angular CDK do przełączania się między szablonami.
6.  **Stylowanie:** Dodanie stylów Sass w celu zapewnienia responsywności i zgodności z designem.
7.  **Integracja:** Połączenie `SongListPageComponent` z nawigacją w `DefaultLayoutComponent`, aby link do listy piosenek był widoczny.
8.  **Obsługa usuwania:** Zaimplementowanie otwierania `ConfirmationDialogComponent` i wywoływania odpowiedniej metody w serwisie.
9.  **Testowanie:** Upewnienie się, że wszystkie interakcje (paginacja, sortowanie, wyszukiwanie, usuwanie) działają poprawnie, a obsługa stanów (ładowanie, błąd, pusty stan) jest prawidłowo implementowana.
