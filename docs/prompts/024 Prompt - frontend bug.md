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




<aktualne_zachowanie>

konwerter z formatu 'akordy nad tekstem' źle interpretuje linijkę z samimi akordami pod którą nie ma tekstu

<input>
A f# E

 A                      f#
Nie płacz Ewka, bo tu miejsca brak

</input>

<output>
[A][E[f#]]
N[A]ie płacz Ewka, bo tu mi[f#]ejsca brak
</output>



</aktualne_zachowanie>

<oczekiwane_zachowanie>
<output>
[A]  [f#]  [E]

N[A]ie płacz Ewka, bo tu mi[f#]ejsca brak
</output>

akordy poza tym mają mieć co najmniej dwie spacje odstępu i jedna linijkię odstępu pod spodem

</oczekiwane_zachowanie>


<aktualna_implementacja>


</aktualna_implementacja>

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
