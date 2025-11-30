# Plan implementacji widoku - Wsparcie dla repetycji w piosenkach

## 1. Przegląd

Celem tej implementacji jest rozszerzenie istniejącej funkcjonalności edytora piosenek o wsparcie dla uproszczonej składni repetycji. Użytkownik (Organizator) będzie mógł oznaczać powtarzające się linie tekstu i/lub akordów za pomocą znacznika `xN` (np. `x2`) na końcu linii. System automatycznie przekonwertuje ten znacznik do formatu ChordPro (`{c: xN}`) w celu zapisania w bazie danych, a następnie odpowiednio go zrenderuje (`× N`) we wszystkich widokach publicznych i w trybie "Biesiada". Zmiany obejmą głównie logikę serwisową oraz komponent wyświetlający treść piosenki.

## 2. Routing widoku

Nie są wprowadzane żadne nowe widoki ani zmiany w routingu. Modyfikacje dotyczą istniejących widoków:
-   `/management/songs/new`
-   `/management/songs/:id/edit`
-   Wszystkich widoków wykorzystujących `SongDisplayComponent` do renderowania piosenki (np. widok publiczny, podgląd, tryb Biesiada).

## 3. Struktura komponentów

Hierarchia komponentów pozostaje niezmieniona. Kluczowe modyfikacje zostaną wprowadzone w następujących elementach:

-   **`ChordConverterService`**: Centralny serwis, w którym zaimplementowana zostanie logika konwersji pomiędzy składnią `xN` a dyrektywą ChordPro `{c: xN}`.
-   **`SongDisplayComponent`**: Komponent prezentacyjny, który zostanie rozszerzony o logikę parsowania i renderowania dyrektywy `{c: xN}` jako wizualnego wskaźnika `× N`.

## 4. Szczegóły komponentów

### `ChordConverterService` (istniejący serwis)
-   **Opis komponentu**: Serwis odpowiedzialny za dwukierunkową konwersję pomiędzy formatem "akordy nad tekstem" (używanym w edytorze) a formatem ChordPro (zapisywanym w bazie danych).
-   **Nowa logika**:
    -   Metoda `convertToChordPro` zostanie zaktualizowana, aby wykrywać za pomocą wyrażenia regularnego znacznik `xN` na końcu linii i zamieniać go na dyrektywę `{c: xN}`.
    -   Metoda `convertToChordsOverText` zostanie zaktualizowana, aby wykrywać dyrektywę `{c: xN}` i zamieniać ją z powrotem na znacznik `xN`, który będzie wyświetlany w edytorze.
-   **Obsługiwane zdarzenia**: Brak.
-   **Warunki walidacji**: Serwis będzie traktował niepoprawną składnię (np. `x` bez liczby) jako zwykły tekst, ignorując konwersję.
-   **Typy**: Brak nowych typów.
-   **Propsy**: Nie dotyczy (serwis).

### `SongDisplayComponent` (istniejący komponent)
-   **Opis komponentu**: Komponent prezentacyjny odpowiedzialny za renderowanie treści piosenki na podstawie danych wejściowych w formacie ChordPro.
-   **Główne elementy**: Logika renderowania linii piosenki (np. wewnątrz `*ngFor` lub potoku `transform`).
-   **Nowa logika**:
    -   Logika renderująca zostanie zmodyfikowana, aby przed wyświetleniem linii przetworzyć ją w poszukiwaniu dyrektywy `{c: xN}`.
    -   Po znalezieniu dyrektywy, zostanie ona usunięta z oryginalnej linii, a na jej końcu zostanie dodany nowy element `<span>` zawierający wskaźnik repetycji w formacie `× N`.
-   **Styling**:
    -   Nowy element `<span>` ze wskaźnikiem repetycji otrzyma dedykowaną klasę CSS.
    -   W pliku SCSS komponentu zostanie zdefiniowany styl dla tej klasy, ustawiający kolor tekstu na drugorzędny kolor z palety Angular Material (np. `var(--mat-sys-color-on-surface-variant)`), przy zachowaniu tego samego rozmiaru czcionki co reszta tekstu.
-   **Obsługiwane zdarzenia**: Brak.
-   **Warunki walidacji**: Brak.
-   **Typy**: Brak nowych typów.
-   **Propsy**: Komponent nadal będzie przyjmował te same propsy: `@Input() content: string`, `@Input() showChords: boolean`, `@Input() transposeOffset: number`.

## 5. Typy

Implementacja nie wymaga wprowadzania żadnych nowych typów DTO ani ViewModel. Operacje będą wykonywane na istniejącym typie `string`, który przechowuje treść piosenki w formacie ChordPro.

## 6. Zarządzanie stanem

Nie są wymagane żadne zmiany w globalnym zarządzaniu stanem. Logika konwersji będzie bezstanowa i zamknięta w `ChordConverterService`. Stan edytora (treść wpisywana przez użytkownika) pozostaje lokalnym stanem formularza w komponencie `SongCreateEditComponent`.

## 7. Integracja API

Nie są wymagane żadne zmiany w integracji z API. Frontend będzie nadal wysyłał i odbierał treść piosenki jako pojedynczy ciąg znaków w polu `content` w ramach istniejących DTO (`SongCreateCommand`, `SongDto` etc.).

## 8. Interakcje użytkownika

-   **Organizator w edytorze**: Wpisuje tekst piosenki, a na końcu linii, którą chce powtórzyć, dodaje znacznik `x` i liczbę (np. `x2`, `x3`).
-   **Podgląd na żywo (ChordPro)**: Panel podglądu ChordPro natychmiastowo pokazuje linię ze znacznikiem skonwertowanym do formatu `{c: x2}`.
-   **Podgląd na żywo (Biesiada)**: Panel podglądu "Biesiada" renderuje linię, a na jej końcu wyświetla czytelny wskaźnik `× 2`.
-   **Zapis piosenki**: Po zapisaniu, treść w formacie ChordPro (z dyrektywą `{c: ...}`) jest zapisywana w bazie danych.
-   **Przeglądanie piosenki**: W każdym widoku (publicznym, Biesiada, podgląd) piosenka jest wyświetlana ze wskaźnikiem `× 2` na końcu powtarzanych linii.

## 9. Warunki i walidacja

-   **Walidacja składni `xN`**: Odbywa się niejawnie za pomocą wyrażenia regularnego w `ChordConverterService`. Wyrażenie będzie dopasowywać `x` po którym następuje jedna lub więcej cyfr, znajdujące się na samym końcu linii (poprzedzone opcjonalnym białym znakiem).
-   **Przypadki niepoprawnej składni**: Jeśli użytkownik wpisze tekst, który nie pasuje do wzorca (np. `extra`, `x`, `x 2`), będzie on traktowany jako zwykły tekst i nie zostanie poddany konwersji. Nie będą wyświetlane żadne komunikaty o błędach.

## 10. Obsługa błędów

Główne ryzyko leży w implementacji wyrażeń regularnych. Należy je dokładnie przetestować pod kątem przypadków brzegowych, takich jak:
-   Linie zawierające słowa kończące się na `x` (np. `complex`).
-   Znacznik repetycji nie na końcu linii.
-   Wielokrotne znaczniki w jednej linii.
Prawidłowo skonstruowane wyrażenie regularne (np. `/\s(x\d+)$/` dla `xN` oraz `/\{c:\s*x(\d+)\s*\}/` dla ChordPro) powinno obsłużyć te przypadki i zapobiec błędom.

## 11. Kroki implementacji

1.  **Modyfikacja `ChordConverterService`**:
    -   Zaktualizuj metodę `convertToChordPro`, dodając logikę, która znajduje wzorzec `xN` na końcu każdej linii i zamienia go na dyrektywę `{c: xN}`.
    -   Zaktualizuj metodę `convertToChordsOverText`, dodając logikę, która znajduje dyrektywę `{c: xN}` i zamienia ją z powrotem na `xN`.
    -   Dodaj testy jednostkowe dla serwisu, obejmujące nowe przypadki użycia, w tym poprawną konwersję, ignorowanie nieprawidłowej składni i przypadki brzegowe.

2.  **Modyfikacja `SongDisplayComponent`**:
    -   W logice renderującej komponentu, dodaj krok przetwarzania każdej linii tekstu. Użyj wyrażenia regularnego, aby wykryć i wyodrębnić dyrektywę `{c: xN}`.
    -   Jeśli dyrektywa zostanie znaleziona, usuń ją z oryginalnej linii i zapisz liczbę powtórzeń.
    -   W szablonie HTML komponentu, po wyświetleniu przetworzonej linii, dodaj warunkowo (`@if`) element `<span>` ze wskaźnikiem `× N`, jeśli dla danej linii wykryto powtórzenie.

3.  **Styling w `SongDisplayComponent`**:
    -   Dodaj klasę CSS do nowego elementu `<span>`, np. `repetition-marker`.
    -   W pliku `song-display.component.scss`, zdefiniuj styl dla `.repetition-marker`, używając zmiennych z palety Angular Material, aby ustawić odpowiedni kolor (np. `color: var(--mat-sys-color-on-surface-variant);`).

4.  **Testowanie manualne**:
    -   Przejdź do widoku tworzenia/edycji piosenki.
    -   Sprawdź, czy wpisanie `x2` na końcu linii z samymi akordami, samymi słowami oraz z akordami i słowami poprawnie aktualizuje oba podglądy (`ChordPro` i `Biesiada`).
    -   Zapisz piosenkę, a następnie otwórz ją w widoku publicznym oraz w trybie Biesiada, aby zweryfikować, czy wskaźnik `× 2` jest poprawnie renderowany i ostylowany.
    -   Wróć do edycji piosenki i upewnij się, że w edytorze ponownie widoczny jest znacznik `x2`.
