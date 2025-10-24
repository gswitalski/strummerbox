# API Endpoint Implementation Plan: PATCH /repertoires/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia częściową aktualizację metadanych istniejącego repertuaru. Uwierzytelniony organizator może zmodyfikować nazwę (`name`) i/lub opis (`description`) swojego repertuaru, identyfikując go za pomocą unikalnego identyfikatora (`id`).

## 2. Szczegóły żądania
- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/repertoires/{id}`
- **Parametry:**
  - **Wymagane (w ścieżce):**
    - `id` (UUID): Unikalny identyfikator repertuaru.
- **Request Body (JSON):**
  Obiekt zawierający co najmniej jedno z poniższych pól.
  ```json
  {
    "name": "Nowa nazwa repertuaru (opcjonalnie)",
    "description": "Zaktualizowany opis (opcjonalnie)"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (wejście):** `RepertoireUpdateCommand`
  - Definiuje strukturę ciała żądania, zawierającą opcjonalne pola `name` i `description`.
- **DTO (wyjście):** `RepertoireDto`
  - Reprezentuje pełny, zaktualizowany obiekt repertuaru, który zostanie zwrócony po pomyślnej operacji.

## 4. Szczegóły odpowiedzi
- **Sukces (`200 OK`):**
  - Zwraca pełny, zaktualizowany obiekt repertuaru w formacie `RepertoireDto`.
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "publicId": "098f6bcd-4621-42d3-8a36-441d6e6f6670",
    "name": "Nowa nazwa repertuaru",
    "description": "Zaktualizowany opis",
    "publishedAt": null,
    "createdAt": "2025-10-24T10:00:00.000Z",
    "updatedAt": "2025-10-24T12:30:00.000Z",
    "songCount": 5
  }
  ```
- **Błędy:** Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  **Routing (`index.ts`):** Żądanie `PATCH` na ścieżce `/repertoires/([^/]+)` jest przechwytywane i kierowane do odpowiedniego handlera.
2.  **Handler (`repertoires.handlers.ts`):**
    a. Weryfikuje, czy użytkownik jest uwierzytelniony.
    b. Ekstrahuje `id` z parametrów ścieżki i waliduje, czy jest to poprawny UUID.
    c. Waliduje ciało żądania za pomocą schemy Zod opartej na `RepertoireUpdateCommand`, sprawdzając typy i ograniczenia długości pól.
    d. Wywołuje funkcję `updateRepertoire` z serwisu, przekazując `id`, dane do aktualizacji oraz ID uwierzytelnionego użytkownika.
    e. Po otrzymaniu zaktualizowanego repertuaru z serwisu, formatuje odpowiedź `200 OK` z ciałem w postaci `RepertoireDto`.
3.  **Serwis (`repertoires.service.ts`):**
    a. Funkcja `updateRepertoire` otrzymuje dane.
    b. Jeśli w danych znajduje się nowa `name`, wykonuje zapytanie `SELECT`, aby sprawdzić, czy inny repertuar tego samego użytkownika (`organizer_id`) już używa tej nazwy. Jeśli tak, rzuca błąd `ApplicationError` z kodem `conflict`.
    c. Wykonuje zapytanie `UPDATE` do tabeli `repertoires`, aktualizując wskazane pola dla rekordu o danym `id` i `organizer_id`.
    d. Jeśli zapytanie `UPDATE` nie zwróci żadnego zaktualizowanego wiersza (co oznacza, że repertuar nie istnieje lub nie należy do użytkownika), rzuca błąd `ApplicationError` z kodem `resource_not_found`.
    e. Zwraca pełny, zaktualizowany obiekt repertuaru do handlera.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization`, który jest weryfikowany przez middleware Supabase.
- **Autoryzacja:** Dostęp jest ograniczony na dwóch poziomach:
    1.  **Baza danych (RLS):** Polityka `repertoires_owner_full_access` na tabeli `repertoires` zapewnia, że operacje `UPDATE` są dozwolone tylko wtedy, gdy `organizer_id` w modyfikowanym wierszu jest równe `auth.uid()`.
    2.  **Warstwa serwisowa:** Zapytanie `UPDATE` w `repertoires.service.ts` jawnie zawiera klauzulę `WHERE organizer_id = :userId`, co stanowi dodatkową warstwę ochrony i pozwala na zwrócenie precyzyjnego błędu `404 Not Found`.

## 7. Obsługa błędów
| Kod statusu        | Kod błędu (wewn.)     | Przyczyna                                                                                             |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `400 Bad Request`  | `validation_error`    | - Parametr `id` w ścieżce nie jest poprawnym UUID.<br>- Ciało żądania jest puste lub niepoprawne.<br>- Przekroczono maksymalną długość pola `name` (160) lub `description`. |
| `401 Unauthorized` | `unauthorized`        | Brak lub nieprawidłowy token JWT.                                                                     |
| `404 Not Found`    | `resource_not_found`  | Repertuar o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.                  |
| `409 Conflict`     | `conflict`            | Inny repertuar należący do tego użytkownika ma już taką samą `name`.                                   |
| `500 Internal Server Error` | `internal_error` | Nieoczekiwany błąd serwera, np. problem z połączeniem z bazą danych.                               |

## 8. Rozważania dotyczące wydajności
- Operacja `UPDATE` jest wykonywana na kluczu głównym (`id`), co zapewnia wysoką wydajność.
- Dodatkowe zapytanie `SELECT` w celu weryfikacji unikalności nazwy jest wykonywane tylko wtedy, gdy pole `name` jest aktualizowane. Zapytanie to korzysta z indeksu `UNIQUE (organizer_id, name)`, więc jego koszt jest minimalny.
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego.

## 9. Etapy wdrożenia
1.  **Schema walidacji:** W `repertoires.handlers.ts` zdefiniować lub zaktualizować schemę Zod dla `RepertoireUpdateCommand`, uwzględniając, że co najmniej jedno pole jest wymagane.
2.  **Logika serwisu:** W `repertoires.service.ts` zaimplementować funkcję `updateRepertoire({ repertoireId, userId, payload })`, która:
    - Sprawdza unikalność nazwy (jeśli jest podana).
    - Wykonuje operację `UPDATE` w bazie danych.
    - Obsługuje przypadki błędów (konflikt, nie znaleziono) i rzuca odpowiednie `ApplicationError`.
    - Zwraca zaktualizowany obiekt.
3.  **Logika handlera:** W `repertoires.handlers.ts` zaimplementować funkcję `handleUpdateRepertoire(req, { params })`, która:
    - Parsuje i waliduje `id` oraz ciało żądania.
    - Wywołuje serwis `updateRepertoire`.
    - Konstruuje i zwraca odpowiedź `200 OK` lub przekazuje błąd do globalnej obsługi błędów.
4.  **Routing:** W `repertoires/index.ts` dodać nową ścieżkę do routera, która obsługuje `PATCH` na `/repertoires/([^/]+)` i mapuje ją na `handleUpdateRepertoire`.
5.  **Testy:** Zaktualizować lub utworzyć testy (jednostkowe/integracyjne), aby zweryfikować:
    - Pomyślną aktualizację `name` i `description`.
    - Poprawną obsługę błędu `404 Not Found`.
    - Poprawną obsługę błędu `409 Conflict`.
    - Odrzucenie żądania z nieprawidłowymi danymi (`400 Bad Request`).
