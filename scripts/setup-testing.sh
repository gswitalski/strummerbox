#!/bin/bash

# Skrypt konfiguracyjny dla środowiska testowego StrummerBox
# Uruchom: ./scripts/setup-testing.sh

set -e

echo "🧪 Konfiguracja środowiska testowego StrummerBox"
echo "================================================"
echo ""

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany!"
    echo "Zainstaluj Node.js 20 lub nowszy z https://nodejs.org/"
    exit 1
fi

# Sprawdź wersję Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Wymagana wersja Node.js: 20 lub nowsza"
    echo "Obecna wersja: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo ""

# Instalacja zależności
echo "📦 Instalacja zależności..."
npm ci
echo "✅ Zależności zainstalowane"
echo ""

# Instalacja przeglądarek Playwright
echo "🌐 Instalacja przeglądarek Playwright..."
npx playwright install
echo "✅ Przeglądarki zainstalowane"
echo ""

# Instalacja systemowych zależności Playwright (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Instalacja systemowych zależności Playwright..."
    npx playwright install-deps
    echo "✅ Zależności systemowe zainstalowane"
    echo ""
fi

# Uruchom testy jednostkowe
echo "🧪 Uruchamianie testów jednostkowych..."
npm run test:run
echo "✅ Testy jednostkowe OK"
echo ""

# Uruchom testy E2E (tylko Chromium dla szybkości)
echo "🌐 Uruchamianie testów E2E (Chromium)..."
npm run test:e2e:chromium
echo "✅ Testy E2E OK"
echo ""

# Podsumowanie
echo "================================================"
echo "✨ Środowisko testowe jest gotowe!"
echo ""
echo "Dostępne komendy:"
echo "  npm run test              - testy jednostkowe (watch mode)"
echo "  npm run test:ui           - testy jednostkowe (UI mode)"
echo "  npm run test:coverage     - raport pokrycia kodu"
echo "  npm run test:e2e          - testy E2E (wszystkie przeglądarki)"
echo "  npm run test:e2e:ui       - testy E2E (interactive UI)"
echo "  npm run test:e2e:debug    - debug testów E2E"
echo ""
echo "Dokumentacja:"
echo "  docs/testing-guide.md           - pełny przewodnik"
echo "  docs/testing-quick-start.md     - quick start"
echo "  docs/troubleshooting-tests.md   - rozwiązywanie problemów"
echo "  e2e/README.md                   - dokumentacja testów E2E"
echo ""
echo "Aby rozpocząć:"
echo "  npm run test:ui"
echo ""

