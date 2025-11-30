Jesteś doświadczonym analitykiem produktowym i architektem oprogramowania. Twoim zadaniem jest przeanalizowanie dokumentów projektu aplikacji webowej i dodanie dodanie do dokumentacji opisu nowej funkcjonalności do istniejącego projektu.

Oto dokumenty projektu, które musisz przeanalizować:

<dokumenty_projektu>



</dokumenty_projektu>

Oto opis nowej funkcjonalności, którą należy dodać do projektu:

<nowa_funkcjonalnosc>

Chcę aby podczas edycji piosenki konwerter obsługiwał powtórzenia

wykorzyttując te instrukcje:
<instrukcje_dla_powtórzeń>

### Powtarzające się ciągi akordów (bez tekstu)
Gdy chcesz zapisać sekwencję akordów instrumentalnych, która ma się powtórzyć określoną liczbę razy, umieść komentarz z informacją o powtórzeniach na końcu linii lub w osobnej linii przed/po akordach.

```text
[C]   [A]   [G]   [D]   {c: x2}
```

Ten zapis oznacza: "zagraj sekwencję C → A → G → D dwa razy".

### Powtarzające się linie tekstu z akordami

```text
Pi[C]eski małe [A]dwa {c: x2}
```


</instrukcje_dla_powtórzeń>

1. Przypadek 1: ciąg akordów bez tekstu"
 - użytkownik wprowadza
   C a d G x2
 - w chordpro prozapisuje się :
   [C]  [a]  [d]  [G] {c: x2}
 - w drugą stronę (konwersja chrod rpo do 'akordy ma górze) anbalogicznie
 - w trybie biesiada wyświetla się:
   C a d G x 2
   (zamias znaku x ma być znak 'razy') a cyfra po x może być dowolna

2. Przypadek 2: pojedyncza linia z akordami tekst z akordami
 - użytkownik wprowadza
    C            a
   Pieski małe dwa x2
 - w chordpro prozapisuje się:
    Pi[C]eski małe [A]dwa {c: x2}
 - w trybie biesiada wyświetla się
     C           a
   Pieski małe dwa  x 2 
   zamiast 'x' ma być zank razy



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
