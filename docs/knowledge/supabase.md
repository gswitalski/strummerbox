# Supabase - Baza Wiedzy

## 📋 Spis Treści
- [Problem z kontenerami Docker](#problem-z-kontenerami-docker)
- [Poprawne restartowanie Supabase](#poprawne-restartowanie-supabase)
- [Czyszczenie obrazów Docker](#czyszczenie-obrazów-docker)
- [Różnica: npx supabase vs supabase](#różnica-npx-supabase-vs-supabase)
- [Konfiguracja sql_paths](#konfiguracja-sql_paths)
- [Instalacja w projekcie](#instalacja-w-projekcie)
- [Przydatne skrypty npm](#przydatne-skrypty-npm)

---

## Problem z kontenerami Docker

### Symptom
Po wykonaniu `npx supabase stop --no-backup` a następnie `npx supabase start` pojawia się błąd:

```
failed to create docker container: Error response from daemon: Conflict. 
The container name "/supabase_vector_strummerbox" is already in use by container "...". 
You have to remove (or rename) that container to be able to reuse that name.
```

### Przyczyna
Komenda `npx supabase stop --no-backup` **zatrzymuje kontenery, ale ich NIE usuwa**. Przy próbie uruchomienia `npx supabase start`, Supabase CLI próbuje utworzyć nowe kontenery z tymi samymi nazwami, co powoduje konflikt z istniejącymi (zatrzymanymi) kontenerami.

### Rozwiązanie
Nie używać flagi `--no-backup` przy zatrzymywaniu Supabase.

---

## Poprawne restartowanie Supabase

### Metoda 1: Standardowy restart ✅ (Zalecana)

```bash
# Zatrzymaj Supabase (bez flagi --no-backup)
supabase stop

# Uruchom ponownie
supabase start
```

### Metoda 2: Restart z czyszczeniem (gdy Metoda 1 nie działa)

```bash
# Krok 1: Zatrzymaj Supabase
supabase stop

# Krok 2: Usuń wszystkie zatrzymane kontenery Docker
docker container prune -f

# Krok 3: Uruchom ponownie
supabase start
```

### Metoda 3: Pełne czyszczenie (gdy nic innego nie działa)

```bash
# Krok 1: Zatrzymaj Supabase
supabase stop

# Krok 2: Usuń wszystkie kontenery Supabase dla tego projektu
docker ps -a --filter "name=supabase_" --format "{{.Names}}" | ForEach-Object { docker rm -f $_ }

# Krok 3: Uruchom ponownie
supabase start
```

### Metoda 4: Reset bazy danych (start od zera)

```bash
# Zatrzymaj, wyczyść i uruchom ponownie z resetem bazy
supabase db reset
```

Ta komenda automatycznie:
- Zatrzymuje bazę
- Usuwa wszystkie dane
- Uruchamia bazę ponownie
- Aplikuje wszystkie migracje
- Ładuje dane seed

### 🚨 Czego NIE robić

❌ **NIE używaj:** `supabase stop --no-backup`
- Zatrzymuje kontenery, ale **nie usuwa ich**
- Powoduje konflikty przy następnym `start`

✅ **Zawsze używaj:** `supabase stop` (bez flag)

---

## Czyszczenie obrazów Docker

Gdy masz wiele starych/nieużywanych obrazów Supabase zajmujących miejsce na dysku:

### Najprostsza metoda - Usuń wszystkie nieużywane obrazy

```bash
# Krok 1: Zatrzymaj Supabase
supabase stop

# Krok 2: Usuń wszystkie nieużywane obrazy Docker
docker image prune -a -f

# Krok 3: Przy następnym start pobiorą się tylko potrzebne obrazy
supabase start
```

### Kompleksowe czyszczenie systemu Docker

```bash
# Zatrzymaj Supabase, wyczyść wszystko i uruchom ponownie
supabase stop && docker system prune -a -f && supabase start
```

To usuwa:
- Wszystkie nieużywane obrazy
- Wszystkie zatrzymane kontenery
- Wszystkie nieużywane sieci
- Cały build cache

---

## Różnica: npx supabase vs supabase

### `npx supabase start`
- Używa **npx** (Node Package eXecute)
- **Nie wymaga globalnej instalacji** Supabase CLI
- npx automatycznie:
  1. Szuka `supabase` w lokalnym `node_modules/.bin/`
  2. Jeśli nie znajdzie, **tymczasowo pobiera** najnowszą wersję
  3. Uruchamia komendę
- ✅ **Zaleta**: Zawsze najnowsza wersja, działa bez instalacji
- ❌ **Wada**: Może być wolniejsze przy pierwszym uruchomieniu

### `supabase start`
- Wymaga **globalnej instalacji** Supabase CLI
- Używa zainstalowanej wersji z systemu
- ✅ **Zaleta**: Szybsze (nie sprawdza/pobiera za każdym razem)
- ❌ **Wada**: Musisz ręcznie aktualizować CLI

### Instalacja globalna w projekcie StrummerBox

**Status:** Zainstalowane globalnie przez **Scoop**
- Wersja: `2.51.0`
- Lokalizacja: `C:\Users\gswit\scoop\shims\supabase.exe`
- Dostępna nowsza wersja: `2.53.6`

**Aktualizacja:**
```bash
scoop update supabase
```

**Sprawdzenie wersji:**
```bash
supabase --version
```

**Sprawdzenie lokalizacji:**
```bash
where.exe supabase
```

### Podsumowanie

| Komenda | Wymaga instalacji | Szybkość | Kiedy używać |
|---------|------------------|----------|--------------|
| `npx supabase start` | ❌ Nie | 🐢 Wolniejsze | Bez instalacji, testy |
| `supabase start` | ✅ Globalnej | ⚡ Szybkie | **Zalecane dla projektu** |
| `npm run sb:start` | ✅ Lokalnej w projekcie | ⚡ Szybkie | Gdy jest w package.json |

---

## Konfiguracja sql_paths

### Lokalizacja
Plik: `supabase/config.toml`

### Problem
Domyślna konfiguracja wskazywała na nieistniejący plik:
```toml
sql_paths = ["./seed.sql"]
```

Co powodowało ostrzeżenie:
```
WARN: no files matched pattern: supabase/seed.sql
```

### Rozwiązanie
Zmieniono na pustą tablicę:
```toml
[db.seed]
enabled = true
sql_paths = []
```

### Uzasadnienie
- Dane seed są ładowane przez migracje w `supabase/migrations/`:
  - `20251027090000_seed_user.sql`
  - `20251027090001_seed_songs.sql`
- Plik `supabase/seed.sql` nie istnieje i nie jest potrzebny
- Pusta tablica eliminuje ostrzeżenie

---

## Instalacja w projekcie

### Biblioteki w projekcie

**JavaScript Client (już zainstalowany):**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.75.0"
  }
}
```
To jest biblioteka do komunikacji z Supabase API z poziomu aplikacji Angular.

### Opcjonalnie: Lokalna instalacja CLI

Jeśli chcesz mieć Supabase CLI lokalnie w projekcie (zamiast globalnej instalacji):

```bash
npm install -D supabase
```

**Zalety:**
- Wszyscy członkowie zespołu będą używać tej samej wersji CLI
- Wersja CLI jest zarządzana przez `package.json`
- Działa z `npx` lub `npm run` bez globalnej instalacji

---

## Przydatne skrypty npm

Dodaj do `package.json` w sekcji `"scripts"`:

```json
{
  "scripts": {
    "sb:start": "supabase start",
    "sb:stop": "supabase stop",
    "sb:restart": "supabase stop && supabase start",
    "sb:clean-restart": "supabase stop && docker container prune -f && supabase start",
    "sb:reset": "supabase db reset",
    "sb:status": "supabase status",
    "sb:update": "scoop update supabase"
  }
}
```

### Użycie

```bash
npm run sb:start          # Uruchom Supabase
npm run sb:stop           # Zatrzymaj Supabase
npm run sb:restart        # Restart Supabase
npm run sb:clean-restart  # Restart z czyszczeniem kontenerów
npm run sb:reset          # Pełny reset bazy danych
npm run sb:status         # Status usług Supabase
npm run sb:update         # Aktualizuj Supabase CLI (Scoop)
```

---

## Szybki poradnik

### Codzienna praca

```bash
# Uruchomienie
supabase start

# Zatrzymanie
supabase stop
```

### Gdy coś nie działa

```bash
# 1. Spróbuj prostego restart
supabase stop
supabase start

# 2. Jeśli nie działa, wyczyść kontenery
supabase stop
docker container prune -f
supabase start

# 3. Ostateczność - pełny reset
supabase db reset
```

### Gdy brakuje miejsca na dysku

```bash
# Wyczyść nieużywane obrazy Docker
supabase stop
docker image prune -a -f
supabase start
```

### Aktualizacja CLI

```bash
# Sprawdź wersję
supabase --version

# Aktualizuj (Scoop)
scoop update supabase
```

---

## Diagnozowanie problemów

### Sprawdź status usług
```bash
supabase status
```

### Sprawdź logi
```bash
# Wszystkie logi
supabase logs

# Logi konkretnej usługi
supabase logs db
supabase logs api
```

### Sprawdź kontenery Docker
```bash
# Lista uruchomionych kontenerów
docker ps

# Lista wszystkich kontenerów (w tym zatrzymanych)
docker ps -a

# Kontenery Supabase
docker ps -a --filter "name=supabase"
```

### Sprawdź obrazy Docker
```bash
# Lista obrazów
docker images

# Obrazy Supabase
docker images | grep supabase
```

---

## Najważniejsze zasady

1. ✅ **Zawsze używaj** `supabase stop` bez flag
2. ❌ **Nigdy nie używaj** `supabase stop --no-backup` (powoduje konflikty)
3. 🧹 Okresowo czyść nieużywane obrazy Docker
4. 🔄 Regularnie aktualizuj Supabase CLI
5. 📊 Używaj `supabase status` do sprawdzenia stanu
6. 📝 Dodaj skrypty npm dla wygody

---

*Ostatnia aktualizacja: 28 października 2025*

---
### Dlaczego to się dzieje
Masz już istniejący kontener Dockera o tej samej nazwie (`/supabase_vector_strummerbox`). Gdy `supabase start` próbuje utworzyć nowy kontener z tą samą nazwą, Docker zwraca konflikt nazw.

### Szybkie rozwiązanie (usuń konfliktujący kontener)
W PowerShell uruchom (możesz użyć nazwy lub ID z komunikatu błędu):
```powershell
docker rm -f supabase_vector_strummerbox
# lub
docker rm -f b7534b44aaa529f755d53991f43bd5338603c4f8a6903f365fc78c15258d043c

supabase start
```

### Jeśli pojawią się kolejne konflikty
1) Zobacz, które kontenery Supabase istnieją:
```powershell
docker ps -a --filter "name=supabase" --format "{{.Names}}"
```
2) Usuń je bezpiecznie (tylko kontenery, dane w wolumenach zostaną zachowane):
```powershell
docker ps -a --filter "name=supabase" --format "{{.ID}}" | ForEach-Object { docker rm -f $_ }
supabase start
```

Opcjonalnie, jeśli sieć też przeszkadza:
```powershell
docker network ls --filter "name=supabase" --format "{{.ID}}" | ForEach-Object { docker network rm $_ }
```

### Uwagi
- Ostrzeżenie o “Analytics on Windows” możesz pominąć; nie powoduje konfliktu kontenerów.
- Usuwanie kontenerów nie kasuje danych bazy (są w wolumenach). Nie używaj `docker volume rm ...`, chyba że świadomie chcesz wyczyścić dane.
- Gdy problem wraca, uruchom `supabase stop --debug`, by zobaczyć, co nie zostało poprawnie zatrzymane.
    