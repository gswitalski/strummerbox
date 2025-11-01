import type {
    BiesiadaRepertoireSummaryDto,
    BiesiadaRepertoireSongListResponseDto,
    BiesiadaRepertoireSongEntryDto,
} from '../../../packages/contracts/types.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

/**
 * Kolumny pobierane z tabeli repertoires dla trybu Biesiada.
 * Minimalna lista pól zoptymalizowana pod kątem wydajności.
 */
const BIESIADA_REPERTOIRE_COLUMNS = 'id, name, published_at';

/**
 * Pobiera listę repertuarów organizatora w trybie Biesiada.
 * Zwraca uproszczoną listę z liczbą piosenek, zoptymalizowaną pod kątem szybkiego ładowania na urządzeniach mobilnych.
 * 
 * @param supabase - Klient Supabase skonfigurowany dla bieżącego żądania
 * @param params - Parametry zapytania
 * @param params.organizerId - ID uwierzytelnionego organizatora
 * @param params.includePublished - Filtruj tylko opublikowane repertuary (domyślnie false)
 * @returns Tablica obiektów BiesiadaRepertoireSummaryDto
 * @throws ApplicationError - Jeśli wystąpił błąd podczas pobierania danych
 */
export const getBiesiadaRepertoires = async (
    supabase: RequestSupabaseClient,
    params: {
        organizerId: string;
        includePublished?: boolean;
    },
): Promise<BiesiadaRepertoireSummaryDto[]> => {
    const { organizerId, includePublished = false } = params;

    logger.info('Fetching biesiada repertoires', {
        organizerId,
        includePublished,
    });

    // Budujemy zapytanie pobierające podstawowe dane repertuarów
    // Dla efektywności użyjemy funkcji RPC PostgreSQL do liczenia piosenek
    let query = supabase
        .from('repertoires')
        .select(`
            ${BIESIADA_REPERTOIRE_COLUMNS},
            created_at
        `)
        .eq('organizer_id', organizerId);

    // Opcjonalne filtrowanie tylko po opublikowanych repertuarach
    if (includePublished) {
        query = query.not('published_at', 'is', null);
    }

    // Sortowanie: najpierw opublikowane (najnowsze), potem nieopublikowane (najnowsze)
    query = query.order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    const { data: repertoiresData, error: repertoiresError } = await query;

    if (repertoiresError) {
        logger.error('Failed to fetch biesiada repertoires', {
            organizerId,
            includePublished,
            error: repertoiresError,
        });
        throw createInternalError(
            'Nie udało się pobrać listy repertuarów w trybie Biesiada',
            repertoiresError,
        );
    }

    if (!repertoiresData || repertoiresData.length === 0) {
        logger.info('No repertoires found for organizer', { organizerId });
        return [];
    }

    // Pobieramy liczbę piosenek dla każdego repertuaru w jednym zapytaniu
    const repertoireIds = repertoiresData.map(r => r.id);
    
    const { data: songCounts, error: countError } = await supabase
        .from('repertoire_songs')
        .select('repertoire_id')
        .in('repertoire_id', repertoireIds);

    if (countError) {
        logger.error('Failed to fetch song counts for repertoires', {
            organizerId,
            error: countError,
        });
        throw createInternalError(
            'Nie udało się pobrać liczby piosenek dla repertuarów',
            countError,
        );
    }

    // Zliczamy piosenki dla każdego repertuaru
    const songCountMap = new Map<string, number>();
    (songCounts || []).forEach(item => {
        const count = songCountMap.get(item.repertoire_id) || 0;
        songCountMap.set(item.repertoire_id, count + 1);
    });

    // Mapowanie wyników na DTO
    const repertoires: BiesiadaRepertoireSummaryDto[] = repertoiresData.map((row) => ({
        id: row.id,
        name: row.name,
        songCount: songCountMap.get(row.id) || 0,
        publishedAt: row.published_at,
    }));

    logger.info('Successfully fetched biesiada repertoires', {
        organizerId,
        count: repertoires.length,
    });

    return repertoires;
};

/**
 * Kolumny pobierane dla repertuaru i jego piosenek w trybie Biesiada.
 */
const REPERTOIRE_WITH_SONGS_COLUMNS = `
    id,
    name,
    public_id,
    organizer_id
`;

const REPERTOIRE_SONGS_COLUMNS = `
    repertoire_songs!inner (
        id,
        position,
        song:songs!inner (
            id,
            title
        )
    )
`;

/**
 * Pobiera szczegóły repertuaru wraz z listą piosenek dla trybu Biesiada.
 * Zwraca uporządkowaną listę piosenek z metadanymi do udostępniania.
 * 
 * @param supabase - Klient Supabase skonfigurowany dla bieżącego żądania
 * @param params - Parametry zapytania
 * @param params.repertoireId - UUID repertuaru
 * @param params.userId - ID uwierzytelnionego użytkownika (organizatora)
 * @returns Obiekt BiesiadaRepertoireSongListResponseDto
 * @throws ApplicationError - Jeśli repertuar nie istnieje lub użytkownik nie ma uprawnień
 */
export const getBiesiadaRepertoireSongs = async (
    supabase: RequestSupabaseClient,
    params: {
        repertoireId: string;
        userId: string;
    },
): Promise<BiesiadaRepertoireSongListResponseDto> => {
    const { repertoireId, userId } = params;

    logger.info('Fetching biesiada repertoire songs', {
        repertoireId,
        userId,
    });

    // Pobieramy repertuar wraz z piosenkami w jednym zapytaniu
    // Używamy !inner aby wymusić INNER JOIN
    const { data: repertoireData, error: repertoireError } = await supabase
        .from('repertoires')
        .select(`
            ${REPERTOIRE_WITH_SONGS_COLUMNS},
            ${REPERTOIRE_SONGS_COLUMNS}
        `)
        .eq('id', repertoireId)
        .eq('organizer_id', userId)
        .single();

    if (repertoireError) {
        logger.error('Failed to fetch biesiada repertoire songs', {
            repertoireId,
            userId,
            error: repertoireError,
        });

        // Jeśli kod błędu to PGRST116, oznacza to że nie znaleziono rekordu
        if (repertoireError.code === 'PGRST116') {
            throw new ApplicationError(
                'resource_not_found',
                'Nie znaleziono repertuaru lub nie masz do niego uprawnień',
                { repertoireId, userId },
            );
        }

        throw createInternalError(
            'Nie udało się pobrać piosenek z repertuaru w trybie Biesiada',
            repertoireError,
        );
    }

    if (!repertoireData) {
        logger.warn('Repertoire not found or access denied', {
            repertoireId,
            userId,
        });
        throw new ApplicationError(
            'resource_not_found',
            'Nie znaleziono repertuaru lub nie masz do niego uprawnień',
            { repertoireId, userId },
        );
    }

    // Pobieramy publiczny URL aplikacji ze zmiennych środowiskowych
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL');
    
    if (!appPublicUrl) {
        logger.error('APP_PUBLIC_URL environment variable is not set');
        throw createInternalError(
            'Błąd konfiguracji serwera - brak APP_PUBLIC_URL',
            new Error('APP_PUBLIC_URL not configured'),
        );
    }

    // Budujemy publicUrl i qrPayload
    const publicUrl = `${appPublicUrl}/public/repertoires/${repertoireData.public_id}`;

    // Mapujemy piosenki na DTO
    // repertoire_songs to tablica obiektów z zagnieżdżonym obiektem song
    const songs: BiesiadaRepertoireSongEntryDto[] = (repertoireData.repertoire_songs || [])
        .map((rs: any) => ({
            songId: rs.song.id,
            title: rs.song.title,
            position: rs.position,
        }))
        .sort((a, b) => a.position - b.position); // Sortujemy po pozycji rosnąco

    const response: BiesiadaRepertoireSongListResponseDto = {
        repertoireId: repertoireData.id,
        repertoireName: repertoireData.name,
        share: {
            publicUrl,
            qrPayload: publicUrl,
        },
        songs,
    };

    logger.info('Successfully fetched biesiada repertoire songs', {
        repertoireId,
        songCount: songs.length,
    });

    return response;
};

