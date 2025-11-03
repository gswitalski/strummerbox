# API Endpoint Implementation Plan: DELETE /songs/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi trwałe usunięcie piosenki z jego biblioteki. Usunięcie piosenki jest operacją kaskadową i powoduje również jej automatyczne usunięcie ze wszystkich repertuarów, do których została przypisana.

## 2. Szczegóły żądania
- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/songs/{id}`
- **Parametry:**
  - **Wymagane:**
    - `id` (parametr ścieżki): UUID piosenki do usunięcia.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **DTO odpowiedzi:** `SongDeleteResponseDto`

## 4. Szczegóły odpowiedzi
- **Sukces (`200 OK`):**
  ```json
  {
    "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
    "deleted": true
  }
  ```
- **Błędy:**
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych
1.  Żądanie `DELETE` trafia do `supabase/functions/songs/index.ts`.
2.  Główny router na podstawie metody i ścieżki przekierowuje żądanie do handlera `handleDeleteSong` w `supabase/functions/songs/songs.handlers.ts`.
3.  `handleDeleteSong` waliduje parametr `id` ze ścieżki, sprawdzając, czy jest to poprawny format UUID przy użyciu Zod. Jeśli walidacja się nie powiedzie, zwracany jest błąd `400`.
4.  Handler pobiera `userId` z sesji uwierzytelnionego użytkownika dostarczonej przez Supabase.
5.  Handler wywołuje funkcję `deleteSong({ songId: id, userId })` z `songs.service.ts`.
6.  `deleteSong` w warstwie serwisowej wykonuje zapytanie `DELETE` do tabeli `songs` z warunkiem `WHERE id = :songId AND organizer_id = :userId`.
7.  Serwis sprawdza liczbę usuniętych wierszy. Jeśli wynosi `0`, oznacza to, że piosenka nie została znaleziona lub nie należała do użytkownika. W takim przypadku serwis rzuca błąd `ResourceNotFoundError`.
8.  W przypadku pomyślnego usunięcia (usunięto 1 wiersz), serwis zwraca `id` usuniętej piosenki.
9.  Handler `handleDeleteSong` odbiera `id`, formatuje odpowiedź sukcesu (`200 OK`) zgodnie z typem `SongDeleteResponseDto` i odsyła ją do klienta.
10. W przypadku błędu (np. `ResourceNotFoundError` lub błąd bazy danych), jest on przechwytywany przez scentralizowany mechanizm obsługi błędów, który formatuje odpowiednią odpowiedź HTTP (np. `404 Not Found`).

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization`. Weryfikacja tokena jest obsługiwana automatycznie przez Supabase Edge Functions.
- **Autoryzacja:** Dostęp jest ograniczony do właściciela piosenki. Jest to egzekwowane na dwóch poziomach:
    1.  **Baza danych:** Polityka Row Level Security `songs_owner_full_access` zapewnia, że operacje `DELETE` mogą być wykonywane tylko przez właściciela (`organizer_id = auth.uid()`).
    2.  **Warstwa aplikacyjna:** Zapytanie w `songs.service.ts` zawiera jawny warunek `WHERE organizer_id = :userId`, co stanowi dodatkową warstwę ochrony i pozwala na zwrócenie precyzyjnego błędu `404`.

## 7. Obsługa błędów
- **`400 Bad Request`:** Zwracany, gdy `id` w ścieżce URL nie jest prawidłowym UUID.
- **`401 Unauthorized`:** Zwracany przez Supabase, gdy żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
- **`404 Not Found`:** Zwracany, gdy piosenka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
- **`500 Internal Server Error`:** Zwracany w przypadku nieoczekiwanych błędów serwera, takich jak problemy z połączeniem z bazą danych.

## 8. Rozważania dotyczące wydajności
- Operacja `DELETE` jest wykonywana na kluczu głównym (`id`), co jest wysoce wydajne.
- Kaskadowe usuwanie powiązań w tabeli `repertoire_songs` jest realizowane przez bazę danych i również jest zoptymalizowane dzięki odpowiednim indeksom na kluczach obcych.
- Nie przewiduje się znaczących wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 9. Etapy wdrożenia
1.  **Warstwa serwisu (`songs.service.ts`):**
    -   Utwórz nową funkcję asynchroniczną `deleteSong(params: { songId: string; userId: string }): Promise<string>`.
    -   Wewnątrz funkcji użyj klienta Supabase, aby wykonać operację `delete()` na tabeli `songs`.
    -   Dodaj warunki `.eq('id', songId)` i `.eq('organizer_id', userId)`.
    -   Sprawdź wynik operacji. Jeśli `error` istnieje lub `count` wynosi `0`, rzuć odpowiedni błąd (`ApplicationError` lub `ResourceNotFoundError`).
    -   Jeśli operacja się powiedzie, zwróć `songId`.
2.  **Warstwa handlera (`songs.handlers.ts`):**
    -   Utwórz nową funkcję asynchroniczną `handleDeleteSong(req: Request, urlParams: { id: string })`.
    -   Zwaliduj `urlParams.id` za pomocą schemy Zod `z.string().uuid()`.
    -   Pobierz `userId` z `req.user.id`.
    -   Wywołaj `await songService.deleteSong({ songId: urlParams.id, userId })`.
    -   W bloku `try...catch` obsłuż błędy rzucone z warstwy serwisowej.
    -   W przypadku sukcesu, utwórz obiekt `SongDeleteResponseDto` i zwróć odpowiedź `200 OK` z tym obiektem jako ciałem.
3.  **Routing (`index.ts`):**
    -   W głównym routerze funkcji `songs` dodaj nową logikę obsługi metody `DELETE` dla ścieżki pasującej do `/songs/([^/]+)`.
    -   Skieruj pasujące żądania do nowo utworzonego `handleDeleteSong`.
