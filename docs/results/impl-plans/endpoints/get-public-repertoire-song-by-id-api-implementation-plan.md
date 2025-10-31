# API Endpoint Implementation Plan: GET /public/repertoires/{publicId}/songs/{songPublicId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest przeznaczony dla anonimowych użytkowników (biesiadników) i służy do pobierania szczegółów pojedynczej piosenki w kontekście publicznego repertuaru. Odpowiedź zawiera pełną treść piosenki (z akordami) oraz metadane nawigacyjne, które umożliwiają łatwe przechodzenie do poprzedniej i następnej piosenki. Usunięcie akordów na potrzeby widoku biesiadnika odbywa się po stronie aplikacji klienckiej (frontend).

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/public/repertoires/{publicId}/songs/{songPublicId}`
- **Parametry:**
  - **Wymagane:**
    - `publicId` (UUID, w ścieżce): Publiczny identyfikator repertuaru.
    - `songPublicId` (UUID, w ścieżce): Publiczny identyfikator piosenki.
- **Request Body:** Brak

## 3. Wykorzystywane typy
- `PublicRepertoireSongDto` (z `packages/contracts/types.ts`): Główny obiekt transferu danych dla odpowiedzi.
- `PublicRepertoireSongOrderDto` (z `packages/contracts/types.ts`): Zagnieżdżony obiekt opisujący nawigację.

## 4. Szczegóły odpowiedzi
- **Sukces (`200 OK`):** Zwraca obiekt `PublicRepertoireSongDto`.
  ```json
  {
    "title": "Knockin' on Heaven's Door",
    "content": "Mama, take this badge off of me...",
    "order": {
      "position": 2,
      "total": 12,
      "previous": "https://<app_url>/public/repertoires/<publicId>/songs/<prevSongPublicId>",
      "next": "https://<app_url>/public/repertoires/<publicId>/songs/<nextSongPublicId>"
    }
  }
  ```
- **Błędy:**
  - `400 Bad Request`: Nieprawidłowy format UUID w parametrach ścieżki.
  - `404 Not Found`: Repertuar lub piosenka nie istnieją, lub piosenka nie jest częścią danego repertuaru.
  - `410 Gone`: Zasób istnieje, ale nie jest już opublikowany (`published_at` ma wartość `NULL`).

## 5. Przepływ danych
1. Żądanie `GET` trafia do Supabase Edge Function `public`.
2. Główny router w `supabase/functions/public/index.ts` dopasowuje wzorzec URL `/repertoires/([^/]+)/songs/([^/]+)` i przekazuje żądanie do odpowiedniego handlera w `public.handlers.ts`.
3. Handler `handleGetPublicRepertoireSong` waliduje format parametrów `publicId` i `songPublicId` przy użyciu Zod. W przypadku błędu zwraca `400`.
4. Handler wywołuje funkcję serwisową `getPublicRepertoireSongDetails(publicId, songPublicId)` z `public.service.ts`.
5. Funkcja serwisowa wywołuje funkcję RPC w bazie danych PostgreSQL (np. `get_public_repertoire_song_details`), która w ramach jednej transakcji:
    a. Znajduje repertuar i piosenkę na podstawie ich `public_id`.
    b. Weryfikuje, czy oba zasoby są opublikowane (`published_at IS NOT NULL`) i czy piosenka jest powiązana z repertuarem.
    c. Używa funkcji okna (`ROW_NUMBER`, `COUNT`, `LAG`, `LEAD`) na posortowanej liście piosenek repertuaru, aby uzyskać pozycję, liczbę całkowitą oraz `public_id` poprzedniej i następnej piosenki.
    d. Zwraca wszystkie te dane w jednym wierszu.
6. Serwis sprawdza wynik z RPC:
    - Jeśli funkcja nie zwróci wiersza, rzuca błąd `ResourceNotFound`.
    - Jeśli zasób nie jest opublikowany, rzuca błąd `ResourceGone`.
7. Serwis konstruuje pełne adresy URL dla `previous` i `next` na podstawie zwróconych `public_id`.
8. Serwis zwraca zmapowany obiekt `PublicRepertoireSongDto` do handlera.
9. Handler opakowuje DTO w odpowiedź HTTP z kodem `200 OK` i wysyła do klienta. Błędy z serwisu są mapowane na odpowiednie statusy HTTP (`404`, `410`).

## 6. Względy bezpieczeństwa
- **Brak autoryzacji:** Endpoint jest publiczny i nie wymaga tokena JWT.
- **Kontrola dostępu:** Dostęp do danych jest kontrolowany przez polityki Row Level Security (RLS) w PostgreSQL, które filtrują nieopublikowane repertuary i piosenki. Zapytanie w funkcji RPC musi być wykonane w kontekście użytkownika, który podlega tym politykom (domyślnie `anon`).
- **Walidacja wejścia:** Sprawdzanie formatu UUID chroni przed prostymi próbami manipulacji URL.

## 7. Rozważania dotyczące wydajności
- **Zapytanie do bazy danych:** Kluczowe jest wykonanie wszystkich operacji w jednym zapytaniu do bazy danych za pomocą funkcji RPC. Pozwala to uniknąć wielokrotnych zapytań (N+1 problem).
- **Indeksowanie:** Kolumny `public_id` w tabelach `repertoires` i `songs` oraz klucze obce w `repertoire_songs` muszą być odpowiednio zindeksowane, aby zapewnić szybkie wyszukiwanie.

## 8. Etapy wdrożenia
1. **Baza danych (PostgreSQL):**
   - Stworzyć funkcję RPC `get_public_repertoire_song_details(repertoire_public_id UUID, song_public_id UUID)`, która hermetyzuje logikę pobierania danych piosenki i nawigacji.
   - Zweryfikować istnienie indeksów na kolumnach `repertoires(public_id)` i `songs(public_id)`.

2. **Warstwa serwisu (`public.service.ts`):**
   - Zaimplementować nową funkcję `getPublicRepertoireSongDetails(publicId, songPublicId)`.
   - Funkcja ta będzie wywoływać RPC, obsługiwać przypadki braku danych (NotFound, Gone) i mapować wynik na `PublicRepertoireSongDto`, włączając konstrukcję URL-i nawigacyjnych.

3. **Warstwa handlera (`public.handlers.ts`):**
   - Dodać nowy handler `handleGetPublicRepertoireSong(req, params)`.
   - Zaimplementować walidację parametrów ścieżki za pomocą Zod.
   - Wywołać funkcję serwisową, przechwycić jej wyniki lub błędy i zwrócić odpowiednią odpowiedź HTTP.

4. **Warstwa routingu (`index.ts`):**
   - Dodać nową regułę do routera, która będzie kierować żądania `GET /repertoires/{publicId}/songs/{songPublicId}` do nowo utworzonego handlera.
   - Upewnić się, że nowa reguła nie koliduje z istniejącymi i ma odpowiedni priorytet.
