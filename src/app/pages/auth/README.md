# Moduł Autentykacji - Widoki Auth

Ten katalog zawiera komponenty związane z procesem autentykacji użytkowników w aplikacji StrummerBox.

## Komponenty

### 1. EmailConfirmationPageComponent

**Ścieżka:** `/auth/confirm-email`

**Opis:**
Widok obsługujący potwierdzenie adresu e-mail po kliknięciu linku aktywacyjnego wysłanego podczas rejestracji.

**Główne funkcje:**
- Automatyczna weryfikacja tokenu potwierdzenia z URL
- Wyświetlanie trzech stanów: ładowanie, sukces, błąd
- Nawigacja do strony logowania po pomyślnym potwierdzeniu
- Opcja ponownej próby w przypadku błędu

**Stany widoku:**
- `loading`: Wyświetlany podczas weryfikacji tokenu (mat-spinner)
- `success`: Komunikat o pomyślnym potwierdzeniu e-maila
- `error`: Komunikat o błędzie z możliwością ponownego wysłania linku

**Przepływ:**
1. Użytkownik klika link w e-mailu: `/auth/confirm-email#access_token=...`
2. Supabase automatycznie wykrywa token w URL
3. `AuthService.handleEmailConfirmation()` weryfikuje token
4. Komponent wyświetla odpowiedni stan (sukces/błąd)
5. Użytkownik jest automatycznie wylogowany po sukcesie
6. Użytkownik może przejść do logowania

**Technologie:**
- Angular 19 (standalone component)
- Angular Material (Card, Button, Spinner, Icon)
- Signals do zarządzania stanem
- OnPush change detection strategy

**Pliki:**
- `email-confirmation-page.component.ts` - logika komponentu
- `email-confirmation-page.component.html` - szablon (używa @switch)
- `email-confirmation-page.component.scss` - style (Material Design variables)

---

### 2. AwaitingConfirmationPageComponent

**Ścieżka:** `/auth/awaiting-confirmation?email=...`

**Opis:**
Widok wyświetlany bezpośrednio po rejestracji, informujący użytkownika o konieczności potwierdzenia adresu e-mail.

**Główne funkcje:**
- Wyświetlanie informacji o wysłanym linku aktywacyjnym
- Możliwość ponownego wysłania linku (z cooldownem 30s)
- Nawigacja powrotna do strony logowania

**Query params:**
- `email` (wymagany): Adres e-mail użytkownika

**Technologie:**
- Angular 19 (standalone component)
- Angular Material
- Signals do zarządzania stanem

---

## Integracja z AuthService

Oba komponenty korzystają z `AuthService` (`src/app/core/services/auth.service.ts`), który zapewnia:

### Metody:

#### `handleEmailConfirmation(): Promise<void>`
Obsługuje proces weryfikacji tokenu e-mail:
- Nasłuchuje na zdarzenie `onAuthStateChange` od Supabase
- Używa mechanizmu timeout (5 sekund) do wykrycia błędu
- Po sukcesie automatycznie wylogowuje użytkownika
- Rzuca błąd w przypadku niepowodzenia

#### `resendConfirmation(command: ResendConfirmationCommand): Promise<void>`
Ponownie wysyła link aktywacyjny na podany adres e-mail.

---

## Routing

Konfiguracja w `src/app/app.routes.ts`:

```typescript
{
    path: 'auth/confirm-email',
    loadComponent: () =>
        import('./pages/auth/email-confirmation-page.component').then(
            (m) => m.EmailConfirmationPageComponent
        ),
},
{
    path: 'auth/awaiting-confirmation',
    loadComponent: () =>
        import('./pages/auth/awaiting-confirmation-page.component').then(
            (m) => m.AwaitingConfirmationPageComponent
        ),
}
```

---

## Konfiguracja Supabase

Aby proces potwierdzenia e-mail działał poprawnie, wymagana jest konfiguracja w panelu Supabase:

1. **Site URL**: URL aplikacji (np. `http://localhost:4200`)
2. **Redirect URLs**: Dodaj `/auth/confirm-email` do listy dozwolonych URL
3. **Email Templates**: Upewnij się, że template zawiera link z `{{ .ConfirmationURL }}`

Szczegółowa instrukcja: `docs/setup/supabase-email-confirmation-setup.md`

---

## Przepływ użytkownika - pełny scenariusz

```
1. Użytkownik → Strona rejestracji (/register)
   ↓
2. Wypełnia formularz i wysyła
   ↓
3. Backend tworzy konto + Supabase wysyła e-mail
   ↓
4. Użytkownik → AwaitingConfirmationPageComponent (/auth/awaiting-confirmation?email=...)
   ↓
5. Użytkownik otwiera e-mail i klika link
   ↓
6. Link prowadzi → EmailConfirmationPageComponent (/auth/confirm-email#access_token=...)
   ↓
7. Automatyczna weryfikacja tokenu
   ↓
8. Stan SUCCESS → Użytkownik klika "Przejdź do logowania"
   ↓
9. Logowanie (/login) → Dashboard
```

### Scenariusz alternatywny (błąd):

```
6. EmailConfirmationPageComponent - token nieprawidłowy/wygasły
   ↓
7. Stan ERROR → Użytkownik klika "Wyślij nowy link"
   ↓
8. Przekierowanie do /register
   ↓
9. Użytkownik może ponownie zarejestrować się lub skontaktować z supportem
```

---

## Style

Wszystkie komponenty używają zmiennych Material Design dla spójności:
- `var(--mat-sys-primary)` - kolor główny
- `var(--mat-sys-error)` - kolor błędu
- `var(--mat-sys-on-surface)` - kolor tekstu
- `var(--mat-sys-surface-container-low)` - tło

---

## Najlepsze praktyki zastosowane w implementacji

✅ **Standalone components** - wszystkie komponenty są samodzielne  
✅ **Signals** - zarządzanie stanem przez Angular Signals  
✅ **inject()** - wstrzykiwanie zależności przez funkcję inject()  
✅ **@switch** - nowoczesna składnia kontroli przepływu zamiast *ngIf  
✅ **OnPush** - strategia change detection dla lepszej wydajności  
✅ **Lazy loading** - komponenty ładowane na żądanie  
✅ **TypeScript strict mode** - pełna kontrola typów  
✅ **Material Design 3** - spójny system projektowania  

---

## TODO / Możliwe rozszerzenia

- [ ] Dodanie testów jednostkowych dla EmailConfirmationPageComponent
- [ ] Dedykowana strona `/auth/resend-confirmation` z formularzem e-mail
- [ ] Licznik czasu do wygaśnięcia tokenu
- [ ] Animacje przejść między stanami
- [ ] Internationalization (i18n) dla komunikatów
- [ ] Analytics tracking (sukces/błąd potwierdzenia)

