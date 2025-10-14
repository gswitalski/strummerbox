<conversation_summary>
<decisions>
1.  Kluczowe encje (`songs`, `repertoires`) będą powiązane z użytkownikami (`auth.users` z Supabase) poprzez klucz obcy `organizer_id` (UUID).
2.  Klucze główne dla głównych tabel będą typu `UUID`, co ułatwi tworzenie publicznych, stałych linków.
3.  Unikalność nazw piosenek i repertuarów w obrębie konta jednego użytkownika będzie zapewniona przez złożone ograniczenie `UNIQUE` na poziomie bazy danych.
4.  Relacja wiele-do-wielu między piosenkami a repertuarami zostanie zaimplementowana za pomocą tabeli łączącej `repertoire_songs`.
5.  Kolejność piosenek w repertuarze będzie zarządzana przez kolumnę `position` w tabeli `repertoire_songs`.
6.  Reguły `ON DELETE CASCADE` zostaną zastosowane do kluczy obcych w tabeli łączącej, aby zapewnić spójność danych po usunięciu piosenki lub repertuaru.
7.  Dostęp do danych będzie chroniony za pomocą Row-Level Security (RLS) w celu zapewnienia, że organizatorzy mogą modyfikować tylko własne zasoby, a użytkownicy anonimowi mają dostęp tylko do odczytu.
8.  Treść piosenki (z akordami) będzie przechowywana w jednej kolumnie typu `text`, a logika usuwania akordów dla widoku publicznego zostanie zaimplementowana w aplikacji frontendowej.
9.  Wszystkie klucze obce oraz kolumna `organizer_id` (używana w politykach RLS) zostaną zindeksowane w celu zapewnienia wydajności.
10. Główne tabele będą zawierać znaczniki czasu (`created_at`, `updated_at`) do śledzenia zmian.
11. Zostanie utworzona osobna tabela `profiles` do przechowywania danych publicznych użytkowników, połączona z `auth.users`.
12. Zostaną zastosowane ograniczenia `CHECK` na kolumnach tekstowych (np. tytuł) w celu zapewnienia integralności danych.
13. Przyjęta zostanie konwencja nazewnicza `snake_case` dla wszystkich obiektów bazy danych.
14. Schemat zostanie udokumentowany w bazie danych za pomocą poleceń `COMMENT ON`.
15. **Odrzucono** propozycję użycia triggerów bazodanowych do zarządzania wartością w kolumnie `position`. Logika ta będzie w całości zarządzana przez aplikację.
</decisions>

<matched_recommendations>
1.  **Modelowanie danych**: Utworzenie tabel `profiles`, `songs`, `repertoires` oraz tabeli łączącej `repertoire_songs` w celu odwzorowania relacji jeden-do-wielu (użytkownik -> zasoby) i wiele-do-wielu (repertuary <-> piosenki).
2.  **Klucze i identyfikatory**: Użycie `UUID` jako kluczy głównych dla publicznie dostępnych zasobów w celu zapewnienia unikalności i bezpieczeństwa.
3.  **Integralność danych**: Zastosowanie ograniczeń `UNIQUE` (dla unikalności nazw), `CHECK` (dla walidacji treści) oraz `FOREIGN KEY` z regułami `ON DELETE CASCADE` w celu utrzymania spójności referencyjnej.
4.  **Bezpieczeństwo**: Implementacja polityk Row-Level Security (RLS) w celu ścisłego kontrolowania dostępu do danych na poziomie wiersza, oddzielając uprawnienia właścicieli od dostępu publicznego.
5.  **Wydajność**: Utworzenie indeksów na wszystkich kluczach obcych i kolumnach używanych w warunkach `WHERE` oraz politykach RLS w celu optymalizacji zapytań.
6.  **Zarządzanie treścią**: Przechowywanie źródłowej wersji danych (tekst z akordami) w bazie i delegowanie logiki transformacji (usunięcie akordów) do warstwy aplikacji.
7.  **Dobre praktyki**: Stosowanie spójnej konwencji nazewniczej (`snake_case`), dodawanie znaczników czasu do śledzenia zmian oraz dokumentowanie schematu bezpośrednio w bazie danych.
</matched_recommendations>

<database_planning_summary>
Na podstawie przeprowadzonej analizy, schemat bazy danych PostgreSQL dla MVP aplikacji StrummerBox zostanie zbudowany wokół trzech głównych encji: `profiles`, `songs` i `repertoires`.

**Encje kluczowe i relacje:**
-   **`profiles`**: Tabela przechowująca publiczne informacje o użytkownikach, połączona relacją jeden-do-jednego z tabelą `auth.users` dostarczaną przez Supabase. Kluczem głównym i obcym będzie `id` typu `UUID`.
-   **`songs`**: Tabela zawierająca piosenki. Każda piosenka będzie należeć do jednego organizatora (`organizer_id`), będzie miała unikalny tytuł w jego obrębie, a treść w formacie ChordPro będzie przechowywana w kolumnie typu `text`.
-   **`repertoires`**: Tabela definiująca repertuary. Każdy repertuar będzie należeć do jednego organizatora i będzie miał unikalną nazwę w jego obrębie.
-   **`repertoire_songs`**: Tabela łącząca, która zaimplementuje relację wiele-do-wielu między repertuarami a piosenkami. Będzie zawierać kolumnę `position` typu `integer` do określania kolejności utworów. Logika zarządzania wartościami `position` będzie leżeć po stronie aplikacji.

**Bezpieczeństwo i Skalowalność:**
-   Podstawą bezpieczeństwa będzie system autentykacji Supabase oraz mechanizm Row-Level Security (RLS). Zostaną zdefiniowane polityki, które zapewnią, że zalogowani użytkownicy mogą modyfikować (`INSERT`, `UPDATE`, `DELETE`) wyłącznie własne dane.
-   Dla użytkowników niezalogowanych (`anon`) zostanie zdefiniowana polityka RLS zezwalająca wyłącznie na odczyt (`SELECT`), co umożliwi publiczne udostępnianie piosenek i repertuarów.
-   Użycie `UUID` jako kluczy głównych utrudnia odgadywanie adresów URL i zapewnia unikalność w skali globalnej.
-   W celu zapewnienia wydajności, wszystkie klucze obce oraz kolumny wykorzystywane w politykach RLS zostaną zindeksowane.

**Integralność i Spójność Danych:**
-   Spójność danych zostanie zapewniona przez użycie kluczy obcych z regułami `ON DELETE CASCADE`, co automatycznie usunie powiązania piosenek z repertuarami w przypadku usunięcia jednego z tych zasobów.
-   Ograniczenia `UNIQUE` i `CHECK` na poziomie bazy danych zabezpieczą przed duplikacją nazw i nieprawidłowymi danymi.
-   Przyjęto standardy nazewnictwa (`snake_case`) oraz dokumentowania schematu w bazie.
</database_planning_summary>

<unresolved_issues>
-   **Zarządzanie kolejnością piosenek**: Podjęto decyzję o rezygnacji z triggerów bazodanowych na rzecz logiki aplikacyjnej do zarządzania kolumną `position` w tabeli `repertoire_songs`. Należy zwrócić szczególną uwagę na solidną implementację tej logiki w backendzie lub frontendzie, aby uniknąć potencjalnych niespójności danych (np. luki w numeracji, duplikaty pozycji w obrębie jednego repertuaru) podczas operacji dodawania, usuwania i zmiany kolejności piosenek.
</unresolved_issues>
</conversation_summary>
