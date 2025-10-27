# API Endpoint Implementation Plan: GET /share/songs/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi uzyskanie metadanych do udostępniania konkretnej piosenki. Zwraca on publiczny adres URL piosenki oraz ładunek do wygenerowania kodu QR, co ułatwia dystrybucję piosenki wśród uczestników wydarzenia. Dostęp jest ograniczony wyłącznie do właściciela piosenki.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/share/songs/{id}`
-   **Parametry:**
    -   **Wymagane:**
        -   `id` (w ścieżce): Identyfikator UUID piosenki (`songs.id`), której metadane udostępniania mają zostać pobrane.
    -   **Opcjonalne:** Brak.
-   **Request Body:** Brak.

## 3. Wykorzystywane typy
-   **DTO odpowiedzi:** `SongShareMetaDto`
    ```typescript
    export type SongShareMetaDto = {
        id: SongRow['id'];
        publicId: SongRow['public_id'];
        publicUrl: string;
        qrPayload: string;
    };
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (`200 OK`):**
    ```json
    {
      "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
      "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
      "publicUrl": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2",
      "qrPayload": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2"
    }
    ```
-   **Odpowiedzi błędów:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do Supabase Edge Function o nazwie `share`.
2.  Główny router w `supabase/functions/share/index.ts` analizuje ścieżkę i na podstawie segmentu `/songs/` przekierowuje żądanie do routera zdefiniowanego w `songs.handlers.ts`.
3.  Handler `handleGetSongShareMeta` weryfikuje, czy parametr `{id}` ze ścieżki jest prawidłowym UUID.
4.  Handler wywołuje funkcję serwisową `getSongShareMeta` z `songs.service.ts`, przekazując jej `songId` z parametru oraz `organizerId` uzyskane z kontekstu uwierzytelnionego użytkownika.
5.  Serwis wykonuje zapytanie do bazy danych: `SELECT id, public_id FROM songs WHERE id = {songId} AND organizer_id = {organizerId}`.
6.  Jeśli zapytanie nie zwróci żadnego rekordu, serwis rzuca błąd `ApplicationError('resource_not_found')`.
7.  W przypadku sukcesu, serwis konstruuje pełne adresy `publicUrl` i `qrPayload`, wykorzystując `public_id` piosenki oraz bazowy adres URL aplikacji (np. `APP_PUBLIC_URL` ze zmiennych środowiskowych).
8.  Serwis zwraca obiekt `SongShareMetaDto` do handlera.
9.  Handler formatuje odpowiedź HTTP `200 OK` z otrzymanym obiektem DTO jako ciałem odpowiedzi w formacie JSON.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Endpoint jest chroniony i wymaga prawidłowego tokenu JWT w nagłówku `Authorization`.
-   **Autoryzacja:** Kluczowym mechanizmem bezpieczeństwa jest filtrowanie zapytania do bazy danych po `organizer_id` zalogowanego użytkownika. Gwarantuje to, że organizator może uzyskać dostęp tylko do metadanych swoich piosenek. Dodatkową warstwę ochrony stanowi polityka RLS zdefiniowana na tabeli `songs`.

## 7. Obsługa błędów
-   **`400 Bad Request`:** Zwracany, gdy `id` w ścieżce URL nie jest poprawnym formatem UUID.
-   **`401 Unauthorized`:** Zwracany przez gateway Supabase, gdy żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
-   **`404 Not Found`:** Zwracany, gdy piosenka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
-   **`500 Internal Server Error`:** Zwracany w przypadku nieoczekiwanych problemów po stronie serwera (np. błąd połączenia z bazą danych).

## 8. Rozważania dotyczące wydajności
-   Zapytanie do bazy danych jest wykonywane na kluczu głównym (`id`) i indeksowanej kolumnie (`organizer_id`), co zapewnia bardzo wysoką wydajność.
-   Nie przewiduje się żadnych wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 9. Etapy wdrożenia
1.  Utwórz nowy katalog dla funkcji Supabase: `supabase/functions/share`.
2.  Wewnątrz `supabase/functions/share`, stwórz plik `songs.service.ts` i zaimplementuj w nim funkcję `async getSongShareMeta({ songId, organizerId })`, która będzie realizować logikę biznesową (zapytanie do bazy, budowanie URL-i, obsługa błędu 'not found').
3.  W tym samym katalogu stwórz plik `songs.handlers.ts`. Zaimplementuj w nim:
    -   Funkcję `handleGetSongShareMeta`, która będzie parsoać i walidować `id` z żądania, wywoływać serwis i zwracać odpowiedź HTTP.
    -   Funkcję `songsRouter`, która będzie mapować ścieżki z `RegExp` (np. `/songs/([^/]+)`) na odpowiednie handlery.
4.  W katalogu `supabase/functions/share` stwórz główny plik `index.ts`, który będzie pełnił rolę routera dla całej funkcji. Powinien on delegować obsługę żądań do `songsRouter`, jeśli ścieżka pasuje do `/songs`.
5.  Dodaj wymaganą zmienną środowiskową (np. `APP_PUBLIC_URL`) w plikach `supabase/config.toml` oraz `.env` do lokalnego testowania.
6.  Zaimplementuj testy jednostkowe dla serwisu i handlera, aby zweryfikować poprawność działania logiki, walidacji i obsługi błędów.
7.  Przetestuj działanie endpointa lokalnie za pomocą `supabase functions serve share`.
