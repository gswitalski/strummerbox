import type {
    SongDetailDto,
    SongDto,
    SongCreateCommand,
    SongListResponseDto,
    SongSummaryDto,
    SongUsageDto,
} from '../../../packages/contracts/types.ts';
import {
    createConflictError,
    createInternalError,
    createNotFoundError,
    ApplicationError,
} from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

const SONG_COLUMNS =
    'id, public_id, title, content, published_at, created_at, updated_at';

const SONG_SUMMARY_COLUMNS = 'id, public_id, title, published_at, created_at, updated_at';

const SONG_USAGE_COLUMNS = 'repertoire_id, repertoires!inner(id, name, organizer_id)';

const mapToSongDto = (row: {
    id: string;
    public_id: string;
    title: string;
    content: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}): SongDto => ({
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    content: row.content,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const SORT_COLUMN_MAP = {
    title: 'title',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    publishedAt: 'published_at',
} as const;

export type GetSongsSortField = keyof typeof SORT_COLUMN_MAP;

export type GetSongsFilters = {
    page: number;
    pageSize: number;
    search?: string;
    published?: boolean;
    sort: {
        field: GetSongsSortField;
        direction: 'asc' | 'desc';
    };
};

export type GetSongsParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    filters: GetSongsFilters;
};

const mapToSongSummaryDto = (row: {
    id: string;
    public_id: string;
    title: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}): SongSummaryDto => ({
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export type CreateSongParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    command: SongCreateCommand;
};

export const createSong = async ({
    supabase,
    organizerId,
    command,
}: CreateSongParams): Promise<SongDto> => {
    const { title, content, published } = command;

    const trimmedTitle = title.trim();
    const publishedAt = published ? new Date().toISOString() : null;

    const insertPayload = {
        organizer_id: organizerId,
        title: trimmedTitle,
        content,
        published_at: publishedAt,
    };

    const { data, error } = await supabase
        .from('songs')
        .insert(insertPayload)
        .select(SONG_COLUMNS)
        .single();

    if (error) {
        if (error.code === '23505') {
            logger.warn('Song title conflict for organizer', {
                organizerId,
                title: trimmedTitle,
            });
            throw createConflictError('Piosenka o podanym tytule już istnieje', {
                title: trimmedTitle,
            });
        }

        logger.error('Failed to insert song', {
            organizerId,
            error,
        });
        throw createInternalError('Nie udało się utworzyć piosenki', error);
    }

    if (!data) {
        logger.error('Supabase returned empty payload after song insert', {
            organizerId,
        });
        throw createInternalError('Nie udało się pobrać danych nowej piosenki');
    }

    logger.info('Song created successfully', {
        organizerId,
        songId: data.id,
        title: data.title,
    });

    return mapToSongDto(data);
};

export type SongPatchCommand = {
    title: string;
    content: string;
};

export type UpdateSongParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    songId: string;
    command: SongPatchCommand;
};

export const updateSong = async ({
    supabase,
    organizerId,
    songId,
    command,
}: UpdateSongParams): Promise<SongDto> => {
    const { title, content } = command;
    const trimmedTitle = title.trim();

    const { data: existingSong, error: fetchError } = await supabase
        .from('songs')
        .select(SONG_COLUMNS)
        .eq('id', songId)
        .eq('organizer_id', organizerId)
        .maybeSingle();

    if (fetchError) {
        logger.error('Failed to fetch song before update', {
            organizerId,
            songId,
            error: fetchError,
        });
        throw createInternalError('Nie udało się pobrać danych piosenki', fetchError);
    }

    if (!existingSong) {
        logger.warn('Song not found for update', {
            organizerId,
            songId,
        });
        throw createNotFoundError('Piosenka nie została znaleziona', { songId });
    }

    const { data, error } = await supabase
        .from('songs')
        .update({
            title: trimmedTitle,
            content,
        })
        .eq('id', songId)
        .eq('organizer_id', organizerId)
        .select(SONG_COLUMNS)
        .single();

    if (error) {
        if (error.code === '23505') {
            logger.warn('Song title conflict during update', {
                organizerId,
                songId,
                title: trimmedTitle,
            });

            throw createConflictError('Piosenka o podanym tytule już istnieje', {
                title: trimmedTitle,
            });
        }

        logger.error('Failed to update song', {
            organizerId,
            songId,
            error,
        });

        throw createInternalError('Nie udało się zaktualizować piosenki', error);
    }

    logger.info('Song updated successfully', {
        organizerId,
        songId,
    });

    return mapToSongDto(data);
};

const calculatePaginationRange = (page: number, pageSize: number): { from: number; to: number } => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return { from, to };
};

export const getSongs = async ({
    supabase,
    organizerId,
    filters,
}: GetSongsParams): Promise<SongListResponseDto> => {
    const { page, pageSize, search, published, sort } = filters;

    const query = supabase
        .from('songs')
        .select(SONG_SUMMARY_COLUMNS, { count: 'exact' })
        .eq('organizer_id', organizerId);

    if (search) {
        query.ilike('title', `%${search}%`);
    }

    if (published !== undefined) {
        if (published) {
            query.not('published_at', 'is', null);
        } else {
            query.is('published_at', null);
        }
    }

    const sortColumn = SORT_COLUMN_MAP[sort.field];
    const ascending = sort.direction === 'asc';

    query.order(sortColumn, {
        ascending,
        nullsFirst: ascending,
    });

    const { from, to } = calculatePaginationRange(page, pageSize);
    query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
        logger.error('Nie udało się pobrać listy piosenek', {
            organizerId,
            filters,
            error,
        });
        throw createInternalError('Nie udało się pobrać listy piosenek', error);
    }

    if (!data) {
        logger.error('Supabase zwróciło pustą odpowiedź przy pobieraniu piosenek', {
            organizerId,
            filters,
        });
        throw createInternalError('Nie udało się pobrać listy piosenek');
    }

    const items = data.map(mapToSongSummaryDto);

    const total = count ?? 0;

    logger.info('Pomyślnie pobrano listę piosenek', {
        organizerId,
        page,
        pageSize,
        itemCount: items.length,
        total,
    });

    return {
        items,
        page,
        pageSize,
        total,
    };
};

export type GetSongDetailsParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    songId: string;
    includeUsage: boolean;
};

export const getSongDetails = async ({
    supabase,
    organizerId,
    songId,
    includeUsage,
}: GetSongDetailsParams): Promise<SongDetailDto> => {
    const { data: songRow, error: songError } = await supabase
        .from('songs')
        .select(SONG_COLUMNS)
        .eq('id', songId)
        .eq('organizer_id', organizerId)
        .maybeSingle();

    if (songError) {
        logger.error('Failed to fetch song details', {
            organizerId,
            songId,
            error: songError,
        });
        throw createInternalError('Nie udało się pobrać danych piosenki', songError);
    }

    if (!songRow) {
        logger.warn('Song not found when fetching details', {
            organizerId,
            songId,
        });
        throw createNotFoundError('Piosenka nie została znaleziona', { songId });
    }

    const song = mapToSongDto(songRow);

    if (!includeUsage) {
        logger.info('Song details fetched without usage info', {
            organizerId,
            songId,
        });
        return song;
    }

    const { data: usageRows, error: usageError } = await supabase
        .from('repertoire_songs')
        .select(SONG_USAGE_COLUMNS)
        .eq('song_id', songId)
        .eq('repertoires.organizer_id', organizerId);

    if (usageError) {
        logger.error('Failed to fetch song usage information', {
            organizerId,
            songId,
            error: usageError,
        });
        throw createInternalError('Nie udało się pobrać informacji o wykorzystaniu piosenki', usageError);
    }

    const usages: SongUsageDto[] = (usageRows ?? []).map((row) => {
        const repertoire = row.repertoires;

        if (!repertoire) {
            logger.warn('Song usage row missing joined repertoire', {
                songId,
                repertoireId: row.repertoire_id,
            });
            return null;
        }

        return {
            repertoireId: repertoire.id,
            name: repertoire.name,
        } satisfies SongUsageDto;
    }).filter((usage): usage is SongUsageDto => usage !== null);

    logger.info('Song details fetched with usage info', {
        organizerId,
        songId,
        usageCount: usages.length,
    });

    const songWithUsage: SongDetailDto = usages.length > 0 ? { ...song, repertoires: usages } : song;

    return songWithUsage;
};

export type PublishSongParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    songId: string;
};

export const publishSong = async ({
    supabase,
    organizerId,
    songId,
}: PublishSongParams): Promise<SongDto> => {
    const { data, error } = await supabase
        .from('songs')
        .update({ published_at: new Date().toISOString() })
        .eq('id', songId)
        .eq('organizer_id', organizerId)
        .select(SONG_COLUMNS)
        .single();

    if (error) {
        logger.error('Nie udało się opublikować piosenki', {
            organizerId,
            songId,
            error,
        });
        throw createInternalError('Nie udało się opublikować piosenki', error);
    }

    if (!data) {
        logger.warn('Nie znaleziono piosenki do publikacji', {
            organizerId,
            songId,
        });
        throw createNotFoundError('Piosenka nie została znaleziona', { songId });
    }

    logger.info('Pomyślnie opublikowano piosenkę', {
        organizerId,
        songId,
    });

    return mapToSongDto(data);
};

/**
 * Parametry dla funkcji pobierającej publiczną piosenkę
 */
export type GetPublicSongParams = {
    supabase: RequestSupabaseClient;
    publicId: string;
};

/**
 * Kolumny pobierane dla publicznej piosenki
 */
const PUBLIC_SONG_COLUMNS = 'title, content';

/**
 * Pobiera opublikowaną piosenkę na podstawie publicId.
 * Zwraca tylko title i content dla opublikowanych piosenek (published_at IS NOT NULL).
 * Rzuca NotFoundError jeśli piosenka nie istnieje lub nie jest opublikowana.
 */
export const getPublicSongByPublicId = async ({
    supabase,
    publicId,
}: GetPublicSongParams): Promise<{ title: string; content: string }> => {
    const { data, error } = await supabase
        .from('songs')
        .select(PUBLIC_SONG_COLUMNS)
        .eq('public_id', publicId)
        .not('published_at', 'is', null)
        .maybeSingle();

    if (error) {
        logger.error('Nie udało się pobrać publicznej piosenki', {
            publicId,
            error,
        });
        throw createInternalError('Nie udało się pobrać publicznej piosenki', error);
    }

    if (!data) {
        logger.warn('Publiczna piosenka nie została znaleziona lub nie jest opublikowana', {
            publicId,
        });
        throw createNotFoundError('Piosenka nie została znaleziona lub nie jest opublikowana', {
            publicId,
        });
    }

    logger.info('Pomyślnie pobrano publiczną piosenkę', {
        publicId,
        title: data.title,
    });

    return {
        title: data.title,
        content: data.content,
    };
};

