# Architektura Hostingu i Wdrożenia Aplikacji StrummerBox

Ten dokument stanowi kompleksowe podsumowanie architektury produkcyjnej aplikacji StrummerBox. Opisuje, w jaki sposób poszczególne komponenty aplikacji (frontend i backend) są hostowane, konfigurowane i wdrażane automatycznie.

## Spis Treści
1. [Ogólny Model Architektury](#1-ogólny-model-architektury)
2. [Architektura Backendu (Supabase)](#2-architektura-backendu-supabase)
   - [2.1 Baza Danych i Migracje](#21-baza-danych-i-migracje)
   - [2.2 API i Funkcje Edge (Edge Functions)](#22-api-i-funkcje-edge-edge-functions)
   - [2.3 Konfiguracja CORS](#23-konfiguracja-cors)
3. [Architektura Frontendu (Firebase Hosting)](#3-architektura-frontendu-firebase-hosting)
4. [Zautomatyzowany Proces Wdrożenia (CI/CD z GitHub Actions)](#4-zautomatyzowany-proces-wdrożenia-cicd-z-github-actions)
   - [4.1 Przebieg Workflow](#41-przebieg-workflow)
   - [4.2 Kluczowe Kroki i Ich Znaczenie](#42-kluczowe-kroki-i-ich-znaczenie)
5. [Konfiguracja Zmiennych Środowiskowych (GitHub Secrets)](#5-konfiguracja-zmiennych-środowiskowych-github-secrets)

---

### 1. Ogólny Model Architektury

Aplikacja StrummerBox działa w modelu **hybrydowym**, wykorzystując dwie oddzielne platformy chmurowe, z których każda jest wyspecjalizowana w swoim zadaniu:

-   **Supabase** pełni rolę **Backend-as-a-Service (BaaS)**. Hostuje bazę danych PostgreSQL, udostępnia auto-generowane API oraz środowisko do uruchamiania bezserwerowych funkcji Edge Functions.
-   **Firebase Hosting** służy wyłącznie do **hostowania frontendu**. Przechowuje i udostępnia statyczne pliki aplikacji Angular (HTML, CSS, JavaScript) za pośrednictwem globalnej sieci CDN.

### 2. Architektura Backendu (Supabase)

Cały backend aplikacji jest zarządzany przez Supabase w chmurze. Proces wdrożenia został skonfigurowany tak, aby przenieść lokalne środowisko deweloperskie do chmury.

#### 2.1 Baza Danych i Migracje

Struktura bazy danych (tabele, relacje, polityki RLS) jest zarządzana lokalnie za pomocą mechanizmu **migracji** Supabase CLI. Zmiany są wdrażane do chmury za pomocą polecenia:
```bash
supabase db push
```
Dzięki temu produkcyjna baza danych ma zawsze strukturę zgodną z lokalnym schematem zdefiniowanym w kodzie.

#### 2.2 API i Funkcje Edge (Edge Functions)

Logika biznesowa backendu jest zaimplementowana jako **Supabase Edge Functions** (napisane w Deno/TypeScript). Funkcje te są wdrażane do chmury osobnym poleceniem:
```bash
supabase functions deploy
```
Po wdrożeniu, funkcje te są publicznie dostępne pod adresem URL projektu Supabase i tworzą API, z którym komunikuje się frontend.

#### 2.3 Konfiguracja CORS

Aby umożliwić komunikację między frontendem (na domenie Firebase) a backendem (na domenie Supabase), wdrożono politykę **CORS (Cross-Origin Resource Sharing)**. Każda funkcja Edge:
1.  Automatycznie dołącza nagłówki `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` i `Access-Control-Allow-Headers` do wszystkich odpowiedzi.
2.  Obsługuje żądania `OPTIONS` (tzw. preflight requests), które przeglądarka wysyła w celu weryfikacji polityki CORS przed wykonaniem właściwego zapytania.

### 3. Architektura Frontendu (Firebase Hosting)

Frontend aplikacji, napisany w Angularze, jest wdrażany jako **aplikacja jednostronicowa (SPA)**. Proces budowania (`npm run build`) tworzy zoptymalizowany zestaw statycznych plików.

Te pliki są następnie wdrażane na **Firebase Hosting**, które:
-   Serwuje je użytkownikom z bardzo wysoką wydajnością dzięki globalnej sieci **CDN**.
-   Jest skonfigurowane do obsługi aplikacji SPA, co oznacza, że wszystkie ścieżki (np. `/songs/123`) są przekierowywane do głównego pliku `index.html`, a routingiem zajmuje się już sama aplikacja Angular w przeglądarce.

### 4. Zautomatyzowany Proces Wdrożenia (CI/CD z GitHub Actions)

Sercem całego systemu jest w pełni zautomatyzowany potok CI/CD zdefiniowany w pliku `.github/workflows/main-deploy.yml`.

#### 4.1 Przebieg Workflow

Workflow jest uruchamiany automatycznie po każdym `push` do gałęzi `main`. Wykonuje on sekwencyjnie następujące zadania:

1.  **Wdrożenie Backendu (Supabase):**
    -   Instaluje Supabase CLI.
    -   Łączy się z projektem w chmurze Supabase za pomocą tokenu i ID projektu.
    -   Wypycha najnowsze migracje bazy danych (`supabase db push`).
    -   Wdraża najnowszą wersję wszystkich funkcji Edge (`supabase functions deploy`).

2.  **Wdrożenie Frontendu (Firebase):**
    -   Instaluje zależności (`npm ci`).
    -   Uruchamia testy jednostkowe.
    -   **Dynamicznie podmienia** klucze deweloperskie na produkcyjne w pliku `src/environments/environment.prod.ts` na podstawie sekretów z GitHub.
    -   Buduje aplikację Angular w trybie produkcyjnym (`npm run build`).
    -   Wdraża zbudowane pliki statyczne na Firebase Hosting.

#### 4.2 Kluczowe Kroki i Ich Znaczenie

-   **Testy przed wdrożeniem:** Wdrożenie następuje tylko wtedy, gdy testy jednostkowe przejdą pomyślnie, co zapewnia stabilność.
-   **Podmiana zmiennych środowiskowych:** Ten krok jest kluczowy dla bezpieczeństwa i poprawnego działania. Gwarantuje, że produkcyjna wersja frontendu łączy się z produkcyjną bazą danych Supabase, a klucze API nigdy nie są zapisane w kodzie źródłowym.

### 5. Konfiguracja Zmiennych Środowiskowych (GitHub Secrets)

Cały proces CI/CD opiera się na bezpiecznym przechowywaniu kluczy i tokenów w **GitHub Secrets**. W repozytorium muszą być skonfigurowane następujące sekrety, aby workflow `main-deploy.yml` mógł poprawnie funkcjonować.

#### Sekrety dla Firebase:
-   `FIREBASE_SERVICE_ACCOUNT_STRUMMERBOX_PROD`: Klucz serwisowy w formacie JSON, uprawniający do wdrożenia na Firebase Hosting.

#### Sekrety dla Supabase:
-   `SUPABASE_URL`: Publiczny adres URL projektu Supabase (używany przez frontend).
-   `SUPABASE_ANON_KEY`: Publiczny klucz `anon` do API Supabase (używany przez frontend).
-   `SUPABASE_PROJECT_ID`: Unikalny identyfikator (Reference ID) projektu Supabase (używany przez Supabase CLI).
-   `SUPABASE_DB_PASSWORD`: Hasło do produkcyjnej bazy danych (używane do `db push`).
-   `SUPABASE_ACCESS_TOKEN`: Osobisty token dostępu do zarządzania projektami Supabase przez CLI.
-   `APP_PUBLIC_URL`: Publiczny adres URL wdrożonej aplikacji na Firebase (np. `https://strummerbox-prod.web.app`), używany przez funkcje Edge do generowania linków udostępniania.
