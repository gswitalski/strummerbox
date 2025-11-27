Jesteś doświadczonym programistą aplikacji webowych. Twoim zadaniem jest przeanalizowanie i naprawienie buga w backendzie aplikacji.

Zapoznaj się z następującymi materiałami:

<prd>



</prd>

<stos_technologiczny>



</stos_technologiczny>

<plan_ui>



</plan_ui>

<plan_api>



</plan_api>

<typy>



</typy>



<aktualna_implementacja>



</aktualna_implementacja>

<aktualne_zachowanie>


import piosenki z formau 'akordy nad tekstem'
gdy na początku tekstu jest sama litera a będąca poprawnym wyrazem w języku polskim, algorytm interpretuje to jako wiersz akordów w efekcie taki tekst
<source_text>
 C   G      C       C     G        C
Poszli, znaleźli Dzieciątko w żłobie 
     C   G     C      C  G     C
z wszystkimi znaki, danymi sobie. 
 C    a     F       G
Jako Bogu cześć Mu dali, 
C    a     F   G
a witając zawołali 
    C       G    C      C       G    C
z wielkiej radości, z wielkiej radości
</source_text>

jest interpretowany:

<result>

P[C]oszl[G]i, znal[C]eźli Dzi[C]eciątk[G]o w żłobi[C]e 
z wsz[C]ystk[G]imi zn[C]aki, da[C]nym[G]i sobi[C]e. 
J[C]ako B[a]ogu cz[F]eść Mu d[G]ali, 
[C] [a] [F] [G]
[a] [a] [c] [a] [a]
z wi[C]elkiej r[G]adośc[C]i, z wi[C]elkiej r[G]adośc[C]i
</result>

</aktualne_zachowanie>

<oczekiwane_zachowanie>

<result>

P[C]oszl[G]i, znal[C]eźli Dzi[C]eciątk[G]o w żłobi[C]e 
z wsz[C]ystk[G]imi zn[C]aki, da[C]nym[G]i sobi[C]e. 
J[C]ako B[a]ogu cz[F]eść Mu d[G]ali, 
[C]a wit[a]ając z[F]awoł[G]ali 
z wi[C]elkiej r[G]adośc[C]i, z wi[C]elkiej r[G]adośc[C]i


</result>

</oczekiwane_zachowanie>


<implementation_rules>



</implementation_rules>


Przeanalizuj przedstawiony bug, porównując aktualne zachowanie z oczekiwanym zachowaniem. Uwzględnij wszystkie dostarczone materiały: PRD, stos technologiczny, plan UI, typy oraz aktualną implementację.

Przed podaniem rozwiązania, użyj tagów <analiza> do przemyślenia problemu:
- Zidentyfikuj różnice między aktualnym a oczekiwanym zachowaniem
- Przeanalizuj aktualną implementację w kontekście planu UI i typów
- Określ prawdopodobną przyczynę buga
- Zaplanuj kroki naprawy

Następnie napraw buga.

Pamiętaj, że wszystkie odpowiedzi, komentarze w kodzie i wyjaśnienia mają być w języku polskim. Kod powinien być gotowy do implementacji i zgodny z przedstawionym stosem technologicznym oraz planem API.
