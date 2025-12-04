# Quick Return to Dashboard - Zmiany

Dokument opisuje zmiany w wymaganiach i architekturze UI związane z wprowadzeniem funkcji szybkiego powrotu do Dashboardu z trybu Biesiada.

## 1. Historyjki Użytkownika (User Stories)

Dodano nową historyjkę użytkownika do sekcji "Udostępnianie i Tryb Biesiada".

### US-031: Szybkie wyjście z trybu Biesiada
**Jako** Organizator w trybie 'Biesiada',  
**Chcę** mieć możliwość kliknięcia przycisku "Zamknij/X",  
**Aby** natychmiast wrócić do panelu zarządzania (Dashboardu) bez konieczności wielokrotnego klikania "Wstecz".

**Kryteria akceptacji:**
1.  **Widok główny (Lista Repertuarów):** Przycisk z ikoną `close` (X) znajduje się w **lewym górnym rogu** paska narzędzi. Kliknięcie przenosi do `/dashboard`.
2.  **Widoki podrzędne (Lista Piosenek, Widok Piosenki):** Przycisk z ikoną `close` (X) znajduje się w **prawym górnym rogu** paska narzędzi.
3.  **Nawigacja kontekstowa:** Na widokach podrzędnych, w lewym górnym rogu pozostaje przycisk `arrow_back` (Wstecz), który zachowuje standardową nawigację (np. powrót z piosenki do listy piosenek).
4.  **Widoczność:** Przycisk jest dostępny tylko w trybie organizatora (nie występuje w publicznych widokach dla biesiadników).

## 2. API

**Brak zmian w API.**

Funkcjonalność opiera się wyłącznie na nawigacji po stronie klienta (Angular Router). Nie wymaga tworzenia nowych endpointów ani modyfikacji istniejących kontraktów danych.

## 3. Widoki (UI Plan)

Zaktualizowano definicje widoków trybu Biesiada w Planie UI.

### Zmienione Widoki:

#### 11. Tryb Biesiada - Lista Repertuarów
*   **Zmiana:** Dodano opis przycisku "Zamknij" w `mat-toolbar`.
*   **Lokalizacja:** Lewy górny róg (zamiast menu hamburgera, które w trybie Biesiada jest ukryte).
*   **Akcja:** `router.navigate(['/dashboard'])`.

#### 12. Tryb Biesiada - Lista Piosenek w Repertuarze
*   **Zmiana:** Zredefiniowano układ paska narzędzi.
*   **Układ:**
    *   Lewa strona: Przycisk "Wstecz" (powrót do listy repertuarów).
    *   Prawa strona: Przycisk "Zamknij" (powrót do Dashboardu).

#### 13. Tryb Biesiada - Widok Piosenki
*   **Zmiana:** Aktualizacja konfiguracji komponentu `SongViewerComponent`.
*   **Szczegóły:** Komponent musi przyjąć parametr konfiguracyjny (np. `showExitButton: true`), który wyrenderuje dodatkowy przycisk `mat-icon-button` z ikoną `close` w prawej części toolbara.
*   **Interakcja:** Przycisk ten będzie emitował zdarzenie (np. `exitClicked`) lub bezpośrednio nawigował do Dashboardu, zależnie od implementacji smart komponentu.

