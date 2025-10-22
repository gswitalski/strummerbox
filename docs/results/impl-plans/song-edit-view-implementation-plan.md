# Plan implementacji widoku: Edycja Piosenki

## 1. Przegląd
Widok "Edycja Piosenki" umożliwia zalogowanemu użytkownikowi (Organizatorowi) modyfikację tytułu oraz treści istniejącej piosenki. Widok ten będzie współdzielił większość swojej struktury i logiki z widokiem tworzenia nowej piosenki, aby zapewnić reużywalność kodu. Kluczowym elementem jest formularz z edytorem tekstu wspierającym format ChordPro oraz podglądem na żywo renderowanej piosenki.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką URL, która zawiera unikalny identyfikator piosenki.

- **Ścieżka:** `/management/songs/:id/edit`
- **Ochrona:** Dostęp do tej ścieżki będzie chroniony przez `AuthGuard`, zapewniając, że tylko zalogowani użytkownicy mogą z niej korzystać.

## 3. Struktura komponentów
Hierarchia komponentów zostanie zaprojektowana z myślą o reużywalności, oddzielając logikę zarządzania stanem (komponent-kontener) od logiki prezentacji (komponent formularza).

```
SongEditPageComponent (Kontener/Smart Component)
│
└── SongFormComponent (Prezentacyjny/Dumb Component)
    ├── MatFormField (dla tytułu)
    ├── Textarea (dla treści ChordPro)
    └── ChordProPreviewComponent (do podglądu)
```

- **`SongEditPageComponent`**: Komponent-kontener odpowiedzialny za komunikację z serwisami, pobieranie danych piosenki na podstawie `:id` z URL, obsługę zapisu zmian oraz nawigację.
- **`SongFormComponent`**: Reużywalny komponent prezentacyjny zawierający sam formularz, logikę walidacji pól oraz układ UI (side-by-side/zakładki). Będzie używany zarówno w widoku tworzenia, jak i edycji.
- **`ChordProPreviewComponent`**: Reużywalny komponent renderujący tekst w formacie ChordPro jako sformatowany HTML.

## 4. Szczegóły komponentów

### `SongEditPageComponent`
- **Opis:** Główny komponent widoku edycji. Jego zadaniem jest załadowanie danych piosenki, przekazanie ich do formularza, a następnie obsługa akcji zapisu zainicjowanej przez użytkownika.
- **Główne elementy:**
    - Wykorzystuje `ActivatedRoute` do pobrania `id` piosenki.
    - Wstrzykuje `SongService` do pobierania i aktualizacji danych.
    - Wyświetla wskaźnik ładowania (`mat-spinner`), gdy dane są pobierane.
    - Renderuje komponent `<app-song-form>` i przekazuje do niego dane.
    - Obsługuje stany błędu (np. gdy piosenka o danym ID nie istnieje).
- **Obsługiwane interakcje:**
    - `(save)` z `SongFormComponent`: Uruchamia metodę aktualizacji piosenki w `SongService`. Po pomyślnej aktualizacji, nawiguje użytkownika z powrotem do listy piosenek i wyświetla powiadomienie o sukcesie (`MatSnackBar`).
    - `(cancel)` z `SongFormComponent`: Nawiguje użytkownika z powrotem do listy piosenek bez zapisywania zmian.
- **Typy:**
    - `SongDto` jako model danych piosenki.
    - `SongPatchCommand` jako payload do aktualizacji.
- **Propsy (wejścia):** Brak.

### `SongFormComponent`
- **Opis:** Reużywalny, "głupi" komponent formularza. Odpowiada za wyświetlanie pól, walidację danych wejściowych i emitowanie zdarzeń do rodzica. Nie komunikuje się bezpośrednio z serwisami API.
- **Główne elementy:**
    - Formularz oparty na `ReactiveFormsModule` (`FormGroup`).
    - Pole `matInput` dla tytułu piosenki.
    - `textarea` dla treści piosenki.
    - Logika do przełączania widoku między układem "side-by-side" (desktop) a zakładkami `mat-tab-group` (mobile), wykorzystująca `BreakpointObserver`.
    - Komponent `<app-chord-pro-preview>` do wyświetlania podglądu.
    - Przyciski "Zapisz" i "Anuluj".
- **Obsługiwane interakcje:**
    - Emisja zdarzenia `(save)` z wartościami formularza po kliknięciu przycisku "Zapisz".
    - Emisja zdarzenia `(cancel)` po kliknięciu przycisku "Anuluj".
- **Obsługiwana walidacja:**
    - `title`: pole wymagane (`Validators.required`), maksymalna długość 180 znaków (`Validators.maxLength(180)`).
    - `content`: pole wymagane (`Validators.required`).
    - Przycisk "Zapisz" jest nieaktywny (`disabled`), dopóki formularz nie jest poprawny i "czysty" (`pristine`).
- **Typy:** `SongDto`, `SongPatchCommand`, `FormGroup`.
- **Propsy (wejścia):**
    - `@Input() initialData: SongDto | null`: Dane piosenki do wypełnienia formularza.
    - `@Input() isSaving: boolean = false`: Flaga informująca, czy trwa operacja zapisu (do blokowania przycisku).
    - `@Input() serverError: { field: string, message: string } | null`: Błąd z serwera do przypisania do konkretnego pola (np. o duplikacie tytułu).

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy z `packages/contracts/types.ts`. Nie ma potrzeby tworzenia nowych typów.

- **`SongDto`**: Pełny obiekt piosenki, używany do wypełnienia formularza.
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
- **`SongPatchCommand`**: Obiekt wysyłany w ciele żądania `PATCH`, zawierający tylko te pola, które mogą być aktualizowane.
  ```typescript
  export type SongPatchCommand = Partial<Pick<SongUpdate, 'title' | 'content'>>;
  ```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `SongEditPageComponent`.

- **Ładowanie danych:** Komponent będzie utrzymywał flagę `isLoading: boolean`, która będzie `true` w trakcie wywołania API `GET /songs/:id`. Na jej podstawie UI będzie wyświetlać `mat-spinner`.
- **Stan formularza:** Zarządzany przez `ReactiveFormsModule` w `SongFormComponent`.
- **Obsługa błędów:** Komponent będzie przechowywał stan błędu (np. `error: string | null`), aby wyświetlić odpowiedni komunikat, jeśli pobieranie danych się nie powiedzie (np. błąd 404).
- Nie ma potrzeby tworzenia dedykowanego, globalnego stanu (np. w NgRx) dla tego widoku, ponieważ dane są specyficzne dla jednej, konkretnej piosenki i nie muszą być współdzielone w czasie rzeczywistym z innymi częściami aplikacji.

## 7. Integracja API
Integracja będzie opierać się na dwóch endpointach API, do których odwołania będą realizowane poprzez dedykowany `SongService`.

- **Pobieranie danych piosenki:**
    - **Endpoint:** `GET /songs/{id}`
    - **Akcja:** Wywoływany w `ngOnInit` komponentu `SongEditPageComponent`.
    - **Odpowiedź:** `Observable<SongDto>`. Otrzymane dane posłużą do wypełnienia formularza za pomocą metody `form.patchValue()`.

- **Aktualizacja piosenki:**
    - **Endpoint:** `PATCH /songs/{id}`
    - **Akcja:** Wywoływany po emisji zdarzenia `(save)` z `SongFormComponent`.
    - **Typ żądania (Request Body):** `SongPatchCommand`
    - **Odpowiedź:** `Observable<SongDto>`. Sukces operacji spowoduje nawigację do listy piosenek.

## 8. Interakcje użytkownika
- **Użytkownik wchodzi na stronę:** Aplikacja wyświetla loader, pobiera dane piosenki i wypełnia nimi formularz.
- **Użytkownik edytuje tytuł/treść:** Zmiany są odzwierciedlane w modelu formularza. Podgląd piosenki w `ChordProPreviewComponent` aktualizuje się w czasie rzeczywistym. Przycisk "Zapisz" staje się aktywny.
- **Użytkownik klika "Zapisz":**
    - Jeśli formularz jest nieprawidłowy, wyświetlane są komunikaty walidacyjne.
    - Jeśli formularz jest prawidłowy, przycisk "Zapisz" jest blokowany, a do API wysyłane jest żądanie `PATCH`.
- **Użytkownik klika "Anuluj":** Następuje natychmiastowe przekierowanie do listy piosenek, a zmiany są odrzucane.

## 9. Warunki i walidacja
- **Walidacja po stronie klienta (w `SongFormComponent`):**
    - **Tytuł:**
        - Warunek: Musi być podany.
        - Komunikat: "Tytuł jest wymagany."
        - Warunek: Długość nie może przekraczać 180 znaków.
        - Komunikat: "Tytuł nie może być dłuższy niż 180 znaków."
    - **Treść:**
        - Warunek: Musi być podana.
        - Komunikat: "Treść piosenki jest wymagana."
- **Walidacja po stronie serwera (obsługa w `SongEditPageComponent`):**
    - **Konflikt tytułu (błąd 409):** Serwer zwraca błąd, jeśli piosenka o danym tytule już istnieje. Komponent `SongEditPageComponent` przechwytuje ten błąd i przekazuje go do `SongFormComponent` przez `@Input() serverError`, aby wyświetlić komunikat przy polu `title`: "Piosenka o tym tytule już istnieje."

## 10. Obsługa błędów
- **Piosenka nie znaleziona (GET zwraca 404):** `SongEditPageComponent` wyświetli komunikat "Nie znaleziono piosenki" oraz przycisk pozwalający wrócić do listy piosenek. Formularz nie będzie w ogóle renderowany.
- **Błędy walidacji (PATCH zwraca 409):** Jak opisano w sekcji "Walidacja".
- **Inne błędy serwera (5xx) lub brak połączenia:** `SongEditPageComponent` wyświetli globalny komunikat błędu za pomocą `MatSnackBar` (np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."). Stan `isSaving` w formularzu zostanie zresetowany do `false`.

## 11. Kroki implementacji
1.  **Utworzenie `SongEditPageComponent`**: Stworzenie komponentu za pomocą Angular CLI (`ng g c pages/song-edit`).
2.  **Routing**: Dodanie nowej ścieżki `/management/songs/:id/edit` w pliku `app.routes.ts`, kierującej do `SongEditPageComponent` i zabezpieczonej przez `AuthGuard`.
3.  **Implementacja pobierania danych**: W `SongEditPageComponent`, wstrzyknięcie `ActivatedRoute` i `SongService`. W `ngOnInit` zaimplementowanie logiki pobierania `id` z trasy i wywołania metody `songService.getSong(id)`.
4.  **Refaktoryzacja/Utworzenie `SongFormComponent`**: Wydzielenie logiki formularza z istniejącego komponentu tworzenia piosenki do nowego, reużywalnego `SongFormComponent`. Zdefiniowanie `@Input()` i `@Output()` zgodnie z planem.
5.  **Integracja `SongFormComponent`**: Umieszczenie `<app-song-form>` w szablonie `SongEditPageComponent` i przekazanie pobranych danych do `[initialData]`. Zaimplementowanie obsługi zdarzeń `(save)` i `(cancel)`.
6.  **Implementacja logiki aktualizacji**: W `SongEditPageComponent`, w metodzie obsługującej `(save)`, wywołanie `songService.updateSong(id, command)`.
7.  **Obsługa stanu ładowania i błędów**: Dodanie logiki do wyświetlania `mat-spinner` oraz obsługi błędów 404 i 5xx.
8.  **Nawigacja i powiadomienia**: Wstrzyknięcie `Router` i `MatSnackBar` do `SongEditPageComponent` w celu przekierowania użytkownika i wyświetlania komunikatów o sukcesie lub błędzie.
9.  **Stylowanie i responsywność**: Upewnienie się, że `SongFormComponent` poprawnie przełącza się między układem side-by-side a zakładkami na różnych szerokościach ekranu.
