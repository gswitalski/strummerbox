Oto najczęściej zalecane konwencje opisów commitów w Git:

## **Conventional Commits** (najpopularniejsza konwencja)

Format: `<typ>[opcjonalny zakres]: <opis>`

### Typy commitów:
- **feat:** nowa funkcjonalność
- **fix:** naprawa błędu
- **docs:** zmiany w dokumentacji
- **style:** formatowanie, brakujące średniki (bez zmian w kodzie)
- **refactor:** refaktoryzacja kodu (bez nowych funkcji ani napraw)
- **perf:** poprawa wydajności
- **test:** dodanie lub poprawienie testów
- **build:** zmiany w systemie budowania lub zależnościach
- **ci:** zmiany w konfiguracji CI/CD
- **chore:** inne zmiany (nie dotyczą kodu produkcyjnego)
- **revert:** cofnięcie poprzedniego commita

### Przykłady:
```
feat: dodaj obsługę autentykacji OAuth
fix: napraw błąd w kalkulacji ceny
docs: zaktualizuj README z instrukcjami instalacji
refactor: przepisz komponent LoginForm na hooks
test: dodaj testy jednostkowe dla UserService
```

## **Ogólne zasady** (niezależnie od konwencji):

1. **Pierwszy wiersz (temat):**
   - Maksymalnie 50-72 znaki
   - Tryb rozkazujący ("dodaj" zamiast "dodano" lub "dodaje")
   - Bez kropki na końcu
   - Wielką literą na początku (opcjonalnie, zależy od preferencji zespołu)

2. **Ciało commita** (opcjonalne):
   - Oddziel pustą linią od tematu
   - Wyjaśnij "co" i "dlaczego", nie "jak"
   - Zawijaj tekst na ~72 znaki

3. **Stopka** (opcjonalna):
   - Odniesienia do issue: `Fixes #123`, `Closes #456`
   - **BREAKING CHANGE:** dla zmian łamiących kompatybilność

### Przykład pełnego commita:
```
feat: dodaj system powiadomień email

Implementuje wysyłanie powiadomień email dla nowych wiadomości.
Użytkownicy mogą włączyć/wyłączyć tę opcję w ustawieniach.

- Dodano EmailService
- Zintegrowano z SendGrid API
- Dodano testy integracyjne

Closes #234
```

## **Dodatkowe wskazówki:**

- ✅ Jeden commit = jedna logiczna zmiana
- ✅ Commity powinny być atomowe (możliwe do osobnego cofnięcia)
- ✅ Commituj często, ale tylko działający kod
- ❌ Unikaj commitów typu "WIP", "temp", "fixes" w głównej gałęzi

Te konwencje pomagają w:
- Automatycznym generowaniu changelog
- Łatwiejszym przeglądaniu historii
- Automatycznym wersjonowaniu (semantic versioning)
- Lepszej współpracy w zespole
