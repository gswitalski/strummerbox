# API Endpoint Implementation Plan: GET /me/biesiada/repertoires/{id}/songs/{songId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy dostarcza szczegółowych informacji o konkretnej piosence w kontekście repertuaru dla trybu "Biesiada", przeznaczonego dla organizatora. Odpowiedź zawiera treść piosenki z akordami, metadane nawigacyjne (poprzednia/następna piosenka) oraz informacje potrzebne do udostępniania publicznego. Endpoint jest zabezpieczony i dostępny tylko dla właściciela repertuaru.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/me/biesiada/repertoires/{id}/songs/{songId}`
- **Parametry:**
  - **Wymagane:**
    - `{id}` (path, UUID): Unikalny identyfikator repertuaru.
    - `{songId}` (path, UUID): Unikalny identyfikator piosenki.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **DTO odpowiedzi:** `BiesiadaRepertoireSongDetailDto`
- **Typy zagnieżdżone:**
    - `BiesiadaSongOrderDto`
    - `BiesiadaSongLinkDto`
    - `BiesiadaSongShareMetaDto`

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):** Zwraca obiekt JSON zgodny z typem `BiesiadaRepertoireSongDetailDto`.
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "repertoireName": "Ognisko 2025",
  "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama...",
  "order": {
    "position": 2,
    "total": 12,
    "previous": {
      "songId": "prev-song-id",
      "title": "Hej Sokoły"
    },
    "next": {
      "songId": "next-song-id",
      "title": "Wonderwall"
    }
  },
  "share": {
    "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
    "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
  }
}
```
- **Błędy:**
    - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    - `404 Not Found`: Repertuar lub piosenka nie zostały znalezione lub użytkownik nie ma do nich dostępu.

## 5. Przepływ danych
1.  **Router (`index.ts`):** Przyjmuje żądanie i na podstawie ścieżki (`/biesiada/repertoires/([^/]+)/songs/([^/]+)`) kieruje je do odpowiedniego handlera w `biesiada.handlers.ts`.
2.  **Handler (`biesiada.handlers.ts`):**
    -   Wyodrębnia `repertoireId` i `songId` z parametrów ścieżki.
    -   Waliduje format `repertoireId` i `songId` jako UUID.
    -   Wywołuje funkcję serwisową `getBiesiadaRepertoireSongDetails(repertoireId, songId)` w `biesiada.service.ts`.
    -   Na podstawie wyniku z serwisu formatuje odpowiedź HTTP (200 OK z danymi lub 404 Not Found).
3.  **Serwis (`biesiada.service.ts`):**
    -   Wykonuje zapytanie do bazy danych w celu pobrania wszystkich piosenek (`repertoire_songs` i `songs`) dla danego `repertoireId`, posortowanych według `position`.
    -   Sprawdza, czy zapytanie zwróciło jakiekolwiek wyniki. Jeśli nie, oznacza to, że repertuar nie istnieje lub nie należy do użytkownika (dzięki RLS), więc zwraca `null`.
    -   Znajduje w pobranej liście piosenkę o zadanym `songId`. Jeśli jej nie ma, zwraca `null`.
    -   Identyfikuje piosenkę poprzednią (`index - 1`) i następną (`index + 1`) na liście.
    -   Pobiera dane repertuaru (`repertoires.name`, `repertoires.public_id`).
    -   Konstruuje obiekt `BiesiadaRepertoireSongDetailDto`, wypełniając wszystkie pola, w tym `publicUrl` i `qrPayload` na podstawie `repertoires.public_id` i stałych konfiguracyjnych.
    -   Zwraca gotowy obiekt DTO do handlera.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint musi być chroniony. Klient Supabase automatycznie weryfikuje token JWT i udostępnia `auth.uid()`.
- **Autoryzacja:** Dostęp do danych jest ograniczony na poziomie bazy danych przez polityki RLS (`repertoires_owner_full_access`, `repertoire_songs_owner_full_access`). Zapytania w serwisie muszą być tak skonstruowane, aby polegać na tych politykach, bez konieczności dodawania `WHERE organizer_id = auth.uid()` (chociaż jest to dobra praktyka weryfikacji).

## 7. Rozważania dotyczące wydajności
- Zapytanie pobierające wszystkie piosenki z repertuaru może być potencjalnym wąskim gardłem przy bardzo dużych repertuarach (setki piosenek). Należy zapewnić, że tabele `repertoires`, `repertoire_songs` i `songs` mają odpowiednie indeksy na kluczach obcych (`repertoire_id`, `song_id`) oraz na kolumnie `position`.
- **Optymalizacja:** Zamiast pobierać całą listę, można użyć bardziej zaawansowanego zapytania SQL z funkcjami okna (`LAG`, `LEAD`) do znalezienia piosenki docelowej, poprzedniej i następnej w jednym zapytaniu. To zredukuje ilość danych przesyłanych między bazą a Edge Function.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu (`biesiada.service.ts`):**
    -   Utwórz (jeśli nie istnieje) plik `supabase/functions/me/biesiada.service.ts`.
    -   Zaimplementuj nową, asynchroniczną funkcję `getBiesiadaRepertoireSongDetails(supabaseClient, repertoireId, songId)`.
    -   Wewnątrz funkcji wykonaj zapytanie do Supabase, aby pobrać listę piosenek dla `repertoireId` z dołączonymi danymi z tabeli `songs`, posortowaną po `position`.
    -   Zaimplementuj logikę do znalezienia bieżącej, poprzedniej i następnej piosenki.
    -   Pobierz dane repertuaru (`name`, `public_id`).
    -   Zbuduj i zwróć obiekt `BiesiadaRepertoireSongDetailDto` lub `null`, jeśli zasób nie zostanie znaleziony.
2.  **Aktualizacja handlera (`biesiada.handlers.ts`):**
    -   Dodaj nową funkcję `handleGetBiesiadaRepertoireSong(req, supabaseClient, repertoireId, songId)`.
    -   Dodaj walidację UUID dla `repertoireId` i `songId`.
    -   Wywołaj nową funkcję z serwisu.
    -   Zwróć odpowiedź `200 OK` z danymi lub `404 Not Found` (opakowane w standardowy obiekt błędu).
3.  **Aktualizacja routera (`biesiada.handlers.ts` lub `index.ts`):**
    -   W głównym routerze dla `/me/biesiada` dodaj nową regułę obsługującą ścieżkę z wyrażeniem regularnym: `^/repertoires/([^/]+)/songs/([^/]+)$`.
    -   Reguła ta powinna wywoływać `handleGetBiesiadaRepertoireSong` z wyodrębnionymi parametrami.
4.  **Definicja typów (`packages/contracts/types.ts`):**
    -   Upewnij się, że typy `BiesiadaRepertoireSongDetailDto`, `BiesiadaSongOrderDto`, `BiesiadaSongLinkDto` i `BiesiadaSongShareMetaDto` są poprawnie zdefiniowane i wyeksportowane.
