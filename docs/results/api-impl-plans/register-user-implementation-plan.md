# API Endpoint Implementation Plan: POST /me/register

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia rejestrację nowego użytkownika (organizatora) w systemie. Proces obejmuje utworzenie konta w usłudze Supabase Authentication oraz powiązanego z nim profilu w tabeli `profiles`. W przypadku sukcesu, zwraca dane nowo utworzonego profilu.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/functions/v1/me/register`
- **Parametry:**
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string",
    "displayName": "string"
  }
  ```

## 3. Wykorzystywane typy
-   **Command Model (wejście):** `OrganizerRegisterCommand`
    ```typescript
    export type OrganizerRegisterCommand = {
        email: string;
        password: string;
        displayName: string;
    };
    ```
-   **DTO (wyjście):** `OrganizerProfileDto`
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
-   **Odpowiedź sukcesu (201 Created):**
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "email": "organizer@example.com",
      "displayName": "Basia",
      "createdAt": "2025-10-18T10:00:00Z",
      "updatedAt": "2025-10-18T10:00:00Z"
    }
    ```
-   **Odpowiedzi błędów:**
    -   `400 Bad Request` - Błędy walidacji danych wejściowych.
    -   `409 Conflict` - Użytkownik o podanym adresie email już istnieje.
    -   `500 Internal Server Error` - Wewnętrzne błędy serwera.

## 5. Przepływ danych
1.  Żądanie `POST` trafia do `supabase/functions/me/index.ts`.
2.  Router w `index.ts` identyfikuje ścieżkę `/register` i przekazuje żądanie do dedykowanego routera w `register.handlers.ts`.
3.  Handler w `register.handlers.ts` waliduje ciało żądania przy użyciu Zod.
4.  W przypadku pomyślnej walidacji, handler wywołuje funkcję `registerOrganizer` z `register.service.ts`.
5.  Serwis `register.service.ts` wykonuje następujące kroki:
    a. Wywołuje `supabase.auth.signUp()` w celu utworzenia użytkownika w Supabase Auth.
    b. Jeśli `signUp` się powiedzie, używa zwróconego `user.id` do wstawienia nowego rekordu do tabeli `profiles`.
    c. Jeśli wstawianie do `profiles` nie powiedzie się, serwis wywołuje `supabase.auth.admin.deleteUser()` w celu usunięcia nowo utworzonego użytkownika z Auth, zapewniając spójność danych.
    d. Po pomyślnym utworzeniu użytkownika i profilu, serwis pobiera dane i konstruuje obiekt `OrganizerProfileDto`.
6.  Serwis zwraca `OrganizerProfileDto` do handlera.
7.  Handler formatuje odpowiedź HTTP `201 Created` z `OrganizerProfileDto` w ciele i wysyła ją do klienta.

## 6. Względy bezpieczeństwa
-   **Walidacja:** Wszystkie dane wejściowe muszą być walidowane za pomocą Zod w warstwie handlera, aby zapobiec nieprawidłowym danym.
-   **Hasła:** Hasła nie są nigdzie przechowywane ani logowane. Są przekazywane bezpośrednio do Supabase Auth przez bezpieczne połączenie.
-   **Transakcyjność:** Kluczowe jest zapewnienie atomowości operacji. Rejestracja musi zakończyć się albo pełnym sukcesem (użytkownik w Auth + profil w DB), albo pełnym wycofaniem zmian.
-   **Uprawnienia:** Do usunięcia użytkownika w przypadku błędu (rollback) będzie używany klient Supabase z kluczem `SERVICE_ROLE_KEY`.

## 7. Rozważania dotyczące wydajności
-   Operacje są uzależnione od czasu odpowiedzi usług Supabase (Auth i Baza Danych).
-   Nie przewiduje się znaczących wąskich gardeł wydajnościowych przy typowym obciążeniu.

## 8. Etapy wdrożenia
1.  **Aktualizacja `packages/contracts`**:
    -   Upewnij się, że typ `OrganizerRegisterCommand` został dodany do `packages/contracts/types.ts`.
2.  **Implementacja serwisu (`register.service.ts`)**:
    -   Utwórz plik `supabase/functions/me/register.service.ts`.
    -   Zaimplementuj funkcję `registerOrganizer({ email, password, displayName })`.
    -   Dodaj logikę do wywołania `supabase.auth.signUp()`.
    -   Dodaj logikę do wstawiania rekordu do tabeli `profiles`.
    -   Zaimplementuj mechanizm rollback (usunięcie użytkownika z Auth) w bloku `catch` w przypadku błędu tworzenia profilu.
    -   Zapewnij, że funkcja zwraca obiekt zgodny z `OrganizerProfileDto`.
3.  **Implementacja handlera i routera (`register.handlers.ts`)**:
    -   Utwórz plik `supabase/functions/me/register.handlers.ts`.
    -   Zdefiniuj schemat walidacji Zod dla `OrganizerRegisterCommand`.
    -   Stwórz `handleRegister` który parsuje i waliduje ciało żądania.
    -   W `handleRegister`, wywołaj `register.service.ts#registerOrganizer`.
    -   Obsłuż potencjalne błędy z serwisu (np. `409 Conflict`) i mapuj je na odpowiednie odpowiedzi HTTP.
    -   Zwróć odpowiedź `201 Created` z DTO profilu.
    -   Eksportuj router, który obsługuje metodę `POST` na ścieżce `/`.
4.  **Aktualizacja głównego routera (`index.ts`)**:
    -   W pliku `supabase/functions/me/index.ts`, zaimportuj router z `register.handlers.ts`.
    -   Dodaj logikę, która dla żądań zaczynających się od `/register` będzie delegować obsługę do nowo utworzonego routera rejestracji.
5.  **Konfiguracja zmiennych środowiskowych**:
    -   Upewnij się, że `SUPABASE_SERVICE_ROLE_KEY` jest dostępny w środowisku funkcji Edge do operacji administracyjnych (rollback).
