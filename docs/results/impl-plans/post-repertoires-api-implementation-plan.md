# API Endpoint Implementation Plan: POST /repertoires

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi utworzenie nowego repertuaru. Pozwala na jednoczesne zdefiniowanie nazwy, opisu oraz opcjonalne dodanie początkowego zestawu piosenek. W odpowiedzi zwracany jest nowo utworzony zasób repertuaru wraz z listą dodanych piosenek.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `POST`
-   **Struktura URL:** `/repertoires`
-   **Request Body:**
    -   **Typ:** `RepertoireCreateCommand`
    -   **Struktura JSON:**
        ```json
        {
          "name": "string (1-160 znaków)",
          "description": "string (opcjonalnie)",
          "songIds": ["uuid", "..."] (opcjonalnie)
        }
        ```
-   **Parametry:**
    -   **Wymagane:** `name`
    -   **Opcjonalne:** `description`, `songIds`

## 3. Wykorzystywane typy
-   **Command Model:** `RepertoireCreateCommand` (`packages/contracts/types.ts`)
-   **DTO:** `RepertoireDto` (`packages/contracts/types.ts`)

## 4. Szczegóły odpowiedzi
-   **Status Sukcesu:** `201 Created`
-   **Struktura JSON odpowiedzi:**
    ```json
    {
      "id": "uuid",
      "publicId": "uuid",
      "name": "string",
      "description": "string | null",
      "publishedAt": "string (date-time) | null",
      "createdAt": "string (date-time)",
      "updatedAt": "string (date-time)",
      "songCount": "number",
      "songs": [
        {
          "repertoireSongId": "uuid",
          "songId": "uuid",
          "title": "string",
          "position": "number",
          "content": null
        }
      ]
    }
    ```
    *Uwaga: `content` w `RepertoireSongDto` jest opcjonalny i nie będzie zwracany w tym przypadku.*

## 5. Przepływ danych
1.  Żądanie `POST /repertoires` dociera do `supabase/functions/repertoires/index.ts`.
2.  Router w `index.ts` kieruje żądanie do handlera `handlePostRepertoire` w `repertoires.handlers.ts`.
3.  Handler uwierzytelnia użytkownika, pobierając jego ID z Supabase Auth. W przypadku braku autoryzacji zwraca `401`.
4.  Handler waliduje ciało żądania za pomocą schematu Zod. W przypadku błędu walidacji zwraca `400`.
5.  Handler wywołuje funkcję `createRepertoire` z `repertoires.service.ts`, przekazując ID organizatora i zwalidowane dane.
6.  Serwis rozpoczyna transakcję bazodanową.
7.  **Krok 1 (w transakcji):** Wstawia nowy wiersz do tabeli `repertoires`.
8.  **Krok 2 (w transakcji, jeśli `songIds` istnieje):**
    a. Weryfikuje, czy wszystkie piosenki o podanych ID istnieją i należą do danego `organizer_id`.
    b. Jeśli weryfikacja nie powiedzie się, transakcja jest wycofywana, a serwis rzuca błąd (obsłużony jako `400`).
    c. Tworzy wpisy w tabeli `repertoire_songs`, przypisując pozycję na podstawie kolejności ID w tablicy `songIds`.
9.  Transakcja jest zatwierdzana.
10. Serwis pobiera nowo utworzony repertuar wraz z powiązanymi piosenkami, aby zbudować obiekt `RepertoireDto`.
11. Serwis zwraca `RepertoireDto` do handlera.
12. Handler formatuje odpowiedź HTTP z kodem `201 Created` i zwraca ją do klienta.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Dostęp do punktu końcowego jest chroniony i wymaga ważnego tokenu JWT. Handler musi zweryfikować istnienie aktywnej sesji użytkownika.
-   **Autoryzacja:** Serwis musi bezwzględnie sprawdzić, czy wszystkie piosenki podane w `songIds` należą do uwierzytelnionego użytkownika (`songs.organizer_id` musi zgadzać się z ID użytkownika z tokenu). Zapobiega to dodawaniu piosenek innych użytkowników do swojego repertuaru.
-   **Walidacja danych wejściowych:** Użycie `Zod` do walidacji typów, długości ciągów znaków i formatu UUID chroni przed podstawowymi atakami typu injection i uszkodzeniem danych.

## 7. Obsługa błędów
| Kod statusu | Kod błędu (wewn.) | Przyczyna                                                                                               |
| :----------- | :------------------ | :------------------------------------------------------------------------------------------------------ |
| `400 Bad Request` | `validation_error`  | Ciało żądania jest nieprawidłowe (błąd Zod) LUB jedna z piosenek w `songIds` nie istnieje lub nie należy do użytkownika. |
| `401 Unauthorized`| `unauthorized`      | Brak lub nieprawidłowy token uwierzytelniający.                                                         |
| `409 Conflict`    | `conflict`          | Repertuar o podanej nazwie (`name`) już istnieje dla tego organizatora.                                 |
| `500 Internal Server Error`| `internal_error`    | Błąd bazy danych (np. nieudana transakcja) lub inny nieoczekiwany błąd serwera.             |

## 8. Rozważania dotyczące wydajności
-   Operacja tworzenia repertuaru i dodawania piosenek powinna być wykonana w ramach jednej transakcji, aby zminimalizować liczbę zapytań do bazy danych.
-   Walidacja przynależności piosenek powinna być wykonana za pomocą jednego zapytania SQL z użyciem klauzuli `IN` lub `ANY`, zamiast wielokrotnych zapytań w pętli.
-   Zwracany obiekt `RepertoireDto` nie powinien zawierać treści piosenek (`content`), co zmniejsza rozmiar odpowiedzi.

## 9. Etapy wdrożenia
1.  **Struktura plików:** Utwórz nowy katalog `supabase/functions/repertoires/`.
2.  Wewnątrz `repertoires/` utwórz pliki: `index.ts`, `repertoires.handlers.ts`, `repertoires.service.ts`.
3.  **Model walidacji (Zod):** W `repertoires.handlers.ts` zdefiniuj schemat Zod dla `RepertoireCreateCommand`.
4.  **Logika serwisu (`repertoires.service.ts`):**
    a. Zaimplementuj funkcję `createRepertoire(organizerId, command)`.
    b. Użyj transakcji bazodanowej do wykonania operacji.
    c. Dodaj logikę wstawiania danych do tabeli `repertoires`.
    d. Zaimplementuj walidację własności piosenek, jeśli `songIds` są dostarczone.
    e. Dodaj logikę wstawiania danych do tabeli `repertoire_songs`.
    f. Zaimplementuj obsługę błędu `UNIQUE constraint violation` dla nazwy i rzuć niestandardowy błąd, który zostanie zmapowany na `409 Conflict`.
    g. Po zatwierdzeniu transakcji, pobierz i zwróć pełny obiekt `RepertoireDto`.
5.  **Logika handlera (`repertoires.handlers.ts`):**
    a. Zaimplementuj `handlePostRepertoire(req)`.
    b. Dodaj logikę uwierzytelniania.
    c. Zwaliduj ciało żądania przy użyciu schematu Zod.
    d. Wywołaj `repertoires.service.ts` z odpowiednimi argumentami.
    e. Zbuduj i zwróć odpowiedź `201 Created` z danymi z serwisu.
6.  **Routing (`index.ts`):**
    a. Skonfiguruj router do obsługi żądań `POST` na ścieżce `/`.
    b. Zintegruj `handlePostRepertoire` z routerem.
    c. Zaimplementuj globalną obsługę błędów, która mapuje błędy rzucone z serwisu i handlera na odpowiednie odpowiedzi HTTP (zgodnie z tabelą w sekcji 7).
