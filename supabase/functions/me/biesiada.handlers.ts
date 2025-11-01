import type { BiesiadaRepertoireListResponseDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';
import { getBiesiadaRepertoires } from './biesiada.service.ts';

/**
 * Handler dla GET /me/biesiada/repertoires
 * Zwraca uproszczoną listę repertuarów dla trybu Biesiada na urządzeniach mobilnych.
 * 
 * @param request - Obiekt Request z query parameters
 * @param supabase - Klient Supabase skonfigurowany dla bieżącego żądania
 * @param user - Uwierzytelniony użytkownik (organizator)
 * @returns Response z listą repertuarów lub błędem
 */
export const handleGetBiesiadaRepertoires = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const url = new URL(request.url);
    
    // Parsowanie parametru includePublished z query string
    // Domyślnie false - pokazujemy wszystkie repertuary
    const includePublishedParam = url.searchParams.get('includePublished');
    const includePublished = includePublishedParam === 'true';

    logger.info('Handling GET /me/biesiada/repertoires', {
        userId: user.id,
        includePublished,
    });

    // Wywołanie warstwy serwisu
    const repertoires = await getBiesiadaRepertoires(supabase, {
        organizerId: user.id,
        includePublished,
    });

    // Formatowanie odpowiedzi zgodnie z DTO
    const response: BiesiadaRepertoireListResponseDto = {
        items: repertoires,
    };

    return jsonResponse<BiesiadaRepertoireListResponseDto>(response, {
        headers: {
            // Biesiada mode - krótki cache dla lepszej wydajności
            'Cache-Control': 'private, max-age=30',
        },
    });
};

/**
 * Router dla ścieżki /me/biesiada/*
 * Obsługuje zagnieżdżone endpointy związane z trybem Biesiada.
 * 
 * @param request - Obiekt Request
 * @param supabase - Klient Supabase
 * @param user - Uwierzytelniony użytkownik
 * @returns Response z odpowiednim handlerem lub 404/405
 */
export const biesiadaRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /me/biesiada/repertoires
    if (path.endsWith('/biesiada/repertoires') && request.method === 'GET') {
        return await handleGetBiesiadaRepertoires(request, supabase, user);
    }

    // TODO: Dodać obsługę /me/biesiada/repertoires/{id}/songs
    // TODO: Dodać obsługę /me/biesiada/repertoires/{id}/songs/{songId}

    // Nieobsłużona ścieżka w routerze biesiada
    logger.warn('Unhandled path in biesiada router', { path, method: request.method });

    return new Response(
        JSON.stringify({
            error: {
                code: 'resource_not_found',
                message: 'Nie znaleziono zasobu',
            },
        }),
        {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        },
    );
};

