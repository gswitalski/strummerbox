import type { OrganizerProfileDto } from '../../../../packages/contracts/types.ts';
import { createNotFoundError, createInternalError } from '../../_shared/errors.ts';
import type { RequestSupabaseClient } from '../../_shared/supabase-client.ts';
import { logger } from '../../_shared/logger.ts';

const PROFILE_COLUMNS = 'id, display_name, created_at, updated_at';

export const getOrganizerProfile = async (
    supabase: RequestSupabaseClient,
    params: {
        userId: string;
        email: string;
    },
): Promise<OrganizerProfileDto> => {
    const { userId, email } = params;

    const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        logger.error('Failed to fetch organizer profile', { userId, error });
        throw createInternalError('Nie udało się pobrać profilu użytkownika', error);
    }

    if (!data) {
        logger.warn('Organizer profile not found', { userId });
        throw createNotFoundError('Profil organizatora nie został znaleziony', { userId });
    }

    return {
        id: data.id,
        email,
        displayName: data.display_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
};

