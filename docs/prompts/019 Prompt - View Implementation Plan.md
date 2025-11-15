Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
<prd>



</prd>

2. UI Plan:
<ui_plan>



</ui_plan>

3. Widok do implementacji
<view>
### Zmodyfikowane Widoki

#### **2. Widok Rejestracji (Register View)**

*   **Ścieżka:** `/register` - wejscie do ściezki poprzez dodanie dodatkowego przycisku "Zarejestruj się" na formularzu logowania
*   **Główny cel:** Umożliwienie nowemu Organizatorowi założenia konta.
*   **Kluczowe informacje:** Formularz z polami na e-mail, nick (displayName) i hasło (z potwierdzeniem).
*   **Kluczowe komponenty:** Takie same jak w Widoku Logowania.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Walidacja hasła (np. minimalna długość) i jego potwierdzenia po stronie klienta. Komunikaty o błędach (np. "Konto o tym adresie e-mail już istnieje"). Po pomyślnej rejestracji użytkownik jest przekierowywany na nowy "Widok Oczekiwania na Potwierdzenie E-mail".
    *   **Dostępność:** Jak w widoku logowania.
    *   **Bezpieczeństwo:** Jak w widoku logowania.
*   ***Notatka o zmianie:*** *Zmieniono przepływ UX po pomyślnej rejestracji. Zamiast automatycznego logowania i przekierowania do dashboardu, użytkownik jest teraz kierowany do nowego "Widoku Oczekiwania na Potwierdzenie E-mail".*

---

### Nowe Widoki

#### **3. Widok Oczekiwania na Potwierdzenie E-mail (Awaiting Email Confirmation View)**

*   **Ścieżka:** `/auth/awaiting-confirmation`
*   **Główny cel:** Poinformowanie użytkownika o konieczności weryfikacji adresu e-mail w celu dokończenia procesu rejestracji.
*   **Kluczowe informacje:** Wyraźny komunikat, np. "Rejestracja prawie zakończona! Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny, aby dokończyć proces." Ikona koperty. Informacja o adresie e-mail, na który wysłano link. Przycisk/link "Nie otrzymałem e-maila. Wyślij ponownie".
*   **Kluczowe komponenty:** `mat-card`, `mat-icon`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty, jednoznaczny widok, który nie pozostawia wątpliwości co do następnego kroku. Umożliwia łatwe ponowne wysłanie linku w przypadku problemów.
    *   **Dostępność:** Etykiety dla wszystkich interaktywnych elementów.
    *   **Bezpieczeństwo:** Widok publiczny, nie wymaga uwierzytelnienia.

</view>

4. User Stories:
<user_stories>
-   **ID:** US-001
-   **Title:** Rejestracja nowego Organizatora
-   **Description:** Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do funkcji zarządzania piosenkami i repertuarami.
-   **Acceptance Criteria:**
    -   Formularz logownanie jest rozszerzony o przycisk "Zarejestruj" sie, który prrzekierowuje użytkownika do formularza rejestracji
    -   Formularz rejestracji zawiera pola na adres e-mail, nick i hasło.
    -   System waliduje, czy podany e-mail jest w poprawnym formacie.
    -   System sprawdza, czy e-mail nie jest już zarejestrowany.
    -   Po pomyślnym wypełnieniu formularza, na mój adres e-mail wysyłana jest wiadomość z linkiem aktywacyjnym.
    -   Jestem przekierowywany na stronę informującą o konieczności sprawdzenia skrzynki e-mail w celu dokończenia rejestracji.
    -   Próba logowania przed aktywacją konta skutkuje wyświetleniem odpowiedniego komunikatu z możliwością ponownego wysłania linku.
-   ***Notatka o zmianie:*** *Główne kryterium akceptacji zostało zmienione. Zamiast automatycznego logowania po rejestracji, użytkownik musi teraz potwierdzić swój adres e-mail. Dodano kroki dotyczące wysyłki linku aktywacyjnego i przekierowania na stronę informacyjną.*
</user_stories>

5. Endpoint Description:
<endpoint_description>
#### POST /auth/register
- **Method:** POST
- **Path:** `/auth/register`
- **Description:** Register a new organizer. Creates an inactive user in Supabase Auth, which triggers a confirmation email. The account is not active until the email link is clicked. Also creates a corresponding profile entry.
- **Request JSON:**
```json
{
  "email": "organizer@example.com",
  "password": "supersecretpassword",
  "displayName": "Basia"
}
```
- **Response JSON:** same as `GET /me/profile`.
- **Success:** `201 Created`
- **Errors:** `400 Bad Request` (invalid payload, e.g. weak password), `409 Conflict` (email already exists).



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
