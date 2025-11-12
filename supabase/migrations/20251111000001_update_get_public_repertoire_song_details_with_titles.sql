-- Update RPC function to include previous and next song titles
-- This modification adds title fields for navigation links as required by PublicSongNavLinkDto type

-- Drop the old function first (signature change requires this)
DROP FUNCTION IF EXISTS public.get_public_repertoire_song_details(uuid, uuid);

-- Create the new function with updated signature
create or replace function public.get_public_repertoire_song_details(
    repertoire_public_id uuid,
    song_public_id uuid
)
returns table (
    song_title text,
    song_content text,
    song_published_at timestamptz,
    repertoire_published_at timestamptz,
    position_in_repertoire integer,
    total_songs_count integer,
    previous_song_public_id uuid,
    previous_song_title text,
    next_song_public_id uuid,
    next_song_title text
)
language plpgsql
security definer
stable
as $$
declare
    v_repertoire_id uuid;
    v_song_id uuid;
begin
    -- Step 1: Find repertoire by public_id and get its internal ID
    select r.id, r.published_at
    into v_repertoire_id, repertoire_published_at
    from public.repertoires r
    where r.public_id = repertoire_public_id;

    -- If repertoire not found, return empty result
    if v_repertoire_id is null then
        return;
    end if;

    -- Step 2: Find song by public_id and get its internal ID
    select s.id, s.title, s.content, s.published_at
    into v_song_id, song_title, song_content, song_published_at
    from public.songs s
    where s.public_id = song_public_id;

    -- If song not found, return empty result
    if v_song_id is null then
        return;
    end if;

    -- Step 3: Verify song is part of the repertoire and get navigation data
    -- Use window functions to calculate position, total count, and adjacent songs with titles
    with repertoire_ordered_songs as (
        select
            rs.song_id,
            rs.position,
            s.public_id as song_public_id,
            s.title as song_title,
            count(*) over () as total_count,
            lag(s.public_id) over (order by rs.position) as prev_public_id,
            lag(s.title) over (order by rs.position) as prev_title,
            lead(s.public_id) over (order by rs.position) as next_public_id,
            lead(s.title) over (order by rs.position) as next_title
        from public.repertoire_songs rs
        inner join public.songs s on s.id = rs.song_id
        where rs.repertoire_id = v_repertoire_id
        order by rs.position
    )
    select
        ros.position,
        ros.total_count,
        ros.prev_public_id,
        ros.prev_title,
        ros.next_public_id,
        ros.next_title
    into
        position_in_repertoire,
        total_songs_count,
        previous_song_public_id,
        previous_song_title,
        next_song_public_id,
        next_song_title
    from repertoire_ordered_songs ros
    where ros.song_id = v_song_id;

    -- If song is not part of this repertoire, return empty result
    if position_in_repertoire is null then
        return;
    end if;

    -- Return single row with all data
    return next;
end;
$$;

comment on function public.get_public_repertoire_song_details is
    'Retrieves public song details within repertoire context with navigation metadata (position, previous/next with titles)';

