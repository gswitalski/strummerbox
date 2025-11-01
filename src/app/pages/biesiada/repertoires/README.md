# Biesiada Repertoire List View

## Przegląd

Widok listy repertuarów w trybie Biesiada, zoptymalizowany pod kątem urządzeń mobilnych. Umożliwia Organizatorom szybki wybór repertuaru do prowadzenia spotkania towarzyskiego.

## Lokalizacja

- **Ścieżka komponentu:** `src/app/pages/biesiada/repertoires/`
- **Routing:** `/biesiada/repertoires`
- **Ochrona:** `AuthGuard`

## Struktura plików

```
biesiada/repertoires/
├── biesiada-repertoire-list-page.component.ts    # Główny komponent strony
├── biesiada-repertoire-list-page.component.html  # Szablon HTML
├── biesiada-repertoire-list-page.component.scss  # Style SCSS
├── models/
│   └── biesiada-repertoire-list.types.ts         # Typy ViewModel
├── services/
│   └── biesiada-repertoire-list.service.ts       # Serwis zarządzania stanem i API
└── README.md                                      # Ta dokumentacja
```

## Funkcjonalności

### Stany widoku

1. **Loading** - Ładowanie danych z API
2. **Success** - Wyświetlenie listy repertuarów
3. **Empty** - Brak repertuarów (z przyciskiem do zarządzania)
4. **Error** - Błąd podczas ładowania (z opcją ponownej próby)

### Interakcje użytkownika

- **Wybór repertuaru** - Kliknięcie elementu listy nawiguje do `/biesiada/repertoires/:id`
- **Ponowna próba** - Przycisk "Spróbuj ponownie" w stanie błędu
- **Przejście do zarządzania** - Przycisk "Przejdź do repertuarów" w pustym stanie

## Integracja API

### Endpoint
- **URL:** `GET /me/biesiada/repertoires`
- **Autoryzacja:** Bearer token (automatyczny przez SupabaseService)
- **Typ odpowiedzi:** `BiesiadaRepertoireListResponseDto`

### Struktura odpowiedzi

```typescript
{
    items: [
        {
            id: string;              // UUID repertuaru
            name: string;            // Nazwa repertuaru
            songCount: number;       // Liczba piosenek
            publishedAt: string | null;  // ISO date string
        }
    ]
}
```

## Zarządzanie stanem

Komponent używa `BiesiadaRepertoireListService` z zarządzaniem stanem opartym na sygnałach Angular:

```typescript
interface BiesiadaRepertoireListViewModel {
    repertoires: BiesiadaRepertoireSummaryDto[];
    isLoading: boolean;
    error: string | null;
}
```

## Testowanie

### Testy manualne

#### 1. Test pomyślnego załadowania
1. Zaloguj się jako Organizator
2. Przejdź do `/biesiada/repertoires`
3. Oczekiwany rezultat:
   - Wyświetla się wskaźnik ładowania
   - Po załadowaniu pojawia się lista repertuarów
   - Każdy element pokazuje nazwę i liczbę piosenek

#### 2. Test pustego stanu
1. Zaloguj się jako Organizator bez repertuarów
2. Przejdź do `/biesiada/repertoires`
3. Oczekiwany rezultat:
   - Wyświetla się komunikat "Nie masz jeszcze żadnych repertuarów"
   - Widoczny przycisk "Przejdź do repertuarów"
   - Kliknięcie przycisku nawiguje do `/repertoires`

#### 3. Test nawigacji
1. Zaloguj się jako Organizator z repertuarami
2. Przejdź do `/biesiada/repertoires`
3. Kliknij na dowolny repertuar
4. Oczekiwany rezultat:
   - Aplikacja nawiguje do `/biesiada/repertoires/:id`

#### 4. Test błędu API
1. Zatrzymaj backend lub zmień URL API
2. Zaloguj się jako Organizator
3. Przejdź do `/biesiada/repertoires`
4. Oczekiwany rezultat:
   - Wyświetla się komunikat błędu
   - Widoczny przycisk "Spróbuj ponownie"
   - Kliknięcie przycisku ponawia zapytanie

#### 5. Test responsywności
1. Otwórz widok na różnych urządzeniach/rozmiarach ekranu:
   - Mobile (< 768px)
   - Tablet (>= 768px)
   - Desktop (>= 1024px)
2. Oczekiwany rezultat:
   - Elementy są odpowiednio skalowane
   - Touch targets są wystarczająco duże na mobile (min 72px)
   - Lista jest czytelna na wszystkich rozmiarach

#### 6. Test dostępności
1. Użyj czytnika ekranu (np. NVDA, JAWS)
2. Nawiguj po stronie używając klawiatury
3. Oczekiwany rezultat:
   - Wszystkie interaktywne elementy są dostępne przez klawiaturę
   - ARIA labels są prawidłowo odczytywane
   - Focus jest widoczny i logiczny

### Testy integracyjne (curl)

```bash
# Test endpointa API
curl -X GET 'http://localhost:54321/functions/v1/me/biesiada/repertoires' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

## Dostępność

Komponent implementuje następujące funkcje dostępności:

- **ARIA labels** - Wszystkie interaktywne elementy mają odpowiednie etykiety
- **Role** - Semantyczne role HTML (list, listitem, alert, status)
- **Live regions** - aria-live dla dynamicznych zmian stanu
- **Focus management** - Widoczne i logiczne focus states
- **Keyboard navigation** - Pełna obsługa klawiatury

## Optymalizacje

### Performance
- **OnPush Change Detection** - Minimalizuje niepotrzebne renderowanie
- **Signals** - Reaktywne zarządzanie stanem
- **Lazy loading** - Komponent ładowany on-demand
- **Track by** - Optymalizacja renderowania list (`track repertoire.id`)

### Mobile
- **Touch targets** - Minimalna wysokość 72px dla elementów listy
- **Tap highlight** - Wyłączony domyślny highlight (`-webkit-tap-highlight-color: transparent`)
- **Hover effects** - Animacje i efekty wizualne
- **Responsive typography** - Skalowana czcionka dla różnych rozmiarów

## Znane ograniczenia

1. **Brak paginacji** - Lista nie obsługuje paginacji (wszystkie repertuary są pobierane naraz)
2. **Brak sortowania** - Lista nie obsługuje sortowania
3. **Brak filtrowania** - Lista nie obsługuje wyszukiwania/filtrowania

## Przyszłe usprawnienia

1. Dodać paginację dla dużej liczby repertuarów
2. Dodać wyszukiwanie/filtrowanie repertuarów
3. Dodać sortowanie (po nazwie, dacie utworzenia, liczbie piosenek)
4. Dodać pull-to-refresh na mobile
5. Dodać animacje przejść między widokami
6. Dodać możliwość oznaczeń "ostatnio używany"

