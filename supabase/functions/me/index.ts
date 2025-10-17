import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import type { OrganizerProfileDto } from '../../../packages/contracts/types.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, jsonResponse, withErrorHandling } from '../_shared/http.ts';
import { getOrganizerProfile } from './profile.service.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';

const handleGetProfile = async (
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const profile = await getOrganizerProfile(supabase, {
        userId: user.id,
        email: user.email,
    });

    return jsonResponse<{ data: OrganizerProfileDto }>(
        { data: profile },
        {
            headers: {
                'Cache-Control': 'no-store',
            },
        },
    );
};

serve(async (request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Routing dla różnych endpointów pod /me
    if (path.endsWith('/profile')) {
        if (request.method !== 'GET') {
            return new Response(null, { status: 405, headers: { Allow: 'GET' } });
        }

        const supabase = createSupabaseClient(request);

        const execute = withErrorHandling(async () => {
            const user = await requireAuth(supabase);

            logger.info('Fetching organizer profile', { userId: user.id });

            return await handleGetProfile(supabase, user);
        }, { operation: 'get-organizer-profile' });

        try {
            return await execute();
        } catch (error) {
            if (error instanceof Response) {
                return error;
            }

            if (error instanceof ApplicationError) {
                return buildErrorResponse(error);
            }

            return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
        }
    }

    // Brak dopasowania ścieżki
    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
    });
});

