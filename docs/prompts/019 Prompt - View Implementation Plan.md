Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
<prd>



</prd>

2. UI Plan:
<ui_plan>



</ui_plan>

3. Nazwa widoku do implementacji
<view_name>
Tworzenie / Edycja Repertuaru (Repertoire Create/Edit View)
</view_name>

4. User Stories:
<user_stories>
-   ID: US-008
-   Title: Tworzenie nowego repertuaru
-   Description: Jako Organizator, chcę móc stworzyć nowy repertuar, nadając mu nazwę i wybierając do niego piosenki z mojej biblioteki.
-   Acceptance Criteria:
    -   Formularz tworzenia repertuaru pozwala na wpisanie unikalnej nazwy.
    -   Widzę listę wszystkich moich piosenek i mogę je zaznaczyć, aby dodać do repertuaru.
    -   Po zapisaniu, nowy repertuar pojawia się na liście repertuarów.

-   ID: US-010
-   Title: Edycja repertuaru
-   Description: Jako Organizator, chcę móc edytować istniejący repertuar, zmieniając jego nazwę, dodając lub usuwając piosenki oraz zmieniając ich kolejność.
-   Acceptance Criteria:
    -   Mogę zmienić nazwę repertuaru.
    -   Mogę dodawać nowe piosenki z mojej biblioteki.
    -   Mogę usuwać piosenki z repertuaru (bez usuwania ich z głównej biblioteki).
    -   Mogę przesuwać piosenki w górę i w dół na liście za pomocą dedykowanych przycisków.
</user_stories>

5. Endpoint Description:
<endpoint_description>
#### GET /repertoires/{id}/songs
- **Method:** GET
- **Path:** `/repertoires/{id}/songs`
- **Description:** Return ordered songs with optional chord content.
- **Query Parameters:**
  - `includeContent` (`true|false`, default `false`)
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "songs": [
    {
      "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
      "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
      "title": "Knockin' on Heaven's Door",
      "position": 1,
      "content": "[G]Mama..."
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### PATCH /repertoires/{id}
- **Method:** PATCH
- **Path:** `/repertoires/{id}`
- **Description:** Update repertoire metadata (name, description).
- **Request JSON:**
```json
{
  "name": "Ognisko 2025 (aktualizacja)",
  "description": "Nowa lista utworów"
}
```
- **Response JSON:** updated repertoire resource.
- **Success:** `200 OK`
- **Errors:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (duplicate name).

#### POST /repertoires/{id}/songs
- **Method:** POST
- **Path:** `/repertoires/{id}/songs`
- **Description:** Append songs to repertoire; new entries are appended to the end.
- **Request JSON:**
```json
{
  "songIds": ["a1320a1b-4e2b-44b0-a1f6-8e37b406df1d", "b300b6eb-9acf-4f42-8d53-9377637a77b6"]
}
```
- **Response JSON:**
```json
{
  "added": [
    {
      "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
      "songId": "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d",
      "position": 3
    }
  ],
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42"
}
```
- **Success:** `201 Created`
- **Errors:** `400 Bad Request` (invalid song IDs), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (repertoire or song not owned by organizer).


#### DELETE /repertoires/{id}/songs/{repertoireSongId}
- **Method:** DELETE
- **Path:** `/repertoires/{id}/songs/{repertoireSongId}`
- **Description:** Remove a song from the repertoire; positions are compacted automatically.
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "removed": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
  "positionsRebuilt": true
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### POST /repertoires/{id}/songs/reorder
- **Method:** POST
- **Path:** `/repertoires/{id}/songs/reorder`
- **Description:** Replace the order of songs using an ordered array of `repertoireSongId` values.
- **Request JSON:**
```json
{
  "order": [
    "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
    "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60"
  ]
}
```
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "songs": [
    {
      "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
      "position": 1
    },
    {
      "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
      "position": 2
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `400 Bad Request` (order missing entries or duplicates), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.


</endpoint_description>

6. Endpoint Implementation:
<endpoint_implementation>



</endpoint_implementation>

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

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

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

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku docs/results/impl-plans/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
