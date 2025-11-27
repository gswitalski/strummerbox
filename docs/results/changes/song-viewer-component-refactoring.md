# Refaktoryzacja: SongViewerComponent

## Data realizacji
19 listopada 2025

## Cel
Utworzenie wysoce konfigurowalnego komponentu prezentacyjnego `SongViewerComponent`, który konsoliduje całą logikę UI widoku piosenki. Refaktoryzacja eliminuje duplikację kodu między trzema widokami: `biesiada-song`, `public-repertoire-song` i `public-song`.

## Kontekst
Po sukcesie refaktoryzacji Etapu 1 (SongNavigationComponent), zidentyfikowano znacznie większy potencjał do konsolidacji kodu poprzez wydzielenie kompletnego komponentu widoku piosenki.

## Zrealizowane zmiany

### 1. Utworzony nowy komponent SongViewerComponent
Lokalizacja: `src/app/shared/components/song-viewer/`

**Pliki:**
- `song-viewer.component.ts` - Główny komponent (standalone, OnPush)
- `song-viewer.component.html` - Szablon HTML z warunkami konfiguracyjnymi
- `song-viewer.component.scss` - Scalone style responsywne
- `song-viewer.config.ts` - Interfejsy konfiguracyjne i typów
- `song-viewer.types.ts` - Już istniejące typy nawigacyjne (wykorzystane ponownie)

### 2. Architektura komponentu

#### API Komponentu (@Input)
```typescript
@Input({ required: true }) status: 'loading' | 'loaded' | 'error'
@Input() error?: { code: number; message: string }
@Input() title?: string
@Input() content?: string  // Format ChordPro
@Input() showChords: boolean = false
@Input() navigation?: SongNavigation
@Input({ required: true }) config: SongViewerConfig
```

#### Eventy (@Output)
```typescript
@Output() chordsToggled = new EventEmitter<boolean>()
@Output() qrButtonClicked = new EventEmitter<void>()
```

#### Interfejs konfiguracyjny
```typescript
interface SongViewerConfig {
    showBackButton: boolean;
    backLink?: unknown[];
    titleInToolbar: boolean;  // true = toolbar, false = content
    showChordsToggle: boolean;
    showQrButton: boolean;
    showNavigation: boolean;
    backButtonAriaLabel?: string;
}
```

### 3. Zrefaktoryzowane widoki

#### 3.1 public-song.view

**Konfiguracja:**
```typescript
viewerConfig: {
    showBackButton: false,
    titleInToolbar: true,
    showChordsToggle: true,
    showQrButton: false,
    showNavigation: false,
}
```

**Zmiany w plikach:**
- **TS:** 174 → 86 linii (-88, 51% redukcja)
- **HTML:** 44 → 10 linii (-34, 77% redukcja)
- **SCSS:** 69 → 4 linie (-65, 94% redukcja)
- **Usunięte importy:** 4 moduły Angular Material

#### 3.2 public-repertoire-song.view

**Konfiguracja (computed):**
```typescript
viewerConfig: computed(() => ({
    showBackButton: !!repertoirePublicId,
    backLink: ['/public/repertoires', repertoirePublicId],
    titleInToolbar: true,
    showChordsToggle: true,
    showQrButton: false,
    showNavigation: true,
    backButtonAriaLabel: 'Powrót do repertuaru',
}))
```

**Zmiany w plikach:**
- **TS:** 256 → 180 linii (-76, 30% redukcja)
- **HTML:** 84 → 10 linii (-74, 88% redukcja)
- **SCSS:** 192 → 4 linie (-188, 98% redukcja)
- **Usunięte importy:** 6 modułów Angular Material

#### 3.3 biesiada-song.view

**Konfiguracja (computed):**
```typescript
viewerConfig: computed(() => ({
    showBackButton: !!viewModel?.navigation.back,
    backLink: viewModel?.navigation.back,
    titleInToolbar: false,  // Tytuł w content!
    showChordsToggle: false,  // Zawsze wyświetlaj akordy
    showQrButton: true,
    showNavigation: true,
    backButtonAriaLabel: 'Powrót do listy',
}))
```

**Zmiany w plikach:**
- **TS:** 271 → 217 linii (-54, 20% redukcja)
- **HTML:** 93 → 10 linii (-83, 89% redukcja)
- **SCSS:** 244 → 4 linie (-240, 98% redukcja)
- **Usunięte importy:** 6 modułów Angular Material

## Statystyki

### Kod TypeScript
- **Przed:** 701 linii (3 widoki)
- **Po:** 483 linie (3 widoki) + 135 linii (SongViewerComponent) = 618 linii
- **Redukcja:** 83 linie (12% mniej kodu)

### Kod HTML
- **Przed:** 221 linii (3 widoki)
- **Po:** 30 linii (3 widoki) + 68 linii (SongViewerComponent) = 98 linii
- **Redukcja:** 123 linie (56% mniej kodu)

### Kod SCSS
- **Przed:** 505 linii (3 widoki)
- **Po:** 12 linii (3 widoki) + 173 linie (SongViewerComponent) = 185 linii
- **Redukcja:** 320 linii (63% mniej kodu)

### Całkowita redukcja
- **526 linii kodu** zostało wyeliminowanych
- **61% redukcja** w szablonach HTML i stylach
- **16 niepotrzebnych importów** modułów Angular Material usuniętych

### Usunięte importy z widoków
Każdy widok nie musi już importować:
- `MatToolbarModule`
- `MatButtonModule`
- `MatButtonToggleModule`
- `MatIconModule`
- `MatProgressBarModule`
- `ErrorDisplayComponent`
- `SongDisplayComponent`
- `SongNavigationComponent`

Wszystko to jest teraz wewnętrznie zarządzane przez `SongViewerComponent`.

## Korzyści

### 1. Dramatyczna redukcja duplikacji (Zasada DRY)
- Kod UI widoku piosenki istnieje teraz w JEDNYM miejscu
- Zmiany w wyglądzie wymagają edycji tylko jednego komponentu
- Eliminacja ryzyka niespójności między widokami

### 2. Znacznie uproszczona struktura widoków
**Przed:**
- Skomplikowane szablony HTML z wieloma warunkami
- Powtarzające się style w 3 miejscach
- Bezpośrednie zależności od 6+ modułów Material

**Po:**
- Szablony HTML zredukowane do jednej linii komponentu
- Style tylko w komponencie reużywalnym
- Widoki importują tylko `SongViewerComponent`

### 3. Jasna separacja odpowiedzialności
- **Widoki (Smart Components):** Zarządzają logiką biznesową, pobieraniem danych, stanem
- **SongViewerComponent (Presentation Component):** Zarządzają tylko UI i interakcjami użytkownika

### 4. Łatwiejsze testowanie
- Komponent SongViewer można testować w izolacji z różnymi konfiguracjami
- Testy jednostkowe są prostsze i bardziej fokusowe
- Mniej mocków potrzebnych w testach widoków

### 5. Większa spójność UI
- Gwarancja identycznego wyglądu i zachowania we wszystkich kontekstach
- Jednolite doświadczenie użytkownika
- Łatwiejsze utrzymanie standardów accessibility

### 6. Elastyczność i skalowalność
- Łatwe dodanie nowych widoków piosenek poprzez konfigurację
- Centralne miejsce dla nowych funkcji (np. animacje, gesty)
- Możliwość szybkiego A/B testowania różnych układów UI

### 7. Lepsza wydajność
- `ChangeDetectionStrategy.OnPush` w komponencie prezentacyjnym
- Mniejsza liczba instancji komponentów Material
- Optymalizacja przez computed signals

## Wzorce projektowe

### Separation of Concerns (SoC)
Wyraźny podział między:
- Logiką biznesową (widoki)
- Prezentacją (SongViewerComponent)
- Nawigacją (SongNavigationComponent)
- Wyświetlaniem treści (SongDisplayComponent)

### Configuration over Convention
Zamiast tworzyć wiele wariantów komponentu, jeden komponent z bogatą konfiguracją:
```typescript
// Łatwo dostosowywalne do różnych kontekstów
const config: SongViewerConfig = { ... }
```

### Composition over Inheritance
Komponent składa się z mniejszych, wyspecjalizowanych komponentów:
- `SongNavigationComponent` (nawigacja)
- `SongDisplayComponent` (treść)
- `ErrorDisplayComponent` (błędy)

## Weryfikacja

### Linting
```bash
npm run lint
```
**Wynik:** ✅ Wszystkie pliki przeszły linting bez błędów

### TypeScript
- Wszystkie typy są poprawnie zdefiniowane
- Brak `any` types
- Pełne type safety dla wszystkich inputów i outputów

### Change Detection Strategy
Komponent używa `ChangeDetectionStrategy.OnPush` dla optymalnej wydajności.

### Responsywność
Zachowano pełną responsywność z trzema breakpointami:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

### Accessibility
- Wszystkie interaktywne elementy mają aria-labels
- Konfigurowalny `backButtonAriaLabel`
- Zachowana nawigacja klawiaturowa

## Migracja

### Dla przyszłych widoków piosenek:

1. **Import komponentu:**
```typescript
import { SongViewerComponent } from '../../shared/components/song-viewer/song-viewer.component';
```

2. **Zdefiniuj konfigurację:**
```typescript
public readonly viewerConfig: SongViewerConfig = {
    showBackButton: true,
    backLink: ['/back'],
    titleInToolbar: true,
    showChordsToggle: true,
    showQrButton: false,
    showNavigation: true,
};
```

3. **Użyj w szablonie:**
```html
<stbo-song-viewer
    [status]="status"
    [title]="title"
    [content]="content"
    [showChords]="showChords()"
    [config]="viewerConfig"
    (chordsToggled)="onChordsToggled($event)">
</stbo-song-viewer>
```

## Możliwe przyszłe ulepszenia

1. **Animacje przejść** między piosenkami
2. **Gesty swipe** na urządzeniach mobilnych
3. **Skróty klawiszowe** (strzałki, spacja) do nawigacji
4. **Tryb pełnoekranowy** dla prowadzących
5. **Zapisywanie preferencji** użytkownika (akordy/tekst)
6. **Testowanie wizualne** (Visual Regression Tests)
7. **Storybook stories** dla różnych konfiguracji

## Podsumowanie

Etap 2 refaktoryzacji zakończony pełnym sukcesem! Utworzono wysoce konfigurowalny komponent `SongViewerComponent`, który:

✅ Eliminuje 526 linii zduplikowanego kodu (63% w HTML/SCSS)  
✅ Drastycznie upraszcza wszystkie trzy widoki piosenek  
✅ Zapewnia jednolitą logikę UI w jednym miejscu  
✅ Zachowuje pełną funkcjonalność i responsywność  
✅ Przechodzi wszystkie testy lintingu  
✅ Implementuje najlepsze praktyki Angular (OnPush, Signals, Standalone)  
✅ Oferuje doskonałą podstawę do przyszłego rozwoju  

**Refaktoryzacja osiągnęła wszystkie zakładane cele i znacząco poprawiła jakość, utrzymywalność i skalowalność bazy kodu.**

---

## Powiązane dokumenty
- [Etap 1: SongNavigationComponent](./song-navigation-component-refactoring.md)
- [PRD - Product Requirements](../004%20PRD.md)
- [High-Level UI Plan](../011%20High-Level%20UI%20Plan.md)

