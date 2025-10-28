# API Endpoint Implementation Plan: GET /share/repertoires/{id}

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest dostarczenie organizatorowi metadanych niezbędnych do udostępnienia repertuaru. Endpoint zwraca unikalny publiczny identyfikator, pełny publiczny adres URL oraz ładunek do wygenerowania kodu QR. Dostęp jest ograniczony wyłącznie do właściciela repertuaru, co zapewnia bezpieczeństwo i prywatność.

## 2. Szczegóły żądania
- **Metoda HTTP:** `GET`
- **Struktura URL:** `/share/repertoires/{id}`
- **Parametry:**
  - **Wymagane:**
    - `id` (parametr ścieżki, `UUID`): Unikalny identyfikator repertuaru (`repertoires.id`).
- **Request Body:** Brak.
- **Nagłówki:**
    - `Authorization`: `Bearer <SUPABASE_JWT>` - Wymagany do uwierzytelnienia użytkownika.

## 3. Wykorzystywane typy
- **DTO Odpowiedzi:** `RepertoireShareMetaDto`
  ```typescript
  import type { RepertoireRow } from '../database/database.types.ts';

  export type RepertoireShareMetaDto = {
      id: RepertoireRow['id'];
      publicId: RepertoireRow['public_id'];
      publicUrl: string;
      qrPayload: string;
  };
  ```

## 4. Szczegóły odpowiedzi
- **Pomyślna odpowiedź (Success):**
  - **Kod stanu:** `200 OK`
  - **Ciało odpowiedzi (JSON):**
    ```json
    {
      "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
      "publicId": "8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
      "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
      "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
    }
    ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Jeśli `id` nie jest prawidłowym UUID.
  - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Jeśli repertuar o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do funkcji Supabase Edge `share`.
2.  Główny router w `supabase/functions/share/index.ts` identyfikuje ścieżkę `/repertoires/{id}` i przekazuje żądanie do dedykowanego routera repertuarów.
3.  Router w `repertoires.handlers.ts` wywołuje handler `handleGetRepertoireShareMeta`.
4.  Handler waliduje, czy `id` jest poprawnym UUID. Jeśli nie, zwraca błąd `400`.
5.  Handler wywołuje funkcję `getRepertoireShareMeta` z `repertoires.service.ts`, przekazując `id` repertuaru i ID uwierzytelnionego użytkownika.
6.  Funkcja serwisowa wysyła zapytanie do bazy danych PostgreSQL, aby pobrać repertuar: `SELECT id, public_id FROM repertoires WHERE id = :id AND organizer_id = :userId`.
7.  Jeśli zapytanie nie zwróci żadnego rekordu, serwis rzuca błąd `ApplicationError` z kodem `resource_not_found`, co handler tłumaczy na odpowiedź `404 Not Found`.
8.  Jeśli rekord zostanie znaleziony, serwis konstruuje `publicUrl` i `qrPayload` używając `public_id` oraz bazowego adresu URL zdefiniowanego w zmiennych środowiskowych (`PUBLIC_REPERTOIRE_BASE_URL`).
9.  Serwis zwraca obiekt `RepertoireShareMetaDto` do handlera.
10. Handler formatuje pomyślną odpowiedź HTTP z kodem `200 OK` i zwraca ją do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie musi zawierać ważny token JWT w nagłówku `Authorization`. Proces ten jest zarządzany przez framework Deno/Supabase.
- **Autoryzacja:** Logika biznesowa w `repertoires.service.ts` musi bezwzględnie weryfikować, czy `organizer_id` pobranego repertuaru jest zgodny z `auth.uid()` zalogowanego użytkownika. Dodatkową warstwę ochrony stanowi polityka RLS `repertoires_owner_full_access` w bazie danych.
- **Walidacja danych wejściowych:** Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
- **Zapytanie do bazy danych:** Zapytanie jest bardzo proste i wykorzystuje klucz główny (`id`) oraz indeksowany `organizer_id`, co zapewnia wysoką wydajność.
- **Logika w Edge Function:** Logika jest minimalna (konstrukcja URL), więc nie przewiduje się wąskich gardeł wydajnościowych.

## 8. Etapy wdrożenia
1.  **Utworzenie plików serwisu i handlera:**
    -   Utwórz nowy plik `supabase/functions/share/repertoires.service.ts`.
    -   Utwórz nowy plik `supabase/functions/share/repertoires.handlers.ts`.

2.  **Implementacja logiki w `repertoires.service.ts`:**
    -   Zdefiniuj funkcję `getRepertoireShareMeta(repertoireId: string, userId: string): Promise<RepertoireShareMetaDto>`.
    -   Wewnątrz funkcji, użyj klienta Supabase, aby pobrać `id` i `public_id` z tabeli `repertoires` na podstawie `repertoireId` i `userId`.
    -   Dodaj obsługę przypadku, gdy repertuar nie zostanie znaleziony (rzucenie `ApplicationError`).
    -   Pobierz bazowy URL ze zmiennych środowiskowych (`Deno.env.get('APP_PUBLIC_URL')`).
    -   Zbuduj pełne `publicUrl` i `qrPayload`.
    -   Zwróć zwalidowany i zmapowany obiekt DTO.

3.  **Implementacja logiki w `repertoires.handlers.ts`:**
    -   Utwórz funkcję `handleGetRepertoireShareMeta(req: Request, repertoireId: string): Promise<Response>`.
    -   Zwaliduj `repertoireId` jako UUID.
    -   Wywołaj funkcję `getRepertoireShareMeta` z serwisu, przekazując `repertoireId` i ID użytkownika z `req`.
    -   Obsłuż potencjalne błędy z serwisu i zwróć odpowiednie kody HTTP.
    -   W przypadku sukcesu, zwróć odpowiedź JSON z kodem `200 OK`.
    -   Zdefiniuj i wyeksportuj router (np. `repertoiresShareRouter`), który będzie obsługiwał ścieżkę `^/repertoires/([^/]+)$` i metodę `GET`.

4.  **Aktualizacja głównego routera w `share/index.ts`:**
    -   Zaimportuj `repertoiresShareRouter` z `repertoires.handlers.ts`.
    -   W głównym `serve` handlerze, dodaj logikę, która sprawdza, czy ścieżka pasuje do routera repertuarów i deleguje do niego obsługę żądania. Router piosenek (`songsShareRouter`) powinien być sprawdzany jako pierwszy lub drugi, w zależności od oczekiwanej kolejności.

5.  **Dodanie zmiennej środowiskowej:**
    -   Upewnij się, że zmienna `APP_PUBLIC_URL` jest zdefiniowana w plikach `.env` i w konfiguracji środowiska Supabase.

6.  **Testowanie:**
    -   Uruchom funkcję lokalnie za pomocą `supabase functions serve share`.
    -   Napisz testy (np. używając Postmana lub skryptów testowych), aby zweryfikować:
        -   Pomyślne pobranie metadanych z poprawnym `id` i tokenem.
        -   Odpowiedź `404` dla nieistniejącego `id`.
        -   Odpowiedź `404` dla `id` należącego do innego użytkownika.
        -   Odpowiedź `401` bez tokena autoryzacyjnego.
        -   Odpowiedź `400` dla nieprawidłowego formatu UUID.
