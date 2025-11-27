# Troubleshooting: "Brak konfiguracji adresu publicznego aplikacji"

## Szybkie rozwiązanie (TL;DR)

```powershell
# 1. Utwórz plik .env w głównym katalogu
cd C:\dev\strummerbox
echo "APP_PUBLIC_URL=http://localhost:4200" > .env

# 2. Uruchom funkcję z flagą --env-file
supabase functions serve share --env-file .env
```

---

## Pełny przewodnik krok po kroku

### Krok 1: Utworzenie pliku .env

#### Windows PowerShell:
```powershell
cd C:\dev\strummerbox
New-Item -Path .env -ItemType File -Force
```

#### Windows CMD:
```cmd
cd C:\dev\strummerbox
type nul > .env
```

#### Linux/macOS:
```bash
cd /path/to/strummerbox
touch .env
```

### Krok 2: Edycja pliku .env

Otwórz plik `.env` w dowolnym edytorze tekstowym (VS Code, Notepad++, etc.) i dodaj:

```env
APP_PUBLIC_URL=http://localhost:4200
```

**Zapisz plik!**

### Krok 3: Weryfikacja zawartości

```powershell
# PowerShell
Get-Content .env

# CMD
type .env

# Bash
cat .env
```

Oczekiwany output:
```
APP_PUBLIC_URL=http://localhost:4200
```

### Krok 4: Uruchomienie Supabase

```bash
# Uruchom stack Supabase
supabase start

# Sprawdź status (opcjonalnie)
supabase status
```

### Krok 5: Uruchomienie Edge Function z plikiem .env

⚠️ **KRYTYCZNE:** Zawsze używaj flagi `--env-file`!

```bash
supabase functions serve share --env-file .env
```

**Alternatywnie** możesz uruchomić wszystkie funkcje:

```bash
supabase functions serve --env-file .env
```

### Krok 6: Testowanie

W drugim terminalu:

```bash
# Test prosty (dostaniesz 401 - to OK, oznacza że funkcja działa)
curl http://localhost:54321/functions/v1/share/songs/00000000-0000-0000-0000-000000000000
```

**Jeśli dostaniesz błąd 401 (Unauthorized) zamiast 500 (Internal Server Error), zmienna jest poprawnie załadowana!**

---

## Typowe problemy i rozwiązania

### Problem 1: "Cannot find .env file"

**Przyczyna:** Plik .env nie istnieje lub jest w złym miejscu

**Rozwiązanie:**
```powershell
# Sprawdź obecny katalog
pwd  # lub Get-Location w PowerShell

# Powinno pokazać: C:\dev\strummerbox
# Jeśli nie, przejdź do głównego katalogu
cd C:\dev\strummerbox

# Sprawdź czy plik istnieje
ls -Force | Select-String ".env"  # PowerShell
dir /a .env  # CMD
ls -la .env  # Bash

# Jeśli nie istnieje, utwórz go
echo "APP_PUBLIC_URL=http://localhost:4200" > .env
```

### Problem 2: Plik .env istnieje, ale nadal błąd

**Przyczyna:** Plik nie jest poprawnie załadowany lub ma zły format

**Rozwiązanie:**

1. Sprawdź zawartość:
```powershell
Get-Content .env -Raw  # Pokaże też ukryte znaki
```

2. Usuń plik i utwórz od nowa:
```powershell
Remove-Item .env -Force
New-Item -Path .env -ItemType File
Add-Content .env "APP_PUBLIC_URL=http://localhost:4200"
```

3. Upewnij się, że nie ma spacji wokół `=`:
```env
# ❌ ŹLE
APP_PUBLIC_URL = http://localhost:4200

# ✅ DOBRZE
APP_PUBLIC_URL=http://localhost:4200
```

### Problem 3: Funkcja nie widzi zmiennej mimo flagi --env-file

**Przyczyna:** Stara instancja funkcji nadal działa

**Rozwiązanie:**

1. Zatrzymaj funkcję (Ctrl+C w terminalu gdzie działa)
2. Opcjonalnie zrestartuj cały stack:
```bash
supabase stop
supabase start
```
3. Uruchom ponownie z flagą:
```bash
supabase functions serve share --env-file .env
```

### Problem 4: Używam pełnej ścieżki, ale nie działa

**Rozwiązanie dla Windows:**

```powershell
# Użyj ukośników w prawo (/) zamiast backslash (\)
supabase functions serve share --env-file C:/dev/strummerbox/.env
```

### Problem 5: Git pokazuje .env jako zmieniony plik

**Rozwiązanie:** `.env` powinien być w `.gitignore`

```bash
# Sprawdź .gitignore
cat .gitignore | grep .env

# Jeśli nie ma, dodaj
echo ".env" >> .gitignore

# Usuń z trackingu git (jeśli został już dodany)
git rm --cached .env
```

---

## Weryfikacja sukcesu

### Test 1: Sprawdzenie logów funkcji

Po uruchomieniu `supabase functions serve share --env-file .env` w logach NIE powinien pojawić się błąd:
```
"Brak konfiguracji adresu publicznego aplikacji"
```

### Test 2: Test endpointa bez tokenu

```bash
curl -i http://localhost:54321/functions/v1/share/songs/00000000-0000-0000-0000-000000000000
```

**Sukces = otrzymanie 401 Unauthorized**, nie 500 Internal Server Error

Przykładowa odpowiedź:
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Wymagane uwierzytelnienie użytkownika",
    "details": null
  }
}
```

### Test 3: Test z prawidłowym formatem UUID (bez tokenu)

```bash
curl -i http://localhost:54321/functions/v1/share/songs/58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5
```

Powinno też zwrócić 401, co oznacza że:
- ✅ Funkcja działa
- ✅ Zmienna środowiskowa jest załadowana
- ✅ Walidacja UUID działa
- ✅ Autoryzacja działa (wymaga tokenu)

### Test 4: Test z nieprawidłowym UUID

```bash
curl -i http://localhost:54321/functions/v1/share/songs/invalid-uuid
```

Powinno zwrócić 401 (jeśli auth jest sprawdzane przed walidacją) lub 400 (jeśli walidacja jest pierwsza).

---

## Zapisanie konfiguracji do szybkiego startu

Stwórz skrypt pomocniczy dla wygody:

### Windows (start-share-function.ps1):
```powershell
# Plik: scripts/start-share-function.ps1
$ErrorActionPreference = "Stop"

Write-Host "Starting Supabase share function..." -ForegroundColor Cyan

# Sprawdź czy .env istnieje
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "APP_PUBLIC_URL=http://localhost:4200" | Out-File -FilePath .env -Encoding utf8
}

# Sprawdź czy Supabase działa
$status = supabase status 2>&1
if ($status -match "stopped" -or $LASTEXITCODE -ne 0) {
    Write-Host "Starting Supabase..." -ForegroundColor Yellow
    supabase start
}

# Uruchom funkcję
Write-Host "Serving share function..." -ForegroundColor Green
supabase functions serve share --env-file .env
```

Użycie:
```powershell
.\scripts\start-share-function.ps1
```

### Linux/macOS (start-share-function.sh):
```bash
#!/bin/bash
# Plik: scripts/start-share-function.sh

set -e

echo "Starting Supabase share function..."

# Sprawdź czy .env istnieje
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "APP_PUBLIC_URL=http://localhost:4200" > .env
fi

# Sprawdź czy Supabase działa
if ! supabase status &> /dev/null; then
    echo "Starting Supabase..."
    supabase start
fi

# Uruchom funkcję
echo "Serving share function..."
supabase functions serve share --env-file .env
```

Użycie:
```bash
chmod +x scripts/start-share-function.sh
./scripts/start-share-function.sh
```

---

## Dodatkowe wskazówki

### Dla różnych środowisk

Możesz mieć różne pliki env:

```bash
# Development
supabase functions serve share --env-file .env.development

# Testing
supabase functions serve share --env-file .env.test
```

Przykładowe pliki:

**.env.development:**
```env
APP_PUBLIC_URL=http://localhost:4200
```

**.env.test:**
```env
APP_PUBLIC_URL=http://localhost:4201
```

### Debugowanie zmiennych środowiskowych

Dodaj tymczasowy log w `songs.service.ts`:

```typescript
export const getSongShareMeta = async ({
    supabase,
    songId,
    organizerId,
}: GetSongShareMetaParams): Promise<SongShareMetaDto> => {
    // TEMPORARY DEBUG LOG
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL');
    console.log('DEBUG: APP_PUBLIC_URL =', appPublicUrl);
    
    // ... reszta kodu
```

Po uruchomieniu funkcji w logach zobaczysz wartość zmiennej.

---

## Kontakt i pomoc

Jeśli nadal masz problemy:

1. Sprawdź logi Supabase: `supabase status --output json`
2. Sprawdź wersję CLI: `supabase --version` (powinna być >= 1.0.0)
3. Sprawdź czy masz wszystkie zależności: `npm list -g supabase`
4. Zrestartuj komputer (czasami zmienne środowiskowe wymagają restartu sesji)

**Najczęstszy błąd:** Zapomnienie flagi `--env-file .env` przy uruchamianiu funkcji!

