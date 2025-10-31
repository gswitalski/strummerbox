import { z } from 'zod';
import { createValidationError } from '../_shared/errors.ts';
import { jsonResponse } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { createSupabaseServiceRoleClient } from '../_shared/supabase-client.ts';
import { getPublicRepertoire } from './public.service.ts';

/**
 * Validation schema for publicId parameter
 * Ensures the parameter is a valid UUID v4
 */
const publicIdSchema = z.string().uuid({
    message: 'Parametr publicId musi być prawidłowym UUID',
});

/**
 * Handler for GET /public/repertoires/:publicId
 * 
 * Retrieves a published repertoire with its songs for anonymous access.
 * No authentication required, but only published repertoires are accessible.
 * 
 * @param publicId - UUID of the repertoire to fetch
 * @returns Response with PublicRepertoireDto or error
 */
export const handleGetPublicRepertoire = async (publicId: string): Promise<Response> => {
    logger.info('Handling GET public repertoire', { publicId });

    // Validate publicId format
    const validation = publicIdSchema.safeParse(publicId);
    if (!validation.success) {
        const errors = validation.error.format();
        logger.warn('Invalid publicId format', { publicId, errors });
        throw createValidationError('Nieprawidłowy format identyfikatora repertuaru', {
            field: 'publicId',
            issues: validation.error.issues,
        });
    }

    // Create service role client (no auth needed for public access)
    const supabase = createSupabaseServiceRoleClient();

    // Fetch repertoire from service
    const repertoire = await getPublicRepertoire(supabase, publicId);

    // Return success response
    return jsonResponse(repertoire, { status: 200 });
};

/**
 * Router for public repertoire endpoints
 * 
 * Handles routing for /public/repertoires/* paths
 * 
 * @param req - Incoming HTTP request
 * @param pathname - Normalized pathname (without /public prefix)
 * @returns Response if route matches, null otherwise
 */
export const publicRepertoireRouter = async (
    req: Request,
    pathname: string,
): Promise<Response | null> => {
    // Route: GET /public/repertoires/:publicId
    const repertoireMatch = pathname.match(/^\/repertoires\/([^/]+)$/);
    if (repertoireMatch) {
        if (req.method !== 'GET') {
            return jsonResponse(
                {
                    error: {
                        code: 'validation_error',
                        message: 'Metoda HTTP nie jest wspierana dla tego endpointu',
                        details: { allowedMethods: ['GET'] },
                    },
                },
                { status: 405 },
            );
        }

        const publicId = repertoireMatch[1];
        return await handleGetPublicRepertoire(publicId);
    }

    // No match for this router
    return null;
};

