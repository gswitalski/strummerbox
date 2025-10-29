# API Endpoint Implementation Plan: GET /public/songs/{publicId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia anonimowym użytkownikom pobranie treści opublikowanej piosenki na podstawie jej publicznego identyfikatora (`publicId`). Endpoint jest przeznaczony do publicznego udostępniania piosenek i nie wymaga uwierzytelniania. Zwraca tytuł oraz treść piosenki bez akordów.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/public/songs/{publicId}`
- **Parametry:**
  - **Wymagane:**
    - `publicId` (w ścieżce URL): Publiczny identyfikator piosenki w formacie UUID.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **Odpowiedź (DTO):** `PublicSongDto`
  ```typescript
  export type PublicSongDto = {
    title: string;
    content: string; // Treść bez akordów
    repertoireNavigation: null;
  };
  ```

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):** Zwraca obiekt JSON zgodny z `PublicSongDto`.
  ```json
  {
    "title": "Tytuł Piosenki",
    "content": "Treść piosenki bez akordów...",
    "repertoireNavigation": null
  }
  ```
- **Błędy:**
  - `400 Bad Request`: Jeśli `publicId` nie jest prawidłowym identyfikatorem UUID.
  - `404 Not Found`: Jeśli piosenka o podanym `publicId` nie istnieje lub nie została opublikowana.
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych
1.  Użytkownik wysyła żądanie `GET` na adres `/public/songs/{publicId}`.
2.  Supabase Edge Function `public-content` odbiera żądanie.
3.  Router w `index.ts` dopasowuje ścieżkę i przekazuje żądanie do handlera w `public-songs.handlers.ts`.
4.  Handler waliduje parametr `publicId` przy użyciu Zod, sprawdzając, czy jest to poprawny UUID.
5.  Jeśli walidacja się powiedzie, handler wywołuje metodę `getPublishedSongByPublicId` z serwisu `public-songs.service.ts`.
6.  Serwis wykonuje zapytanie do bazy danych Supabase, wyszukując w tabeli `songs` rekordu z pasującym `public_id` oraz warunkiem `published_at IS NOT NULL`.
7.  Jeśli piosenka zostanie znaleziona, serwis usuwa z jej treści akordy (np. `[Am]`, `[G]`) i zwraca dane do handlera.
8.  Handler formatuje odpowiedź HTTP z kodem `200 OK` i zwraca DTO `PublicSongDto`.
9.  Jeśli piosenka nie zostanie znaleziona, serwis rzuca błąd, który handler przechwytuje i zwraca odpowiedź `404 Not Found`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint jest publiczny i nie wymaga uwierzytelniania.
- **Autoryzacja:** Dostęp do danych jest ograniczony na poziomie bazy danych przez politykę Row Level Security (RLS) `songs_public_read`, która zezwala na odczyt tylko tych piosenek, których pole `published_at` nie jest `NULL`.
- **Walidacja danych:** Parametr `publicId` jest walidowany, aby upewnić się, że jest to poprawny UUID, co zapobiega błędom i potencjalnym atakom.

## 7. Obsługa błędów
- **`publicId` nie jest UUID:** Handler zwraca `400 Bad Request` z komunikatem o błędzie walidacji.
- **Piosenka nie znaleziona / nieopublikowana:** Serwis rzuca błąd `ApplicationError`. Handler przechwytuje go i zwraca `404 Not Found`.
- **Błąd bazy danych:** Klient Supabase może zwrócić błąd, który jest przechwytywany i logowany. Użytkownik otrzymuje ogólną odpowiedź `500 Internal Server Error`.
- **Logowanie:** Błędy serwera (5xx) są logowane na poziomie `error`, a błędy klienta (4xx) na poziomie `info`.

## 8. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest proste i wykorzystuje indeks na kolumnie `public_id`, co zapewnia wysoką wydajność.
- Operacja usuwania akordów z tekstu jest wykonywana w pamięci i nie powinna stanowić wąskiego gardła dla typowych długości piosenek.

## 9. Etapy wdrożenia
1.  **Utworzenie struktury plików:**
    - Utwórz nowy katalog `supabase/functions/public-content/`.
    - Wewnątrz niego stwórz pliki: `index.ts`, `public-songs.handlers.ts`, `public-songs.service.ts`.
    - W `supabase/functions/_shared/` (lub w nowym `public-content/_utils/`) utwórz plik z funkcją pomocniczą do usuwania akordów, np. `chord-stripper.ts`.

2.  **Implementacja serwisu (`public-songs.service.ts`):**
    - Zaimplementuj funkcję `getPublishedSongByPublicId(publicId: string)`.
    - Użyj klienta Supabase, aby wykonać zapytanie `SELECT title, content FROM songs WHERE public_id = :publicId AND published_at IS NOT NULL`.
    - W przypadku braku wyników rzuć błąd `ApplicationError({ code: 'resource_not_found' })`.
    - Zaimplementuj logikę usuwania akordów z pola `content` (np. za pomocą wyrażenia regularnego `content.replace(/\[.*?\]/g, '')`).
    - Zwróć obiekt `{ title, content }`.

3.  **Implementacja handlera (`public-songs.handlers.ts`):**
    - Zdefiniuj schemat walidacji Zod dla `publicId` (`z.string().uuid()`).
    - Stwórz funkcję `handleGetPublicSong`, która przyjmuje `request` i `params`.
    - Zwaliduj `publicId` z `params`. W razie błędu zwróć `400 Bad Request`.
    - Wywołaj funkcję z serwisu, przekazując `publicId`.
    - Zbuduj odpowiedź `PublicSongDto`, ustawiając `repertoireNavigation` na `null`.
    - Zwróć odpowiedź HTTP z kodem `200 OK` i ciałem DTO.
    - Dodaj blok `try...catch` do obsługi błędów z serwisu i zwracania odpowiednich kodów HTTP (np. `404`).

4.  **Implementacja routera (`index.ts`):**
    - Stwórz główny router dla funkcji.
    - Zdefiniuj ścieżkę `^/public-content/songs/([^/]+)$`, która przechwytuje `publicId`.
    - Sprawdź, czy metoda HTTP to `GET`.
    - Wywołaj handler `handleGetPublicSong`, przekazując mu żądanie i przechwycony `publicId`.
    - Zaimplementuj globalną obsługę błędów na poziomie routera.

