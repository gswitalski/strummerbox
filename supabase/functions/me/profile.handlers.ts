import type { OrganizerProfileDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';
import { getOrganizerProfile } from './profile.service.ts';

export const handleGetProfile = async (
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    logger.info('Fetching organizer profile', { userId: user.id });

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

export const profileRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    if (request.method === 'GET') {
        return await handleGetProfile(supabase, user);
    }

    return new Response(null, {
        status: 405,
        headers: { Allow: 'GET' },
    });
};
