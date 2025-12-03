# Zmiany w Funkcjonalności Powtórzeń Wielowierszowych

Data: 3 grudnia 2025

Ten dokument podsumowuje zmiany wprowadzone w dokumentacji projektu StrummerBox w celu dodania nowej funkcjonalności obsługi powtórzeń wielowierszowych.

## 1. Historyjki Użytkownika (PRD)

Do dokumentu PRD dodano nową historyjkę użytkownika, aby opisać wymagania z perspektywy Organizatora.

### Nowa Historyjka Użytkownika

-   **ID:** US-032
-   **Title:** Definiowanie wielowierszowych bloków powtórzeń
-   **Description:** Jako Organizator, chcę móc oznaczać całe sekcje piosenki (np. zwrotkę z refrenem) jako powtarzające się, aby zapis był bardziej przejrzysty i zorganizowany.
-   **Acceptance Criteria:**
    -   W edytorze piosenek, dodanie na końcu ostatniej linii bloku znacznika w formacie `xN(L)` (np. `x2(4)` dla powtórzenia 4 ostatnich wierszy 2 razy) jest interpretowane jako dyrektywa powtórzenia wielowierszowego.
    -   W podglądzie "ChordPro", taka składnia jest konwertowana do bloku dyrektyw `{block_start: xN}` i `{block_end}`.
    -   W podglądzie "Biesiada" oraz w widoku publicznym, cały blok powtórzenia (zarówno jedno-, jak i wielowierszowy) jest wizualnie oznaczony pionową linią po prawej stronie.
    -   Pionowa linia ma taki sam kolor jak wskaźnik powtórzenia (`× N`).
    -   Wskaźnik powtórzenia (`× N`) jest wyświetlany przy ostatnim wierszu bloku.
    -   Podczas konwersji z formatu ChordPro do edytora, blok dyrektyw `{block_start: xN}` i `{block_end}` jest z powrotem zamieniany na prosty zapis `xN(L)` na końcu ostatniej linii.

## 2. API

Zgodnie z wymaganiami, nowa funkcjonalność została zaprojektowana w taki sposób, aby jej implementacja odbyła się w całości po stronie klienckiej, bez konieczności wprowadzania zmian w API.

### Adnotacja w Planie API

W dokumencie `API Plan.md` dodano następującą adnotację, aby to wyjaśnić:

> **Note on Multi-line Repeats Handling:** The feature allowing users to define multi-line repeating blocks using simplified syntax (e.g., `x2(4)`) which translates to the ChordPro `{block_start: xN}` and `{block_end}` directives is implemented entirely on the client-side. The API is not aware of this syntax and treats the song `content` as an opaque string, requiring no changes to backend endpoints.

## 3. Widoki (UI)

Zaktualizowano Plan UI, aby odzwierciedlić zmiany w interfejsie edytora piosenek oraz w komponencie odpowiedzialnym za ich wyświetlanie.

### Zmiany w Widoku Tworzenia / Edycji Piosenki

-   **Ścieżka:** `/management/songs/new`, `/management/songs/:id/edit`
-   **Opis zmiany:**
    -   Zaktualizowano sekcję `UX` w opisie widoku. Edytor tekstu wspiera teraz uproszczoną składnię do definiowania powtórzeń jednowierszowych (np. `x2`) oraz wielowierszowych (np. `x2(3)`). Podgląd na żywo w trybach 'ChordPro' i 'Biesiada' natychmiastowo odzwierciedla interpretację tej składni.

### Zmiany w Komponencie `SongDisplayComponent`

-   **Opis zmiany:**
    -   Zaktualizowano opis komponentu, aby uwzględnić jego nową odpowiedzialność. Komponent jest teraz odpowiedzialny za parsowanie i renderowanie dyrektyw powtórzeń ChordPro, zarówno jednowierszowych (`{c: xN}`), jak i wielowierszowych (`{block_start: xN}` / `{block_end}`). Bloki powtórzeń są wizualnie oznaczane pionową linią po prawej stronie oraz wskaźnikiem `× N` przy ostatnim wierszu bloku, stylizowanymi zgodnie z wytycznymi.
