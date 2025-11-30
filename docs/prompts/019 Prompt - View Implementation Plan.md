Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
<prd>



</prd>

2. UI Plan:
<ui_plan>



</ui_plan>

3. Widok do implementacji
<views>

### Zmiany w istniejących komponentach

#### **Widok Tworzenia / Edycji Piosenki (`Song Create/Edit View`)**
-   **Zmiana**: Edytor tekstu został rozszerzony o wsparcie dla uproszczonej składni powtórzeń. Użytkownik może dodać na końcu linii znacznik `xN` (np. `x2`), który jest na żywo interpretowany i wyświetlany w panelu podglądu.

#### **`SongDisplayComponent`**
-   **Zmiana**: Komponent ten jest teraz odpowiedzialny za parsowanie dyrektywy ChordPro `{c: xN}` znajdującej się w treści piosenki.
-   **Nowe zachowanie**: Po wykryciu dyrektywy, komponent renderuje na końcu odpowiedniej linii wizualny wskaźnik powtórzenia w formacie `× N` (np. `× 2`).
-   **Styling**: Wskaźnik jest stylizowany zgodnie z nowymi wymaganiami: rozmiar czcionki jest identyczny jak tekst piosenki, a kolor pochodzi z palety tematycznej Angular Material (np. kolor dla tekstu drugorzędnego/podpowiedzi), aby zapewnić wizualne odróżnienie przy zachowaniu czytelności.


</views>

4. User Stories:
<user_stories>
### US-029: Definiowanie powtórzeń w tekście piosenki
-   **ID**: US-029
-   **Title**: Definiowanie powtórzeń w tekście piosenki
-   **Description**: Jako Organizator, podczas edycji piosenki, chcę móc w prosty sposób oznaczać powtarzające się linie tekstu lub sekwencje akordów, aby tworzyć bardziej zwięzłe i czytelne zapisy.
-   **Acceptance Criteria**:
    -   W edytorze piosenek, dodanie na końcu linii z akordami i/lub tekstem znacznika w formacie `xN` (gdzie N to liczba, np. `x2`, `x4`) jest interpretowane jako dyrektywa powtórzenia.
    -   W podglądzie "ChordPro", taka linia jest automatycznie konwertowana do standardowej dyrektywy ChordPro, np. `... {c: x2}`.
    -   W podglądzie "Biesiada" oraz w publicznym widoku piosenki, powtórzenie jest renderowane na końcu linii jako czytelny wskaźnik, np. `× 2`.
    -   Wskaźnik powtórzenia (`× 2`) jest wyświetlany czcionką o tym samym rozmiarze co tekst piosenki, ale w kolorze drugorzędnym z palety Angular Material (np. `secondary-text` lub `hint-text`), aby wizualnie odróżniał się od treści.
    -   Funkcjonalność działa zarówno dla linii zawierających tylko akordy (np. `C a d G x2`), jak i dla linii z tekstem i akordami (np. `Pieski małe dwa x2`).
    -   Podczas konwersji z formatu ChordPro do edytora, dyrektywa `{c: xN}` jest z powrotem zamieniana na prosty zapis `xN` na końcu linii.
    -   Niepoprawna składnia (np. brak liczby po `x`) jest traktowana jako zwykły tekst i nie jest konwertowana.


</user_stories>

5. Endpoint Description:
<endpoint_description>

**Nie wprowadzono żadnych zmian w API.**

</endpoint_description>


7. Type Definitions:
<type_definitions>



</type_definitions>

8. Tech Stack:
<tech_stack>



</tech_stack>

9. Frontend rules
<rules>



</rules>


Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:
1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):
  - Podsumuj kluczowe punkty
 - Wymień wszelkie wymagania lub ograniczenia
 - Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie
2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:
 - Opis komponentu, jego przeznaczenie i z czego się składa
 - Główne elementy HTML i komponenty dzieci, które budują komponent
 - Obsługiwane zdarzenia
 - Warunki walidacji (szczegółowe warunki, zgodnie z API)
 - Typy (DTO i ViewModel) wymagane przez komponent
 - Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)
5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

uwzględnij juz zaiplementowany formularz do tworzenia piosenki aby optymalnie uzywać reużywalnych komponentów

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie docs/results/impl-plans/views/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd
[Krótki opis widoku i jego celu]

## 2. Routing widoku
[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów
[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów
### [Nazwa komponentu 1]
- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]
[...]

## 5. Typy
[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem
[Opis zarządzania stanem w widoku]

## 7. Integracja API
[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika
[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja
[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów
[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji
1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku docs/results/impl-plans/views/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
