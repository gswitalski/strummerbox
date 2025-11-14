# Plan implementacji funkcji importu piosenki z tekstu

## 1. Przegląd

Celem jest rozszerzenie istniejącego widoku tworzenia i edycji piosenki o funkcjonalność importu. Użytkownik (Organizator) będzie mógł wkleić tekst piosenki w formacie "akordy nad tekstem" do dedykowanego okna modalnego, a aplikacja automatycznie przekonwertuje go do formatu ChordPro i dołączy do edytowanej treści. Funkcjonalność ta ma na celu znaczne przyspieszenie procesu dodawania nowych utworów do biblioteki. Cała operacja konwersji odbywa się w całości po stronie klienta (w przeglądarce).

## 2. Routing widoku

Funkcjonalność zostanie zintegrowana z istniejącymi widokami, więc nie wprowadza nowych ścieżek. Będzie dostępna w ramach:

-   `/management/songs/new`
-   `/management/songs/:id/edit`

## 3. Struktura komponentów

Struktura opiera się na dodaniu nowego komponentu-dialogu, który będzie wywoływany z poziomu istniejącego widoku edycji piosenki.

```
/src/app/pages/management/songs/pages/song-edit/
|-- song-edit.component.ts
|-- song-edit.component.html  // <-- Tutaj zostanie dodany przycisk "Importuj z tekstu"

/src/app/pages/management/songs/components/import-from-text-dialog/
|-- import-from-text-dialog.component.ts // <-- Nowy komponent (dialog)
|-- import-from-text-dialog.component.html
```

## 4. Szczegóły komponentów

### `SongEditComponent` (Modyfikacja)

-   **Opis komponentu:** Istniejący komponent-strona, odpowiedzialny za formularz tworzenia i edycji piosenki. Zostanie rozszerzony o logikę otwierania dialogu importu i obsługi zwróconych przez niego danych.
-   **Główne elementy (nowe):**
    -   `button mat-stroked-button` z etykietą "Importuj z tekstu" i ikoną `file_upload`.
-   **Obsługiwane zdarzenia:**
    -   Kliknięcie przycisku "Importuj z tekstu" otworzy `ImportFromTextDialogComponent` za pomocą serwisu `MatDialog`.
    -   Po zamknięciu dialogu, komponent odbierze przekonwertowany tekst i dołączy go do istniejącej wartości w polu formularza `content`, oddzielając nową treść znakiem nowej linii.
-   **Typy:** `MatDialog` (serwis), `FormControl` (dla pola `content`).
-   **Propsy:** Brak.

### `ImportFromTextDialogComponent` (Nowy)

-   **Opis komponentu:** Komponent modalny (dialog) uruchamiany z `SongEditComponent`. Jego celem jest zebranie tekstu od użytkownika, uruchomienie logiki konwertującej i zwrócenie wyniku.
-   **Główne elementy:**
    -   `mat-dialog-title`: Tytuł, np. "Importuj piosenkę z tekstu".
    -   `mat-dialog-content`: Zawiera pole tekstowe `textarea` na całą wysokość, gdzie użytkownik wkleja tekst piosenki.
    -   `mat-dialog-actions`: Zawiera dwa przyciski:
        -   `button mat-button` (Anuluj) - zamyka dialog bez zwracania danych.
        -   `button mat-raised-button color="primary"` (Importuj) - uruchamia konwersję i zamyka dialog, zwracając przekonwertowany tekst.
-   **Obsługiwane zdarzenia:**
    -   Kliknięcie "Anuluj": Wywołuje `dialogRef.close()`.
    -   Kliknięcie "Importuj": Wywołuje serwis `ChordConverterService` do przetworzenia tekstu z `textarea`, a następnie `dialogRef.close(convertedText)`.
-   **Warunki walidacji:** Przycisk "Importuj" jest nieaktywny (`disabled`), jeśli pole `textarea` jest puste.
-   **Typy:** `MatDialogRef`, `MAT_DIALOG_DATA`, `FormControl`, `ChordConverterService`.
-   **Propsy:** Brak. Komponent jest samodzielny.

### `ChordConverterService` (Nowy)

-   **Opis serwisu:** Nowy, reużywalny serwis (`@Injectable({ providedIn: 'root' })`) zawierający czystą logikę biznesową do konwersji tekstu. Odizolowanie tej logiki ułatwi testowanie i ewentualne ponowne użycie w przyszłości.
-   **Metody publiczne:**
    -   `convertFromChordsOverText(text: string): string`: Przyjmuje tekst w formacie "akordy nad tekstem" i zwraca go w formacie ChordPro.
-   **Logika:** Metoda będzie iterować po liniach tekstu, parując linie z akordami z odpowiadającymi im liniami tekstu i wstawiając akordy w nawiasach kwadratowych `[]` w odpowiednich miejscach.

## 5. Typy

Implementacja nie wymaga wprowadzania nowych typów danych (DTO/ViewModel). Operacje odbywają się na typie `string`.

## 6. Zarządzanie stanem

Zarządzanie stanem odbywa się lokalnie w komponentach przy użyciu `FormControl` z `ReactiveFormsModule`.

-   **`SongEditComponent`**: Posiada `FormGroup` z `FormControl` o nazwie `content`, który przechowuje aktualną treść piosenki w formacie ChordPro.
-   **`ImportFromTextDialogComponent`**: Posiada własny, lokalny `FormControl` powiązany z polem `textarea` do przechowywania tekstu wklejonego przez użytkownika. Stan ten jest niszczony wraz z zamknięciem dialogu.

Nie ma potrzeby stosowania globalnego zarządcy stanu (np. NgRx) dla tej funkcji.

## 7. Integracja API

Ta funkcja nie wymaga bezpośredniej integracji z żadnym nowym punktem końcowym API. Wszystkie operacje są wykonywane po stronie klienta. Wynik działania funkcji (zaktualizowana treść piosenki) zostanie wysłany do API dopiero w momencie, gdy użytkownik zapisze cały formularz w `SongEditComponent`, korzystając z istniejących już mechanizmów.

## 8. Interakcje użytkownika

1.  Użytkownik w widoku edycji piosenki klika przycisk "Importuj z tekstu".
2.  Na ekranie pojawia się okno modalne `ImportFromTextDialogComponent`.
3.  Użytkownik wkleja tekst piosenki (z akordami w linii powyżej tekstu) do pola `textarea`.
4.  Użytkownik klika przycisk "Importuj".
5.  Logika w `ChordConverterService` przetwarza tekst.
6.  Okno modalne zamyka się.
7.  Przekonwertowany tekst pojawia się na końcu treści w głównym edytorze piosenki.
8.  Podgląd piosenki na żywo w `SongEditComponent` automatycznie się odświeża, pokazując nowo dodaną treść.
9.  (Scenariusz alternatywny) Użytkownik klika "Anuluj" - okno modalne zamyka się bez wprowadzania żadnych zmian.

## 9. Warunki i walidacja

-   **Komponent `ImportFromTextDialogComponent`**: Przycisk "Importuj" pozostaje nieaktywny, dopóki użytkownik nie wprowadzi jakiejkolwiek treści do pola `textarea`.

## 10. Obsługa błędów

Logika konwersji w `ChordConverterService` powinna być odporna na niestandardowe formatowanie tekstu wejściowego. W przypadku napotkania nieoczekiwanego formatu (np. dwie linie akordów pod rząd), serwis powinien podjąć próbę "najlepszego dopasowania" zamiast zwracać błąd. Ponieważ jest to narzędzie pomocnicze, nie jest wymagane wyświetlanie użytkownikowi szczegółowych komunikatów o błędach parsowania. Najgorszym scenariuszem jest niepoprawnie sformatowany wynik, który użytkownik może ręcznie poprawić w edytorze.

## 11. Kroki implementacji

1.  **Stworzenie serwisu konwertującego:**
    -   Utworzyć plik `/src/app/core/services/chord-converter.service.ts`.
    -   Zaimplementować w nim klasę `ChordConverterService` z publiczną metodą `convertFromChordsOverText(text: string): string`.
    -   Zaimplementować logikę konwersji tekstu.
    -   Dodać podstawowe testy jednostkowe dla serwisu w pliku `chord-converter.service.spec.ts`, aby zweryfikować poprawność konwersji dla typowych przypadków.
2.  **Stworzenie komponentu dialogu:**
    -   Wygenerować nowy, samodzielny komponent: `ng g c pages/management/songs/components/import-from-text-dialog --standalone`.
    -   W pliku `.html` zbudować strukturę dialogu przy użyciu komponentów Angular Material (`mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`, `textarea`, `mat-button`).
    -   W pliku `.ts` dodać `ReactiveFormsModule` i `MatDialogModule` do `imports`. Wstrzyknąć `MatDialogRef` i zaimplementować `FormControl` dla `textarea`.
    -   Dodać logikę dla przycisków "Anuluj" i "Importuj", wykorzystując `ChordConverterService`.
    -   Powiązać stan `FormControl` z atrybutem `[disabled]` przycisku "Importuj".
3.  **Integracja z widokiem edycji piosenki:**
    -   W `song-edit.component.html` dodać przycisk "Importuj z tekstu".
    -   W `song-edit.component.ts` wstrzyknąć serwis `MatDialog`.
    -   Stworzyć metodę, która będzie wywoływana po kliknięciu przycisku. Metoda ta powinna otwierać `ImportFromTextDialogComponent`.
    -   Zasubskrybować się do `dialogRef.afterClosed()`, aby odebrać wynik.
    -   Zaimplementować logikę dołączania otrzymanego tekstu do `FormControl` o nazwie `content`. Należy sprawdzić, czy `content` ma już jakąś wartość – jeśli tak, dodać nową linię przed dołączeniem nowej treści.
4.  **Styling i finalizacja:**
    -   Dostosować style `textarea` w dialogu, aby zajmowała dostępną przestrzeń.
    -   Upewnić się, że wszystkie nowe elementy interfejsu są zgodne z systemem projektowym aplikacji i są w pełni responsywne.
