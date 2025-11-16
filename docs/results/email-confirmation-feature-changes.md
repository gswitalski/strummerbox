# Podsumowanie Zmian - Funkcjonalność Potwierdzenia Adresu E-mail

Ten dokument podsumowuje wszystkie zmiany i dodatki wprowadzone do dokumentacji projektowej w celu implementacji funkcjonalności potwierdzenia adresu e-mail podczas rejestracji.

## 1. Historyjki Użytkownika

### Zmodyfikowane Historyjki

---

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

---

-   **ID:** US-002
-   **Title:** Logowanie Organizatora
-   **Description:** Jako zarejestrowany Organizator, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich piosenek i repertuarów.
-   **Acceptance Criteria:**
    -   Formularz logowania zawiera pola na adres e-mail i hasło.
    -   Po podaniu poprawnych danych jestem zalogowany i przekierowany do panelu zarządzania.
    -   W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat.
    -   W przypadku próby logowania na konto, które nie zostało aktywowane przez e-mail, wyświetlany jest komunikat o konieczności aktywacji konta.
-   ***Notatka o zmianie:*** *Dodano nowe kryterium akceptacji, które obsługuje przypadek próby logowania na nieaktywowane (niepotwierdzone e-mailem) konto.*

---

### Nowe Historyjki

-   **ID:** US-022
-   **Title:** Potwierdzenie adresu e-mail w celu aktywacji konta
-   **Description:** Jako nowy Organizator, po otrzymaniu e-maila aktywacyjnego, chcę móc kliknąć w zawarty w nim link, aby pomyślnie aktywować moje konto i uzyskać możliwość logowania się do aplikacji.
-   **Acceptance Criteria:**
    -   Link aktywacyjny otrzymany w wiadomości e-mail jest unikalny.
    -   Kliknięcie w link przenosi mnie na dedykowaną stronę w aplikacji, która potwierdza status weryfikacji.
    -   Po pomyślnej weryfikacji, strona wyświetla komunikat o sukcesie i przycisk przekierowujący do strony logowania.
    -   Po aktywacji konta mogę się bez problemu zalogować na swoje dane.
    -   W przypadku, gdy link jest nieprawidłowy lub wygasł, strona wyświetla stosowny komunikat o błędzie oraz oferuje możliwość ponownego wysłania e-maila aktywacyjnego.

---

-   **ID:** US-023
-   **Title:** Ponowne wysłanie e-maila aktywacyjnego
-   **Description:** Jako nowy Organizator, który nie otrzymał e-maila aktywacyjnego lub którego link wygasł, chcę mieć możliwość ponownego wysłania wiadomości z linkiem, aby dokończyć proces rejestracji.
-   **Acceptance Criteria:**
    -   Na stronie logowania, a także na stronie błędu po kliknięciu w nieważny link, znajduje się opcja "Wyślij e-mail aktywacyjny ponownie".
    -   Po jej wybraniu, mogę wpisać swój adres e-mail w formularzu.
    -   System weryfikuje, czy e-mail istnieje w bazie i czy konto wciąż jest nieaktywne.
    -   Jeśli warunki są spełnione, na podany adres e-mail wysyłana jest nowa wiadomość z nowym, unikalnym linkiem aktywacyjnym.

---

## 2. API

### Zmodyfikowane Endpointy

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
- ***Notatka o zmianie:*** *Ścieżka została zmieniona z `/register` na `/auth/register`. Opis został zaktualizowany, aby odzwierciedlić, że konto jest tworzone jako nieaktywne i wysyłany jest e-mail weryfikacyjny.*

---

### Nowe Endpointy

#### POST /auth/resend-confirmation
- **Method:** POST
- **Path:** `/auth/resend-confirmation`
- **Description:** Resends the confirmation email to a user with an unconfirmed account. This endpoint calls the underlying Supabase functionality to issue a new confirmation link.
- **Request JSON:**
```json
{
  "email": "organizer@example.com"
}
```
- **Response JSON:**
```json
{
  "message": "If an account with this email exists and is not yet confirmed, a new confirmation link has been sent."
}
```
- **Success:** `200 OK` (A generic success message is returned to prevent user enumeration).
- **Errors:** `400 Bad Request` (invalid email format).

---

## 3. Widoki

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
*   ***Notatka o zmianie:*** *Zmieniono przepływ UX po pomyślnej rejestracji. Zamiast automatycznego logowania i przekierowania do dashboardu, użytkownik jest teraz kierowany do nowego "Widoku Oczekiwania na Potwierdzenie E-mail". Dodano również obsługę nowego stanu w widoku logowania (opis poniżej), który pojawia się przy próbie logowania na niepotwierdzone konto.*

---

### Nowe Widoki

#### **3. Okno Modalne: Konto Niepotwierdzone (Dialog)**

*   **Kontekst:** Wyświetlane w ramach **Widoku Logowania**.
*   **Główny cel:** Poinformowanie użytkownika, że jego konto nie jest jeszcze aktywne i umożliwienie ponownego wysłania linku aktywacyjnego.
*   **Kluczowe informacje:** Komunikat "Konto nieaktywne. Sprawdź swoją skrzynkę e-mail, aby dokończyć rejestrację."
*   **Kluczowe komponenty:** `mat-dialog`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Dialog pojawia się po próbie logowania na niepotwierdzone konto, blokując dalsze akcje do czasu jego zamknięcia. Zawiera przyciski "Zamknij" oraz "Wyślij link ponownie".
    *   **Dostępność:** Dialog jest modalny, fokus klawiatury jest poprawnie zarządzany.
    *   **Bezpieczeństwo:** Akcja ponownego wysłania linku komunikuje się z bezpiecznym endpointem API.

---

#### **4. Widok Oczekiwania na Potwierdzenie E-mail (Awaiting Email Confirmation View)**

*   **Ścieżka:** `/auth/awaiting-confirmation`
*   **Główny cel:** Poinformowanie użytkownika o konieczności weryfikacji adresu e-mail w celu dokończenia procesu rejestracji.
*   **Kluczowe informacje:** Wyraźny komunikat, np. "Rejestracja prawie zakończona! Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny, aby dokończyć proces." Ikona koperty. Informacja o adresie e-mail, na który wysłano link. Przycisk/link "Nie otrzymałem e-maila. Wyślij ponownie".
*   **Kluczowe komponenty:** `mat-card`, `mat-icon`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Prosty, jednoznaczny widok, który nie pozostawia wątpliwości co do następnego kroku. Umożliwia łatwe ponowne wysłanie linku w przypadku problemów.
    *   **Dostępność:** Etykiety dla wszystkich interaktywnych elementów.
    *   **Bezpieczeństwo:** Widok publiczny, nie wymaga uwierzytelnienia.

---

#### **5. Widok Potwierdzenia E-mail (Email Confirmation View)**

*   **Ścieżka:** `/auth/confirm-email` (lub inna ścieżka zwrotna skonfigurowana w Supabase)
*   **Główny cel:** Obsługa kliknięcia w link aktywacyjny przez użytkownika i poinformowanie go o wyniku.
*   **Kluczowe informacje:** Wskaźnik ładowania (`MatSpinner`) podczas weryfikacji tokenu. Po weryfikacji:
    *   **Sukces:** Komunikat "Twoje konto zostało aktywowane!" i przycisk "Przejdź do logowania".
    *   **Błąd (np. link wygasł):** Komunikat "Link aktywacyjny jest nieprawidłowy lub wygasł." i przycisk "Wyślij nowy link aktywacyjny".
*   **Kluczowe komponenty:** `MatSpinner`, `mat-card`, `mat-button`.
*   **UX, dostępność, bezpieczeństwo:**
    *   **UX:** Jasny feedback dla użytkownika o wyniku operacji. Zapewnia łatwą ścieżkę do logowania lub rozwiązania problemu.
    *   **Dostępność:** Odpowiednie role ARIA do komunikowania stanu (np. `aria-live` dla komunikatów o statusie).
    *   **Bezpieczeństwo:** Strona obsługuje tokeny (jednorazowe, ograniczone czasowo) w parametrach URL, które są przetwarzane w celu aktywacji konta.

---
