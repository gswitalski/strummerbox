# Repertoires Edge Function

## Endpoint: POST /repertoires

Tworzy nowy repertuar z opcjonalnym zestawem początkowych piosenek.

### Uwierzytelnianie
Wymaga nagłówka `Authorization: Bearer <JWT_TOKEN>`

### Request Body

```json
{
  "name": "string (1-160 znaków, wymagane)",
  "description": "string (opcjonalnie)",
  "songIds": ["uuid", "..."] (opcjonalnie, max 100 elementów)
}
```

### Response

**Status:** `201 Created`

```json
{
  "id": "uuid",
  "publicId": "uuid",
  "name": "string",
  "description": "string | null",
  "publishedAt": "string (ISO 8601) | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "songCount": "number",
  "songs": [
    {
      "repertoireSongId": "uuid",
      "songId": "uuid",
      "title": "string",
      "position": "number",
      "content": null
    }
  ]
}
```

### Kody błędów

| Status | Kod błędu | Opis |
|--------|-----------|------|
| 400 | `validation_error` | Nieprawidłowe dane wejściowe lub nieprawidłowe songIds |
| 401 | `unauthorized` | Brak lub nieprawidłowy token JWT |
| 409 | `conflict` | Repertuar o podanej nazwie już istnieje |
| 500 | `internal_error` | Błąd serwera |

---

## Przykłady użycia

### 1. Utworzenie repertuaru bez piosenek

**Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/repertoires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Wieczór przy ognisku",
    "description": "Klasyczne piosenki biesiadne"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "publicId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Wieczór przy ognisku",
  "description": "Klasyczne piosenki biesiadne",
  "publishedAt": null,
  "createdAt": "2025-10-22T10:30:00.000Z",
  "updatedAt": "2025-10-22T10:30:00.000Z",
  "songCount": 0,
  "songs": []
}
```

---

### 2. Utworzenie repertuaru z piosenkami

**Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/repertoires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Urodziny Janka",
    "description": "Repertuar na imprezę urodzinową",
    "songIds": [
      "770e8400-e29b-41d4-a716-446655440010",
      "770e8400-e29b-41d4-a716-446655440011",
      "770e8400-e29b-41d4-a716-446655440012"
    ]
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "publicId": "660e8400-e29b-41d4-a716-446655440003",
  "name": "Urodziny Janka",
  "description": "Repertuar na imprezę urodzinową",
  "publishedAt": null,
  "createdAt": "2025-10-22T10:35:00.000Z",
  "updatedAt": "2025-10-22T10:35:00.000Z",
  "songCount": 3,
  "songs": [
    {
      "repertoireSongId": "880e8400-e29b-41d4-a716-446655440020",
      "songId": "770e8400-e29b-41d4-a716-446655440010",
      "title": "Panie Janie",
      "position": 1,
      "content": null
    },
    {
      "repertoireSongId": "880e8400-e29b-41d4-a716-446655440021",
      "songId": "770e8400-e29b-41d4-a716-446655440011",
      "title": "Sto lat",
      "position": 2,
      "content": null
    },
    {
      "repertoireSongId": "880e8400-e29b-41d4-a716-446655440022",
      "songId": "770e8400-e29b-41d4-a716-446655440012",
      "title": "Szła dzieweczka",
      "position": 3,
      "content": null
    }
  ]
}
```

---

### 3. Błąd walidacji - nazwa za długa

**Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/repertoires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "description": "Test"
  }'
```

**Response (400):**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Nieprawidłowe dane wejściowe",
    "details": {
      "name": {
        "_errors": ["Nazwa może mieć maksymalnie 160 znaków"]
      }
    }
  }
}
```

---

### 4. Błąd - nieprawidłowe songIds

**Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/repertoires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test repertuar",
    "songIds": [
      "770e8400-e29b-41d4-a716-446655440010",
      "999e8400-e29b-41d4-a716-446655999999"
    ]
  }'
```

**Response (400):**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Jedna lub więcej piosenek nie istnieje lub nie należy do użytkownika",
    "details": {
      "invalidSongIds": ["999e8400-e29b-41d4-a716-446655999999"]
    }
  }
}
```

---

### 5. Błąd - konflikt nazwy

**Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/repertoires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Wieczór przy ognisku"
  }'
```

**Response (409):**
```json
{
  "error": {
    "code": "conflict",
    "message": "Repertuar o podanej nazwie już istnieje",
    "details": {
      "name": "Wieczór przy ognisku"
    }
  }
}
```

---

## Scenariusze testowe

### Test 1: Podstawowe utworzenie repertuaru
- **Input:** Nazwa i opis
- **Oczekiwane:** 201, repertuar utworzony bez piosenek

### Test 2: Utworzenie z piosenkami
- **Input:** Nazwa + 3 songIds
- **Oczekiwane:** 201, repertuar z 3 piosenkami w prawidłowej kolejności

### Test 3: Duplikaty w songIds
- **Input:** songIds = [id1, id2, id1]
- **Oczekiwane:** 201, tylko 2 piosenki (duplikat usunięty)

### Test 4: Pusta tablica songIds
- **Input:** songIds = []
- **Oczekiwane:** 201, repertuar bez piosenek

### Test 5: Walidacja nazwy
- **Input:** Nazwa pusta lub > 160 znaków
- **Oczekiwane:** 400 validation_error

### Test 6: Nieprawidłowe UUID
- **Input:** songIds = ["not-a-uuid"]
- **Oczekiwane:** 400 validation_error

### Test 7: Nieistniejące piosenki
- **Input:** songIds z UUID, które nie istnieją
- **Oczekiwane:** 400 validation_error z listą invalid IDs

### Test 8: Piosenki innego użytkownika
- **Input:** songIds należące do innego organizatora
- **Oczekiwane:** 400 validation_error

### Test 9: Konflikt nazwy
- **Input:** Nazwa już istniejącego repertuaru
- **Oczekiwane:** 409 conflict

### Test 10: Zbyt wiele piosenek
- **Input:** songIds z 101 elementami
- **Oczekiwane:** 400 validation_error

### Test 11: Brak autoryzacji
- **Input:** Brak nagłówka Authorization
- **Oczekiwane:** 401 unauthorized

### Test 12: Nieprawidłowy JSON
- **Input:** Źle sformatowany JSON
- **Oczekiwane:** 400 validation_error

---

## Uruchamianie lokalnie

```bash
# Uruchomienie funkcji
supabase functions serve repertoires

# Endpoint dostępny pod:
# http://localhost:54321/functions/v1/repertoires
```

---

## Implementacja

### Struktura plików
```
repertoires/
├── index.ts                   # Router główny
├── repertoires.handlers.ts    # Handlery HTTP i walidacja
├── repertoires.service.ts     # Logika biznesowa
└── README.md                  # Ta dokumentacja
```

### Przepływ danych
1. Request → `index.ts` (auth + routing)
2. Router → `repertoires.handlers.ts` (walidacja Zod)
3. Handler → `repertoires.service.ts` (logika biznesowa)
4. Serwis → Supabase (operacje DB)
5. Response ← (mapowanie DTO i zwrot)

### Bezpieczeństwo
- ✅ Uwierzytelnienie JWT wymagane
- ✅ Weryfikacja własności piosenek
- ✅ Walidacja wszystkich danych wejściowych
- ✅ Ochrona przed SQL injection (Supabase client)
- ✅ Limity: max 100 piosenek na request
- ✅ Automatyczne usuwanie duplikatów

### Optymalizacje
- ✅ Content piosenek nie jest zwracany (wydajność)
- ✅ Pojedyncze zapytanie dla walidacji piosenek
- ✅ Batch insert dla repertoire_songs
- ✅ Deduplikacja songIds

