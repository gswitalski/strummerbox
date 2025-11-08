Jesteś doświadczonym programistą aplikacji webowych. Twoim zadaniem jest przeanalizowanie i naprawienie buga w backendzie aplikacji.

Zapoznaj się z następującymi materiałami:

<prd>



</prd>

<stos_technologiczny>



</stos_technologiczny>

<plan_api>



</plan_api>

<typy>



</typy>

<aktualna_implementacja>




</aktualna_implementacja>

<aktualne_zachowanie>

gdny zakładam nowego użytkownika na lokalnej instancji bazy, to po założniu ma on pole emailconfirmrdat - ustawione od razu (nie trzeba potwierdzac)
jednak na bazie produkcyjnej to pole pozostaje null i próba zalogowania uzytkownika zaraz po założeniu skutkuje komunkiatem o braku potwierdzenia maila
nie wiem czy to kwestioa ustawin na chmurze czy coś trzeba zmienic w funkxjach supabase

</aktualne_zachowanie>

<oczekiwane_zachowanie>
na produkcji można się zalogowac od razu po założeniu użytkownika, tak samo jak lokalnie
</oczekiwane_zachowanie>


<implementation_rules>



</implementation_rules>


Przeanalizuj przedstawiony bug, porównując aktualne zachowanie z oczekiwanym zachowaniem. Uwzględnij wszystkie dostarczone materiały: PRD, stos technologiczny, plan API, typy oraz aktualną implementację.

Przed podaniem rozwiązania, użyj tagów <analiza> do przemyślenia problemu:
- Zidentyfikuj różnice między aktualnym a oczekiwanym zachowaniem
- Przeanalizuj aktualną implementację w kontekście planu API i typów
- Określ prawdopodobną przyczynę buga
- Zaplanuj kroki naprawy

Następnie napraw buga.

Pamiętaj, że wszystkie odpowiedzi, komentarze w kodzie i wyjaśnienia mają być w języku polskim. Kod powinien być gotowy do implementacji i zgodny z przedstawionym stosem technologicznym oraz planem API.

