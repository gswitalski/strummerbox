import { z } from 'zod';
import type { RepertoireShareMetaDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { getRepertoireShareMeta } from './repertoires.service.ts';

/**
 * Schema walidacji dla identyfikatora repertuaru (UUID)
 */
const REPERTOIRE_ID_SCHEMA = z.string().uuid('Nieprawidłowy identyfikator repertuaru');

/**
 * Parsuje i waliduje identyfikator repertuaru z parametru ścieżki
 */
const parseRepertoireId = (rawRepertoireId: string): string => {
    const result = REPERTOIRE_ID_SCHEMA.safeParse(rawRepertoireId);

    if (!result.success) {
        logger.warn('Nieprawidłowy identyfikator repertuaru w ścieżce', {
            repertoireId: rawRepertoireId,
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator repertuaru', result.error.format());
    }

    return result.data;
};

/**
 * Handler dla endpointa GET /share/repertoires/{id}
 * Zwraca metadane do udostępniania repertuaru (publicUrl, qrPayload)
 */
export const handleGetRepertoireShareMeta = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawRepertoireId: string,
): Promise<Response> => {
    const repertoireId = parseRepertoireId(rawRepertoireId);

    logger.info('Rozpoczęto pobieranie metadanych udostępniania repertuaru', {
        userId: user.id,
        repertoireId,
    });

    const shareMeta = await getRepertoireShareMeta({
        supabase,
        repertoireId,
        organizerId: user.id,
    });

    const responseBody: { data: RepertoireShareMetaDto } = {
        data: shareMeta,
    };

    const headers = new Headers({
        'Cache-Control': 'no-store',
    });

    return jsonResponse(responseBody, { status: 200, headers });
};

/**
 * Router dla endpointów związanych z udostępnianiem repertuarów
 * Obsługuje ścieżki /share/repertoires/*
 */
export const repertoiresRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response | null> => {
    // Dopasowanie ścieżki /share/repertoires/{id}
    const repertoireShareMatch = path.match(/\/share\/repertoires\/([^/]+)$/);

    if (repertoireShareMatch) {
        const repertoireId = repertoireShareMatch[1];

        if (request.method === 'GET') {
            return await handleGetRepertoireShareMeta(request, supabase, user, repertoireId);
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

