import { buildErrorResponse, handleCorsPreFlight, jsonResponse } from '../_shared/http.ts';
import { isApplicationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import { publicRepertoireRouter } from './public.handlers.ts';

/**
 * Public Edge Function - Entry point
 * Handles public access to published repertoires and songs
 */
Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return handleCorsPreFlight(req);
    }

    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/public/, '');

    logger.info('Public endpoint request', {
        method: req.method,
        pathname,
    });

    try {
        // Route: GET /public/repertoires/:publicId
        const repertoireResponse = await publicRepertoireRouter(req, pathname);
        if (repertoireResponse) {
            return repertoireResponse;
        }

        // No matching route
        return jsonResponse(
            {
                error: {
                    code: 'resource_not_found',
                    message: 'Endpoint nie został znaleziony',
                    details: null,
                },
            },
            { status: 404 },
            req,
        );
    } catch (error) {
        if (isApplicationError(error)) {
            logger.warn('Application error in public endpoint', {
                code: error.code,
                status: error.status,
                pathname,
            });
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in public endpoint', {
            error,
            pathname,
        });

        return jsonResponse(
            {
                error: {
                    code: 'internal_error',
                    message: 'Wystąpił nieoczekiwany błąd serwera',
                    details: null,
                },
            },
            { status: 500 },
            req,
        );
    }
});

