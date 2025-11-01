# Dokumentacja testowania endpointa GET /me/biesiada/repertoires/{id}/songs/{songId}

## Przegląd

Endpoint zwraca szczegółowe informacje o konkretnej piosence w repertuarze dla trybu Biesiada, wraz z nawigacją (poprzednia/następna piosenka) i metadanymi do udostępniania.

## Informacje podstawowe

- **URL**: `/functions/v1/me/biesiada/repertoires/{id}/songs/{songId}`
- **Metoda**: `GET`
- **Autoryzacja**: Required (Bearer token w nagłówku Authorization)
- **Cache**: `private, max-age=30`

## Przykładowe requesty

### Request sukcesu (piosenka w środku listy)

```bash
curl -X GET 'http://localhost:54321/functions/v1/me/biesiada/repertoires/5f7a8f35-1cde-4f62-991e-0e020df3ac42/songs/58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

**Odpowiedź (200 OK):**
```json
{
  "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama, take this badge off of me\n[D]I can't use it anymore...",
  "order": {
    "position": 2,
    "total": 12,
    "previous": {
      "songId": "prev-song-uuid",
      "title": "Hej Sokoły"
    },
    "next": {
      "songId": "next-song-uuid",
      "title": "Wonderwall"
    }
  },
  "share": {
    "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
    "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
  }
}
```

### Request - pierwsza piosenka w repertuarze

Dla pierwszej piosenki `previous` będzie `null`:

```json
{
  "order": {
    "position": 1,
    "total": 12,
    "previous": null,
    "next": {
      "songId": "next-song-uuid",
      "title": "Knockin' on Heaven's Door"
    }
  }
}
```

### Request - ostatnia piosenka w repertuarze

Dla ostatniej piosenki `next` będzie `null`:

```json
{
  "order": {
    "position": 12,
    "total": 12,
    "previous": {
      "songId": "prev-song-uuid",
      "title": "Wonderwall"
    },
    "next": null
  }
}
```

### Request - jedyna piosenka w repertuarze

Jeśli repertuar ma tylko 1 piosenkę, oba pola będą `null`:

```json
{
  "order": {
    "position": 1,
    "total": 1,
    "previous": null,
    "next": null
  }
}
```

## Edge Cases i scenariusze błędów

### 1. Nieprawidłowy format UUID dla repertoireId

**Request:**
```bash
curl -X GET 'http://localhost:54321/functions/v1/me/biesiada/repertoires/invalid-uuid/songs/58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Odpowiedź (400 Bad Request):**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Nieprawidłowy format identyfikatora repertuaru",
    "details": {
      "repertoireId": "Must be a valid UUID"
    }
  }
}
```

### 2. Nieprawidłowy format UUID dla songId

**Request:**
```bash
curl -X GET 'http://localhost:54321/functions/v1/me/biesiada/repertoires/5f7a8f35-1cde-4f62-991e-0e020df3ac42/songs/not-a-uuid' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Odpowiedź (400 Bad Request):**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Nieprawidłowy format identyfikatora piosenki",
    "details": {
      "songId": "Must be a valid UUID"
    }
  }
}
```

### 3. Repertuar nie istnieje

**Odpowiedź (404 Not Found):**
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Nie znaleziono piosenki w repertuarze lub nie masz do niej uprawnień"
  }
}
```

### 4. Piosenka nie należy do repertuaru

Jeśli `songId` istnieje, ale nie jest w danym `repertoireId`:

**Odpowiedź (404 Not Found):**
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Nie znaleziono piosenki w repertuarze lub nie masz do niej uprawnień"
  }
}
```

### 5. Brak autoryzacji

**Request bez tokenu:**
```bash
curl -X GET 'http://localhost:54321/functions/v1/me/biesiada/repertoires/5f7a8f35-1cde-4f62-991e-0e020df3ac42/songs/58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5'
```

**Odpowiedź (401 Unauthorized):**
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Brak uwierzytelnienia"
  }
}
```

### 6. Dostęp do repertuaru innego użytkownika

Jeśli użytkownik próbuje uzyskać dostęp do repertuaru, który nie należy do niego:

**Odpowiedź (404 Not Found):**
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Nie znaleziono piosenki w repertuarze lub nie masz do niej uprawnień"
  }
}
```

> **Uwaga bezpieczeństwa**: Zwracamy 404 zamiast 403 aby nie ujawniać informacji o istnieniu zasobu.

### 7. Pusty repertuar (brak piosenek)

**Odpowiedź (404 Not Found):**
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Nie znaleziono piosenki w repertuarze lub nie masz do niej uprawnień"
  }
}
```

## Checklist testowania

- [ ] **Podstawowe scenariusze:**
  - [ ] Pobieranie piosenki ze środka listy (z previous i next)
  - [ ] Pobieranie pierwszej piosenki (previous = null)
  - [ ] Pobieranie ostatniej piosenki (next = null)
  - [ ] Pobieranie jedynej piosenki (previous i next = null)

- [ ] **Walidacja UUID:**
  - [ ] Nieprawidłowy format repertoireId
  - [ ] Nieprawidłowy format songId
  - [ ] Prawidłowe UUIDv4

- [ ] **Autoryzacja i dostęp:**
  - [ ] Brak tokenu JWT (401)
  - [ ] Token wygasły (401)
  - [ ] Dostęp do repertuaru innego użytkownika (404)
  - [ ] Dostęp do własnego repertuaru (200)

- [ ] **Błędne zasoby:**
  - [ ] Nieistniejący repertoireId (404)
  - [ ] Nieistniejący songId (404)
  - [ ] SongId nie należy do repertuaru (404)
  - [ ] Pusty repertuar bez piosenek (404)

- [ ] **Zawartość odpowiedzi:**
  - [ ] Pola `songId`, `title`, `content` są poprawnie wypełnione
  - [ ] Pole `order.position` odzwierciedla rzeczywistą pozycję
  - [ ] Pole `order.total` zgadza się z liczbą piosenek
  - [ ] Pola `previous` i `next` zawierają poprawne `songId` i `title`
  - [ ] `share.publicUrl` i `qrPayload` zawierają prawidłowy URL

- [ ] **Wydajność:**
  - [ ] Test z repertuarem o 10 piosenkach
  - [ ] Test z repertuarem o 50 piosenkach
  - [ ] Test z repertuarem o 100+ piosenkach
  - [ ] Czas odpowiedzi < 500ms dla typowych repertuarów

- [ ] **Cache:**
  - [ ] Nagłówek `Cache-Control: private, max-age=30` jest obecny
  - [ ] Content-Type to `application/json`

## Przykładowy skrypt testowy (Deno)

```typescript
const BASE_URL = 'http://localhost:54321/functions/v1';
const JWT_TOKEN = 'YOUR_JWT_TOKEN';

async function testGetBiesiadaSongDetail(repertoireId: string, songId: string) {
    const response = await fetch(
        `${BASE_URL}/me/biesiada/repertoires/${repertoireId}/songs/${songId}`,
        {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    );

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    const data = await response.json();
    console.log('Body:', JSON.stringify(data, null, 2));

    return { status: response.status, data };
}

// Test sukcesu
await testGetBiesiadaSongDetail(
    '5f7a8f35-1cde-4f62-991e-0e020df3ac42',
    '58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5'
);

// Test nieprawidłowego UUID
await testGetBiesiadaSongDetail(
    'invalid-uuid',
    '58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5'
);
```

## Integracja z frontendem

### Angular Service Example

```typescript
export interface BiesiadaSongDetailResponse {
  songId: string;
  title: string;
  content: string;
  order: {
    position: number;
    total: number;
    previous: { songId: string; title: string } | null;
    next: { songId: string; title: string } | null;
  };
  share: {
    publicUrl: string;
    qrPayload: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BiesiadaService {
  private readonly apiUrl = environment.supabaseUrl;

  constructor(private http: HttpClient) {}

  getBiesiadaSongDetail(
    repertoireId: string,
    songId: string
  ): Observable<BiesiadaSongDetailResponse> {
    return this.http.get<BiesiadaSongDetailResponse>(
      `${this.apiUrl}/functions/v1/me/biesiada/repertoires/${repertoireId}/songs/${songId}`
    );
  }
}
```

## Uwagi końcowe

1. **RLS (Row Level Security)**: Endpoint polega na politykach RLS na poziomie bazy danych. Upewnij się, że polityki `repertoires_owner_full_access` i `repertoire_songs_owner_full_access` są aktywne.

2. **Zmienne środowiskowe**: Endpoint wymaga zmiennej `APP_PUBLIC_URL` do generowania linków publicznych.

3. **Sortowanie**: Piosenki są sortowane według kolumny `position` w tabeli `repertoire_songs`.

4. **Bezpieczeństwo**: Wszystkie błędy dostępu zwracają 404 aby nie ujawniać struktury danych nieautoryzowanym użytkownikom.

