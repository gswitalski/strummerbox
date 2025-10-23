# API Endpoint Implementation Plan: GET /songs

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pobranie listy piosenek należących do zalogowanego organizatora. Zapewnia funkcjonalność paginacji, wyszukiwania tekstowego w tytułach, filtrowania po statusie publikacji oraz sortowania wyników, zwracając podsumowanie każdej piosenki bez jej pełnej treści.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/songs`
-   **Parametry Query:**
    -   **Opcjonalne:**
        -   `page` (number): Numer strony. Domyślnie: `1`. Walidacja: musi być liczbą całkowitą > 0.
        -   `pageSize` (number): Liczba elementów na stronie. Domyślnie: `20`. Walidacja: musi być liczbą całkowitą w zakresie `1-100`.
        -   `search` (string): Ciąg znaków do wyszukania w polu `title`. Wyszukiwanie jest bezwzględne na wielkość liter.
        -   `published` (boolean | string): Filtr statusu publikacji. Akceptowane wartości: `'true'` (tylko opublikowane), `'false'` (tylko nieopublikowane). Pominięcie parametru zwraca wszystkie piosenki.
        -   `sort` (string): Klucz sortowania. Domyślnie: `-createdAt`. Akceptowane wartości: `title`, `createdAt`, `updatedAt`, `publishedAt`. Można poprzedzić myślnikiem (`-`) w celu sortowania malejącego (np. `-updatedAt`).
-   **Request Body:** Brak

## 3. Wykorzystywane typy
-   `SongListResponseDto`: Główny typ odpowiedzi.
-   `SongSummaryDto`: Typ dla pojedynczego elementu na liście piosenek.
-   `PaginationMeta`: Typ dla metadanych paginacji.

Wszystkie typy są importowane z `@strummerbox/contracts`.

## 4. Szczegóły odpowiedzi
-   **Pomyślna odpowiedź (`200 OK`):**
    -   **Body:** Obiekt JSON zgodny z typem `SongListResponseDto`.
    ```json
    {
      "items": [
        {
          "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
          "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
          "title": "Knockin' on Heaven's Door",
          "publishedAt": null,
          "createdAt": "2025-10-15T08:20:51Z",
          "updatedAt": "2025-10-15T08:22:03Z"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 42
    }
    ```
    -   **Nagłówki:**
        -   `X-Total-Count`: Całkowita liczba piosenek pasujących do kryteriów wyszukiwania (wartość pola `total` z odpowiedzi).

## 5. Przepływ danych
1.  Żądanie `GET` trafia do `supabase/functions/songs/index.ts`.
2.  Router kieruje żądanie do handlera `handleGetSongs` w `songs.handlers.ts`.
3.  `handleGetSongs` wywołuje funkcję `authenticateUser` w celu weryfikacji JWT i pozyskania ID użytkownika.
4.  Handler waliduje i normalizuje parametry zapytania (`page`, `pageSize`, `search`, `published`, `sort`). W przypadku błędu walidacji, zwraca odpowiedź `400 Bad Request`.
5.  Handler wywołuje funkcję `getSongs` z serwisu `songs.service.ts`, przekazując przetworzone parametry oraz ID organizatora.
6.  `songs.service.ts` dynamicznie konstruuje zapytanie do bazy danych przy użyciu klienta Supabase:
    -   Filtruje piosenki po `organizer_id`.
    -   Dodaje warunek `ilike` dla parametru `search` (jeśli istnieje).
    -   Dodaje warunek `is` lub `not.is` dla `published_at` w zależności od parametru `published`.
    -   Dodaje klauzulę `order` na podstawie parametru `sort`.
    -   Stosuje paginację za pomocą `range`.
7.  Serwis wykonuje zapytanie z opcją `{ count: 'exact' }`, aby uzyskać zarówno dane, jak i całkowitą liczbę pasujących rekordów.
8.  Wyniki z bazy danych są mapowane na obiekty typu `SongSummaryDto`.
9.  Serwis zwraca do handlera obiekt zgodny z `SongListResponseDto`.
10. Handler formatuje odpowiedź HTTP, ustawiając status `200`, nagłówek `X-Total-Count` i treść JSON.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Endpoint jest chroniony. Dostęp wymaga ważnego tokenu JWT. Każde żądanie musi być uwierzytelnione w celu identyfikacji organizatora.
-   **Autoryzacja:** Logika serwisu musi bezwzględnie filtrować dane po `organizer_id` pobranym z tokenu JWT, aby zapobiec dostępowi do danych innych użytkowników.
-   **Walidacja wejścia:** Ścisła walidacja parametrów `pageSize` i `sort` zapobiega potencjalnym atakom na wydajność bazy danych.

## 7. Rozważania dotyczące wydajności
-   **Indeksowanie:** Należy upewnić się, że w tabeli `songs` istnieją odpowiednie indeksy:
    -   Indeks na kolumnie `organizer_id`.
    -   Indeks trigramowy (GIN lub GIST) na kolumnie `title` w celu przyspieszenia wyszukiwania z użyciem `ilike`.
    -   Indeksy na wszystkich kolumnach używanych do sortowania: `createdAt`, `updatedAt`, `publishedAt`.
-   **Paginacja:** Paginacja jest obowiązkowa, a maksymalny `pageSize` jest ograniczony do 100, co chroni bazę danych przed nadmiernym obciążeniem.
-   **Projekcja kolumn:** Zapytanie do bazy danych powinno wybierać tylko kolumny zdefiniowane w `SongSummaryDto`, aby zminimalizować transfer danych (unikać `SELECT *`).

## 8. Etapy wdrożenia
1.  **Struktura plików:** Utwórz pliki `songs.handlers.ts` i `songs.service.ts` w katalogu `supabase/functions/songs/`. Zaktualizuj `index.ts`, aby obsługiwał routing dla metody `GET`.
2.  **Implementacja Handlera (`songs.handlers.ts`):**
    -   Stwórz funkcję `handleGetSongs`.
    -   Dodaj logikę uwierzytelniania w celu pobrania ID użytkownika.
    -   Zaimplementuj walidację i parsowanie wszystkich parametrów query (`page`, `pageSize`, `search`, `published`, `sort`).
    -   Dodaj obsługę błędów walidacyjnych (zwracanie `400 Bad Request`).
    -   Zaimplementuj wywołanie `songs.service.ts`.
    -   Sformatuj pomyślną odpowiedź (`200 OK`) wraz z nagłówkiem `X-Total-Count`.
3.  **Implementacja Serwisu (`songs.service.ts`):**
    -   Stwórz funkcję `getSongs(organizerId, options)`.
    -   Zbuduj dynamiczne zapytanie Supabase na podstawie przekazanych opcji.
    -   Prawidłowo obsłuż filtrowanie (`published`), wyszukiwanie (`search`), sortowanie (`sort`) i paginację (`page`, `pageSize`).
    -   Wykonaj zapytanie i pobierz całkowitą liczbę wyników.
    -   Zmapuj wyniki na `SongSummaryDto[]`.
    -   Zwróć obiekt `SongListResponseDto`.
4.  **Baza danych:** Sprawdź i w razie potrzeby dodaj migrację SQL w celu utworzenia niezbędnych indeksów w tabeli `songs` (dla `organizer_id`, `title` z `pg_trgm`, oraz kolumn sortowania).
5.  **Typy:** Upewnij się, że projekt `functions` ma dostęp do współdzielonego pakietu `@strummerbox/contracts` w celu użycia typów DTO.
6.  **Testowanie:** Dodaj testy jednostkowe dla logiki walidacji w handlerze i logiki budowania zapytań w serwisie. Przeprowadź testy integracyjne lokalnie za pomocą `supabase functions serve`.
