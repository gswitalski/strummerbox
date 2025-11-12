# Plan implementacji widoku: Publiczny Widok Piosenki

## 1. Przegląd
Celem tego widoku jest wyświetlanie tekstu piosenki dla anonimowego użytkownika (Biesiadnika) w sposób czytelny i zoptymalizowany dla urządzeń mobilnych. Gdy piosenka jest częścią repertuaru, widok ten umożliwia również intuicyjną nawigację do poprzedniego i następnego utworu bez konieczności powrotu do listy. Interfejs jest minimalistyczny, skupiony wyłącznie na treści piosenki i nawigacji.

## 2. Routing widoku
Widok będzie dostępny pod dwiema ścieżkami, ale implementacja skupia się na tej drugiej, która zawiera kontekst repertuaru:
-   Piosenka samodzielna: `/public/songs/:publicId`
-   Piosenka w ramach repertuaru: `/public/repertoires/:publicId/songs/:songPublicId`

Dostęp do widoku nie wymaga uwierzytelnienia.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane jako `standalone` zgodnie z najnowszymi standardami Angulara. Widok będzie renderowany wewnątrz dedykowanego layoutu publicznego, który zawiera jedynie `<router-outlet>`.

```
PublicLayoutComponent
└── router-outlet
    └── PublicSongPageComponent (komponent routowalny)
        ├── SongDisplayComponent (komponent prezentacyjny)
        └── SongNavigationComponent (komponent prezentacyjny)
```

## 4. Szczegóły komponentów
### `PublicSongPageComponent`
-   **Opis komponentu**: Główny, "inteligentny" komponent strony. Odpowiada za pobieranie `publicId` repertuaru i piosenki z parametrów ścieżki URL, komunikację z serwisem w celu pobrania danych piosenki, zarządzanie stanem (ładowanie, błąd, dane) oraz przekazywanie danych do komponentów prezentacyjnych.
-   **Główne elementy**: Wykorzystuje `*ngIf` (lub `@if`) do warunkowego wyświetlania stanu ładowania (`mat-spinner`), komunikatu o błędzie lub komponentów `SongDisplayComponent` i `SongNavigationComponent` po pomyślnym załadowaniu danych.
-   **Obsługiwane interakcje**: Reaguje na zmiany parametrów w ścieżce URL, aby odświeżyć dane piosenki, co zapewnia płynną nawigację między utworami.
-   **Obsługiwana walidacja**: Brak walidacji po stronie klienta.
-   **Typy**: `Signal<PublicSongState>`, `PublicRepertoireSongDto`.
-   **Propsy**: Brak (pobiera dane z `ActivatedRoute`).

### `SongDisplayComponent`
-   **Opis komponentu**: Prosty komponent prezentacyjny odpowiedzialny wyłącznie za wyświetlanie tytułu i treści piosenki.
-   **Główne elementy**: Nagłówek `<h1>` na tytuł i paragraf `<p>` lub `<div>` z `white-space: pre-wrap` na treść, aby zachować formatowanie (np. podziały linii).
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `string`.
-   **Propsy**:
    -   `@Input() title: string`
    -   `@Input() content: string`

### `SongNavigationComponent`
-   **Opis komponentu**: Komponent prezentacyjny wyświetlający przyciski nawigacyjne "Poprzednia piosenka" i "Następna piosenka".
-   **Główne elementy**: Dwa komponenty `mat-stroked-button` lub `mat-flat-button`. Każdy przycisk jest opakowany w `@if`, aby renderować się tylko wtedy, gdy w danych wejściowych istnieje odpowiednio poprzednia lub następna piosenka.
-   **Obsługiwane interakcje**: Kliknięcie przycisku nawiguje użytkownika do widoku poprzedniej/następnej piosenki przy użyciu dyrektywy `routerLink`.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `SongNavigationViewModel`.
-   **Propsy**:
    -   `@Input() navigationData: SongNavigationViewModel`

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO z pakietu `@strummerbox/contracts` oraz stworzone zostaną dedykowane ViewModele dla poprawy czytelności w szablonach.

-   **`PublicRepertoireSongDto` (DTO)**: Typ danych zwracany przez API, zdefiniowany w `packages/contracts/types.ts`.
-   **`PublicSongState` (State)**: Interfejs opisujący stan zarządzany przez serwis i wykorzystywany w komponencie `PublicSongPageComponent`.
    ```typescript
    export interface PublicSongState {
        data: PublicRepertoireSongDto | null;
        loading: boolean;
        error: string | null;
    }
    ```
-   **`SongNavigationViewModel` (ViewModel)**: Model widoku przekazywany do `SongNavigationComponent`, zawierający uproszczone dane nawigacyjne.
    ```typescript
    export interface SongNavLinkViewModel {
        title: string;
        routerLink: any[];
    }

    export interface SongNavigationViewModel {
        previous: SongNavLinkViewModel | null;
        next: SongNavLinkViewModel | null;
    }
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane przez dedykowany, wstrzykiwalny serwis `PublicSongService`, który będzie zgodny z architekturą singleton.

-   Serwis będzie używał Angular Signals do przechowywania i udostępniania stanu `PublicSongState`.
-   `PublicSongPageComponent` będzie wstrzykiwał `PublicSongService` i subskrybował (za pomocą `computed` lub bezpośrednio w szablonie) zmiany w sygnale stanu.
-   Serwis udostępni publiczną metodę `loadSong(repertoirePublicId: string, songPublicId: string)`, która będzie odpowiedzialna za wykonanie zapytania API i aktualizację sygnału stanu w zależności od wyniku (sukces, błąd, ładowanie).

## 7. Integracja API
-   **Endpoint**: `GET /public/repertoires/{publicId}/songs/{songPublicId}`
-   **Logika integracji**:
    1.  `PublicSongPageComponent` pobiera parametry `:publicId` i `:songPublicId` z `ActivatedRoute`.
    2.  Wywołuje metodę `publicSongService.loadSong()` z pobranymi parametrami.
    3.  `PublicSongService` wykonuje żądanie HTTP GET do endpointu.
    4.  **Odpowiedź (Sukces)**: Oczekiwany jest obiekt typu `PublicRepertoireSongDto`. Serwis aktualizuje swój stan, ustawiając `loading: false` i przypisując otrzymane dane do `data`.
    5.  **Odpowiedź (Błąd)**: W przypadku błędu (np. 404, 410), serwis aktualizuje stan, ustawiając `loading: false` i wypełniając pole `error` odpowiednim komunikatem.
-   **Transformacja danych**: W serwisie lub komponencie nastąpi transformacja `PublicRepertoireSongDto` na `SongNavigationViewModel` poprzez zmapowanie pól i przetworzenie `url` z API na tablicę dla `routerLink`.

## 8. Interakcje użytkownika
-   **Wejście na stronę**: Użytkownik otwiera URL piosenki. Aplikacja wyświetla wskaźnik ładowania, a następnie treść piosenki i przyciski nawigacyjne (jeśli dotyczy).
-   **Kliknięcie przycisku "Następna piosenka"**: Użytkownik jest płynnie przenoszony na URL następnej piosenki. Komponent `PublicSongPageComponent` ponownie wykonuje logikę pobierania danych dla nowego utworu, a widok jest aktualizowany.
-   **Kliknięcie przycisku "Poprzednia piosenka"**: Działa analogicznie do kliknięcia przycisku "Następna piosenka".

## 9. Warunki i walidacja
-   **Brak `previous` w odpowiedzi API**: Przycisk nawigacji do poprzedniej piosenki nie jest renderowany w komponencie `SongNavigationComponent` (`@if (navigationData.previous)`).
-   **Brak `next` w odpowiedzi API**: Przycisk nawigacji do następnej piosenki nie jest renderowany (`@if (navigationData.next)`).
-   **Długie tytuły piosenek**: Tytuły na przyciskach nawigacyjnych będą miały zastosowane style CSS (`text-overflow: ellipsis`), aby zapobiec łamaniu się layoutu na małych ekranach. Pełny tytuł będzie dostępny w atrybucie `title` lub `matTooltip`.

## 10. Obsługa błędów
-   **Błąd 404 (Not Found) / 410 (Gone)**: Jeśli API zwróci jeden z tych statusów, `PublicSongService` ustawi stan błędu. `PublicSongPageComponent` wyświetli dedykowany, przyjazny dla użytkownika komunikat, np. "Niestety, ta piosenka nie została znaleziona lub została usunięta."
-   **Błąd sieci / serwera**: Globalny `HttpInterceptor` przechwyci błąd i może wyświetlić generyczny komunikat (np. za pomocą `MatSnackBar`) o problemie z połączeniem. Stan w `PublicSongService` również zostanie zaktualizowany, co pozwoli na wyświetlenie komunikatu w komponencie.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików**: Stworzenie folderów i plików dla nowych komponentów (`public-song-page`, `song-display`, `song-navigation`) oraz serwisu (`public-song.service.ts`) w odpowiednich lokalizacjach (`/pages`, `/shared/components`, `/core/services`).
2.  **Implementacja serwisu (`PublicSongService`)**:
    -   Zdefiniowanie sygnału stanu `PublicSongState`.
    -   Implementacja metody `loadSong()` z logiką zapytania HTTP GET, obsługą sukcesu i błędów oraz aktualizacją stanu.
3.  **Implementacja komponentów prezentacyjnych**:
    -   Stworzenie `SongDisplayComponent` z odpowiednimi `@Input()` i prostym szablonem.
    -   Stworzenie `SongNavigationComponent`, który przyjmuje `SongNavigationViewModel`, implementuje logikę warunkowego wyświetlania przycisków i używa `routerLink` do nawigacji.
4.  **Implementacja komponentu strony (`PublicSongPageComponent`)**:
    -   Wstrzyknięcie `ActivatedRoute` i `PublicSongService`.
    -   Pobranie parametrów z URL i wywołanie serwisu w `ngOnInit` lub z użyciem `effect`.
    -   Stworzenie logiki mapującej `PublicRepertoireSongDto` na `SongNavigationViewModel`.
    -   Zaimplementowanie szablonu HTML, który zarządza wyświetlaniem stanów (ładowanie, błąd, sukces) i integruje komponenty prezentacyjne.
5.  **Aktualizacja routingu**: Dodanie nowej ścieżki `/public/repertoires/:publicId/songs/:songPublicId` do modułu routingu, przypisując ją do `PublicSongPageComponent` i upewniając się, że korzysta z publicznego layoutu.
6.  **SEO i Tytuł strony**: W `PublicSongPageComponent`, wstrzyknięcie serwisów `Title` i `Meta` z `@angular/platform-browser` i dynamiczne ustawienie tytułu strony na tytuł piosenki oraz dodanie meta tagu `<meta name="robots" content="noindex, nofollow">`.
7.  **Stylowanie**: Dodanie stylów SCSS zapewniających dużą czytelność tekstu, responsywność i poprawne działanie przycisków nawigacyjnych na różnych urządzeniach.
8.  **Testowanie manualne**: Weryfikacja wszystkich scenariuszy: poprawne wyświetlanie piosenki, działanie nawigacji, ukrywanie przycisków na skrajnych pozycjach oraz obsługa błędów 404/410.
