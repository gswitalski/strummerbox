# API Endpoint Implementation Plan: POST /auth/register

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia rejestrację nowego użytkownika (organizatora) w systemie. Proces ten tworzy nieaktywne konto w usłudze Supabase Auth oraz powiązany profil w tabeli `profiles`. Po wywołaniu tego endpointu, Supabase automatycznie wysyła na podany adres e-mail wiadomość z linkiem aktywacyjnym. Konto pozostaje nieaktywne do momentu, gdy użytkownik potwierdzi swój adres e-mail, klikając w otrzymany link.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/auth/register`
- **Parametry:** Brak parametrów w URL.
- **Request Body:** Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "email": "string",
    "password": "string",
    "displayName": "string"
  }
  ```
  - **Wymagane pola:** `email`, `password`, `displayName`.

## 3. Wykorzystywane typy
- **Command Model (wejście):** `OrganizerRegisterCommand`
  ```typescript
  export type OrganizerRegisterCommand = {
      email: string;
      password: string;
      displayName: string;
  };
  ```
- **DTO (wyjście):** `OrganizerProfileDto`
  ```typescript
  export type OrganizerProfileDto = {
      id: string; // UUID
      email: string;
      displayName: string;
      createdAt: string; // ISO 8601
      updatedAt: string; // ISO 8601
  };
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created):** Zwraca nowo utworzony profil organizatora w formacie `OrganizerProfileDto`.
  ```json
  {
    "data": {
      "id": "uuid-goes-here",
      "email": "organizer@example.com",
      "displayName": "Basia",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z"
    }
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (błędy walidacji, np. zły format email, za krótkie hasło).
  - `409 Conflict`: Użytkownik o podanym adresie e-mail już istnieje.
  - `500 Internal Server Error`: Wystąpił nieoczekiwany błąd serwera.

## 5. Przepływ danych
1.  Handler `handleRegister` odbiera żądanie `POST`.
2.  Funkcja `parseRequestBody` waliduje ciało żądania przy użyciu schematu `zod`. W przypadku błędu rzuca `ValidationError`.
3.  Handler wywołuje serwis `registerOrganizer` z poprawnymi danymi (`OrganizerRegisterCommand`).
4.  Serwis `registerOrganizer` wywołuje `supabase.auth.signUp` z `email` i `password`. Supabase Auth:
    -   Sprawdza, czy użytkownik już istnieje.
    -   Sprawdza siłę hasła (jeśli skonfigurowano).
    -   Tworzy nieaktywne konto użytkownika.
    -   Wysyła e-mail z linkiem potwierdzającym na podany adres.
5.  Jeśli utworzenie konta w Auth powiedzie się, serwis `registerOrganizer` zapisuje nowy wiersz w tabeli `profiles`, używając `id` nowo utworzonego użytkownika jako klucza głównego.
6.  Jeśli zapis profilu do bazy danych nie powiedzie się, wywoływana jest funkcja `rollbackUserCreation`, która usuwa wcześniej utworzone konto użytkownika z Supabase Auth w celu zachowania spójności danych.
7.  Po pomyślnym utworzeniu profilu, serwis zwraca dane profilu (`OrganizerProfileDto`).
8.  Handler formatuje odpowiedź jako JSON i zwraca ją z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa
- **Walidacja danych:** Wszystkie dane wejściowe muszą być walidowane za pomocą `zod` po stronie serwera w celu ochrony przed atakami typu injection i zapewnienia integralności danych.
- **Siła hasła:** Należy polegać na wbudowanych w Supabase mechanizmach weryfikacji siły hasła. Odpowiedzi błędów z Supabase API powinny być mapowane na odpowiednie kody statusu HTTP (np. `400 Bad Request`).
- **Rate Limiting:** Należy skonfigurować mechanizmy ograniczania liczby żądań (Rate Limiting) na poziomie Supabase, aby chronić endpoint przed atakami typu brute-force i spamem.
- **Atomowość:** Kluczowe jest utrzymanie mechanizmu `rollbackUserCreation`, aby zapobiec powstawaniu "osieroconych" kont użytkowników w Supabase Auth, które nie mają swojego odpowiednika w tabeli `profiles`.

## 7. Rozważania dotyczące wydajności
- Operacje na bazie danych są proste (pojedynczy `INSERT`), więc nie przewiduje się problemów z wydajnością.
- Czas odpowiedzi będzie głównie zależny od czasu odpowiedzi usług Supabase Auth i Database. W normalnych warunkach powinien być akceptowalny.

## 8. Etapy wdrożenia
1.  **Stworzenie nowej Edge Function:**
    -   Utworzyć nowy katalog `supabase/functions/auth/`.
2.  **Przeniesienie i adaptacja istniejącej logiki:**
    -   Przenieść pliki `supabase/functions/me/register.handlers.ts` oraz `supabase/functions/me/register.service.ts` do `supabase/functions/auth/`.
    -   Zaktualizować ścieżki importów w przeniesionych plikach.
3.  **Implementacja routera dla nowej funkcji:**
    -   Stworzyć plik `supabase/functions/auth/index.ts`.
    -   W `index.ts` dodać logikę routingu, która dla ścieżki `/register` i metody `POST` wywoła `registerRouter` z pliku `register.handlers.ts`.
4.  **Modyfikacja logiki serwisu:**
    -   W pliku `supabase/functions/auth/register.service.ts`, w funkcji `registerOrganizer`, zlokalizować i **usunąć** blok kodu odpowiedzialny za natychmiastowe potwierdzanie adresu e-mail:
      ```typescript
      // DO USUNIĘCIA:
      const { error: confirmError } = await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
      });
      // ... wraz z całą logiką obsługi błędu confirmError
      ```
5.  **Czyszczenie starej implementacji:**
    -   Usunąć odwołanie do `registerRouter` z pliku `supabase/functions/me/index.ts` (lub innego miejsca, gdzie był on używany), aby usunąć stary endpoint `/me/register`.
6.  **Testowanie:**
    -   Uruchomić nową funkcję lokalnie za pomocą `supabase functions serve auth`.
    -   Przetestować endpoint `POST http://localhost:54321/functions/v1/auth/register` używając narzędzia do testowania API (np. Postman).
    -   Zweryfikować, że:
        -   Poprawne żądanie zwraca status `201 Created` i dane profilu.
        -   W panelu Supabase Auth pojawia się nowy, **niepotwierdzony** użytkownik.
        -   Na podany adres e-mail przychodzi wiadomość z linkiem weryfikacyjnym.
        -   Nieprawidłowe żądania zwracają odpowiednie kody błędów (`400`, `409`).
