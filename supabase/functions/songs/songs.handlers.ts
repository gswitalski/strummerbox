import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import type { SongCreateCommand } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { createSong } from './songs.service.ts';

const COMMAND_SCHEMA = z
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

const parseRequestBody = async (request: Request): Promise<SongCreateCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu utworzenia piosenki', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania utworzenia piosenki', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

export const handlePostSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const command = await parseRequestBody(request);

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

export const songsRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    if (request.method === 'POST') {
        return await handlePostSong(request, supabase, user);
    }

    return new Response(null, {
        status: 405,
        headers: {
            Allow: 'POST',
        },
    });
};

