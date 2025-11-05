# Plan Testów Jednostkowych dla `BiesiadaService`

## 1. Analiza Serwisu

### 1.1. Przeznaczenie

`BiesiadaService` jest serwisem front-endowym w aplikacji Angular, odpowiedzialnym za komunikację z backendowymi funkcjami Supabase w kontekście "Trybu Biesiada". Jego głównym zadaniem jest obsługa zautoryzowanych zapytań dla zalogowanego organizatora, obejmujących pobieranie listy jego repertuarów, listy piosenek w ramach konkretnego repertuaru oraz szczegółów pojedynczej piosenki.

### 1.2. Zależności

Serwis posiada dwie kluczowe zależności zewnętrzne, które muszą być zamockowane w testach jednostkowych:

-   `HttpClient`: Standardowy klient HTTP Angulara, używany do wysyłania żądań do Supabase Edge Functions.
-   `SupabaseService`: Serwis opakowujący klienta Supabase, wykorzystywany do pobierania aktywnej sesji użytkownika i jego tokenu autoryzacyjnego (`access_token`).

### 1.3. Publiczne API

Serwis udostępnia trzy publiczne metody, które stanowią jego API i będą głównym obiektem testów:

-   `getRepertoires(): Observable<BiesiadaRepertoireListResponseDto>`
-   `getRepertoireSongs(repertoireId: string): Observable<BiesiadaRepertoireSongListResponseDto>`
-   `getSongDetails(repertoireId: string, songId: string): Observable<BiesiadaRepertoireSongDetailDto>`

## 2. Strategia Testowania

Strategia opiera się na tworzeniu **izolowanych testów jednostkowych** z wykorzystaniem frameworka **Vitest**. Zgodnie z ogólnym planem testów, celem jest weryfikacja logiki biznesowej serwisu w oderwaniu od jego zależności.

-   **Mockowanie Zależności:** Obie zależności, `HttpClient` i `SupabaseService`, zostaną w całości zamockowane. Użyjemy `vi.mock()` do przechwytywania i kontrolowania ich zachowania, co pozwoli symulować różne scenariusze odpowiedzi API (sukces, błąd) oraz stany sesji użytkownika (aktywna, brak sesji).
-   **Testowanie API Publicznego:** Testy będą skupione na publicznych metodach serwisu. Prywatna metoda `getSession()` zostanie przetestowana niejawnie poprzez wywołania metod publicznych, które z niej korzystają.
-   **Struktura "Arrange-Act-Assert" (AAA):** Każdy test będzie miał czytelną strukturę, gdzie najpierw przygotowywane są warunki (Arrange), następnie wykonywana jest testowana operacja (Act), a na końcu sprawdzane są rezultaty (Assert).
-   **Pokrycie Scenariuszy:** Testy obejmą zarówno "happy path" (poprawne działanie), jak i scenariusze negatywne (błędy HTTP, brak sesji, nieoczekiwane formaty odpowiedzi).
-   **RxJS Marbles:** Ze względu na asynchroniczną naturę serwisu (zwracanie `Observable`), do asercji wyników strumieni zostaną wykorzystane standardowe mechanizmy subskrypcji wewnątrz testów.

## 3. Szczegółowy Plan Testów

### `describe('BiesiadaService', () => { ... })`

#### `describe('getRepertoires()', () => { ... })`

##### Test 1: Pozytywny - odpowiedź z polem `data`

-   **Nazwa:** `powinien pobrać listę repertuarów, gdy API zwraca odpowiedź w obiekcie { data: [...] }`
-   **Opis:** Weryfikuje, czy serwis poprawnie wywołuje endpoint, przekazuje token i mapuje odpowiedź z zagnieżdżonego pola `data`.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający `{ data: { session: { access_token: 'fake-token' } } }`.
    -   Mock `HttpClient.get()` zwracający `of({ data: mockRepertoires })`.
-   **Act:** Wywołanie `service.getRepertoires().subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy `HttpClient.get` został wywołany z prawidłowym URL-em (`.../me/biesiada/repertoires`).
    -   Sprawdzenie, czy `HttpClient.get` został wywołany z nagłówkiem `Authorization: Bearer fake-token`.
    -   Sprawdzenie, czy strumień wyemitował poprawną listę repertuarów (`mockRepertoires`).

##### Test 2: Pozytywny - odpowiedź bezpośrednia

-   **Nazwa:** `powinien pobrać listę repertuarów, gdy API zwraca dane bezpośrednio`
-   **Opis:** Weryfikuje, czy serwis poprawnie obsługuje alternatywny format odpowiedzi, gdzie dane nie są zagnieżdżone w polu `data`.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający sesję.
    -   Mock `HttpClient.get()` zwracający `of(mockRepertoires)`.
-   **Act:** Wywołanie `service.getRepertoires().subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy strumień wyemitował poprawną listę repertuarów (`mockRepertoires`).

##### Test 3: Błąd HTTP

-   **Nazwa:** `powinien propagować błąd, gdy żądanie HTTP zakończy się niepowodzeniem`
-   **Opis:** Sprawdza, czy błąd `HttpErrorResponse` z `HttpClient` jest poprawnie przechwytywany i rzucany dalej w strumieniu.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający sesję.
    -   Mock `HttpClient.get()` zwracający `throwError(() => new HttpErrorResponse({ status: 500 }))`.
-   **Act:** Wywołanie `service.getRepertoires().subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy strumień zakończył się błędem.
    -   Sprawdzenie, czy obiekt błędu jest instancją `HttpErrorResponse` ze statusem 500.

##### Test 4: Brak sesji użytkownika

-   **Nazwa:** `powinien rzucić błąd, gdy nie ma aktywnej sesji użytkownika`
-   **Opis:** Weryfikuje, czy metoda `getSession` poprawnie rzuca błąd w przypadku braku sesji, co przerywa wykonanie strumienia.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający `{ error: new Error('No session'), data: { session: null } }`.
-   **Act:** Wywołanie `service.getRepertoires().subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy strumień zakończył się błędem.
    -   Sprawdzenie, czy komunikat błędu to "Brak aktywnej sesji.".

---

#### `describe('getRepertoireSongs(repertoireId)', () => { ... })`

##### Test 1: Pozytywny

-   **Nazwa:** `powinien pobrać listę piosenek dla danego repertuaru`
-   **Opis:** Weryfikuje, czy serwis poprawnie buduje URL z `repertoireId`, wysyła żądanie i zwraca listę piosenek.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający sesję.
    -   `const repertoireId = 'uuid-rep-1';`
    -   Mock `HttpClient.get()` zwracający `of({ data: mockSongs })`.
-   **Act:** Wywołanie `service.getRepertoireSongs(repertoireId).subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy `HttpClient.get` został wywołany z URL-em zawierającym `repertoireId` (`.../repertoires/uuid-rep-1/songs`).
    -   Sprawdzenie, czy strumień wyemitował poprawną listę piosenek.

##### Test 2: Błąd HTTP

-   **Nazwa:** `powinien propagować błąd przy pobieraniu piosenek`
-   **Opis:** Analogiczny do testu błędu HTTP dla `getRepertoires`.
-   **Arrange, Act, Assert:** Analogicznie.

##### Test 3: Brak sesji

-   **Nazwa:** `powinien rzucić błąd przy braku sesji`
-   **Opis:** Analogiczny do testu braku sesji dla `getRepertoires`.
-   **Arrange, Act, Assert:** Analogicznie.

---

#### `describe('getSongDetails(repertoireId, songId)', () => { ... })`

##### Test 1: Pozytywny

-   **Nazwa:** `powinien pobrać szczegóły piosenki dla danego repertuaru i piosenki`
-   **Opis:** Weryfikuje, czy serwis poprawnie buduje URL z `repertoireId` i `songId` i zwraca szczegóły piosenki.
-   **Arrange:**
    -   Mock `SupabaseService.auth.getSession()` zwracający sesję.
    -   `const repertoireId = 'uuid-rep-1';`
    -   `const songId = 'uuid-song-1';`
    -   Mock `HttpClient.get()` zwracający `of({ data: mockSongDetails })`.
-   **Act:** Wywołanie `service.getSongDetails(repertoireId, songId).subscribe()`.
-   **Assert:**
    -   Sprawdzenie, czy `HttpClient.get` został wywołany z URL-em zawierającym `repertoireId` i `songId` (`.../repertoires/uuid-rep-1/songs/uuid-song-1`).
    -   Sprawdzenie, czy strumień wyemitował poprawne szczegóły piosenki.

##### Test 2: Błąd HTTP

-   **Nazwa:** `powinien propagować błąd przy pobieraniu szczegółów piosenki`
-   **Opis:** Analogiczny do poprzednich testów błędów HTTP.
-   **Arrange, Act, Assert:** Analogicznie.

##### Test 3: Brak sesji

-   **Nazwa:** `powinien rzucić błąd przy braku sesji`
-   **Opis:** Analogiczny do poprzednich testów braku sesji.
-   **Arrange, Act, Assert:** Analogicznie.

## 4. Konfiguracja Testowa

Plik testowy `biesiada.service.spec.ts` będzie wymagał następującej konfiguracji.

### 4.1. Importy

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { BiesiadaService } from './biesiada.service';
import { SupabaseService } from './supabase.service';
import type {
    BiesiadaRepertoireListResponseDto,
    BiesiadaRepertoireSongListResponseDto,
    BiesiadaRepertoireSongDetailDto,
} from '../../../../packages/contracts/types';
```

### 4.2. Mockowanie Zależności

Zależności zostaną zamockowane przy użyciu `TestBed` (dla spójności z ekosystemem Angulara) lub poprzez bezpośrednie mockowanie i dostarczenie do konstruktora, jeśli `TestBed` okaże się zbyt wolny.

```typescript
// Przygotowanie mocków
const mockHttpClient = {
    get: vi.fn(),
};

const mockSupabaseService = {
    auth: {
        getSession: vi.fn(),
    },
};

// Konfiguracja w bloku beforeEach
beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            BiesiadaService,
            { provide: HttpClient, useValue: mockHttpClient },
            { provide: SupabaseService, useValue: mockSupabaseService },
        ],
    });

    // Resetowanie mocków przed każdym testem
    vi.resetAllMocks();
});
```

### 4.3. Dane Testowe

Przykładowe dane testowe zostaną zdefiniowane, aby zapewnić spójność i czytelność testów.

```typescript
const mockSession = {
    data: { session: { access_token: 'fake-jwt-token' } },
    error: null,
};

const mockRepertoires: BiesiadaRepertoireListResponseDto = [
    { id: 'rep1', name: 'Repertuar 1', songCount: 10, publishedAt: new Date().toISOString() },
];

const mockSongs: BiesiadaRepertoireSongListResponseDto = {
    repertoireId: 'rep1',
    repertoireName: 'Repertuar 1',
    share: { publicUrl: 'url', qrPayload: 'qr' },
    songs: [{ songId: 'song1', title: 'Piosenka 1', position: 1 }],
};

const mockSongDetails: BiesiadaRepertoireSongDetailDto = {
    songId: 'song1',
    title: 'Piosenka 1',
    content: '[C]La la la',
    order: { position: 1, total: 1, previous: null, next: null },
    share: { publicUrl: 'url', qrPayload: 'qr' },
};
```

## 5. Przypadki Brzegowe

Oprócz głównych scenariuszy błędów (HTTP, brak sesji), plan uwzględnia następujące przypadki brzegowe:

-   **Pusta tablica jako odpowiedź:** Testy sprawdzą, czy serwis poprawnie obsługuje sytuację, gdy API zwraca `[]` (np. gdy organizator nie ma żadnych repertuarów). Oczekiwany rezultat to emisja pustej tablicy przez `Observable`.
-   **`null` lub `undefined` w odpowiedzi:** Testy zweryfikują, czy logika mapowania (`'data' in response`) jest odporna na `null` lub `undefined` jako odpowiedź z `HttpClient`.
-   **Nieprawidłowe argumenty:** Testy sprawdzą zachowanie serwisu przy przekazaniu `null`, `undefined` lub pustego stringa jako `repertoireId` lub `songId`. Serwis powinien po prostu użyć tych wartości do budowy URL, a błąd (np. 404) powinien zostać obsłużony przez standardową ścieżkę błędu HTTP.

## 6. Pokrycie Kodu (Code Coverage)

Celem jest osiągnięcie pokrycia kodu na poziomie **powyżej 90%**. Planowane testy zapewnią pokrycie następujących obszarów logiki serwisu:

-   **[Pokryte]** Wszystkie trzy publiczne metody.
-   **[Pokryte]** Logika `switchMap` do łączenia operacji asynchronicznych (sesja -> HTTP).
-   **[Pokryte]** Logika `map` do transformacji odpowiedzi API (obsługa formatu `{ data: ... }` oraz bezpośredniego).
-   **[Pokryte]** Logika `catchError` do obsługi błędów `HttpErrorResponse`.
-   **[Pokryte]** Wywołania `this.getSession()` i obsługa zarówno pomyślnego pobrania sesji, jak i błędu.
-   **[Pokryte]** Logika wewnątrz `getSession()`, w tym rzucanie błędu `Error('Brak aktywnej sesji.')`.
-   **[Pokryte]** Prawidłowe budowanie dynamicznych URL-i na podstawie przekazanych argumentów.
-   **[Pokryte]** Prawidłowe ustawianie nagłówka `Authorization`.
