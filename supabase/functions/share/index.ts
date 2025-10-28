import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, withErrorHandling } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { songsRouter } from './songs.handlers.ts';
import { repertoiresRouter } from './repertoires.handlers.ts';

serve(async (request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createSupabaseClient(request);

    const execute = withErrorHandling(async () => {
        // Wszystkie endpointy w /share wymagają uwierzytelnienia
        const user = await requireAuth(supabase);

        // Routing do handlerów repertuarów (/share/repertoires/*)
        const repertoiresPathRegex = /\/share\/repertoires(?:\/[^/]+)?$/;

        if (repertoiresPathRegex.test(path)) {
            const response = await repertoiresRouter(request, supabase, user, path);

            if (response !== null) {
                return response;
            }
        }

        // Routing do handlerów piosenek (/share/songs/*)
        const songsPathRegex = /\/share\/songs(?:\/[^/]+)?$/;

        if (songsPathRegex.test(path)) {
            const response = await songsRouter(request, supabase, user, path);

            if (response !== null) {
                return response;
            }
        }

        logger.warn('Nieobsłużona ścieżka w funkcji /share', { path });

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }, { operation: 'share-endpoint', path });

    try {
        return await execute();
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        if (error instanceof ApplicationError) {
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in /share endpoint', { error });
        return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
    }
});

