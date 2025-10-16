import { createUnauthorizedError } from './errors.ts';
import { logger } from './logger.ts';
import type { RequestSupabaseClient } from './supabase-client.ts';

export type AuthenticatedUser = {
    id: string;
    email: string;
};

export const requireAuth = async (
    supabase: RequestSupabaseClient,
): Promise<AuthenticatedUser> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        logger.warn('Failed to obtain authenticated user', { error });
        throw createUnauthorizedError('Wymagane uwierzytelnienie użytkownika');
    }

    if (!user) {
        logger.warn('Missing authenticated user in context');
        throw createUnauthorizedError('Brak aktywnej sesji użytkownika');
    }

    if (!user.email) {
        logger.warn('Authenticated user missing email claim', { userId: user.id });
        throw createUnauthorizedError('Brak adresu email w tokenie użytkownika');
    }

    return {
        id: user.id,
        email: user.email,
    };
};

