# Email Confirmation - Najczęstsze Problemy

## Problem 1: Link w e-mailu prowadzi do strony głównej zamiast `/auth/confirm-email`

### Objawy:
- E-mail przychodzi
- Link prowadzi do `https://twoja-domena.com` zamiast `https://twoja-domena.com/auth/confirm-email`
- Token jest w hash'u URL, ale na złej stronie

### Przyczyna:
**Site URL** w Supabase jest ustawiony na stronę główną, a nie na endpoint potwierdzenia.

### Rozwiązanie:

1. Otwórz panel Supabase
2. Idź do: **Authentication → URL Configuration**
3. Zmień **Site URL** z:
   ```
   https://twoja-domena.com
   ```
   na:
   ```
   https://twoja-domena.com/auth/confirm-email
   ```
4. Kliknij **Save**
5. Zarejestruj nowego użytkownika testowego (stare linki nie będą zaktualizowane)

---

## Problem 2: Link w e-mailu ma dodatkowy `/auth/confirm-email` w środku

### Objawy:
- Link wygląda źle: `https://twoja-domena.com/auth/confirm-email/auth/confirm-email#token=...`
- Błąd 404 lub routing nie działa

### Przyczyna:
**Email template** ma błędnie skonstruowany link - dodaje ścieżkę do `{{ .ConfirmationURL }}`.

### Rozwiązanie:

1. Otwórz panel Supabase
2. Idź do: **Authentication → Email Templates → Confirm signup**
3. Znajdź linię z linkiem i usuń dodatkową ścieżkę

**❌ Źle:**
```html
<a href="{{ .ConfirmationURL }}"/auth/confirm-email>Confirm</a>
```

**✅ Dobrze:**
```html
<a href="{{ .ConfirmationURL }}">Confirm</a>
```

4. Kliknij **Save**

---

## Problem 3: Wyświetla się błąd mimo że token jest poprawny (można się zalogować)

### Objawy:
- Link prowadzi do poprawnej strony
- Wyświetla się: "Link aktywacyjny jest nieprawidłowy, został już użyty lub wygasł"
- Mimo to użytkownik może się zalogować
- W konsoli brak błędów

### Przyczyna:
Timeout w `AuthService.handleEmailConfirmation()` jest za krótki - Supabase potrzebuje więcej czasu na przetworzenie tokenu.

### Rozwiązanie:

**Kod został już poprawiony w wersji 1.1+** - timeout zwiększony z 5s do 10s + dodatkowe sprawdzenia sesji.

Jeśli nadal występuje problem:

1. Sprawdź konsolę przeglądarki, czy widzisz logi:
   ```
   AuthService: Auth state change event: SIGNED_IN
   AuthService: Email confirmed via SIGNED_IN event
   ```

2. Jeśli logi nie pojawiają się, zwiększ timeout w `auth.service.ts`:
   ```typescript
   const CONFIRMATION_TIMEOUT_MS = 15000; // 15 sekund
   ```

3. Przebuduj i wdroż aplikację

---

## Problem 4: Spinner kręci się w nieskończoność

### Objawy:
- Strona ładuje się poprawnie
- Spinner nie znika
- W konsoli brak błędów lub komunikatów

### Przyczyna:
1. Supabase nie wysyła zdarzenia `SIGNED_IN`
2. `detectSessionInUrl` jest wyłączone
3. Problem z konfiguracją Flow Type

### Rozwiązanie:

1. Sprawdź `src/app/core/services/supabase.service.ts`:

```typescript
auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,  // MUSI być true!
    persistSession: true,
    autoRefreshToken: true,
}
```

2. Sprawdź w konsoli przeglądarki czy są błędy Supabase

3. Sprawdź logi w panelu Supabase: **Logs → Auth Logs**

---

## Problem 5: CORS errors w konsoli

### Objawy:
```
Access to XMLHttpRequest at 'https://xxx.supabase.co' from origin 'https://twoja-domena.com' 
has been blocked by CORS policy
```

### Przyczyna:
**Redirect URL** nie jest na liście dozwolonych URL-i.

### Rozwiązanie:

1. Otwórz panel Supabase
2. Idź do: **Authentication → URL Configuration → Redirect URLs**
3. Dodaj:
   ```
   https://twoja-domena.com/auth/confirm-email
   https://twoja-domena.com/**
   ```
4. Kliknij **Save**
5. Odczekaj 2-3 minuty (cache Supabase)

---

## Problem 6: Token expired error

### Objawy:
- Użytkownik klika w stary link (np. następnego dnia)
- Wyświetla się błąd: "Link aktywacyjny jest nieprawidłowy lub wygasł"

### Przyczyna:
To **normalne zachowanie** - tokeny mają ograniczony czas ważności (domyślnie 24h).

### Rozwiązanie:

1. Użytkownik powinien kliknąć "Wyślij nowy link aktywacyjny"
2. Zaimplementuj stronę `/auth/resend-confirmation` z formularzem e-mail
3. Lub przekieruj do `/register` z informacją

**To nie jest bug** - to feature bezpieczeństwa.

---

## Problem 7: E-mail w ogóle nie przychodzi

### Objawy:
- Użytkownik rejestruje się
- E-mail nie przychodzi (nawet w spam)

### Przyczyna (Development):
- Supabase CLI nie jest uruchomione
- Inbucket nie działa

### Rozwiązanie (Development):

1. Sprawdź Supabase status:
   ```bash
   supabase status
   ```

2. Otwórz Inbucket UI:
   ```
   http://localhost:54324
   ```

3. Sprawdź czy e-mail tam jest

### Przyczyna (Production):
- SMTP nie skonfigurowany w Supabase
- E-mail wysyłany do nieistniejącego adresu

### Rozwiązanie (Production):

1. Sprawdź **Logs → Auth Logs** w panelu Supabase
2. Sprawdź konfigurację SMTP w **Settings → Auth**
3. Zweryfikuj adres e-mail użytkownika

---

## Checklist debugowania

Gdy coś nie działa, sprawdź po kolei:

- [ ] **Site URL** zawiera `/auth/confirm-email`
- [ ] **Redirect URLs** zawiera pełną ścieżkę + wildcard `/**`
- [ ] **Email template** używa tylko `{{ .ConfirmationURL }}`
- [ ] `detectSessionInUrl: true` w `supabase.service.ts`
- [ ] `flowType: 'pkce'` w `supabase.service.ts`
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów CORS
- [ ] Supabase Auth Logs nie pokazują błędów
- [ ] Timeout w `handleEmailConfirmation()` wynosi przynajmniej 10s

---

## Pomocne komendy debugowania

### Sprawdź aktualną sesję w konsoli przeglądarki:

```javascript
// Otwórz DevTools → Console
const { data, error } = await (window as any).supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
console.log('Email confirmed:', data.session?.user?.email_confirmed_at);
```

### Sprawdź logi Supabase w terminalu (dev):

```bash
# Sprawdź logi kontenera auth
docker logs <supabase-auth-container-id>

# Sprawdź logi inbucket
docker logs <inbucket-container-id>
```

---

## Kiedy skontaktować się z supportem

Jeśli wszystkie powyższe kroki zawiodły i nadal masz problem:

1. **Zbierz informacje:**
   - Site URL z panelu Supabase
   - Redirect URLs z panelu Supabase
   - Przykładowy link z e-maila
   - Logi z konsoli przeglądarki
   - Logi z Auth Logs w Supabase

2. **Sprawdź dokumentację Supabase:**
   - https://supabase.com/docs/guides/auth

3. **Zgłoś issue** na GitHub lub skontaktuj się z zespołem

---

## Przydatne linki

- [Dokumentacja Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [PKCE Flow Documentation](https://supabase.com/docs/guides/auth/server-side/pkce-flow)
- [Community Discord](https://discord.supabase.com)

---

**Last updated:** 2025-11-15  
**Version:** 1.1

