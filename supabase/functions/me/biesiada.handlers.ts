import type {
    BiesiadaRepertoireListResponseDto,
    BiesiadaRepertoireSongListResponseDto,
    BiesiadaRepertoireSongDetailDto,
} from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';
import { ApplicationError } from '../_shared/errors.ts';
import { getBiesiadaRepertoires, getBiesiadaRepertoireSongs, getBiesiadaRepertoireSongDetails } from './biesiada.service.ts';

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
 * Walidacja czy string jest prawidłowym UUID v4.
 * 
 * @param value - String do walidacji
 * @returns true jeśli jest prawidłowym UUID
 */
const isValidUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
};

/**
 * Handler dla GET /me/biesiada/repertoires/{id}/songs
 * Zwraca uporządkowaną listę piosenek dla określonego repertuaru w trybie Biesiada.
 * 
 * @param request - Obiekt Request
 * @param supabase - Klient Supabase skonfigurowany dla bieżącego żądania
 * @param user - Uwierzytelniony użytkownik (organizator)
 * @param repertoireId - UUID repertuaru z URL
 * @returns Response z listą piosenek lub błędem
 */
export const handleGetBiesiadaRepertoireSongs = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
): Promise<Response> => {
    // Walidacja formatu UUID
    if (!isValidUUID(repertoireId)) {
        logger.warn('Invalid UUID format for repertoire ID', {
            repertoireId,
            userId: user.id,
        });

        return new Response(
            JSON.stringify({
                error: {
                    code: 'validation_error',
                    message: 'Nieprawidłowy format identyfikatora repertuaru',
                    details: { repertoireId: 'Must be a valid UUID' },
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }

    logger.info('Handling GET /me/biesiada/repertoires/{id}/songs', {
        userId: user.id,
        repertoireId,
    });

    try {
        // Wywołanie warstwy serwisu
        const response = await getBiesiadaRepertoireSongs(supabase, {
            repertoireId,
            userId: user.id,
        });

        return jsonResponse<BiesiadaRepertoireSongListResponseDto>(response, {
            headers: {
                // Biesiada mode - krótki cache dla lepszej wydajności
                'Cache-Control': 'private, max-age=30',
            },
        });
    } catch (error) {
        // ApplicationError jest rzucany przez serwis w przypadku resource_not_found
        if (error instanceof ApplicationError && error.code === 'resource_not_found') {
            return new Response(
                JSON.stringify({
                    error: {
                        code: error.code,
                        message: error.message,
                    },
                }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Inne błędy propagujemy dalej
        throw error;
    }
};

/**
 * Handler dla GET /me/biesiada/repertoires/{id}/songs/{songId}
 * Zwraca szczegółowe informacje o konkretnej piosence w kontekście repertuaru dla trybu Biesiada.
 * 
 * @param request - Obiekt Request
 * @param supabase - Klient Supabase skonfigurowany dla bieżącego żądania
 * @param user - Uwierzytelniony użytkownik (organizator)
 * @param repertoireId - UUID repertuaru z URL
 * @param songId - UUID piosenki z URL
 * @returns Response ze szczegółami piosenki lub błędem
 */
export const handleGetBiesiadaRepertoireSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
    songId: string,
): Promise<Response> => {
    // Walidacja formatu UUID dla repertoireId
    if (!isValidUUID(repertoireId)) {
        logger.warn('Invalid UUID format for repertoire ID', {
            repertoireId,
            userId: user.id,
        });

        return new Response(
            JSON.stringify({
                error: {
                    code: 'validation_error',
                    message: 'Nieprawidłowy format identyfikatora repertuaru',
                    details: { repertoireId: 'Must be a valid UUID' },
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }

    // Walidacja formatu UUID dla songId
    if (!isValidUUID(songId)) {
        logger.warn('Invalid UUID format for song ID', {
            songId,
            userId: user.id,
        });

        return new Response(
            JSON.stringify({
                error: {
                    code: 'validation_error',
                    message: 'Nieprawidłowy format identyfikatora piosenki',
                    details: { songId: 'Must be a valid UUID' },
                },
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }

    logger.info('Handling GET /me/biesiada/repertoires/{id}/songs/{songId}', {
        userId: user.id,
        repertoireId,
        songId,
    });

    try {
        // Wywołanie warstwy serwisu
        const songDetails = await getBiesiadaRepertoireSongDetails(supabase, {
            repertoireId,
            songId,
            userId: user.id,
        });

        // Jeśli serwis zwrócił null, oznacza to że nie znaleziono zasobu
        if (!songDetails) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'resource_not_found',
                        message: 'Nie znaleziono piosenki w repertuarze lub nie masz do niej uprawnień',
                    },
                }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        return jsonResponse<BiesiadaRepertoireSongDetailDto>(songDetails, {
            headers: {
                // Biesiada mode - krótki cache dla lepszej wydajności
                'Cache-Control': 'private, max-age=30',
            },
        });
    } catch (error) {
        // ApplicationError jest rzucany przez serwis w przypadku błędów wewnętrznych
        if (error instanceof ApplicationError) {
            return new Response(
                JSON.stringify({
                    error: {
                        code: error.code,
                        message: error.message,
                    },
                }),
                {
                    status: error.status,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Inne błędy propagujemy dalej
        throw error;
    }
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

    // GET /me/biesiada/repertoires/{id}/songs/{songId}
    // Sprawdzamy NAJPIERW najdłuższą, najbardziej specyficzną ścieżkę
    const repertoireSongDetailMatch = path.match(/\/biesiada\/repertoires\/([^/]+)\/songs\/([^/]+)$/);
    if (repertoireSongDetailMatch && request.method === 'GET') {
        const repertoireId = repertoireSongDetailMatch[1];
        const songId = repertoireSongDetailMatch[2];
        return await handleGetBiesiadaRepertoireSong(request, supabase, user, repertoireId, songId);
    }

    // GET /me/biesiada/repertoires/{id}/songs
    // Następnie sprawdzamy krótszą ścieżkę
    const repertoireSongsMatch = path.match(/\/biesiada\/repertoires\/([^/]+)\/songs$/);
    if (repertoireSongsMatch && request.method === 'GET') {
        const repertoireId = repertoireSongsMatch[1];
        return await handleGetBiesiadaRepertoireSongs(request, supabase, user, repertoireId);
    }

    // GET /me/biesiada/repertoires
    if (path.endsWith('/biesiada/repertoires') && request.method === 'GET') {
        return await handleGetBiesiadaRepertoires(request, supabase, user);
    }

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

