import { z } from 'zod';
import type { RepertoireCreateCommand, RepertoireDto, RepertoireListResponseDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { createRepertoire, listRepertoires } from './repertoires.service.ts';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Maksymalna liczba piosenek, które można dodać podczas tworzenia repertuaru.
 */
const MAX_SONGS_PER_REQUEST = 100;

/**
 * Maksymalny rozmiar strony dla paginacji.
 */
const MAX_PAGE_SIZE = 100;

/**
 * Dozwolone klucze sortowania dla GET /repertoires.
 */
const ALLOWED_SORT_KEYS = ['name', 'createdAt', 'updatedAt', 'publishedAt'] as const;

/**
 * Schema Zod dla komendy utworzenia repertuaru.
 * Waliduje:
 * - name: wymagany string 1-160 znaków
 * - description: opcjonalny string
 * - songIds: opcjonalna tablica UUID (max 100 elementów)
 */
const POST_COMMAND_SCHEMA = z
    .object({
        name: z
            .string({ required_error: 'Nazwa repertuaru jest wymagana' })
            .trim()
            .min(1, 'Nazwa repertuaru jest wymagana')
            .max(160, 'Nazwa może mieć maksymalnie 160 znaków'),
        description: z
            .string()
            .trim()
            .optional(),
        songIds: z
            .array(z.string().uuid('Nieprawidłowy identyfikator piosenki'))
            .max(MAX_SONGS_PER_REQUEST, `Można dodać maksymalnie ${MAX_SONGS_PER_REQUEST} piosenek jednocześnie`)
            .optional(),
    })
    .strict();

/**
 * Schema Zod dla parametrów query GET /repertoires.
 * Waliduje:
 * - page: opcjonalny numer strony (min: 1, domyślnie: 1)
 * - pageSize: opcjonalny rozmiar strony (min: 1, max: 100, domyślnie: 10)
 * - search: opcjonalna fraza do wyszukiwania w nazwach
 * - published: opcjonalny filtr statusu publikacji (boolean)
 * - sort: opcjonalny klucz sortowania z opcjonalnym prefiksem "-" dla malejącego
 * - includeCounts: opcjonalna flaga włączania zliczania piosenek (boolean)
 */
const GET_QUERY_SCHEMA = z.object({
    page: z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 1))
        .pipe(z.number().int().min(1, 'Numer strony musi być większy od 0'))
        .catch(1),
    pageSize: z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 10))
        .pipe(z.number().int().min(1, 'Rozmiar strony musi być większy od 0').max(MAX_PAGE_SIZE, `Rozmiar strony nie może przekraczać ${MAX_PAGE_SIZE}`))
        .catch(10),
    search: z
        .string()
        .trim()
        .optional(),
    published: z
        .string()
        .optional()
        .transform(val => {
            if (val === undefined || val === '') return undefined;
            return val === 'true';
        })
        .pipe(z.boolean().optional()),
    sort: z
        .string()
        .optional()
        .refine(
            val => {
                if (!val) return true;
                const key = val.startsWith('-') ? val.slice(1) : val;
                return ALLOWED_SORT_KEYS.includes(key as typeof ALLOWED_SORT_KEYS[number]);
            },
            {
                message: `Sortowanie musi być jedną z wartości: ${ALLOWED_SORT_KEYS.join(', ')} (opcjonalnie z prefiksem "-" dla malejącego)`,
            }
        ),
    includeCounts: z
        .string()
        .optional()
        .transform(val => val === 'true')
        .pipe(z.boolean())
        .catch(false),
});

// ============================================================================
// Request Body Parsers
// ============================================================================

/**
 * Parsuje i waliduje ciało żądania POST dla utworzenia repertuaru.
 * @throws {ApplicationError} z kodem validation_error jeśli dane są nieprawidłowe
 */
const parsePostRequestBody = async (request: Request): Promise<RepertoireCreateCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu utworzenia repertuaru', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = POST_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania utworzenia repertuaru', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

/**
 * Typ dla zwalidowanych parametrów query GET /repertoires.
 */
export type GetRepertoiresQueryParams = {
    page: number;
    pageSize: number;
    search?: string;
    published?: boolean;
    sort?: string;
    includeCounts: boolean;
};

/**
 * Parsuje i waliduje parametry query dla GET /repertoires.
 * @throws {ApplicationError} z kodem validation_error jeśli parametry są nieprawidłowe
 */
const parseGetQueryParams = (url: URL): GetRepertoiresQueryParams => {
    const params = Object.fromEntries(url.searchParams.entries());

    const result = GET_QUERY_SCHEMA.safeParse(params);

    if (!result.success) {
        logger.warn('Błędy walidacji parametrów query dla GET /repertoires', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe parametry zapytania', result.error.format());
    }

    return result.data as GetRepertoiresQueryParams;
};

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handler dla GET /repertoires - pobranie paginowanej listy repertuarów.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja parametrów query
 * 3. Wywołanie serwisu listRepertoires
 * 4. Zwrócenie odpowiedzi 200 OK z RepertoireListResponseDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji parametrów
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handleGetRepertoires = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const url = new URL(request.url);

    logger.info('Rozpoczęcie pobierania listy repertuarów', {
        organizerId: user.id,
        queryParams: Object.fromEntries(url.searchParams.entries()),
    });

    const params = parseGetQueryParams(url);

    const response = await listRepertoires({
        supabase,
        organizerId: user.id,
        params,
    });

    logger.info('Lista repertuarów pobrana pomyślnie', {
        organizerId: user.id,
        count: response.items.length,
        total: response.total,
        page: response.page,
    });

    return jsonResponse<RepertoireListResponseDto>(response, { status: 200 });
};

/**
 * Handler dla POST /repertoires - utworzenie nowego repertuaru.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja ciała żądania
 * 3. Wywołanie serwisu createRepertoire
 * 4. Zwrócenie odpowiedzi 201 Created z RepertoireDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji
 * @throws {ApplicationError} 409 - konflikt nazwy
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handlePostRepertoire = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    logger.info('Rozpoczęcie tworzenia repertuaru', { organizerId: user.id });

    const command = await parsePostRequestBody(request);

    const repertoire = await createRepertoire({
        supabase,
        organizerId: user.id,
        command,
    });

    logger.info('Repertuar utworzony pomyślnie', {
        organizerId: user.id,
        repertoireId: repertoire.id,
        name: repertoire.name,
        songCount: repertoire.songs?.length ?? 0,
    });

    return jsonResponse<RepertoireDto>(repertoire, { status: 201 });
};

// ============================================================================
// Router
// ============================================================================

/**
 * Router dla endpointów repertuarów.
 * Obsługuje:
 * - GET /repertoires - pobranie paginowanej listy repertuarów
 * - POST /repertoires - utworzenie nowego repertuaru
 */
export const repertoiresRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response> => {
    // GET /repertoires - pobranie listy repertuarów
    if (path === '/repertoires' && request.method === 'GET') {
        return await handleGetRepertoires(request, supabase, user);
    }

    // POST /repertoires - utworzenie nowego repertuaru
    if (path === '/repertoires' && request.method === 'POST') {
        return await handlePostRepertoire(request, supabase, user);
    }

    // Nieobsłużona kombinacja metody/ścieżki
    logger.warn('Nieobsłużona ścieżka/metoda w repertoires router', { path, method: request.method });
    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
    });
};

