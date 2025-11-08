import { z } from 'npm:zod';
import type { SongShareMetaDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { getSongShareMeta } from './songs.service.ts';

/**
 * Schema walidacji dla identyfikatora piosenki (UUID)
 */
const SONG_ID_SCHEMA = z.string().uuid('Nieprawidłowy identyfikator piosenki');

/**
 * Parsuje i waliduje identyfikator piosenki z parametru ścieżki
 */
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

/**
 * Handler dla endpointa GET /share/songs/{id}
 * Zwraca metadane do udostępniania piosenki (publicUrl, qrPayload)
 */
export const handleGetSongShareMeta = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);

    logger.info('Rozpoczęto pobieranie metadanych udostępniania piosenki', {
        userId: user.id,
        songId,
    });

    const shareMeta = await getSongShareMeta({
        supabase,
        songId,
        organizerId: user.id,
    });

    const responseBody: { data: SongShareMetaDto } = {
        data: shareMeta,
    };

    const headers = new Headers({
        'Cache-Control': 'no-store',
    });

    return jsonResponse(responseBody, { status: 200, headers });
};

/**
 * Router dla endpointów związanych z udostępnianiem piosenek
 * Obsługuje ścieżki /share/songs/*
 */
export const songsRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response | null> => {
    // Dopasowanie ścieżki /share/songs/{id}
    const songShareMatch = path.match(/\/share\/songs\/([^/]+)$/);

    if (songShareMatch) {
        const songId = songShareMatch[1];

        if (request.method === 'GET') {
            return await handleGetSongShareMeta(request, supabase, user, songId);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'GET',
            },
        });
    }

    // Ścieżka nie pasuje - zwracamy null, żeby główny router mógł spróbować innych routerów
    return null;
};

