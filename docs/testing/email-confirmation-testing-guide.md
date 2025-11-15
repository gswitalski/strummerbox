# Przewodnik testowania Email Confirmation

## Cel dokumentu

Ten dokument zawiera instrukcje testowania funkcjonalności potwierdzenia adresu e-mail w aplikacji StrummerBox.

---

## Wymagania wstępne

### 1. Uruchomiony Supabase lokalnie

```bash
# Sprawdź status Supabase
supabase status

# Powinien być uruchomiony, jeśli nie:
supabase start
```

### 2. Konfiguracja Supabase

Sprawdź w Dashboard Supabase (zazwyczaj `http://localhost:54323`):

**Authentication → URL Configuration:**
- Site URL: `http://localhost:4200`
- Redirect URLs: Dodaj `http://localhost:4200/auth/confirm-email`

### 3. Uruchomiona aplikacja Angular

```bash
npm start
# lub
ng serve
```

Aplikacja powinna być dostępna pod `http://localhost:4200`

---

## Scenariusz testowy 1: Pomyślne potwierdzenie e-mail

### Kroki:

1. **Rejestracja nowego użytkownika**
   - Przejdź do: `http://localhost:4200/register`
   - Wypełnij formularz:
     - E-mail: `test@example.com`
     - Hasło: `Test1234!`
     - Nazwa wyświetlana: `Test User`
   - Kliknij "Zarejestruj się"

2. **Sprawdź stronę oczekiwania**
   - Powinieneś zostać przekierowany na: `/auth/awaiting-confirmation?email=test@example.com`
   - Sprawdź, czy wyświetla się komunikat z informacją o wysłanym linku

3. **Pobierz link potwierdzenia**
   
   **Opcja A: Inbucket UI (rekomendowane)**
   - Otwórz: `http://localhost:54324`
   - Znajdź e-mail wysłany do `test@example.com`
   - Skopiuj link z treści e-maila
   
   **Opcja B: Logi Supabase**
   ```bash
   # Sprawdź logi kontenera inbucket
   docker logs <inbucket-container-id>
   ```

4. **Kliknij link potwierdzenia**
   - Link będzie miał format: `http://localhost:4200/auth/confirm-email#access_token=...&type=signup`
   - Wklej link do przeglądarki i naciśnij Enter

5. **Weryfikacja wyniku**
   
   **Oczekiwane zachowanie:**
   - Najpierw widzisz spinner z tekstem "Weryfikacja adresu e-mail..."
   - Po ~1-2 sekundach pojawia się:
     - Zielona ikona check_circle
     - Tytuł "E-mail potwierdzony!"
     - Komunikat o pomyślnej weryfikacji
     - Przycisk "Przejdź do logowania"
   
   **Konsola przeglądarki:**
   - Nie powinno być żadnych błędów
   - Możesz zobaczyć logi Supabase o SIGNED_IN event

6. **Przejście do logowania**
   - Kliknij "Przejdź do logowania"
   - Powinieneś być na `/login`

7. **Zaloguj się**
   - Użyj tych samych danych logowania
   - Powinieneś zostać pomyślnie zalogowany i przekierowany do dashboardu

### ✅ Test zakończony sukcesem jeśli:
- Wszystkie kroki wykonały się bez błędów
- Wyświetlił się komunikat sukcesu
- Udało się zalogować po potwierdzeniu

---

## Scenariusz testowy 2: Link wygasły/nieprawidłowy

### Kroki:

1. **Uzyskaj link potwierdzenia**
   - Wykonaj kroki 1-3 ze Scenariusza 1

2. **Zmodyfikuj token w linku**
   - Skopiuj link potwierdzenia
   - Zmień kilka znaków w tokenie `access_token=...`
   - Przykład: zmień `eyJh...` na `eyJx...`

3. **Wklej zmodyfikowany link**
   - Wklej do przeglądarki i naciśnij Enter

4. **Weryfikacja wyniku**
   
   **Oczekiwane zachowanie:**
   - Najpierw widzisz spinner przez ~5 sekund
   - Następnie pojawia się:
     - Czerwona ikona error
     - Tytuł "Wystąpił błąd"
     - Komunikat: "Link aktywacyjny jest nieprawidłowy, został już użyty lub wygasł."
     - Przycisk "Wyślij nowy link aktywacyjny"
   
   **Konsola przeglądarki:**
   - Powinien być log błędu: `EmailConfirmationPageComponent: confirmation error`

5. **Kliknij przycisk resend**
   - Kliknij "Wyślij nowy link aktywacyjny"
   - Powinieneś zostać przekierowany na `/register`

### ✅ Test zakończony sukcesem jeśli:
- Wyświetlił się komunikat błędu po ~5 sekundach
- Przycisk przekierował do strony rejestracji

---

## Scenariusz testowy 3: Link już użyty

### Kroki:

1. **Pomyślnie potwierdź e-mail**
   - Wykonaj pełny Scenariusz 1

2. **Spróbuj użyć tego samego linku ponownie**
   - Wklej ten sam link potwierdzenia jeszcze raz
   - Link: `http://localhost:4200/auth/confirm-email#access_token=...`

3. **Weryfikacja wyniku**
   
   **Oczekiwane zachowanie:**
   - Spinner przez ~5 sekund
   - Komunikat błędu (identyczny jak w Scenariuszu 2)

### ✅ Test zakończony sukcesem jeśli:
- System wykrył, że token został już użyty
- Wyświetlił się komunikat błędu

---

## Scenariusz testowy 4: Timeout weryfikacji

Ten scenariusz testuje mechanizm timeout, gdy Supabase nie odpowiada w ciągu 5 sekund.

### Kroki:

1. **Symulacja opóźnienia**
   
   **Opcja A: Throttling sieci**
   - Otwórz Chrome DevTools → Network
   - Ustaw throttling na "Slow 3G"
   - Następnie wykonaj Scenariusz 2 (nieprawidłowy token)
   
   **Opcja B: Zatrzymanie Supabase**
   ```bash
   supabase stop
   ```
   - Wykonaj Scenariusz 1 (normalna weryfikacja)

2. **Weryfikacja wyniku**
   - Po dokładnie 5 sekundach powinien pojawić się komunikat błędu

### ✅ Test zakończony sukcesem jeśli:
- Timeout zadziałał po 5 sekundach
- Wyświetlił się komunikat błędu

---

## Scenariusz testowy 5: Responsywność

### Kroki:

1. **Testowanie na różnych urządzeniach**
   - Otwórz Chrome DevTools → Toggle device toolbar
   - Przetestuj widoki:
     - Mobile: iPhone 12 Pro (390x844)
     - Tablet: iPad (768x1024)
     - Desktop: 1920x1080

2. **Sprawdź każdy stan**
   - Stan loading (spinner)
   - Stan success (karta z sukcesem)
   - Stan error (karta z błędem)

3. **Weryfikacja**
   - Czy wszystkie elementy są czytelne?
   - Czy buttony są łatwo klikalnej?
   - Czy karta nie jest zbyt szeroka na desktop?
   - Czy nie ma overflow na mobile?

### ✅ Test zakończony sukcesem jeśli:
- Wszystkie stany wyglądają dobrze na wszystkich rozdzielczościach
- Nie ma problemów z layoutem

---

## Checklist kontrolna

Przed zakończeniem testów upewnij się, że:

- [ ] Scenariusz 1: Pomyślne potwierdzenie działa
- [ ] Scenariusz 2: Nieprawidłowy token wyświetla błąd
- [ ] Scenariusz 3: Użyty token wyświetla błąd
- [ ] Scenariusz 4: Timeout działa poprawnie
- [ ] Scenariusz 5: Responsywność OK na wszystkich urządzeniach
- [ ] Brak błędów w konsoli przeglądarki (poza oczekiwanymi logami)
- [ ] Animacje i przejścia są płynne
- [ ] Buttony działają poprawnie
- [ ] Nawigacja działa we wszystkich przypadkach
- [ ] Style są zgodne z Material Design

---

## Debugowanie problemów

### Problem: "Token potwierdzający jest nieprawidłowy lub wygasł" od razu

**Możliwe przyczyny:**
1. Supabase nie jest uruchomiony
2. Redirect URL nie jest skonfigurowany
3. Konfiguracja `detectSessionInUrl` jest wyłączona

**Rozwiązanie:**
```bash
# Sprawdź status Supabase
supabase status

# Sprawdź SupabaseService
# Plik: src/app/core/services/supabase.service.ts
# Upewnij się, że detectSessionInUrl: true
```

### Problem: Spinner kręci się w nieskończoność

**Możliwe przyczyny:**
1. Timeout nie działa
2. JavaScript error w konsoli
3. Supabase nie wysyła zdarzenia SIGNED_IN

**Rozwiązanie:**
- Sprawdź konsolę przeglądarki
- Sprawdź logi Supabase
- Zrestartuj aplikację Angular

### Problem: Przekierowanie nie działa

**Możliwe przyczyny:**
1. Routing niepoprawnie skonfigurowany
2. AuthService rzuca nieoczekiwany błąd

**Rozwiązanie:**
```typescript
// Sprawdź app.routes.ts
// Upewnij się, że ścieżka /auth/confirm-email istnieje
```

### Problem: E-mail nie przychodzi

**Możliwe przyczyny:**
1. Supabase Inbucket nie działa
2. Błędny adres e-mail

**Rozwiązanie:**
```bash
# Sprawdź Inbucket UI
open http://localhost:54324

# Sprawdź logi Supabase
docker logs <supabase-container-id>
```

---

## Testy automatyczne (TODO)

Następujące testy powinny zostać zaimplementowane:

### Unit Tests

```typescript
describe('EmailConfirmationPageComponent', () => {
  it('should display loading state initially', () => {});
  it('should display success state on successful confirmation', () => {});
  it('should display error state on failed confirmation', () => {});
  it('should navigate to login on goToLogin()', () => {});
  it('should navigate to register on goToResendConfirmation()', () => {});
});

describe('AuthService.handleEmailConfirmation', () => {
  it('should resolve on SIGNED_IN event', () => {});
  it('should reject after timeout', () => {});
  it('should sign out user after successful confirmation', () => {});
});
```

### E2E Tests

```typescript
describe('Email Confirmation Flow', () => {
  it('should complete full registration and confirmation flow', () => {});
  it('should handle expired token', () => {});
  it('should handle used token', () => {});
});
```

---

## Logi do monitorowania

### Poprawne działanie (sukces):

```
EmailConfirmationPageComponent: ngOnInit
AuthService: handleEmailConfirmation - starting
Supabase: onAuthStateChange - SIGNED_IN
AuthService: handleEmailConfirmation - success, signing out
EmailConfirmationPageComponent: state changed to 'success'
```

### Błąd (timeout):

```
EmailConfirmationPageComponent: ngOnInit
AuthService: handleEmailConfirmation - starting
AuthService: handleEmailConfirmation - timeout
EmailConfirmationPageComponent: confirmation error Error: Token potwierdzający jest nieprawidłowy lub wygasł.
EmailConfirmationPageComponent: state changed to 'error'
```

---

## Metryki sukcesu

Po zakończeniu testów, funkcjonalność jest gotowa do wdrożenia jeśli:

- ✅ 100% scenariuszy testowych przeszło pomyślnie
- ✅ Brak błędów krytycznych w konsoli
- ✅ Responsywność działa na wszystkich urządzeniach
- ✅ Doświadczenie użytkownika jest intuicyjne
- ✅ Komunikaty są jasne i zrozumiałe
- ✅ Nawigacja działa poprawnie we wszystkich przypadkach

---

## Kontakt i wsparcie

W przypadku problemów sprawdź:
1. `docs/setup/supabase-email-confirmation-setup.md` - Instrukcje konfiguracji
2. `src/app/pages/auth/README.md` - Dokumentacja techniczna
3. Logi aplikacji i Supabase
4. Konsolę przeglądarki

---

**Autor:** StrummerBox Development Team  
**Ostatnia aktualizacja:** 2025-11-15  
**Wersja:** 1.0

