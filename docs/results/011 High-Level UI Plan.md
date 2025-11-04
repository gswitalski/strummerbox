# Architektura UI dla StrummerBox

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji StrummerBox została zaprojektowana w oparciu o framework Angular 19 oraz bibliotekę komponentów Angular Material. Struktura jest w pełni responsywna i opiera się na dwóch głównych trybach pracy, które odpowiadają dwóm kluczowym rolom użytkowników:

1.  **Organizator (użytkownik uwierzytelniony):** Posiada dostęp do dwóch głównych sekcji w ramach jednego, spójnego layoutu z nawigacją boczną (`mat-sidenav`):
    *   **Panel Zarządzania:** Zoptymalizowany dla komputerów stacjonarnych (ale responsywny) interfejs do zarządzania biblioteką piosenek i repertuarów (operacje CRUD).
    *   **Tryb Biesiada:** Uproszczony, zoptymalizowany dla urządzeń mobilnych widok do prowadzenia spotkania, z dostępem do piosenek z akordami i opcją szybkiego udostępniania.

2.  **Biesiadnik (użytkownik anonimowy):** Interfejs jest minimalistyczny, dostępny przez bezpośrednie linki publiczne i zaprojektowany w podejściu "mobile-first". Umożliwia przeglądanie tekstów piosenek bez akordów oraz nawigację w ramach udostępnionego repertuaru.

Zarządzanie stanem aplikacji będzie realizowane za pomocą serwisów Angulara (`@Injectable`), które będą buforować dane pobrane z API przy użyciu `BehaviorSubject`. Globalna obsługa błędów HTTP oraz wskaźników ładowania zostanie zaimplementowana przy pomocy `HttpInterceptor`, a ochrona tras dla zalogowanych użytkowników przez `CanActivate` guard.

## 2. Lista widoków

### Widoki Publiczne (Dla Gości i Niezalogowanych Organizatorów)

---

#### **1. Widok Logowania (Login View)**

*   **Ścieżka:** `/login`
*   **Główny cel:** Umożliwienie Organizatorowi zalogowania się do aplikacji.
*   **Kluczowe informacje:** Formularz z polami na e-mail i hasło.
*   **Kluczowe komponenty:** `mat-card`, `mat-form-field`, `mat-input`, `mat-button`, `mat-progress-bar`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Wyraźne komunikaty o błędach walidacji (np. "Nieprawidłowy e-mail") i błędach logowania (np. "Błędne dane logowania"). Po pomyślnym zalogowaniu użytkownik jest przekierowywany do Dashboardu. Przycisk logowania jest nieaktywny, dopóki formularz nie jest poprawny.
    *   **Dostępność:** Etykiety (`aria-label`) dla pól formularza, obsługa nawigacji klawiaturą.
    *   **Bezpieczeństwo:** Komunikacja z API przez HTTPS.

---

#### **2. Widok Rejestracji (Register View)**

*   **Ścieżka:** `/register` - wejscie do ściezki poprzez dodanie dodatkowego przycisku "Zarejestruj się" na formularzu logowania
*   **Główny cel:** Umożliwienie nowemu Organizatorowi założenia konta.
*   **Kluczowe informacje:** Formularz z polami na e-mail, nick (displayName) i hasło (z potwierdzeniem).
*   **Kluczowe komponenty:** Takie same jak w Widoku Logowania.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Walidacja hasła (np. minimalna długość) i jego potwierdzenia po stronie klienta. Komunikaty o błędach (np. "Konto o tym adresie e-mail już istnieje"). Po sukcesie użytkownik jest automatycznie logowany i przekierowywany do Dashboardu.
    *   **Dostępność:** Jak w widoku logowania.
    *   **Bezpieczeństwo:** Jak w widoku logowania.

---

#### **3. Publiczny Widok Repertuaru (Public Repertoire View)**

*   **Ścieżka:** `/public/repertoires/:publicId`
*   **Główny cel:** Wyświetlenie listy piosenek zawartych w udostępnionym repertuarze dla Biesiadnika.
*   **Kluczowe informacje:** Nazwa i opis repertuaru, uporządkowana lista piosenek (tylko tytuły).
*   **Kluczowe komponenty:** `mat-list` z `mat-list-item`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty, czytelny widok zoptymalizowany dla urządzeń mobilnych. Kliknięcie w tytuł piosenki przenosi do Publicznego Widoku Piosenki używając ścieżki /public/repertoires/:publicId/songs/:songPublicId.
    *   **Dostępność:** Duża, czytelna czcionka.
    *   **Bezpieczeństwo:** Widok jest publiczny, ale zawiera metatag `noindex, nofollow`, aby uniemożliwić indeksowanie przez wyszukiwarki.

---

#### **4. Publiczny Widok Piosenki (Public Song View)**

*   **Ścieżka:** `/public/songs/:publicId` oraz `/public/repertoires/:publicId/songs/:songPublicId`
*   **Główny cel:** Wyświetlenie tekstu piosenki Biesiadnikowi.
*   **Kluczowe informacje:** Tytuł piosenki, treść piosenki (bez akordów), przyciski nawigacyjne "Następna" / "Poprzednia" (jeśli piosenka jest częścią repertuaru).
*   **Kluczowe komponenty:** Prosty kontener na tekst, `mat-button` dla nawigacji.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Minimalistyczny interfejs skupiony na tekście. Duża, czytelna czcionka, automatyczne dopasowanie do szerokości ekranu. Przyciski nawigacji są nieaktywne, jeśli użytkownik jest na pierwszej/ostatniej piosence w repertuarze.
    *   **Dostępność:** Wysoki kontrast tekstu i tła.
    *   **Bezpieczeństwo:** Jak w Publicznym Widoku Repertuaru.

---

### Widoki Chronione (Dla Zalogowanego Organizatora)

---

#### **5. Dashboard**

*   **Ścieżka:** `/dashboard`
*   **Główny cel:** Strona startowa po zalogowaniu, zapewniająca szybki przegląd i dostęp do kluczowych akcji.
*   **Napis powitalny oraz przyciski szybkiego dostępu ("Dodaj nową piosenkę", "Stwórz nowy repertuar").
*   **Kluczowe komponenty:** `mat-button` do akcji.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty i przejrzysty punkt startowy.
    *   **Dostępność:** Nagłówki (`<h1>`, `<h2>`) do strukturyzacji treści.
    *   **Bezpieczeństwo:** Dostęp chroniony przez `CanActivate` guard.

---

#### **6. Lista Piosenek (Song List View)**

*   **Ścieżka:** `/management/songs`
*   **Główny cel:** Umożliwienie Organizatorowi przeglądania, wyszukiwania i zarządzania swoją biblioteką piosenek.
*   **Kluczowe informacje:** Lista piosenek (na desktopie tabela, na mobile karty) z tytułem i datą modyfikacji. Pole wyszukiwania. Przycisk "Dodaj nową piosenkę". Opcje dla każdej piosenki: "Edytuj", "Usuń", "Udostępnij". Każda piosenka po klikneciu na status zienia staus z 'Szkic' na 'Opublikowana' i na odwrót.
*   **Kluczowe komponenty:** `mat-table` / `mat-card`, `mat-form-field` (dla wyszukiwania), `mat-paginator`, `mat-icon-button`, `EmptyStateComponent`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Obsługa pustego stanu (gdy brak piosenek). Wyszukiwanie w czasie rzeczywistym. Potwierdzenie akcji usunięcia w oknie modalnym. Wskaźnik ładowania (`MatSpinner`) podczas pobierania danych.
    *   **Dostępność:** Nagłówki tabeli (`<th>`), opisy przycisków ikonowych (`aria-label`).
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **7. Tworzenie / Edycja Piosenki (Song Create/Edit View)**

*   **Ścieżka:** `/management/songs/new`, `/management/songs/:id/edit`
*   **Główny cel:** Dodawanie nowej lub modyfikacja istniejącej piosenki.
*   **Kluczowe informacje:** Formularz z polem na tytuł piosenki, edytor tekstu dla treści w formacie ChordPro. Podgląd renderowanej piosenki na żywo.
*   **Kluczowe komponenty:** `mat-form-field`, `textarea`, `mat-button`, niestandardowy komponent edytora "side-by-side".
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Na desktopie układ "side-by-side" (edycja po lewej, podgląd po prawej). Na mobile układ z zakładkami (`mat-tab-group`) do przełączania się między edycją a podglądem. Walidacja (np. unikalność tytułu, poprawność nawiasów `[]`) z komunikatami błędów.
    *   **Dostępność:** Etykiety pól formularza.
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **8. Lista Repertuarów (Repertoire List View)**

*   **Ścieżka:** `/management/repertoires`
*   **Główny cel:** Umożliwienie Organizatorowi przeglądania i zarządzania swoimi repertuarami.
*   **Kluczowe informacje:** Lista repertuarów z nazwą, liczbą piosenek. Przycisk "Stwórz nowy repertuar". Opcje dla każdego repertuaru: "Edytuj", "Usuń", "Udostępnij".
*   **Kluczowe komponenty:** Podobne do Listy Piosenek, w tym `ConfirmationDialogComponent`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:**
        *   Obsługa pustego stanu (gdy brak repertuarów) za pomocą `EmptyStateComponent`.
        *   Kliknięcie przycisku "Stwórz nowy repertuar" otwiera okno modalne do wpisania nazwy, a po zatwierdzeniu przekierowuje do widoku edycji.
        *   Kliknięcie przycisku "Usuń" przy wybranym repertuarze otwiera okno modalne (`ConfirmationDialogComponent`) z prośbą o potwierdzenie. Po zatwierdzeniu przez użytkownika, repertuar jest usuwany, a lista zostaje odświeżona. Wskaźnik ładowania (`MatSpinner`) jest widoczny podczas komunikacji z API.
    *   **Dostępność:** Nagłówki tabeli (`<th>`), opisy przycisków ikonowych (`aria-label`).
    *   **Bezpieczeństwo:** Dostęp chroniony przez `CanActivate` guard.

---

#### **9. Tworzenie Repertuaru (Repertoire Create View)**

*   **Ścieżka:** Wywoływany jako okno modalne z widoku listy repertuarów.
*   **Główny cel:** Umożliwienie szybkiego stworzenia nowego, pustego repertuaru.
*   **Kluczowe informacje:** Prosty formularz w oknie modalnym (`mat-dialog`) z polem na nazwę i opcjonalny opis repertuaru.
*   **Kluczowe komponenty:** `MatDialog`, `mat-form-field`, `mat-input`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Po zatwierdzeniu formularza (podaniu nazwy), w bazie danych tworzony jest nowy repertuar z pustą listą piosenek. Aplikacja natychmiastowo przekierowuje użytkownika do widoku edycji tego nowo utworzonego repertuaru (`/management/repertoires/:id/edit`). Przycisk "Zapisz" jest nieaktywny, dopóki nazwa nie zostanie wprowadzona.
    *   **Dostępność:** Poprawne etykiety dla pól formularza, obsługa klawiatury w oknie modalnym.
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **10. Edycja Repertuaru (Repertoire Edit View)**

*   **Ścieżka:** `/management/repertoires/:id/edit`
*   **Główny cel:** Zarządzanie zawartością istniejącego repertuaru: zmiana nazwy/opisu, dodawanie/usuwanie piosenek, zmiana ich kolejności.
*   **Kluczowe informacje:**
    *   **Nazwa i opis repertuaru:** Wyświetlane domyślnie jako tekst (read-only). Kliknięcie na nie przełącza je w tryb edycji ("in-place edit") z ikonami do zatwierdzenia (`✓`) lub anulowania (`✗`) zmiany.
    *   **Zarządzanie piosenkami:** Dwie listy – po lewej piosenki już dodane do repertuaru, po prawej wszystkie dostępne piosenki z biblioteki użytkownika. Przyciski do dodawania/usuwania piosenek.
    *   **Kolejność piosenek:** Możliwość zmiany kolejności piosenek na liście po lewej stronie za pomocą przeciągania i upuszczania (`drag-and-drop`).
*   **Kluczowe komponenty:** `mat-form-field` (w trybie edycji), `mat-list`, `DragDropModule`, `mat-icon-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Każda akcja (zmiana nazwy/opisu, dodanie/usunięcie piosenki, zmiana kolejności) jest natychmiastowo zapisywana w bazie danych za pomocą dedykowanego wywołania API (np. `PATCH`). Nie ma globalnego przycisku "Zapisz". Interfejs powinien informować o stanie zapisu (np. przez chwilowe wyświetlenie wskaźnika ładowania przy edytowanym elemencie).
    *   **Dostępność:** Etykiety i instrukcje dla interaktywnych elementów listy, obsługa klawiatury dla funkcji "in-place edit".
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **11. Tryb Biesiada - Lista Repertuarów (Biesiada Repertoire List View)**

*   **Ścieżka:** `/biesiada/repertoires`
*   **Główny cel:** Uproszczony widok listy repertuarów dla Organizatora w trakcie wydarzenia.
*   **Kluczowe informacje:** Lista repertuarów (nazwa, liczba piosenek).
*   **Kluczowe komponenty:** `mat-list` lub `mat-card` w mobilnym układzie.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Duże, łatwe do kliknięcia elementy listy, zoptymalizowane pod kątem obsługi dotykowej. Kliknięcie w repertuar przenosi użytkownika do nowego "Widoku Listy Piosenek w Repertuarze" (`/biesiada/repertoires/:id`).
    *   **Dostępność:** Duża czcionka, wysoki kontrast.
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **12. Tryb Biesiada - Lista Piosenek w Repertuarze (Biesiada Repertoire's Song List View)**

*   **Ścieżka:** `/biesiada/repertoires/:id`
*   **Główny cel:** Wyświetlenie listy piosenek z wybranego repertuaru, umożliwiając Organizatorowi nawigację podczas biesiady.
*   **Kluczowe informacje:** Nazwa repertuaru, uporządkowana lista piosenek. Przycisk nawigacji powrotnej do listy repertuarów.
*   **Kluczowe komponenty:** `mat-toolbar` z przyciskiem "wstecz", `mat-list` z `mat-list-item`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty widok listy piosenek. Kliknięcie w tytuł piosenki przenosi do widoku piosenki w trybie biesiada. Przycisk "wstecz" w nagłówku pozwala na powrót do listy wszystkich repertuarów (`/biesiada/repertoires`).
    *   **Dostępność:** Duża, czytelna czcionka.
    *   **Bezpieczeństwo:** Dostęp chroniony.

---

#### **13. Tryb Biesiada - Widok Piosenki (Biesiada Song View)**

*   **Ścieżka:** `/biesiada/repertoires/:id/songs/:songId`
*   **Główny cel:** Wyświetlenie Organizatorowi piosenki z akordami podczas prowadzenia biesiady.
*   **Kluczowe informacje:** Tytuł, treść piosenki z akordami, przyciski nawigacyjne "Następna" / "Poprzednia", przycisk "Pokaż kod QR". Przycisk nawigacji powrotnej do listy piosenek.
*   **Kluczowe komponenty:** `mat-toolbar` z przyciskiem "wstecz", `mat-fab` (pływający przycisk akcji) do wyświetlania QR, `mat-dialog` do wyświetlania kodu QR.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Interfejs skupiony na czytelności tekstu. Pływający przycisk akcji (`FAB`) nie zasłania treści. Kliknięcie w niego otwiera modal z dużym, czytelnym kodem QR. Przycisk "wstecz" w nagłówku pozwala na powrót do listy piosenek w repertuarze (`/biesiada/repertoires/:id`).
    *   **Dostępność:** Wysoki kontrast, duża czcionka.
    *   **Bezpieczeństwo:** Dostęp chroniony.

## 3. Mapa podróży użytkownika

#### Scenariusz 1: Organizator przygotowuje repertuar na ognisko.

1.  **Logowanie:** Użytkownik otwiera stronę, zostaje przekierowany na `/login`. Wpisuje dane i trafia na `/dashboard`.
2.  **Dodawanie Piosenek:** Z bocznej nawigacji przechodzi do `/management/songs`. Klika "Dodaj piosenkę", co prowadzi go na `/management/songs/new`. Wpisuje tytuł i treść, zapisuje, wraca do listy. Powtarza proces dla kilku piosenek.
3.  **Tworzenie Repertuaru:** Przechodzi do `/management/repertoires`. Klika "Stwórz repertuar". Otwiera mu się okno modalne, w którym wpisuje nazwę repertuaru i zatwierdza.
4.  **Edycja Repertuaru:** Po zatwierdzeniu modala zostaje automatycznie przekierowany na stronę edycji `/management/repertoires/:id/edit`. Z listy piosenek po prawej stronie dodaje utwory do swojego nowego repertuaru. Następnie, używając funkcji "przeciągnij i upuść", ustawia ich właściwą kolejność.
5.  **Udostępnianie:** Klika przycisk "Udostępnij". W oknie modalnym pojawia się publiczny link oraz kod QR do repertuaru.

#### Scenariusz 2: Biesiadnik dołącza do śpiewania.

1.  **Skanowanie Kodu:** Biesiadnik skanuje telefonem kod QR wyświetlony przez Organizatora.
2.  **Przeglądanie Repertuaru:** W przeglądarce otwiera mu się strona `/public/repertoires/:publicId`, na której widzi listę piosenek.
3.  **Wyświetlanie Piosenki:** Klika tytuł pierwszej piosenki. Przechodzi na stronę `/public/repertoires/:publicId/songs/:songPublicId`.
4.  **Nawigacja:** Czyta tekst. Gdy piosenka się kończy, używa przycisku "Następna", aby płynnie przejść do kolejnego utworu, bez potrzeby wracania do listy.

#### Scenariusz 3: Organizator prowadzi śpiewanie podczas biesiady.

1.  **Wejście w Tryb Biesiada:** Organizator, zalogowany na swoim urządzeniu mobilnym, wybiera z bocznej nawigacji link "Moje Biesiady" i przechodzi na stronę `/biesiada/repertoires`.
2.  **Wybór Repertuaru:** Na ekranie widzi listę swoich repertuarów. Wybiera ten przygotowany na dzisiejsze spotkanie, co przenosi go na stronę `/biesiada/repertoires/:id`.
3.  **Wybór Piosenki:** Widzi teraz listę piosenek w ramach wybranego repertuaru. Wybiera pierwszą piosenkę z listy, przechodząc na stronę `/biesiada/repertoires/:id/songs/:songId`.
4.  **Prowadzenie Śpiewania:** Na ekranie wyświetla mu się tekst piosenki wraz z akordami. Po zakończeniu utworu, używa przycisku "Następna", by przejść do kolejnej piosenki.
5.  **Udostępnianie:** W trakcie imprezy podchodzi nowa osoba. Organizator klika pływający przycisk "Pokaż kod QR", aby wyświetlić duży kod na ekranie, który nowa osoba może łatwo zeskanować.
6.  **Zmiana Repertuaru:** W razie potrzeby, używając przycisku "wstecz" w nagłówku, wraca do listy piosenek, a następnie do listy repertuarów, aby zmienić aktualnie używany repertuar.

## 4. Układ i struktura nawigacji

*   **Layout Główny (Chroniony):** Aplikacja dla zalogowanego użytkownika opiera się na komponencie `DefaultLayout`, który zawiera `mat-toolbar` u góry i kontener `mat-sidenav-container`.
    *   **`mat-sidenav` (Panel Boczny):** Jest to główna nawigacja. Na desktopie jest stale widoczna. Na mobile jest ukryta i wysuwana za pomocą przycisku "hamburger".
    *   **Struktura Menu:**
        *   Nagłówek: **Panel Zarządzania**
            *   Link: `Dashboard` (ikona `dashboard`) -> `/dashboard`
            *   Link: `Piosenki` (ikona `music_note`) -> `/management/songs`
            *   Link: `Repertuary` (ikona `library_music`) -> `/management/repertoires`
        *   Separator (`mat-divider`)
        *   Nagłówek: **Tryb Biesiada**
            *   Link: `Moje Biesiady` (ikona `outdoor_grill`) -> `/biesiada/repertoires`
        *   W stopce panelu:
            *   Link: `Profil` / `Wyloguj`
*   **Layout Publiczny:** Brak stałej nawigacji. Użytkownicy podążają za linkami.

## 5. Kluczowe komponenty

Poniższe komponenty będą reużywalne i wykorzystywane w wielu miejscach aplikacji w celu zapewnienia spójności i unikania powielania kodu.

*   **`EmptyStateComponent`:**
    *   **Opis:** Komponent wyświetlany, gdy lista (np. piosenek, repertuarów) jest pusta. Zawiera ikonę, komunikat (np. "Nie masz jeszcze żadnych piosenek") oraz przycisk z wezwaniem do akcji (np. "Dodaj pierwszą piosenkę").
    *   **Użycie:** `Song List View`, `Repertoire List View`.

*   **`ConfirmationDialogComponent`:**
    *   **Opis:** Generyczne okno modalne (`mat-dialog`) używane do potwierdzania akcji destrukcyjnych. Przyjmuje tytuł, treść i zwraca informację o decyzji użytkownika.
    *   **Użycie:** Przy usuwaniu piosenek i repertuarów.

*   **`ShareDialogComponent`:**
    *   **Opis:** Okno modalne wyświetlające publiczny link (z przyciskiem "kopiuj") oraz wygenerowany kod QR dla danej piosenki lub repertuaru.
    *   **Użycie:** `Song List View`, `Repertoire List View`.

*   **`
