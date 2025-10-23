# API Endpoint Implementation Plan: GET /repertoires/{id}

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie szczegółowych informacji o jednym repertuarze na podstawie jego identyfikatora (`id`). Punkt końcowy jest przeznaczony dla uwierzytelnionych użytkowników (organizatorów) i zwraca dane repertuaru wraz z uporządkowaną listą piosenek, które do niego należą. Opcjonalnie, w odpowiedzi mogą zostać zawarte pełne treści piosenek.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/repertoires/{id}`
- **Parametry:**
  - **Path:**
    - `id` (UUID, **wymagane**): Unikalny identyfikator repertuaru.
  - **Query:**
    - `includeSongContent` (boolean, **opcjonalne**): Jeśli `true`, odpowiedź będzie zawierać pole `content` dla każdej piosenki. Domyślnie `false`.
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **Odpowiedź sukcesu (200 OK):** `RepertoireDto`
- **Szczegóły piosenki w odpowiedzi:** `RepertoireSongDto`
- **Odpowiedź błędu:** `ErrorResponseDto`

Definicje tych typów znajdują się w `packages/contracts/types.ts`.

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):** Zwraca obiekt JSON zgodny z typem `RepertoireDto`.
  ```json
  {
    "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
    "publicId": "8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
    "name": "Ognisko 2025",
    "description": "Wieczorne granie",
    "publishedAt": null,
    "createdAt": "2025-10-15T08:30:11Z",
    "updatedAt": "2025-10-15T08:45:27Z",
    "songs": [
      {
        "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
        "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
        "title": "Knockin' on Heaven's Door",
        "position": 1,
        "content": "Mama, take this badge off of me..." // lub null
      }
    ]
  }
  ```
- **Błędy:**
  - `400 Bad Request`: Nieprawidłowy format `id`.
  - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
  - `403 Forbidden`: Dostęp zabroniony przez polityki bezpieczeństwa (np. RLS).
  - `404 Not Found`: Repertuar o podanym `id` nie istnieje lub nie należy do użytkownika.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do funkcji Supabase `repertoires`.
2.  Główny router (`index.ts`) identyfikuje ścieżkę `/repertoires/{id}` i przekazuje żądanie do odpowiedniego handlera w `repertoires.handlers.ts`.
3.  Handler waliduje poprawność formatu `id` (UUID) oraz odczytuje opcjonalny parametr `includeSongContent`.
4.  Handler uwierzytelnia użytkownika i pobiera jego `organizerId`.
5.  Handler wywołuje funkcję `getRepertoireById` z `repertoires.service.ts`, przekazując `repertoireId`, `organizerId` i `includeSongContent`.
6.  Serwis wykonuje zapytanie do tabeli `repertoires` w celu znalezienia rekordu pasującego do `id` i `organizer_id`.
7.  Jeśli repertuar zostanie znaleziony, serwis wykonuje drugie zapytanie, aby pobrać wszystkie powiązane piosenki z tabel `repertoire_songs` (dla `position`) i `songs` (dla `title` i opcjonalnie `content`), sortując wyniki po `position`.
8.  Serwis konstruuje obiekt `RepertoireDto` z pobranych danych i zwraca go do handlera.
9.  Handler formatuje odpowiedź HTTP z kodem `200 OK` i ciałem zawierającym DTO.
10. W przypadku błędu (np. nieznalezienia zasobu), serwis rzuca `ApplicationError`, który jest przechwytywany przez handler i mapowany na odpowiedni kod statusu HTTP.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy nagłówek `Authorization: Bearer <JWT>`. Funkcja sprawdzi ważność tokena.
- **Autoryzacja:** Dostęp do zasobu jest ograniczony wyłącznie do jego właściciela. Logika serwisu musi zawierać warunek `WHERE organizer_id = auth.uid()` we wszystkich zapytaniach do bazy danych. Jest to dodatkowe zabezpieczenie oprócz polityk RLS na poziomie bazy danych.
- **Walidacja danych wejściowych:** Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
- **Zapytania do bazy danych:** Wykonywane są dwa główne zapytania: jedno dla repertuaru i jedno dla powiązanych piosenek. Są one wydajne i korzystają z indeksów na kluczach głównych i obcych (`repertoires.id`, `repertoire_songs.repertoire_id`).
- **Pobieranie treści piosenek:** Pole `content` piosenek może być duże. Jest ono pobierane warunkowo (tylko z `includeSongContent=true`), co optymalizuje domyślne wywołania, np. przy listowaniu repertuarów w panelu zarządzania.
- **Indeksy:** Zapytanie o piosenki w repertuarze powinno wykorzystywać indeks `repertoire_songs_repertoire_position_idx` dla szybkiego sortowania.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu (`repertoires.service.ts`):**
    -   Utwórz nową, asynchroniczną funkcję `getRepertoireById({ repertoireId, organizerId, includeContent })`.
    -   Zaimplementuj logikę pobierania danych repertuaru z tabeli `repertoires` z warunkiem na `id` i `organizer_id`.
    -   W przypadku braku wyników, rzuć `ApplicationError` z kodem `resource_not_found`.
    -   Zaimplementuj logikę pobierania powiązanych piosenek z `repertoire_songs`, łącząc z `songs`, aby uzyskać tytuł i pozycję. Sortuj wyniki po `position ASC`.
    -   Dodaj warunkowe dołączanie pola `content` z tabeli `songs` na podstawie flagi `includeContent`.
    -   Zmapuj wyniki z bazy danych na obiekty `RepertoireSongDto`.
    -   Skonstruuj i zwróć finalny obiekt `RepertoireDto`.
2.  **Aktualizacja handlera (`repertoires.handlers.ts`):**
    -   Utwórz nowy handler `handleGetRepertoireById(req, urlParams)`.
    -   Zwaliduj `id` z `urlParams` przy użyciu `zod`.
    -   Odczytaj i zinterpretuj parametr `includeSongContent` z obiektu `req`.
    -   Wywołaj `getRepertoireById` z serwisu, przekazując zweryfikowane parametry.
    -   Obsłuż pomyślną odpowiedź, zwracając obiekt DTO z kodem `200 OK`.
    -   Dodaj `try-catch` do obsługi błędów rzucanych przez serwis i mapuj je na odpowiednie odpowiedzi HTTP.
3.  **Aktualizacja routera (`index.ts`):**
    -   W głównym routerze dodaj nową regułę obsługującą żądania `GET` dla ścieżki pasującej do wzorca `^/repertoires/([^/]+)$`.
    -   Upewnij się, że ta reguła jest sprawdzana przed bardziej ogólnymi ścieżkami (jeśli takie istnieją).
    -   Powiąż wzorzec ścieżki z nowo utworzonym handlerem `handleGetRepertoireById`.
