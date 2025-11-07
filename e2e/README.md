# Testy E2E dla StrummerBox

Dokumentacja testów End-to-End z wykorzystaniem Playwright.

## 📋 Spis treści

- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Uruchomienie testów](#uruchomienie-testów)
- [Struktura projektu](#struktura-projektu)
- [Pierwszy test](#pierwszy-test)

## 🔧 Wymagania

Przed uruchomieniem testów upewnij się, że masz zainstalowane:

- **Node.js** w wersji 18 lub nowszej
- **npm** lub **yarn**
- **Aplikacja Angular** musi być uruchomiona na `http://localhost:4200`

## 📦 Instalacja

### 1. Instalacja zależności projektu

```bash
npm install
```

### 2. Instalacja przeglądarek dla Playwright

Playwright wymaga pobrania przeglądarek, które będą używane do testów:

```bash
npx playwright install
```

Jeśli chcesz zainstalować tylko Chromium (zalecane dla szybszych testów):

```bash
npx playwright install chromium
```

### 3. Konfiguracja środowiska (opcjonalnie)

Skopiuj przykładowy plik konfiguracji:

```bash
cp e2e/config/.env.example e2e/config/.env.local
```

Edytuj plik `.env.local` i dostosuj zmienne środowiskowe (np. `BASE_URL`).

## 🚀 Uruchomienie testów

### Krok 1: Uruchom aplikację Angular

W pierwszym terminalu uruchom serwer deweloperski:

```bash
npm run start
```

Poczekaj, aż aplikacja będzie dostępna pod adresem `http://localhost:4200`.

### Krok 2: Uruchom testy E2E

W drugim terminalu uruchom testy:

#### Standardowe uruchomienie (headless mode)

```bash
npm run test:e2e
```

Ten tryb uruchamia wszystkie testy w tle, bez wyświetlania okna przeglądarki. Jest najszybszy i zalecany dla CI/CD.

#### Tryb UI (interaktywny)

```bash
npm run test:e2e:ui
```

Uruchamia interaktywny interfejs Playwright, który pozwala:
- Wybierać, które testy uruchomić
- Oglądać testy w czasie rzeczywistym
- Analizować wyniki
- Debugować testy

**To jest ZALECANY tryb dla pierwszego uruchomienia!**

#### Tryb z widoczną przeglądarką (headed mode)

```bash
npm run test:e2e:headed
```

Uruchamia testy z widocznym oknem przeglądarki. Przydatne do obserwowania, co dokładnie robi test.

#### Tryb debugowania

```bash
npm run test:e2e:debug
```

Uruchamia testy w trybie debugowania krok po kroku.

#### Uruchomienie tylko testów typu @smoke

```bash
npx playwright test --grep @smoke
```

### Krok 3: Podgląd raportu

Po zakończeniu testów, wygenerowany zostanie raport HTML. Aby go otworzyć:

```bash
npm run test:e2e:report
```

## 📁 Struktura projektu

```
e2e/
├── specs/                    # Pliki testowe
│   └── login-page.spec.ts   # Pierwszy test: wyświetlanie strony logowania
├── poms/                     # Page Object Models
│   └── LoginPage.ts         # POM dla strony logowania
├── helpers/                  # Funkcje pomocnicze (do dodania w przyszłości)
├── fixtures/                 # Statyczne dane testowe (do dodania w przyszłości)
├── config/                   # Konfiguracja środowisk
│   └── .env.example         # Przykładowy plik konfiguracji
├── playwright.config.ts      # Główna konfiguracja Playwright
└── README.md                 # Ten plik
```

## 🧪 Pierwsze testy

### Opis testów

Zaimplementowane testy weryfikują **stronę logowania**. To najprostsze możliwe testy e2e, które:

- ✅ Sprawdzają, czy aplikacja jest uruchomiona i dostępna
- ✅ Weryfikują, czy strona logowania się ładuje
- ✅ Sprawdzają obecność wszystkich kluczowych elementów UI
- ✅ Testują walidację formularza (przycisk wyłączony/włączony)
- ✅ Są oznaczone tagiem `@smoke` jako testy krytycznej funkcjonalności

**Liczba testów:** 3

### Lokalizacja

Plik: `e2e/specs/login-page.spec.ts`

### Co testy weryfikują?

**Test #1: Wyświetlanie formularza logowania**
1. Czy strona `/login` jest dostępna
2. Czy pole email jest widoczne
3. Czy pole hasła jest widoczne
4. Czy przycisk logowania jest widoczny
5. Czy przycisk jest wyłączony dla pustego formularza (walidacja UX)
6. Czy link do rejestracji jest widoczny

**Test #2: Poprawność URL**
1. Czy routing Angular działa
2. Czy URL zawiera `/login`

**Test #3: Walidacja formularza**
1. Czy przycisk jest wyłączony dla pustego formularza
2. Czy przycisk pozostaje wyłączony gdy wypełniony jest tylko email
3. Czy przycisk włącza się po wypełnieniu email i hasła

### Zgodność ze strategią E2E

Test został zaimplementowany zgodnie z dokumentem strategii:

- ✅ Wykorzystuje wzorzec **Page Object Model** (`LoginPage.ts`)
- ✅ Używa **Role Locators** (`getByRole`) jako priorytetowych selektorów
- ✅ Wspiera **data-testid** dla specyficznych elementów
- ✅ Jest oznaczony tagiem **@smoke**
- ✅ Ma czytelną nazwę opisującą weryfikowane zachowanie
- ✅ Zawiera komentarze po polsku

## 🔍 Rozwiązywanie problemów

### Problem: "Test timeout of 30000ms exceeded"

**Przyczyna:** Aplikacja nie jest uruchomiona lub ładuje się za wolno.

**Rozwiązanie:** 
1. Upewnij się, że `npm run start` działa i aplikacja jest dostępna na `http://localhost:4200`
2. Zwiększ timeout w `playwright.config.ts` (parametr `timeout`)

### Problem: "Error: page.goto: net::ERR_CONNECTION_REFUSED"

**Przyczyna:** Aplikacja nie jest uruchomiona.

**Rozwiązanie:** Uruchom `npm run start` w osobnym terminalu przed uruchomieniem testów.

### Problem: Brak zainstalowanych przeglądarek

**Przyczyna:** Nie uruchomiono `npx playwright install`.

**Rozwiązanie:** 
```bash
npx playwright install chromium
```

### Problem: Test nie znajduje elementów na stronie

**Przyczyna:** Elementy w aplikacji nie mają odpowiednich atrybutów `data-testid`.

**Rozwiązanie:** 
1. Sprawdź, czy komponenty w aplikacji mają atrybuty `data-testid`
2. Dodaj brakujące atrybuty zgodnie z Page Object Model
3. Tymczasowo możesz użyć selektorów tekstowych lub CSS

## 📚 Kolejne kroki

Po pomyślnym uruchomieniu pierwszego testu, możesz:

1. **Dodać test logowania** - test faktycznego procesu uwierzytelniania
2. **Zaimplementować helper do seedowania danych** - w katalogu `helpers/`
3. **Dodać testy CRUD** - dla piosenek i repertuarów
4. **Rozbudować Page Object Models** - dla kolejnych stron aplikacji
5. **Skonfigurować CI/CD** - automatyczne uruchamianie testów w GitHub Actions

## 📖 Przydatne linki

- [Dokumentacja Playwright](https://playwright.dev/)
- [Best Practices dla Playwright](https://playwright.dev/docs/best-practices)
- [Debugging w Playwright](https://playwright.dev/docs/debug)
