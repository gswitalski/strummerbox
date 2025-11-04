# Skrypt konfiguracyjny dla środowiska testowego StrummerBox (Windows PowerShell)
# Uruchom: .\scripts\setup-testing.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧪 Konfiguracja środowiska testowego StrummerBox" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy Node.js jest zainstalowany
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js nie jest zainstalowany!" -ForegroundColor Red
    Write-Host "Zainstaluj Node.js 20 lub nowszy z https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Sprawdź wersję Node.js
$version = $nodeVersion -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$version -lt 20) {
    Write-Host "❌ Wymagana wersja Node.js: 20 lub nowsza" -ForegroundColor Red
    Write-Host "Obecna wersja: $nodeVersion" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Instalacja zależności
Write-Host "📦 Instalacja zależności..." -ForegroundColor Yellow
npm ci
Write-Host "✅ Zależności zainstalowane" -ForegroundColor Green
Write-Host ""

# Instalacja przeglądarek Playwright
Write-Host "🌐 Instalacja przeglądarek Playwright..." -ForegroundColor Yellow
npx playwright install
Write-Host "✅ Przeglądarki zainstalowane" -ForegroundColor Green
Write-Host ""

# Uruchom testy jednostkowe
Write-Host "🧪 Uruchamianie testów jednostkowych..." -ForegroundColor Yellow
npm run test:run
Write-Host "✅ Testy jednostkowe OK" -ForegroundColor Green
Write-Host ""

# Uruchom testy E2E (tylko Chromium dla szybkości)
Write-Host "🌐 Uruchamianie testów E2E (Chromium)..." -ForegroundColor Yellow
npm run test:e2e:chromium
Write-Host "✅ Testy E2E OK" -ForegroundColor Green
Write-Host ""

# Podsumowanie
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✨ Środowisko testowe jest gotowe!" -ForegroundColor Green
Write-Host ""
Write-Host "Dostępne komendy:" -ForegroundColor Cyan
Write-Host "  npm run test              - testy jednostkowe (watch mode)"
Write-Host "  npm run test:ui           - testy jednostkowe (UI mode)"
Write-Host "  npm run test:coverage     - raport pokrycia kodu"
Write-Host "  npm run test:e2e          - testy E2E (wszystkie przeglądarki)"
Write-Host "  npm run test:e2e:ui       - testy E2E (interactive UI)"
Write-Host "  npm run test:e2e:debug    - debug testów E2E"
Write-Host ""
Write-Host "Dokumentacja:" -ForegroundColor Cyan
Write-Host "  docs/testing-guide.md           - pełny przewodnik"
Write-Host "  docs/testing-quick-start.md     - quick start"
Write-Host "  docs/troubleshooting-tests.md   - rozwiązywanie problemów"
Write-Host "  e2e/README.md                   - dokumentacja testów E2E"
Write-Host ""
Write-Host "Aby rozpocząć:" -ForegroundColor Cyan
Write-Host "  npm run test:ui" -ForegroundColor Yellow
Write-Host ""

