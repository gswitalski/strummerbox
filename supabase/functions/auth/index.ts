import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { buildErrorResponse, handleCorsPreFlight } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { registerRouter } from './register.handlers.ts';
import { resendConfirmationRouter } from './resend-confirmation.handlers.ts';

/**
 * Główny router dla Edge Function /auth.
 * Obsługuje endpointy związane z autentykacją i rejestracją.
 */
Deno.serve(async (request: Request) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCorsPreFlight(request);
    }

    const url = new URL(request.url);
    const fullPath = url.pathname;
    // Usuń prefiks /auth jeśli istnieje
    const path = fullPath.replace(/^\/auth/, '') || '/';

    logger.info('Auth endpoint request', { 
        method: request.method, 
        fullPath,
        path 
    });

    try {
        // POST /auth/register lub /register
        if (path === '/register' || path === '/') {
            return await registerRouter(request);
        }

        // POST /auth/resend-confirmation lub /resend-confirmation
        if (path === '/resend-confirmation') {
            return await resendConfirmationRouter(request);
        }

        // Nieznana ścieżka
        return new Response(
            JSON.stringify({
                error: {
                    code: 'resource_not_found',
                    message: 'Endpoint nie został znaleziony',
                },
            }),
            {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        if (error instanceof ApplicationError) {
            return buildErrorResponse(error);
        }

        logger.error('Unexpected error in /auth endpoint', { error });
        return buildErrorResponse(createInternalError('Wystąpił nieoczekiwany błąd serwera', error));
    }
});

