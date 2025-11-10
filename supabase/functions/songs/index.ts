import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, handleCorsPreFlight, withErrorHandling } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { songsRouter } from './songs.handlers.ts';

serve(async (request) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCorsPreFlight(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createSupabaseClient(request);

    const execute = withErrorHandling(async () => {
        // Public endpoints (no authentication required)
        const publicSongMatch = path.match(/\/songs\/public\/([^/]+)$/);
        if (publicSongMatch && request.method === 'GET') {
            const { handleGetPublicSong } = await import('./songs.handlers.ts');
            return await handleGetPublicSong(request, supabase, publicSongMatch[1]);
        }

        // Protected endpoints (authentication required)
        const songsPathRegex = /^\/songs(\/[^/]+(\/(publish|unpublish))?)?$/;

        if (songsPathRegex.test(path)) {
            const user = await requireAuth(supabase);
            return await songsRouter(request, supabase, user, path);
        }

        logger.warn('Nieobsłużona ścieżka w funkcji /songs', { path });

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }, { operation: 'songs-endpoint', path });

    try {
        return await execute();
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        if (error instanceof ApplicationError) {
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in /songs endpoint', { error });
        return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
    }
});

