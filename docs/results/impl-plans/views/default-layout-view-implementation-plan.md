# Plan implementacji widoku: Layout Główny (Chroniony)

## 1. Przegląd
Layout Główny (Chroniony) stanowi główną ramę (shell) aplikacji dla zalogowanego użytkownika (`Organizatora`). Jego celem jest zapewnienie spójnej struktury nawigacyjnej i wizualnej dla wszystkich chronionych widoków. Składa się z górnego paska narzędzi (`Toolbar`) oraz bocznego panelu nawigacyjnego (`Sidenav`), który jest w pełni responsywny. Layout ten jest kontenerem dla wszystkich widoków dostępnych po uwierzytelnieniu, takich jak Dashboard, zarządzanie piosenkami czy repertuarami.

## 2. Routing widoku
Komponent layoutu nie będzie posiadał własnej, bezpośredniej ścieżki. Zamiast tego, zostanie zastosowany do nadrzędnej, chronionej trasy (`/management`), która będzie zawierać wszystkie zagnieżdżone widoki panelu zarządzania. Dostęp do tej trasy będzie chroniony przez `AuthGuard`.

**Przykładowa konfiguracja w `app.routes.ts`:**
```typescript
{
    path: 'management',
    component: DefaultLayoutComponent,
    canActivate: [authGuard], // Zabezpieczenie trasy
    children: [
        { path: 'dashboard', component: DashboardComponent },
        { path: 'songs', component: SongListComponent },
        { path: 'repertoires', component: RepertoireListComponent },
        // ...inne chronione ścieżki
    ]
},
{ path: '', redirectTo: 'management/dashboard', pathMatch: 'full' }
```

## 3. Struktura komponentów
Struktura opiera się na trzech głównych, reużywalnych komponentach, które razem tworzą spójny layout.

```
/src/app/layout/
|
+-- default-layout/
|   +-- default-layout.component.ts         // Główny kontener z <mat-sidenav-container>
|   +-- default-layout.component.html       // Template
|   `-- default-layout.component.scss       // Style
|
+-- sidenav/
|   +-- sidenav.component.ts                // Panel boczny z linkami nawigacyjnymi
|   +-- sidenav.component.html
|   `-- sidenav.component.scss
|
`-- toolbar/
    +-- toolbar.component.ts                // Górny pasek z przełącznikiem sidenav i tytułem
    +-- toolbar.component.html
    `-- toolbar.component.scss
```

## 4. Szczegóły komponentów

### `DefaultLayoutComponent`
-   **Opis komponentu:** Główny komponent-kontener, który zarządza ułożeniem panelu bocznego i głównej treści. Wykorzystuje `mat-sidenav-container` z Angular Material. Jest odpowiedzialny za logikę responsywności, czyli zmianę trybu wyświetlania `mat-sidenav` w zależności od szerokości ekranu.
-   **Główne elementy:**
    -   `<mat-sidenav-container>`: Główny kontener.
    -   `<app-sidenav>`: Osadzony komponent `SidenavComponent` wewnątrz `<mat-sidenav>`.
    -   `<mat-sidenav-content>`: Kontener na główną treść strony.
    -   `<app-toolbar>`: Osadzony komponent `ToolbarComponent`.
    -   `<router-outlet>`: Miejsce, w którym będą renderowane podstrony (np. Dashboard).
-   **Obsługiwane interakcje:** Nasłuchuje na zmiany szerokości ekranu, aby dynamicznie zmieniać `mode` i `opened` dla `mat-sidenav`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:** Brak.

### `SidenavComponent`
-   **Opis komponentu:** Panel boczny, który renderuje listę linków nawigacyjnych. Struktura menu jest zgodna z planem UI, z podziałem na "Panel Zarządzania" i "Tryb Biesiada". W stopce zawiera linki do profilu oraz przycisk wylogowania.
-   **Główne elementy:**
    -   `<mat-nav-list>`: Lista linków nawigacyjnych.
    -   `<a>` z atrybutem `mat-list-item` i `routerLink` dla każdego elementu menu.
    -   `<mat-icon>`: Ikony przy linkach.
    -   `<mat-divider>`: Separator sekcji.
    -   `<button mat-list-item>`: Przycisk "Wyloguj".
-   **Obsługiwane interakcje:**
    -   Kliknięcie na link nawigacyjny przenosi użytkownika do odpowiedniej podstrony.
    -   Na widoku mobilnym, kliknięcie na link powoduje zamknięcie panelu.
    -   Kliknięcie na "Wyloguj" uruchamia proces wylogowania.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `NavLink` (ViewModel).
-   **Propsy:** Brak. Komponent pobiera dane o użytkowniku i stan nawigacji z serwisów.

### `ToolbarComponent`
-   **Opis komponentu:** Górny pasek aplikacji. Wyświetla przycisk "hamburger" na urządzeniach mobilnych, który służy do przełączania widoczności `SidenavComponent`. Może również wyświetlać tytuł aktualnie otwartej strony.
-   **Główne elementy:**
    -   `<mat-toolbar>`: Główny kontener paska.
    -   `<button mat-icon-button>`: Przycisk "hamburger" (widoczny tylko na mobile).
    -   `<span>`: Tytuł strony.
-   **Obsługiwane interakcje:**
    -   Kliknięcie przycisku "hamburger" wywołuje metodę w `LayoutService` w celu otwarcia/zamknięcia panelu bocznego.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:** Brak.

## 5. Typy

### `NavLink` (ViewModel)
ViewModel opisujący pojedynczy link w panelu nawigacyjnym.
```typescript
export interface NavLink {
    path: string;       // Ścieżka routingu, np. '/management/dashboard'
    icon: string;       // Nazwa ikony z Material Icons, np. 'dashboard'
    label: string;      // Etykieta wyświetlana w menu, np. 'Dashboard'
}
```

### `UserViewModel` (ViewModel)
Uproszczony model użytkownika na potrzeby UI, tworzony na podstawie `OrganizerProfileDto`.
```typescript
export interface UserViewModel {
    email: string;
    displayName: string | null;
}
```

## 6. Zarządzanie stanem
Stan layoutu będzie zarządzany przez dedykowane, wstrzykiwalne serwisy w celu oddzielenia logiki od komponentów.

-   **`LayoutService`:** Serwis singletonowy odpowiedzialny za komunikację między komponentami layoutu.
    -   Będzie zawierał `BehaviorSubject` do przechowywania i emitowania stanu widoczności panelu bocznego (`isSidenavOpen$`).
    -   Udostępni metody `openSidenav()`, `closeSidenav()` i `toggleSidenav()`, które będą wywoływane przez `ToolbarComponent` i `SidenavComponent`.
    -   Będzie korzystał z `BreakpointObserver` z Angular CDK do śledzenia zmian szerokości ekranu i informowania `DefaultLayoutComponent` o potrzebie zmiany trybu `sidenav`.

-   **`ProfileService`:**
    -   Będzie odpowiedzialny za pobieranie i przechowywanie danych zalogowanego użytkownika (`OrganizerProfileDto`).
    -   Udostępni `BehaviorSubject` (`currentUser$`), który będzie emitował `UserViewModel`. Komponenty takie jak `SidenavComponent` będą mogły subskrybować ten strumień, aby wyświetlić np. nazwę użytkownika.

-   **`AuthService`:**
    -   Będzie zarządzał sesją użytkownika i procesem wylogowania poprzez Supabase SDK.
    -   Metoda `logout()` będzie wywoływana z `SidenavComponent`.

## 7. Integracja API
Layout nie integruje się bezpośrednio z żadnym endpointem w celu pobrania swojej głównej treści, ale inicjuje poboczne wywołania:

-   **Pobieranie profilu użytkownika:**
    -   Po załadowaniu `DefaultLayoutComponent`, `ProfileService` wywoła endpoint `GET /me/profile`.
    -   **Typ odpowiedzi:** `OrganizerProfileDto`.
    -   **Akcja:** Otrzymane dane zostaną zmapowane na `UserViewModel` i udostępnione przez `currentUser$`.

-   **Wylogowanie:**
    -   `SidenavComponent` wywoła metodę `logout()` w `AuthService`.
    -   **Akcja:** Serwis wywoła metodę `supabase.auth.signOut()`. Po pomyślnym wylogowaniu, `AuthGuard` i globalny listener stanu autentykacji przekierują użytkownika na stronę logowania (`/login`).

## 8. Interakcje użytkownika
-   **Otwarcie/zamknięcie Sidenav (mobile):** Użytkownik klika przycisk "hamburger" w `ToolbarComponent`, co zmienia stan w `LayoutService`, powodując wysunięcie/schowanie się `SidenavComponent`.
-   **Nawigacja:** Użytkownik klika link w `SidenavComponent`. Aplikacja przechodzi do odpowiedniej trasy. Jeśli użytkownik jest w trybie mobilnym, sidenav automatycznie się zamyka.
-   **Wylogowanie:** Użytkownik klika przycisk "Wyloguj" w `SidenavComponent`, co inicjuje proces wylogowania i przekierowanie na stronę logowania.

## 9. Warunki i walidacja
Jedynym warunkiem dostępu do tego layoutu jest bycie zalogowanym. Warunek ten jest weryfikowany na poziomie routingu.

-   **`AuthGuard`:**
    -   Przed aktywacją trasy używającej `DefaultLayoutComponent`, guard sprawdzi w `AuthService`, czy istnieje aktywna sesja użytkownika.
    -   Jeśli sesja nie istnieje, nawigacja zostanie anulowana, a użytkownik zostanie przekierowany na `/login`.
    -   Jeśli sesja istnieje, nawigacja jest kontynuowana.

## 10. Obsługa błędów
-   **Błąd pobierania profilu:** Jeśli wywołanie `GET /me/profile` zakończy się niepowodzeniem, `ProfileService` powinien obsłużyć błąd. `currentUser$` może wyemitować `null`. Interfejs w `SidenavComponent` powinien być przygotowany na taką sytuację i np. nie wyświetlać danych użytkownika, zamiast powodować błąd aplikacji. Można również wyświetlić dyskretny komunikat o błędzie (np. `MatSnackBar`).
-   **Błąd wylogowania:** Jeśli operacja `signOut()` w Supabase się nie powiedzie, `AuthService` powinien przechwycić błąd i poinformować użytkownika (np. przez `MatSnackBar`), że wylogowanie nie powiodło się, pozwalając mu spróbować ponownie.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:** Za pomocą Angular CLI wygeneruj trzy komponenty: `DefaultLayout`, `Toolbar`, `Sidenav` w folderze `/src/app/layout/`.
2.  **Implementacja `DefaultLayoutComponent`:**
    -   W pliku HTML dodaj `mat-sidenav-container` z `mat-sidenav` i `mat-sidenav-content`.
    -   Wewnątrz `mat-sidenav` umieść `<app-sidenav>`, a w `mat-sidenav-content` umieść `<app-toolbar>` oraz `<router-outlet>`.
    -   W pliku TS użyj `BreakpointObserver` do nasłuchiwania na zmiany szerokości ekranu.
    -   Zasubskrybuj obserwatora i dynamicznie przypisuj wartości do właściwości `[mode]` (`'side'` na desktop, `'over'` na mobile) i `[opened]` (`true` na desktop, `false` na mobile) komponentu `mat-sidenav`.
3.  **Implementacja `ToolbarComponent`:**
    -   Dodaj `mat-toolbar`.
    -   Dodaj przycisk `mat-icon-button` z ikoną "menu". Powinien być on widoczny tylko na mobile (użyj `ngIf` w połączeniu ze stanem z `BreakpointObserver` dostarczonym przez `LayoutService`).
    -   Podłącz zdarzenie `(click)` przycisku do metody `layoutService.toggleSidenav()`.
4.  **Implementacja `SidenavComponent`:**
    -   Stwórz listę linków (`NavLink[]`) w pliku TS.
    -   W pliku HTML użyj `*ngFor` do wyrenderowania linków wewnątrz `<mat-nav-list>`.
    -   Dodaj sekcje i separatory zgodnie z planem UI.
    -   Dodaj przycisk "Wyloguj" i podłącz jego zdarzenie `(click)` do metody `authService.logout()`.
5.  **Utworzenie serwisów:**
    -   Stwórz `LayoutService` z `BehaviorSubject` do zarządzania stanem sidenav i logiką `BreakpointObserver`.
    -   Upewnij się, że `ProfileService` i `AuthService` mają wymaganą logikę do pobierania profilu i wylogowywania.
6.  **Konfiguracja routingu:**
    -   Stwórz `AuthGuard`, który będzie sprawdzał stan zalogowania.
    -   Zaktualizuj `app.routes.ts`, aby używać `DefaultLayoutComponent` jako komponentu dla chronionej ścieżki nadrzędnej i zastosuj do niej `AuthGuard`.
7.  **Stylowanie:** Dopracuj wygląd komponentów za pomocą SCSS, aby były zgodne z ogólnym projektem aplikacji, dbając o responsywność.
