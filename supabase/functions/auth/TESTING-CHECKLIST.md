# Checklista testowania endpointu POST /auth/register

## Przygotowanie środowiska

- [ ] Upewnij się, że Supabase działa lokalnie: `supabase status`
- [ ] Sprawdź, czy Mailpit (Inbucket) jest dostępny: http://localhost:54324
- [ ] Uruchom funkcję auth: `supabase functions serve auth`

## Testy funkcjonalne - Przypadki pozytywne

### TC-001: Podstawowa rejestracja
- [ ] Wyślij POST z poprawnymi danymi
- [ ] Oczekiwany wynik: 201 Created
- [ ] Response zawiera: `id`, `email`, `displayName`, `createdAt`, `updatedAt`
- [ ] Email w response zgadza się z wysłanym

### TC-002: Weryfikacja użytkownika w Auth
- [ ] Otwórz Supabase Dashboard → Authentication → Users
- [ ] Użytkownik istnieje na liście
- [ ] Status: **Waiting for verification** / **Email not confirmed**
- [ ] Email jest poprawny

### TC-003: Weryfikacja profilu w bazie
- [ ] Otwórz Supabase Dashboard → Table Editor → profiles
- [ ] Nowy wiersz istnieje z poprawnym `id` (= user.id z Auth)
- [ ] `display_name` zgadza się z wysłanym
- [ ] `created_at` i `updated_at` są ustawione

### TC-004: Email weryfikacyjny
- [ ] Otwórz Mailpit: http://localhost:54324
- [ ] Email weryfikacyjny dotarł na podany adres
- [ ] Email zawiera link do potwierdzenia
- [ ] Tytuł emaila: "Confirm Your Email" (lub podobny)

### TC-005: Aktywacja konta przez email
- [ ] Kliknij link weryfikacyjny w emailu
- [ ] Przekierowanie na stronę sukcesu
- [ ] W Supabase Dashboard status użytkownika zmienia się na **Confirmed**
- [ ] Kolumna **Email Confirmed** = **Yes**

### TC-006: Rejestracja z polskimi znakami
- [ ] Użyj `displayName` z polskimi znakami (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- [ ] Oczekiwany wynik: 201 Created
- [ ] Polskie znaki są poprawnie zapisane w bazie

### TC-007: Trim displayName
- [ ] Wyślij `displayName` z białymi znakami na początku i końcu: `"  Jan Kowalski  "`
- [ ] Oczekiwany wynik: 201 Created
- [ ] W bazie zapisane bez białych znaków: `"Jan Kowalski"`

## Testy funkcjonalne - Walidacja (400 Bad Request)

### TC-101: Brak pola email
- [ ] Nie wysyłaj pola `email`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Adres email jest wymagany"

### TC-102: Nieprawidłowy format email
- [ ] Wyślij `email: "not-an-email"`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Podaj prawidłowy adres email"

### TC-103: Brak pola password
- [ ] Nie wysyłaj pola `password`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Hasło jest wymagane"

### TC-104: Hasło za krótkie (< 8 znaków)
- [ ] Wyślij `password: "short"`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Hasło powinno zawierać co najmniej 8 znaków"

### TC-105: Hasło za długie (> 256 znaków)
- [ ] Wyślij hasło dłuższe niż 256 znaków
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Hasło jest zbyt długie"

### TC-106: Brak pola displayName
- [ ] Nie wysyłaj pola `displayName`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Nazwa wyświetlana jest wymagana"

### TC-107: Pusta displayName
- [ ] Wyślij `displayName: "   "` (same białe znaki)
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Nazwa wyświetlana nie może być pusta"

### TC-108: displayName za długa (> 120 znaków)
- [ ] Wyślij `displayName` dłuższą niż 120 znaków
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Nazwa wyświetlana może mieć maksymalnie 120 znaków"

### TC-109: Nieprawidłowy JSON
- [ ] Wyślij niepoprawnie sformatowany JSON
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Komunikat: "Nieprawidłowy format JSON w żądaniu"

### TC-110: Dodatkowe nieoczekiwane pole
- [ ] Wyślij dodatkowe pole, np. `extraField: "value"`
- [ ] Oczekiwany wynik: 400 Bad Request
- [ ] Schemat Zod `.strict()` powinien odrzucić request

## Testy funkcjonalne - Konflikt (409 Conflict)

### TC-201: Duplikat email
- [ ] Zarejestruj użytkownika z emailem `test@example.com`
- [ ] Spróbuj zarejestrować ponownie tego samego emaila
- [ ] Oczekiwany wynik: 409 Conflict
- [ ] Komunikat: "Użytkownik o podanym adresie email już istnieje"

## Testy funkcjonalne - Nieprawidłowa metoda HTTP (405)

### TC-301: GET zamiast POST
- [ ] Wyślij GET `/register`
- [ ] Oczekiwany wynik: 405 Method Not Allowed
- [ ] Header `Allow: POST`

### TC-302: PUT zamiast POST
- [ ] Wyślij PUT `/register`
- [ ] Oczekiwany wynik: 405 Method Not Allowed
- [ ] Header `Allow: POST`

### TC-303: DELETE zamiast POST
- [ ] Wyślij DELETE `/register`
- [ ] Oczekiwany wynik: 405 Method Not Allowed
- [ ] Header `Allow: POST`

## Testy funkcjonalne - Nieistniejąca ścieżka (404)

### TC-401: Nieistniejący endpoint
- [ ] Wyślij POST `/nonexistent`
- [ ] Oczekiwany wynik: 404 Not Found
- [ ] Komunikat: "Endpoint nie został znaleziony"

## Testy bezpieczeństwa

### TS-001: SQL Injection w email
- [ ] Wyślij `email: "test@example.com'; DROP TABLE profiles; --"`
- [ ] Oczekiwany wynik: 400 (nieprawidłowy format email) lub bezpieczne przetworzenie
- [ ] Tabela `profiles` dalej istnieje

### TS-002: XSS w displayName
- [ ] Wyślij `displayName: "<script>alert('XSS')</script>"`
- [ ] Oczekiwany wynik: 201 Created (znaki są dozwolone)
- [ ] Wartość jest zapisana jako zwykły tekst (nie wykonywana jako kod)

### TS-003: Bardzo długi email
- [ ] Wyślij ekstremalnie długi email (np. 10000 znaków)
- [ ] Oczekiwany wynik: 400 Bad Request lub timeout bez crashu serwera

## Testy atomowości

### TA-001: Rollback po błędzie profilu
**Uwaga:** Ten test wymaga symulacji błędu bazy danych

Sposób testowania:
1. Tymczasowo zmodyfikuj `register.service.ts`, aby wymuszić błąd podczas inserta do `profiles`
2. Wykonaj rejestrację
3. Sprawdź, czy użytkownik NIE istnieje w Supabase Auth
4. Rollback powinien usunąć konto z Auth
5. Przywróć oryginalny kod

- [ ] Po błędzie tworzenia profilu użytkownik jest usuwany z Auth
- [ ] W logach pojawia się: "Wycofano nowo utworzonego użytkownika po błędzie profilu"
- [ ] Nie ma "osieroconych" kont w Auth bez profilu

## Testy wydajności

### TP-001: Czas odpowiedzi
- [ ] Średni czas odpowiedzi < 2 sekundy (lokalne środowisko)
- [ ] Zmierz czas dla 10 kolejnych rejestracji
- [ ] Brak znaczącego wzrostu czasu z każdą rejestracją

### TP-002: Równoczesne rejestracje
- [ ] Wyślij 5 requestów równocześnie z różnymi emailami
- [ ] Wszystkie powinny zakończyć się sukcesem (201)
- [ ] Wszystkie użytkownicy istnieją w Auth i profiles

## Testy integracyjne

### TI-001: End-to-end flow
- [ ] Rejestracja → Email → Aktywacja → Logowanie
- [ ] Po aktywacji użytkownik może się zalogować
- [ ] Zalogowany użytkownik ma dostęp do chronionych endpointów

## Czyszczenie po testach

### Cleanup
- [ ] Usuń testowych użytkowników z Auth (Dashboard → Authentication → Users)
- [ ] Usuń testowe profile z tabeli `profiles`
- [ ] Wyczyść Mailpit (opcjonalnie)

## Dodatkowe notatki

### Znane ograniczenia
- W środowisku lokalnym Supabase może nie wymuszać wszystkich polityk Auth
- Rate limiting nie działa lokalnie - testuj na produkcji

### Wskazówki debugowania
- Logi funkcji: sprawdź terminal, w którym uruchomiono `supabase functions serve auth`
- Logi Auth: Supabase Dashboard → Logs → Auth
- Logi bazy: Supabase Dashboard → Logs → Database
- Email debugging: Mailpit UI http://localhost:54324

---

**Status wykonania:** __ / __ testów zaliczonych

**Data testowania:** __________

**Tester:** __________

**Środowisko:** [ ] Lokalne  [ ] Staging  [ ] Produkcja

