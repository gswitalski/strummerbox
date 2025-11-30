Jesteś doświadczonym analitykiem produktowym i architektem oprogramowania. Twoim zadaniem jest przeanalizowanie dokumentów projektu aplikacji webowej i dodanie dodanie do dokumentacji opisu nowej funkcjonalności do istniejącego projektu.

Oto dokumenty projektu, które musisz przeanalizować:

<dokumenty_projektu>



</dokumenty_projektu>

Oto opis nowej funkcjonalności, którą należy dodać do projektu:

<nowa_funkcjonalnosc>

Chcę aby w trybie edycji piosenki prawy panel , kóry pokazuje podgląd formatu chordpro, maił 2 tryby podglądu przełączane switchem na górze.
Pierwszy tryb ma być taki jak teraz a drugi to ma być podgląd w formacie 'akordy nad tekstem'.
W priewszym trybue (chord pro) system ma dziaać tak jak teraz.
W drugim (podgląd w trybie 'akordy nad tekstem' system ma prezentować ten sam widok co widokk w trybuie biesiady (reużywalny komponet jest gotowy) ale bez trnaspozycji. dane źródłowe fo poglądu mają stanowić tekst w formachie chordpro wygenerowany dlas podgloądu chord pro
Innymi słowy w drugim trybie
1. uzytkowik wprowadza swój tekst w formacie 'akordy nad tekstem'
2. system na podstawie tego generuje chordpro.
3. System na podstawie wyganerowanego chordpro ponownie generuje 'akordy nad tekstem' w celu zaprezentowania w panelu prawym w drugim trybie


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

Zanim wygenerujesz wyniki zadaj kilka pytań uszczegóławiających moje wymagania. Pod pytaniami napisz swoje sugestie jako odpowiedź.
Dopiero gdy udzielę odpowiedzi przystąp do generowania dokumentów uwzględniając moje odpowiedzi.
