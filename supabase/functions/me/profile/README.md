# GET /me/profile – Dokumentacja funkcji

## Cel
Zwrócenie profilu organizatora powiązanego z aktualnie uwierzytelnionym użytkownikiem Supabase.

## Przepływ
1. Funkcja wymaga nagłówka `Authorization: Bearer <JWT>`.
2. Tworzony jest klient Supabase powiązany z żądaniem.
3. `requireAuth` waliduje sesję użytkownika oraz dostępność adresu e-mail.
4. `getOrganizerProfile` pobiera rekord z tabeli `profiles` (RLS zapewnia izolację) i mapuje go na `OrganizerProfileDto`.
5. Handler zwraca `{ data: OrganizerProfileDto }` z kodem 200 i nagłówkiem `Cache-Control: no-store`.

## Scenariusze testów manualnych
- `200 OK`: wywołanie z ważnym tokenem, istnieje rekord w `profiles`.
- `401 Unauthorized`: brak nagłówka `Authorization` lub niepoprawny token.
- `404 Not Found`: użytkownik uwierzytelniony, ale brak powiązanego profilu w tabeli.
- `500 Internal Error`: symulacja błędu Supabase (np. tymczasowe odłączenie) – funkcja powinna zwrócić błąd `internal_error` z envelope `ErrorResponseDto`.

## Uwaga dotycząca RLS
Polityka `profiles_select_authenticated` (`id = auth.uid()`) gwarantuje, że użytkownik otrzyma wyłącznie własny rekord.

