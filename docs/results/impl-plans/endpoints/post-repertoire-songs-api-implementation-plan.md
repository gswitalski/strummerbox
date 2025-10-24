# API Endpoint Implementation Plan: POST /repertoires/{id}/songs

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia dodawanie jednej lub wielu piosenek do istniejącego repertuaru. Nowe piosenki są dołączane na końcu listy, a ich pozycje są automatycznie obliczane. Operacja jest transakcyjna i dostępna wyłącznie dla właściciela repertuaru.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/repertoires/{id}/songs`
- **Parametry:**
  - **Wymagane:**
    - `id` (w ścieżce): Identyfikator UUID repertuaru.
- **Ciało żądania (Request Body):**
  ```json
  {
    "songIds": ["a1320a1b-4e2b-44b0-a1f6-8e37b406df1d", "b300b6eb-9acf-4f42-8d53-9377637a77b6"]
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (Request):** `RepertoireAddSongsCommand`
- **DTO (Response):** `RepertoireAddSongsResponseDto`

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created):**
  ```json
  {
    "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
    "added": [
      {
        "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
        "songId": "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d",
        "position": 3
      },
      {
        "repertoireSongId": "a9e1e8b2-3e2c-4a1d-b8c3-2f2e1e8b23e2",
        "songId": "b300b6eb-9acf-4f42-8d53-9377637a77b6",
        "position": 4
      }
    ]
  }
  ```

## 5. Przepływ danych
1.  **Routing (`index.ts`):** Żądanie `POST` na ścieżce `/repertoires/{id}/songs` jest przechwytywane i przekierowywane do odpowiedniego handlera.
2.  **Handler (`repertoires.handlers.ts`):**
    a. Uwierzytelnia użytkownika za pomocą JWT.
    b. Waliduje parametr `id` z URL (musi być UUID) oraz ciało żądania za pomocą schematu Zod (`RepertoireAddSongsCommandSchema`).
    c. Wywołuje funkcję serwisową `repertoires.service.ts -> addSongsToRepertoire`, przekazując `repertoireId`, `songIds` oraz `organizerId` (z JWT).
    d. Po otrzymaniu pomyślnej odpowiedzi z serwisu, formatuje ją zgodnie ze specyfikacją i wysyła odpowiedź `201 Created`.
    e. W przypadku błędu, mapuje go na odpowiedni status HTTP i treść błędu.
3.  **Serwis (`repertoires.service.ts`):**
    a. Uruchamia transakcję w bazie danych, aby zapewnić atomowość operacji.
    b. Sprawdza, czy repertuar o podanym `id` istnieje i należy do `organizerId` (RLS zajmie się tym automatycznie, ale jawne sprawdzenie jest zalecane dla lepszych komunikatów o błędach).
    c. Sprawdza, czy wszystkie piosenki z `songIds` istnieją, należą do `organizerId` i nie znajdują się już w docelowym repertuarze.
    d. Pobiera najwyższą istniejącą wartość `position` dla piosenek w tym repertuarze.
    e. Przygotowuje listę nowych obiektów `repertoire_songs` do wstawienia, inkrementując pozycję dla każdej nowej piosenki (`max_position + 1`, `max_position + 2`, ...).
    f. Wykonuje operację `insert` na tabeli `repertoire_songs`.
    g. Zatwierdza transakcję.
    h. Zwraca listę nowo utworzonych wpisów do handlera.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Wszystkie żądania muszą zawierać prawidłowy token JWT w nagłówku `Authorization`.
-   **Autoryzacja:**
    -   Polityki RLS na tabelach `repertoires`, `songs` i `repertoire_songs` zapewniają, że użytkownik może modyfikować tylko własne zasoby.
    -   Warstwa serwisowa dodatkowo zweryfikuje, czy `organizer_id` dla wszystkich dodawanych piosenek jest zgodny z `organizer_id` repertuaru, co zapobiega dodawaniu piosenek innych użytkowników.
-   **Walidacja:**
    -   Wszystkie dane wejściowe (parametry URL, ciało żądania) muszą być rygorystycznie walidowane pod kątem typu i formatu (np. UUID).

## 7. Obsługa błędów
| Kod statusu          | Opis błędu                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `400 Bad Request`    | - `id` w URL nie jest prawidłowym UUID.<br>- Ciało żądania jest puste lub nie pasuje do schematu.<br>- Tablica `songIds` jest pusta lub zawiera nieprawidłowe UUID. |
| `401 Unauthorized`   | - Brak tokenu uwierzytelniającego lub token jest nieważny.                                               |
| `404 Not Found`      | - Repertuar o podanym `id` nie istnieje lub nie należy do użytkownika.<br>- Co najmniej jedna z piosenek o podanych `songIds` nie istnieje lub nie należy do użytkownika. |
| `409 Conflict`       | - Próba dodania piosenki, która już jest w tym repertuarze.                                              |
| `500 Internal Error` | - Błąd transakcji bazodanowej lub inny nieoczekiwany problem po stronie serwera.                        |

## 8. Rozważania dotyczące wydajności
-   Wszystkie operacje na bazie danych (sprawdzenie piosenek, pobranie maksymalnej pozycji, wstawienie nowych rekordów) powinny być zoptymalizowane i wykonane w ramach jednej transakcji, aby zminimalizować liczbę zapytań do bazy.
-   Operacja `insert` powinna być wykonana jako pojedyncze zapytanie wstawiające wiele wierszy, zamiast wielu pojedynczych zapytań w pętli.

## 9. Etapy wdrożenia
1.  **Aktualizacja Handlera (`repertoires.handlers.ts`):**
    -   Zdefiniuj schemat walidacji Zod dla `RepertoireAddSongsCommand`.
    -   Utwórz nową funkcję `handleAddSongsToRepertoire`.
    -   Zaimplementuj logikę walidacji, wywołania serwisu i formatowania odpowiedzi.
    -   Dodaj nową ścieżkę do `repertoireRouter`, która obsłuży `POST /repertoires/{id}/songs` i wywoła stworzony handler.
2.  **Implementacja Serwisu (`repertoires.service.ts`):**
    -   Utwórz nową, asynchroniczną funkcję `addSongsToRepertoire(repertoireId, songIds, organizerId)`.
    -   Zaimplementuj logikę opisaną w sekcji "Przepływ danych", włączając w to transakcję bazodanową.
    -   Upewnij się, że funkcja zwraca dane zgodne z typem `RepertoireAddSongsResponseDto`.
