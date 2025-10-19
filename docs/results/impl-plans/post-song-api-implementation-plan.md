# API Endpoint Implementation Plan: POST /songs

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi utworzenie nowego utworu w jego prywatnej bibliotece. Endpoint przyjmuje tytuł, treść oraz opcjonalny status publikacji, a w odpowiedzi zwraca pełny obiekt nowo utworzonego zasobu.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/songs`
- **Nagłówki:**
  - `Authorization: Bearer <SUPABASE_JWT>` (wymagane)
  - `Content-Type: application/json` (wymagane)
- **Ciało żądania (Request Body):** Obiekt JSON zgodny z typem `SongCreateCommand`.
  ```json
  {
    "title": "Tytuł piosenki (string, 1-180 znaków)",
    "content": "Treść piosenki z akordami (string, niepusty)",
    "published": "Status publikacji (boolean, opcjonalny)"
  }
  ```
- **Parametry:**
  - **Wymagane:** `title`, `content`
  - **Opcjonalne:** `published`

## 3. Wykorzystywane typy
- **Command Model (wejście):** `SongCreateCommand` z `packages/contracts/types.ts`
- **DTO (wyjście):** `SongDto` z `packages/contracts/types.ts`

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created):** Obiekt JSON zgodny z typem `SongDto`.
  ```json
  {
    "id": "uuid",
    "publicId": "uuid",
    "title": "Tytuł piosenki",
    "content": "Treść piosenki z akordami",
    "publishedAt": "timestamp or null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- **Odpowiedzi błędów:** Obiekt JSON zgodny z typem `ErrorResponseDto`.
  - `400 Bad Request`
  - `401 Unauthorized`
  - `409 Conflict`
  - `500 Internal Server Error`

## 5. Przepływ danych
1.  **Routing (`index.ts`):** Żądanie `POST /songs` jest przyjmowane i kierowane do odpowiedniego handlera.
2.  **Handler (`songs.handlers.ts`):**
    a.  Weryfikacja tokena JWT i ekstrakcja `organizer_id`. W przypadku braku autoryzacji, zwrot `401`.
    b.  Walidacja ciała żądania przy użyciu schematu Zod bazującego na `SongCreateCommand`. W przypadku błędu walidacji, zwrot `400`.
    c.  Wywołanie metody `createSong` z serwisu `songs.service.ts`, przekazując `organizer_id` i zwalidowane dane.
    d.  Odebranie wyniku lub błędu z serwisu.
    e.  W przypadku sukcesu, sformatowanie odpowiedzi HTTP `201 Created` z `SongDto`.
    f.  W przypadku błędu (np. `ConflictError`), sformatowanie odpowiedniej odpowiedzi błędu (np. `409 Conflict`).
3.  **Serwis (`songs.service.ts`):**
    a.  Metoda `createSong` otrzymuje dane.
    b.  Mapuje pole `published` (boolean) na `published_at` (timestamp lub null).
    c.  Konstruuje obiekt do wstawienia do bazy danych.
    d.  Wykonuje operację `INSERT` na tabeli `songs` za pomocą klienta Supabase.
    e.  Jeśli baza danych zwróci błąd naruszenia unikalności (`23505`), serwis rzuca niestandardowy błąd `ConflictError`.
    f.  W przypadku powodzenia, pobiera wstawiony wiersz.
    g.  Mapuje wiersz z bazy danych na `SongDto`.
    h.  Zwraca `SongDto` do handlera.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint musi być chroniony. Do weryfikacji tożsamości organizatora zostanie użyta współdzielona funkcja `authenticate` z `_shared/auth.ts`, która dekoduje token JWT.
- **Autoryzacja:** Logika biznesowa operuje wyłącznie na `organizer_id` pozyskanym z tokena, co zapewnia, że użytkownicy mogą tworzyć utwory tylko w swoim imieniu.
- **Walidacja danych:** Rygorystyczna walidacja danych wejściowych w warstwie handlera chroni przed niepoprawnymi lub potencjalnie szkodliwymi danymi.

## 7. Obsługa błędów
| Kod statusu | Wyzwalacz | Odpowiedź | Poziom logowania |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | Błąd walidacji Zod (brak `title`, zły format danych) | `ErrorResponseDto` z kodem `validation_error` | `WARN` |
| `401 Unauthorized` | Brak lub nieprawidłowy token JWT | `ErrorResponseDto` z kodem `unauthorized` | `INFO` |
| `409 Conflict` | Naruszenie unikalności `(organizer_id, title)` w bazie danych | `ErrorResponseDto` z kodem `conflict` | `WARN` |
| `500 Internal Server Error` | Nieoczekiwany błąd bazy danych lub inny błąd serwera | `ErrorResponseDto` z kodem `internal_error` | `ERROR` |

## 8. Rozważania dotyczące wydajności
- Operacja `INSERT` na indeksowanej tabeli jest z natury wydajna.
- Nie przewiduje się problemów z wydajnością przy typowym obciążeniu. Największym obciążeniem jest pojedyncze zapytanie do bazy danych.

## 9. Etapy wdrożenia
1.  **Utworzenie struktury plików:**
    -   Stworzyć katalog `supabase/functions/songs/`.
    -   Wewnątrz stworzyć pliki: `index.ts`, `songs.handlers.ts`, `songs.service.ts`.
2.  **Implementacja serwisu (`songs.service.ts`):**
    -   Zaimplementować funkcję `createSong({ organizerId, command })`.
    -   Dodać logikę mapowania `published` na `published_at`.
    -   Dodać obsługę zapytania `INSERT` do Supabase.
    -   Dodać przechwytywanie błędu unikalności (kod `23505`) i rzucanie `ConflictError`.
    -   Zaimplementować mapowanie wyniku na `SongDto`.
3.  **Implementacja handlera (`songs.handlers.ts`):**
    -   Stworzyć schemat walidacji Zod dla `SongCreateCommand`.
    -   Zaimplementować funkcję `handlePostSong(req)`.
    -   Dodać wywołanie `authenticate(req)`.
    -   Dodać walidację ciała żądania.
    -   Dodać wywołanie `songs.service.ts`.
    -   Dodać blok `try...catch` do obsługi błędów z serwisu i mapowania ich na odpowiedzi HTTP.
4.  **Implementacja routera (`index.ts`):**
    -   Skonfigurować główny serwer i router.
    -   Dodać routing dla `POST /songs` do `handlePostSong`.
    -   Dodać globalną obsługę błędów, aby przechwytywać nieobsłużone wyjątki i zwracać `500`.
5.  **Testowanie:**
    -   Uruchomić funkcję lokalnie za pomocą `supabase functions serve songs`.
    -   Przetestować scenariusz pozytywny (201).
    -   Przetestować przypadki błędów: brakujący `title` (400), duplikat `title` (409), brak tokena (401).
