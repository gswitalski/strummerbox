import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/auth.ts';
import { buildErrorResponse, handleCorsPreFlight, withErrorHandling } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError, createInternalError } from '../_shared/errors.ts';
import { profileRouter } from './profile.handlers.ts';
import { registerRouter } from './register.handlers.ts';
import { biesiadaRouter } from './biesiada.handlers.ts';

let isSupabaseHealthy = false;

async function ensureSupabaseHealthy() {
    // Ten mechanizm to obejście problemu typu "race condition" w lokalnym środowisku deweloperskim,
    // gdzie kontener funkcji może uruchomić się szybciej niż bramka API Supabase.
    if (isSupabaseHealthy || Deno.env.get('SUPABASE_ENV') !== 'local') {
        isSupabaseHealthy = true; // Oznacz jako sprawdzony dla środowisk innych niż lokalne lub gdy już sprawdzono.
        return;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
        logger.error('SUPABASE_URL is not set. Cannot perform health check.');
        isSupabaseHealthy = true;
        return;
    }

    logger.info('Performing initial health check for local Supabase gateway...');

    for (let i = 0; i < 7; i++) {
        try {
            // Używamy endpointu /health bramki API jako celu sprawdzania.
            const response = await fetch(`${supabaseUrl}/health`, { signal: AbortSignal.timeout(1500) });
            if (response.ok) {
                logger.info('Supabase gateway is healthy.');
                isSupabaseHealthy = true;
                return;
            }
            logger.warn(`Supabase gateway not ready (status: ${response.status}). Retrying... [Attempt ${i + 1}/7]`);
        } catch (error) {
            logger.warn(`Supabase gateway not reachable. Retrying... [Attempt ${i + 1}/7]`, {
                errorMessage: error.message,
            });
        }
        if (i < 6) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    logger.error('Supabase gateway did not become healthy after multiple attempts.');
    // Pozwalamy na kontynuację, aby zwrócić oryginalny błąd do klienta.
    isSupabaseHealthy = true; // Nie sprawdzaj ponownie dla tej instancji.
}

serve(async (request) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCorsPreFlight();
    }

    await ensureSupabaseHealthy();

    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createSupabaseClient(request);

    const execute = withErrorHandling(async () => {
        if (path.endsWith('/register')) {
            return await registerRouter(request);
        }

        const user = await requireAuth(supabase);

        // Routing dla trybu Biesiada - sprawdzamy najpierw, bo jest bardziej specyficzny
        if (path.includes('/biesiada')) {
            return await biesiadaRouter(request, supabase, user);
        }

        if (path.endsWith('/profile')) {
            return await profileRouter(request, supabase, user);
        }

        logger.warn('Nieobsłużona ścieżka w funkcji /me', { path });

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

