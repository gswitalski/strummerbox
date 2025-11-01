# Plan implementacji widoku: Tryb Biesiada - Piosenka

## 1. Przegląd

Widok "Tryb Biesiada - Piosenka" jest kluczowym elementem interfejsu dla zalogowanego organizatora podczas prowadzenia wydarzenia muzycznego. Jego głównym celem jest wyświetlenie tekstu piosenki wraz z akordami w sposób czytelny i uproszczony, zoptymalizowany pod kątem urządzeń mobilnych. Widok ten umożliwia również płynną nawigację do poprzedniej i następnej piosenki w ramach repertuaru oraz szybkie udostępnienie go uczestnikom za pomocą kodu QR. Interfejs jest pozbawiony funkcji edycyjnych, koncentrując się wyłącznie na prezentacji treści i ułatwieniu prowadzenia biesiady.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką, wymagającą uwierzytelnienia organizatora. Parametry w ścieżce (`:repertoireId`, `:songId`) są kluczowe do identyfikacji wyświetlanej piosenki w kontekście konkretnego repertuaru.

-   **Ścieżka:** `/biesiada/repertoires/:repertoireId/songs/:songId`
-   **Ochrona:** Dostęp chroniony przez `AuthGuard`, przeznaczony tylko для zalogowanych użytkowników.

## 3. Struktura komponentów

Struktura opiera się na komponencie stronicowym (`page`), który zarządza stanem i logiką, oraz komponentach prezentacyjnych odpowiedzialnych za poszczególne części interfejsu.

```
BiesiadaSongPageComponent (komponent routowalny)
│
├── MatToolbarComponent (nagłówek)
│   ├── Przycisk "Wstecz" (nawigacja do listy piosenek)
│   └── Tytuł piosenki
│
├── BiesiadaSongViewComponent (prezentacja danych)
│   ├── SongContentRendererComponent (renderowanie tekstu z akordami)
│   └── Przyciski nawigacyjne "Poprzednia" / "Następna"
│
├── MatFab (przycisk do pokazania kodu QR)
│
└── (Warunkowo) MatSpinner / Komponent błędu
```

## 4. Szczegóły komponentów

### `BiesiadaSongPageComponent`
-   **Opis komponentu:** Główny, routowalny komponent widoku. Odpowiedzialny za pobranie `repertoireId` i `songId` z `ActivatedRoute`, komunikację z serwisem w celu załadowania danych piosenki oraz zarządzanie stanem widoku (ładowanie, błąd, załadowano).
-   **Główne elementy:** `mat-toolbar`, `stbo-biesiada-song-view`, `mat-fab-button`, `mat-spinner`.
-   **Obsługiwane zdarzenia:**
    -   `navigateBack`: Wywoływane z `BiesiadaSongViewComponent`, nawiguje do listy piosenek repertuaru.
    -   `navigatePrevious`, `navigateNext`: Wywoływane z `BiesiadaSongViewComponent`, nawiguje do odpowiedniej piosenki.
    -   `showQrCode`: Wywoływane z `BiesiadaSongViewComponent`, otwiera dialog udostępniania.
-   **Typy:** `BiesiadaSongPageViewModel`.
-   **Propsy:** Brak (komponent routowalny).

### `BiesiadaSongViewComponent`
-   **Opis komponentu:** Komponent prezentacyjny, który przyjmuje dane piosenki i stan widoku. Odpowiada za wyświetlenie wszystkich informacji oraz delegowanie interakcji użytkownika do komponentu nadrzędnego.
-   **Główne elementy:** `mat-toolbar` z tytułem, `stbo-song-content-renderer` do wyświetlenia treści, `mat-button` dla nawigacji, `mat-fab-button` dla kodu QR.
-   **Obsługiwane zdarzenia:**
    -   `(navigateBack)`: Emitowane po kliknięciu przycisku "wstecz".
    -   `(navigatePrevious)`: Emitowane po kliknięciu przycisku "Poprzednia".
    -   `(navigateNext)`: Emitowane po kliknięciu przycisku "Następna".
    -   `(showQrCode)`: Emitowane po kliknięciu przycisku FAB.
-   **Typy:** `BiesiadaRepertoireSongDetailDto`.
-   **Propsy (Inputs):**
    -   `@Input() songData: BiesiadaRepertoireSongDetailDto | null`
    -   `@Input() isLoading: boolean`

### `SongContentRendererComponent`
-   **Opis komponentu:** Reużywalny komponent odpowiedzialny za parsowanie i renderowanie tekstu piosenki w formacie ChordPro. Akordy `[C]` są automatycznie umieszczane nad odpowiednimi fragmentami tekstu.
-   **Główne elementy:** Kontener (`div`) z dynamicznie generowanymi elementami `span` dla tekstu i akordów.
-   **Obsługiwane zdarzenia:** Brak.
-   **Typy:** `string`.
-   **Propsy (Inputs):**
    -   `@Input() content: string | null | undefined`

## 5. Typy

Do implementacji widoku potrzebne będą istniejące typy DTO z pakietu `@strummerbox/contracts` oraz dedykowany ViewModel do zarządzania stanem.

-   **DTO (z API):** `BiesiadaRepertoireSongDetailDto` - główny obiekt danych zawierający wszystkie informacje o piosence, jej kolejności i metadanych do udostępniania.

-   **ViewModel (do stworzenia):**
    ```typescript
    // Plik: src/app/pages/biesiada/songs/models/biesiada-song-page.types.ts
    import { BiesiadaRepertoireSongDetailDto } from '@strummerbox/contracts';

    export type BiesiadaSongState = 'loading' | 'loaded' | 'error';

    export interface BiesiadaSongPageViewModel {
        state: BiesiadaSongState;
        data: BiesiadaRepertoireSongDetailDto | null;
        error: string | null;
    }
    ```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w ramach komponentu z użyciem dedykowanego serwisu i sygnałów (Angular Signals), zgodnie z najnowszymi praktykami Angulara.

-   **`BiesiadaSongPageService`:** Serwis `providedIn: 'root'` lub w komponencie, który będzie zarządzał stanem `BiesiadaSongPageViewModel`.
-   **Sygnał stanu:** Serwis będzie eksponował publiczny, niemodyfikowalny sygnał:
    `public readonly viewModel = computed<BiesiadaSongPageViewModel>(() => this.state());`
-   **Logika:** Serwis będzie posiadał metodę `loadSong(repertoireId: string, songId: string)`, która wykonuje żądanie API, a następnie aktualizuje wewnętrzny, zapisywalny sygnał `state` w zależności od wyniku operacji (sukces, błąd).
-   **Komponent:** `BiesiadaSongPageComponent` wstrzyknie serwis, odczyta `repertoireId` i `songId` z `ActivatedRoute`, a następnie wywoła metodę `loadSong`. Widok będzie renderowany na podstawie wartości sygnału `viewModel`.

## 7. Integracja API

Integracja z backendem będzie realizowana poprzez serwis, który hermetyzuje logikę wywołań HTTP.

-   **Endpoint:** `GET /api/me/biesiada/repertoires/:repertoireId/songs/:songId`
-   **Serwis danych:** Dedykowana metoda w `BiesiadaDataService` (lub podobnym).
    ```typescript
    getBiesiadaSong(repertoireId: string, songId: string): Observable<BiesiadaRepertoireSongDetailDto> {
        const url = `/api/me/biesiada/repertoires/${repertoireId}/songs/${songId}`;
        return this.httpClient.get<BiesiadaRepertoireSongDetailDto>(url);
    }
    ```
-   **Typ odpowiedzi:** `BiesiadaRepertoireSongDetailDto`
-   **Obsługa w `BiesiadaSongPageService`:** Serwis subskrybuje do `Observable` i aktualizuje sygnał stanu.

## 8. Interakcje użytkownika

-   **Nawigacja wstecz:** Kliknięcie ikony strzałki w `mat-toolbar` powoduje wywołanie `router.navigate` do widoku listy piosenek danego repertuaru (`/biesiada/repertoires/:repertoireId`).
-   **Nawigacja "Poprzednia"/"Następna":**
    -   Kliknięcie przycisku "Poprzednia" lub "Następna" powoduje nawigację do nowej ścieżki, podmieniając `songId` w URL na `songId` z obiektu `previous` lub `next` w danych piosenki.
    -   Przyciski są nieaktywne (`disabled`), jeśli `data.order.previous` lub `data.order.next` ma wartość `null`.
-   **Udostępnianie (QR):**
    -   Kliknięcie przycisku `mat-fab` powoduje otwarcie `ShareDialogComponent` (przez `MatDialog`).
    -   Do dialogu przekazywane są dane z `data.share` (`publicUrl`, `qrPayload`).

## 9. Warunki i walidacja

Walidacja po stronie frontendu jest minimalna, ponieważ opiera się na obsłudze odpowiedzi z API.

-   **Parametry routingu:** Komponent musi poprawnie odczytać `repertoireId` i `songId` z `ActivatedRoute`.
-   **Istnienie nawigacji:** Stan `disabled` przycisków "Poprzednia" i "Następna" jest dynamicznie powiązany z istnieniem obiektów `data.order.previous` i `data.order.next`.

## 10. Obsługa błędów

-   **404 Not Found:** Jeśli API zwróci status 404, `BiesiadaSongPageService` ustawi stan na `error` z komunikatem, np. "Nie znaleziono piosenki w tym repertuarze". Komponent wyświetli ten komunikat.
-   **401 Unauthorized / 403 Forbidden:** Błędy te powinny być globalnie przechwytywane przez `HttpInterceptor`, który przekieruje użytkownika na stronę logowania.
-   **5xx / Błędy sieciowe:** Serwis ustawi stan na `error` z ogólnym komunikatem, np. "Wystąpił błąd serwera. Spróbuj ponownie później". Można dodać przycisk "Spróbuj ponownie", który ponownie wywoła metodę `loadSong`.
-   **Stan ładowania:** Podczas oczekiwania na odpowiedź z API, na ekranie będzie wyświetlany `mat-spinner`.

## 11. Kroki implementacji

1.  **Stworzenie struktury plików:**
    -   Utworzenie katalogu: `src/app/pages/biesiada/songs/`
    -   Utworzenie plików dla komponentu `BiesiadaSongPageComponent`: `.ts`, `.html`, `.scss`.
    -   Utworzenie pliku z typami: `models/biesiada-song-page.types.ts`.
    -   Utworzenie serwisu stanu: `services/biesiada-song-page.service.ts`.
2.  **Routing:**
    -   Dodanie nowej ścieżki `/biesiada/repertoires/:repertoireId/songs/:songId` do modułu routingu, wskazując na `BiesiadaSongPageComponent`.
3.  **Implementacja serwisu (`BiesiadaSongPageService`):**
    -   Zdefiniowanie `BiesiadaSongPageViewModel` i sygnałów stanu.
    -   Implementacja metody `loadSong` z logiką wywołania API (poprzez wstrzyknięty serwis danych) i aktualizacją sygnału.
4.  **Implementacja `BiesiadaSongPageComponent`:**
    -   Wstrzyknięcie `ActivatedRoute` i `BiesiadaSongPageService`.
    -   W `ngOnInit` (lub resolverze), odczytanie parametrów z URL i wywołanie `service.loadSong()`.
    -   Stworzenie szablonu HTML z użyciem `@switch` do obsługi stanów `loading`, `loaded`, `error`.
    -   Przekazanie danych do `BiesiadaSongViewComponent`.
    -   Implementacja logiki dla zdarzeń nawigacji i otwierania dialogu.
5.  **Implementacja `BiesiadaSongViewComponent`:**
    -   Zdefiniowanie `@Input()` dla danych piosenki.
    -   Zdefiniowanie `@Output()` dla interakcji użytkownika.
    -   Stworzenie szablonu HTML z `mat-toolbar`, `mat-fab-button` i przyciskami nawigacyjnymi.
    -   Wykorzystanie komponentu `stbo-song-content-renderer` do wyświetlenia treści.
6.  **Implementacja `SongContentRendererComponent` (jeśli nie istnieje):**
    -   Zdefiniowanie `@Input() content`.
    -   Implementacja logiki do parsowania formatu ChordPro i renderowania HTML.
    -   Dodanie stylów SCSS do poprawnego pozycjonowania akordów nad tekstem.
7.  **Dialog udostępniania:**
    -   Upewnienie się, że `ShareDialogComponent` istnieje i może przyjąć dane (`publicUrl`, `qrPayload`).
    -   Podłączenie otwierania dialogu pod przycisk FAB.
8.  **Stylowanie i testowanie:**
    -   Dostosowanie stylów dla optymalnej czytelności na urządzeniach mobilnych.
    -   Manualne przetestowanie wszystkich interakcji, nawigacji oraz obsługi błędów.
