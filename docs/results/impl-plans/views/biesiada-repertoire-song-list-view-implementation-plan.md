# Plan implementacji widoku "Tryb Biesiada - Lista Piosenek w Repertuarze"

## 1. Przegląd
Celem tego widoku jest wyświetlenie Organizatorowi listy piosenek zawartych w wybranym repertuarze w ramach uproszczonego interfejsu "Tryb Biesiada". Widok jest zoptymalizowany pod kątem urządzeń mobilnych i ma na celu ułatwienie nawigacji podczas prowadzenia spotkania muzycznego. Umożliwia szybki wybór piosenki do wyświetlenia oraz powrót do listy repertuarów.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką, która zawiera identyfikator repertuaru.

-   **Ścieżka:** `/biesiada/repertoires/:id`
-   **Ochrona:** Dostęp do tej ścieżki będzie chroniony przez `AuthGuard`, zapewniając, że tylko zalogowani użytkownicy (Organizatorzy) mogą go zobaczyć.

## 3. Struktura komponentów
Struktura będzie oparta o dedykowany komponent strony (smart component), który zarządza stanem i logiką, oraz komponent prezentacyjny (dumb component) odpowiedzialny za wyświetlanie listy.

```
- BiesiadaRepertoireSongListPageComponent (strona, komponent inteligentny)
  - mat-toolbar (Pasek narzędzi z tytułem i przyciskiem "wstecz")
  - @if (isLoading)
    - mat-progress-bar
  - @if (error)
    - ErrorDisplayComponent (komponent do wyświetlania błędu)
  - @if (songs)
    - BiesiadaRepertoireSongListComponent (komponent prezentacyjny)
      - mat-list
        - @for (song of songs)
          - mat-list-item
```

## 4. Szczegóły komponentów

### `BiesiadaRepertoireSongListPageComponent`
-   **Opis komponentu:** Główny komponent strony, odpowiedzialny za pobieranie danych z API na podstawie `id` repertuaru z URL, zarządzanie stanem (ładowanie, błąd, dane) i przekazywanie danych do komponentu prezentacyjnego.
-   **Główne elementy:**
    -   `mat-toolbar`: Wyświetla nazwę repertuaru oraz przycisk ikony "wstecz" (`arrow_back`), który nawiguje do `/biesiada/repertoires`.
    -   `mat-progress-bar`: Wyświetlany warunkowo podczas ładowania danych.
    -   `BiesiadaRepertoireSongListComponent`: Komponent podrzędny do wyświetlania listy piosenek.
-   **Obsługiwane zdarzenia:**
    -   `songSelected(songId: string)`: Otrzymywane z komponentu `BiesiadaRepertoireSongListComponent`. W odpowiedzi nawiguje do widoku piosenki: `/biesiada/repertoires/:id/songs/:songId`.
-   **Warunki walidacji:** Brak walidacji po stronie frontendu; komponent polega na `id` z URL.
-   **Typy:** `BiesiadaRepertoireSongListViewModel`
-   **Propsy:** Brak, komponent pobiera `id` z `ActivatedRoute`.

### `BiesiadaRepertoireSongListComponent`
-   **Opis komponentu:** Komponent prezentacyjny, który otrzymuje listę piosenek i renderuje ją w formie klikalnej listy.
-   **Główne elementy:**
    -   `mat-list`: Kontener na listę piosenek.
    -   `mat-list-item`: Reprezentuje pojedynczą piosenkę na liście. Każdy element jest klikalny.
-   **Obsługiwane zdarzenia:**
    -   `songSelected`: Zdarzenie wyjściowe (`@Output`), emituje `songId` klikniętej piosenki.
-   **Warunki walidacji:** Brak.
-   **Typy:** `BiesiadaRepertoireSongEntryDto`
-   **Propsy:**
    -   `@Input() songs: BiesiadaRepertoireSongEntryDto[]`: Tablica piosenek do wyświetlenia.

## 5. Typy

### DTO (Data Transfer Object)
Poniższe typy są zdefiniowane w `packages/contracts/types.ts` i zostaną użyte do komunikacji z API.

```typescript
// packages/contracts/types.ts

// Opisuje pojedynczą piosenkę na liście w trybie Biesiada
export type BiesiadaRepertoireSongEntryDto = {
    songId: string; // UUID
    title: string;
    position: number;
};

// Opisuje metadane do udostępniania repertuaru
export type BiesiadaRepertoireShareMetaDto = {
    publicUrl: string;
    qrPayload: string;
};

// Główny obiekt odpowiedzi z API
export type BiesiadaRepertoireSongListResponseDto = {
    repertoireId: string; // UUID
    repertoireName: string;
    share: BiesiadaRepertoireShareMetaDto;
    songs: BiesiadaRepertoireSongEntryDto[];
};
```

### ViewModel
W celu zarządzania stanem widoku, zostanie utworzony dedykowany ViewModel.

```typescript
// src/app/pages/biesiada/repertoires/models/biesiada-repertoire-song-list.types.ts

import type { BiesiadaRepertoireSongEntryDto } from '@strummer-box/contracts';

export interface BiesiadaRepertoireSongListViewModel {
    repertoireId: string | null;
    repertoireName: string | null;
    songs: BiesiadaRepertoireSongEntryDto[];
    isLoading: boolean;
    error: string | null;
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane przy użyciu dedykowanego serwisu (`BiesiadaRepertoireSongListService`) i sygnałów Angulara (`Signal`).

-   **`BiesiadaRepertoireSongListService`**:
    -   Będzie to serwis `@Injectable({ providedIn: 'root' })`.
    -   Będzie zawierał prywatny, zapisywalny sygnał (`signal`) przechowujący stan `BiesiadaRepertoireSongListViewModel`.
    -   Udostępni publiczne, obliczeniowe sygnały (`computed`) dla każdego pola z `BiesiadaRepertoireSongListViewModel`, np. `songs = computed(() => this.state().songs)`.
    -   Udostępni metodę `fetchRepertoireSongs(repertoireId: string)`, która wywoła API, a następnie zaktualizuje stan w sygnale w zależności od wyniku (sukces, błąd).

## 7. Integracja API
Komponent `BiesiadaRepertoireSongListPageComponent` za pośrednictwem serwisu `BiesiadaRepertoireSongListService` będzie komunikował się z API.

-   **Endpoint:** `GET /me/biesiada/repertoires/{id}/songs`
-   **Klient HTTP:** Zostanie wykorzystany wbudowany w Angular `HttpClient`.
-   **Serwis API:** Logika wywołania zostanie umieszczona w dedykowanym serwisie (np. `BiesiadaApiService`), który będzie odpowiedzialny za komunikację z backendem.
-   **Typ odpowiedzi:** `Observable<BiesiadaRepertoireSongListResponseDto>`

## 8. Interakcje użytkownika
-   **Wejście na stronę:** Użytkownik, klikając na repertuar w widoku `/biesiada/repertoires`, jest nawigowany do `/biesiada/repertoires/:id`. Komponent strony pobiera `id` z URL i inicjuje pobieranie danych.
-   **Wybór piosenki:** Użytkownik klika na element listy (`mat-list-item`). Wywołuje to nawigację do widoku szczegółów piosenki `/biesiada/repertoires/:id/songs/:songId`.
-   **Powrót:** Użytkownik klika przycisk "wstecz" w `mat-toolbar`. Wywołuje to nawigację powrotną do listy repertuarów `/biesiada/repertoires`.

## 9. Warunki i walidacja
-   Widok nie implementuje żadnej logiki walidacyjnej po stronie klienta.
-   Komponent jest zależny od poprawnego `id` repertuaru w ścieżce URL. Nieprawidłowe `id` (np. nieistniejące) zostanie obsłużone jako błąd API (404 Not Found).

## 10. Obsługa błędów
-   **Błąd ładowania danych (np. 404, 500):** Jeśli API zwróci błąd, `BiesiadaRepertoireSongListService` zaktualizuje stan, ustawiając `isLoading: false` oraz `error` z odpowiednim komunikatem. `BiesiadaRepertoireSongListPageComponent` wyświetli ten komunikat użytkownikowi.
-   **Brak autoryzacji (401, 403):** Te błędy będą globalnie przechwytywane przez `HttpInterceptor`, który przekieruje użytkownika na stronę logowania.
-   **Pusta lista piosenek:** Jeśli API zwróci pustą tablicę `songs`, komponent `BiesiadaRepertoireSongListComponent` wyświetli odpowiedni komunikat "pustego stanu" (np. "Ten repertuar nie zawiera żadnych piosenek.").

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:**
    -   Utworzyć folder `src/app/pages/biesiada/repertoires/songs`.
    -   Wewnątrz folderu `songs` stworzyć pliki dla strony: `biesiada-repertoire-song-list-page.component.ts` (i `.html`, `.scss`).
    -   Stworzyć podfolder `components/list` dla komponentu listy: `biesiada-repertoire-song-list.component.ts`.
    -   Utworzyć plik z typami `models/biesiada-repertoire-song-list.types.ts`.
    -   Utworzyć plik serwisu `services/biesiada-repertoire-song-list.service.ts`.
2.  **Definicja typów:** Zdefiniować interfejs `BiesiadaRepertoireSongListViewModel` w pliku `biesiada-repertoire-song-list.types.ts`.
3.  **Implementacja serwisu stanu (`BiesiadaRepertoireSongListService`):**
    -   Stworzyć serwis z użyciem sygnałów do zarządzania stanem `BiesiadaRepertoireSongListViewModel`.
    -   Zaimplementować metodę `fetchRepertoireSongs(id)`, która wywołuje `BiesiadaApiService` i aktualizuje stan.
4.  **Implementacja `BiesiadaApiService`:** Dodać metodę `getBiesiadaRepertoireSongs(id: string)` zwracającą `Observable<BiesiadaRepertoireSongListResponseDto>`.
5.  **Implementacja komponentu listy (`BiesiadaRepertoireSongListComponent`):**
    -   Stworzyć komponent z `@Input() songs` i `@Output() songSelected`.
    -   Zaimplementować szablon HTML z `mat-list` i pętlą `@for` do renderowania piosenek.
6.  **Implementacja komponentu strony (`BiesiadaRepertoireSongListPageComponent`):**
    -   Wstrzyknąć `ActivatedRoute` i `BiesiadaRepertoireSongListService`.
    -   Pobrać `id` repertuaru z `ActivatedRoute` i wywołać metodę `fetchRepertoireSongs` w serwisie.
    -   W szablonie HTML, połączyć publiczne sygnały z serwisu do wyświetlania stanu (ładowanie, błąd, dane).
    -   Zaimplementować nawigację (powrót i przejście do piosenki).
7.  **Routing:** Zaktualizować plik `app.routes.ts` (lub odpowiedni plik routingu), dodając nową ścieżkę `/biesiada/repertoires/:id` wskazującą na `BiesiadaRepertoireSongListPageComponent` i chronioną przez `AuthGuard`.
