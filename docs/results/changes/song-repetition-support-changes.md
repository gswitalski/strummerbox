# Wsparcie dla powtórzeń w edytorze piosenek

Dokument opisuje zmiany wprowadzone w celu obsługi dyrektyw powtórzeń w edytorze piosenek.

## 1. Historyjki użytkownika

### US-029: Definiowanie powtórzeń w tekście piosenki
-   **ID**: US-029
-   **Title**: Definiowanie powtórzeń w tekście piosenki
-   **Description**: Jako Organizator, podczas edycji piosenki, chcę móc w prosty sposób oznaczać powtarzające się linie tekstu lub sekwencje akordów, aby tworzyć bardziej zwięzłe i czytelne zapisy.
-   **Acceptance Criteria**:
    -   W edytorze piosenek, dodanie na końcu linii z akordami i/lub tekstem znacznika w formacie `xN` (gdzie N to liczba, np. `x2`, `x4`) jest interpretowane jako dyrektywa powtórzenia.
    -   W podglądzie "ChordPro", taka linia jest automatycznie konwertowana do standardowej dyrektywy ChordPro, np. `... {c: x2}`.
    -   W podglądzie "Biesiada" oraz w publicznym widoku piosenki, powtórzenie jest renderowane na końcu linii jako czytelny wskaźnik, np. `× 2`.
    -   Wskaźnik powtórzenia (`× 2`) jest wyświetlany czcionką o tym samym rozmiarze co tekst piosenki, ale w kolorze drugorzędnym z palety Angular Material (np. `secondary-text` lub `hint-text`), aby wizualnie odróżniał się od treści.
    -   Funkcjonalność działa zarówno dla linii zawierających tylko akordy (np. `C a d G x2`), jak i dla linii z tekstem i akordami (np. `Pieski małe dwa x2`).
    -   Podczas konwersji z formatu ChordPro do edytora, dyrektywa `{c: xN}` jest z powrotem zamieniana na prosty zapis `xN` na końcu linii.
    -   Niepoprawna składnia (np. brak liczby po `x`) jest traktowana jako zwykły tekst i nie jest konwertowana.

## 2. API

### Zmiany w API

Brak zmian w publicznym API.

### Uzasadnienie

Logika odpowiedzialna za parsowanie uproszczonej składni powtórzeń (np. "x2"), konwersję do formatu ChordPro ({c: x2}) oraz odpowiednie renderowanie w widoku Biesiada jest zaimplementowana w całości po stronie klienta (frontend). Takie podejście jest spójne z istniejącą architekturą, gdzie transpozycja i konwersja na ChordPro również odbywają się w przeglądarce. Backend traktuje treść piosenki jako nieprzezroczysty ciąg znaków, co eliminuje potrzebę modyfikacji endpointów, kontraktów DTO oraz schematu bazy danych.

## 3. Widoki

### Zmiany w istniejących komponentach

#### **Widok Tworzenia / Edycji Piosenki (`Song Create/Edit View`)**
-   **Zmiana**: Edytor tekstu został rozszerzony o wsparcie dla uproszczonej składni powtórzeń. Użytkownik może dodać na końcu linii znacznik `xN` (np. `x2`), który jest na żywo interpretowany i wyświetlany w panelu podglądu.

#### **`SongDisplayComponent`**
-   **Zmiana**: Komponent ten jest teraz odpowiedzialny za parsowanie dyrektywy ChordPro `{c: xN}` znajdującej się w treści piosenki.
-   **Nowe zachowanie**: Po wykryciu dyrektywy, komponent renderuje na końcu odpowiedniej linii wizualny wskaźnik powtórzenia w formacie `× N` (np. `× 2`).
-   **Styling**: Wskaźnik jest stylizowany zgodnie z nowymi wymaganiami: rozmiar czcionki jest identyczny jak tekst piosenki, a kolor pochodzi z palety tematycznej Angular Material (np. kolor dla tekstu drugorzędnego/podpowiedzi), aby zapewnić wizualne odróżnienie przy zachowaniu czytelności.
