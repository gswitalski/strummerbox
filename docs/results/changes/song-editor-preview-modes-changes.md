# Zmiany: Tryby podglądu w edytorze piosenek

Ten dokument podsumowuje zmiany wprowadzone w celu dodania nowej funkcjonalności przełączania trybów podglądu w edytorze piosenek.

## 1. Historyjki użytkownika

### Nowe historyjki

-   **ID:** US-028
-   **Title:** Podgląd piosenki w trybie 'Biesiada' podczas edycji
-   **Description:** Jako Organizator, podczas edycji piosenki, chcę mieć możliwość przełączenia podglądu, aby zobaczyć, jak piosenka będzie wyglądać w docelowym formacie "akordy nad tekstem", tak jak zobaczą ją Biesiadnicy.
-   **Acceptance Criteria:**
    -   W widoku edycji piosenki, nad panelem podglądu, znajduje się przełącznik z opcjami "Podgląd ChordPro" i "Podgląd Biesiada".
    -   Domyślnie wybrany jest tryb "Podgląd ChordPro", który działa tak jak dotychczas, pokazując na żywo wygenerowany format ChordPro.
    -   Po przełączeniu na "Podgląd Biesiada", panel podglądu renderuje piosenkę przy użyciu komponentu `SongViewerComponent`, wyświetlając ją w formacie "akordy nad tekstem".
    -   Dane wejściowe dla "Podglądu Biesiada" pochodzą z dynamicznie generowanego w tle formatu ChordPro.
    -   W "Podglądzie Biesiada" nie są widoczne kontrolki transpozycji.
    -   Wybór trybu podglądu jest zapamiętywany w `localStorage` i jest zachowywany pomiędzy sesjami edycji różnych piosenek.

## 2. API

Brak zmian w API. Funkcjonalność została zaimplementowana w całości po stronie klienta (frontend).

Do dokumentu `API Plan` dodano jedynie notatkę informacyjną potwierdzającą ten fakt.

## 3. Widoki

### Zmodyfikowane widoki

#### **Widok 7. Tworzenie / Edycja Piosenki (Song Create/Edit View)**

-   **Ścieżka:** `/management/songs/new`, `/management/songs/:id/edit`
-   **Opis zmian:**
    -   Do panelu podglądu dodano przełącznik (`mat-button-toggle-group`) umożliwiający wybór jednego z dwóch trybów: "Podgląd ChordPro" i "Podgląd Biesiada".
    -   Tryb "Podgląd ChordPro" zachowuje dotychczasową funkcjonalność.
    -   Tryb "Podgląd Biesiada" renderuje piosenkę przy użyciu istniejącego komponentu `SongViewerComponent`, aby pokazać finalny wygląd utworu, tak jak w trybie Biesiada, ale bez opcji transpozycji.
    -   Wprowadzono mechanizm zapamiętywania wybranego trybu podglądu w `localStorage`, aby poprawić komfort pracy użytkownika przy edycji wielu piosenek.
