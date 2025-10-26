# API Endpoint Implementation Plan: GET /public/songs/{publicId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia anonimowym użytkownikom pobranie treści opublikowanej piosenki na podstawie jej publicznego identyfikatora (`publicId`). Zwraca podstawowe dane piosenki, w tym tytuł i pełną treść z akordami. Endpoint jest przeznaczony do publicznego udostępniania i nie wymaga uwierzytelniania.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/public/songs/{publicId}`
- **Parametry**:
  - **Wymagane**:
    - `publicId` (UUID): Publiczny, unikalny identyfikator piosenki przekazywany w ścieżce URL.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`PublicSongDto`**: Służy do strukturyzowania danych w odpowiedzi na żądanie.
  ```typescript
  export type PublicSongDto = {
    title: string;
    content: string; // Pełna treść piosenki z akordami
    repertoireNavigation: PublicSongNavigationDto | null;
  };
  ```
- **`ErrorResponseDto`**: Standardowy format odpowiedzi w przypadku wystąpienia błędu.
  ```typescript
  export type ErrorResponseDto = {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
  ```

## 4. Szczegóły odpowiedzi
- **Sukces (`200 OK`)**: Zwraca obiekt `PublicSongDto` z danymi piosenki.
  ```json
  {
    "title": "Knockin' on Heaven's Door",
    "content": "Mama, take this badge off of me...",
    "repertoireNavigation": null
  }
  ```
- **Błędy**:
  - `400 Bad Request`: Zwracany, gdy `publicId` ma nieprawidłowy format (nie jest UUID).
  - `404 Not Found`: Zwracany, gdy piosenka o podanym `publicId` nie istnieje lub nie została opublikowana (`published_at` jest `NULL`).
  - `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych
1. Żądanie `GET` trafia do Supabase Edge Function `songs`.
2. Router w `supabase/functions/songs/index.ts` dopasowuje ścieżkę `/public/([^/]+)` i przekazuje żądanie do odpowiedniego handlera w `songs.handlers.ts`.
3. Handler `handleGetPublicSong` waliduje parametr `publicId` przy użyciu `Zod`, sprawdzając, czy jest to prawidłowy UUID.
4. Jeśli walidacja się powiedzie, handler wywołuje metodę serwisową `getPublicSongByPublicId(publicId)` z `songs.service.ts`.
5. Metoda serwisowa wykonuje zapytanie do tabeli `songs` w bazie danych: `SELECT title, content FROM songs WHERE public_id = :publicId AND published_at IS NOT NULL LIMIT 1;`.
6. **Scenariusz sukcesu**: Jeśli zapytanie zwróci piosenkę, serwis zwraca jej dane (`title`, `content`) do handlera. Handler formatuje odpowiedź jako `PublicSongDto` (z `repertoireNavigation: null`) i odsyła ją z kodem statusu `200 OK`.
7. **Scenariusz błędu (Not Found)**: Jeśli zapytanie nie zwróci piosenki (brak rekordu lub `published_at` jest `NULL`), serwis rzuca błąd `ResourceNotFoundError`. Handler przechwytuje błąd i zwraca odpowiedź `404 Not Found` w formacie `ErrorResponseDto`.
8. **Scenariusz błędu (Validation)**: Jeśli `publicId` nie jest poprawnym UUID, handler zwraca `400 Bad Request` w formacie `ErrorResponseDto`.

## 6. Względy bezpieczeństwa
- **Brak uwierzytelniania**: Endpoint jest publiczny, co jest zgodne z jego przeznaczeniem.
- **Kontrola dostępu do danych**: Dostęp jest ograniczony wyłącznie do opublikowanych piosenek. Jest to realizowane przez:
  1. **Warstwę aplikacji**: Jawny warunek `published_at IS NOT NULL` w zapytaniu SQL w `songs.service.ts`.
  2. **Warstwę bazy danych**: Polityka Row Level Security `songs_public_read` zapewnia, że tylko opublikowane piosenki mogą być odczytywane przez anonimowe zapytania.
- **Walidacja danych wejściowych**: Sprawdzanie formatu `publicId` zapobiega próbom wykonania zapytań z nieprawidłowymi danymi.
- **Zapobieganie SQL Injection**: Użycie klienta `supabase-js` zapewnia parametryzację zapytań, co chroni przed atakami SQL Injection.

## 7. Rozważania dotyczące wydajności
- **Indeksowanie**: Kolumna `public_id` w tabeli `songs` ma ograniczenie `UNIQUE`, co oznacza, że jest automatycznie indeksowana. Zapytania filtrujące po tej kolumnie będą bardzo wydajne.
- **Selektywne pobieranie kolumn**: Zapytanie pobiera tylko niezbędne kolumny (`title`, `content`), co minimalizuje transfer danych między bazą a funkcją serwerową.
- **Złożoność**: Operacja polega na prostym odczycie jednego rekordu, więc nie przewiduje się problemów z wydajnością.

## 8. Etapy wdrożenia
1.  **Modyfikacja routera (`supabase/functions/songs/index.ts`)**:
    -   Dodać nową logikę do głównego routera, aby obsługiwać ścieżki publiczne, np. `/public/...`.
    -   Nowa ścieżka powinna przechwytywać `publicId` i delegować żądanie do nowego handlera.

    ```typescript
    // ... wewnątrz Deno.serve
    const publicMatch = url.pathname.match(/\/public\/([^/]+)/);
    if (publicMatch && req.method === 'GET') {
        return await handleGetPublicSong(req, { publicId: publicMatch[1] });
    }
    // ... reszta routera
    ```

2.  **Implementacja handlera (`supabase/functions/songs/songs.handlers.ts`)**:
    -   Stworzyć nową, eksportowaną funkcję `handleGetPublicSong(req, { publicId })`.
    -   Zaimplementować walidację `publicId` przy użyciu `Zod`.
    -   Wywołać funkcję serwisową `getPublicSongByPublicId`.
    -   Obsłużyć logikę sukcesu (zwrócenie `200 OK` z `PublicSongDto`) i błędów (zwrócenie `400` lub `404`).

3.  **Implementacja logiki w serwisie (`supabase/functions/songs/songs.service.ts`)**:
    -   Stworzyć nową, eksportowaną funkcję asynchroniczną `getPublicSongByPublicId(publicId: string)`.
    -   Wewnątrz funkcji użyć klienta Supabase do wykonania zapytania do tabeli `songs`.
    -   Zapytanie musi zawierać klauzule `where('public_id', 'eq', publicId)` oraz `not('published_at', 'is', null)`.
    -   Jeśli piosenka nie zostanie znaleziona, funkcja powinna rzucić błąd `new ApplicationError('Song not found or not published', 'resource_not_found')`.
    -   W przypadku sukcesu, zwrócić obiekt zawierający `title` i `content`.

4.  **Testowanie lokalne**:
    -   Uruchomić środowisko lokalne za pomocą `supabase start`.
    -   Przygotować dane testowe: jedną piosenkę opublikowaną i jedną nieopublikowaną.
    -   Wykonać zapytania `curl` lub użyć klienta REST do przetestowania scenariuszy:
        -   **Sukces**: `curl http://localhost:54321/functions/v1/songs/public/{published-song-public-id}` (oczekiwany status `200 OK`).
        -   **Błąd - nieopublikowana**: `curl http://localhost:54321/functions/v1/songs/public/{unpublished-song-public-id}` (oczekiwany status `404 Not Found`).
        -   **Błąd - nie istnieje**: `curl http://localhost:54321/functions/v1/songs/public/{non-existent-uuid}` (oczekiwany status `404 Not Found`).
        -   **Błąd - zły format ID**: `curl http://localhost:54321/functions/v1/songs/public/not-a-uuid` (oczekiwany status `400 Bad Request`).
