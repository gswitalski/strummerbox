<conversation_summary>
<decisions>
1.  Główna nawigacja dla zalogowanego "Organizatora" zostanie zaimplementowana przy użyciu stałego panelu bocznego (`mat-sidenav`) rozdzielającego "Panel Zarządzania" od "Trybu Biesiada".
2.  Zarządzanie stanem aplikacji będzie realizowane za pomocą serwisów Angulara z `BehaviorSubject` w celu buforowania list i unikania zbędnych zapytań API.
3.  Obsługa błędów API zostanie zaimplementowana globalnie poprzez `HttpInterceptor`, który będzie zarządzał błędami autoryzacji i serwera, a błędy walidacji (np. `409 Conflict`) będą przekazywane do formularzy.
4.  Złożone widoki, takie jak edytor "side-by-side", będą responsywne i na urządzeniach mobilnych przełączą się na układ z zakładkami.
5.  W bieżącej wersji MVP zrezygnowano z pre-fetchingu (wstępnego ładowania) danych następnej piosenki w widoku publicznym "Biesiadnika".
6.  Zostaną stworzone reużywalne komponenty współdzielone, w tym `EmptyStateComponent`, `ConfirmationDialogComponent` oraz `SongListComponent`.
7.  Trasy chronione będą zabezpieczone za pomocą `CanActivate` guard, a `HttpInterceptor` będzie obsługiwał wygaśnięcie sesji (błąd `401`) przez przekierowanie do strony logowania.
8.  W bieżącej wersji MVP zrezygnowano z implementacji dodatkowego buforowania dla danych konfiguracyjnych (np. metadanych linków).
9.  Stany ładowania będą komunikowane za pomocą globalnego `MatProgressBar` dla nawigacji oraz lokalnych `MatSpinner` dla akcji wewnątrz komponentów.
10. Widoki publiczne będą obsługiwać błędy `410 Gone` i `404 Not Found` przez przekierowanie na dedykowane strony informacyjne.
11. Po zalogowaniu Organizator będzie przekierowywany na prosty dashboard z kluczowymi statystykami i skrótami do głównych akcji.
12. Operacje tworzenia i edycji będą realizowane na dedykowanych podstronach, a nie w oknach modalnych.
13. Udostępnianie piosenek i repertuarów będzie odbywać się poprzez okno modalne, wyświetlające link oraz kod QR.
</decisions>
<matched_recommendations>
1.  **Struktura Layoutu i Nawigacji:** Zastosowanie layoutu z bocznym panelem nawigacyjnym (`mat-sidenav`) dla zalogowanego Organizatora, który zapewni klarowne rozdzielenie sekcji "Zarządzanie" i "Biesiada". Ustanowienie prostego dashboardu jako strony startowej po zalogowaniu.
2.  **Zarządzanie Stanem i Integracja API:** Wykorzystanie serwisów Angulara z `BehaviorSubject` do lokalnego cachowania stanu (np. list piosenek), co zminimalizuje liczbę zapytań do API. Po operacjach zapisu stan będzie aktualizowany lokalnie, zapewniając natychmiastową odpowiedź UI.
3.  **Obsługa Błędów i Ładowania:** Implementacja globalnego `HttpInterceptor` do centralnego zarządzania błędami HTTP (401, 500) i wyświetlania wskaźników ładowania (`MatProgressBar`) podczas zapytań. Błędy walidacyjne (4xx) będą przekazywane do komponentów w celu wyświetlenia kontekstowych komunikatów.
4.  **Reużywalność Komponentów:** Stworzenie biblioteki współdzielonych, generycznych komponentów UI, takich jak widok pustego stanu (`EmptyStateComponent`), dialog potwierdzenia akcji destrukcyjnej oraz komponent listy, w celu zapewnienia spójności i przyspieszenia rozwoju.
5.  **Responsywność:** Przyjęcie strategii adaptacyjnego UI, gdzie złożone widoki desktopowe (np. edytor side-by-side) transformują się w prostsze układy (np. z zakładkami) na mniejszych ekranach, podczas gdy widoki "Biesiada" są projektowane w podejściu "mobile-first".
6.  **Przepływy Użytkownika:** Realizacja kluczowych operacji (tworzenie, edycja) na dedykowanych stronach dla lepszego UX i zarządzania stanem przez URL. Interakcje takie jak udostępnianie będą realizowane w oknach modalnych, aby nie przerywać głównego przepływu pracy.
7.  **Bezpieczeństwo:** Zabezpieczenie tras aplikacji przeznaczonych dla Organizatora za pomocą `CanActivate` guard, który weryfikuje status uwierzytelnienia użytkownika.
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie analizy dokumentacji produktowej (PRD), planu API i stosu technologicznego, a także przeprowadzonej sesji pytań i odpowiedzi, ustalono kluczowe założenia dla architektury interfejsu użytkownika aplikacji StrummerBox w wersji MVP.

**a. Główne wymagania dotyczące architektury UI**
Architektura będzie oparta na jasnym podziale na dwa główne tryby pracy: "Zarządzanie" i "Biesiada". Zostanie zaimplementowana w Angularze 19 z wykorzystaniem biblioteki komponentów Angular Material, co zapewni spójność wizualną i dostępność. Struktura będzie modułowa, z wyraźnym rozdzieleniem na komponenty współdzielone (`shared`), logikę rdzeniową (`core`) oraz poszczególne widoki (`pages`).

**b. Kluczowe widoki, ekrany i przepływy użytkownika**
-   **Uwierzytelnianie:** Osobne strony dla logowania i rejestracji.
-   **Layout Główny (Organizator):** Po zalogowaniu użytkownik trafia do layoutu z bocznym panelem nawigacyjnym, który umożliwia przełączanie się między sekcjami zarządzania.
-   **Dashboard:** Widok startowy po zalogowaniu, prezentujący podsumowanie danych (liczba piosenek/repertuarów) i przyciski do szybkich akcji (stwórz nowy).
-   **Zarządzanie Piosenkami/Repertuarami:** Widoki list (tabelaryczne na desktopie, karty na mobile) z opcjami wyszukiwania, paginacji, edycji i usuwania. Stany puste będą obsługiwane przez dedykowany komponent.
-   **Tworzenie/Edycja:** Dedykowane, pełnoekranowe formularze. Edytor piosenki będzie responsywny (side-by-side vs. zakładki), a edytor repertuaru umożliwi łatwe dodawanie piosenek z biblioteki w układzie dwukolumnowym.
-   **Tryb Biesiada (Organizator):** Uproszczony, mobilny interfejs do przeglądania repertuarów i piosenek (z akordami), wyposażony w "pływający" przycisk do szybkiego wyświetlania kodu QR.
-   **Widok Publiczny (Biesiadnik):** Minimalistyczny, czytelny widok piosenki (bez akordów) z nawigacją do następnego/poprzedniego utworu w ramach repertuaru.

**c. Strategia integracji z API i zarządzania stanem**
Zarządzanie stanem będzie oparte na serwisach Angulara, które będą pełnić rolę "źródła prawdy" dla danych z API. Wykorzystanie `BehaviorSubject` pozwoli na buforowanie pobranych list i ich optymistyczną aktualizację po stronie klienta po operacjach CRUD, co zredukuje opóźnienia i liczbę zapytań do serwera. Globalny `HttpInterceptor` scentralizuje obsługę błędów (przekierowanie przy 401, powiadomienia przy 500) i zarządzanie wskaźnikami ładowania.

**d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa**
Aplikacja będzie w pełni responsywna. Widoki zarządzania będą zoptymalizowane pod kątem desktopu, ale w pełni funkcjonalne na urządzeniach mobilnych dzięki adaptacyjnym layoutom. Widoki publiczne i "Biesiada" będą projektowane w podejściu "mobile-first". Bezpieczeństwo będzie zapewnione przez `CanActivate` guard, który uniemożliwi dostęp do chronionych tras niezalogowanym użytkownikom. Komponenty Angular Material zapewnią bazowy poziom dostępności (WCAG).
</ui_architecture_planning_summary>
<unresolved_issues>
Wszystkie kluczowe kwestie dotyczące architektury UI dla wersji MVP zostały omówione i rozstrzygnięte. Nie zidentyfikowano żadnych nierozwiązanych problemów blokujących rozpoczęcie implementacji. Decyzje o pominięciu w MVP zaawansowanych optymalizacji, takich jak pre-fetching danych czy dodatkowe warstwy buforowania, są świadome i mogą zostać ponownie rozważone w przyszłych iteracjach produktu.
</unresolved_issues>
</conversation_summary>
