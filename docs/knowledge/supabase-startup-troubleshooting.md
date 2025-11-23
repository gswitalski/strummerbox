# Rozwiązywanie problemów z uruchomieniem lokalnego Supabase

## Problem: "name resolution failed" po uruchomieniu Supabase

### Opis problemu

Po uruchomieniu `supabase start` i próbie wywołania API (np. `/me/profile`), endpoint zwraca błąd 503:

```json
{
  "message": "name resolution failed"
}
```

### Przyczyna

Edge Functions uruchamiają się w Dockerze i próbują połączyć się z bazą danych PostgreSQL przez sieć Docker zanim networking jest w pełni zainicjalizowany. Problem występuje szczególnie często po pierwszym uruchomieniu Docker Desktop lub po restarcie komputera.

### Rozwiązania

#### 1. Automatyczne retry w Edge Functions (Zalecane - Już zaimplementowane)

Projekt zawiera automatyczny mechanizm retry w `supabase/functions/_shared/supabase-client.ts`, który:
- Automatycznie ponawie nieudane połączenia z bazą danych
- Używa exponential backoff (100ms → 200ms → 400ms → ...)
- Maksymalnie 3 próby z timeout 5 sekund
- Działa transparentnie bez zmian w kodzie aplikacji

**Ten mechanizm powinien rozwiązać problem automatycznie!**

#### 2. Użycie skryptu wait-for-supabase (Opcjonalne)

Jeśli chcesz mieć pewność, że Supabase jest gotowy przed uruchomieniem aplikacji:

**Windows (PowerShell):**
```powershell
# Uruchom Docker Desktop
# Następnie:
supabase start
.\scripts\wait-for-supabase.ps1
ng serve
```

**Linux/Mac (Bash):**
```bash
# Uruchom Docker Desktop
# Następnie:
supabase start
./scripts/wait-for-supabase.sh
ng serve
```

Skrypt:
- Sprawdza czy wszystkie komponenty Supabase są gotowe
- Czeka maksymalnie 60 sekund
- Wyświetla szczegółowe informacje o stanie systemu
- Zwraca exit code 0 gdy gotowy, 1 gdy timeout

**Parametry skryptu:**
```powershell
# Windows
.\scripts\wait-for-supabase.ps1 -MaxWaitSeconds 120 -CheckIntervalSeconds 3

# Linux/Mac
./scripts/wait-for-supabase.sh 120 "http://127.0.0.1:54321/functions/v1/health" 3
```

#### 3. Health Check Endpoint

Projekt udostępnia endpoint health check do sprawdzania stanu Supabase:

```
GET http://127.0.0.1:54321/functions/v1/health
```

**Odpowiedź (200 OK - wszystko działa):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "checks": {
    "edgeFunctions": {
      "status": "pass"
    },
    "database": {
      "status": "pass",
      "latencyMs": 15
    },
    "environment": {
      "status": "pass",
      "variables": {
        "SUPABASE_URL": true,
        "SUPABASE_ANON_KEY": true,
        "SUPABASE_SERVICE_ROLE_KEY": true
      }
    }
  }
}
```

**Odpowiedź (503 Service Unavailable - nie gotowy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-10T10:30:00.000Z",
  "checks": {
    "edgeFunctions": {
      "status": "pass"
    },
    "database": {
      "status": "fail",
      "message": "fetch failed"
    },
    "environment": {
      "status": "pass",
      "variables": {
        "SUPABASE_URL": true,
        "SUPABASE_ANON_KEY": true,
        "SUPABASE_SERVICE_ROLE_KEY": true
      }
    }
  }
}
```

Możesz użyć tego endpointu w własnych skryptach:

```powershell
# PowerShell
$health = Invoke-RestMethod -Uri "http://127.0.0.1:54321/functions/v1/health"
if ($health.status -eq "healthy") {
    Write-Host "✅ Gotowy!"
}
```

```bash
# Bash
if curl -f http://127.0.0.1:54321/functions/v1/health | grep -q '"status":"healthy"'; then
    echo "✅ Gotowy!"
fi
```

## Workflow zalecany dla developmentu

### Codzienne uruchamianie (z mechanizmem retry)

```powershell
# 1. Uruchom Docker Desktop (jeśli nie działa)
# 2. Uruchom Supabase
supabase start

# 3. Uruchom aplikację - retry jest automatyczny!
ng serve
```

### Uruchamianie z gwarancją gotowości (opcjonalne)

```powershell
# 1. Uruchom Docker Desktop
# 2. Uruchom Supabase
supabase start

# 3. Poczekaj aż będzie gotowy
.\scripts\wait-for-supabase.ps1

# 4. Uruchom aplikację
ng serve
```

## Debugowanie problemów

### 1. Sprawdź czy Docker działa

```bash
docker ps
```

Powinny być widoczne kontenery Supabase: `supabase-db`, `supabase-kong`, `supabase-auth`, etc.

### 2. Sprawdź status Supabase

```bash
supabase status
```

### 3. Sprawdź logi Edge Functions

```bash
supabase functions logs
```

### 4. Testuj health check ręcznie

```bash
curl http://127.0.0.1:54321/functions/v1/health
```

### 5. Restart Supabase

Jeśli nic nie pomaga:

```bash
supabase stop
supabase start
```

## Jak działa mechanizm retry?

1. **Wrapper Proxy na Supabase Client**: Każde zapytanie do bazy danych jest automatycznie owijane w retry logic
2. **Wykrywanie błędów sieciowych**: System rozpoznaje błędy typu "name resolution failed", "ECONNREFUSED", "ETIMEDOUT"
3. **Exponential Backoff**: Kolejne próby z rosnącym opóźnieniem (100ms, 200ms, 400ms, 800ms, 1000ms max)
4. **Timeout globalny**: Maksymalnie 5 sekund na całą operację
5. **Transparent dla aplikacji**: Nie wymaga zmian w kodzie - działa automatycznie

## Pliki związane z rozwiązaniem

- `supabase/functions/_shared/retry.ts` - Logika retry z exponential backoff
- `supabase/functions/_shared/supabase-client.ts` - Wrapper dla Supabase client z retry
- `supabase/functions/health/index.ts` - Health check endpoint
- `scripts/wait-for-supabase.ps1` - Skrypt oczekiwania dla Windows
- `scripts/wait-for-supabase.sh` - Skrypt oczekiwania dla Linux/Mac

## FAQ

**Q: Czy muszę używać skryptu wait-for-supabase?**
A: Nie, mechanizm retry w Edge Functions powinien wystarczyć. Skrypt jest opcjonalny dla dodatkowej pewności.

**Q: Jak długo trwa inicjalizacja Supabase?**
A: Zwykle 10-30 sekund, ale może być dłużej przy pierwszym uruchomieniu lub wolniejszym komputerze.

**Q: Czy to wpływa na wydajność?**
A: Nie, retry działa tylko gdy wystąpi błąd sieciowy. Normalne zapytania nie mają dodatkowego opóźnienia.

**Q: Czy to działa w produkcji?**
A: Mechanizm retry jest bezpieczny w produkcji, ale problem "name resolution failed" występuje tylko lokalnie w Dockerze.

**Q: Co jeśli nadal mam problem?**
A: Spróbuj `supabase stop && supabase start` lub zrestartuj Docker Desktop.

