# Plan implementacji widoku: Publiczny Widok Piosenki w Repertuarze

## 1. Przegląd

Celem tego widoku jest wyświetlenie anonimowemu użytkownikowi (Biesiadnikowi) treści konkretnej piosenki, która jest częścią udostępnionego repertuaru. Widok musi być minimalistyczny, zoptymalizowany pod kątem urządzeń mobilnych i skupiony na czytelności tekstu. Kluczową funkcjonalnością jest nawigacja pomiędzy piosenkami w obrębie tego samego repertuaru bez konieczności powrotu do listy.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką dynamiczną:

-   **Ścieżka:** `/public/repertoires/:repertoirePublicId/songs/:songPublicId`
-   **Moduł Routingu:** `public-routes.ts` (lub analogiczny dla części publicznej)

## 3. Struktura komponentów

Struktura będzie prosta i składać się z jednego, głównego komponentu-strony.

```
- PublicRepertoireSongPageComponent (komponent routowalny)
    - Wyświetlanie tytułu piosenki (np. <h1>)
    - Komponent MatProgressBar dla wskaźnika ładowania
    - Komponent do wyświetlania błędu (np. reużywalny EmptyStateComponent)
    - Kontener na treść piosenki (np. <pre> lub <div>)
    - Dolny pasek nawigacyjny z przyciskami "Poprzednia" i "Następna"
```

## 4. Szczegóły komponentów

### `PublicRepertoireSongPageComponent`

-   **Opis komponentu:** Główny komponent strony, odpowiedzialny za pobranie danych piosenki na podstawie parametrów z URL, zarządzanie stanem (ładowanie, błąd, dane) oraz wyświetlenie treści i nawigacji. Będzie to komponent typu "smart".
-   **Główne elementy:**
    -   `mat-progress-bar`: Wyświetlany warunkowo podczas ładowania danych.
    -   `<h1>`: Wyświetla tytuł piosenki (`song().title`).
    -   `<div>` lub `<pre>`: Wyświetla treść piosenki (`song().content`) z zachowaniem formatowania (białe znaki).
    -   `div.navigation-controls`: Kontener na przyciski nawigacyjne.
    -   `a[mat-stroked-button]`: Dwa przyciski ("Poprzednia", "Następna") używające dyrektywy `routerLink` do nawigacji.
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "Poprzednia": Nawiguje do URL poprzedniej piosenki.
    -   Kliknięcie przycisku "Następna": Nawiguje do URL następnej piosenki.
-   **Obsługiwana walidacja:** Komponent nie obsługuje walidacji formularzy. Sprawdza jedynie istnienie `repertoirePublicId` i `songPublicId` w parametrach trasy.
-   **Typy:**
    -   `PublicRepertoireSongDto` (dane z API)
-   **Propsy:** Komponent nie przyjmuje propsów, dane pobiera z `ActivatedRoute`.

## 5. Typy

Do implementacji widoku wykorzystany zostanie istniejący typ DTO z pakietu `contracts`.

-   **`PublicRepertoireSongDto`**:
    ```typescript
    export type PublicRepertoireSongDto = {
        title: string;
        content: string; // Treść bez akordów
        order: PublicRepertoireSongOrderDto;
    };
    ```
-   **`PublicRepertoireSongOrderDto`**:
    ```typescript
    export type PublicRepertoireSongOrderDto = {
        position: number;
        total: number;
        previous: string | null; // Pełny URL do poprzedniej piosenki lub null
        next: string | null;     // Pełny URL do następnej piosenki lub null
    };
    ```

Nie ma potrzeby tworzenia dodatkowych typów ViewModel.

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w komponencie `PublicRepertoireSongPageComponent` przy użyciu sygnałów (Signals) z Angulara.

-   **Serwis:** Należy utworzyć nowy serwis `PublicApiService` w `src/app/core/services/` (lub w module `public`), który będzie odpowiedzialny za komunikację z publicznymi endpointami API. Będzie on zawierał metodę:
    -   `getPublicRepertoireSong(repertoirePublicId: string, songPublicId: string): Observable<PublicRepertoireSongDto>`
-   **Sygnały w komponencie:**
    -   `songData = signal<{ loading: boolean; data: PublicRepertoireSongDto | null; error: any | null }>({ loading: true, data: null, error: null })`: Obiekt przechowujący kompletny stan widoku.
-   **Logika:**
    1.  Komponent użyje `ActivatedRoute.params` do pobrania `repertoirePublicId` i `songPublicId`.
    2.  Zmiana parametrów w URL (np. po kliknięciu "Następna") automatycznie wywoła ponowne pobranie danych dzięki reaktywności strumienia `params`.
    3.  W trakcie wywołania API, stan `loading` będzie `true`.
    4.  Po pomyślnym pobraniu danych, zostaną one zapisane w `data`, a `loading` ustawione na `false`.
    5.  W przypadku błędu, zostanie on zapisany w `error`, a `loading` ustawione na `false`.

## 7. Integracja API

-   **Endpoint:** `GET /public/repertoires/{publicId}/songs/{songPublicId}`
-   **Serwis frontendowy:** `PublicApiService`
-   **Metoda w serwisie:** `getPublicRepertoireSong(repertoirePublicId: string, songPublicId: string)`
-   **Typ odpowiedzi (Response):** `PublicRepertoireSongDto`
-   **Obsługa w komponencie:** Komponent subskrybuje do metody serwisowej i aktualizuje swój stan (sygnał) w zależności od wyniku operacji (sukces/błąd).

## 8. Interakcje użytkownika

-   **Wejście na stronę:** Użytkownik widzi wskaźnik ładowania. Po chwili treść piosenki i nawigacja pojawiają się na ekranie.
-   **Nawigacja do kolejnej piosenki:** Użytkownik klika przycisk "Następna". Aplikacja przechodzi pod nowy URL. Użytkownik ponownie widzi wskaźnik ładowania, a następnie treść nowej piosenki.
-   **Przycisk nieaktywny:** Jeśli użytkownik jest na pierwszej piosence, przycisk "Poprzednia" jest nieaktywny. Jeśli na ostatniej - przycisk "Następna" jest nieaktywny.

## 9. Warunki i walidacja

-   **Stan przycisków nawigacji:**
    -   Przycisk "Poprzednia" jest wyłączony (`disabled`), gdy `songData().data?.order.previous === null`.
    -   Przycisk "Następna" jest wyłączony (`disabled`), gdy `songData().data?.order.next === null`.
-   **Linkowanie (`routerLink`):**
    -   Linki nawigacyjne muszą być dynamicznie budowane na podstawie `repertoirePublicId` oraz `songPublicId` wyodrębnionego z URL-i `previous` i `next`. Należy stworzyć pomocniczą funkcję `private extractSongId(url: string): string` w komponencie, która wyciągnie ostatni segment ze ścieżki.

## 10. Obsługa błędów

-   **Błąd 404/410:** Gdy API zwróci błąd `404 Not Found` lub `410 Gone`, komponent powinien wyświetlić czytelny komunikat dla użytkownika, np. "Piosenka nie została znaleziona lub została usunięta przez organizatora." Można do tego celu wykorzystać reużywalny `EmptyStateComponent`.
-   **Inne błędy serwera/sieci:** W przypadku innych błędów (np. 500), należy wyświetlić generyczny komunikat, np. "Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę."

## 11. Kroki implementacji

1.  **Utworzenie serwisu:** Stwórz `PublicApiService` z metodą `getPublicRepertoireSong(...)`, która będzie wykonywać zapytanie GET do odpowiedniego endpointu. Zadbaj o poprawną obsługę błędów HTTP.
2.  **Struktura plików:** Stwórz folder `src/app/pages/public/pages/public-repertoire-song` i wewnątrz umieść pliki dla nowego komponentu `public-repertoire-song.page.ts` (oraz `.html`, `.scss`).
3.  **Routing:** W `public-routes.ts` dodaj nową ścieżkę `/repertoires/:repertoirePublicId/songs/:songPublicId` wskazującą na nowo utworzony komponent.
4.  **Implementacja komponentu (`.ts`):**
    -   Wstrzyknij `ActivatedRoute` i `PublicApiService`.
    -   Utwórz sygnał do zarządzania stanem (`songData`).
    -   Zaimplementuj logikę pobierania danych w oparciu o `ActivatedRoute.params`. Użyj `switchMap` do obsługi zmieniających się parametrów i wywołania serwisu. Użyj `catchError` do obsługi błędów.
    -   Stwórz prywatną metodę `extractSongId(url: string | null): string | null` do parsowania ID piosenki z pełnego URL-a.
5.  **Implementacja szablonu (`.html`):**
    -   Użyj dyrektywy `@if` do warunkowego wyświetlania wskaźnika ładowania (`mat-progress-bar`), komunikatu o błędzie lub treści piosenki.
    -   Wyświetl `songData().data.title` i `songData().data.content`.
    -   Dodaj dwa przyciski `mat-stroked-button`.
    -   Użyj dyrektywy `[routerLink]` do bindowania dynamicznych linków nawigacyjnych.
    -   Użyj bindowania `[disabled]` do włączania/wyłączania przycisków na podstawie pól `previous` i `next`.
6.  **Stylowanie (`.scss`):**
    -   Zapewnij, że tekst piosenki jest duży i czytelny na urządzeniach mobilnych (`font-size`, `line-height`).
    -   Upewnij się, że kontener z treścią piosenki poprawnie zawija wiersze (`white-space: pre-wrap`).
    -   Umieść przyciski nawigacyjne na dole ekranu, w sposób zapewniający dobrą użyteczność.
7.  **Aktualizacja widoku listy:** W komponencie `PublicRepertoireView`, zmodyfikuj linki piosenek, aby prowadziły do nowej ścieżki (`/public/repertoires/:repertoirePublicId/songs/:songPublicId`) zamiast starej.
