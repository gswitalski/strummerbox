# API Endpoint Implementation Plan: GET /me/biesiada/repertoires

## 1. Przegląd punktu końcowego
Ten punkt końcowy dostarcza uproszczoną listę repertuarów należących do uwierzytelnionego organizatora. Został zoptymalizowany pod kątem szybkiego ładowania w trybie "Biesiada" na urządzeniach mobilnych, zwracając tylko niezbędne dane: ID, nazwę, datę publikacji oraz liczbę piosenek.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/me/biesiada/repertoires`
-   **Parametry:**
    -   **Wymagane:** Brak
    -   **Opcjonalne:** `includePublished` (boolean, default: `false`). Jeśli `true`, zwraca tylko opublikowane repertuary.
-   **Request Body:** Brak

## 3. Wykorzystywane typy
-   `BiesiadaRepertoireSummaryDto`
-   `BiesiadaRepertoireListResponseDto`

## 4. Szczegóły odpowiedzi
-   **Sukces (200 OK):** Zwraca obiekt JSON zawierający listę repertuarów.
    ```json
    {
      "items": [
        {
          "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
          "name": "Ognisko 2025",
          "songCount": 12,
          "publishedAt": "2025-10-15T08:35:44Z"
        }
      ]
    }
    ```
-   **Błędy:**
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do głównego routera (`index.ts`) w Supabase Edge Function o nazwie `me`.
2.  Router kieruje żądanie do odpowiedniego handlera w pliku `biesiada.handlers.ts`.
3.  Handler weryfikuje uwierzytelnienie użytkownika i wyodrębnia jego ID (`organizerId`) z tokena JWT.
4.  Handler odczytuje opcjonalny parametr `includePublished` z query string.
5.  Handler wywołuje funkcję serwisową, np. `getBiesiadaRepertoires(organizerId, includePublished)` z pliku `biesiada.service.ts`.
6.  Serwis wykonuje zapytanie do bazy danych PostgreSQL, które:
    -   Pobiera dane z tabeli `repertoires`.
    -   Filtruje wyniki po `organizer_id`.
    -   Opcjonalnie filtruje po `published_at IS NOT NULL`, jeśli `includePublished` jest `true`.
    -   Używa lewego złączenia (LEFT JOIN) z tabelą `repertoire_songs` i funkcji agregującej `COUNT` do obliczenia liczby piosenek dla każdego repertuaru.
7.  Serwis mapuje wyniki zapytania na tablicę obiektów `BiesiadaRepertoireSummaryDto` i zwraca ją do handlera.
8.  Handler opakowuje wynik w obiekt `BiesiadaRepertoireListResponseDto` i wysyła odpowiedź `200 OK` z danymi w formacie JSON.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Endpoint jest chroniony. Dostęp wymaga ważnego tokena JWT (Bearer Token) w nagłówku `Authorization`.
-   **Autoryzacja:** ID organizatora jest pobierane bezpośrednio z tokena uwierzytelniającego, co zapobiega podszywaniu się. Dodatkowo, polityki RLS (Row Level Security) na poziomie bazy danych zapewniają, że zapytania mogą odczytywać tylko dane należące do zalogowanego użytkownika.

## 7. Rozważania dotyczące wydajności
-   Zapytanie do bazy danych powinno wykorzystywać indeks na kolumnie `organizer_id` w tabeli `repertoires` (`repertoires_organizer_id_idx`), aby zapewnić szybkie filtrowanie.
-   Endpoint zwraca minimalny, niezbędny zestaw danych, co minimalizuje transfer i przyspiesza działanie aplikacji klienckiej.

## 8. Etapy wdrożenia
1.  **Struktura plików:** W katalogu `supabase/functions/me/` utwórz nowe pliki: `biesiada.handlers.ts` i `biesiada.service.ts` (jeśli jeszcze nie istnieją).
2.  **Warstwa serwisu (`biesiada.service.ts`):**
    -   Zaimplementuj funkcję `getBiesiadaRepertoires(organizerId: string, includePublished: boolean)`.
    -   Wewnątrz funkcji, użyj klienta Supabase do zbudowania zapytania SQL lub RPC, które pobierze dane i obliczy `songCount`.
    -   Zapewnij mapowanie wyników z bazy na `BiesiadaRepertoireSummaryDto[]`.
3.  **Warstwa handlera (`biesiada.handlers.ts`):**
    -   Zaimplementuj funkcję `handleGetBiesiadaRepertoires(req: Request)`.
    -   Dodaj logikę do weryfikacji JWT i pobrania `organizerId`.
    -   Sparsuj parametr `includePublished` z `req.url`.
    -   Wywołaj funkcję z serwisu, przekazując `organizerId` i `includePublished`.
    -   Sformatuj pomyślną odpowiedź jako `BiesiadaRepertoireListResponseDto` i zwróć ją z kodem `200`.
    -   Obsłuż błędy, zwracając odpowiednie kody HTTP.
4.  **Routing (`index.ts` w funkcji `me`):**
    -   Zaktualizuj główny router, aby kierował żądania `GET` dla ścieżki `/me/biesiada/repertoires` do nowo utworzonego handlera `handleGetBiesiadaRepertoires`.
5.  **Typy:** Upewnij się, że typy `BiesiadaRepertoireSummaryDto` oraz `BiesiadaRepertoireListResponseDto` są poprawnie zdefiniowane i zaimportowane w warstwach handlera i serwisu.
6.  **Testowanie:** Dodaj testy (jednostkowe/integracyjne) w celu weryfikacji poprawnego działania endpointu, w tym obsługi parametru `includePublished` oraz scenariuszy błędów.
