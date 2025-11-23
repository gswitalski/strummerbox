# Plan Testów Jednostkowych dla `ShareService`

Ten dokument przedstawia szczegółowy plan implementacji testów jednostkowych dla serwisu `ShareService` w aplikacji StrummerBox, zgodnie z wytycznymi zawartymi w głównym planie testów oraz najlepszymi praktykami dla Vitest.

## 1. Analiza Serwisu

`ShareService` jest odpowiedzialny za komunikację z backendem (Supabase Edge Functions) w celu pobrania metadanych niezbędnych do udostępniania piosenek i repertuarów.

**Kluczowe zależności:**

*   `HttpClient`: Do wykonywania żądań HTTP do funkcji backendowych.
*   `SupabaseService`: Do pobierania aktywnej sesji użytkownika i tokenu autoryzacyjnego.

**Kluczowe metody publiczne:**

*   `getSongShareMeta(songId: string)`: Pobiera metadane dla udostępnienia konkretnej piosenki.
*   `getRepertoireShareMeta(repertoireId: string)`: Pobiera metadane dla udostępnienia konkretnego repertuaru.

**Kluczowe metody prywatne:**

*   `getSession()`: Asynchronicznie pobiera dane sesji z `SupabaseService` i zwraca je lub rzuca błąd w przypadku braku sesji.

## 2. Strategia Testowania

Strategia opiera się na tworzeniu **testów jednostkowych** w izolacji od zewnętrznych zależności. Oznacza to, że `HttpClient` i `SupabaseService` zostaną w pełni zamockowane. Testy będą weryfikować logikę serwisu, w tym:

*   Poprawne wywoływanie `getSession` na początku każdej operacji.
*   Konstruowanie i wysyłanie prawidłowych żądań HTTP z odpowiednimi nagłówkami autoryzacyjnymi.
*   Obsługę różnych formatów odpowiedzi z API (bezpośrednio w ciele odpowiedzi lub w obiekcie `{ data: ... }`).
*   Prawidłową obsługę błędów, zarówno tych pochodzących z `SupabaseService` (brak sesji), jak i z `HttpClient` (błędy sieciowe, statusy HTTP).

Testy zostaną napisane w języku polskim, z użyciem składni `describe` i `it`, aby zapewnić wysoką czytelność i zgodność z praktykami BDD.

## 3. Szczegółowy Plan Testów

### `describe('ShareService', ...)`

#### `describe('getSongShareMeta', ...)`

---

**1. Nazwa testu:** `powinien pobrać metadane piosenki i zmapować odpowiedź bez obiektu 'data'`

*   **Opis:** Test weryfikuje "szczęśliwą ścieżkę" - czy serwis poprawnie pobiera sesję, wykonuje żądanie GET i zwraca dane, gdy API zwraca je bezpośrednio w ciele odpowiedzi.
*   **Kroki testowe (Arrange, Act, Assert):**
    1.  **Arrange:**
        *   Zamockuj `SupabaseService`, aby `getSession()` zwracało poprawną sesję z `access_token`.
        *   Zamockuj `HttpClient`, aby na żądanie `GET` pod odpowiedni URL (`/share/songs/{songId}`) zwracał `Observable` z oczekiwanymi metadanymi piosenki (`SongShareMetaDto`).
        *   Stwórz instancję `ShareService` z zamockowanymi zależnościami.
    2.  **Act:** Wywołaj metodę `service.getSongShareMeta('test-song-id')` i zasubskrybuj wynik.
    3.  **Assert:**
        *   Sprawdź, czy `getSession()` zostało wywołane.
        *   Sprawdź, czy `http.get()` zostało wywołane z prawidłowym URL-em i nagłówkiem `Authorization`.
        *   Sprawdź, czy otrzymane dane są zgodne z tymi, które zwrócił zamockowany `HttpClient`.
*   **Wymagane mocki/stuby:** `SupabaseService`, `HttpClient`.
*   **Oczekiwane rezultaty:** Metoda zwraca `Observable`, który emituje obiekt `SongShareMetaDto`.

---

**2. Nazwa testu:** `powinien pobrać metadane piosenki i zmapować odpowiedź z obiektu 'data'`

*   **Opis:** Test sprawdza, czy serwis prawidłowo obsługuje odpowiedź API, w której dane są zagnieżdżone w obiekcie `{ data: ... }`.
*   **Kroki testowe (Arrange, Act, Assert):**
    1.  **Arrange:**
        *   Zamockuj `SupabaseService` jak w teście nr 1.
        *   Zamockuj `HttpClient`, aby na żądanie `GET` zwracał `Observable` z obiektem `{ data: SongShareMetaDto }`.
    2.  **Act:** Wywołaj `service.getSongShareMeta('test-song-id')`.
    3.  **Assert:** Sprawdź, czy otrzymane dane są obiektem `SongShareMetaDto` wyodrębnionym z pola `data`.
*   **Wymagane mocki/stuby:** `SupabaseService`, `HttpClient`.
*   **Oczekiwane rezultaty:** Metoda zwraca `Observable`, który emituje obiekt `SongShareMetaDto`.

---

**3. Nazwa testu:** `powinien zwrócić błąd, gdy pobieranie sesji się nie powiedzie`

*   **Opis:** Testuje obsługę błędów w przypadku, gdy nie można pobrać sesji użytkownika.
*   **Kroki testowe (Arrange, Act, Assert):**
    1.  **Arrange:** Zamockuj `SupabaseService`, aby `getSession()` rzucało błąd (`throw new Error('Brak aktywnej sesji.')`).
    2.  **Act:** Wywołaj `service.getSongShareMeta('test-song-id')`.
    3.  **Assert:**
        *   Sprawdź, czy `http.get()` **nie zostało** wywołane.
        *   Sprawdź, czy `Observable` zwrócony przez metodę emituje błąd (w bloku `error` subskrypcji).
        *   Sprawdź, czy treść błędu jest zgodna z tym, co zostało rzucone przez mock `getSession()`.
*   **Wymagane mocki/stuby:** `SupabaseService`.
*   **Oczekiwane rezultaty:** Metoda zwraca `Observable`, który kończy się błędem.

---

**4. Nazwa testu:** `powinien zwrócić błąd HTTP, gdy żądanie API się nie powiedzie`

*   **Opis:** Testuje scenariusz, w którym API zwraca błąd HTTP (np. 404, 500).
*   **Kroki testowe (Arrange, Act, Assert):**
    1.  **Arrange:**
        *   Zamockuj `SupabaseService` jak w teście nr 1.
        *   Zamockuj `HttpClient`, aby na żądanie `GET` zwracał błąd (`throwError(() => new HttpErrorResponse({ status: 500 }))`).
    2.  **Act:** Wywołaj `service.getSongShareMeta('test-song-id')`.
    3.  **Assert:**
        *   Sprawdź, czy `Observable` zwrócony przez metodę emituje błąd.
        *   Sprawdź, czy obiekt błędu jest instancją `HttpErrorResponse` i ma poprawny status.
*   **Wymagane mocki/stuby:** `SupabaseService`, `HttpClient`.
*   **Oczekiwane rezultaty:** Metoda zwraca `Observable`, który kończy się błędem `HttpErrorResponse`.

---

#### `describe('getRepertoireShareMeta', ...)`

Testy dla tej metody będą analogiczne do `getSongShareMeta`.

1.  **Nazwa testu:** `powinien pobrać metadane repertuaru i zmapować odpowiedź bez obiektu 'data'`
2.  **Nazwa testu:** `powinien pobrać metadane repertuaru i zmapować odpowiedź z obiektu 'data'`
3.  **Nazwa testu:** `powinien zwrócić błąd, gdy pobieranie sesji się nie powiedzie`
4.  **Nazwa testu:** `powinien zwrócić błąd HTTP, gdy żądanie API się nie powiedzie`

*   **Opis, Kroki, Mocki, Rezultaty:** Analogiczne do odpowiednich testów dla `getSongShareMeta`, ale z użyciem `getRepertoireShareMeta` i danych `RepertoireShareMetaDto`.

## 4. Konfiguracja Testowa

Plik testowy `share.service.spec.ts` będzie wymagał następującej konfiguracji.

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ShareService } from './share.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

// Mock dla SupabaseService
const supabaseServiceMock = {
    auth: {
        getSession: vi.fn(),
    },
};

describe('ShareService', () => {
    let service: ShareService;
    let httpTestingController: HttpTestingController;
    let supabaseService: SupabaseService;

    const baseUrl = `${environment.supabase.url}/functions/v1`;
    const mockSession = {
        access_token: 'mock-access-token',
        // ... inne właściwości sesji
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ShareService,
                { provide: SupabaseService, useValue: supabaseServiceMock },
            ],
        });

        service = TestBed.inject(ShareService);
        httpTestingController = TestBed.inject(HttpTestingController);
        supabaseService = TestBed.inject(SupabaseService);

        // Resetowanie mocków przed każdym testem
        vi.resetAllMocks();
    });

    afterEach(() => {
        // Weryfikacja, czy nie ma żadnych oczekujących żądań HTTP
        httpTestingController.verify();
    });

    // ... testy it(...)
});
```

## 5. Przypadki Brzegowe

Oprócz głównych ścieżek, plan uwzględnia następujące przypadki brzegowe:

*   **Brak sesji:** Testowane przez rzucenie błędu z `getSession()`.
*   **Błąd sieciowy/API:** Testowane przez zwrócenie `HttpErrorResponse` z `HttpClient`.
*   **Różne formaty odpowiedzi API:** Testowane przez dwa oddzielne testy dla każdego formatu (bezpośredni i zagnieżdżony w `data`).
*   **Puste `songId` / `repertoireId`:** Logika serwisu nie waliduje ID (odpowiedzialność komponentu/formularza), więc testy skupią się na przekazaniu tego ID do `HttpClient`, zakładając, że jest ono poprawne.

## 6. Pokrycie Kodu

Przedstawiony plan testów ma na celu osiągnięcie **100% pokrycia kodu** dla serwisu `ShareService`. Testy pokryją:

*   **`getSongShareMeta`:** Wszystkie ścieżki w potoku RxJS (`from`, `switchMap`, `map`, `catchError`).
*   **`getRepertoireShareMeta`:** Wszystkie ścieżki w potoku RxJS.
*   **`getSession`:** Obie ścieżki warunkowe (`if (error || !data.session)` i pomyślne zwrócenie sesji). Ponieważ jest to metoda prywatna, jej pokrycie zostanie zweryfikowane pośrednio przez testy metod publicznych.
