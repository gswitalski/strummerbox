import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, withErrorHandling } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { profileRouter } from './profile.handlers.ts';

serve(async (request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createSupabaseClient(request);

    const execute = withErrorHandling(async () => {
        const user = await requireAuth(supabase);

        if (path.endsWith('/profile')) {
            return await profileRouter(request, supabase, user);
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }, { operation: 'me-endpoint' });

    try {
        return await execute();
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        if (error instanceof ApplicationError) {
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in /me endpoint', { error });
        return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
    }
});

