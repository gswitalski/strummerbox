# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard jest głównym ekranem powitalnym dla zalogowanego użytkownika w roli "Organizatora". Służy jako punkt startowy po pomyślnym uwierzytelnieniu, zapewniając użytkownikowi prosty interfejs z szybkim dostępem do kluczowych akcji – tworzenia nowych piosenek i repertuarów. Widok ma za zadanie potwierdzić użytkownikowi, że jest zalogowany i wprowadzić go w obszar zarządzania aplikacją.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
-   **Ścieżka:** `/dashboard`
-   **Ochrona:** Dostęp do tej ścieżki musi być chroniony przez `AuthGuard` (implementujący `CanActivate`), który będzie weryfikować, czy użytkownik jest uwierzytelniony. W przypadku braku uwierzytelnienia, użytkownik zostanie przekierowany na stronę logowania (`/login`).

## 3. Struktura komponentów
Struktura dla tego widoku jest bardzo prosta i składa się z jednego głównego komponentu.

```
/dashboard
└── DashboardComponent
```

## 4. Szczegóły komponentów
### DashboardComponent
-   **Opis komponentu:** Komponent ten renderuje stronę powitalną. Wyświetla spersonalizowany nagłówek z nazwą użytkownika oraz dwa przyciski wzywające do akcji, które umożliwiają szybkie przejście do najważniejszych funkcji aplikacji.
-   **Główne elementy:**
    -   Nagłówek `<h1>` lub `<h2>` z tekstem powitalnym, np. "Witaj, [nazwa wyświetlana użytkownika]!".
    -   Dwa przyciski `mat-raised-button` z Angular Material:
        -   "Dodaj nową piosenkę"
        -   "Stwórz nowy repertuar"
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "Dodaj nową piosenkę" powoduje nawigację do ścieżki `/management/songs/new`.
    -   Kliknięcie przycisku "Stwórz nowy repertuar" powoduje nawigację do ścieżki `/management/repertoires/new`.
-   **Obsługiwana walidacja:** Ten komponent nie zawiera logiki walidacji formularzy. Jedyną weryfikacją jest kontrola dostępu do widoku realizowana na poziomie routingu.
-   **Typy:**
    -   `OrganizerProfileDto`: Używany do pobrania i wyświetlenia danych zalogowanego użytkownika.
-   **Propsy (Inputs):** Komponent nie przyjmuje żadnych właściwości wejściowych.

## 5. Typy
Do implementacji tego widoku wymagany jest jeden główny typ DTO, który będzie dostarczany przez serwis stanu.

-   **`OrganizerProfileDto`**: Obiekt transferu danych zawierający informacje o profilu organizatora.
    ```typescript
    import type { ProfileRow } from '../database/database.types';

    export type OrganizerProfileDto = {
        id: ProfileRow['id'];
        email: string;
        displayName: ProfileRow['display_name'];
        createdAt: ProfileRow['created_at'];
        updatedAt: ProfileRow['updated_at'];
    };
    ```
    -   `id`: UUID użytkownika.
    -   `email`: Adres e-mail użytkownika.
    -   `displayName`: Nazwa wyświetlana, która zostanie użyta w komunikacie powitalnym.
    -   `createdAt`, `updatedAt`: Znaczniki czasu.

## 6. Zarządzanie stanem
Stan dla tego widoku będzie zarządzany centralnie przez dedykowany serwis (np. `ProfileService` lub jako część `AuthService`), który będzie odpowiedzialny za przechowywanie informacji o zalogowanym użytkowniku.

-   **`ProfileService`**:
    -   Serwis będzie zawierał `BehaviorSubject`, który przechowuje aktualny stan profilu użytkownika (`OrganizerProfileDto | null`).
    -   Udostępni publiczny `Observable` (`profile$`), do którego komponenty mogą subskrybować, aby otrzymywać aktualne dane profilu.
    -   Metoda `fetchProfile()` będzie odpowiedzialna za jednorazowe pobranie danych użytkownika po zalogowaniu i zaktualizowanie `BehaviorSubject`.
-   **`DashboardComponent`**:
    -   Wstrzyknie `ProfileService` w konstruktorze.
    -   Zasubskrybuje do `profile$` w celu uzyskania dostępu do `displayName` i wyświetlenia go w szablonie. Komponent będzie używał potoku `async` do obsługi subskrypcji w szablonie.

## 7. Integracja API
Chociaż widok sam w sobie nie inicjuje bezpośrednio żadnych wywołań API, jego działanie opiera się na danych, które są pobierane z API po procesie logowania.

-   **Endpoint:** `GET /me/profile`
-   **Akcja:** Po pomyślnym zalogowaniu, aplikacja (poprzez `ProfileService`) wyśle żądanie do tego punktu końcowego w celu pobrania danych użytkownika.
-   **Typ odpowiedzi:** Odpowiedź serwera będzie zgodna ze strukturą `OrganizerProfileDto`.
-   **Obsługa w komponencie:** `DashboardComponent` otrzyma te dane pośrednio, poprzez subskrypcję do `ProfileService`.

## 8. Interakcje użytkownika
-   **Wejście na stronę:** Użytkownik widzi spersonalizowane powitanie i dwa główne przyciski akcji.
-   **Kliknięcie przycisku "Dodaj nową piosenkę":**
    -   **Oczekiwany rezultat:** Aplikacja płynnie przechodzi do widoku tworzenia nowej piosenki pod adresem `/management/songs/new`.
-   **Kliknięcie przycisku "Stwórz nowy repertuar":**
    -   **Oczekiwany rezultat:** Aplikacja płynnie przechodzi do widoku tworzenia nowego repertuaru pod adresem `/management/repertoires/new`.

## 9. Warunki i walidacja
-   **Warunek dostępu:** Użytkownik musi być zalogowany.
    -   **Weryfikacja:** `AuthGuard` na poziomie `app.routes.ts`. Jeśli warunek nie jest spełniony, następuje przekierowanie do `/login`.
-   **Wyświetlanie danych profilu:**
    -   **Warunek:** Dane profilu (`OrganizerProfileDto`) zostały pomyślnie załadowane do `ProfileService`.
    -   **Weryfikacja:** W szablonie komponentu, użycie `*ngIf="profile$ | async as profile"` do warunkowego renderowania.
    -   **Stan interfejsu:** Jeśli dane są dostępne, wyświetlany jest komunikat "Witaj, {profile.displayName}!". W przeciwnym razie (podczas ładowania lub w przypadku błędu) wyświetlany jest ogólny komunikat "Witaj w StrummerBox!".

## 10. Obsługa błędów
-   **Scenariusz 1: Użytkownik niezalogowany próbuje uzyskać dostęp do `/dashboard`**
    -   **Obsługa:** `AuthGuard` przechwytuje próbę nawigacji i przekierowuje użytkownika na stronę `/login` bez wyświetlania komponentu.
-   **Scenariusz 2: Błąd podczas pobierania danych profilu użytkownika z API**
    -   **Obsługa:** `ProfileService` powinien obsłużyć błąd (np. `catchError` w potoku RxJS) i wyemitować `null` jako wartość profilu. `DashboardComponent`, subskrybując do serwisu, otrzyma `null` i wyświetli ogólny, niespersonalizowany komunikat powitalny. Błąd powinien zostać zarejestrowany w konsoli w celach diagnostycznych.

## 11. Kroki implementacji
1.  **Utworzenie komponentu:** Wygeneruj nowy komponent za pomocą Angular CLI: `ng generate component pages/dashboard`.
2.  **Konfiguracja routingu:** W pliku `src/app/app.routes.ts` dodaj nową ścieżkę:
    ```typescript
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard] // Upewnij się, że AuthGuard jest zaimplementowany i dodany
    }
    ```
3.  **Implementacja serwisu profilu:** Upewnij się, że `ProfileService` (lub analogiczny) istnieje i implementuje logikę pobierania oraz przechowywania danych `OrganizerProfileDto` z wykorzystaniem `BehaviorSubject`.
4.  **Implementacja szablonu HTML:** W pliku `dashboard.component.html` stwórz strukturę widoku z użyciem komponentów Angular Material (`mat-button`) oraz potoku `async` do wyświetlania danych.
    ```html
    <div *ngIf="profile$ | async as profile; else genericWelcome">
      <h1>Witaj, {{ profile.displayName }}!</h1>
    </div>
    <ng-template #genericWelcome>
      <h1>Witaj w StrummerBox!</h1>
    </ng-template>
    <p>Co chcesz dzisiaj zrobić?</p>
    <div>
      <button mat-raised-button color="primary" (click)="navigateToAddSong()">Dodaj nową piosenkę</button>
      <button mat-raised-button (click)="navigateToCreateRepertoire()">Stwórz nowy repertuar</button>
    </div>
    ```
5.  **Implementacja logiki komponentu:** W pliku `dashboard.component.ts` wstrzyknij `ProfileService` oraz `Router`. Zaimplementuj metody nawigacyjne (`navigateToAddSong`, `navigateToCreateRepertoire`) i udostępnij observable profilu do szablonu.
6.  **Stylizowanie:** W pliku `dashboard.component.scss` dodaj style, aby zapewnić odpowiedni wygląd i responsywność, np. układ przycisków na mniejszych ekranach.
