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
http://127.0.0.1:54321/functions/v1/public/repertoires/5a73b695-ccb3-4fb9-845f-7abbec1ae249

zwraca 410

{
    "error": {
        "code": "resource_gone",
        "message": "Repertuar nie jest już dostępny",
        "details": {
            "reason": "unpublished"
        }
    }
}

mimo, że repertuar ma date publikacji czyli jest opublikowany

</aktualne_zachowanie>

<oczekiwane_zachowanie>
endpoint zraca dane reperturaru z kodem 200
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

