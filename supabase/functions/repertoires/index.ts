import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, handleCorsPreFlight, withErrorHandling } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { repertoiresRouter } from './repertoires.handlers.ts';

serve(async (request) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCorsPreFlight();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createSupabaseClient(request);

    const execute = withErrorHandling(async () => {
        // Obsługuje ścieżki:
        // - /repertoires
        // - /repertoires/{id}
        // - /repertoires/{id}/publish
        // - /repertoires/{id}/unpublish
        // - /repertoires/{id}/songs
        // - /repertoires/{id}/songs/reorder
        // - /repertoires/{id}/songs/{repertoireSongId}
        const repertoiresPathRegex = /^\/repertoires(?:\/[^/]+(?:\/(publish|unpublish|songs(?:\/(?:reorder|[^/]+))?))?)?$/;

        if (repertoiresPathRegex.test(path)) {
            const user = await requireAuth(supabase);
            return await repertoiresRouter(request, supabase, user, path);
        }

        logger.warn('Nieobsłużona ścieżka w funkcji /repertoires', { path });

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }, { operation: 'repertoires-endpoint', path });

    try {
        return await execute();
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        if (error instanceof ApplicationError) {
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in /repertoires endpoint', { error });
        return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
    }
});

