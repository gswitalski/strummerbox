# Plan implementacji widoku: Publiczny Widok Repertuaru

## 1. Przegląd
Celem tego widoku jest wyświetlenie publicznej, anonimowej wersji repertuaru. Widok jest przeznaczony dla "Biesiadników" (użytkowników niezalogowanych), którzy uzyskują do niego dostęp poprzez bezpośredni link lub kod QR. Strona ma być prosta, czytelna i zoptymalizowana pod kątem urządzeń mobilnych. Wyświetlać będzie nazwę i opis repertuaru oraz listę zawartych w nim piosenek, które będą linkami do widoków poszczególnych utworów.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką i zdefiniowany w głównym pliku routingu aplikacji:

-   **Ścieżka:** `/public/repertoires/:publicId`
-   **Przykład:** `/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c`

## 3. Struktura komponentów
Ze względu na prostotę widoku, zostanie on zaimplementowany jako pojedynczy, samodzielny komponent-strona (page component). Nie ma potrzeby tworzenia dodatkowych komponentów podrzędnych.

-   **`PublicRepertoirePageComponent` (Komponent-strona)**
    -   Odpowiedzialny za pobranie `publicId` z adresu URL.
    -   Zarządza komunikacją z API w celu pobrania danych repertuaru.
    -   Obsługuje stany ładowania i błędów.
    -   Renderuje informacje o repertuarze oraz listę piosenek.
    -   Ustawia metatagi (`title`, `robots`).

## 4. Szczegóły komponentów
### `PublicRepertoirePageComponent`
-   **Opis komponentu:**
    -   Główny komponent strony, implementowany jako samodzielny (standalone). Wyświetla szczegóły publicznego repertuaru. Jest to komponent "inteligentny" (smart), który zarządza własnym stanem i logiką pobierania danych.
-   **Główne elementy HTML i komponenty:**
    -   Główny kontener `div`.
    -   `mat-progress-bar` lub `mat-spinner` wyświetlany w stanie ładowania.
    -   Komponent do wyświetlania błędu (np. `mat-card` z komunikatem) w przypadku błędu API.
    -   Nagłówek `h1` na nazwę repertuaru (`repertoire.name`).
    -   Paragraf `p` na opis repertuaru (`repertoire.description`), jeśli istnieje.
    -   `<mat-list>` do wyświetlenia listy piosenek.
    -   `<mat-list-item>` wewnątrz pętli `@for` dla każdej piosenki.
    -   Tag `<a>` wewnątrz `<mat-list-item>`, którego atrybut `href` jest powiązany z `song.publicSongUrl`.
-   **Obsługiwane interakcje:**
    -   Kliknięcie w nazwę piosenki: powoduje przejście przeglądarki pod adres URL podany w `publicSongUrl` dla klikniętego utworu.
-   **Warunki walidacji:**
    -   Komponent sprawdza obecność parametru `:publicId` w ścieżce URL podczas inicjalizacji. W przypadku jego braku wyświetlany jest stan błędu.
-   **Typy (DTO i ViewModel):**
    -   `PublicRepertoireDto` - główny typ danych dla widoku, otrzymywany z API.
    -   `PublicRepertoireSongLinkDto` - typ dla pojedynczej piosenki na liście.
-   **Propsy (Inputs):**
    -   Komponent nie przyjmuje żadnych propsów. Dane `publicId` pobiera z `ActivatedRoute`.

## 5. Typy
Widok będzie korzystał z istniejących typów DTO zdefiniowanych w `packages/contracts/types.ts`. Nie ma potrzeby tworzenia nowych, niestandardowych typów ani modeli widoku (ViewModel).

-   **`PublicRepertoireDto`**:
    ```typescript
    export type PublicRepertoireDto = {
        name: string;
        description: string | null;
        songs: PublicRepertoireSongLinkDto[];
    };
    ```
-   **`PublicRepertoireSongLinkDto`**:
    ```typescript
    export type PublicRepertoireSongLinkDto = {
        title: string;
        publicSongUrl: string;
    };
    ```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie wewnątrz komponentu `PublicRepertoirePageComponent` przy użyciu Angular Signals, zgodnie z najlepszymi praktykami projektu.

-   **Sygnały (Signals):**
    -   `status = signal<'loading' | 'success' | 'error'>('loading')`: Przechowuje aktualny stan cyklu życia komponentu.
    -   `repertoire = signal<PublicRepertoireDto | undefined>(undefined)`: Przechowuje dane repertuaru po pomyślnym pobraniu z API.
    -   `error = signal<string | undefined>(undefined)`: Przechowuje komunikat błędu do wyświetlenia w interfejsie.

Logika będzie polegać na zmianie wartości sygnału `status` i wypełnianiu sygnałów `repertoire` lub `error` w zależności od wyniku wywołania API.

## 7. Integracja API
Komponent będzie integrował się z jednym punktem końcowym API.

-   **Endpoint:** `GET /public/repertoires/{publicId}`
-   **Serwis:** Zostanie utworzony (lub wykorzystany istniejący) serwis, np. `PublicDataService`, który będzie zawierał metodę `getPublicRepertoire(publicId: string): Observable<PublicRepertoireDto>`. Serwis ten będzie enkapsulował logikę `HttpClient`.
-   **Typ żądania:** Brak (dane przekazywane w URL).
-   **Typ odpowiedzi (sukces):** `PublicRepertoireDto`.
-   **Obsługa w komponencie:**
    -   Komponent zasubskrybuje metodę z serwisu.
    -   W przypadku sukcesu (HTTP 200), dane zostaną przypisane do sygnału `repertoire`, a `status` zmieni się na `'success'`.
    -   W przypadku błędu, odpowiedni komunikat zostanie przypisany do sygnału `error`, a `status` zmieni się na `'error'`.

## 8. Interakcje użytkownika
-   **Nawigacja do widoku:** Użytkownik trafia na stronę poprzez wpisanie adresu URL, kliknięcie linku lub zeskanowanie kodu QR.
-   **Przeglądanie listy:** Użytkownik może przewijać listę piosenek.
-   **Wybór piosenki:** Kliknięcie na dowolną piosenkę na liście powoduje natychmiastowe przejście do widoku tej piosenki (pełne przeładowanie strony pod nowy URL).

## 9. Warunki i walidacja
-   **Obecność `publicId`:** W `ngOnInit` komponent weryfikuje, czy `ActivatedRoute` zawiera parametr `publicId`. Jeśli nie, `status` jest ustawiany na `'error'` bez wysyłania zapytania do API.
-   **Odpowiedź API:** Stan interfejsu jest bezpośrednio zależny od odpowiedzi API. Nie ma walidacji po stronie frontendu poza obsługą stanu ładowania i możliwych błędów (`404`, `410`, błędy serwera).

## 10. Obsługa błędów
Komponent musi być przygotowany na obsługę następujących scenariuszy błędów:
-   **Brak `publicId` w URL:** Wyświetlenie generycznego komunikatu o błędzie.
-   **Repertuar nie znaleziony (HTTP 404):** Wyświetlenie komunikatu, np. "Nie znaleziono takiego repertuaru."
-   **Repertuar usunięty (HTTP 410):** Wyświetlenie komunikatu, np. "Ten repertuar nie jest już dostępny."
-   **Błąd serwera lub sieci:** Wyświetlenie ogólnego komunikatu, np. "Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później."
-   **SEO:** Komponent musi za pomocą serwisów `Title` i `Meta` ustawić tytuł strony oraz dodać tag `<meta name="robots" content="noindex, nofollow">`, aby zapobiec indeksowaniu przez wyszukiwarki.

## 11. Kroki implementacji
1.  **Utworzenie serwisu:** Stworzyć lub zaktualizować serwis (np. `PublicDataService`) o metodę `getPublicRepertoire(publicId: string)`.
2.  **Utworzenie komponentu:** Wygenerować nowy, samodzielny komponent `PublicRepertoirePageComponent` za pomocą Angular CLI w ścieżce `src/app/pages/public/public-repertoire-page/`.
3.  **Implementacja logiki:**
    -   Wstrzyknąć `ActivatedRoute`, `PublicDataService`, `Title` i `Meta`.
    -   Zdefiniować sygnały dla stanu: `status`, `repertoire`, `error`.
    -   W metodzie `ngOnInit` pobrać `publicId` z trasy.
    -   Dodać metatag `robots` za pomocą serwisu `Meta`.
    -   Zaimplementować logikę wywołania serwisu, subskrypcji i aktualizacji sygnałów w zależności od odpowiedzi (sukces/błąd).
4.  **Implementacja szablonu (HTML):**
    -   Dodać dyrektywy `@switch` lub `@if` do obsługi różnych stanów (`loading`, `success`, `error`).
    -   Dla stanu `success` zaimplementować wyświetlanie nazwy i opisu repertuaru.
    -   Użyć `@for` do iteracji po liście piosenek i wyrenderować `<mat-list>` z elementami `<a>`.
5.  **Implementacja stylów (SCSS):**
    -   Dodać style zapewniające czytelność i responsywność, zgodnie z podejściem "mobile-first". Użyć zmiennych z Angular Material dla spójności.
6.  **Aktualizacja routingu:**
    -   Dodać nową ścieżkę `/public/repertoires/:publicId` do głównego pliku konfiguracyjnego routingu, mapując ją na `PublicRepertoirePageComponent`.
7.  **Testowanie:**
    -   Przetestować ręcznie wszystkie scenariusze: pomyślne załadowanie, stan ładowania, błędy 404 i 410 oraz brak `publicId` w URL.
    -   Sprawdzić poprawność działania linków do piosenek.
    -   Zweryfikować obecność metatagu `robots` w źródle strony.
