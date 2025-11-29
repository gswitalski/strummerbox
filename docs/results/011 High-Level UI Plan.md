# Architektura UI dla StrummerBox

> **Uwaga:** Dokument zaktualizowany 19 listopada 2025 po refaktoryzacji widoków piosenek.  
> Dodano dokumentację komponentów: `SongViewerComponent`, `SongNavigationComponent` oraz zaktualizowano sekcję 5 i 6.  
> Zobacz: [Refaktoryzacja SongViewerComponent](./changes/song-viewer-component-refactoring.md)

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
    *   **UX (Konto niepotwierdzone):** W przypadku próby logowania na konto, które nie zostało jeszcze aktywowane, otwierane jest okno modalne (`mat-dialog`) z informacją: "Konto nieaktywne. Sprawdź swoją skrzynkę e-mail, aby dokończyć rejestrację." Okno zawiera również przycisk "Wyślij link ponownie", który pozwala zainicjować ponowne wysłanie e-maila aktywacyjnego.
    *   **Dostępność:** Etykiety (`aria-label`) dla pól formularza, obsługa nawigacji klawiaturą.
    *   **Bezpieczeństwo:** Komunikacja z API przez HTTPS.

---

#### **2. Widok Rejestracji (Register View)**

*   **Ścieżka:** `/register` - wejscie do ściezki poprzez dodanie dodatkowego przycisku "Zarejestruj się" na formularzu logowania
*   **Główny cel:** Umożliwienie nowemu Organizatorowi założenia konta.
*   **Kluczowe informacje:** Formularz z polami na e-mail, nick (displayName) i hasło (z potwierdzeniem).
*   **Kluczowe komponenty:** Takie same jak w Widoku Logowania.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Walidacja hasła (np. minimalna długość) i jego potwierdzenia po stronie klienta. Komunikaty o błędach (np. "Konto o tym adresie e-mail już istnieje"). Po pomyślnej rejestracji użytkownik jest przekierowywany na nowy "Widok Oczekiwania na Potwierdzenie E-mail".
    *   **Dostępność:** Jak w widoku logowania.
    *   **Bezpieczeństwo:** Jak w widoku logowania.

---

#### **3. Widok Oczekiwania na Potwierdzenie E-mail (Awaiting Email Confirmation View)**

*   **Ścieżka:** `/auth/awaiting-confirmation`
*   **Główny cel:** Poinformowanie użytkownika o konieczności weryfikacji adresu e-mail w celu dokończenia procesu rejestracji.
*   **Kluczowe informacje:** Wyraźny komunikat, np. "Rejestracja prawie zakończona! Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny, aby dokończyć proces." Ikona koperty. Informacja o adresie e-mail, na który wysłano link. Przycisk/link "Nie otrzymałem e-maila. Wyślij ponownie".
*   **Kluczowe komponenty:** `mat-card`, `mat-icon`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty, jednoznaczny widok, który nie pozostawia wątpliwości co do następnego kroku. Umożliwia łatwe ponowne wysłanie linku w przypadku problemów.
    *   **Dostępność:** Etykiety dla wszystkich interaktywnych elementów.
    *   **Bezpieczeństwo:** Widok publiczny, nie wymaga uwierzytelnienia.

---

#### **4. Widok Potwierdzenia E-mail (Email Confirmation View)**

*   **Ścieżka:** `/auth/confirm-email` (lub inna ścieżka zwrotna skonfigurowana w Supabase)
*   **Główny cel:** Obsługa kliknięcia w link aktywacyjny przez użytkownika i poinformowanie go o wyniku.
*   **Kluczowe informacje:** Wskaźnik ładowania (`MatSpinner`) podczas weryfikacji tokenu. Po weryfikacji:
    *   **Sukces:** Komunikat "Twoje konto zostało aktywowane!" i przycisk "Przejdź do logowania".
    *   **Błąd (np. link wygasł):** Komunikat "Link aktywacyjny jest nieprawidłowy lub wygasł." i przycisk "Wyślij nowy link aktywacyjny".
*   **Kluczowe komponenty:** `MatSpinner`, `mat-card`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Jasny feedback dla użytkownika o wyniku operacji. Zapewnia łatwą ścieżkę do logowania lub rozwiązania problemu.
    *   **Dostępność:** Odpowiednie role ARIA do komunikowania stanu (np. `aria-live` dla komunikatów o statusie).
    *   **Bezpieczeństwo:** Strona obsługuje tokeny (jednorazowe, ograniczone czasowo) w parametrach URL, które są przetwarzane w celu aktywacji konta.

---

#### **4a. Publiczny Widok Repertuaru (Public Repertoire View)**

*   **Ścieżka:** `/public/repertoires/:publicId`
*   **Główny cel:** Wyświetlenie listy piosenek zawartych w udostępnionym repertuarze dla Biesiadnika.
*   **Kluczowe informacje:** Nazwa i opis repertuaru, uporządkowana lista piosenek (tylko tytuły).
*   **Kluczowe komponenty:** `mat-list` z `mat-list-item`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty, czytelny widok zoptymalizowany dla urządzeń mobilnych. Kliknięcie w tytuł piosenki przenosi do Publicznego Widoku Piosenki używając ścieżki /public/repertoires/:publicId/songs/:songPublicId.
    *   **Dostępność:** Duża, czytelna czcionka.
    *   **Bezpieczeństwo:** Widok jest publiczny, ale zawiera metatag `noindex, nofollow`, aby uniemożliwić indeksowanie przez wyszukiwarki.

---

#### **4b. Publiczny Widok Piosenki (Public Song View)**

*   **Ścieżka:** `/public/songs/:publicId` oraz `/public/repertoires/:publicId/songs/:songPublicId`
*   **Główny cel:** Wyświetlenie tekstu piosenki Biesiadnikowi, z możliwością włączenia widoku akordów i transpozycji.
*   **Kluczowe informacje:** Tytuł piosenki, treść piosenki w formacie ChordPro, przełącznik widoczności akordów (domyślnie wyłączony), kontrolki do transpozycji (`+`/`-`), przyciski nawigacyjne "{tytuł_następnej}" / "{tytuł_poprzedniej}" (jeśli piosenka jest częścią repertuaru).
*   **Kluczowe komponenty:** `SongViewerComponent` (reużywalny komponent prezentacyjny), który wewnętrznie używa `SongDisplayComponent`, `SongNavigationComponent`, `TransposeControlsComponent`, `mat-button-toggle-group`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Domyślnie interfejs jest minimalistyczny i skupiony na tekście (bez akordów). W prawym górnym rogu toolbara znajduje się przełącznik (z opcjami "Tekst" / "Akordy"). Po włączeniu widoku akordów, obok przełącznika pojawiają się kontrolki transpozycji (`+`, `-`, licznik), pozwalające na zmianę tonacji w locie. Wyłączenie akordów ukrywa kontrolki transpozycji.
    *   **Dostępność:** Wysoki kontrast tekstu i tła. Etykiety `aria-label` dla przycisków i przełącznika.
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
*   **Kluczowe informacje:** Formularz z polem na tytuł piosenki, edytor tekstu dla treści w formacie "akordy nad tekstem". Podgląd na żywo piosenki skonwertowanej do formatu ChordPro.
*   **Kluczowe komponenty:** `mat-form-field`, `textarea`, `mat-button`, niestandardowy komponent edytora "side-by-side".
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Na desktopie układ "side-by-side" (edycja w formacie "akordy nad tekstem" po lewej, podgląd w formacie ChordPro po prawej). Na mobile układ z zakładkami (`mat-tab-group`) do przełączania się między edycją a podglądem. Walidacja (np. unikalność tytułu) z komunikatami błędów.
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
*   **Główny cel:** Wyświetlenie Organizatorowi piosenki z akordami podczas prowadzenia biesiady, z możliwością transpozycji.
*   **Kluczowe informacje:** Tytuł, treść piosenki z akordami, kontrolki transpozycji, przyciski nawigacyjne "Następna" / "Poprzednia", przycisk "Pokaż kod QR". Przycisk nawigacji powrotnej do listy piosenek.
*   **Kluczowe komponenty:** `SongViewerComponent` (reużywalny komponent prezentacyjny), który wewnętrznie używa `SongDisplayComponent`, `SongNavigationComponent`, `TransposeControlsComponent`, `mat-fab` do wyświetlania QR, `ShareDialogComponent` do wyświetlania kodu QR.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Interfejs skupiony na czytelności tekstu z akordami. W toolbarze na stałe widoczne są kontrolki transpozycji. Tytuł piosenki wyświetlany jest poniżej toolbara (w content area). Pływający przycisk akcji (`FAB`) nie zasłania treści. Kliknięcie w niego otwiera modal z dużym, czytelnym kodem QR. Przycisk "wstecz" w nagłówku pozwala na powrót do listy piosenek w repertuarze (`/biesiada/repertoires/:id`).
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

Poniższe komponenty są reużywalne i wykorzystywane w wielu miejscach aplikacji w celu zapewnienia spójności i unikania powielania kodu.

### Komponenty prezentacyjne widoku piosenek

*   **`SongViewerComponent`:** ⭐ *Komponent centralny*
    *   **Opis:** Wysoce konfigurowalny komponent prezentacyjny odpowiedzialny za cały layout i UI widoku piosenki. Zarządza wyświetlaniem toolbara, stanów ładowania/błędu, treści piosenki, nawigacji oraz kontrolek transpozycji. Przyjmuje konfigurację określającą, które elementy UI mają być widoczne.
    *   **API:** `@Input() status`, `@Input() title`, `@Input() content`, `@Input() showChords`, `@Input() transposeOffset: number`, `@Input() navigation`, `@Input() config: SongViewerConfig`, `@Output() chordsToggled`, `@Output() qrButtonClicked`, `@Output() transposeChanged`
    *   **Użycie:** `Public Song View`, `Public Repertoire Song View`, `Biesiada Song View` - wszystkie widoki piosenek używają tego komponentu z różnymi konfiguracjami.
    *   **Stan:** ⚠️ Zaktualizowany (grudzień 2025)
    *   **Dokumentacja:** `docs/results/changes/ad-hoc-transposition-changes.md`

*   **`SongNavigationComponent`:**
    *   **Opis:** Komponent prezentacyjny odpowiedzialny za wyświetlanie dolnego paska nawigacyjnego z przyciskami "Poprzednia" i "Następna" między piosenkami w repertuarze. Przyjmuje obiekt nawigacyjny z danymi o linkach i tytułach piosenek.
    *   **API:** `@Input() navigation: SongNavigation` (zawiera `previous`, `next`, `back`)
    *   **Użycie:** Wewnętrznie używany przez `SongViewerComponent`. Widoczny w widokach z nawigacją między piosenkami w repertuarze.
    *   **Stan:** ✅ Zaimplementowany (listopad 2025)
    *   **Dokumentacja:** `docs/results/changes/song-navigation-component-refactoring.md`

*   **`SongDisplayComponent`:**
    *   **Opis:** Komponent odpowiedzialny za renderowanie treści piosenki. Przyjmuje jako dane wejściowe pełną treść w formacie ChordPro, flagę `showChords: boolean` oraz numeryczny `transposeOffset`. Na podstawie tych danych, komponent najpierw transponuje akordy (jeśli offset jest różny od zera), a następnie renderuje sam tekst lub tekst z poprawnie sformatowanymi, przetransponowanymi akordami.
    *   **API:** `@Input() content: string`, `@Input() showChords: boolean`, `@Input() transposeOffset: number`
    *   **Użycie:** Wewnętrznie używany przez `SongViewerComponent` do wyświetlania treści piosenki.
    *   **Stan:** ⚠️ Zaktualizowany (grudzień 2025)

### Komponenty pomocnicze i dialogowe

*   **`TransposeControlsComponent`:** ⭐ *Nowy komponent*
    *   **Opis:** Komponent prezentacyjny wyświetlający przyciski "-" i "+" oraz aktualną wartość transpozycji (np. "+2"). Jest w pełni sterowany z zewnątrz.
    *   **API:** `@Input() offset: number`, `@Output() change = new EventEmitter<number>()`
    *   **Użycie:** Wewnętrznie używany przez `SongViewerComponent` w toolbarze.
    *   **Stan:** ✅ Do zaimplementowania

*   **`EmptyStateComponent`:**
    *   **Opis:** Komponent wyświetlany, gdy lista (np. piosenek, repertuarów) jest pusta. Zawiera ikonę, komunikat (np. "Nie masz jeszcze żadnych piosenek") oraz przycisk z wezwaniem do akcji (np. "Dodaj pierwszą piosenkę").
    *   **Użycie:** `Song List View`, `Repertoire List View`.
    *   **Stan:** ✅ Zaimplementowany

*   **`ConfirmationDialogComponent`:**
    *   **Opis:** Generyczne okno modalne (`mat-dialog`) używane do potwierdzania akcji destrukcyjnych. Przyjmuje tytuł, treść i zwraca informację o decyzji użytkownika.
    *   **Użycie:** Przy usuwaniu piosenek i repertuarów.
    *   **Stan:** ✅ Zaimplementowany

*   **`ShareDialogComponent`:**
    *   **Opis:** Okno modalne wyświetlające publiczny link (z przyciskiem "kopiuj") oraz wygenerowany kod QR dla danej piosenki lub repertuaru.
    *   **Użycie:** `Song List View`, `Repertoire List View`, `Biesiada Song View` (przycisk FAB).
    *   **Stan:** ✅ Zaimplementowany

*   **`ErrorDisplayComponent`:**
    *   **Opis:** Komponent do wyświetlania komunikatów o błędach w przyjazny dla użytkownika sposób. Przyjmuje kod błędu i wiadomość.
    *   **API:** `@Input() code: number`, `@Input() message: string`
    *   **Użycie:** Wewnętrznie używany przez `SongViewerComponent` oraz inne widoki do obsługi stanów błędów.
    *   **Stan:** ✅ Zaimplementowany

## 6. Architektura komponentów widoku piosenek

Po refaktoryzacji przeprowadzonej w listopadzie 2025, architektura widoków piosenek opiera się na kompozycji trzech głównych komponentów prezentacyjnych:

```
SongViewerComponent (kontener UI)
├── ErrorDisplayComponent (obsługa błędów)
├── MatProgressBar (wskaźnik ładowania)
├── MatToolbar (górny pasek)
│   ├── Przycisk powrotu (opcjonalnie)
│   ├── Tytuł piosenki (opcjonalnie w toolbarze)
│   ├── MatButtonToggleGroup (przełącznik akordów, opcjonalnie)
│   └── TransposeControlsComponent (kontrola transpozycji, opcjonalnie)
├── Kontener treści
│   ├── Tytuł piosenki (opcjonalnie poza toolbarem)
│   └── SongDisplayComponent (renderowanie ChordPro z transpozycją)
├── SongNavigationComponent (opcjonalnie)
└── MatFab (przycisk QR, opcjonalnie)
```

**Smart Components** (widoki) odpowiadają tylko za:
- Pobieranie danych z API
- Zarządzanie stanem (loading, error, data, **transposeOffset**)
- Konfigurację komponentu `SongViewerComponent`
- Obsługę eventów (`chordsToggled`, `qrButtonClicked`, **`transposeChanged`**)

**Presentation Components** odpowiadają tylko za:
- Renderowanie UI
- Emitowanie eventów
- Brak logiki biznesowej

To zapewnia:
- ✅ Separację odpowiedzialności (SoC)
- ✅ Łatwiejsze testowanie
- ✅ Reużywalność komponentów
- ✅ Spójność UI w całej aplikacji
