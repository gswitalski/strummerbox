Jesteś doświadczonym programistą aplikacji webowych. Twoim zadaniem jest przeanalizowanie i naprawienie buga w backendzie aplikacji.

Zapoznaj się z następującymi materiałami:

<prd>



</prd>

<stos_technologiczny>



</stos_technologiczny>

<plan_ui>



</plan_ui>

<typy>



</typy>

<aktualna_implementacja>



</aktualna_implementacja>

<aktualne_zachowanie>


W insomni wywołuję
get http://127.0.0.1:54321/functions/v1/public/repertoires/5a73b695-ccb3-4fb9-845f-7abbec1ae249

i dostaję dane rpertuaru z kode 200

dla funkcji na frorntendzie:http://localhost:4200/public/songs/27abd812-84b2-4583-abc4-886423d52b1c

tego samego endpointa teoretyczne wuwołuje frontend. ale dla tego samego repertuaru frontend dostaje błąd 410 (repertuar nieopublkowane - chociaż jest opublikowany)

ponieważ w insomni jest dobrze zakłądam że backend jest dobry czyli bład gdzies jest na frocie


dodatkowa wskazówka:
dla nowego repertuaru który został opublikowany - widok dizała. Wystarczy jednak raz repertuaer odpublicznić i upublicznić ponownie - i już widok nie zadziała, chociaż w insomni endpoint działa poprawnie

</aktualne_zachowanie>

<oczekiwane_zachowanie>

frontend wysiwetla bubliczny widok repertuaru

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
