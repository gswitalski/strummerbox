# API Endpoint Implementation Plan: DELETE /repertoires/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi trwałe usunięcie jednego ze swoich repertuarów. Operacja ta usuwa również wszystkie powiązania piosenek z tym repertuarem z tabeli `repertoire_songs` dzięki mechanizmowi kaskadowemu w bazie danych, jednak same piosenki pozostają nienaruszone.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `DELETE`
-   **Struktura URL:** `/repertoires/{id}`
-   **Parametry:**
    -   **Wymagane:**
        -   `id` (parametr ścieżki): Identyfikator UUID repertuaru, który ma zostać usunięty.
    -   **Opcjonalne:** Brak
-   **Request Body:** Brak

## 3. Wykorzystywane typy
-   **DTO odpowiedzi:** `RepertoireDeleteResponseDto`
    ```typescript
    export type RepertoireDeleteResponseDto = {
        id: RepertoireRow['id'];
        deleted: true;
    };
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (`200 OK`):** Zwraca obiekt JSON potwierdzający usunięcie, zawierający `id` usuniętego zasobu i flagę `deleted`.
    ```json
    {
      "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
      "deleted": true
    }
    ```
-   **Odpowiedzi błędów:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.

## 5. Przepływ danych
1.  Żądanie `DELETE` trafia do Supabase Edge Function `repertoires`.
2.  W pliku `index.ts` router dopasowuje żądanie do ścieżki `DELETE /:id` i wywołuje odpowiedni handler, np. `handleDeleteRepertoire` z pliku `repertoires.handlers.ts`.
3.  Uwierzytelnianie jest weryfikowane na poziomie globalnym przez framework Deno/Supabase, który sprawdza token JWT.
4.  **Handler (`repertoires.handlers.ts`):**
    -   Waliduje, czy parametr `id` ze ścieżki jest w poprawnym formacie UUID. Jeśli nie, zwraca `400 Bad Request`.
    -   Pobiera `userId` z danych uwierzytelnionego użytkownika.
    -   Wywołuje funkcję serwisową `repertoiresService.deleteRepertoire(id, userId)`.
    -   W przypadku sukcesu, formatuje odpowiedź `200 OK` używając `RepertoireDeleteResponseDto`.
    -   Przechwytuje błędy z warstwy serwisu (np. `ResourceNotFound`) i mapuje je na odpowiednie kody statusu HTTP (np. `404 Not Found`).
5.  **Serwis (`repertoires.service.ts`):**
    -   Funkcja `deleteRepertoire` wykonuje zapytanie `DELETE FROM repertoires WHERE id = :id AND organizer_id = :userId`.
    -   Sprawdza liczbę usuniętych wierszy zwróconą przez zapytanie.
    -   Jeśli liczba usuniętych wierszy wynosi `0`, oznacza to, że zasób nie istnieje lub użytkownik nie ma do niego uprawnień (dzięki RLS). W takim przypadku serwis rzuca błąd `ResourceNotFoundError`.
    -   Jeśli usunięto `1` wiersz, funkcja zwraca `id` usuniętego repertuaru.
6.  Baza danych PostgreSQL, dzięki polityce RLS `repertoires_owner_full_access`, dodatkowo zapewnia, że operacja powiedzie się tylko dla właściciela zasobu. Ograniczenie `ON DELETE CASCADE` na kluczu obcym w tabeli `repertoire_songs` automatycznie usuwa powiązane rekordy.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization: Bearer <token>`. Supabase Edge Functions automatycznie obsłuży weryfikację tokenu, zwracając `401 Unauthorized` w przypadku niepowodzenia.
-   **Autoryzacja:** Autoryzacja jest realizowana na dwóch poziomach:
    1.  **Warstwa aplikacji:** Zapytanie `DELETE` w serwisie jawnie filtruje po `organizer_id`, zapewniając, że tylko właściciel może zainicjować usunięcie.
    2.  **Warstwa bazy danych:** Polityka RLS `repertoires_owner_full_access` stanowi ostateczną barierę, uniemożliwiając usunięcie repertuaru przez nieautoryzowanego użytkownika, nawet w przypadku błędu w logice aplikacji.
-   **Walidacja danych wejściowych:** Sprawdzanie formatu UUID dla `id` w handlerze zapobiega błędom bazy danych i potencjalnym atakom (np. SQL Injection, chociaż Supabase client parametryzuje zapytania).

## 7. Obsługa błędów
-   **`400 Bad Request`:** Zwracany, gdy `id` w ścieżce URL nie jest prawidłowym identyfikatorem UUID.
-   **`401 Unauthorized`:** Zwracany przez framework, gdy żądanie nie zawiera ważnego tokenu uwierzytelniającego.
-   **`404 Not Found`:** Zwracany, gdy repertuar o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
-   **`500 Internal Server Error`:** Zwracany w przypadku nieoczekiwanych błędów serwera, np. problemów z połączeniem z bazą danych. Wszystkie błędy `500` powinny być logowane na poziomie `ERROR`.

## 8. Rozważania dotyczące wydajności
-   Operacja `DELETE` jest wykonywana na kluczu głównym (`id`), co zapewnia bardzo wysoką wydajność.
-   Kaskadowe usuwanie w `repertoire_songs` jest również wydajne, ponieważ opiera się na indeksowanym kluczu obcym (`repertoire_id`).
-   Potencjalne wąskie gardła mogłyby wystąpić tylko przy usuwaniu repertuarów z bardzo dużą liczbą piosenek (dziesiątki tysięcy), co jest mało prawdopodobne w tym przypadku użycia. Nie są wymagane dodatkowe optymalizacje.

## 9. Etapy wdrożenia
1.  **Aktualizacja serwisu (`repertoires.service.ts`):**
    -   Dodaj nową metodę `deleteRepertoire(id: string, organizerId: string)`.
    -   Wewnątrz metody zaimplementuj logikę `supabase.from('repertoires').delete().match({ id: id, organizer_id: organizerId })`.
    -   Sprawdź wynik operacji. Jeśli `error` istnieje lub `data` jest `null` (lub usunięto 0 rekordów, w zależności od tego co zwraca klient), rzuć odpowiedni błąd (np. `ResourceNotFoundError`).
    -   W przypadku sukcesu, zwróć obiekt `{ id }`.
2.  **Aktualizacja handlera (`repertoires.handlers.ts`):**
    -   Stwórz nową funkcję `handleDeleteRepertoire(req: Request)`.
    -   Wyodrębnij `id` z parametrów ścieżki żądania.
    -   Zwaliduj, czy `id` jest poprawnym UUID. W razie niepowodzenia, zwróć odpowiedź `400`.
    -   Wyodrębnij `organizerId` z `req.user` (lub podobnego obiektu po uwierzytelnieniu).
    -   Zawiń wywołanie `repertoiresService.deleteRepertoire` w blok `try...catch`.
    -   W bloku `try`, po pomyślnym wywołaniu serwisu, utwórz obiekt `RepertoireDeleteResponseDto` i zwróć odpowiedź `200 OK`.
    -   W bloku `catch`, obsłuż specyficzne błędy (np. `ResourceNotFoundError` -> `404`) oraz błędy ogólne (`500`).
3.  **Aktualizacja routera (`index.ts` w funkcji `repertoires`):**
    -   Dodaj nową obsługę ścieżki dla metody `DELETE`.
    -   Użyj wyrażenia regularnego do przechwycenia UUID w ścieżce, np. `router.delete('/repertoires/:id([0-9a-f-]+)', handleDeleteRepertoire)`.
    -   Upewnij się, że router jest poprawnie zarejestrowany w głównym pliku `index.ts` funkcji.
