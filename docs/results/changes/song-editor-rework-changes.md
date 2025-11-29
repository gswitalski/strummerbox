# Zmiany w Funkcjonalności Edytora Piosenek

Data: 28 listopada 2025

Ten dokument podsumowuje zmiany wprowadzone w dokumentacji w związku z przebudową edytora piosenek. Głównym celem modyfikacji było odwrócenie logiki interfejsu, aby umożliwić użytkownikom wprowadzanie piosenek w bardziej naturalnym formacie "akordy nad tekstem", jednocześnie generując podgląd w formacie ChordPro.

## 1. Historyjki użytkownika

### Zaktualizowana historyjka

Poniższa historyjka użytkownika zastępuje poprzednią wersję `US-004`.

-   **ID:** US-004
-   **Title:** Tworzenie i edycja piosenki z intuicyjnym edytorem
-   **Description:** Jako Organizator, chcę móc dodawać i edytować piosenki w mojej bazie, wpisując tekst w naturalnym formacie "akordy nad tekstem" i jednocześnie widzieć podgląd, jak zostanie on zapisany w formacie ChordPro.
-   **Acceptance Criteria:**
    -   Formularz dodawania/edycji piosenki zawiera pole na tytuł oraz duży edytor tekstu.
    -   Do edytora wprowadzam tekst piosenki w formacie, gdzie linia z akordami znajduje się bezpośrednio nad linią z tekstem.
    -   Obok edytora (w widoku "side-by-side") wyświetlany jest podgląd piosenki w czasie rzeczywistym, pokazujący skonwertowaną treść w formacie ChordPro (np. `[G]Idę sobie [D]ulicą...`).
    -   System nie pozwala na zapisanie piosenki bez tytułu.
    -   System nie pozwala na zapisanie piosenki o tytule, który już istnieje w mojej bazie.
    -   Podczas edycji istniejącej piosenki, jej zawartość (zapisana w ChordPro) jest automatycznie konwertowana do formtu "akordy nad tekstem" i umieszczana w edytorze.
    -   Po zapisaniu, piosenka jest widoczna na liście moich piosenek.

### Usunięta historyjka

-   **ID:** US-021
-   **Title:** Importowanie piosenki z formatu "akordy nad tekstem"
-   **Notatka:** Ta historyjka została usunięta, ponieważ nowy edytor natywnie obsługuje format "akordy nad tekstem", co czyni dedykowaną funkcję importu zbędną.

## 2. API

**Brak zmian w API.**

-   **Notatka:** Wszystkie operacje konwersji pomiędzy formatem "akordy nad tekstem" a formatem ChordPro odbywają się w całości po stronie klienta (w aplikacji frontendowej). API niezmiennie operuje wyłącznie na formacie ChordPro, w związku z czym nie były wymagane żadne zmiany w istniejących endpointach, kontraktach DTO ani schemacie bazy danych.

## 3. Widoki

### Zmodyfikowany widok: Tworzenie / Edycja Piosenki (Song Create/Edit View)

-   **Ścieżka:** `/management/songs/new`, `/management/songs/:id/edit`
-   **Notatka o zmianach:**
    -   Logika edytora została odwrócona. Główne pole tekstowe (`textarea`) służy teraz do wprowadzania danych w formacie "akordy nad tekstem".
    -   Panel podglądu wyświetla na żywo wynik konwersji do formatu ChordPro.
    -   Usunięto przycisk "Importuj z tekstu" oraz powiązane z nim okno modalne (`ImportFromTextDialogComponent`), ponieważ funkcjonalność ta została zintegrowana bezpośrednio z edytorem.

#### Zaktualizowany opis widoku:

-   **Główny cel:** Dodawanie nowej lub modyfikacja istniejącej piosenki.
-   **Kluczowe informacje:** Formularz z polem na tytuł piosenki, edytor tekstu dla treści w formacie "akordy nad tekstem". Podgląd na żywo piosenki skonwertowanej do formatu ChordPro.
-   **Kluczowe komponenty:** `mat-form-field`, `textarea`, `mat-button`, niestandardowy komponent edytora "side-by-side".
-   **UX, dostępność, bezpieczeństwo:**
    -   **UX:** Na desktopie układ "side-by-side" (edycja w formacie "akordy nad tekstem" po lewej, podgląd w formacie ChordPro po prawej). Na mobile układ z zakładkami (`mat-tab-group`) do przełączania się między edycją a podglądem. Walidacja (np. unikalność tytułu) z komunikatami błędów.
    -   **Dostępność:** Etykiety pól formularza.
    -   **Bezpieczeństwo:** Dostęp chroniony.
