# Repertoires Edge Function

Funkcja Supabase Edge obsługująca operacje na repertuarach.

## Endpointy

### GET /repertoires

Pobiera paginowaną listę repertuarów użytkownika z opcjonalnymi filtrami.

**Uwierzytelnianie:** Wymagane (JWT token)

**Query Parameters:**

| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `page` | number | 1 | Numer strony (min: 1) |
| `pageSize` | number | 10 | Liczba wyników na stronę (min: 1, max: 100) |
| `search` | string | - | Fraza do wyszukiwania w nazwach repertuarów (case-insensitive) |
| `published` | boolean | - | Filtr statusu publikacji. `true` = tylko opublikowane, `false` = tylko nieopublikowane, pominięty = wszystkie |
| `sort` | string | `-createdAt` | Klucz sortowania: `name`, `createdAt`, `updatedAt`, `publishedAt`. Prefiks `-` dla malejącego (np. `-createdAt`) |
| `includeCounts` | boolean | false | Czy dołączyć liczbę piosenek dla każdego repertuaru |

**Przykłady:**

```bash
# Podstawowe pobranie listy (pierwsza strona, 10 wyników)
GET /repertoires

# Z paginacją
GET /repertoires?page=2&pageSize=20

# Wyszukiwanie
GET /repertoires?search=kolędy

# Filtrowanie tylko opublikowanych
GET /repertoires?published=true

# Sortowanie po nazwie rosnąco
GET /repertoires?sort=name

# Sortowanie po dacie utworzenia malejąco
GET /repertoires?sort=-createdAt

# Z licznikami piosenek
GET /repertoires?includeCounts=true

# Kombinacja parametrów
GET /repertoires?search=kolędy&published=true&sort=name&pageSize=25&includeCounts=true
```

**Odpowiedź 200 OK:**

```json
{
    "items": [
        {
            "id": "uuid",
            "publicId": "uuid",
            "name": "Mój repertuar",
            "description": "Opis repertuaru",
            "publishedAt": "2024-01-15T10:30:00Z",
            "createdAt": "2024-01-10T08:00:00Z",
            "updatedAt": "2024-01-15T10:30:00Z",
            "songCount": 15
        }
    ],
    "page": 1,
    "pageSize": 10,
    "total": 42
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowe parametry query (np. `pageSize > 100`, nieprawidłowy `sort`)
- `401 Unauthorized` - Brak lub nieprawidłowy token JWT
- `500 Internal Server Error` - Błąd serwera lub bazy danych

---

### POST /repertoires

Tworzy nowy repertuar z opcjonalnym zestawem początkowych piosenek.

**Uwierzytelnianie:** Wymagane (JWT token)

**Request Body:**

```json
{
    "name": "Nazwa repertuaru (wymagane, 1-160 znaków)",
    "description": "Opcjonalny opis",
    "songIds": ["uuid1", "uuid2"]
}
```

**Odpowiedź 201 Created:**

```json
{
    "id": "uuid",
    "publicId": "uuid",
    "name": "Nazwa repertuaru",
    "description": "Opis",
    "publishedAt": null,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-10T08:00:00Z",
    "songCount": 2,
    "songs": [
        {
            "repertoireSongId": "uuid",
            "songId": "uuid1",
            "title": "Tytuł piosenki",
            "position": 1,
            "content": null
        }
    ]
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowe dane (np. brak nazwy, nieprawidłowe UUID w songIds)
- `401 Unauthorized` - Brak lub nieprawidłowy token JWT
- `409 Conflict` - Repertuar o podanej nazwie już istnieje dla tego użytkownika
- `500 Internal Server Error` - Błąd serwera lub bazy danych

---

## Implementacja

### Architektura

```
repertoires/
├── index.ts                    # Main router - obsługa żądań i błędów
├── repertoires.handlers.ts     # Handlery dla poszczególnych endpointów
├── repertoires.service.ts      # Logika biznesowa i operacje na danych
└── README.md                   # Ta dokumentacja
```

### Edge Cases

#### GET /repertoires

1. **Pusta lista**: Gdy użytkownik nie ma repertuarów, zwracane jest `{ items: [], total: 0 }`
2. **Brak wyników dla wyszukiwania**: Zwraca pustą listę z `total: 0`
3. **Strona poza zakresem**: Gdy `page` przekracza dostępne strony, zwraca pustą listę
4. **Nieprawidłowy sort key**: Zwraca błąd walidacji 400 z komunikatem o dozwolonych wartościach
5. **includeCounts z błędem**: Jeśli zliczanie piosenek nie powiedzie się, `songCount` nie jest dodawany
6. **Wyszukiwanie case-insensitive**: Operator `ilike` zapewnia wyszukiwanie bez względu na wielkość liter
7. **Parametr published**: Obsługuje wartości `true`, `false` oraz brak parametru (wszystkie repertuary)

#### POST /repertoires

1. **Duplikaty songIds**: Automatycznie usuwane z zachowaniem kolejności
2. **Nieprawidłowe songIds**: Zwraca błąd 400 z listą nieprawidłowych ID
3. **Pusta tablica songIds**: Akceptowane, tworzy repertuar bez piosenek
4. **Konflikt nazwy**: Zwraca 409 gdy repertuar o tej nazwie już istnieje

### Bezpieczeństwo

- **Uwierzytelnianie**: Wszystkie endpointy wymagają ważnego JWT tokena
- **Autoryzacja**: Wszystkie zapytania filtrowane po `organizer_id` z tokena
- **Walidacja**: Rygorystyczna walidacja wszystkich parametrów wejściowych za pomocą Zod
- **Rate limiting**: Parametr `pageSize` ograniczony do max 100

### Performance

- **Indeksy**: Zalecane indeksy na `organizer_id`, `name`, `created_at`, `updated_at`, `published_at`
- **Paginacja**: Zawsze wymuszana przez `pageSize` (max 100)
- **Selective columns**: Tylko niezbędne kolumny są pobierane z bazy
- **Zliczanie piosenek**: Opcjonalne (włączane przez `includeCounts`), wykonywane pojedynczym zapytaniem
- **Total count**: Pobierany w tym samym zapytaniu co dane (`count: 'exact'`)

### Testing

Przykłady testowania lokalnie (z `supabase functions serve repertoires`):

```bash
# Pobierz listę (wymagany token)
curl -X GET "http://localhost:54321/functions/v1/repertoires?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Z wyszukiwaniem
curl -X GET "http://localhost:54321/functions/v1/repertoires?search=kolędy&includeCounts=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Utwórz nowy
curl -X POST "http://localhost:54321/functions/v1/repertoires" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mój nowy repertuar", "description": "Testowy opis"}'
```
