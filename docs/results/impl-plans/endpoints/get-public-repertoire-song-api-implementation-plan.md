# API Endpoint Implementation Plan: GET /public/repertoires/{publicId}/songs/{songPublicId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy dostarcza szczegółowych informacji o pojedynczej, publicznie dostępnej piosence w kontekście konkretnego repertuaru. Został zaprojektowany dla anonimowych użytkowników (biesiadników) i zawiera dane nawigacyjne, które umożliwiają łatwe przechodzenie do poprzedniej i następnej piosenki w repertuarze.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/public/repertoires/{publicId}/songs/{songPublicId}`
-   **Parametry:**
    -   **Wymagane:**
        -   `publicId` (w ścieżce): Publiczny identyfikator UUID repertuaru.
        -   `songPublicId` (w ścieżce): Publiczny identyfikator UUID piosenki.
-   **Request Body:** Brak.

## 3. Wykorzystywane typy
-   `PublicRepertoireSongDto`: Główny typ danych odpowiedzi.
-   `PublicRepertoireSongOrderDto`: Struktura zawierająca informacje o kolejności i nawigacji.
-   `PublicSongNavLinkDto`: Struktura dla linków do poprzedniej/następnej piosenki.

## 4. Szczegóły odpowiedzi
-   **Sukces (200 OK):** Zwraca obiekt JSON zgodny z typem `PublicRepertoireSongDto`.
    ```json
    {
      "title": "Knockin' on Heaven's Door",
      "content": "Mama, take this badge off of me...",
      "order": {
        "position": 2,
        "total": 12,
        "previous": {
          "url": "https://app.strummerbox.com/public/repertoires/8729a118-.../songs/prev-id",
          "title": "Hej Sokoły"
        },
        "next": {
          "url": "https://app.strummerbox.com/public/repertoires/8729a118-.../songs/next-id",
          "title": "Wonderwall"
        }
      }
    }
    ```
-   **Błędy:**
    -   `400 Bad Request`: Nieprawidłowy format UUID.
    -   `404 Not Found`: Zasób nie istnieje, nie jest opublikowany lub piosenka nie należy do repertuaru.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do Supabase Edge Function `public`.
2.  Główny router w `index.ts` dopasowuje wzorzec `/repertoires/([^/]+)/songs/([^/]+)` i przekazuje żądanie do odpowiedniego handlera w `public.handlers.ts`.
3.  Handler wyodrębnia `publicId` i `songPublicId` z adresu URL.
4.  Handler waliduje, czy oba identyfikatory są w formacie UUID. Jeśli nie, zwraca błąd `400`.
5.  Handler wywołuje funkcję serwisową `getPublicRepertoireSongDetails(repertoirePublicId, songPublicId)` z `public.service.ts`.
6.  Funkcja serwisowa wykonuje pojedyncze, złożone zapytanie do bazy danych PostgreSQL, które:
    a. Łączy tabele `repertoires`, `repertoire_songs` i `songs`.
    b. Filtruje wyniki na podstawie przekazanych `publicId` i `songPublicId`.
    c. Sprawdza, czy `repertoires.published_at` nie jest `NULL`.
    d. Używa funkcji okienkowych `LAG()` i `LEAD()` partycjonowanych przez `repertoire_id` i uporządkowanych według `position`, aby znaleźć `public_id` i `title` poprzedniej oraz następnej piosenki.
    e. Zlicza całkowitą liczbę piosenek w danym repertuarze.
7.  Jeśli zapytanie nie zwróci wyników (zasób nie istnieje, nie jest opublikowany lub relacja nie istnieje), serwis rzuca błąd `ApplicationError` z kodem `resource_not_found`.
8.  Serwis przetwarza wynik zapytania:
    a. Usuwa akordy z treści piosenki za pomocą istniejącej funkcji `stripChords`.
    b. Konstruuje pełne adresy URL dla linków nawigacyjnych (`previous` i `next`) na podstawie `public_id` sąsiednich piosenek i bazowego adresu URL aplikacji.
    c. Tworzy i zwraca obiekt `PublicRepertoireSongDto`.
9.  Handler przechwytuje zwrócony obiekt DTO i wysyła go jako odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
-   **Autoryzacja:** Endpoint jest publiczny i nie wymaga uwierzytelnienia.
-   **Walidacja danych:** Identyfikatory `publicId` i `songPublicId` muszą być walidowane jako UUID, aby zapobiec błędom zapytań do bazy danych.
-   **Kontrola dostępu:** Zapytanie w warstwie serwisowej musi bezwzględnie zawierać warunek `WHERE repertoires.published_at IS NOT NULL`. Dodatkową ochronę zapewniają skonfigurowane w bazie danych polityki RLS (`repertoires_public_read`, `repertoire_songs_public_read`), które uniemożliwiają odczyt nieopublikowanych danych.

## 7. Rozważania dotyczące wydajności
-   Aby zminimalizować liczbę zapytań do bazy danych, wszystkie wymagane dane (bieżąca piosenka, sąsiednie piosenki, całkowita liczba) powinny być pobrane w ramach jednego, zoptymalizowanego zapytania SQL. Wykorzystanie funkcji okienkowych jest tutaj kluczowe.
-   Należy rozważyć dodanie indeksów na kolumnach `public_id` w tabelach `repertoires` i `songs`, jeśli jeszcze nie istnieją, aby przyspieszyć wyszukiwanie.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu (`public.service.ts`):**
    -   Dodać nową, asynchroniczną funkcję `getPublicRepertoireSongDetails(repertoirePublicId: string, songPublicId: string): Promise<PublicRepertoireSongDto>`.
    -   Wewnątrz funkcji zaimplementować logikę zapytania do bazy danych (preferowane użycie `.rpc()` z nową funkcją bazodanową lub złożonego `.select()` z funkcjami `LAG`/`LEAD`).
    -   Dodać logikę do obsługi przypadku, gdy zasób nie zostanie znaleziony (rzucenie `ApplicationError`).
    -   Zaimplementować mapowanie wyniku z bazy na DTO `PublicRepertoireSongDto`, włączając usuwanie akordów i budowanie linków nawigacyjnych.
2.  **Aktualizacja handlera (`public.handlers.ts`):**
    -   Utworzyć nową funkcję `handleGetPublicRepertoireSong(req: Request, params: { repertoirePublicId: string, songPublicId: string }): Promise<Response>`.
    -   Dodać walidację formatu UUID dla `repertoirePublicId` i `songPublicId`.
    -   Wywołać nową funkcję z serwisu i przekazać jej zweryfikowane parametry.
    -   Zwrócić odpowiedź JSON z kodem `200` lub obsłużyć błąd rzucony przez serwis.
3.  **Aktualizacja routera (`index.ts`):**
    -   Dodać nową regułę do routera, która obsłuży ścieżkę `/repertoires/([^/]+)/songs/([^/]+)`.
    -   Wzorzec ten powinien wywoływać nowo utworzoną funkcję handlera z `public.handlers.ts`, przekazując wyodrębnione identyfikatory.
