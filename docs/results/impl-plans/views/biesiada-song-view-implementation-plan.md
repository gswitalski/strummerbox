# Plan implementacji widoku: Tryb Biesiada - Widok Piosenki

## 1. Przegląd

Celem jest stworzenie widoku dla zalogowanego Organizatora w "Trybie Biesiada", który wyświetla pełną treść piosenki wraz z akordami. Widok ten, zoptymalizowany pod kątem urządzeń mobilnych, ma na celu ułatwienie prowadzenia śpiewu podczas spotkań. Umożliwi on płynną nawigację między utworami w ramach repertuaru oraz szybkie udostępnianie go uczestnikom za pomocą kodu QR.

Implementacja zakłada refaktoryzację istniejącego widoku publicznej piosenki (`PublicRepertoireSongView`) w celu wydzielenia reużywalnego, prezentacyjnego komponentu `SongViewerComponent`, który będzie obsługiwał wyświetlanie treści zarówno dla anonimowego Biesiadnika, jak i zalogowanego Organizatora.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką, wymagającą uwierzytelnienia.

-   **Ścieżka:** `/biesiada/repertoires/:repertoireId/songs/:songId`
-   **Ochrona:** Dostęp chroniony przez `AuthGuard`.
-   **Parametry:**
    -   `repertoireId`: UUID repertuaru.
    -   `songId`: UUID piosenki.

## 3. Struktura komponentów

Struktura opiera się na podziale na komponenty "smart" (odpowiedzialne za logikę) i "presentational" (odpowiedzialne za UI).

```
- BiesiadaSongView (Smart Component)
  - SongViewerComponent (Presentational Component)
    - mat-toolbar (Nagłówek z tytułem i przyciskiem powrotu)
    - stbo-song-content (Renderowanie treści piosenki z ChordPro)
    - mat-fab (Pływający przycisk do pokazywania kodu QR)
    - mat-icon-button (Przyciski nawigacyjne: "wstecz", "poprzedni", "następny")
```

## 4. Szczegóły komponentów

### Nowy Komponent: `BiesiadaSongView`

-   **Lokalizacja:** `src/app/pages/biesiada-song/biesiada-song.view.ts`
-   **Typ:** Smart Component (standalone)
-   **Opis:** Główny komponent widoku, odpowiedzialny za pobieranie danych z API na podstawie parametrów z URL, zarządzanie stanem (ładowanie, błąd, dane) oraz obsługę akcji użytkownika, takich jak wyświetlenie dialogu z kodem QR.
-   **Główne elementy:**
    -   Będzie renderować komponent `SongViewerComponent`, przekazując mu odpowiednio przetworzone dane.
    -   Zawiera logikę do obsługi `MatDialog` dla `ShareDialogComponent`.
-   **Obsługiwane interakcje:**
    -   Po inicjalizacji: pobiera `repertoireId` i `songId` z `ActivatedRoute` i wywołuje serwis w celu pobrania danych piosenki.
    -   Obsługa kliknięcia przycisku QR: Otwiera `ShareDialogComponent` z danymi do udostępniania (`publicUrl`, `qrPayload`).
-   **Typy:**
    -   DTO: `BiesiadaRepertoireSongDetailDto`
    -   ViewModel: `BiesiadaSongViewModel`

### Nowy Komponent: `SongViewerComponent` (Współdzielony)

-   **Lokalizacja:** `src/app/shared/components/song-viewer/song-viewer.component.ts`
-   **Typ:** Presentational Component (standalone)
-   **Opis:** Reużywalny komponent odpowiedzialny wyłącznie za wyświetlanie interfejsu piosenki. Jego wygląd i funkcjonalność są w pełni konfigurowalne za pomocą propsów. Będzie używany zarówno przez `BiesiadaSongView`, jak i zrefaktoryzowany `PublicRepertoireSongView`.
-   **Główne elementy:**
    -   `mat-toolbar`: Wyświetla tytuł i przycisk powrotu.
    -   `div.song-content-wrapper`: Kontener na komponent `stbo-song-content`.
    -   `stbo-song-content`: Komponent renderujący tekst piosenki z formatu ChordPro.
    -   `div.navigation-controls`: Kontener na przyciski nawigacyjne "poprzednia" i "następna".
    -   `mat-fab-button`: Opcjonalny przycisk do pokazywania kodu QR.
-   **Propsy (Inputs):**
    -   `title: string`: Tytuł piosenki.
    -   `content: string`: Treść piosenki.
    -   `navigation: SongNavigation`: Obiekt z linkami nawigacyjnymi.
    -   `showQrButton: boolean`: Determinuje widoczność przycisku FAB.
    -   `isLoading: boolean`: Włącza/wyłącza wyświetlanie wskaźnika ładowania.
-   **Zdarzenia (Outputs):**
    -   `qrButtonClicked: EventEmitter<void>`: Emitowane po kliknięciu przycisku udostępniania.

### Refaktoryzacja: `PublicRepertoireSongView`

-   **Lokalizacja:** `src/app/pages/public-repertoire-song/public-repertoire-song.view.ts`
-   **Opis:** Komponent zostanie uproszczony. Jego głównym zadaniem będzie pobranie danych publicznej piosenki, usunięcie z niej akordów, a następnie przekazanie przygotowanych danych do reużywalnego komponentu `SongViewerComponent`. Wprowadzony zostanie także przycisk powrotu do listy piosenek dla spójności z widokiem Biesiada.

## 5. Typy

Wprowadzone zostaną nowe typy i modele widoku, aby zapewnić silne typowanie i oddzielić logikę od prezentacji.

```typescript
// src/app/shared/components/song-viewer/song-viewer.types.ts

// Opisuje pojedynczy link nawigacyjny
export interface SongNavLink {
  title: string;
  link: any[]; // Router link array
}

// Definiuje kompletny zestaw linków nawigacyjnych dla komponentu
export interface SongNavigation {
  previous: SongNavLink | null;
  next: SongNavLink | null;
  back: any[] | null; // Router link array for the back button
}

// src/app/pages/biesiada-song/biesiada-song.types.ts

// ViewModel używany przez BiesiadaSongView do przechowywania stanu
export interface BiesiadaSongViewModel {
  title: string;
  content: string;
  navigation: SongNavigation;
  share: {
    publicUrl: string;
    qrPayload: string;
  };
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `BiesiadaSongView` przy użyciu sygnałów Angulara, zgodnie z najlepszymi praktykami.

-   **Główny sygnał stanu:**
    ```typescript
    state = signal<{
      data: BiesiadaSongViewModel | null;
      isLoading: boolean;
      error: Error | null;
    }>({ data: null, isLoading: true, error: null });
    ```
-   **Pobieranie danych:** Sygnały `repertoireId` i `songId` będą pochodzić z `ActivatedRoute.paramMap`. Zmiana któregokolwiek z nich (np. podczas nawigacji "next/previous") wywoła `effect`, który uruchomi proces pobierania danych z API.
-   **Logika:**
    1.  Komponent jest inicjalizowany, `isLoading` ma wartość `true`.
    2.  `effect` pobiera parametry z URL i wywołuje metodę w serwisie.
    3.  W przypadku sukcesu: odpowiedź z API jest mapowana na `BiesiadaSongViewModel`, `isLoading` zmienia się na `false`, a dane są zapisywane w sygnale `state`.
    4.  W przypadku błędu: `error` jest zapisywany w sygnale `state`, a `isLoading` zmienia się na `false`.

## 7. Integracja API

Integracja z backendem będzie realizowana poprzez dedykowany serwis.

-   **Serwis:** `BiesiadaService` (`src/app/core/services/biesiada.service.ts`)
-   **Metoda:**
    ```typescript
    getSongDetails(repertoireId: string, songId: string): Observable<BiesiadaRepertoireSongDetailDto>
    ```
-   **Endpoint:** `GET /api/me/biesiada/repertoires/{repertoireId}/songs/{songId}`
-   **Typ odpowiedzi (DTO):** `BiesiadaRepertoireSongDetailDto`
-   **Mapowanie:** W `BiesiadaSongView`, otrzymane DTO zostanie zmapowane na `BiesiadaSongViewModel`, np. `order.previous` zostanie przekształcone na `navigation.previous` z odpowiednio sformatowanym linkiem dla `routerLink`.

## 8. Interakcje użytkownika

-   **Nawigacja do widoku:** Użytkownik wchodzi na ścieżkę. Wyświetlany jest wskaźnik ładowania, a następnie treść piosenki.
-   **Kliknięcie "Następna":** Aplikacja nawiguje do URL następnej piosenki. Komponent reaguje na zmianę parametru `:songId` i pobiera nowe dane.
-   **Kliknięcie "Poprzednia":** Analogicznie do "Następna".
-   **Kliknięcie "Powrót":** Aplikacja nawiguje do listy piosenek danego repertuaru (`/biesiada/repertoires/:repertoireId`).
-   **Kliknięcie przycisku "Pokaż QR":** Wywołuje metodę w `BiesiadaSongView`, która otwiera `ShareDialogComponent`, przekazując mu dane z `state.data.share`.

## 9. Warunki i walidacja

-   **Przyciski nawigacyjne:** W `SongViewerComponent` przyciski "Poprzednia" i "Następna" będą nieaktywne (`disabled`) lub ukryte (`*ngIf`), jeśli odpowiednie obiekty w `navigation.previous` lub `navigation.next` mają wartość `null`.
-   **Przycisk QR:** Przycisk FAB będzie widoczny tylko wtedy, gdy props `showQrButton` będzie ustawiony na `true`.

## 10. Obsługa błędów

-   **Błąd 404 (Not Found):** Jeśli API zwróci 404, komponent wyświetli komunikat o błędzie, np. "Nie znaleziono piosenki w tym repertuarze" za pomocą dedykowanego komponentu `EmptyStateComponent` lub podobnego.
-   **Błąd 401/403 (Unauthorized/Forbidden):** Błędy te będą przechwytywane globalnie przez `HttpInterceptor`, który przekieruje użytkownika na stronę logowania.
-   **Błędy 5xx (Server Error):** Komponent wyświetli generyczny komunikat o błędzie, np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
-   **Stan błędu:** Obiekt błędu zostanie zapisany w sygnale `state`, co pozwoli na warunkowe renderowanie odpowiedniego komunikatu w szablonie HTML.

## 11. Kroki implementacji

1.  **Stworzenie typów:** Zdefiniowanie interfejsów `SongNavLink`, `SongNavigation` oraz `BiesiadaSongViewModel` w dedykowanych plikach `*.types.ts`.
2.  **Stworzenie `BiesiadaService`:** Implementacja serwisu z metodą `getSongDetails` do komunikacji z API.
3.  **Stworzenie `SongViewerComponent`:**
    -   Wygenerowanie nowego, współdzielonego komponentu.
    -   Implementacja szablonu HTML z `mat-toolbar`, `stbo-song-content` i przyciskami.
    -   Zdefiniowanie wejść (`@Input`) i wyjść (`@Output`) komponentu.
    -   Dodanie logiki do warunkowego wyświetlania/deaktywowania elementów na podstawie propsów.
4.  **Refaktoryzacja `PublicRepertoireSongView`:**
    -   Aktualizacja szablonu, aby używał `<stbo-song-viewer>`.
    -   Dostosowanie logiki komponentu, aby mapowała dane publicznej piosenki na propsy dla `SongViewerComponent`.
    -   Dodanie przycisku powrotu do logiki nawigacji.
5.  **Stworzenie `BiesiadaSongView`:**
    -   Wygenerowanie nowego komponentu i zdefiniowanie dla niego routingu.
    -   Implementacja logiki pobierania danych z `BiesiadaService` przy użyciu sygnałów i `effect`.
    -   Stworzenie metody mapującej DTO na ViewModel.
    -   Implementacja szablonu używającego `<stbo-song-viewer>` i przekazującego dane z sygnału `state`.
    -   Dodanie obsługi otwierania `ShareDialogComponent`.
6.  **Testowanie:** Weryfikacja obu widoków (publicznego i biesiada) pod kątem poprawnego działania, nawigacji, obsługi błędów i spójności UI.
