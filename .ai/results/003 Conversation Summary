<conversation_summary>
<decisions>
1.  **Uwierzytelnianie:** Rejestracja i logowanie odbędzie się za pomocą adresu e-mail i hasła. Wersja MVP nie będzie zawierała funkcji resetowania hasła.
2.  **Format Piosenek:** Zostanie wdrożony format ChordPro, w którym akordy umieszczane są w nawiasach kwadratowych `[ ]`. Edytor piosenek będzie posiadał widok "side-by-side" do podglądu na żywo oraz walidację sprawdzającą, czy wszystkie nawiasy kwadratowe są poprawnie zamknięte.
3.  **Unikalność Nazw:** Nazwy piosenek oraz repertuarów muszą być unikalne w obrębie konta jednego organizatora.
4.  **Tryby Aplikacji:**
    *   **Tryb 'Zarządzanie':** Dostępny dla zalogowanego organizatora, zoptymalizowany pod kątem desktopu, ale responsywny. Umożliwia pełne zarządzanie (CRUD) piosenkami i repertuarami.
    *   **Tryb 'Biesiada' (Organizator):** Oddzielny widok "tylko do odczytu" dla zalogowanego organizatora, pozwalający na przeglądanie repertuarów i piosenek z akordami oraz wyświetlanie kodu QR do udostępniania.
    *   **Tryb 'Biesiada' (Biesiadnik):** Dostępny dla niezalogowanych użytkowników po zeskanowaniu kodu QR, wyświetla tylko tekst piosenki dużą czcionką.
5.  **Zarządzanie Repertuarem:** Kolejność piosenek w repertuarze będzie zmieniana za pomocą przycisków "w górę / w dół".
6.  **Udostępnianie:** Linki publiczne i kody QR będą generowane jednorazowo w trybie 'Zarządzanie', będą stałe i zawsze będą wskazywać na aktualną wersję repertuaru/piosenki.
7.  **Akcje Destrukcyjne:** Usunięcie piosenki używanej w repertuarze, jak i usunięcie całego repertuaru, będzie wymagało dodatkowego potwierdzenia od użytkownika.
8.  **Nawigacja Biesiadnika:** Uczestnik biesiady będzie mógł nawigować do następnej i poprzedniej piosenki bezpośrednio z widoku utworu, bez konieczności powrotu do listy.
9.  **Prywatność:** Publiczne linki nie będą indeksowane przez wyszukiwarki dzięki zastosowaniu odpowiedniego metatagu.
10. **Limity i Wydajność:** Wersja MVP nie będzie posiadała żadnych limitów co do liczby piosenek czy repertuarów. Aplikacja ma być zoptymalizowana pod kątem szybkiego ładowania widoku biesiadnika.
</decisions>

<matched_recommendations>
1.  **Edytor Piosenek:** Zaimplementowany zostanie edytor z podglądem na żywo (side-by-side), co ułatwi użytkownikom pracę z formatem ChordPro.
2.  **Oddzielenie Trybów Pracy:** Stworzenie oddzielnego, uproszczonego trybu "biesiada" dla organizatora (tylko do odczytu z opcją udostępniania QR) zapobiegnie przypadkowym zmianom podczas wydarzenia i uprości interfejs mobilny.
3.  **Doświadczenie Użytkownika (UX):** Zastosowane zostaną przyjazne "puste stany" dla nowych użytkowników, prosta i stała nawigacja główna oraz komunikaty potwierdzające przed wykonaniem akcji destrukcyjnych.
4.  **Nawigacja dla Biesiadnika:** Umożliwienie płynnego przechodzenia między piosenkami w repertuarze znacząco poprawi doświadczenie uczestników imprezy.
5.  **Obsługa Błędów:** W przypadku próby dostępu do usuniętych treści, użytkownik zobaczy dedykowaną stronę błędu zamiast standardowego błędu 404.
6.  **Wyświetlanie QR:** Kod QR będzie wyświetlany w trybie 'biesiada' w dużym, czytelnym oknie, co ułatwi jego skanowanie przez wiele osób.
7.  **Struktura Danych:** Przyjęty format ChordPro i struktura danych ułatwią w przyszłości implementację dodatkowych funkcji, takich jak transpozycja akordów.
</matched_recommendations>

<prd_planning_summary>
### Główne wymagania funkcjonalne produktu

**1. Użytkownik 'Organizator'**
*   **Rejestracja i Logowanie:** Możliwość założenia konta (e-mail + hasło) i logowania.
*   **Zarządzanie Piosenkami (CRUD):**
    *   Tworzenie nowej piosenki z unikalną nazwą.
    *   Edycja piosenek w edytorze side-by-side z walidacją składni `[ ]`.
    *   Przeglądanie listy wszystkich swoich piosenek.
    *   Usuwanie piosenek (z potwierdzeniem, jeśli jest używana w repertuarze).
*   **Zarządzanie Repertuarami (CRUD):**
    *   Tworzenie nowego repertuaru z unikalną nazwą poprzez wybór piosenek z katalogu.
    *   Edycja repertuaru (zmiana nazwy, dodawanie/usuwanie piosenek, zmiana kolejności).
    *   Przeglądanie listy swoich repertuarów.
    *   Usuwanie repertuarów (z potwierdzeniem).
*   **Udostępnianie:** Generowanie stałego linku i kodu QR dla każdej piosenki i każdego repertuaru.
*   **Tryb 'Biesiada' (dla Organizatora):** Dostęp do specjalnego widoku "read-only", gdzie może przeglądać swoje repertuary i piosenki (z akordami) oraz wyświetlać duży kod QR w celu udostępnienia go biesiadnikom.

**2. Użytkownik 'Biesiadnik'**
*   **Dostęp do Treści:** Możliwość uzyskania dostępu do piosenki lub repertuaru poprzez zeskanowanie kodu QR lub otwarcie linku.
*   **Widok Repertuaru:** Wyświetlenie listy piosenek wchodzących w skład repertuaru.
*   **Widok Piosenki:** Wyświetlenie samego tekstu piosenki (bez akordów) z dużą, czytelną czcionką dostosowaną do ekranów mobilnych.
*   **Nawigacja:** Możliwość przechodzenia do następnej/poprzedniej piosenki w ramach danego repertuaru.

### Kluczowe historie użytkownika i ścieżki korzystania

*   **Ścieżka Organizatora (Przygotowanie):**
    1.  Organizator rejestruje się i loguje do aplikacji.
    2.  Dodaje kilka piosenek do swojego prywatnego katalogu, używając edytora ChordPro.
    3.  Tworzy nowy repertuar o nazwie "Ognisko u Janka".
    4.  Wybiera piosenki z katalogu i układa je w odpowiedniej kolejności.
    5.  Generuje link i kod QR dla tego repertuaru.

*   **Ścieżka Organizatora i Biesiadników (Wydarzenie):**
    1.  Podczas ogniska Organizator loguje się na swoim telefonie i przechodzi do trybu 'biesiada'.
    2.  Wybiera repertuar "Ognisko u Janka" i klika "Pokaż kod QR".
    3.  Biesiadnicy skanują kod QR swoimi telefonami.
    4.  Na ekranach biesiadników pojawia się lista piosenek. Po wybraniu pierwszej, widzą jej tekst.
    5.  Organizator na swoim telefonie widzi tę samą piosenkę, ale z akordami.
    6.  Po zakończeniu piosenki, biesiadnicy klikają "Następna piosenka", aby przejść do kolejnego utworu z listy.

### Ważne kryteria sukcesu
Ponieważ jest to projekt zaliczeniowy, formalne metryki sukcesu (KPI) nie będą mierzone. Jakościowym kryterium sukcesu będzie pomyślne zrealizowanie i zademonstrowanie opisanych powyżej kluczowych ścieżek użytkownika. Produkt odniesie sukces, jeśli umożliwi bezproblemowe przygotowanie repertuaru i jego udostępnienie w czasie rzeczywistym grupie docelowej.

</prd_planning_summary>

<unresolved_issues>
*   **Odzyskiwanie Dostępu do Konta:** Użytkownik świadomie podjął decyzję o pominięciu funkcji "resetowania hasła" w MVP. Pozostaje to jednak kluczowym problemem do rozwiązania w przyszłych wersjach produktu, ponieważ obecnie utrata hasła oznacza permanentną utratę dostępu do konta i wszystkich danych. Należy jasno poinformować o tym użytkowników w interfejsie.
</unresolved_issues>
</conversation_summary>
