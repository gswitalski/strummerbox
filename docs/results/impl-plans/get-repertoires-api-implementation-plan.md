# API Endpoint Implementation Plan: GET /repertoires

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest dostarczenie organizatorowi paginowanej listy jego repertuarów. Umożliwia on wyszukiwanie, filtrowanie i sortowanie wyników, a także opcjonalne dołączanie liczby piosenek powiązanych z każdym repertuarem. Punkt końcowy musi być zabezpieczony i dostępny tylko dla uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/repertoires`
-   **Parametry (Query):**
    -   **Wymagane:** Brak
    -   **Opcjonalne:**
        -   `page: number` - Numer strony do paginacji (domyślnie: 1).
        -   `pageSize: number` - Liczba wyników na stronie (domyślnie: 10, max: 100).
        -   `search: string` - Fraza do wyszukiwania w nazwach repertuarów (zostanie użyte wyszukiwanie trigramowe).
        -   `published: boolean` - Filtr statusu publikacji. Jeśli nie zostanie podany, zwracane są wszystkie repertuary.
        -   `sort: string` - Klucz sortowania. Dozwolone wartości: `name`, `createdAt`, `updatedAt`, `publishedAt`. Można poprzedzić myślnikiem (`-`) w celu sortowania malejącego (np. `-createdAt`). Domyślne sortowanie: `createdAt` malejąco.
        -   `includeCounts: boolean` - Jeśli `true`, odpowiedź będzie zawierać pole `songCount` z liczbą piosenek w każdym repertuarze.

## 3. Wykorzystywane typy
-   `RepertoireSummaryDto` - DTO dla pojedynczego repertuaru na liście.
-   `PaginationMeta` - DTO dla metadanych paginacji.
-   `RepertoireListResponseDto` - Główny DTO odpowiedzi, zawierający listę `RepertoireSummaryDto` oraz `PaginationMeta`.
-   `ErrorResponseDto` - DTO dla odpowiedzi w przypadku błędu.

## 4. Szczegóły odpowiedzi
-   **Pomyślna odpowiedź (200 OK):**
    ```json
    {
        "items": [
            {
                "id": "uuid",
                "publicId": "uuid",
                "name": "string",
                "description": "string | null",
                "publishedAt": "string (date-time) | null",
                "createdAt": "string (date-time)",
                "updatedAt": "string (date-time)",
                "songCount": "number | undefined"
            }
        ],
        "page": "number",
        "pageSize": "number",
        "total": "number"
    }
    ```
-   **Odpowiedź błędu (4xx/5xx):**
    ```json
    {
        "error": {
            "code": "string",
            "message": "string",
            "details": "unknown | undefined"
        }
    }
    ```

## 5. Przepływ danych
1.  Funkcja Supabase Edge Function odbiera żądanie `GET /repertoires`.
2.  Uwierzytelnianie: Middleware weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca błąd `401 Unauthorized`. Z tokena pobierany jest `organizer_id`.
3.  Walidacja: Parametry zapytania są walidowane (np. za pomocą `zod`) pod kątem typów, zakresów i dozwolonych wartości. W przypadku błędu walidacji zwracany jest błąd `400 Bad Request`.
4.  Budowanie zapytania: Wywołanie `RepertoireService`, który dynamicznie konstruuje zapytanie do bazy danych Supabase na podstawie zweryfikowanych parametrów.
    -   Zapytanie zawsze zawiera warunek `where('organizer_id', '=', organizer_id)`.
    -   Jeśli `search` jest obecny, dodawane jest wyszukiwanie trigramowe w kolumnie `name`.
    -   Jeśli `published` jest obecny, dodawany jest warunek `where('published_at', 'is', published ? 'not null' : null)`.
    -   Jeśli `sort` jest obecny, dodawany jest warunek `order()`.
    -   Jeśli `includeCounts` jest `true`, zapytanie jest modyfikowane w celu zliczenia piosenek (np. przez RPC lub złączenie z widokiem).
    -   Paginacja jest realizowana za pomocą `.range()`.
5.  Wykonanie zapytania: Serwis wykonuje zapytanie do bazy danych, w tym osobne zapytanie o łączną liczbę wyników (`count`) w celu paginacji.
6.  Mapowanie wyników: Wyniki z bazy danych są mapowane na typy DTO (`RepertoireSummaryDto`).
7.  Formatowanie odpowiedzi: Funkcja końcowa tworzy obiekt `RepertoireListResponseDto` i zwraca go z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Wszystkie żądania muszą być uwierzytelnione za pomocą ważnego tokena JWT.
-   **Autoryzacja:** Każde zapytanie do bazy danych musi być filtrowane przez `organizer_id` pobrany z tokena, aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych.
-   **Walidacja wejścia:** Rygorystyczna walidacja wszystkich parametrów zapytania chroni przed nieoczekiwanym zachowaniem i potencjalnymi atakami (np. DoS przez duży `pageSize`).

## 7. Obsługa błędów
-   `400 Bad Request` (`validation_error`): Zwracany, gdy parametry zapytania są nieprawidłowe (np. `pageSize` > 100, nieprawidłowa wartość `sort`).
-   `401 Unauthorized` (`unauthorized`): Zwracany, gdy użytkownik nie jest uwierzytelniony.
-   `500 Internal Server Error` (`internal_error`): Zwracany w przypadku nieoczekiwanych błędów serwera, takich jak błąd połączenia z bazą danych. Błędy te powinny być logowane po stronie serwera.

## 8. Rozważania dotyczące wydajności
-   **Indeksowanie:** Upewnij się, że kolumny `organizer_id`, `name` (dla wyszukiwania trigramowego), oraz kolumny używane do sortowania (`createdAt`, `updatedAt`, `publishedAt`) są odpowiednio zindeksowane w bazie danych.
-   **Zliczanie piosenek:** Zliczanie piosenek (`songCount`) może być kosztowne. Należy rozważyć użycie funkcji RPC w PostgreSQL lub zdenormalizowanego licznika w tabeli `repertoires`, aktualizowanego przez triggery, aby uniknąć kosztownych złączeń przy każdym żądaniu.
-   **Paginacja:** Stosowanie limitów (`pageSize`) i paginacji jest kluczowe dla wydajności i zapobiegania przesyłaniu dużych ilości danych.

## 9. Etapy wdrożenia
1.  **Walidacja schematu:** Zdefiniować schemat walidacji `zod` dla parametrów zapytania.
2.  **Serwis:** Utworzyć lub rozszerzyć `RepertoireService` o nową metodę, np. `listRepertoires(params, organizerId)`.
3.  **Logika budowania zapytania:** Wewnątrz serwisu zaimplementować logikę dynamicznego budowania zapytania Supabase na podstawie parametrów:
    -   Filtrowanie po `organizer_id`.
    -   Obsługa parametru `search`.
    -   Obsługa parametru `published`.
    -   Obsługa parametru `sort`.
    -   Obsługa paginacji.
4.  **Zliczanie piosenek:** Zaimplementować mechanizm `includeCounts`. Zalecane podejście: stworzyć funkcję PostgreSQL (RPC), która efektywnie zlicza piosenki.
5.  **Pobieranie danych:** Wykonać zapytanie do bazy danych oraz drugie zapytanie w celu uzyskania całkowitej liczby wyników do paginacji.
6.  **Endpoint:** Utworzyć plik dla nowego endpointu `GET /repertoires` w `supabase/functions/repertoires`.
7.  **Integracja:** W funkcji endpointu, zintegrować weryfikację JWT, walidację parametrów i wywołanie `RepertoireService`.
8.  **Mapowanie i odpowiedź:** Zmapować wyniki na `RepertoireListResponseDto` i zwrócić odpowiedź HTTP.
