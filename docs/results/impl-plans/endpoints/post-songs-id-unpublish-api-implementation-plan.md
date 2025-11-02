# API Endpoint Implementation Plan: `POST /songs/{id}/unpublish`

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi cofnięcie publikacji (odpublikowanie) jednej ze swoich piosenek. Operacja polega na ustawieniu pola `published_at` na `null` dla piosenki o podanym identyfikatorze, co sprawia, że staje się ona niedostępna publicznie.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `POST`
-   **Struktura URL:** `/songs/{id}/unpublish`
-   **Parametry:**
    -   **Wymagane:**
        -   `id` (parametr ścieżki): Unikalny identyfikator (UUID) piosenki, która ma zostać odpublikowana.
-   **Request Body:** Brak

## 3. Wykorzystywane typy
-   **Odpowiedź:**
    -   `SongDto`: Zwraca pełny obiekt piosenki po pomyślnym odpublikowaniu, aby potwierdzić zmianę stanu. Zdefiniowany w `packages/contracts/types.ts`.

## 4. Szczegóły odpowiedzi
-   **Sukces (200 OK):**
    -   Zwraca obiekt JSON zawierający pełne dane zaktualizowanej piosenki (`SongDto`), gdzie pole `publishedAt` ma wartość `null`.
    ```json
    {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "publicId": "7a8b9c1d-e2f3-4a5b-8c9d-0e1f2a3b4c5d",
        "title": "Tytuł Piosenki",
        "content": "Treść piosenki z akordami...",
        "publishedAt": null,
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T12:30:00Z"
    }
    ```
-   **Błędy:** Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  Żądanie `POST` trafia do Supabase Edge Function w `supabase/functions/songs/index.ts`.
2.  Główny router na podstawie ścieżki `/songs/{id}/unpublish` kieruje żądanie do odpowiedniego handlera zdefiniowanego w `songs.handlers.ts`.
3.  `handleUnpublishSong` (nowy handler) jest wywoływany.
4.  Handler waliduje parametr `id` ze ścieżki URL, sprawdzając, czy jest to prawidłowy UUID.
5.  Handler wyodrębnia `organizer_id` z uwierzytelnionego użytkownika.
6.  Handler wywołuje funkcję `unpublishSong({ id, organizerId })` z `songs.service.ts`.
7.  Serwis wykonuje zapytanie `UPDATE` do tabeli `songs`, ustawiając `published_at = null`, używając klauzuli `WHERE id = :id AND organizer_id = :organizerId`.
8.  Jeśli aktualizacja powiedzie się, serwis pobiera i zwraca zaktualizowany rekord piosenki.
9.  Handler odbiera dane z serwisu, mapuje je na `SongDto` i zwraca odpowiedź HTTP z kodem statusu `200 OK`.
10. W przypadku błędu (np. piosenka nie znaleziona), serwis rzuca wyjątek `ApplicationError`, który jest przechwytywany i mapowany na odpowiedni kod błędu HTTP (np. `404 Not Found`) przez globalną obsługę błędów.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Endpoint musi być chroniony. Dostęp jest dozwolony tylko dla uwierzytelnionych użytkowników. Klient Supabase automatycznie zweryfikuje przychodzący token JWT.
-   **Autoryzacja:** Operacja musi być autoryzowana. Zapytanie w `songs.service.ts` musi zawierać warunek `organizer_id = auth.uid()`, aby uniemożliwić jednemu użytkownikowi modyfikację piosenek innego. Dodatkowym zabezpieczeniem jest polityka RLS `songs_owner_full_access` na tabeli `songs`.
-   **Walidacja danych wejściowych:** Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych.

## 7. Obsługa błędów
-   **`400 Bad Request`**: Zwracany, gdy `id` podane w ścieżce URL nie jest prawidłowym formatem UUID.
-   **`401 Unauthorized`**: Zwracany, gdy żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
-   **`404 Not Found`**: Zwracany, gdy piosenka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
-   **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, np. problemu z połączeniem z bazą danych.

## 8. Rozważania dotyczące wydajności
-   Operacja `UPDATE` na tabeli `songs` jest wykonywana na kluczu głównym (`id`), który jest indeksowany, co zapewnia wysoką wydajność.
-   Endpoint nie wykonuje żadnych złożonych złączeń ani kosztownych operacji, więc nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia
1.  **Serwis (`songs.service.ts`):**
    -   Dodaj nową, asynchroniczną funkcję `unpublishSong({ id: string, organizerId: string })`.
    -   Wewnątrz funkcji zaimplementuj logikę aktualizacji rekordu w tabeli `songs`, ustawiając `published_at` na `null`.
    -   Upewnij się, że zapytanie `UPDATE` zawiera warunki `WHERE` dla `id` i `organizer_id`.
    -   Po aktualizacji, pobierz i zwróć pełny, zaktualizowany obiekt piosenki.
    -   Dodaj obsługę przypadku, gdy piosenka nie zostanie znaleziona (rzucenie `ApplicationError` z kodem `resource_not_found`).
2.  **Handler (`songs.handlers.ts`):**
    -   Utwórz nowy handler `handleUnpublishSong(req, songId)`.
    -   Dodaj walidację `songId` przy użyciu Zod lub podobnego mechanizmu.
    -   Pobierz `organizerId` z `req.user`.
    -   Wywołaj `songsService.unpublishSong` z `songId` i `organizerId`.
    -   Sformatuj pomyślną odpowiedź jako `SongDto` i zwróć ją z kodem `200 OK`.
3.  **Routing (`songs.handlers.ts` & `index.ts`):**
    -   W pliku `songs.handlers.ts`, w funkcji `songsRouter`, dodaj nową logikę do obsługi ścieżki `/songs/{id}/unpublish` dla metody `POST`.
    -   Upewnij się, że regex w głównym routerze (`index.ts`) poprawnie przechwytuje tę ścieżkę i przekazuje ją do `songsRouter`.
