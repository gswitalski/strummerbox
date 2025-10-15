1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

- `users`
this table is managed by Supabase Auth

- `profiles`
  - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
  - `display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120)`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

- `songs`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()`
  - `title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180)`
  - `content TEXT NOT NULL CHECK (char_length(trim(content)) > 0)`
  - `published_at TIMESTAMPTZ NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `UNIQUE (organizer_id, title)`

- `repertoires`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()`
  - `name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160)`
  - `description TEXT`
  - `published_at TIMESTAMPTZ NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `UNIQUE (organizer_id, name)`

- `repertoire_songs`
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `repertoire_id UUID NOT NULL REFERENCES repertoires(id) ON DELETE CASCADE`
  - `song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE`
  - `position INTEGER NOT NULL CHECK (position > 0)`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `UNIQUE (repertoire_id, song_id)`
  - `UNIQUE (repertoire_id, position)`

2. Relacje między tabelami

- `profiles (1:1) auth.users` – wspólne `id` zapewnia przechowywanie profilu użytkownika w dedykowanej tabeli.
- `songs (N:1) profiles/auth.users` – każda piosenka należy do jednego organizatora (`organizer_id`).
- `repertoires (N:1) profiles/auth.users` – każdy repertuar należy do jednego organizatora (`organizer_id`).
- `repertoire_songs (N:M)` – tabela łącząca mapująca wiele piosenek do wielu repertuarów z kolumną `position` określającą kolejność.

3. Indeksy

- `CREATE INDEX songs_organizer_id_idx ON songs (organizer_id);`
- `CREATE INDEX songs_published_idx ON songs (published_at DESC);`
- `CREATE INDEX songs_title_trgm_idx ON songs USING gin (title gin_trgm_ops);`
- `CREATE INDEX repertoires_organizer_id_idx ON repertoires (organizer_id);`
- `CREATE INDEX repertoires_published_idx ON repertoires (published_at DESC);`
- `CREATE INDEX repertoires_name_trgm_idx ON repertoires USING gin (name gin_trgm_ops);`
- `CREATE INDEX repertoire_songs_song_id_idx ON repertoire_songs (song_id);`
- `CREATE INDEX repertoire_songs_repertoire_position_idx ON repertoire_songs (repertoire_id, position);`

4. Zasady PostgreSQL

- `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY profiles_self_select ON profiles FOR SELECT USING (id = auth.uid());`
  - `CREATE POLICY profiles_self_modify ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());`

- `ALTER TABLE songs ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY songs_owner_full_access ON songs FOR ALL USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());`
  - `CREATE POLICY songs_public_read ON songs FOR SELECT USING (published_at IS NOT NULL);`

- `ALTER TABLE repertoires ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY repertoires_owner_full_access ON repertoires FOR ALL USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());`
  - `CREATE POLICY repertoires_public_read ON repertoires FOR SELECT USING (published_at IS NOT NULL);`

- `ALTER TABLE repertoire_songs ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY repertoire_songs_owner_full_access ON repertoire_songs
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM repertoires r
          WHERE r.id = repertoire_id AND r.organizer_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM repertoires r
          WHERE r.id = repertoire_id AND r.organizer_id = auth.uid()
        )
      );`
  - `CREATE POLICY repertoire_songs_public_read ON repertoire_songs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM repertoires r
          WHERE r.id = repertoire_id
            AND r.published_at IS NOT NULL
        )
      );`

5. Dodatkowe uwagi lub wyjaśnienia

- Wymagane jest włączenie rozszerzeń `pgcrypto` (dla `gen_random_uuid()`) oraz `pg_trgm` (dla indeksów trigramowych służących do wyszukiwania po tytułach/nazwach).
- Zaleca się utworzenie funkcji/triggera aktualizującego `updated_at` w tabelach `profiles`, `songs`, `repertoires` i `repertoire_songs` przy każdej modyfikacji.
- Kolumna `published_at` pozwala organizatorowi kontrolować, które zasoby są dostępne publicznie; przy publikacji należy ustawić `published_at = timezone('utc', now())`.
- Frontend usuwa akordy z treści piosenek przed prezentacją w trybie Biesiada; w razie potrzeby można dodać widok lub funkcję generującą wersję tekstową bez akordów po stronie bazy danych.

