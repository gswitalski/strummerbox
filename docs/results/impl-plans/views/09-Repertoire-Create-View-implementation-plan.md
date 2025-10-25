# Plan implementacji widoku: Tworzenie Repertuaru (Repertoire Create View)

## 1. Przegląd

Celem tego widoku jest umożliwienie Organizatorowi szybkiego utworzenia nowego, pustego repertuaru. Interfejs zostanie zaimplementowany jako okno modalne (dialog), uruchamiane z widoku listy repertuarów. Użytkownik będzie mógł podać nazwę i opcjonalny opis, a po pomyślnym utworzeniu repertuaru zostanie automatycznie przekierowany do widoku jego edycji.

## 2. Routing widoku

Ten widok nie jest samodzielną stroną i nie posiada dedykowanej ścieżki routingu. Jest to komponent dialogowy (`MatDialog`), który będzie dynamicznie otwierany przez serwis `MatDialog` z poziomu `RepertoireListPageComponent` (lista repertuarów).

## 3. Struktura komponentów

Struktura będzie prosta i składać się z jednego, dedykowanego komponentu dialogowego.

```
RepertoireListPageComponent
    |
    - (wywołuje) -> MatDialog.open(RepertoireCreateDialogComponent)
                        |
                        +-- RepertoireCreateDialogComponent
                            |
                            +-- mat-dialog-title
                            +-- mat-dialog-content
                            |   +-- form
                            |       +-- mat-form-field (dla nazwy)
                            |       +-- mat-form-field (dla opisu)
                            +-- mat-dialog-actions
                                +-- button (Anuluj)
                                +-- button (Zapisz)
```

## 4. Szczegóły komponentów

### `RepertoireCreateDialogComponent`

-   **Opis komponentu**: Komponent implementowany jako Angular Material Dialog. Zawiera reaktywny formularz do wprowadzenia nazwy i opisu nowego repertuaru. Odpowiada za walidację danych wejściowych, komunikację z API w celu utworzenia zasobu oraz obsługę nawigacji po pomyślnym zakończeniu operacji.
-   **Główne elementy**:
    -   Nagłówek (`mat-dialog-title`) z tekstem "Stwórz nowy repertuar".
    -   Kontener treści (`mat-dialog-content`) z formularzem (`<form>`).
    -   Dwa pola formularza `mat-form-field`: jedno dla nazwy (`name`), drugie dla opisu (`description`).
    -   Kontener akcji (`mat-dialog-actions`) z dwoma przyciskami `mat-button`: "Anuluj" i "Zapisz".
-   **Obsługiwane interakcje**:
    -   Wpisywanie tekstu w pola formularza.
    -   Kliknięcie przycisku "Zapisz": waliduje i wysyła formularz.
    -   Kliknięcie przycisku "Anuluj" (lub klawisz Escape): zamyka dialog bez zapisu.
-   **Obsługiwana walidacja**:
    -   `name`:
        -   Pole wymagane (`Validators.required`).
        -   Minimalna długość: 1 znak (`Validators.minLength(1)`).
        -   Maksymalna długość: 160 znaków (`Validators.maxLength(160)`).
    -   Przycisk "Zapisz" jest nieaktywny, jeśli formularz jest niepoprawny.
-   **Typy**:
    -   DTO (Request): `RepertoireCreateCommand`
    -   DTO (Response): `RepertoireDto`
    -   ViewModel: `RepertoireCreateState` (do zarządzania stanem ładowania i błędów).
-   **Propsy**: Komponent nie przyjmuje propsów w standardowy sposób. Ewentualne dane konfiguracyjne mogą być przekazane przez `MatDialog.open()` w obiekcie `data`.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy z `packages/contracts/types.ts` oraz jeden lokalny typ dla zarządzania stanem.

-   **`RepertoireCreateCommand`**: Obiekt wysyłany do API.
    ```typescript
    // packages/contracts/types.ts
    export type RepertoireCreateCommand = {
        name: string;
        description?: string | null;
    };
    ```
-   **`RepertoireDto`**: Obiekt otrzymywany z API po pomyślnym utworzeniu. Kluczowe jest pole `id` do nawigacji.
    ```typescript
    // packages/contracts/types.ts
    export type RepertoireDto = {
        id: string;
        publicId: string;
        name: string;
        description: string | null;
        // ... inne pola
    };
    ```
-   **`RepertoireCreateState` (ViewModel)**: Lokalny interfejs do zarządzania stanem UI wewnątrz komponentu.
    ```typescript
    export interface RepertoireCreateState {
        isLoading: boolean;
        error: string | null;
    }
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane lokalnie w `RepertoireCreateDialogComponent` przy użyciu sygnałów Angulara.

-   **Formularz**: Stan pól formularza, ich wartości i status walidacji będą zarządzane przez `FormGroup` z modułu `@angular/forms`.
-   **Stan UI**: Dwa sygnały będą śledzić stan asynchronicznej operacji zapisu:
    -   `isLoading = signal<boolean>(false)`: Kontroluje wyświetlanie wskaźnika ładowania (np. na przycisku "Zapisz") i blokuje formularz podczas komunikacji z API.
    -   `apiError = signal<string | null>(null)`: Przechowuje komunikaty o błędach zwrócone przez API (np. o zduplikowanej nazwie), które będą wyświetlane w interfejsie.

## 7. Integracja API

Integracja z backendem będzie polegać na wywołaniu jednego endpointu.

-   **Endpoint**: `POST /repertoires`
-   **Akcja**: Po kliknięciu przycisku "Zapisz" i pomyślnej walidacji formularza, komponent wywoła metodę serwisu API (np. `RepertoiresApiService.createRepertoire`).
-   **Typ żądania**: `RepertoireCreateCommand`. Obiekt ten zostanie zbudowany na podstawie wartości z formularza.
-   **Typ odpowiedzi**: `RepertoireDto`. Po otrzymaniu odpowiedzi komponent użyje pola `id` do przekierowania użytkownika.

## 8. Interakcje użytkownika

-   **Otwarcie dialogu**: Użytkownik klika przycisk "Stwórz nowy repertuar" na liście repertuarów, co powoduje otwarcie okna modalnego.
-   **Wprowadzanie danych**: Użytkownik wypełnia pole "Nazwa" (wymagane) i "Opis" (opcjonalne). Przycisk "Zapisz" staje się aktywny dopiero po wprowadzeniu poprawnej nazwy.
-   **Anulowanie**: Użytkownik klika "Anuluj" lub zamyka okno, co kończy proces bez tworzenia repertuaru.
-   **Zapisywanie**: Użytkownik klika "Zapisz":
    -   **Pomyślnie**: Na przycisku pojawia się wskaźnik ładowania. Po otrzymaniu odpowiedzi z API, okno modalne jest zamykane, a aplikacja przechodzi pod adres `/management/repertoires/{nowe-id}/edit`.
    -   **Błąd**: Wskaźnik ładowania znika, a w oknie dialogowym pojawia się komunikat o błędzie (np. "Repertuar o tej nazwie już istnieje."). Użytkownik może poprawić dane i spróbować ponownie.

## 9. Warunki i walidacja

-   **Nazwa repertuaru**:
    -   **Warunek**: Musi być podana.
    -   **Walidacja (FE)**: `Validators.required`. Wpływa na atrybut `disabled` przycisku "Zapisz".
    -   **Warunek**: Długość od 1 do 160 znaków.
    -   **Walidacja (FE)**: `Validators.minLength(1)`, `Validators.maxLength(160)`. Komunikaty o błędach wyświetlane są przy polu formularza.
    -   **Warunek**: Musi być unikalna w obrębie konta organizatora.
    -   **Walidacja (BE)**: Obsługiwana przez API, które zwróci błąd `409 Conflict`. Frontend wyświetli odpowiedni komunikat błędu po otrzymaniu odpowiedzi.

## 10. Obsługa błędów

-   **Błędy walidacji (po stronie klienta)**: Obsługiwane przez Angular Reactive Forms. Komunikaty o błędach będą wyświetlane pod odpowiednimi polami po ich dotknięciu przez użytkownika (`touched`).
-   **Błąd zduplikowanej nazwy (`409 Conflict`)**: Po otrzymaniu tego statusu z API, sygnał `apiError` zostanie zaktualizowany komunikatem: "Repertuar o tej nazwie już istnieje.". Komunikat ten zostanie wyświetlony w widocznym miejscu w dialogu.
-   **Inne błędy API (`4xx`, `5xx`)**: W przypadku innych błędów serwera lub problemów z siecią, wyświetlony zostanie ogólny komunikat błędu, np.: "Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie.".
-   **Stan ładowania**: Podczas wysyłania żądania API przycisk "Zapisz" zostanie zablokowany, a w jego wnętrzu pojawi się komponent `mat-spinner`, aby poinformować użytkownika o trwającym procesie.

## 11. Kroki implementacji

1.  **Utworzenie komponentu**: Wygenerowanie nowego, samodzielnego komponentu `RepertoireCreateDialogComponent` za pomocą Angular CLI.
    ```bash
    ng generate component pages/repertoire-list/components/repertoire-create-dialog --standalone
    ```
2.  **Implementacja szablonu**: Zbudowanie struktury HTML komponentu z użyciem dyrektyw i komponentów Angular Material: `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`, `mat-form-field`, `mat-input`, `mat-button`.
3.  **Budowa formularza**: W klasie komponentu, z użyciem `FormBuilder`, stworzenie `FormGroup` z `FormControl` dla pól `name` i `description` oraz przypisanie odpowiednich walidatorów.
4.  **Aktualizacja serwisu API**: Dodanie metody `createRepertoire(command: RepertoireCreateCommand): Observable<RepertoireDto>` do istniejącego serwisu obsługującego repertuary (lub utworzenie nowego, jeśli nie istnieje). Metoda ta będzie wykonywać żądanie `POST /repertoires`.
5.  **Implementacja logiki zapisu**: Stworzenie metody `onSubmit()` w komponencie, która:
    -   Sprawdza poprawność formularza.
    -   Ustawia stan `isLoading` na `true`.
    -   Wywołuje metodę `createRepertoire` z serwisu API.
    -   W przypadku sukcesu: zamyka dialog (`dialogRef.close()`) i nawiguje do strony edycji (`router.navigate(...)`).
    -   W przypadku błędu: ustawia stan `isLoading` na `false` i aktualizuje sygnał `apiError` odpowiednim komunikatem.
6.  **Integracja z listą repertuarów**: W komponencie `RepertoireListPageComponent`:
    -   Wstrzyknięcie serwisu `MatDialog`.
    -   Stworzenie metody, która po kliknięciu przycisku "Stwórz nowy repertuar" otworzy `RepertoireCreateDialogComponent` za pomocą `dialog.open()`.
7.  **Stylowanie**: Dodanie niezbędnych stylów SCSS, aby zapewnić spójność wizualną z resztą aplikacji, zgodnie z wytycznymi Angular Material.
