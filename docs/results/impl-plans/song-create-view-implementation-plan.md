# Plan implementacji widoku: Tworzenie nowej piosenki

## 1. Przegląd
Celem tego widoku jest umożliwienie zalogowanemu użytkownikowi (Organizatorowi) dodania nowej piosenki do jego prywatnej biblioteki. Widok będzie zawierał formularz z polem na tytuł piosenki oraz edytor tekstu wspierający format ChordPro. Kluczową funkcjonalnością jest podgląd renderowanej piosenki w czasie rzeczywistym, który dostosowuje swój układ w zależności od rozmiaru ekranu (side-by-side na desktopie, zakładki na mobile).

## 2. Routing widoku
-   **Ścieżka:** `/management/songs/new`
-   **Ochrona:** Widok musi być chroniony przez `AuthGuard`, aby dostęp do niego mieli wyłącznie zalogowani użytkownicy. W przypadku próby wejścia przez osobę niezalogowaną, użytkownik powinien zostać przekierowany na stronę logowania (`/login`).

## 3. Struktura komponentów
Widok zostanie zbudowany w oparciu o architekturę komponentów kontenerowych i prezentacyjnych, aby oddzielić logikę od prezentacji.

```
- SongCreatePageComponent (Kontener)
  |- SongFormComponent (Prezentacyjny)
  |- ChordProPreviewComponent (Prezentacyjny)
```

-   `SongCreatePageComponent`: Główny komponent-kontener strony, dostępny pod zdefiniowaną ścieżką. Odpowiada za zarządzanie stanem, komunikację z API, obsługę logiki biznesowej oraz koordynację komponentów podrzędnych.
-   `SongFormComponent`: Reużywalny komponent formularza, który zawiera pola do wpisania tytułu i treści piosenki. Odpowiada za walidację i emitowanie danych.
-   `ChordProPreviewComponent`: Reużywalny komponent odpowiedzialny za parsowanie i wyświetlanie sformatowanego tekstu piosenki z akordami na podstawie surowego ciągu znaków w formacie ChordPro.

## 4. Szczegóły komponentów

### `SongCreatePageComponent`
-   **Opis komponentu:** Komponent ten jest sercem widoku. Inicjalizuje formularz, nasłuchuje na zmiany w nim w celu aktualizacji podglądu, obsługuje akcję zapisu, komunikuje się z serwisem API i zarządza stanem ładowania oraz błędów. Implementuje również logikę responsywnego layoutu.
-   **Główne elementy:**
    -   Nagłówek strony (np. `<h1>Dodaj nową piosenkę</h1>`).
    -   Przyciski akcji: "Zapisz" i "Anuluj".
    -   Kontener na komponenty `SongFormComponent` i `ChordProPreviewComponent`.
    -   Wskaźnik ładowania (`mat-progress-bar` lub `mat-spinner`), widoczny podczas operacji zapisu.
    -   Miejsce na wyświetlanie komunikatów o błędach.
-   **Obsługiwane interakcje:**
    -   `onSave()`: Wywoływana po kliknięciu przycisku "Zapisz". Uruchamia walidację i wysyła dane do API.
    -   `onCancel()`: Przerywa proces tworzenia i nawiguje użytkownika z powrotem do listy piosenek (`/management/songs`).
-   **Typy:**
    -   `SongCreateCommand`: DTO używane do wysłania żądania do API.
    -   `SongDto`: DTO oczekiwane w odpowiedzi od API.
-   **Propsy:** Brak (jest to komponent routowany).

### `SongFormComponent`
-   **Opis komponentu:** Komponent prezentacyjny zawierający `ReactiveForm` (`FormGroup`) do zarządzania danymi piosenki.
-   **Główne elementy:**
    -   `form[formGroup]`: Główny element formularza.
    -   `mat-form-field` z `mat-label` dla tytułu.
    -   `input[matInput]` dla pola `title`.
    -   `mat-form-field` z `mat-label` dla treści piosenki.
    -   `textarea[matInput]` dla pola `content` z obsługą `cdkTextareaAutosize`.
    -   Komunikaty walidacyjne `mat-error`.
-   **Obsługiwane zdarzenia:**
    -   `formValueChange`: Emituje aktualną wartość formularza przy każdej zmianie (do podglądu na żywo).
-   **Warunki walidacji:**
    -   `title`:
        -   Wymagane (`Validators.required`).
        -   Maksymalna długość 180 znaków (`Validators.maxLength(180)`).
    -   `content`:
        -   Wymagane (`Validators.required`).
-   **Typy:** `SongCreateFormViewModel`.
-   **Propsy:**
    -   `initialState: Partial<SongCreateFormViewModel>`: Opcjonalny stan początkowy formularza (przydatne przy edycji).
    -   `isSaving: boolean`: Informuje formularz o trwającym procesie zapisu (można go użyć do zablokowania pól).

### `ChordProPreviewComponent`
-   **Opis komponentu:** Komponent wyświetla sformatowany tekst piosenki. Parsuje ciąg znaków w formacie ChordPro, identyfikując akordy w nawiasach `[]` i umieszczając je wizualnie nad odpowiednimi fragmentami tekstu.
-   **Główne elementy:**
    -   Kontener `div` z odpowiednią klasą CSS.
    -   Dynamicznie generowane elementy `span` lub podobne do wyświetlania tekstu i akordów.
-   **Obsługiwane zdarzenia:** Brak.
-   **Warunki walidacji:** Brak.
-   **Typy:** Brak.
-   **Propsy:**
    -   `content: string`: Surowy tekst piosenki w formacie ChordPro do przetworzenia.

## 5. Typy

### `SongCreateFormViewModel`
Model widoku reprezentujący strukturę danych w formularzu reaktywnym.
```typescript
export interface SongCreateFormViewModel {
  title: string;
  content: string;
}
```

### Typy DTO (z `packages/contracts/types.ts`)
-   **Żądanie:** `SongCreateCommand`
    ```typescript
    export type SongCreateCommand = {
      title: string;
      content: string;
      published?: boolean; // Domyślnie false
    };
    ```
-   **Odpowiedź:** `SongDto`
    ```typescript
    export type SongDto = {
      id: string;
      publicId: string;
      title: string;
      content: string;
      publishedAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    ```

## 6. Zarządzanie stanem
Stan widoku (np. `isSaving`, `error`) będzie zarządzany lokalnie w komponencie `SongCreatePageComponent`. Wstrzyknięty zostanie serwis `SongsApiService`, który będzie odpowiedzialny za komunikację z backendem.

-   **Zmienne stanu w `SongCreatePageComponent`:**
    -   `isSaving = new BehaviorSubject<boolean>(false)`: Flaga informująca o trwającej operacji zapisu.
    -   `error = new BehaviorSubject<string | null>(null)`: Przechowuje komunikaty o błędach z API.
    -   `songForm: FormGroup`: Formularz reaktywny.

## 7. Integracja API
Integracja z API będzie realizowana poprzez dedykowany serwis (np. `SongsApiService`), który będzie wstrzykiwany do komponentu kontenerowego.

-   **Endpoint:** `POST /songs`
-   **Akcja:** W momencie wysłania formularza, serwis wywoła metodę `http.post`.
-   **Typ żądania:** `SongCreateCommand`
-   **Typ odpowiedzi:** `SongDto`
-   **Przepływ:**
    1.  `SongCreatePageComponent` wywołuje `songsApiService.createSong(command)`.
    2.  Serwis wysyła żądanie `POST` na `/api/songs` z ciałem żądania typu `SongCreateCommand`.
    3.  W przypadku sukcesu (status 201), serwis zwraca `Observable<SongDto>`.
    4.  W przypadku błędu, serwis przechwytuje błąd i zwraca `Observable` z błędem, który jest obsługiwany w komponencie.

## 8. Interakcje użytkownika
-   **Wpisywanie tekstu w formularzu:** Zmiany w polu `content` są natychmiastowo odzwierciedlane w komponencie `ChordProPreviewComponent`. Warto zastosować `debounceTime` na `valueChanges` pola `content`, aby uniknąć problemów z wydajnością przy długich tekstach.
-   **Kliknięcie "Zapisz":**
    -   Jeśli formularz jest niepoprawny, przycisk jest nieaktywny.
    -   Jeśli jest poprawny, przycisk jest aktywny. Po kliknięciu:
        -   `isSaving` ustawiane jest na `true`.
        -   Przycisk "Zapisz" i pola formularza zostają zablokowane.
        -   Pojawia się wskaźnik ładowania.
-   **Zakończenie zapisu (sukces):**
    -   `isSaving` ustawiane jest na `false`.
    -   Wyświetlany jest komunikat o sukcesie (np. `MatSnackBar`).
    -   Użytkownik jest przekierowywany na listę piosenek (`/management/songs`).
-   **Zakończenie zapisu (błąd):**
    -   `isSaving` ustawiane jest na `false`.
    -   Wskaźnik ładowania znika, a formularz zostaje odblokowany.
    -   W widocznym miejscu wyświetlany jest odpowiedni komunikat błędu.

## 9. Warunki i walidacja
-   **Przycisk "Zapisz"**: Jest zablokowany (`disabled`), gdy formularz jest niepoprawny (`songForm.invalid`) lub trwa zapis (`isSaving | async`).
-   **Pole `title`**:
    -   Wymagane: Wyświetla błąd "Tytuł jest wymagany", jeśli pole jest puste.
    -   Maksymalna długość: Wyświetla błąd "Tytuł może mieć maksymalnie 180 znaków".
-   **Pole `content`**:
    -   Wymagane: Wyświetla błąd "Treść piosenki jest wymagana", jeśli pole jest puste.
-   **Błąd konfliktu (`409 Conflict`)**: Jeśli API zwróci błąd 409, formularz powinien wyświetlić błąd przy polu `title`: "Piosenka o takim tytule już istnieje". Można to osiągnąć za pomocą `form.get('title')?.setErrors({ unique: true })`.

## 10. Obsługa błędów
-   **Błędy walidacji (400):** Komponent wyświetli ogólny komunikat o błędzie, np. "Nieprawidłowe dane. Sprawdź formularz i spróbuj ponownie."
-   **Konflikt nazwy (409):** Jak opisano powyżej, błąd zostanie przypisany do kontrolki `title`.
-   **Błędy serwera (5xx):** Wyświetlony zostanie ogólny komunikat: "Wystąpił błąd serwera. Prosimy spróbować ponownie później."
-   **Brak autoryzacji (401/403):** Globalny `HttpInterceptor` powinien przechwycić ten błąd i przekierować użytkownika na stronę logowania.
-   Wszystkie komunikaty powinny być przyjazne dla użytkownika i wyświetlane w spójny sposób, np. za pomocą dedykowanego komponentu `AlertComponent` lub `MatSnackBar`.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:** Stworzenie folderu `src/app/pages/song-create` oraz plików dla komponentu `SongCreatePageComponent`.
2.  **Routing:** Dodanie nowej ścieżki `/management/songs/new` do pliku `app.routes.ts`, wskazującej na `SongCreatePageComponent` i zabezpieczonej przez `AuthGuard`.
3.  **Implementacja `SongCreatePageComponent`:**
    -   Stworzenie layoutu HTML z nagłówkiem i przyciskami akcji.
    -   Implementacja logiki responsywnej (side-by-side/tabs) przy użyciu Angular Material CDK `BreakpointObserver`.
    -   Zainicjowanie `ReactiveForm` (`songForm`).
    -   Implementacja metod `onSave()` i `onCancel()`.
4.  **Implementacja `SongFormComponent`:**
    -   Stworzenie szablonu HTML z polami `mat-form-field` dla `title` i `content`.
    -   Dodanie `FormGroup` jako propsa i powiązanie kontrolek.
    -   Implementacja logiki walidacji i wyświetlania błędów.
5.  **Implementacja `ChordProPreviewComponent`:**
    -   Stworzenie logiki do parsowania tekstu (np. za pomocą `ngOnChanges` i prostej funkcji z Regex).
    -   Ostylowanie komponentu, aby akordy wyświetlały się poprawnie nad tekstem.
6.  **Stworzenie `SongsApiService`:**
    -   Dodanie metody `createSong(command: SongCreateCommand): Observable<SongDto>`.
    -   Wstrzyknięcie `HttpClient` i wykonanie żądania `POST`.
7.  **Integracja i obsługa stanu:**
    -   Wstrzyknięcie `SongsApiService` do `SongCreatePageComponent`.
    -   Implementacja pełnej logiki zapisu w metodzie `onSave()`, włączając obsługę stanu `isSaving` i `error`.
    -   Połączenie `valueChanges` formularza z `ChordProPreviewComponent` (z `debounceTime`).
8.  **Nawigacja i powiadomienia:**
    -   Wstrzyknięcie `Router` i `MatSnackBar` do `SongCreatePageComponent`.
    -   Implementacja przekierowania po pomyślnym zapisie.
    -   Implementacja wyświetlania powiadomień o sukcesie i błędach.
9.  **Stylowanie:** Dopracowanie wyglądu widoku zgodnie z resztą aplikacji, w tym responsywności.
10. **Testy jednostkowe:** Napisanie testów dla logiki komponentu `SongCreatePageComponent`, walidacji w `SongFormComponent` oraz logiki parsowania w `ChordProPreviewComponent`.
