# API Endpoint Implementation Plan: GET /me/biesiada/repertoires/{id}/songs

## 1. Przegląd punktu końcowego
Ten punkt końcowy zwraca uporządkowaną listę piosenek dla określonego repertuaru, zoptymalizowaną pod kątem trybu "Biesiada". Odpowiedź zawiera podstawowe dane repertuaru, metadane do udostępniania oraz listę piosenek z ich tytułami i pozycjami. Dostęp jest ograniczony do właściciela repertuaru.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/me/biesiada/repertoires/{id}/songs`
-   **Parametry:**
    -   **Wymagane:**
        -   `id` (w ścieżce) - UUID repertuaru.
    -   **Opcjonalne:** Brak.
-   **Request Body:** Brak.

## 3. Wykorzystywane typy
Konieczne jest zdefiniowanie nowego typu DTO w `packages/contracts/types.ts` w sekcji `Biesiada Mode DTOs`, ponieważ istniejące typy nie odpowiadają wymaganej strukturze.

```typescript
// packages/contracts/types.ts

/**
 * Sharing metadata for a repertoire in Biesiada mode.
 */
export type BiesiadaRepertoireShareMetaDto = {
    publicUrl: string;
    qrPayload: string;
};

/**
 * A simplified song entry for a repertoire list in Biesiada mode.
 */
export type BiesiadaRepertoireSongEntryDto = {
    songId: SongRow['id'];
    title: SongRow['title'];
    position: RepertoireSongRow['position'];
};

/**
 * Response containing a list of songs for a specific repertoire in Biesiada mode,
 * including repertoire-level sharing information.
 * Used in: GET /me/biesiada/repertoires/{id}/songs
 */
export type BiesiadaRepertoireSongListResponseDto = {
    repertoireId: RepertoireRow['id'];
    repertoireName: RepertoireRow['name'];
    share: BiesiadaRepertoireShareMetaDto;
    songs: BiesiadaRepertoireSongEntryDto[];
};
```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK):**
    ```json
    {
      "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
      "repertoireName": "Ognisko 2025",
      "share": {
        "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
        "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
      },
      "songs": [
        {
          "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
          "title": "Knockin' on Heaven's Door",
          "position": 1
        },
        {
          "songId": "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d",
          "title": "Hej Sokoły",
          "position": 2
        }
      ]
    }
    ```
-   **Kody statusu błędów:** `400`, `401`, `404`, `500`.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do głównego routera w `supabase/functions/me/index.ts`.
2.  Router dopasowuje wzorzec `/biesiada/repertoires/([^/]+)/songs` i przekazuje żądanie do odpowiedniego handlera w `biesiada.handlers.ts`.
3.  Handler (`handleGetBiesiadaRepertoireSongs`) waliduje format UUID parametru `id` z URL.
4.  Handler wywołuje funkcję serwisową `getBiesiadaRepertoireSongs({ repertoireId, userId })` z `biesiada.service.ts`.
5.  Serwis wykonuje pojedyncze zapytanie do bazy danych, aby pobrać:
    -   Dane repertuaru (`id`, `name`, `public_id`) z tabeli `repertoires`, filtrując po `id` i `organizer_id`.
    -   Listę powiązanych piosenek (`song_id`, `title`, `position`), łącząc tabele `repertoire_songs` i `songs`.
6.  Jeśli zapytanie nie zwróci repertuaru, serwis rzuca błąd `ApplicationError` z kodem `resource_not_found`.
7.  Serwis konstruuje `publicUrl` i `qrPayload` na podstawie `public_id` repertuaru i bazowych URL-i ze zmiennych środowiskowych.
8.  Serwis mapuje wyniki zapytania na DTO `BiesiadaRepertoireSongListResponseDto` i zwraca je do handlera.
9.  Handler serializuje DTO do formatu JSON i odsyła odpowiedź z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Endpoint jest chroniony. Klient Supabase automatycznie zweryfikuje poprawność tokena JWT z nagłówka `Authorization`.
-   **Autoryzacja:** Logika serwisu musi bezwzględnie weryfikować, czy żądany repertuar należy do uwierzytelnionego użytkownika poprzez dodanie warunku `organizer_id = auth.uid()` do zapytania SQL. Jest to dodatkowo zabezpieczone przez polityki RLS w bazie danych.
-   **Walidacja wejścia:** Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
-   Kluczowe jest wykonanie jednego, zoptymalizowanego zapytania SQL z użyciem `JOIN`, aby uniknąć problemu N+1 zapytań.
-   Zapytanie powinno wykorzystywać istniejące indeksy na kolumnach `repertoires.organizer_id`, `repertoire_songs.repertoire_id` oraz kluczach głównych.
-   Należy pobierać tylko niezbędne kolumny (`repertoires.id`, `name`, `public_id` oraz `songs.id`, `title`, `repertoire_songs.position`), aby zminimalizować transfer danych.

## 8. Etapy wdrożenia
1.  **Definicja typów:** Dodaj nowe typy `BiesiadaRepertoireShareMetaDto`, `BiesiadaRepertoireSongEntryDto` i `BiesiadaRepertoireSongListResponseDto` do pliku `packages/contracts/types.ts`.
2.  **Utworzenie serwisu:** Jeśli nie istnieje, utwórz plik `supabase/functions/me/biesiada.service.ts`.
3.  **Implementacja logiki w serwisie:**
    -   Stwórz funkcję `getBiesiadaRepertoireSongs(options: { repertoireId: string, userId: string }): Promise<BiesiadaRepertoireSongListResponseDto>`.
    -   Zaimplementuj w niej logikę pobierania danych z bazy, sprawdzania uprawnień i mapowania na DTO.
    -   Dodaj logikę generowania `publicUrl` i `qrPayload`.
4.  **Implementacja handlera:**
    -   W pliku `supabase/functions/me/biesiada.handlers.ts` utwórz funkcję `handleGetBiesiadaRepertoireSongs(req: Request, supabase: SupabaseClient, user: User, repertoireId: string)`.
    -   Dodaj walidację formatu `repertoireId`.
    -   Wywołaj funkcję serwisową, przekazując `repertoireId` i `user.id`.
    -   Obsłuż potencjalne błędy z serwisu i zwróć odpowiednią odpowiedź HTTP.
5.  **Aktualizacja routera:**
    -   W `supabase/functions/me/index.ts` (lub w routerze `biesiada`), dodaj nową ścieżkę, która będzie obsługiwać `GET` dla wzorca `/biesiada/repertoires/([^/]+)/songs` i kierować do nowo utworzonego handlera.
6.  **Zmienne środowiskowe:** Upewnij się, że zmienne środowiskowe potrzebne do konstruowania `publicUrl` (np. `APP_BASE_URL`) są dostępne dla Edge Function.
7.  **Testy:** Zaimplementuj testy jednostkowe dla logiki serwisu, zwłaszcza dla sprawdzania uprawnień i poprawnego mapowania danych.
