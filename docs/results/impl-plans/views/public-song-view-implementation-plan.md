# Plan implementacji widoku Public Song View

## 1. Przegląd
Celem tego widoku jest wyświetlenie publicznej, uproszczonej wersji piosenki dla niezalogowanych użytkowników (Biesiadników). Widok jest minimalistyczny, zoptymalizowany pod kątem urządzeń mobilnych i skupia się na maksymalnej czytelności tekstu. Wyświetla tytuł oraz treść piosenki, z której **na poziomie frontendu usuwane są akordy** (w formacie `[C] [G] [Am]`), na podstawie danych pobranych z API. Widok ten nie zawiera żadnych dodatkowych elementów nawigacyjnych, zgodnie z User Story US-013.

## 2. Routing widoku
Widok będzie dostępny pod publiczną ścieżką i będzie ładowany leniwie (lazy loading).

-   **Ścieżka URL:** `/public/songs/:publicId`
-   **Parametr:** `publicId` (string) - publiczny identyfikator piosenki.
-   **Plik z definicją trasy:** `src/app/pages/public-song/public-song.routes.ts`
-   **Główny plik routingowy:** Trasę należy zarejestrować w `src/app/app.routes.ts`.

## 3. Struktura komponentów
Struktura będzie prosta i oparta na jednym komponencie-stronie, który w zależności od stanu będzie renderował komponent potomny lub wskaźnik ładowania/błędu.

```
PublicSongViewComponent (komponent-strona)
|
+-- @if (stan.ładowanie) -> MatSpinnerComponent
+-- @if (stan.błąd) -> ErrorDisplayComponent (komponent reużywalny)
+-- @if (stan.załadowano) -> SongContentViewComponent
```

## 4. Szczegóły komponentów

### PublicSongViewComponent
-   **Opis komponentu:** Jest to główny komponent strony (smart component), odpowiedzialny za:
    -   Odczytanie parametru `:publicId` z aktywnej trasy.
    -   Komunikację z `PublicSongService` w celu pobrania danych piosenki.
    -   **Przetworzenie treści piosenki w celu usunięcia akordów.**
    -   Zarządzanie stanem widoku (ładowanie, załadowano, błąd) za pomocą sygnałów.
    -   Dynamiczne ustawianie tytułu strony (`<title>`) i metatagów (`<meta name="robots">`).
    -   Renderowanie odpowiedniego komponentu w zależności od aktualnego stanu.
-   **Główne elementy:**
    -   Kontener oparty na `@if` i `@switch` do warunkowego renderowania.
    -   Komponent `mat-spinner` dla stanu ładowania.
    -   Komponent `SongContentViewComponent` dla stanu sukcesu.
    -   Komponent `ErrorDisplayComponent` dla stanu błędu.
-   **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika. Komponent reaguje na załadowanie strony i zmianę parametru w URL.
-   **Obsługiwana walidacja:** Brak. Walidacja odbywa się po stronie API.
-   **Typy:** `PublicSongState` (ViewModel/stan), `PublicSongDto` (DTO).
-   **Propsy (wejścia):** Brak. Komponent jest komponentem-stroną.

### SongContentViewComponent
-   **Opis komponentu:** Prosty komponent prezentacyjny (dumb component), którego jedynym zadaniem jest estetyczne wyświetlenie tytułu i treści piosenki.
-   **Główne elementy:**
    -   Element `<h1>` na tytuł piosenki.
    -   Element `<pre>` lub `<div>` na treść piosenki, ze stylami CSS zapewniającymi zachowanie formatowania (np. `white-space: pre-wrap`).
-   **Obsługiwane interakcje:** Brak.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `string` (dla `title` i `content`).
-   **Propsy (wejścia):**
    -   `@Input() title: string`
    -   `@Input() content: string`

## 5. Typy

### PublicSongDto
Typ DTO (Data Transfer Object) reprezentujący odpowiedź z API. Zostanie zaimportowany z `packages/contracts/types.ts`.

```typescript
import type { SongRow } from '../../../packages/database/database.types.ts';

export type PublicSongDto = {
    title: SongRow['title'];
    content: string; // Treść piosenki z akordami w formacie ChordPro
    repertoireNavigation: PublicSongNavigationDto | null; // Ignorowane w tym widoku
};
```

### PublicSongState (ViewModel)
Typ unii dyskryminowanej do zarządzania stanem komponentu `PublicSongViewComponent` w sposób bezpieczny typologicznie.

```typescript
export type PublicSongState =
  | { status: 'loading' }
  | { status: 'loaded'; song: { title: string; content: string } } // Przechowuje już przetworzoną treść
  | { status: 'error'; error: { code: number; message: string } };
```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie zaimplementowane w `PublicSongViewComponent` przy użyciu sygnałów Angulara.

-   **Główny sygnał:** `state = signal<PublicSongState>({ status: 'loading' });`
-   **Źródło danych:** `ActivatedRoute.params` zostanie użyte do pobrania `publicId`.
-   **Logika:**
    1.  Wstrzyknąć `ActivatedRoute` i `PublicSongService`.
    2.  Stworzyć funkcję pomocniczą `stripChords(content: string): string`, która usuwa z tekstu znaczniki akordów (np. `[C]`).
    3.  Użyć `effect` do nasłuchiwania na zmiany `publicId`.
    4.  Przy każdej zmianie `publicId`:
        -   Ustawić stan na `{ status: 'loading' }`.
        -   Wywołać serwis w celu pobrania danych.
        -   W przypadku sukcesu, przetworzyć treść piosenki za pomocą `stripChords` i zaktualizować sygnał `state` do `{ status: 'loaded', song: processedSong }`.
        -   W przypadku błędu, zaktualizować sygnał `state` do `{ status: 'error', ... }`.
-   **Reaktywność:** Szablon HTML będzie bezpośrednio powiązany z sygnałem `state` i będzie się automatycznie aktualizować przy każdej zmianie stanu.

## 7. Integracja API

-   **Serwis:** Należy utworzyć `PublicSongService` w `src/app/pages/public-song/services/`.
-   **Metoda:** `getSongByPublicId(publicId: string): Observable<PublicSongDto>`
-   **Endpoint:** `GET /api/public/songs/{publicId}`
-   **Typ żądania:** Brak (dane w URL).
-   **Typ odpowiedzi (sukces):** `PublicSongDto` (z treścią zawierającą akordy).
-   **Typ odpowiedzi (błąd):** `HttpErrorResponse`.

## 8. Interakcje użytkownika
-   **Wejście na stronę:** Użytkownik otwiera link, co inicjuje pobieranie danych.
-   **Przewijanie:** Użytkownik może przewijać tekst piosenki.
-   **Brak innych interakcji:** Widok jest statyczny i nie zawiera przycisków ani formularzy.

## 9. Warunki i walidacja
-   Frontend nie przeprowadza walidacji `publicId`.
-   Interfejs użytkownika reaguje na statusy HTTP zwrócone przez API:
    -   **200 OK:** Wyświetla treść piosenki.
    -   **404 Not Found:** Wyświetla komunikat "Nie znaleziono piosenki".
    -   **410 Gone:** Wyświetla komunikat "Ta piosenka nie jest już dostępna".
    -   **5xx / Inne:** Wyświetla ogólny komunikat o błędzie.

## 10. Obsługa błędów
Obsługa błędów będzie realizowana w `PublicSongService` (przez przechwycenie błędu z `HttpClient`) oraz w `PublicSongViewComponent` (przez ustawienie odpowiedniego stanu `error`).

-   **Komponent `ErrorDisplayComponent`** będzie reużywalnym komponentem wyświetlającym komunikaty błędów w zależności od przekazanego kodu błędu.
-   W przypadku błędów sieciowych (offline), zostanie wyświetlony ogólny komunikat o błędzie.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:**
    -   Stworzyć folder `src/app/pages/public-song`.
    -   Wewnątrz niego stworzyć foldery `components`, `services` i `utils`.
2.  **Implementacja funkcji pomocniczej:**
    -   Stworzyć plik `chord-stripper.ts` w folderze `utils`.
    -   Zaimplementować w nim i wyeksportować czystą funkcję `stripChords(content: string): string`, która używa wyrażenia regularnego do usunięcia fragmentów typu `[tekst]`.
3.  **Implementacja serwisu API:**
    -   Stworzyć plik `public-song.service.ts` w folderze `services`.
    -   Zaimplementować w nim klasę `PublicSongService` z metodą `getSongByPublicId`.
4.  **Implementacja komponentu `SongContentViewComponent`:**
    -   Stworzyć komponent w `src/app/pages/public-song/components/song-content/`.
    -   Zdefiniować wejścia `@Input()` na `title` i `content`.
    -   Dodać prosty szablon HTML i style SCSS zapewniające dużą czcionkę i responsywność.
5.  **Implementacja głównego komponentu widoku `PublicSongViewComponent`:**
    -   Stworzyć plik `public-song.view.ts` w `src/app/pages/public-song/`.
    -   Zaimplementować logikę pobierania danych, wywołania `stripChords` i zarządzania stanem za pomocą sygnałów.
    -   Wstrzyknąć `Title` i `Meta` i zaimplementować dynamiczne ustawianie metatagów.
    -   Stworzyć szablon HTML z logiką warunkowego renderowania (`@if`, `mat-spinner`, `stbo-song-content-view`).
6.  **Konfiguracja routingu:**
    -   Stworzyć plik `public-song.routes.ts` definiujący trasę do `PublicSongViewComponent`.
    -   Dodać wpis do `src/app/app.routes.ts` w celu leniwego załadowania nowej trasy.
7.  **Stworzenie reużywalnego `ErrorDisplayComponent`** (jeśli jeszcze nie istnieje w projekcie).
8.  **Testowanie:**
    -   Sprawdzić manualnie wszystkie scenariusze: pomyślne załadowanie, stan ładowania, błędy 404, 410 oraz błąd serwera.
    -   Zweryfikować, czy akordy są poprawnie usuwane z treści piosenki.
    -   Zweryfikować responsywność widoku na różnych urządzeniach.
    -   Sprawdzić, czy tytuł strony i metatagi są poprawnie ustawiane.
