# Konfiguracja potwierdzenia e-mail w Supabase

## Przegląd

Ten dokument opisuje kroki niezbędne do skonfigurowania procesu potwierdzenia e-mail dla aplikacji StrummerBox w panelu Supabase.

## Wymagana konfiguracja

### 1. Site URL

W panelu Supabase, przejdź do:
**Authentication → URL Configuration → Site URL**

Ustaw odpowiedni URL w zależności od środowiska **wraz ze ścieżką do widoku potwierdzenia**:

- **Development**: `http://localhost:4200/auth/confirm-email`
- **Production**: `https://twoja-domena.com/auth/confirm-email` (zastąp rzeczywistym adresem produkcyjnym)

**⚠️ WAŻNE:** Site URL musi zawierać pełną ścieżkę `/auth/confirm-email`, ponieważ Supabase używa tego URL jako podstawy dla linków w e-mailach!

### 2. Redirect URLs

W panelu Supabase, przejdź do:
**Authentication → URL Configuration → Redirect URLs**

Dodaj następujące adresy URL (dla każdego środowiska):

#### Development:
```
http://localhost:4200/auth/confirm-email
```

#### Production:
```
https://twoja-domena.com/auth/confirm-email
```

**Ważne:** Bez dodania tych adresów do listy Redirect URLs, Supabase odrzuci próby przekierowania i proces potwierdzenia e-mail nie zadziała.

### 3. Email Templates

W panelu Supabase, przejdź do:
**Authentication → Email Templates → Confirm signup**

**⚠️ WAŻNE:** Template musi używać **TYLKO** zmiennej `{{ .ConfirmationURL }}` bez dodatkowych ścieżek!

**✅ POPRAWNY szablon:**
```html
<h2>Potwierdź rejestrację</h2>
<p>Kliknij w poniższy link, aby potwierdzić swoje konto:</p>
<p><a href="{{ .ConfirmationURL }}">Potwierdź adres e-mail</a></p>
```

**❌ NIEPOPRAWNY szablon (NIE DODAWAJ ścieżki!):**
```html
<!-- BŁĄD: nie dodawaj "/auth/confirm-email" do ConfirmationURL -->
<a href="{{ .ConfirmationURL }}"/auth/confirm-email>Potwierdź</a>
```

Supabase automatycznie wygeneruje pełny URL bazując na Site URL + token.

### 4. Weryfikacja konfiguracji w kodzie

W pliku `src/app/core/services/supabase.service.ts` upewnij się, że konfiguracja zawiera:

```typescript
auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,  // Kluczowe dla obsługi URL z tokenem
    persistSession: true,
    autoRefreshToken: true,
}
```

**Parametr `detectSessionInUrl: true`** jest kluczowy - pozwala bibliotece Supabase automatycznie wykryć token potwierdzenia w URL.

## Przepływ procesu potwierdzenia

1. Użytkownik rejestruje się w aplikacji
2. Supabase wysyła e-mail z linkiem aktywacyjnym
3. Link prowadzi do: `https://twoja-domena.com/auth/confirm-email#access_token=...`
4. Biblioteka Supabase automatycznie wykrywa token w URL (dzięki `detectSessionInUrl: true`)
5. `AuthService.handleEmailConfirmation()` nasłuchuje na zdarzenie `SIGNED_IN`
6. Po pomyślnej weryfikacji, użytkownik jest automatycznie wylogowywany
7. Komponent `EmailConfirmationPageComponent` wyświetla komunikat sukcesu lub błędu

## Testowanie konfiguracji

### Test w środowisku lokalnym:

1. Upewnij się, że Supabase CLI działa lokalnie
2. Zarejestruj nowego użytkownika
3. Sprawdź logi Supabase dla wygenerowanego linku potwierdzenia:
   ```bash
   # W kontenerze Supabase sprawdź logi inbucket
   # Link potwierdzenia będzie widoczny w konsoli
   ```
4. Skopiuj link i wklej do przeglądarki
5. Zweryfikuj, że użytkownik zostaje przekierowany na `/auth/confirm-email`
6. Sprawdź, czy wyświetla się komunikat sukcesu

### Debugowanie problemów:

#### Problem: "Token potwierdzający jest nieprawidłowy lub wygasł"
- Sprawdź, czy link nie został już użyty
- Sprawdź, czy link nie wygasł (domyślnie tokeny wygasają po 24h)
- Zweryfikuj konfigurację Redirect URLs w panelu Supabase

#### Problem: Przekierowanie nie działa
- Sprawdź console przeglądarki dla błędów CORS
- Upewnij się, że URL jest na liście Redirect URLs w Supabase
- Zweryfikuj `detectSessionInUrl: true` w `supabase.service.ts`

#### Problem: E-mail nie jest wysyłany
- W środowisku lokalnym: sprawdź Inbucket UI (zazwyczaj `http://localhost:54324`)
- W produkcji: sprawdź konfigurację SMTP w Supabase

## Zmienne środowiskowe

Upewnij się, że plik `environment.ts` zawiera poprawne wartości:

```typescript
export const environment = {
    production: false,
    supabase: {
        url: 'http://localhost:54321',  // lub URL produkcyjny
        anonKey: 'your-anon-key-here',
    },
};
```

## Uwagi bezpieczeństwa

- Tokeny potwierdzenia są jednorazowe - po użyciu stają się nieważne
- Tokeny mają ograniczony czas ważności (domyślnie 24h)
- Redirect URLs muszą być jawnie skonfigurowane - Supabase nie zezwala na arbitrary redirects
- Po pomyślnym potwierdzeniu, użytkownik jest automatycznie wylogowywany dla bezpieczeństwa

## Dodatkowe zasoby

- [Dokumentacja Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates w Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
- [PKCE Flow](https://supabase.com/docs/guides/auth/server-side/pkce-flow)

