# API Endpoint Implementation Plan: GET /me/profile

## 1. Przegląd punktu końcowego
- Endpoint zwraca profil organizatora powiązany z aktualnie uwierzytelnionym użytkownikiem.
- Dostarcza dane konieczne do personalizacji panelu oraz weryfikacji konfiguracji konta w interfejsie organizatora.
- Realizuje czysto odczytowy scenariusz i zakłada istnienie rekordu w tabeli `profiles` powiązanego z użytkownikiem Supabase Auth.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/me/profile`
- Parametry:
    - Wymagane: nagłówek `Authorization: Bearer <JWT>` przekazywany przez Supabase; brak parametrów zapytań.
    - Opcjonalne: brak.
- Request Body: brak (żądanie bez treści JSON).
- Źródła danych wejściowych: identyfikator użytkownika (`userId`) i e-mail (`email`) z uwierzytelnionego tokena JWT.

## 3. Szczegóły odpowiedzi
- Struktura: obiekt zgodny z `OrganizerProfileDto` (`id`, `email`, `displayName`, `createdAt`, `updatedAt`).
- Mapowanie pól:
    - `id`: `profiles.id` (UUID użytkownika).
    - `email`: pobrane z tokena/auth context (Supabase `req.auth.user.email`).
    - `displayName`: `profiles.display_name`.
    - `createdAt`: `profiles.created_at`.
    - `updatedAt`: `profiles.updated_at`.
- Kody statusu:
    - `200 OK` – profil odnaleziony i zwrócony.
    - `401 Unauthorized` – brak lub nieprawidłowy token.
    - `404 Not Found` – brak rekordu w `profiles` dla bieżącego użytkownika.
    - `500 Internal Server Error` – nieobsłużony błąd serwera lub Supabase.
- Wykorzystywane typy: `OrganizerProfileDto` z `packages/contracts/types.ts` (brak komend – endpoint tylko odczytuje dane).

## 4. Przepływ danych
1. Żądanie `GET /me/profile` trafia do Edge Function/handlera REST po stronie Supabase.
2. Middleware uwierzytelniający wykorzystuje Supabase JWT do identyfikacji użytkownika; w przypadku niepowodzenia zwraca `401`.
3. Handler buduje kontekst Supabase Client związany z żądaniem (RLS włączone) oraz pozyskuje `userId` i `email` z sesji.
4. Warstwa serwisowa (`ProfileService.getOrganizerProfile(userId)`) wykonuje zapytanie `select id, display_name, created_at, updated_at from profiles` z filtrem `id = userId`, korzystając z `.maybeSingle()`.
5. Service mapuje wynik do `OrganizerProfileDto`, uzupełniając `email` danymi z kontekstu uwierzytelnienia.
6. W przypadku braku rekordu service zwraca kontrolowany wyjątek `resource_not_found`; w innym wypadku przekazuje zmapowany DTO do handlera.
7. Handler zwraca odpowiedź `200 OK` z JSON lub odpowiedni błąd obsłużony przez centralny mechanizm.

## 5. Względy bezpieczeństwa
- Wymuszaj poprawne uwierzytelnienie przez Supabase JWT; odrzucaj żądania bez nagłówka `Authorization` lub z nieważnym tokenem.
- Rely on Row Level Security w tabeli `profiles` (`auth.uid() = id`) — potwierdź istnienie i poprawność polityk przed wdrożeniem.
- Używaj minimalnych uprawnień klienta Supabase (request-scoped) zamiast klucza serwisowego, by egzekwować RLS.
- Nie loguj pełnego tokena ani danych wrażliwych; do logów trafiają jedynie `userId`, kod błędu i kontekst diagnostyczny.
- Wyjście ogranicz do niezbędnych pól DTO, aby nie ujawniać dodatkowych metadanych profilu.

## 6. Obsługa błędów
- `401 Unauthorized`: zwróć `ErrorResponseDto` z kodem `unauthorized`; loguj zdarzenie jako ostrzeżenie (np. `logger.warn`) bez wpisu do tabeli błędów aplikacyjnych.
- `404 Not Found`: gdy w `profiles` brak wpisu dla `userId`, zwróć `resource_not_found`; zarejestruj informacje diagnostyczne w centralnym loggerze (bez PII), opcjonalnie w tabeli `app_error_logs` jeśli jest stosowana.
- `500 Internal Server Error`: przechwytuj wyjątki Supabase/network, loguj szczegóły za pomocą standardowego mechanizmu (np. `logAndCaptureError`) zapisującego do tabeli błędów oraz monitoringu, zwracając klientowi `ErrorResponseDto` z kodem `resource_gone` lub `validation_error` tylko gdy to adekwatne; w pozostałych przypadkach `internal_error`.
- Upewnij się, że odpowiedzi błędów przestrzegają envelope z `ErrorResponseDto` i nie ujawniają danych implementacyjnych.

## 7. Wydajność
- Zapytanie opiera się na kluczu głównym `profiles.id`, co zapewnia O(1); brak dodatkowych indeksów.
- Wydobycie e-maila z tokena eliminuje dodatkowe zapytania do `auth.users`.
- Użycie `.maybeSingle()` kończy zapytanie po pierwszym dopasowaniu, ograniczając transfer danych.
- Monitoruj latencję Edge Function; w razie potrzeby dodaj proste cache’owanie po stronie klienta (ETag/HTTP caching) na poziomie UI, ponieważ dane zmieniają się rzadko.

## 8. Kroki implementacji
1. Zweryfikuj i w razie potrzeby doprecyzuj polityki RLS w tabeli `profiles`, aby `auth.uid() = id` umożliwiało selekt tylko właścicielowi.
2. Dodaj/rozszerz moduł serwisowy (np. `packages/functions/me/profile/profile.service.ts`) z funkcją `getOrganizerProfile(userId: string, email: string)` kapsułkującą zapytanie i mapowanie na DTO.
3. Zaimplementuj repozytorium/dostęp do danych (jeśli rozdzielone) używające Supabase klienta z request contextem oraz obsługą `.maybeSingle()` i transformacją błędów.
4. Utwórz handler HTTP w odpowiednim pliku Edge Function (np. `packages/functions/me/profile/index.ts`) korzystający z warstwy serwisowej i centralnego middleware autoryzacji.
5. Zastosuj standardowy mechanizm obsługi błędów, mapując wyjątki serwisowe na `ErrorResponseDto` wraz z kodami statusu HTTP.
7. Zaktualizuj dokumentację kontraktu API (OpenAPI/README) i scenariusze w API clientach (np. SDK, Postman) zgodnie z nowym endpointem.

