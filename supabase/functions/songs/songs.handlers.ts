import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import type { SongCreateCommand } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { createSong, updateSong, type SongPutCommand } from './songs.service.ts';

const SONG_ID_SCHEMA = z.string().uuid('Nieprawidłowy identyfikator piosenki');

const POST_COMMAND_SCHEMA = z
    .object({
        title: z
            .string({ required_error: 'Tytuł piosenki jest wymagany' })
            .trim()
            .min(1, 'Tytuł piosenki jest wymagany')
            .max(180, 'Tytuł może mieć maksymalnie 180 znaków'),
        content: z
            .string({ required_error: 'Treść piosenki jest wymagana' })
            .min(1, 'Treść piosenki nie może być pusta'),
        published: z.boolean().optional(),
    })
    .strict();

const PUT_COMMAND_SCHEMA = z
    .object({
        title: z
            .string({ required_error: 'Tytuł piosenki jest wymagany' })
            .trim()
            .min(1, 'Tytuł piosenki jest wymagany')
            .max(180, 'Tytuł może mieć maksymalnie 180 znaków'),
        content: z
            .string({ required_error: 'Treść piosenki jest wymagana' })
            .min(1, 'Treść piosenki nie może być pusta'),
        published: z.boolean().optional(),
    })
    .strict();

const parsePostRequestBody = async (request: Request): Promise<SongCreateCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu utworzenia piosenki', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = POST_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania utworzenia piosenki', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

const parsePutRequestBody = async (request: Request): Promise<SongPutCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu aktualizacji piosenki', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = PUT_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania aktualizacji piosenki', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

const parseSongId = (rawSongId: string): string => {
    const result = SONG_ID_SCHEMA.safeParse(rawSongId);

    if (!result.success) {
        logger.warn('Nieprawidłowy identyfikator piosenki w ścieżce', {
            songId: rawSongId,
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator piosenki', result.error.format());
    }

    return result.data;
};

export const handlePostSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const command = await parsePostRequestBody(request);

    logger.info('Rozpoczęto tworzenie nowej piosenki', {
        userId: user.id,
        title: command.title,
    });

    const song = await createSong({
        command,
        organizerId: user.id,
        supabase,
    });

    return jsonResponse({ data: song }, { status: 201 });
};

export const handlePutSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);
    const command = await parsePutRequestBody(request);

    logger.info('Rozpoczęto aktualizację piosenki', {
        userId: user.id,
        songId,
        title: command.title,
        published: command.published ?? 'no_change',
    });

    const song = await updateSong({
        command,
        organizerId: user.id,
        songId,
        supabase,
    });

    return jsonResponse({ data: song }, { status: 200 });
};

export const songsRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response> => {
    if (path.endsWith('/songs')) {
        if (request.method === 'POST') {
            return await handlePostSong(request, supabase, user);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'POST',
            },
        });
    }

    const songMatch = path.match(/\/songs\/([^/]+)$/);

    if (songMatch) {
        const songId = songMatch[1];

        if (request.method === 'PUT') {
            return await handlePutSong(request, supabase, user, songId);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'PUT',
            },
        });
    }

    logger.warn('Router songs nie dopasował ścieżki', { path });

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

