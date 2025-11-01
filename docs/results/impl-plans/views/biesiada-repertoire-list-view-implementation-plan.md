# Plan implementacji widoku: Tryb Biesiada - Lista Repertuarów

## 1. Przegląd

Celem tego widoku jest wyświetlenie zalogowanemu Organizatorowi uproszczonej listy jego repertuarów, zoptymalizowanej pod kątem urządzeń mobilnych. Widok ten stanowi punkt wejścia do "Trybu Biesiada", umożliwiając szybki wybór repertuaru do prowadzenia spotkania. Każdy element na liście będzie zawierał nazwę repertuaru oraz liczbę piosenek i będzie prowadził do szczegółowego widoku listy piosenek danego repertuaru.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

-   **Ścieżka:** `/biesiada/repertoires`
-   **Ochrona:** Trasa będzie chroniona przez `AuthGuard`, zapewniając dostęp wyłącznie uwierzytelnionym użytkownikom (Organizatorom).

## 3. Struktura komponentów

Implementacja będzie oparta na architekturze komponentów standalone.

```
- BiesiadaRepertoireListPageComponent (komponent-strona)
  - @if (vm.isLoading)
    - MatSpinnerComponent
  - @if (vm.error)
    - ErrorMessageComponent
  - @if (vm.repertoires.length === 0 && !vm.isLoading)
    - EmptyStateComponent
  - @if (vm.repertoires.length > 0)
    - MatListComponent
      - @for (repertoire of vm.repertoires)
        - MatListItemComponent (z [routerLink])
```

## 4. Szczegóły komponentów

### BiesiadaRepertoireListPageComponent

-   **Opis komponentu:** Główny komponent strony, odpowiedzialny za orkiestrację widoku. Inicjuje pobieranie danych, zarządza wyświetlaniem odpowiedniego stanu (ładowanie, błąd, stan pusty, lista danych) i renderuje listę repertuarów.
-   **Główne elementy:**
    -   `mat-spinner` do wizualizacji stanu ładowania.
    -   `stbo-empty-state` do obsługi przypadku, gdy użytkownik nie ma żadnych repertuarów.
    -   `mat-list` i `mat-list-item` do wyświetlania listy repertuarów. Każdy element listy będzie nawigował do widoku piosenek repertuaru.
-   **Obsługiwane zdarzenia:**
    -   Inicjalizacja komponentu (`ngOnInit`) wywołuje pobieranie danych.
    -   Kliknięcie na element listy (`mat-list-item`) powoduje nawigację do `/biesiada/repertoires/:id`.
-   **Warunki walidacji:** Brak walidacji po stronie tego komponentu.
-   **Typy:** `BiesiadaRepertoireListViewModel`.

## 5. Typy

Na potrzeby tego widoku zdefiniujemy jeden nowy typ `ViewModel` do zarządzania stanem w komponencie. Będziemy również korzystać z istniejących typów DTO z pakietu `contracts`.

-   **`BiesiadaRepertoireSummaryDto` (DTO, z `contracts`):**
    ```typescript
    export type BiesiadaRepertoireSummaryDto = {
        id: string; // uuid
        name: string;
        songCount: number;
        publishedAt: string | null; // ISO date string
    };
    ```
-   **`BiesiadaRepertoireListResponseDto` (DTO, z `contracts`):**
    ```typescript
    export type BiesiadaRepertoireListResponseDto = {
        items: BiesiadaRepertoireSummaryDto[];
    };
    ```
-   **`BiesiadaRepertoireListViewModel` (ViewModel, nowy):**
    ```typescript
    export interface BiesiadaRepertoireListViewModel {
        repertoires: BiesiadaRepertoireSummaryDto[];
        isLoading: boolean;
        error: string | null;
    }
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane przy użyciu dedykowanego serwisu i sygnałów Angulara, zgodnie z przyjętymi standardami.

-   **`BiesiadaRepertoireListService`:**
    -   Serwis będzie odpowiedzialny za komunikację z API oraz za utrzymywanie stanu widoku.
    -   Będzie zawierał prywatny `WritableSignal` przechowujący `BiesiadaRepertoireListViewModel`.
    -   Udostępni publiczny, niemodyfikowalny sygnał (`ReadonlySignal`) z aktualnym stanem (`vm`).
    -   Metoda `fetchRepertoires` będzie aktualizować sygnał w zależności od odpowiedzi API (ustawiając `isLoading`, `repertoires` oraz `error`).

-   **`BiesiadaRepertoireListPageComponent`:**
    -   Wstrzyknie `BiesiadaRepertoireListService`.
    -   W cyklu życia `ngOnInit` wywoła metodę `fetchRepertoires` z serwisu.
    -   Szablon komponentu będzie dynamicznie renderował UI w oparciu o wartości z publicznego sygnału `vm` udostępnianego przez serwis.

## 7. Integracja API

Komponent będzie integrował się z jednym endpointem w celu pobrania listy repertuarów.

-   **Endpoint:** `GET /me/biesiada/repertoires`
-   **Opis:** Pobiera uproszczoną listę repertuarów zalogowanego Organizatora.
-   **Typ żądania:** Brak (poza nagłówkiem autoryzacji).
-   **Typ odpowiedzi (sukces):** `BiesiadaRepertoireListResponseDto`
-   **Obsługa:** Wywołanie API zostanie zrealizowane w `BiesiadaRepertoireListService` przy użyciu `HttpClient` z Angulara. Interceptor `AuthInterceptor` automatycznie dołączy wymagany token JWT.

## 8. Interakcje użytkownika

-   **Wejście na widok:** Użytkownik wybiera "Moje Biesiady" z menu nawigacyjnego. Aplikacja przechodzi do `/biesiada/repertoires`, a na ekranie pojawia się wskaźnik ładowania.
-   **Wyświetlenie listy:** Po pomyślnym załadowaniu danych, wskaźnik ładowania znika, a na ekranie pojawia się lista repertuarów. Każdy element jest duży i łatwy do kliknięcia na urządzeniu mobilnym.
-   **Wybór repertuaru:** Użytkownik klika wybrany repertuar na liście.
    -   **Rezultat:** Aplikacja nawiguje do widoku listy piosenek dla tego repertuaru, używając ścieżki `/biesiada/repertoires/:id`, gdzie `:id` to identyfikator wybranego repertuaru.
-   **Brak repertuarów:** Jeśli użytkownik nie ma żadnych repertuarów, zamiast listy wyświetlony zostanie komponent `EmptyStateComponent` z informacją "Nie masz jeszcze żadnych repertuarów" i przyciskiem prowadzącym do ich tworzenia (np. "Stwórz pierwszy repertuar").

## 9. Warunki i walidacja

-   **Uwierzytelnienie:** Dostęp do ścieżki `/biesiada/repertoires` jest warunkowany. `AuthGuard` sprawdzi, czy użytkownik jest zalogowany. W przypadku braku autoryzacji, użytkownik zostanie przekierowany na stronę logowania (`/login`).

## 10. Obsługa błędów

-   **Błąd serwera (np. 500):** Jeśli API zwróci błąd serwera, serwis przechwyci go i ustawi pole `error` w stanie. Komponent wyświetli użytkownikowi generyczny komunikat o błędzie (np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.").
-   **Błąd autoryzacji (401):** Błąd ten zostanie obsłużony globalnie przez `HttpInterceptor`, który automatycznie wyloguje użytkownika i przekieruje go na stronę logowania.
-   **Brak połączenia z siecią:** Błąd zostanie potraktowany podobnie jak błąd serwera, z odpowiednim komunikatem dla użytkownika.

## 11. Kroki implementacji

1.  **Utworzenie serwisu:**
    -   Stworzyć plik `biesiada-repertoire-list.service.ts` w `src/app/pages/biesiada/repertoires/services/`.
    -   Zaimplementować w nim logikę zarządzania stanem opartą na sygnale `BiesiadaRepertoireListViewModel`.
    -   Dodać metodę `fetchRepertoires`, która będzie komunikować się z endpointem `GET /me/biesiada/repertoires`.

2.  **Utworzenie komponentu:**
    -   Wygenerować `BiesiadaRepertoireListPageComponent` jako komponent standalone w ścieżce `src/app/pages/biesiada/repertoires/`.
    -   Wstrzyknąć `BiesiadaRepertoireListService` i wywołać `fetchRepertoires()` w `ngOnInit`.
    -   Przypisać sygnał `vm` z serwisu do publicznej właściwości komponentu.

3.  **Implementacja szablonu:**
    -   W pliku `biesiada-repertoire-list-page.component.html` zaimplementować szablon z użyciem nowego control flow (`@if`, `@for`).
    -   Dodać obsługę stanu ładowania (`mat-spinner`).
    -   Dodać obsługę stanu pustego (`EmptyStateComponent`).
    -   Zaimplementować listę repertuarów przy użyciu `mat-list` i `mat-list-item`.
    -   Dodać atrybut `[routerLink]` do elementów listy, aby nawigowały do `/biesiada/repertoires/:id`.

4.  **Routing:**
    -   W konfiguracji routingu dla modułu `biesiada` (lub głównym, jeśli jest scentralizowany) dodać nową trasę:
        ```typescript
        {
            path: 'repertoires',
            loadComponent: () => import('./pages/biesiada/repertoires/biesiada-repertoire-list-page.component').then(c => c.BiesiadaRepertoireListPageComponent),
            canActivate: [AuthGuard]
        }
        ```

5.  **Stylowanie:**
    -   W pliku `biesiada-repertoire-list-page.component.scss` dodać style zapewniające optymalizację dla urządzeń mobilnych, w tym duże, łatwe do kliknięcia elementy listy i czytelną czcionkę, zgodnie z UI Plan.

6.  **Testowanie:**
    -   Sprawdzić manualnie wszystkie ścieżki interakcji użytkownika: pomyślne załadowanie danych, stan pusty, nawigację oraz (jeśli to możliwe) zachowanie w przypadku błędu API.
