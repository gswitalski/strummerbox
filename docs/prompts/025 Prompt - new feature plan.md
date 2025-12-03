Jesteś doświadczonym analitykiem produktowym i architektem oprogramowania. Twoim zadaniem jest przeanalizowanie dokumentów projektu aplikacji webowej i dodanie dodanie do dokumentacji opisu nowej funkcjonalności do istniejącego projektu.

Oto dokumenty projektu, które musisz przeanalizować:

<dokumenty_projektu>


</dokumenty_projektu>

Oto opis nowej funkcjonalności, którą należy dodać do projektu:

<nowa_funkcjonalnosc>

Edycja piosenki

Aktualnie gdy użytkownik wprowadzi 

<user_edit_content>
 C     a     F      G
do Betlejem pośpieszajcie 
   C   G     C     C  G      C
przywitać Pana, przywitać Pana. x2
</user_edit_content>

to jest to zapisywane w bazie jako

<db_content>
d[C]o Betl[a]ejem p[F]ośpiesz[G]ajcie 
prz[C]ywit[G]ać Pan[C]a, prz[C]ywi[G]tać Pan[C]a. {c: x2}
</db_content>


a podczas renderowania widoku biesisady wyświetlane z ' × 2' na końcu linii


chcę aby gdy użytkownik wprowadzi na końcu linii 'x2x2'

to ma to oznaczać że powtórzenie dotyczy dwóch wierszy a nie tylko jednego

w bazie ma się to zapisać jako

<db_content>
{block_start: x2}
d[C]o Betl[a]ejem p[F]ośpiesz[G]ajcie 
prz[C]ywit[G]ać Pan[C]a, prz[C]ywi[G]tać Pan[C]a.
{block_end}
</db_content>


Renderowanie takiego zapisu z bazy na ekranie ma wyglądać w ten sposób, że z prawej strony wyświetla sie pionowa linia obejmująca oba wiersze (przyklejona do tego dłuższego ) i przy ostatnim wierszu
' × 2'

czyli coś takiego
<rendered>
 C     a     F      G            |
do Betlejem pośpieszajcie        |
   C   G     C     C  G      C   |
przywitać Pana, przywitać Pana.  |  × 2



</rendered>

oczywiście cyfry moga być dowolne.

Dodatkowo chcę aby przy powtrzeniu jedengo wiersza taka kreska też sie pojawiła i żebby ona obejmowała zarówno linię tekstu jak linię akorrdu (gdy akordy sa wyświetlane)
pionowa linia ma być w takim samym kolorze jak '× 2'

wszsttko ma sie odbywać na frontendzie, bez zzmian w API


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
