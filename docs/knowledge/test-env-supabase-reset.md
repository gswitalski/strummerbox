


# Wykonianie dupp bzasy do pliku 

1. Połącz projekt z środowiskiem testowym
supabase link --project-ref <SUPABASE_PROJECT_ID_TEST>

 Dump tylko danych (dla seedowania)

supabase db dump --linked --data-only --file supabase/seeds/susers-test.sql



# reset bazy
Reset bazy danych (opcje)
 Przez SQL Editor w panelu Supabase (zalecane)
Otwórz panel Supabase projektu testowego.
Przejdź do SQL Editor.
Wykonaj SQL resetujący dane (zachowując strukturę):

-- Usuń wszystkie dane z tabel (zachowując strukturę)
TRUNCATE TABLE public.repertoire_songs CASCADE;
TRUNCATE TABLE public.repertoires CASCADE;
TRUNCATE TABLE public.songs CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
DELETE FROM auth.users;


