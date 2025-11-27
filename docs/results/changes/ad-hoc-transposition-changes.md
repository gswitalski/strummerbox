# Zmiany w projekcie - Transpozycja Ad-Hoc

Niniejszy dokument opisuje zmiany wprowadzone w dokumentacji projektu w celu dodania funkcjonalności transpozycji akordów w czasie rzeczywistym.

## 1. Historyjki Użytkownika

Do dokumentu PRD dodano następujące historyjki użytkownika, które definiują nową funkcjonalność z perspektywy użytkownika końcowego.

### ID: US-025
-   **Title:** Transpozycja ad-hoc w widoku publicznym
-   **Description:** Jako Biesiadnik grający na instrumencie, chcę móc tymczasowo zmienić tonację wyświetlanej piosenki, aby dopasować ją do stroju mojego instrumentu lub możliwości wokalnych grupy.
-   **Acceptance Criteria:**
    -   W widoku publicznym piosenki, kontrolki transpozycji pojawiają się tylko wtedy, gdy włączony jest tryb "Pokaż akordy".
    -   Interfejs zawiera przyciski "-" i "+" oraz licznik przesunięcia (np. +2).
    -   Zmiana tonacji następuje natychmiastowo bez przeładowania strony.
    -   Wyłączenie widoku akordów ukrywa kontrolki transpozycji.

### ID: US-026
-   **Title:** Transpozycja w trybie Organizatora (Biesiada)
-   **Description:** Jako Organizator prowadzący śpiewanie, chcę mieć szybki dostęp do zmiany tonacji, aby zareagować na potrzeby grupy w trakcie imprezy.
-   **Acceptance Criteria:**
    -   W trybie 'Biesiada' kontrolki transpozycji są widoczne na stałe w widoku piosenki.
    -   Transpozycja jest lokalna dla sesji przeglądarki i nie zmienia oryginalnego zapisu piosenki na serwerze.

## 2. API

**Nie wprowadzono żadnych zmian w API.**

Funkcjonalność transpozycji została zaimplementowana w całości po stronie klienta (w aplikacji Angular). Istniejące endpointy API dostarczają pełną treść piosenki w formacie ChordPro, co jest wystarczające do przeprowadzenia operacji transpozycji w przeglądarce. Takie podejście unika dodatkowych zapytań do serwera i zapewnia natychmiastową odpowiedź interfejsu.

## 3. Widoki

Zmiany w interfejsie użytkownika koncentrują się na istniejących widokach piosenek oraz wprowadzeniu nowego komponentu do obsługi transpozycji.

### Nowy Komponent: `TransposeControlsComponent`

-   **Opis:** Mały, reużywalny komponent prezentacyjny, który renderuje interfejs do zmiany tonacji. Składa się z przycisków "-" i "+", które emitują zdarzenia zmiany, oraz wyświetlacza aktualnego przesunięcia (np. "+1", "-2").
-   **API:** `@Input() offset: number`, `@Output() change: EventEmitter<number>`.
-   **Użycie:** Wewnętrznie przez `SongViewerComponent`.

### Zmiany w `SongViewerComponent`

-   **Opis:** Komponent został zaktualizowany, aby mógł zarządzać i wyświetlać `TransposeControlsComponent`.
-   **Zmiany w API:**
    -   Dodano `@Input() transposeOffset: number`, aby przyjąć aktualny stan transpozycji.
    -   Dodano `@Input() config: SongViewerConfig`, w którym pojawiła się nowa flaga `showTransposeControls: boolean`, aby kontrolować widoczność narzędzia.
    -   Dodano `@Output() transposeChanged: EventEmitter<number>`, aby informować komponent nadrzędny o żądaniu zmiany tonacji.
-   **Logika:** `SongViewerComponent` będzie teraz warunkowo renderować `TransposeControlsComponent` na podstawie konfiguracji i stanu widoczności akordów.

### Zmiany w Widokach Nadrzędnych

-   **Publiczny Widok Piosenki (`Public Song View`):**
    -   **Zmiana:** W tym widoku `SongViewerComponent` jest konfigurowany tak, aby `TransposeControlsComponent` pojawiał się tylko wtedy, gdy użytkownik włączy widoczność akordów. Stan transpozycji jest zarządzany lokalnie w tym widoku.
-   **Tryb Biesiada - Widok Piosenki (`Biesiada Song View`):**
    -   **Zmiana:** W tym widoku `SongViewerComponent` jest konfigurowany tak, aby `TransposeControlsComponent` był widoczny domyślnie, niezależnie od przełącznika akordów (który jest tu niewidoczny, bo akordy są zawsze włączone dla Organizatora).
