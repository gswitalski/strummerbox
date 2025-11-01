-- ============================================================================
-- Opcjonalna optymalizacja dla getBiesiadaRepertoireSongDetails
-- ============================================================================
-- 
-- Zamiast pobierać wszystkie piosenki z repertuaru w Edge Function,
-- można użyć funkcji PostgreSQL z funkcjami okna (LAG, LEAD) do pobrania
-- tylko bieżącej, poprzedniej i następnej piosenki w jednym zapytaniu.
--
-- UWAGA: To jest opcjonalna optymalizacja dla repertuarów z setkami piosenek.
-- Obecna implementacja w biesiada.service.ts jest wystarczająca dla
-- typowych przypadków użycia (repertuary z 10-50 piosenkami).
--
-- Aby użyć tej funkcji:
-- 1. Uruchom ten SQL w Supabase SQL Editor
-- 2. W biesiada.service.ts zmień zapytanie na wywołanie RPC:
--    supabase.rpc('get_biesiada_song_with_navigation', { ... })
--
-- ============================================================================

CREATE OR REPLACE FUNCTION get_biesiada_song_with_navigation(
    p_repertoire_id UUID,
    p_song_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    repertoire_id UUID,
    repertoire_name TEXT,
    repertoire_public_id UUID,
    current_song_id UUID,
    current_title TEXT,
    current_content TEXT,
    current_position INTEGER,
    total_songs INTEGER,
    prev_song_id UUID,
    prev_title TEXT,
    next_song_id UUID,
    next_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH song_navigation AS (
        SELECT
            r.id AS repertoire_id,
            r.name AS repertoire_name,
            r.public_id AS repertoire_public_id,
            s.id AS song_id,
            s.title,
            s.content,
            rs.position,
            COUNT(*) OVER () AS total_songs,
            LAG(s.id) OVER (ORDER BY rs.position) AS prev_song_id,
            LAG(s.title) OVER (ORDER BY rs.position) AS prev_title,
            LEAD(s.id) OVER (ORDER BY rs.position) AS next_song_id,
            LEAD(s.title) OVER (ORDER BY rs.position) AS next_title
        FROM repertoires r
        INNER JOIN repertoire_songs rs ON r.id = rs.repertoire_id
        INNER JOIN songs s ON rs.song_id = s.id
        WHERE r.id = p_repertoire_id
          AND r.organizer_id = p_user_id
    )
    SELECT
        sn.repertoire_id,
        sn.repertoire_name,
        sn.repertoire_public_id,
        sn.song_id AS current_song_id,
        sn.title AS current_title,
        sn.content AS current_content,
        sn.position::INTEGER AS current_position,
        sn.total_songs::INTEGER,
        sn.prev_song_id,
        sn.prev_title,
        sn.next_song_id,
        sn.next_title
    FROM song_navigation sn
    WHERE sn.song_id = p_song_id;
END;
$$;

-- Nadaj uprawnienia do wykonywania funkcji dla uwierzytelnionych użytkowników
GRANT EXECUTE ON FUNCTION get_biesiada_song_with_navigation(UUID, UUID, UUID) TO authenticated;

-- ============================================================================
-- Przykład użycia w biesiada.service.ts (zakomentowane):
-- ============================================================================
--
-- const { data, error } = await supabase
--     .rpc('get_biesiada_song_with_navigation', {
--         p_repertoire_id: repertoireId,
--         p_song_id: songId,
--         p_user_id: userId,
--     })
--     .single();
--
-- if (error || !data) {
--     return null;
-- }
--
-- const result: BiesiadaRepertoireSongDetailDto = {
--     songId: data.current_song_id,
--     title: data.current_title,
--     content: data.current_content,
--     order: {
--         position: data.current_position,
--         total: data.total_songs,
--         previous: data.prev_song_id ? {
--             songId: data.prev_song_id,
--             title: data.prev_title,
--         } : null,
--         next: data.next_song_id ? {
--             songId: data.next_song_id,
--             title: data.next_title,
--         } : null,
--     },
--     share: {
--         publicUrl: `${appPublicUrl}/public/repertoires/${data.repertoire_public_id}`,
--         qrPayload: `${appPublicUrl}/public/repertoires/${data.repertoire_public_id}`,
--     },
-- };
--
-- ============================================================================

