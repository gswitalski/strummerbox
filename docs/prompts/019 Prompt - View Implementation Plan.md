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

### Zmodyfikowany widok: Tworzenie / Edycja Piosenki (Song Create/Edit View)

-   **Ścieżka:** `/management/songs/new`, `/management/songs/:id/edit`
-   **Notatka o zmianach:**
    -   Logika edytora została odwrócona. Główne pole tekstowe (`textarea`) służy teraz do wprowadzania danych w formacie "akordy nad tekstem".
    -   Panel podglądu wyświetla na żywo wynik konwersji do formatu ChordPro.
    -   Usunięto przycisk "Importuj z tekstu" oraz powiązane z nim okno modalne (`ImportFromTextDialogComponent`), ponieważ funkcjonalność ta została zintegrowana bezpośrednio z edytorem.

#### Zaktualizowany opis widoku:

-   **Główny cel:** Dodawanie nowej lub modyfikacja istniejącej piosenki.
-   **Kluczowe informacje:** Formularz z polem na tytuł piosenki, edytor tekstu dla treści w formacie "akordy nad tekstem". Podgląd na żywo piosenki skonwertowanej do formatu ChordPro.
-   **Kluczowe komponenty:** `mat-form-field`, `textarea`, `mat-button`, niestandardowy komponent edytora "side-by-side".
-   **UX, dostępność, bezpieczeństwo:**
    -   **UX:** Na desktopie układ "side-by-side" (edycja w formacie "akordy nad tekstem" po lewej, podgląd w formacie ChordPro po prawej). Na mobile układ z zakładkami (`mat-tab-group`) do przełączania się między edycją a podglądem. Walidacja (np. unikalność tytułu) z komunikatami błędów.
    -   **Dostępność:** Etykiety pól formularza.
    -   **Bezpieczeństwo:** Dostęp chroniony.



</views>

4. User Stories:
<user_stories>
### Zaktualizowana historyjka

Poniższa historyjka użytkownika zastępuje poprzednią wersję `US-004`.

-   **ID:** US-004
-   **Title:** Tworzenie i edycja piosenki z intuicyjnym edytorem
-   **Description:** Jako Organizator, chcę móc dodawać i edytować piosenki w mojej bazie, wpisując tekst w naturalnym formacie "akordy nad tekstem" i jednocześnie widzieć podgląd, jak zostanie on zapisany w formacie ChordPro.
-   **Acceptance Criteria:**
    -   Formularz dodawania/edycji piosenki zawiera pole na tytuł oraz duży edytor tekstu.
    -   Do edytora wprowadzam tekst piosenki w formacie, gdzie linia z akordami znajduje się bezpośrednio nad linią z tekstem.
    -   Obok edytora (w widoku "side-by-side") wyświetlany jest podgląd piosenki w czasie rzeczywistym, pokazujący skonwertowaną treść w formacie ChordPro (np. `[G]Idę sobie [D]ulicą...`).
    -   System nie pozwala na zapisanie piosenki bez tytułu.
    -   System nie pozwala na zapisanie piosenki o tytule, który już istnieje w mojej bazie.
    -   Podczas edycji istniejącej piosenki, jej zawartość (zapisana w ChordPro) jest automatycznie konwertowana do formtu "akordy nad tekstem" i umieszczana w edytorze.
    -   Po zapisaniu, piosenka jest widoczna na liście moich piosenek.

### Usunięta historyjka

-   **ID:** US-021
-   **Title:** Importowanie piosenki z formatu "akordy nad tekstem"
-   **Notatka:** Ta historyjka została usunięta, ponieważ nowy edytor natywnie obsługuje format "akordy nad tekstem", co czyni dedykowaną funkcję importu zbędną.

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

<dodatkowe_wskazówki>
Należy wykorzystać gotowe funkcje do konwertowanie z chordpro do 'akordy nad tekstem' (przy odczycie piosenkii z bazy i ładowaniu do edytora.) ora z formatu 'akordy nad tekstem' do chordpro do prezentowania podglądu i zapisu piosenki na backendzie.
z chordpro do 'akordy nad tekstem wykorzystuje komponet do prezentcji piosenki
z 'akordy nad tekstem' do chord pro wykorzystywany jest przy imporcie piosenk z formatu 'akordy nad tekstem'.

Obie funkcjonalności nalezy wydzielić z komponentów i umieścić w serwisie.

</dodatkowe_wskazówki>


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
