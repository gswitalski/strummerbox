import type { 
    PublicRepertoireDto, 
    PublicRepertoireSongLinkDto,
    PublicRepertoireSongDto,
    PublicRepertoireSongOrderDto,
    PublicSongNavLinkDto,
} from '../../../packages/contracts/types.ts';
import type { ServiceRoleSupabaseClient } from '../_shared/supabase-client.ts';
import { createNotFoundError, createResourceGoneError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';

/**
 * Columns to select from repertoires table for verification
 */
const REPERTOIRE_COLUMNS = 'id, name, description, published_at, public_id';

/**
 * Columns to select from songs table when fetching repertoire songs
 */
const SONG_COLUMNS = 'title, public_id';

/**
 * Base URL pattern for constructing public song URLs
 * Format: {baseUrl}/functions/v1/public/repertoires/{repertoirePublicId}/songs/{songPublicId}
 */
const PUBLIC_SONG_URL_PATTERN = (baseUrl: string, repertoirePublicId: string, songPublicId: string): string => {
    return `${baseUrl}/functions/v1/public/repertoires/${repertoirePublicId}/songs/${songPublicId}`;
};

/**
 * Get base URL for constructing public links
 * 
 * Priority:
 * 1. PUBLIC_BASE_URL env var (for production/staging)
 * 2. Detect local environment and use localhost
 * 3. Default to production domain
 */
const getBaseUrl = (): string => {
    // Explicit public URL from environment (production/staging)
    const publicBaseUrl = Deno.env.get('PUBLIC_BASE_URL');
    if (publicBaseUrl) {
        return publicBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    // Detect local development environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('kong'))) {
        // Local development - use localhost with standard Supabase port
        return 'http://localhost:54321';
    }

    // Default fallback for production
    return 'https://app.strummerbox.com';
};

/**
 * Fetches a published repertoire with its songs by public ID.
 * 
 * This service performs a two-step query:
 * 1. Verifies the repertoire exists and is published
 * 2. Fetches all songs in the repertoire ordered by position
 * 
 * @param supabase - Service role Supabase client for database access
 * @param publicId - Public UUID of the repertoire
 * @returns PublicRepertoireDto with repertoire metadata and song links
 * @throws NotFoundError if repertoire doesn't exist
 * @throws ResourceGoneError if repertoire exists but is not published
 */
export const getPublicRepertoire = async (
    supabase: ServiceRoleSupabaseClient,
    publicId: string,
): Promise<PublicRepertoireDto> => {
    logger.info('Fetching public repertoire', { publicId });

    // Step 1: Verify repertoire exists and is published
    const { data: repertoire, error: repertoireError } = await supabase
        .from('repertoires')
        .select(REPERTOIRE_COLUMNS)
        .eq('public_id', publicId)
        .limit(1)
        .maybeSingle();

    if (repertoireError) {
        logger.error('Database error while fetching repertoire', {
            publicId,
            error: repertoireError,
        });
        throw createNotFoundError('Nie znaleziono repertuaru');
    }

    if (!repertoire) {
        logger.warn('Repertoire not found', { publicId });
        throw createNotFoundError('Nie znaleziono repertuaru');
    }

    // Check if repertoire is published
    if (!repertoire.published_at) {
        logger.warn('Repertoire not published', {
            publicId,
            repertoireId: repertoire.id,
        });
        throw createResourceGoneError(
            'Repertuar nie jest już dostępny',
            { reason: 'unpublished' },
        );
    }

    logger.info('Repertoire verified, fetching songs', {
        publicId,
        repertoireId: repertoire.id,
    });

    // Step 2: Fetch songs for this repertoire
    const { data: songLinks, error: songsError } = await supabase
        .from('repertoire_songs')
        .select(`
            position,
            songs!inner (
                ${SONG_COLUMNS}
            )
        `)
        .eq('repertoire_id', repertoire.id)
        .order('position', { ascending: true });

    if (songsError) {
        logger.error('Database error while fetching repertoire songs', {
            publicId,
            repertoireId: repertoire.id,
            error: songsError,
        });
        throw createNotFoundError('Nie udało się pobrać piosenek repertuaru');
    }

    // Map songs to DTO format with public URLs
    const baseUrl = getBaseUrl();
    const songs: PublicRepertoireSongLinkDto[] = (songLinks || []).map((link) => {
        const song = link.songs as { title: string; public_id: string };
        return {
            title: song.title,
            publicSongUrl: PUBLIC_SONG_URL_PATTERN(baseUrl, publicId, song.public_id),
        };
    });

    logger.info('Successfully fetched public repertoire', {
        publicId,
        repertoireId: repertoire.id,
        songCount: songs.length,
    });

    return {
        name: repertoire.name,
        description: repertoire.description,
        songs,
    };
};

/**
 * RPC response type for get_public_repertoire_song_details function
 */
type PublicRepertoireSongRpcResult = {
    song_title: string;
    song_content: string;
    song_published_at: string | null;
    repertoire_published_at: string | null;
    position_in_repertoire: number;
    total_songs_count: number;
    previous_song_public_id: string | null;
    previous_song_title: string | null;
    next_song_public_id: string | null;
    next_song_title: string | null;
};

/**
 * Fetches details of a single song within a public repertoire context.
 * 
 * This service calls an RPC function that performs a single optimized query
 * to retrieve the song content and navigation metadata (position, previous, next).
 * 
 * @param supabase - Service role Supabase client for database access
 * @param repertoirePublicId - Public UUID of the repertoire
 * @param songPublicId - Public UUID of the song
 * @returns PublicRepertoireSongDto with song content and order navigation
 * @throws NotFoundError if repertoire or song don't exist, or song is not in repertoire
 * @throws ResourceGoneError if either resource exists but is not published
 */
export const getPublicRepertoireSongDetails = async (
    supabase: ServiceRoleSupabaseClient,
    repertoirePublicId: string,
    songPublicId: string,
): Promise<PublicRepertoireSongDto> => {
    logger.info('Fetching public repertoire song details', {
        repertoirePublicId,
        songPublicId,
    });

    // Call RPC function to get song details with navigation in one query
    const { data, error } = await supabase
        .rpc('get_public_repertoire_song_details', {
            repertoire_public_id: repertoirePublicId,
            song_public_id: songPublicId,
        })
        .single();

    if (error) {
        logger.error('Database error while fetching repertoire song details', {
            repertoirePublicId,
            songPublicId,
            error,
        });
        throw createNotFoundError(
            'Nie znaleziono piosenki w repertuarze',
        );
    }

    // If RPC returns no data, resource doesn't exist or song is not in repertoire
    if (!data) {
        logger.warn('Repertoire song not found or not part of repertoire', {
            repertoirePublicId,
            songPublicId,
        });
        throw createNotFoundError(
            'Nie znaleziono piosenki w repertuarze',
        );
    }

    const rpcResult = data as PublicRepertoireSongRpcResult;

    // Check if repertoire is published
    if (!rpcResult.repertoire_published_at) {
        logger.warn('Repertoire not published', {
            repertoirePublicId,
            songPublicId,
        });
        throw createResourceGoneError(
            'Repertuar nie jest już dostępny',
            { reason: 'repertoire_unpublished' },
        );
    }

    // Check if song is published
    if (!rpcResult.song_published_at) {
        logger.warn('Song not published', {
            repertoirePublicId,
            songPublicId,
        });
        throw createResourceGoneError(
            'Piosenka nie jest już dostępna',
            { reason: 'song_unpublished' },
        );
    }

    // Construct full URLs for navigation with titles
    const baseUrl = getBaseUrl();
    
    // Build previous song navigation link
    const previous: PublicSongNavLinkDto | null = 
        rpcResult.previous_song_public_id && rpcResult.previous_song_title
            ? {
                url: PUBLIC_SONG_URL_PATTERN(baseUrl, repertoirePublicId, rpcResult.previous_song_public_id),
                title: rpcResult.previous_song_title,
            }
            : null;
    
    // Build next song navigation link
    const next: PublicSongNavLinkDto | null = 
        rpcResult.next_song_public_id && rpcResult.next_song_title
            ? {
                url: PUBLIC_SONG_URL_PATTERN(baseUrl, repertoirePublicId, rpcResult.next_song_public_id),
                title: rpcResult.next_song_title,
            }
            : null;
    
    const order: PublicRepertoireSongOrderDto = {
        position: rpcResult.position_in_repertoire,
        total: rpcResult.total_songs_count,
        previous,
        next,
    };

    logger.info('Successfully fetched public repertoire song details', {
        repertoirePublicId,
        songPublicId,
        position: order.position,
        total: order.total,
    });

    return {
        title: rpcResult.song_title,
        content: rpcResult.song_content,
        order,
    };
};

