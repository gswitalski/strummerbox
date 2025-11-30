# Zmiany w Funkcjonalności: Podgląd Piosenki z Poziomu Zarządzania

Data: 30 listopada 2025

Ten dokument opisuje zmiany wprowadzone w dokumentacji projektu StrummerBox w celu dodania nowej funkcjonalności - podglądu piosenki w trybie "do grania" bezpośrednio z listy piosenek w panelu zarządzania.

## 1. Historyjki Użytkownika

### Nowa Historyjka Użytkownika

-   **ID**: US-027
-   **Title**: Szybki podgląd piosenki z listy
-   **Description**: Jako Organizator, przeglądając listę swoich piosenek, chcę mieć możliwość szybkiego otworzenia podglądu wybranego utworu w trybie "do grania", aby sprawdzić jego wygląd i przetestować transpozycję bez wchodzenia w tryb edycji lub Biesiada.
-   **Acceptance Criteria**:
    -   W widoku listy piosenek (`/management/songs`), w kolumnie "Akcje", obok istniejących ikon, widoczna jest nowa ikona "Podgląd" (np. ikona `visibility`).
    -   Kliknięcie ikony "Podgląd" przekierowuje użytkownika na nową, dedykowaną stronę podglądu piosenki (np. `/management/songs/{id}/preview`).
    -   Nowy widok jest chroniony i dostępny tylko dla zalogowanego organizatora.
    -   W widoku podglądu wyświetlana jest piosenka przy użyciu komponentu `SongViewerComponent`.
    -   Widoczny jest tytuł oraz pełna treść piosenki z akordami.
    -   Dostępne i w pełni funkcjonalne są kontrolki do transpozycji akordów.
    -   W nagłówku/toolbarze widoku znajduje się przycisk "Zamknij".
    -   Kliknięcie przycisku "Zamknij" powoduje powrót do widoku listy piosenek (`/management/songs`).

## 2. API

### Zmiany w API

**Brak zmian w API.**

Nowa funkcjonalność w całości wykorzystuje istniejący endpoint `GET /songs/{id}` do pobierania szczegółowych danych piosenki, włączając jej treść. Nie było potrzeby tworzenia nowych ani modyfikacji istniejących endpointów.

## 3. Widoki

### Zmodyfikowane Widoki

#### **6. Lista Piosenek (Song List View)**

-   **Ścieżka:** `/management/songs`
-   **Opis zmiany:** Do kluczowych informacji w tym widoku, w ramach opcji dostępnych dla każdej piosenki, dodano akcję "Podgląd" z dedykowaną ikoną.

### Nowe Widoki

#### **7a. Podgląd Piosenki (Song Preview View)**

-   **Ścieżka:** `/management/songs/:id/preview`
-   **Główny cel:** Umożliwienie Organizatorowi szybkiego podglądu piosenki w trybie "do grania", z pełną funkcjonalnością transpozycji, bez opuszczania kontekstu zarządzania.
-   **Kluczowe informacje:** Tytuł piosenki, treść z akordami, w pełni funkcjonalne kontrolki transpozycji. Przycisk "Zamknij" w toolbarze, który powraca do listy piosenek.
-   **Kluczowe komponenty:** `SongViewerComponent`, `mat-toolbar`, `mat-button`.
-   **UX, dostępność, bezpieczeństwo:**
    -   **UX:** Widok wykorzystuje reużywalny komponent `SongViewerComponent`, zapewniając spójne doświadczenie z widokiem publicznym i trybem Biesiada. Interfejs jest zoptymalizowany pod kątem czytelności. Przycisk "Zamknij" zapewnia intuicyjny powrót do listy piosenek (`/management/songs`). Transpozycja działa w czasie rzeczywistym i jest stanem tymczasowym (nie jest zapisywana).
    -   **Dostępność:** Wysoki kontrast i duże czcionki dziedziczone z `SongViewerComponent`. Przycisk "Zamknij" posiada odpowiednią etykietę `aria-label`.
    -   **Bezpieczeństwo:** Dostęp do widoku jest chroniony przez `CanActivate` guard.
