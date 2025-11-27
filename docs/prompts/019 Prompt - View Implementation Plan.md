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

Zmiany w interfejsie użytkownika koncentrują się na istniejących widokach piosenek oraz wprowadzeniu nowego komponentu do obsługi transpozycji.

### Nowy Komponent: `TransposeControlsComponent`

-   **Opis:** Mały, reużywalny komponent prezentacyjny, który renderuje interfejs do zmiany tonacji. Składa się z przycisków "-" i "+", które emitują zdarzenia zmiany, oraz wyświetlacza aktualnego przesunięcia (np. "+1", "-2").
-   **API:** `@Input() offset: number`, `@Output() change: EventEmitter<number>`.
-   **Użycie:** Wewnętrznie przez `SongViewerComponent`.

### Zmiany w `SongViewerComponent`

-   **Opis:** Komponent został zaktualizowany, aby mógł zarządzać i wyświetlać `TransposeControlsComponent`.
-   **Zmiany w API:**
    -   Dodano `@Input() transposeOffset: number`, aby przyjąć aktualny stan transpozycji.
    -   Dodano `@Input() config: SongViewerConfig`, w którym pojawiła się nowa flaga `showTransposeControls: boolean`, aby kontrolować widoczność narzędzia.
    -   Dodano `@Output() transposeChanged: EventEmitter<number>`, aby informować komponent nadrzędny o żądaniu zmiany tonacji.
-   **Logika:** `SongViewerComponent` będzie teraz warunkowo renderować `TransposeControlsComponent` na podstawie konfiguracji i stanu widoczności akordów.

### Zmiany w Widokach Nadrzędnych

-   **Publiczny Widok Piosenki (`Public Song View`):**
    -   **Zmiana:** W tym widoku `SongViewerComponent` jest konfigurowany tak, aby `TransposeControlsComponent` pojawiał się tylko wtedy, gdy użytkownik włączy widoczność akordów. Stan transpozycji jest zarządzany lokalnie w tym widoku.
-   **Tryb Biesiada - Widok Piosenki (`Biesiada Song View`):**
    -   **Zmiana:** W tym widoku `SongViewerComponent` jest konfigurowany tak, aby `TransposeControlsComponent` był widoczny domyślnie, niezależnie od przełącznika akordów (który jest tu niewidoczny, bo akordy są zawsze włączone dla Organizatora).


</views>

4. User Stories:
<user_stories>

Do dokumentu PRD dodano następujące historyjki użytkownika, które definiują nową funkcjonalność z perspektywy użytkownika końcowego.

### ID: US-025
-   **Title:** Transpozycja ad-hoc w widoku publicznym
-   **Description:** Jako Biesiadnik grający na instrumencie, chcę móc tymczasowo zmienić tonację wyświetlanej piosenki, aby dopasować ją do stroju mojego instrumentu lub możliwości wokalnych grupy.
-   **Acceptance Criteria:**
    -   W widoku publicznym piosenki, kontrolki transpozycji pojawiają się tylko wtedy, gdy włączony jest tryb "Pokaż akordy".
    -   Interfejs zawiera przyciski "-" i "+" oraz licznik przesunięcia (np. +2).
    -   Zmiana tonacji następuje natychmiastowo bez przeładowania strony.
    -   Wyłączenie widoku akordów ukrywa kontrolki transpozycji.

### ID: US-026
-   **Title:** Transpozycja w trybie Organizatora (Biesiada)
-   **Description:** Jako Organizator prowadzący śpiewanie, chcę mieć szybki dostęp do zmiany tonacji, aby zareagować na potrzeby grupy w trakcie imprezy.
-   **Acceptance Criteria:**
    -   W trybie 'Biesiada' kontrolki transpozycji są widoczne na stałe w widoku piosenki.
    -   Transpozycja jest lokalna dla sesji przeglądarki i nie zmienia oryginalnego zapisu piosenki na serwerze.

</user_stories>

5. Endpoint Description:
<endpoint_description>

**Nie wprowadzono żadnych zmian w API.**

Funkcjonalność transpozycji została zaimplementowana w całości po stronie klienta (w aplikacji Angular). Istniejące endpointy API dostarczają pełną treść piosenki w formacie ChordPro, co jest wystarczające do przeprowadzenia operacji transpozycji w przeglądarce. Takie podejście unika dodatkowych zapytań do serwera i zapewnia natychmiastową odpowiedź interfejsu.


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
