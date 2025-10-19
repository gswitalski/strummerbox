import type { SongDto, SongCreateCommand } from '../../../packages/contracts/types.ts';
import { createConflictError, createInternalError, createNotFoundError } from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

const SONG_COLUMNS =
    'id, public_id, title, content, published_at, created_at, updated_at';

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

    return {
        id: data.id,
        publicId: data.public_id,
        title: data.title,
        content: data.content,
        publishedAt: data.published_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

export type SongPutCommand = {
    title: string;
    content: string;
    published?: boolean;
};

export type UpdateSongParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    songId: string;
    command: SongPutCommand;
};

export const updateSong = async ({
    supabase,
    organizerId,
    songId,
    command,
}: UpdateSongParams): Promise<SongDto> => {
    const { title, content, published } = command;
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

    const publishedAt = published === undefined
        ? existingSong.published_at
        : published
            ? new Date().toISOString()
            : null;

    const { data, error } = await supabase
        .from('songs')
        .update({
            title: trimmedTitle,
            content,
            published_at: publishedAt,
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

    return {
        id: data.id,
        publicId: data.public_id,
        title: data.title,
        content: data.content,
        publishedAt: data.published_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

