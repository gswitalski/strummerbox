# Zmiany w projekcie: Dostosowanie wielkości czcionki

Data: 1 grudnia 2025

Ten dokument podsumowuje zmiany wprowadzone w dokumentacji projektu w celu dodania funkcjonalności dostosowywania wielkości czcionki w widokach piosenek.

## 1. Historyjki użytkownika (PRD)

### Nowa historyjka

-   **ID**: US-030
-   **Title**: Dostosowanie wielkości czcionki w widoku piosenki
-   **Description**: Jako Biesiadnik lub Organizator w trybie Biesiada, chcę móc powiększyć lub zmniejszyć tekst piosenki, aby dostosować go do moich potrzeb i warunków oświetleniowych.
-   **Acceptance Criteria**:
    -   W widoku piosenki (publicznym oraz Biesiada) widoczny jest zestaw trzech przycisków do zmiany wielkości czcionki.
    -   Przyciski są zrealizowane jako `mat-button-toggle-group` i oznaczone literą "A" w wizualnie różniących się rozmiarach (małym, średnim, dużym).
    -   Domyślnie wybrana jest najmniejsza wielkość czcionki (odpowiadająca `1rem`).
    -   Kliknięcie przycisku natychmiastowo zmienia rozmiar czcionki tekstu piosenki i akordów na jedną z predefiniowanych wartości: `1rem` (mały), `1.3rem` (średni), `1.6rem` (duży).
    -   Wybór użytkownika jest zapamiętywany w `localStorage` i automatycznie przywracany przy kolejnym otwarciu dowolnej piosenki na tym samym urządzeniu.

## 2. API

### Zmiany w planie API

-   **Brak zmian w API.**
-   **Uzasadnienie**: Funkcjonalność dostosowywania wielkości czcionki jest zaimplementowana w całości po stronie klienta. Preferencje użytkownika są przechowywane w `localStorage` przeglądarki. Takie podejście zapewnia natychmiastową odpowiedź interfejsu i nie wymaga żadnych zmian w API ani w schemacie bazy danych.

## 3. Widoki (UI Plan)

### Zaktualizowane widoki

#### **4b. Publiczny Widok Piosenki (Public Song View)**

-   **Kluczowe informacje**: Do toolbara, obok istniejących kontrolek, dodano przełącznik do zmiany wielkości czcionki.
-   **Kluczowe komponenty**: Dodano nowy komponent `FontSizeControlsComponent`, który jest używany wewnątrz `SongViewerComponent`.
-   **UX**: Użytkownik może w każdej chwili zmienić rozmiar czcionki, a jego wybór jest zapamiętywany na przyszłość w `localStorage`.

#### **13. Tryb Biesiada - Widok Piosenki (Biesiada Song View)**

-   **Kluczowe informacje**: Analogicznie do widoku publicznego, w toolbarze dodano kontrolki do zmiany wielkości czcionki.
-   **Kluczowe komponenty**: Wykorzystano ten sam nowy komponent `FontSizeControlsComponent`.
-   **UX**: Zapewniono spójne działanie z widokiem publicznym, w tym zapamiętywanie wybranego rozmiaru czcionki.

### Nowy komponent

-   **`FontSizeControlsComponent`**:
    -   **Opis**: Komponent prezentacyjny wyświetlający grupę trzech przycisków (`mat-button-toggle-group`) do zmiany wielkości czcionki. Jest w pełni sterowany z zewnątrz.
    -   **API**: `@Input() selectedSize: 'small' | 'medium' | 'large'`, `@Output() sizeChanged = new EventEmitter<'small' | 'medium' | 'large'>()`
    -   **Użycie**: Wewnętrznie używany przez `SongViewerComponent` w toolbarze.
    -   **Stan**: Do zaimplementowania.
