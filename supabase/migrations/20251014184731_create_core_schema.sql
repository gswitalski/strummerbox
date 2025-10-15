-- migration: create core schema objects for strummerbox application
-- summary: establishes profiles, songs, repertoires, and repertoire_songs tables with rls policies, indexes, and update triggers
-- affects: extensions pgcrypto pg_trgm; tables public.profiles public.songs public.repertoires public.repertoire_songs
-- notes: ensures published content is publicly readable while keeping draft/owner-only data protected via granular rls policies

-- ensure required extensions are available for uuid generation and trigram search support
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- reusable trigger function to maintain updated_at timestamps using utc timezone
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

comment on function public.handle_updated_at() is 'maintains updated_at column with the current utc timestamp on row modifications';

-- create table storing per-user profile metadata extending supabase auth users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'user profile data linked 1:1 with supabase auth users';
comment on column public.profiles.display_name is 'publicly visible name limited to 120 characters';

-- enforce row level security to guarantee per-user isolation
alter table public.profiles enable row level security;

-- authenticated users may read their own profile rows
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- authenticated users may create their own profile row (checked via id equality)
create policy profiles_insert_authenticated
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- authenticated users may update their own profile row
create policy profiles_update_authenticated
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- authenticated users may delete their own profile row
create policy profiles_delete_authenticated
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- keep updated_at fresh whenever a profile row changes
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- create table storing songs authored by organizers
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  public_id uuid not null unique default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 180),
  content text not null check (char_length(trim(content)) > 0),
  published_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organizer_id, title)
);

comment on table public.songs is 'songs with chord charts prepared by organizers; published_at signals public visibility';
comment on column public.songs.public_id is 'stable uuid for public sharing independent of internal id';

-- indexes to speed up organizer filtering, publication ordering, and fuzzy search
create index songs_organizer_id_idx on public.songs (organizer_id);
create index songs_published_idx on public.songs (published_at desc);
create index songs_title_trgm_idx on public.songs using gin (title gin_trgm_ops);

-- enable rls to differentiate between private drafts and published content access
alter table public.songs enable row level security;

-- authenticated organizers can read their own songs regardless of publication state
create policy songs_select_owner_authenticated
  on public.songs
  for select
  to authenticated
  using (organizer_id = auth.uid());

-- authenticated users may read published songs for discovery and sharing
create policy songs_select_published_authenticated
  on public.songs
  for select
  to authenticated
  using (published_at is not null);

-- anonymous visitors may only read published songs
create policy songs_select_published_anon
  on public.songs
  for select
  to anon
  using (published_at is not null);

-- authenticated organizers may create songs under their own account
create policy songs_insert_authenticated
  on public.songs
  for insert
  to authenticated
  with check (organizer_id = auth.uid());

-- authenticated organizers may update their own songs (keeping ownership)
create policy songs_update_authenticated
  on public.songs
  for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

-- authenticated organizers may delete their own songs
create policy songs_delete_authenticated
  on public.songs
  for delete
  to authenticated
  using (organizer_id = auth.uid());

-- maintain updated_at upon song modifications
create trigger songs_set_updated_at
  before update on public.songs
  for each row
  execute function public.handle_updated_at();

-- create table storing repertoires (setlists) assembled by organizers
create table public.repertoires (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  public_id uuid not null unique default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  published_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organizer_id, name)
);

comment on table public.repertoires is 'named song collections prepared for specific events';

-- indexes to accelerate organizer level queries and published listing
create index repertoires_organizer_id_idx on public.repertoires (organizer_id);
create index repertoires_published_idx on public.repertoires (published_at desc);
create index repertoires_name_trgm_idx on public.repertoires using gin (name gin_trgm_ops);

-- enforce rls to protect drafts while exposing only published repertoires publicly
alter table public.repertoires enable row level security;

-- authenticated organizers can read their own repertoires
create policy repertoires_select_owner_authenticated
  on public.repertoires
  for select
  to authenticated
  using (organizer_id = auth.uid());

-- authenticated users may read repertoires once published for collaboration
create policy repertoires_select_published_authenticated
  on public.repertoires
  for select
  to authenticated
  using (published_at is not null);

-- anonymous users may read only published repertoires via shared links
create policy repertoires_select_published_anon
  on public.repertoires
  for select
  to anon
  using (published_at is not null);

-- authenticated organizers may create repertoires for themselves
create policy repertoires_insert_authenticated
  on public.repertoires
  for insert
  to authenticated
  with check (organizer_id = auth.uid());

-- authenticated organizers may modify their own repertoires
create policy repertoires_update_authenticated
  on public.repertoires
  for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

-- authenticated organizers may delete their own repertoires
create policy repertoires_delete_authenticated
  on public.repertoires
  for delete
  to authenticated
  using (organizer_id = auth.uid());

-- keep updated_at synchronized for repertoire edits
create trigger repertoires_set_updated_at
  before update on public.repertoires
  for each row
  execute function public.handle_updated_at();

-- create join table mapping songs to repertoires with ordering metadata
create table public.repertoire_songs (
  id uuid primary key default gen_random_uuid(),
  repertoire_id uuid not null references public.repertoires(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position integer not null check (position > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (repertoire_id, song_id),
  unique (repertoire_id, position)
);

comment on table public.repertoire_songs is 'ordered association between repertoires and songs for a given event';

-- indexes supporting join patterns and positional lookups
create index repertoire_songs_song_id_idx on public.repertoire_songs (song_id);
create index repertoire_songs_repertoire_position_idx on public.repertoire_songs (repertoire_id, position);

-- enable rls to funnel access through repertoire ownership/publication checks
alter table public.repertoire_songs enable row level security;

-- authenticated organizers can read their repertoire-song associations
create policy repertoire_songs_select_owner_authenticated
  on public.repertoire_songs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.organizer_id = auth.uid()
    )
  );

-- authenticated users can read repertoire-song records when the repertoire is published
create policy repertoire_songs_select_published_authenticated
  on public.repertoire_songs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.published_at is not null
    )
  );

-- anonymous users can only read repertoire-song records for published repertoires
create policy repertoire_songs_select_published_anon
  on public.repertoire_songs
  for select
  to anon
  using (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.published_at is not null
    )
  );

-- authenticated organizers may add songs to their repertoires
create policy repertoire_songs_insert_authenticated
  on public.repertoire_songs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.organizer_id = auth.uid()
    )
    and exists (
      select 1
      from public.songs s
      where s.id = repertoire_songs.song_id
        and s.organizer_id = auth.uid()
    )
  );

-- authenticated organizers may reorder or adjust repertoire-song links they own
create policy repertoire_songs_update_authenticated
  on public.repertoire_songs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.organizer_id = auth.uid()
    )
  );

-- authenticated organizers may remove repertoire-song associations they own
create policy repertoire_songs_delete_authenticated
  on public.repertoire_songs
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.repertoires r
      where r.id = repertoire_songs.repertoire_id
        and r.organizer_id = auth.uid()
    )
  );

-- maintain updated_at for join records
create trigger repertoire_songs_set_updated_at
  before update on public.repertoire_songs
  for each row
  execute function public.handle_updated_at();


