import { handleError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import { registerRouter } from './register.handlers.ts';
import { resendConfirmationRouter } from './resend-confirmation.handlers.ts';

/**
 * Główny router dla Edge Function /auth.
 * Obsługuje endpointy związane z autentykacją i rejestracją.
 */
Deno.serve(async (request: Request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    logger.info('Auth endpoint request', { 
        method: request.method, 
        path 
    });

    try {
        // POST /auth/register
        if (path === '/register' || path === '/') {
            return await registerRouter(request);
        }

        // POST /auth/resend-confirmation
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
        return handleError(error);
    }
});

