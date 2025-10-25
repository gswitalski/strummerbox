# API Endpoint Implementation Plan: DELETE /repertoires/{id}/songs/{repertoireSongId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia zalogowanemu użytkownikowi (organizatorowi) usunięcie piosenki z określonego repertuaru. Identyfikacja usuwanego elementu odbywa się za pomocą `repertoireSongId`, który jest kluczem głównym w tabeli łączącej `repertoire_songs`. Po usunięciu, pozycje (`position`) pozostałych piosenek w repertuarze są automatycznie aktualizowane w celu zachowania ciągłości sekwencji.

## 2. Szczegóły żądania
- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/repertoires/{id}/songs/{repertoireSongId}`
- **Parametry:**
  - **Wymagane:**
    - `id` (UUID): Identyfikator repertuaru, z którego usuwana jest piosenka.
    - `repertoireSongId` (UUID): Identyfikator wpisu w tabeli `repertoire_songs` do usunięcia.
  - **Opcjonalne:** Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **DTO odpowiedzi:** `RepertoireRemoveSongResponseDto`

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):** Zwraca obiekt potwierdzający usunięcie i przebudowanie pozycji.
  ```json
  {
    "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
    "removed": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
    "positionsRebuilt": true
  }
  ```
- **Błędy:** Zwraca standardowy obiekt `ErrorResponseDto` z odpowiednim kodem statusu.

## 5. Przepływ danych
1.  Żądanie `DELETE` trafia do Supabase Edge Function dla `/repertoires`.
2.  Główny router (`index.ts`) identyfikuje ścieżkę i przekazuje żądanie do handlera `handleRemoveSongFromRepertoire` w `repertoires.handlers.ts`.
3.  Handler waliduje format UUID parametrów `id` i `repertoireSongId` z adresu URL.
4.  Handler wywołuje funkcję serwisową `removeSongFromRepertoire` z `repertoires.service.ts`, przekazując zweryfikowane identyfikatory oraz ID zalogowanego użytkownika.
5.  Funkcja serwisowa uruchamia transakcję bazodanową:
    a. Pobiera rekord `repertoire_songs` używając `repertoireSongId`, aby uzyskać `repertoire_id` i `position` usuwanej piosenki.
    b. Sprawdza, czy `repertoire_id` z bazy danych jest zgodny z `id` z URL oraz czy `organizer_id` repertuaru pasuje do ID zalogowanego użytkownika. Jeśli nie, transakcja jest przerywana i zwracany jest błąd `403` lub `404`.
    c. Usuwa rekord z tabeli `repertoire_songs` na podstawie `repertoireSongId`.
    d. Aktualizuje pozycje (`position = position - 1`) wszystkich pozostałych rekordów `repertoire_songs` dla tego samego `repertoire_id`, których `position` było większe od pozycji usuwanego elementu.
6.  Po pomyślnym zatwierdzeniu transakcji, serwis zwraca dane do handlera.
7.  Handler formatuje odpowiedź `200 OK` z użyciem DTO `RepertoireRemoveSongResponseDto` i wysyła ją do klienta.
8.  W przypadku błędu na którymkolwiek etapie, przepływ jest przerywany, a odpowiedni kod błędu (400, 403, 404, 500) jest zwracany.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint jest chroniony. Dostęp jest możliwy tylko dla uwierzytelnionych użytkowników. Tożsamość użytkownika jest pozyskiwana z tokena JWT.
- **Autoryzacja:** Operacja jest autoryzowana na dwóch poziomach:
    1.  **RLS (Row Level Security):** Polityki bezpieczeństwa w bazie PostgreSQL zapewniają, że operacje zapisu na tabelach `repertoires` i `repertoire_songs` mogą być wykonywane tylko przez właściciela (`organizer_id`).
    2.  **Logika serwisu:** Przed wykonaniem operacji, serwis jawnie weryfikuje, czy ID zalogowanego użytkownika (`auth.uid()`) jest zgodne z `organizer_id` powiązanego repertuaru.
- **Walidacja wejścia:** Identyfikatory `id` i `repertoireSongId` są walidowane jako prawidłowe UUID, aby zapobiec błędom zapytań i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
- **Transakcja:** Kluczowe operacje (usunięcie i aktualizacja pozycji) muszą być zamknięte w transakcji bazodanowej, aby zapewnić spójność danych.
- **Indeksowanie:** Tabela `repertoire_songs` powinna mieć indeks na kolumnie `repertoire_id` oraz złożony indeks na `(repertoire_id, position)`, aby operacja aktualizacji pozycji była wydajna. Zgodnie z planem bazy danych, taki indeks (`repertoire_songs_repertoire_position_idx`) już istnieje.

## 8. Etapy wdrożenia
1.  **Router:** W pliku `supabase/functions/repertoires/index.ts`, dodaj obsługę metody `DELETE` dla ścieżki pasującej do wzorca `/repertoires/([^/]+)/songs/([^/]+)`.
2.  **Handler:** W pliku `supabase/functions/repertoires/repertoires.handlers.ts`:
    -   Utwórz nową, asynchroniczną funkcję `handleRemoveSongFromRepertoire(req: Request, repertoireId: string, repertoireSongId: string)`.
    -   Zaimplementuj walidację formatu UUID dla `repertoireId` i `repertoireSongId`. W przypadku błędu zwróć `400 Bad Request`.
    -   Wywołaj funkcję serwisową `removeSongFromRepertoire` i przekaż jej niezbędne dane.
    -   Obsłuż pomyślną odpowiedź, formatując ją do `RepertoireRemoveSongResponseDto` i zwracając `200 OK`.
    -   Obsłuż możliwe błędy rzucane przez serwis (np. `ApplicationError`) i mapuj je na odpowiednie odpowiedzi HTTP (403, 404).
3.  **Serwis:** W pliku `supabase/functions/repertoires/repertoires.service.ts`:
    -   Utwórz nową, asynchroniczną funkcję `removeSongFromRepertoire({ repertoireId, repertoireSongId, organizerId, supabaseClient })`.
    -   Zaimplementuj logikę opisaną w sekcji "Przepływ danych", używając `supabaseClient.rpc('run_in_transaction', ...)` lub podobnego mechanizmu do obsługi transakcji.
    -   Użyj `select` w celu weryfikacji własności zasobu przed próbą usunięcia.
    -   Rzucaj `ApplicationError` z odpowiednimi kodami (`'forbidden'`, `'resource_not_found'`) w przypadku niepowodzenia walidacji.
4.  **Typy:** Upewnij się, że typ `RepertoireRemoveSongResponseDto` jest zdefiniowany i wyeksportowany w `packages/contracts/types.ts`.
