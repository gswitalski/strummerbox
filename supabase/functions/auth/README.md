# Auth Edge Function

## Opis

Edge Function obsługująca endpointy związane z autentykacją i rejestracją użytkowników.

## Endpointy

### POST /auth/register

Rejestracja nowego organizatora w systemie.

**Request Body:**
```json
{
  "email": "organizer@example.com",
  "password": "secure-password-123",
  "displayName": "Jan Kowalski"
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "uuid-here",
    "email": "organizer@example.com",
    "displayName": "Jan Kowalski",
    "createdAt": "2023-10-27T10:00:00Z",
    "updatedAt": "2023-10-27T10:00:00Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Nieprawidłowe dane wejściowe
```json
{
  "error": {
    "code": "validation_error",
    "message": "Nieprawidłowe dane wejściowe",
    "details": {
      "email": { "_errors": ["Podaj prawidłowy adres email"] }
    }
  }
}
```

- **409 Conflict** - Użytkownik już istnieje
```json
{
  "error": {
    "code": "conflict",
    "message": "Użytkownik o podanym adresie email już istnieje"
  }
}
```

- **500 Internal Server Error** - Błąd serwera

## Proces rejestracji

1. Walidacja danych wejściowych (email, hasło min. 8 znaków, nazwa wyświetlana)
2. Utworzenie konta w Supabase Auth
3. **Supabase automatycznie wysyła email weryfikacyjny** na podany adres
4. Utworzenie profilu w tabeli `profiles`
5. Zwrócenie danych profilu

**UWAGA:** Konto użytkownika pozostaje **nieaktywne** do momentu potwierdzenia adresu email poprzez kliknięcie w link wysłany przez Supabase Auth.

## Testowanie lokalne

### Uruchomienie funkcji

```bash
supabase functions serve auth
```

Funkcja będzie dostępna pod adresem: `http://localhost:54321/functions/v1/auth`

### Przykładowe żądania

#### Poprawna rejestracja

```bash
curl -X POST http://localhost:54321/functions/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "displayName": "Jan Testowy"
  }'
```

#### Walidacja - za krótkie hasło

```bash
curl -X POST http://localhost:54321/functions/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "short",
    "displayName": "Jan Testowy"
  }'
```

#### Walidacja - nieprawidłowy email

```bash
curl -X POST http://localhost:54321/functions/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "TestPassword123",
    "displayName": "Jan Testowy"
  }'
```

#### Test duplikatu (409 Conflict)

Wykonaj to samo żądanie dwukrotnie - drugie powinno zwrócić błąd 409.

## Weryfikacja w Supabase Dashboard

Po rejestracji:

1. Otwórz **Supabase Dashboard** → **Authentication** → **Users**
2. Nowy użytkownik powinien mieć status: **Waiting for verification**
3. W kolumnie **Email Confirmed** powinno być: **No**
4. Sprawdź inbox na podany email - powinien dotrzeć mail z linkiem weryfikacyjnym

W środowisku lokalnym:
- Email zostanie przechwycony przez **Inbucket** dostępny pod: `http://localhost:54324`
- Kliknij w link weryfikacyjny, aby aktywować konto

## Scenariusze testowe

### ✅ Przypadki pozytywne

- [ ] Rejestracja z poprawnymi danymi zwraca 201 i profil
- [ ] Użytkownik pojawia się w panelu Auth jako niepotwierdzony
- [ ] Email weryfikacyjny zostaje wysłany
- [ ] Po kliknięciu linku status zmienia się na potwierdzony
- [ ] Profil zostaje utworzony w tabeli `profiles`

### ❌ Przypadki negatywne

- [ ] Brak email w żądaniu → 400
- [ ] Nieprawidłowy format email → 400
- [ ] Hasło krótsze niż 8 znaków → 400
- [ ] Hasło dłuższe niż 256 znaków → 400
- [ ] Brak displayName → 400
- [ ] Pusta displayName (po trim) → 400
- [ ] displayName dłuższa niż 120 znaków → 400
- [ ] Nieprawidłowy JSON w body → 400
- [ ] Duplikat email → 409
- [ ] Nieprawidłowa metoda HTTP (GET, PUT, DELETE) → 405

## Atomowość operacji

Jeśli utworzenie profilu w bazie danych nie powiedzie się:
- Funkcja automatycznie usuwa konto utworzone w Supabase Auth (rollback)
- Zapobiega to powstawaniu "osieroconych" kont bez powiązanego profilu

## Bezpieczeństwo

- **Rate Limiting**: Należy skonfigurować w Supabase Dashboard
- **Walidacja hasła**: Wykorzystuje wbudowane mechanizmy Supabase Auth
- **XSS Protection**: Dane wejściowe są walidowane przez Zod
- **Email Verification**: Wymuszana przez Supabase Auth

