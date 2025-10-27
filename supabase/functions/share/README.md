# Share Edge Function

Edge Function obsługująca endpointy do generowania metadanych udostępniania zasobów (piosenek, repertuarów).

## Endpointy

### GET /share/songs/{id}

Zwraca metadane do udostępniania konkretnej piosenki.

**Wymagania:**
- Uwierzytelnienie: Wymagane (Bearer token)
- Autoryzacja: Tylko właściciel piosenki

**Parametry URL:**
- `id` (UUID) - identyfikator piosenki

**Przykładowa odpowiedź (200 OK):**
```json
{
  "data": {
    "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
    "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
    "publicUrl": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2",
    "qrPayload": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2"
  }
}
```

**Możliwe błędy:**
- `400 Bad Request` - nieprawidłowy format UUID
- `401 Unauthorized` - brak lub nieprawidłowy token uwierzytelniający
- `404 Not Found` - piosenka nie istnieje lub nie należy do użytkownika
- `500 Internal Server Error` - nieoczekiwany błąd serwera

## Zmienne środowiskowe

### APP_PUBLIC_URL (wymagana)

Bazowy URL aplikacji używany do generowania publicznych linków i payloadów QR.

**Przykłady:**
- Local: `http://localhost:4200`
- Staging: `https://staging.strummerbox.com`
- Production: `https://app.strummerbox.com`

**Konfiguracja:**

1. **Lokalnie** - utwórz plik `.env` w głównym katalogu projektu:
   ```bash
   APP_PUBLIC_URL=http://localhost:4200
   ```

2. **Supabase Cloud** - ustaw secret w dashboard:
   ```bash
   supabase secrets set APP_PUBLIC_URL=https://app.strummerbox.com
   ```

## Testowanie lokalne

### Uruchomienie funkcji

```bash
# Uruchom wszystkie serwisy Supabase (w tym Edge Functions)
supabase start

# Lub uruchom tylko tę funkcję
supabase functions serve share --env-file .env
```

### Przykładowe żądanie

```bash
# Pobierz token (najpierw zaloguj się w aplikacji lub użyj API)
TOKEN="your-jwt-token-here"
SONG_ID="58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5"

# Wywołaj endpoint
curl -i \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/share/songs/$SONG_ID
```

### Testowanie z błędami

```bash
# Test 400 - nieprawidłowy UUID
curl -i \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/share/songs/invalid-uuid

# Test 401 - brak tokenu
curl -i \
  http://localhost:54321/functions/v1/share/songs/$SONG_ID

# Test 404 - nieistniejąca piosenka
curl -i \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/share/songs/00000000-0000-0000-0000-000000000000
```

## Architektura

Funkcja została zorganizowana zgodnie z modularną architekturą:

```
supabase/functions/share/
├── index.ts              # Główny router, autoryzacja
├── songs.handlers.ts     # Handlery HTTP, walidacja requestów
├── songs.service.ts      # Logika biznesowa, operacje na danych
└── README.md            # Ta dokumentacja
```

### Separacja odpowiedzialności

- **index.ts**: Routing na wysokim poziomie, uwierzytelnianie, obsługa błędów
- **songs.handlers.ts**: Walidacja parametrów, formatowanie odpowiedzi HTTP
- **songs.service.ts**: Zapytania do bazy, logika biznesowa, budowanie URL-i

## Bezpieczeństwo

1. **Uwierzytelnianie**: Wszystkie endpointy wymagają prawidłowego JWT tokenu
2. **Autoryzacja**: Zapytania filtrowane po `organizer_id` - użytkownik może uzyskać metadane tylko swoich piosenek
3. **Walidacja**: Wszystkie parametry wejściowe walidowane (UUID, typ)
4. **RLS**: Dodatkowa warstwa ochrony przez Row Level Security na poziomie bazy danych

## Wydajność

- Zapytania używają indeksów: klucz główny (`id`) i `organizer_id`
- Pobierane tylko niezbędne kolumny (`id`, `public_id`)
- Brak złożonych operacji - pojedyncze zapytanie SELECT
- Cache-Control: `no-store` (metadane mogą się zmienić)

## Wdrożenie na produkcję

```bash
# Deploy funkcji do Supabase Cloud
supabase functions deploy share

# Ustaw zmienną środowiskową
supabase secrets set APP_PUBLIC_URL=https://app.strummerbox.com

# Weryfikuj deployment
supabase functions list
```

## Rozszerzanie funkcji

W przyszłości można dodać podobne handlery dla:
- `GET /share/repertoires/{id}` - metadane udostępniania repertuaru
- Dodatkowe informacje w odpowiedzi (np. liczba wyświetleń, data wygaśnięcia linku)

