# 🚀 Quick Start - Pierwszy Test E2E

Skrócona instrukcja uruchomienia pierwszego testu e2e w 3 minuty.

## ⚡ Szybkie uruchomienie

### 1️⃣ Zainstaluj Playwright (jednorazowo)

```bash
npx playwright install chromium
```

⏱️ Czas: ~30 sekund

### 2️⃣ Uruchom aplikację

Terminal #1:
```bash
npm run start
```

⏱️ Poczekaj aż zobaczysz: `✔ Browser application bundle generation complete.`

### 3️⃣ Uruchom test

Terminal #2:
```bash
npm run test:e2e:ui
```

⏱️ Czas wykonania testu: ~2 sekundy

## ✅ Oczekiwany rezultat

W interfejsie Playwright UI zobaczysz **3 testy PASSED**:
- ✅ Test #1: "powinna wyświetlić formularz logowania ze wszystkimi niezbędnymi elementami"
- ✅ Test #2: "powinna mieć poprawny URL"
- ✅ Test #3: "powinna włączyć przycisk logowania po wypełnieniu formularza"

## 📸 Co się dzieje?

Testy:
1. Otwierają przeglądarkę
2. Przechodzą na stronę `/login`
3. Sprawdzają czy widoczne są: pole email, pole hasła, przycisk logowania
4. Weryfikują URL
5. Testują walidację formularza (przycisk wyłączony → wypełnienie pól → przycisk włączony)

## 🔥 Alternatywne uruchomienie (bez UI)

Jeśli wolisz szybkie uruchomienie w trybie headless:

```bash
npm run test:e2e
```

Raport HTML:
```bash
npm run test:e2e:report
```

## ❓ Coś nie działa?

### Problem: "Connection refused"
**Rozwiązanie:** Aplikacja nie jest uruchomiona. Sprawdź Terminal #1 i upewnij się, że `npm run start` działa.

### Problem: "Executable doesn't exist"
**Rozwiązanie:** Nie zainstalowano przeglądarek. Uruchom `npx playwright install chromium`.

### Problem: Test nie znajduje elementów
**Rozwiązanie:** Sprawdź czy routing do `/login` działa. Uruchom `npm run test:e2e:headed` aby zobaczyć co się dzieje. Strona logowania w StrummerBox jest już kompatybilna z testami!

## 📚 Więcej informacji

- [Pełna instrukcja](../e2e/README.md)
- [Szczegółowy opis implementacji](./pierwszy-test-e2e.md)
- [Strategia testów E2E](./e2e-strategy.md)

---

**Czas całkowity:** ~3 minuty (przy pierwszym uruchomieniu)  
**Czas przy kolejnych uruchomieniach:** ~10 sekund

