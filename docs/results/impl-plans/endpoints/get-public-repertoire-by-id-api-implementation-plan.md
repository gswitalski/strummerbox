# API Endpoint Implementation Plan: GET /public/repertoires/{publicId}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia anonimowym użytkownikom pobieranie informacji o **opublikowanym** repertuarze. Zwraca jego podstawowe metadane (nazwę, opis) oraz posortowaną listę piosenek zawierającą ich tytuły i publiczne adresy URL. Dostęp jest publiczny i nie wymaga uwierzytelnienia.

## 2. Szczegóły żądania

-   **Metoda HTTP:** `GET`
-   **Struktura URL:** `/public/repertoires/{publicId}`
-   **Parametry:**
    -   **Wymagane:**
        -   `publicId` (string, format UUID) - Publiczny identyfikator repertuaru przekazywany w ścieżce URL.
    -   **Opcjonalne:** Brak.
-   **Request Body:** Brak.

## 3. Wykorzystywane typy

-   **`PublicRepertoireDto`**: Reprezentuje obiekt odpowiedzi.
-   **`PublicRepertoireSongLinkDto`**: Reprezentuje pojedynczą piosenkę w liście `songs` obiektu `PublicRepertoireDto`.

```typescript
// from packages/contracts/types.ts

export type PublicRepertoireDto = {
    name: RepertoireRow['name'];
    description: RepertoireRow['description'];
    songs: PublicRepertoireSongLinkDto[];
};

export type PublicRepertoireSongLinkDto = {
    title: SongRow['title'];
    publicSongUrl: string;
};
```

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (200 OK):**
    -   Zwraca obiekt JSON typu `PublicRepertoireDto`.
    ```json
    {
      "name": "Ognisko 2025",
      "description": "Wieczorne granie",
      "songs": [
        {
          "title": "Knockin' on Heaven's Door",
          "publicSongUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2"
        }
      ]
    }
    ```
-   **Odpowiedzi błędów:**
    -   `400 Bad Request`: Parametr `publicId` nie jest w formacie UUID.
    -   `404 Not Found`: Repertuar o podanym `publicId` nie został znaleziony.
    -   `410 Gone`: Repertuar istnieje, ale nie jest opublikowany (`published_at` jest `NULL`).
    -   `500 Internal Server Error`: Wystąpił nieoczekiwany błąd serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do Supabase Edge Function `public`.
2.  Router w `index.ts` dopasowuje ścieżkę `/repertoires/:publicId` i przekazuje żądanie do handlera w `public.handlers.ts`.
3.  Handler wyodrębnia `publicId` z parametrów ścieżki.
4.  Handler waliduje `publicId` przy użyciu schemy Zod, sprawdzając, czy jest to poprawny UUID. W przypadku błędu zwraca `400`.
5.  Handler wywołuje funkcję serwisową `getPublicRepertoire(publicId)` z `public.service.ts`.
6.  Funkcja serwisowa wykonuje dwuetapowe zapytanie do bazy danych:
    a.  **Krok 1: Weryfikacja repertuaru.**
        ```sql
        SELECT id, name, description, published_at, public_id FROM repertoires WHERE public_id = $1 LIMIT 1
        ```
    b.  **Logika:**
        -   Jeśli zapytanie nie zwróci żadnego rekordu, serwis rzuca błąd `NotFoundError` (mapowany na `404`).
        -   Jeśli rekord zostanie znaleziony, ale jego `published_at` jest `NULL`, serwis rzuca błąd `ResourceGoneError` (mapowany na `410`).
    c.  **Krok 2: Pobranie piosenek.**
        ```sql
        SELECT s.title, s.public_id 
        FROM repertoire_songs rs 
        JOIN songs s ON rs.song_id = s.id 
        WHERE rs.repertoire_id = $1 -- ID z kroku 1
        ORDER BY rs.position ASC
        ```
7.  Serwis iteruje po wynikach drugiego zapytania, tworząc listę obiektów `PublicRepertoireSongLinkDto`. Dla każdej piosenki konstruuje `publicSongUrl` na podstawie stałego wzorca i identyfikatorów publicznych.
8.  Serwis zwraca do handlera kompletny obiekt `PublicRepertoireDto`.
9.  Handler serializuje obiekt do formatu JSON i wysyła odpowiedź z kodem statusu `200 OK`.
10. W przypadku rzucenia błędu przez serwis, jest on przechwytywany przez globalny error handler, który formatuje odpowiedź błędu `ErrorResponseDto` i ustawia odpowiedni kod statusu HTTP.

## 6. Względy bezpieczeństwa

-   **Kontrola dostępu:** Dostęp jest publiczny, ale logika serwisu oraz polityka RLS (`repertoires_public_read`) w bazie danych PostgreSQL zapewniają, że tylko opublikowane repertuary są zwracane. Zapytanie SQL jawnie filtruje po `published_at IS NOT NULL`, co stanowi podstawową linię obrony.
-   **Walidacja wejścia:** `publicId` jest walidowany jako UUID, co zapobiega błędom zapytań i potencjalnym atakom typu SQL Injection (chociaż klient Supabase parametryzuje zapytania).
-   **Ochrona przed enumeracją:** Użycie nieprzewidywalnych identyfikatorów UUID dla `publicId` uniemożliwia odgadywanie adresów URL innych repertuarów.

## 7. Rozważania dotyczące wydajności

-   Zapytanie do bazy danych wykorzystuje `JOIN` na trzech tabelach. Kluczowe jest istnienie indeksów na kolumnach:
    -   `repertoires(public_id)` (indeks `UNIQUE` jest tworzony automatycznie)
    -   `repertoire_songs(repertoire_id, position)` (istnieje wg schematu, kluczowy dla sortowania)
    -   `songs(id)` (indeks `PRIMARY KEY`)
-   Dzięki istniejącym indeksom, zapytanie powinno być wysoce wydajne, nawet przy dużej liczbie piosenek i repertuarów.
-   Paginacja nie jest wymagana, ponieważ repertuar zazwyczaj zawiera ograniczoną liczbę piosenek.

## 8. Etapy wdrożenia

1.  **Struktura plików:**
    -   Utwórz nowy katalog `supabase/functions/public/`.
    -   Wewnątrz stwórz pliki: `index.ts`, `public.handlers.ts` oraz `public.service.ts`.
2.  **Implementacja Serwisu (`public.service.ts`):**
    -   Stwórz funkcję `getPublicRepertoire(publicId: string)`.
    -   Zaimplementuj logikę pobierania danych z bazy w dwóch krokach, jak opisano w sekcji "Przepływ danych".
    -   Dodaj obsługę przypadków, gdy repertuar nie istnieje (`NotFoundError`) lub nie jest opublikowany (`ResourceGoneError`).
    -   Zaimplementuj logikę mapowania wyników z bazy na DTO, w tym konstruowanie `publicSongUrl`.
3.  **Implementacja Handlera (`public.handlers.ts`):**
    -   Stwórz funkcję `handleGetPublicRepertoire(req: Request)`.
    -   Wyodrębnij `publicId` z `req.params`.
    -   Zwaliduj `publicId` za pomocą `zod.string().uuid()`.
    -   Wywołaj funkcję serwisową, opakowując ją w blok `try...catch` do obsługi błędów.
    -   Zwróć odpowiedź `200 OK` z DTO lub przekaż błąd do globalnego handlera.
4.  **Implementacja Routera (`index.ts`):**
    -   Skonfiguruj router do obsługi ścieżki `GET /public/repertoires/:publicId`.
    -   Powiąż ścieżkę z zaimplementowanym handlerem.
    -   Dodaj globalną obsługę błędów, która będzie zwracać sformatowane odpowiedzi JSON w przypadku wystąpienia wyjątków.
5.  **Definicje błędów:**
    -   Jeśli nie istnieją, zdefiniuj klasy `NotFoundError` i `ResourceGoneError` w `supabase/functions/_shared/errors.ts`, aby zapewnić spójną obsługę błędów w całej aplikacji.
6.  **Testowanie:**
    -   Uruchom funkcję lokalnie za pomocą `supabase functions serve public`.
    -   Przetestuj ręcznie lub za pomocą narzędzia (np. Postman, cURL) następujące scenariusze:
        -   Poprawne `publicId` dla opublikowanego repertuaru (oczekiwany `200 OK`).
        -   Poprawne `publicId` dla nieopublikowanego repertuaru (oczekiwany `410 Gone`).
        -   Nieistniejący `publicId` (oczekiwany `404 Not Found`).
        -   Nieprawidłowy format `publicId` (oczekiwany `400 Bad Request`).
