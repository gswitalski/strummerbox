# API Endpoint Implementation Plan: POST /auth/resend-confirmation

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia ponowne wysłanie wiadomości e-mail z linkiem potwierdzającym do użytkownika, którego konto nie zostało jeszcze zweryfikowane. Głównym celem jest zapewnienie mechanizmu odzyskiwania dla użytkowników, którzy nie otrzymali lub przypadkowo usunęli pierwotną wiadomość. Kluczowym aspektem implementacji jest ochrona przed enumeracją użytkowników poprzez zwracanie generycznej odpowiedzi.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Ścieżka URL:** `/auth/resend-confirmation`
- **Request Body:**
  ```json
  {
    "email": "string"
  }
  ```

## 3. Wykorzystywane typy
W pliku `packages/contracts/types.ts` zostanie dodany nowy typ `Command` do obsługi żądania.

```typescript
/**
 * Command to resend a confirmation email.
 * Used in: POST /auth/resend-confirmation
 */
export type ResendConfirmationCommand = {
    email: string;
};
```

## 4. Szczegóły odpowiedzi
- **Kod sukcesu:** `200 OK`
- **Treść odpowiedzi sukcesu:**
  ```json
  {
    "message": "If an account with this email exists and is not yet confirmed, a new confirmation link has been sent."
  }
  ```
  Ta odpowiedź jest zwracana celowo w każdym przypadku (poza błędami walidacji), aby uniemożliwić atakującym odgadnięcie, które adresy e-mail są zarejestrowane w systemie.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na adres `/functions/v1/auth/resend-confirmation` z adresem e-mail w ciele żądania.
2.  Główny router w `supabase/functions/auth/index.ts` przekierowuje żądanie do dedykowanego routera dla tej operacji.
3.  Handler w `supabase/functions/auth/resend-confirmation.handlers.ts` parsuje i waliduje ciało żądania przy użyciu `zod`. Jeśli walidacja nie powiedzie się, zwraca odpowiedź `400 Bad Request`.
4.  Jeśli dane są poprawne, handler wywołuje funkcję `resendConfirmationEmail` z pliku `supabase/functions/auth/resend-confirmation.service.ts`, przekazując zweryfikowany adres e-mail.
5.  Funkcja serwisowa wywołuje metodę `supabase.auth.resend({ type: 'signup', email })`. Supabase wewnętrznie obsługuje logikę sprawdzania statusu użytkownika i wysyłki e-maila.
6.  Niezależnie od wyniku operacji w Supabase (czy użytkownik istnieje, czy nie, czy jest już potwierdzony), funkcja serwisowa kończy działanie bez zwracania błędu.
7.  Handler zwraca standardową, generyczną odpowiedź w formacie JSON ze statusem `200 OK`.

## 6. Względy bezpieczeństwa
- **Ochrona przed enumeracją użytkowników:** Jest to kluczowy wymóg. Implementacja musi gwarantować, że odpowiedź API nie ujawnia informacji o istnieniu lub statusie konta powiązanego z danym adresem e-mail.
- **Walidacja danych wejściowych:** Wszystkie dane wejściowe muszą być rygorystycznie walidowane, aby zapobiec atakom typu injection i zapewnić stabilność działania.

## 7. Obsługa błędów
- **`400 Bad Request`**: Zwracany, gdy ciało żądania jest nieprawidłowym JSON-em lub gdy pole `email` nie przejdzie walidacji (jest puste lub ma nieprawidłowy format). Błąd jest logowany na poziomie `warn`.
- **`500 Internal Server Error`**: W przypadku krytycznego, nieoczekiwanego błędu po stronie Supabase, błąd jest logowany na poziomie `error`, jednak klient wciąż otrzymuje generyczną odpowiedź `200 OK`, aby nie zdradzać wewnętrznego stanu systemu. To zachowanie jest celowe dla tego konkretnego punktu końcowego.
- **`405 Method Not Allowed`**: Zwracany, jeśli żądanie używa innej metody niż `POST`.

## 8. Rozważania dotyczące wydajności
Operacja jest lekka i polega głównie na wywołaniu zewnętrznej usługi (Supabase Auth). Nie przewiduje się problemów z wydajnością. Czas odpowiedzi będzie zależny od czasu odpowiedzi serwerów Supabase.

## 9. Etapy wdrożenia
1.  **Aktualizacja kontraktów:** Zdefiniować typ `ResendConfirmationCommand` w pliku `packages/contracts/types.ts`.
2.  **Implementacja serwisu:** Utworzyć plik `supabase/functions/auth/resend-confirmation.service.ts`. W nim zaimplementować funkcję `resendConfirmationEmail`, która przyjmuje `ResendConfirmationCommand` i wywołuje `supabase.auth.resend`. Funkcja powinna opakować wywołanie w blok `try...catch` w celu logowania ewentualnych błędów.
3.  **Implementacja handlera:** Utworzyć plik `supabase/functions/auth/resend-confirmation.handlers.ts`.
    -   Zdefiniować schemat walidacji `zod` dla `ResendConfirmationCommand`.
    -   Stworzyć funkcję `handleResendConfirmation`, która parsuje żądanie, waliduje je, wywołuje serwis i zwraca odpowiedź `200 OK`.
    -   Stworzyć i wyeksportować `resendConfirmationRouter`, który sprawdza metodę `POST` i kieruje żądanie do handlera.
4.  **Aktualizacja głównego routera:** Zmodyfikować plik `supabase/functions/auth/index.ts`, aby obsługiwał nową ścieżkę. Należy dodać logikę, która rozpozna żądanie do `/resend-confirmation` i przekaże je do `resendConfirmationRouter`.
5.  **Dokumentacja:** Upewnić się, że nowy punkt końcowy jest odpowiednio udokumentowany, z wyjaśnieniem celowego zachowania dotyczącego generycznej odpowiedzi.
