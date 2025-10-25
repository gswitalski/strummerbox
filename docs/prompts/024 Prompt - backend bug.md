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

endpoint zmiany kolejnosic poisenek w repertuarze zgłaza błąd
POST http://127.0.0.1:54321/functions/v1/repertoires/64c9ecbd-b7c2-496c-9979-f0b03390a29b/songs/reorder

{
  "order": [
    "a4d0a62e-6f42-47ae-ad84-fc337c7ab33c",
    "2ce2ef65-ceb2-4702-858e-740ba6c12571",
    "f6ba816a-90cd-4533-b56e-adf486e416fa",
    "25d75719-4aed-40c1-8f5b-c2270df6d5f1",
    "be7add4f-ff6f-4ada-98be-fb37b2bc145d",
    "55a8dfa4-8108-4556-a30a-28d0ef19b173",
    "5d561ab4-e7db-43a2-b718-3a07ed47d735",
    "0d703016-3fe2-4037-9530-69080b07f6ec",
    "c568c3b3-dfd1-4424-988d-c21815e7e2e7"
  ]
}

odpowiedz:
{
    "code": "internal_error",
    "message": "Nie udało się zaktualizować kolejności piosenek",
    "details": null
}



</aktualne_zachowanie>

<oczekiwane_zachowanie>
zmieniona kolejnosc piosenek wg przesłanych danych w body
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

