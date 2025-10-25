# API Endpoint Implementation Plan: POST /repertoires/{id}/songs/reorder

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia organizatorowi całkowitą zmianę kolejności piosenek w istniejącym repertuarze. Operacja polega na przesłaniu pełnej, uporządkowanej listy identyfikatorów piosenek (`repertoireSongId`). Zapewnia atomowość operacji, co gwarantuje, że kolejność zostanie zaktualizowana w całości albo wcale.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/repertoires/{id}/songs/reorder`
- **Parametry:**
  - **Wymagane:**
    - `id` (parametr ścieżki): `UUID` identyfikujący repertuar.
  - **Opcjonalne:** Brak.
- **Ciało żądania (Request Body):**
  - **Typ zawartości:** `application/json`
  - **Struktura:**
    ```json
    {
      "order": [
        "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
        "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60"
      ]
    }
    ```

## 3. Wykorzystywane typy
- **Command Model (Request):** `ReorderRepertoireSongsCommand`
    ```typescript
    // Zod Schema
    import { z } from 'zod';

    export const ReorderRepertoireSongsSchema = z.object({
      order: z.array(z.string().uuid()).min(1, "Order array cannot be empty."),
    });

    export type ReorderRepertoireSongsCommand = z.infer<typeof ReorderRepertoireSongsSchema>;
    ```
- **DTO (Response):** `ReorderRepertoireSongsDto`
    ```typescript
    export interface ReorderedSongDto {
      repertoireSongId: string;
      position: number;
    }

    export interface ReorderRepertoireSongsDto {
      repertoireId: string;
      songs: ReorderedSongDto[];
    }
    ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`200 OK`):**
  ```json
  {
    "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
    "songs": [
      {
        "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
        "position": 1
      },
      {
        "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
        "position": 2
      }
    ]
  }
  ```
- **Odpowiedzi błędów:** Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  Żądanie `POST` trafia do Supabase Edge Function `repertoires`.
2.  Główny router (`index.ts`) identyfikuje ścieżkę `/repertoires/{id}/songs/reorder` i przekazuje żądanie do odpowiedniego handlera w `repertoires.handlers.ts`.
3.  Handler waliduje parametr `id` ze ścieżki (czy jest to UUID) oraz ciało żądania przy użyciu schemy Zod `ReorderRepertoireSongsSchema`.
4.  Po pomyślnej walidacji, handler wywołuje funkcję serwisową `reorderSongsInRepertoire` z `repertoires.service.ts`, przekazując `repertoireId`, tablicę `order` oraz ID uwierzytelnionego użytkownika.
5.  Funkcja serwisowa rozpoczyna transakcję w bazie danych PostgreSQL.
6.  W ramach transakcji:
    a. Pobiera wszystkie rekordy z `repertoire_songs` dla danego `repertoireId`, weryfikując jednocześnie, czy repertuar należy do użytkownika (sprawdzenie `organizer_id`).
    b. Porównuje pobrane ID z ID przesłanymi w tablicy `order`, aby upewnić się, że zestawy są identyczne (ta sama liczba elementów, brak duplikatów, te same wartości).
    c. Jeśli weryfikacja się powiedzie, wykonuje serię zapytań `UPDATE` na tabeli `repertoire_songs`, ustawiając nową wartość w kolumnie `position` dla każdego rekordu zgodnie z kolejnością w tablicy `order`.
7.  Jeśli wszystkie operacje w transakcji zakończą się sukcesem, transakcja jest zatwierdzana. W przeciwnym razie jest wycofywana.
8.  Serwis zwraca zaktualizowane dane do handlera.
9.  Handler formatuje odpowiedź HTTP `200 OK` z DTO zawierającym zaktualizowaną kolejność i odsyła ją do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Punkt końcowy musi być chroniony. Dostęp jest dozwolony tylko dla uwierzytelnionych użytkowników. Supabase domyślnie obsłuży weryfikację tokena JWT.
- **Autoryzacja:** Operacja musi być ograniczona do właściciela repertuaru. Zostanie to zapewnione na dwóch poziomach:
    1.  **RLS (Row Level Security):** Polityki bezpieczeństwa na tabelach `repertoires` i `repertoire_songs` uniemożliwią dostęp do danych nienależących do zalogowanego użytkownika.
    2.  **Logika biznesowa:** Jawne sprawdzenie w serwisie, czy `repertoires.organizer_id` jest równe `auth.uid()`, zapewni zwrócenie odpowiedniego kodu błędu (`403 Forbidden` lub `404 Not Found`).
- **Walidacja danych wejściowych:** Użycie Zod do walidacji ciała żądania i parametrów URL zapobiegnie atakom typu NoSQL/SQL Injection oraz błędom wynikającym z nieoczekiwanego formatu danych.

## 7. Obsługa błędów
- **`400 Bad Request`**:
  - Ciało żądania jest niezgodne ze schemą (np. brak pola `order`, pusta tablica, elementy nie są stringami UUID).
  - Parametr `id` w ścieżce URL nie jest poprawnym identyfikatorem UUID.
  - Tablica `order` zawiera zduplikowane identyfikatory.
  - Zestaw identyfikatorów w `order` nie jest identyczny z zestawem piosenek w repertuarze (brakuje piosenek, lub są nadmiarowe).
- **`401 Unauthorized`**: Użytkownik nie jest uwierzytelniony (brak lub nieprawidłowy token JWT).
- **`403 Forbidden`**: Użytkownik jest uwierzytelniony, ale próbuje zmodyfikować repertuar, którego nie jest właścicielem.
- **`404 Not Found`**: Repertuar o podanym `id` nie istnieje w bazie danych.
- **`500 Internal Server Error`**: Wystąpił nieoczekiwany problem po stronie serwera, np. niepowodzenie transakcji bazodanowej. Wszystkie takie błędy powinny być logowane.

## 8. Rozważania dotyczące wydajności
- **Transakcja bazodanowa:** Zgrupowanie wszystkich operacji `UPDATE` w jednej transakcji jest kluczowe dla integralności danych i jest bardziej wydajne niż wykonywanie oddzielnych zapytań.
- **Liczba zapytań:** Operacja powinna być zoptymalizowana, aby zminimalizować liczbę zapytań do bazy danych. Najpierw jedno zapytanie `SELECT` do pobrania i weryfikacji bieżącego stanu, a następnie seria `UPDATE` w ramach jednej transakcji.
- **RPC (opcjonalnie):** Dla bardzo dużych repertuarów (setki piosenek), bardziej wydajnym rozwiązaniem może być stworzenie funkcji bazodanowej (RPC) w PostgreSQL, która przyjmie tablicę ID i wykona całą logikę po stronie bazy danych, minimalizując narzut sieciowy. Na początek implementacja w Edge Function jest wystarczająca.

## 9. Etapy wdrożenia
1.  **Definicja typów:** Zdefiniować i wyeksportować typy `ReorderRepertoireSongsCommand`, `ReorderRepertoireSongsDto` oraz schemę Zod `ReorderRepertoireSongsSchema` w odpowiednich plikach.
2.  **Logika serwisowa:** W pliku `supabase/functions/repertoires/repertoires.service.ts` zaimplementować nową funkcję `reorderSongsInRepertoire(repertoireId, order, organizerId)`. Funkcja ta musi zawierać logikę transakcji i weryfikacji danych.
3.  **Implementacja handlera:** W pliku `supabase/functions/repertoires/repertoires.handlers.ts` dodać nowy handler `handleReorderRepertoireSongs`, który będzie odpowiedzialny za parsowanie żądania, walidację Zod i wywołanie serwisu.
4.  **Aktualizacja routera:** W pliku `supabase/functions/repertoires/index.ts` dodać nową regułę routingu, która dla żądania `POST` na ścieżce pasującej do wzorca `/repertoires/([^/]+)/songs/reorder` wywoła nowo utworzony handler.
5.  **Obsługa błędów:** Upewnić się, że wszystkie potencjalne błędy z warstwy serwisu i handlera są poprawnie przechwytywane i mapowane na odpowiednie kody statusu HTTP.
