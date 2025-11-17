# Zmiany w projekcie: Przełącznik widoku akordów dla publicznego użytkownika

Ten dokument podsumowuje zmiany wprowadzone w celu implementacji funkcjonalności przełączania widoczności akordów w publicznym widoku piosenki.

## 1. Historyjki użytkownika

### Nowa historyjka użytkownika

-   **ID**: US-024
-   **Title**: Włączenie widoku akordów przez Biesiadnika
-   **Description**: Jako Biesiadnik, który również gra na gitarze, przeglądając tekst piosenki w widoku publicznym, chcę mieć możliwość włączenia widoku akordów, aby móc zagrać utwór razem z innymi.
-   **Acceptance Criteria**:
    -   W publicznym widoku piosenki, w widocznym miejscu (np. w lewym górnym rogu) znajduje się przełącznik "Pokaż akordy".
    -   Domyślnie widok jest w trybie "tylko tekst".
    -   Po aktywacji przełącznika, tekst piosenki jest natychmiastowo przeliczany i wyświetlany w formacie z akordami (ChordPro), analogicznie do widoku Organizatora.
    -   Mogę w dowolnym momencie wyłączyć widok akordów, wracając do trybu "tylko tekst".
    -   Stan przełącznika jest zapamiętywany tylko na czas trwania sesji na danej stronie (nie musi być trwały).

### Zmodyfikowana historyjka użytkownika

-   **ID**: US-013
-   **Title**: Dostęp Biesiadnika do piosenki
-   **Opis zmiany**: Kryteria akceptacji zostały zaktualizowane, aby uwzględnić domyślny stan widoku oraz obecność nowego przełącznika.
-   **Nowe Acceptance Criteria**:
    -   Strona domyślnie wyświetla tylko tekst piosenki, bez akordów.
    -   Czcionka jest duża i czytelna, a tekst dopasowany do szerokości ekranu mobilnego.
    -   Strona nie zawiera żadnych elementów nawigacyjnych poza tekstem piosenki i przełącznikiem widoczności akordów.

## 2. API

Nie wprowadzono żadnych nowych endpointów. Zmieniono jednak kontrakt dwóch istniejących publicznych endpointów.

### Zmienione Endpointy

-   **Endpoint**: `GET /public/songs/{publicId}`
-   **Zmiana**: Pole `content` w odpowiedzi JSON **zawsze będzie zawierać pełną treść piosenki w formacie ChordPro (z akordami)**. Wcześniej zwracało treść bez akordów. Logika usuwania akordów została przeniesiona do klienta (frontend).

-   **Endpoint**: `GET /public/repertoires/{publicId}/songs/{songPublicId}`
-   **Zmiana**: Podobnie jak wyżej, pole `content` w odpowiedzi JSON **zawsze będzie zawierać pełną treść piosenki w formacie ChordPro (z akordami)**.

## 3. Widoki

### Nowy komponent reużywalny

-   **Nazwa**: `SongDisplayComponent`
-   **Opis**: Nowy, reużywalny komponent odpowiedzialny za renderowanie treści piosenki. Przyjmuje jako dane wejściowe pełną treść w formacie ChordPro oraz flagę `showChords: boolean`. Na podstawie flagi, komponent renderuje sam tekst lub tekst z poprawnie sformatowanymi akordami.
-   **Użycie**:
    -   `Public Song View` (dla Biesiadnika)
    -   `Biesiada Song View` (dla Organizatora)

### Zmieniony widok

-   **Nazwa**: `Publiczny Widok Piosenki (Public Song View)`
-   **Ścieżka**: `/public/songs/:publicId` oraz `/public/repertoires/:publicId/songs/:songPublicId`
-   **Opis zmiany**:
    -   Widok będzie teraz używał nowego komponentu `SongDisplayComponent`.
    -   W lewym górnym rogu zostanie dodany przełącznik (np. `mat-button-toggle-group` z opcjami "Tekst" / "Akordy"), który będzie sterował flagą `showChords` przekazywaną do `SongDisplayComponent`.
    -   Domyślnym stanem będzie widok bez akordów (`showChords: false`).

### Zmieniony widok

-   **Nazwa**: `Tryb Biesiada - Widok Piosenki (Biesiada Song View)`
-   **Ścieżka**: `/biesiada/repertoires/:id/songs/:songId`
-   **Opis zmiany**:
    -   Widok zostanie zrefaktoryzowany, aby również korzystać z nowego, reużywalnego komponentu `SongDisplayComponent`.
    -   Flaga `showChords` będzie na stałe ustawiona na `true`, ponieważ Organizator w tym trybie zawsze widzi akordy.
