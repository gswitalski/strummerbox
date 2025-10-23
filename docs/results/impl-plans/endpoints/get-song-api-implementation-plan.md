# API Endpoint Implementation Plan: GET /songs/{id}

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie szczegółowych informacji o pojedynczej piosence na podstawie jej identyfikatora (ID). Punkt końcowy zwraca pełne dane piosenki, w tym jej treść z akordami. Jest przeznaczony do użytku przez uwierzytelnionego organizatora, który jest właścicielem piosenki. Opcjonalnie, punkt końcowy może również zwrócić listę repertuarów, w których dana piosenka jest wykorzystywana.

## 2. Szczegóły żądania
-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/songs/{id}`
-   **Parametry:**
    -   **Wymagane (w ścieżce):**
        -   `id` (UUID): Unikalny identyfikator piosenki.
    -   **Opcjonalne (w zapytaniu):**
        -   `includeUsage` (boolean): Jeśli ustawiony na `true`, odpowiedź będzie zawierać tablicę `repertoires` z informacjami o użyciu piosenki.
-   **Request Body:** Brak

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego zostaną wykorzystane następujące, predefiniowane typy z `packages/contracts/types.ts`:
-   `SongDetailDto`: Główny typ odpowiedzi, zawierający wszystkie dane piosenki oraz opcjonalną listę repertuarów.
-   `SongDto`: Podstawowy obiekt DTO piosenki.
-   `SongUsageDto`: Typ opisujący, w jakim repertuarze piosenka jest używana.
-   `ErrorResponseDto`: Standardowy format odpowiedzi dla błędów.

## 4. Szczegóły odpowiedzi
-   **Sukces (200 OK):**
    -   Odpowiedź zawiera obiekt JSON w formacie `SongDetailDto`.
    -   Jeśli `includeUsage` jest `true`, pole `repertoires` będzie zawierać tablicę obiektów `SongUsageDto`. Jeśli piosenka nie jest używana w żadnym repertuarze lub parametr nie jest ustawiony, pole `repertoires` będzie nieobecne lub będzie pustą tablicą.
-   **Błędy:**
    -   `400 Bad Request`: Gdy `id` w ścieżce nie jest prawidłowym formatem UUID.
    -   `401 Unauthorized`: Gdy żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
    -   `404 Not Found`: Gdy piosenka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
    -   `500 Internal Server Error`: W przypadku nieoczekiwanych błędów po stronie serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do Supabase Edge Function dla ścieżki `/songs`.
2.  Router w `index.ts` identyfikuje ścieżkę z parametrem `id` i przekazuje żądanie do odpowiedniego handlera w `songs.handlers.ts`.
3.  Handler weryfikuje, czy użytkownik jest uwierzytelniony, pobierając jego ID z tokenu JWT. Jeśli nie, zwraca błąd `401`.
4.  Handler waliduje parametr `id` ze ścieżki (sprawdza, czy jest to poprawny UUID). Jeśli nie, zwraca błąd `400`.
5.  Handler wywołuje funkcję serwisową `getSongDetails` z `songs.service.ts`, przekazując `id` piosenki, `organizerId` (ID zalogowanego użytkownika) oraz wartość `includeUsage`.
6.  Funkcja `getSongDetails` wykonuje zapytanie do bazy danych, aby pobrać piosenkę z tabeli `songs`, używając klauzuli `WHERE id = ? AND organizer_id = ?`.
7.  Jeśli zapytanie nie zwróci żadnego rekordu, serwis rzuca błąd `ApplicationError` z kodem `resource_not_found`, który handler przetłumaczy na status `404`.
8.  Jeśli `includeUsage` jest `true`, serwis wykonuje dodatkowe zapytanie (JOIN) do tabel `repertoire_songs` i `repertoires`, aby znaleźć wszystkie repertuary powiązane z daną piosenką i należące do organizatora.
9.  Serwis mapuje wyniki z bazy danych na obiekty DTO (`SongDetailDto`, `SongUsageDto`) i zwraca je do handlera.
10. Handler formatuje pomyślną odpowiedź HTTP (status `200 OK`) z otrzymanym DTO i wysyła ją do klienta.
11. W przypadku jakiegokolwiek błędu rzuconego przez serwis, handler przechwytuje go, loguje i zwraca odpowiednio sformatowaną odpowiedź błędu HTTP.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie:** Każde żądanie musi być uwierzytelnione za pomocą ważnego tokenu JWT. Funkcja pomocnicza w `_shared/auth.ts` zostanie użyta do weryfikacji tokenu i ekstrakcji ID użytkownika.
-   **Autoryzacja:** Dostęp do piosenki jest ograniczony wyłącznie do jej właściciela. Weryfikacja właściciela musi być integralną częścią zapytania SQL poprzez dodanie warunku `WHERE organizer_id = 'aktualne_id_uzytkownika'`. Zaleca się również wzmocnienie tej logiki przez polityki RLS (Row Level Security) na poziomie bazy danych.
-   **Walidacja wejścia:** Parametr `id` musi być rygorystycznie walidowany jako UUID, aby zapobiec potencjalnym atakom (np. próbom iniekcji).

## 7. Rozważania dotyczące wydajności
-   Zapytanie o użycie piosenki (`includeUsage=true`) może być kosztowne, jeśli zostanie zaimplementowane jako osobne zapytanie w pętli (problem N+1). Należy je zaimplementować jako pojedyncze, zoptymalizowane zapytanie z `JOIN`.
-   Należy pobierać z bazy tylko te kolumny, które są niezbędne do zbudowania odpowiedzi DTO, aby zminimalizować transfer danych. Stałe z listą kolumn do wybrania (`SELECT`) powinny być zdefiniowane w pliku serwisu.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu (`songs.service.ts`):**
    -   Utwórz nową, asynchroniczną funkcję `getSongDetails(params: { songId: string, organizerId: string, includeUsage: boolean }): Promise<SongDetailDto>`.
    -   Zdefiniuj stałe dla kolumn `SELECT` dla piosenki i danych o użyciu.
    -   Zaimplementuj logikę pobierania piosenki, upewniając się, że zapytanie filtruje zarówno po `songId`, jak i `organizerId`.
    -   Jeśli piosenka nie zostanie znaleziona, rzuć `ApplicationError` z odpowiednim kodem.
    -   Dodaj warunkową logikę, która (jeśli `includeUsage` jest `true`) wykona zapytanie z `JOIN` w celu pobrania repertuarów.
    -   Zmapuj wynik(i) na strukturę `SongDetailDto` i zwróć ją.

2.  **Aktualizacja handlera (`songs.handlers.ts`):**
    -   Utwórz nowy handler `handleGetSong(req: Request, params: { id: string }): Promise<Response>`.
    -   Wewnątrz handlera, uzyskaj ID użytkownika z `req` przy użyciu funkcji pomocniczej.
    -   Zwaliduj parametr `id` z `params` pod kątem formatu UUID.
    -   Odczytaj parametr `includeUsage` z URL (`const url = new URL(req.url)`) i przekształć go na wartość boolean.
    -   Wywołaj `songs.service.ts#getSongDetails`, przekazując wymagane parametry.
    -   Zbuduj i zwróć odpowiedź `200 OK` z DTO z serwisu.
    -   Dodaj blok `try...catch` do obsługi błędów rzucanych przez serwis i mapowania ich na odpowiednie odpowiedzi HTTP.

3.  **Aktualizacja routera (`songs/index.ts`):**
    -   Dodaj nową regułę do routera, która obsłuży ścieżkę `GET` z parametrem `id`.
    -   Użyj wyrażenia regularnego, aby dopasować ścieżkę i wyodrębnić `id`, np. `const match = url.pathname.match(/\/songs\/([^/]+)/);`.
    -   Jeśli ścieżka pasuje, wywołaj `handleGetSong` z handlera, przekazując `req` i wyodrębnione `id`.

4.  **Testowanie:**
    -   Dodaj testy jednostkowe dla nowej logiki w `songs.service.ts`, obejmujące scenariusze znalezienia piosenki, nieznalezienia jej, oraz poprawnego dołączania danych o użyciu.
    -   Uruchom funkcję lokalnie (`supabase functions serve songs`) i przetestuj punkt końcowy za pomocą narzędzia (np. Postman, curl), sprawdzając wszystkie scenariusze sukcesu i błędów (w tym walidację, autoryzację i brak zasobu).
