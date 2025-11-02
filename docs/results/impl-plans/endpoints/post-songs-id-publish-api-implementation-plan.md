# API Endpoint Implementation Plan: POST /songs/{id}/publish

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu organizatorowi opublikowanie jednej ze swoich piosenek. Opublikowanie piosenki czyni ją potencjalnie dostępną publicznie (w zależności od polityk dostępu). Operacja jest idempotentna - wielokrotne wywołanie dla już opublikowanej piosenki nie zmienia jej stanu.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/songs/{id}/publish`
- **Parametry:**
  - **Wymagane:**
    - `id` (w ścieżce): UUID piosenki, która ma zostać opublikowana.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- **DTO Odpowiedzi:** `SongDto` - pełny obiekt piosenki, zawierający wszystkie jej dane, w tym zaktualizowaną datę publikacji.

```typescript:packages/contracts/types.ts
export type SongDto = {
    id: SongRow['id'];
    publicId: SongRow['public_id'];
    title: SongRow['title'];
    publishedAt: SongRow['published_at'];
    createdAt: SongRow['created_at'];
    updatedAt: SongRow['updated_at'];
    content: SongRow['content'];
};
```

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - **Kod stanu:** `200 OK`
  - **Ciało odpowiedzi:** Obiekt JSON typu `SongDto` zaktualizowanej piosenki. Pole `publishedAt` będzie zawierało znacznik czasu publikacji.
- **Błędy:**
  - **Kod stanu:** `400 Bad Request` - jeśli `id` w URL nie jest prawidłowym UUID.
  - **Kod stanu:** `401 Unauthorized` - jeśli żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
  - **Kod stanu:** `404 Not Found` - jeśli piosenka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - **Kod stanu:** `500 Internal Server Error` - w przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych
1.  Żądanie `POST` trafia do Supabase Edge Function `songs`.
2.  Router w `index.ts` identyfikuje ścieżkę `/{id}/publish` i metodę `POST`, a następnie przekierowuje żądanie do odpowiedniego handlera w `songs.handlers.ts`.
3.  Handler weryfikuje, czy użytkownik jest uwierzytelniony.
4.  Handler waliduje format parametru `id` ze ścieżki (musi być to UUID).
5.  Handler wywołuje funkcję `publishSong(songId, organizerId)` z pliku `songs.service.ts`, przekazując `id` piosenki oraz `id` uwierzytelnionego użytkownika.
6.  Funkcja serwisowa wykonuje operację `UPDATE` na tabeli `songs`, ustawiając `published_at = timezone('utc', now())` z klauzulą `WHERE id = :songId AND organizer_id = :organizerId`.
7.  Jeśli operacja `UPDATE` nie zmodyfikowała żadnego wiersza (co oznacza brak dopasowania), serwis rzuca błąd `ApplicationError` z kodem `resource_not_found`.
8.  W przypadku sukcesu, serwis pobiera zaktualizowany wiersz piosenki z bazy danych.
9.  Serwis mapuje wynik z bazy danych na `SongDto` i zwraca go do handlera.
10. Handler otrzymuje DTO, ustawia kod odpowiedzi na `200 OK` i wysyła odpowiedź do klienta.
11. W przypadku błędu (np. `ApplicationError` z serwisu), handler przechwytuje go, mapuje na odpowiedni kod statusu HTTP (np. 404) i zwraca standardowy format błędu.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy nagłówek `Authorization: Bearer <SUPABASE_JWT>`, który będzie weryfikowany przez Supabase.
- **Autoryzacja:** Dostęp do tego endpointu jest ograniczony do właściciela piosenki. Zabezpieczenie jest realizowane na dwóch poziomach:
    1.  **Poziom aplikacji:** Klauzula `WHERE organizer_id = :userId` w zapytaniu `UPDATE` w funkcji serwisowej.
    2.  **Poziom bazy danych:** Polityka Row Level Security (RLS) `songs_owner_full_access` na tabeli `songs` zapewnia, że operacje zapisu mogą być wykonywane tylko przez właściciela rekordu.
- **Walidacja wejścia:** Parametr `id` musi być walidowany jako UUID, aby zapobiec potencjalnym atakom (np. SQL Injection, chociaż Supabase client parametryzuje zapytania).

## 7. Rozważania dotyczące wydajności
- Operacja `UPDATE` na pojedynczym wierszu jest bardzo wydajna, ponieważ `id` jest kluczem głównym, a `organizer_id` jest zindeksowany.
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego.

## 8. Etapy wdrożenia
1.  **Modyfikacja routera:** W `supabase/functions/songs/index.ts` dodać nową obsługę dla ścieżki pasującej do `/\/songs\/([^/]+)\/publish$/` i metody `POST`.
2.  **Implementacja handlera:** W `supabase/functions/songs/songs.handlers.ts` stworzyć nową funkcję `handlePublishSong(req, songId)`. Funkcja ta będzie odpowiedzialna za:
    -   Walidację `songId` jako UUID.
    -   Pobranie ID użytkownika z `req.user`.
    -   Wywołanie serwisu `publishSong`.
    -   Obsługę sukcesu (zwrócenie `200 OK` z `SongDto`) i błędów.
3.  **Implementacja serwisu:** W `supabase/functions/songs/songs.service.ts` stworzyć nową funkcję `publishSong(songId, organizerId)`. Funkcja ta będzie odpowiedzialna za:
    -   Wykonanie zapytania `UPDATE songs SET published_at = NOW() WHERE id = ... AND organizer_id = ...`.
    -   Sprawdzenie, czy wiersz został zaktualizowany. Jeśli nie, rzucenie błędu `ApplicationError('resource_not_found')`.
    -   Pobranie i zwrócenie pełnego, zaktualizowanego obiektu piosenki.

