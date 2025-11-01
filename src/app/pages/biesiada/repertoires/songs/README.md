# Biesiada Repertoire Song List View

## Przegląd
Widok wyświetlający listę piosenek w wybranym repertuarze w ramach trybu Biesiada. Zoptymalizowany pod kątem urządzeń mobilnych.

## Routing
- **Ścieżka:** `/biesiada/repertoires/:id`
- **Ochrona:** `authGuard` (tylko zalogowani użytkownicy)

## Struktura komponentów

```
BiesiadaRepertoireSongListPageComponent (smart component)
├── mat-toolbar (nawigacja)
├── mat-progress-bar (podczas ładowania)
├── Error display (w przypadku błędu)
└── BiesiadaRepertoireSongListComponent (dumb component)
    └── mat-list (lista piosenek)
```

## Komponenty

### BiesiadaRepertoireSongListPageComponent
**Typ:** Smart Component (Container)

**Odpowiedzialności:**
- Pobieranie ID repertuaru z URL
- Inicjalizacja pobierania danych z API
- Zarządzanie nawigacją (powrót, przejście do piosenki)
- Obsługa błędów i stanów ładowania
- Integracja z serwisem stanu

**Główne metody:**
- `ngOnInit()` - inicjalizacja i pobieranie danych
- `ngOnDestroy()` - czyszczenie stanu
- `navigateBack()` - powrót do listy repertuarów
- `onSongSelected(songId)` - nawigacja do szczegółów piosenki
- `onRetry()` - ponowne pobranie danych po błędzie

### BiesiadaRepertoireSongListComponent
**Typ:** Dumb Component (Presentational)

**Odpowiedzialności:**
- Wyświetlanie listy piosenek
- Obsługa kliknięć na piosenkach
- Wyświetlanie pustego stanu gdy brak piosenek

**Inputs:**
- `@Input() songs: BiesiadaRepertoireSongEntryDto[]` - lista piosenek do wyświetlenia

**Outputs:**
- `@Output() songSelected: EventEmitter<string>` - zdarzenie wyboru piosenki

## Zarządzanie stanem

### BiesiadaRepertoireSongListService
Serwis zarządzający stanem widoku przy użyciu sygnałów Angular.

**State Interface:**
```typescript
interface BiesiadaRepertoireSongListViewModel {
    repertoireId: string | null;
    repertoireName: string | null;
    songs: BiesiadaRepertoireSongEntryDto[];
    isLoading: boolean;
    error: string | null;
}
```

**Public API:**
- `vm` - readonly signal z aktualnym stanem
- `fetchRepertoireSongs(id)` - pobieranie listy piosenek
- `reset()` - reset stanu do wartości początkowych

## Integracja API

**Endpoint:** `GET /me/biesiada/repertoires/{id}/songs`

**Response Type:** `BiesiadaRepertoireSongListResponseDto`
```typescript
{
    repertoireId: string;
    repertoireName: string;
    share: BiesiadaRepertoireShareMetaDto;
    songs: BiesiadaRepertoireSongEntryDto[];
}
```

## Interakcje użytkownika

1. **Wejście na stronę**
   - Użytkownik klika na repertuar w `/biesiada/repertoires`
   - Nawigacja do `/biesiada/repertoires/:id`
   - Automatyczne pobranie listy piosenek

2. **Wybór piosenki**
   - Użytkownik klika na piosenkę z listy
   - Nawigacja do `/biesiada/repertoires/:id/songs/:songId`

3. **Powrót**
   - Użytkownik klika przycisk "wstecz" w toolbar
   - Nawigacja do `/biesiada/repertoires`

4. **Obsługa błędów**
   - Wyświetlenie komunikatu o błędzie
   - Przycisk "Spróbuj ponownie" do ponownego pobrania danych

## Stany widoku

### Loading State
- Wyświetlany `mat-progress-bar` pod toolbarem
- Lista piosenek ukryta

### Error State
- Wyświetlana ikona błędu
- Komunikat o błędzie
- Przycisk "Spróbuj ponownie"

### Success State
- Lista piosenek wyświetlona
- Każda piosenka pokazuje pozycję i tytuł

### Empty State
- Komunikat "Ten repertuar nie zawiera żadnych piosenek"
- Ikona `music_off`

## Responsywność

Widok jest zoptymalizowany pod kątem:
- Urządzeń mobilnych (primary use case)
- Tabletów
- Desktopów

## Dostępność (a11y)

- Proper ARIA labels na wszystkich interaktywnych elementach
- Role attributes dla semantyki
- Keyboard navigation support
- Screen reader support
- Focus indicators

## Wykorzystane moduły Material

- `MatToolbarModule` - górny pasek nawigacyjny
- `MatButtonModule` - przyciski
- `MatIconModule` - ikony
- `MatProgressBarModule` - pasek ładowania
- `MatListModule` - lista piosenek

## Pliki

```
songs/
├── biesiada-repertoire-song-list-page.component.ts
├── biesiada-repertoire-song-list-page.component.html
├── biesiada-repertoire-song-list-page.component.scss
├── components/
│   └── list/
│       ├── biesiada-repertoire-song-list.component.ts
│       ├── biesiada-repertoire-song-list.component.html
│       └── biesiada-repertoire-song-list.component.scss
├── services/
│   └── biesiada-repertoire-song-list.service.ts
├── models/
│   └── biesiada-repertoire-song-list.types.ts
└── README.md
```

## Implementacja zgodna z

- Angular 19 standalone components
- Signals dla zarządzania stanem
- OnPush change detection strategy
- Angular Material 3 design system
- Projektowe zasady BEM dla CSS
- Accessibility best practices

