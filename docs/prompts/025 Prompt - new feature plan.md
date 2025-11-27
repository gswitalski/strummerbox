Jesteś doświadczonym analitykiem produktowym i architektem oprogramowania. Twoim zadaniem jest przeanalizowanie dokumentów projektu aplikacji webowej i dodanie dodanie do dokumentacji opisu nowej funkcjonalności do istniejącego projektu.

Oto dokumenty projektu, które musisz przeanalizować:

<dokumenty_projektu>



</dokumenty_projektu>

Oto opis nowej funkcjonalności, którą należy dodać do projektu:

<nowa_funkcjonalnosc>

W publicznym widoku piosenki, po włączeniu widoczności akordów, użytkownik ma dostęp do narzędzia transpozycji, pozwalającego na zmianę tonacji utworu (w górę/w dół o pół tonu) w czasie rzeczywistym.
W trybie 'Biesiada' dla Organizatora, narzędzie transpozycji jest dostępne domyślnie w widoku piosenki.

-   ID: US-025
-   Title: Transpozycja ad-hoc w widoku publicznym
-   Description: Jako Biesiadnik grający na instrumencie, chcę móc tymczasowo zmienić tonację wyświetlanej piosenki, aby dopasować ją do stroju mojego instrumentu lub możliwości wokalnych grupy.
-   Acceptance Criteria:
    -   W widoku publicznym piosenki, kontrolki transpozycji pojawiają się tylko wtedy, gdy włączony jest tryb "Pokaż akordy".
    -   Interfejs zawiera przyciski "-" i "+" oraz licznik przesunięcia (np. +2).
    -   Zmiana tonacji następuje natychmiastowo bez przeładowania strony.
    -   Wyłączenie widoku akordów ukrywa kontrolki transpozycji.

-   ID: US-026
-   Title: Transpozycja w trybie Organizatora (Biesiada)
-   Description: Jako Organizator prowadzący śpiewanie, chcę mieć szybki dostęp do zmiany tonacji, aby zareagować na potrzeby grupy w trakcie imprezy.
-   Acceptance Criteria:
    -   W trybie 'Biesiada' kontrolki transpozycji są widoczne na stałe w widoku piosenki.
    -   Transpozycja jest lokalna dla sesji przeglądarki i nie zmienia oryginalnego zapisu piosenki na serwerze.



</nowa_funkcjonalnosc>

Twoim zadaniem jest:

1. Dokładnie przeanalizować wszystkie dostarczone dokumenty projektu, aby zrozumieć obecną architekturę, funkcjonalności i strukturę aplikacji
2. Na podstawie opisu nowej funkcjonalności, dodać odpowiednie elementy do:
   - PRD (Product Requirements Document) - dodaj nowe funkcje i historyjki użytkownika
   - Planu UI - dodaj nowy widok/widoki
   - Planu API - dodaj nowe endpointy API

Przed przystąpieniem do tworzenia rozszerzeń, użyj scratchpad do zaplanowania swojego podejścia:

<scratchpad>
[Tutaj przeanalizuj dokumenty, zidentyfikuj kluczowe elementy obecnej architektury, zastanów się jak nowa funkcjonalność wpasuje się w istniejący system, zaplanuj jakie konkretnie elementy trzeba dodać do każdego dokumentu]
</scratchpad>

Wymagania dotyczące odpowiedzi:
- Wszystko ma być napisane w języku polskim
- Zachowaj spójność ze stylem i formatem istniejących dokumentów
- Upewnij się, że nowe elementy logicznie wpasowują się w obecną architekturę
- Dla PRD: dodaj konkretne funkcje i przynajmniej jedną szczegółową historyjkę użytkownika
- Dla planu UI: opisz nowy widok/widoki z uwzględnieniem UX i interfejsu
- Dla planu API: dodaj konkretne endpointy z metodami HTTP, parametrami i odpowiedziami

Twoja końcowa odpowiedź powinna zawierać trzy wyraźnie oznaczone sekcje:
1. Rozszerzenia do PRD
2. Nowy widok w planie UI  
3. Nowe API w planie API

Sformatuj swoją odpowiedź używając odpowiednich nagłówków i zachowując czytelną strukturę.


Dodatkowo  stwórz dokument w doc/results/changes/{nazwa-ficzera-po-angielsku}-changes.md
W tym dokumence umieść 3 rozdziały:
1. historyjki użytkownika
2. API
2. Widoki.

W każdym rozdziale umieść odpowiednio opisy historyjek, endpointów i widoków które są nowe lub zmienione. dla zmienionych dopisz notatkę co się zmieniło.

Pamiętaj: niczego nie implementujesz, uaktualniasz tylko dokumentację.

