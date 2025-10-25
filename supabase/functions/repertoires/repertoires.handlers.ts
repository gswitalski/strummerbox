import { z } from 'zod';
import type { RepertoireAddSongsCommand, RepertoireAddSongsResponseDto, RepertoireCreateCommand, RepertoireDto, RepertoireListResponseDto, RepertoireRemoveSongResponseDto, RepertoireUpdateCommand } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { addSongsToRepertoire, createRepertoire, getRepertoireById, listRepertoires, removeSongFromRepertoire, updateRepertoire } from './repertoires.service.ts';

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
 * Maksymalna liczba piosenek, które można dodać do repertuaru w jednym żądaniu.
 */
const MAX_SONGS_TO_ADD = 100;

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

/**
 * Schema Zod dla parametru path `id` w GET /repertoires/{id}.
 * Waliduje:
 * - id: UUID (wymagany)
 */
const GET_BY_ID_PATH_SCHEMA = z.object({
    id: z.string().uuid('Nieprawidłowy identyfikator repertuaru'),
});

/**
 * Schema Zod dla parametrów query GET /repertoires/{id}.
 * Waliduje:
 * - includeSongContent: opcjonalna flaga włączania treści piosenek (boolean)
 */
const GET_BY_ID_QUERY_SCHEMA = z.object({
    includeSongContent: z
        .string()
        .optional()
        .transform(val => val === 'true')
        .pipe(z.boolean())
        .catch(false),
});

/**
 * Schema Zod dla komendy aktualizacji repertuaru (PATCH).
 * Waliduje:
 * - name: opcjonalny string 1-160 znaków
 * - description: opcjonalny string
 * Co najmniej jedno pole musi być podane.
 */
const PATCH_COMMAND_SCHEMA = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Nazwa repertuaru nie może być pusta')
            .max(160, 'Nazwa może mieć maksymalnie 160 znaków')
            .optional(),
        description: z
            .string()
            .trim()
            .optional(),
    })
    .strict()
    .refine(
        data => data.name !== undefined || data.description !== undefined,
        {
            message: 'Co najmniej jedno pole (name lub description) musi być podane',
        }
    );

/**
 * Schema Zod dla komendy dodawania piosenek do repertuaru.
 * Waliduje:
 * - songIds: wymagana niepusta tablica UUID (max 100 elementów)
 */
const ADD_SONGS_COMMAND_SCHEMA = z
    .object({
        songIds: z
            .array(z.string().uuid('Nieprawidłowy identyfikator piosenki'))
            .min(1, 'Musisz dodać przynajmniej jedną piosenkę')
            .max(MAX_SONGS_TO_ADD, `Można dodać maksymalnie ${MAX_SONGS_TO_ADD} piosenek jednocześnie`),
    })
    .strict();

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
 * Parsuje i waliduje ciało żądania PATCH dla aktualizacji repertuaru.
 * @throws {ApplicationError} z kodem validation_error jeśli dane są nieprawidłowe
 */
const parsePatchRequestBody = async (request: Request): Promise<RepertoireUpdateCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu aktualizacji repertuaru', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = PATCH_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania aktualizacji repertuaru', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

/**
 * Parsuje i waliduje ciało żądania POST dla dodawania piosenek do repertuaru.
 * @throws {ApplicationError} z kodem validation_error jeśli dane są nieprawidłowe
 */
const parseAddSongsRequestBody = async (request: Request): Promise<RepertoireAddSongsCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu dodania piosenek do repertuaru', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = ADD_SONGS_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania dodania piosenek do repertuaru', {
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

/**
 * Typ dla zwalidowanych parametrów GET /repertoires/{id}.
 */
export type GetRepertoireByIdParams = {
    id: string;
    includeSongContent: boolean;
};

/**
 * Parsuje i waliduje parametry path oraz query dla GET /repertoires/{id}.
 * @throws {ApplicationError} z kodem validation_error jeśli parametry są nieprawidłowe
 */
const parseGetByIdParams = (pathId: string, url: URL): GetRepertoireByIdParams => {
    // Walidacja parametru path
    const pathResult = GET_BY_ID_PATH_SCHEMA.safeParse({ id: pathId });

    if (!pathResult.success) {
        logger.warn('Błędy walidacji parametru path dla GET /repertoires/{id}', {
            issues: pathResult.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator repertuaru', pathResult.error.format());
    }

    // Walidacja parametrów query
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryResult = GET_BY_ID_QUERY_SCHEMA.safeParse(queryParams);

    if (!queryResult.success) {
        logger.warn('Błędy walidacji parametrów query dla GET /repertoires/{id}', {
            issues: queryResult.error.issues,
        });

        throw createValidationError('Nieprawidłowe parametry zapytania', queryResult.error.format());
    }

    return {
        id: pathResult.data.id,
        includeSongContent: queryResult.data.includeSongContent,
    };
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

/**
 * Handler dla GET /repertoires/{id} - pobranie szczegółów repertuaru.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja parametru path `id` i parametru query `includeSongContent`
 * 3. Wywołanie serwisu getRepertoireById
 * 4. Zwrócenie odpowiedzi 200 OK z RepertoireDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji parametrów
 * @throws {ApplicationError} 404 - repertuar nie istnieje lub nie należy do użytkownika
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handleGetRepertoireById = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
): Promise<Response> => {
    const url = new URL(request.url);

    logger.info('Rozpoczęcie pobierania repertuaru po ID', {
        organizerId: user.id,
        repertoireId,
    });

    const params = parseGetByIdParams(repertoireId, url);

    const repertoire = await getRepertoireById({
        supabase,
        repertoireId: params.id,
        organizerId: user.id,
        includeContent: params.includeSongContent,
    });

    logger.info('Repertuar pobrany pomyślnie', {
        organizerId: user.id,
        repertoireId: repertoire.id,
        name: repertoire.name,
        songCount: repertoire.songs?.length ?? 0,
    });

    return jsonResponse<RepertoireDto>(repertoire, { status: 200 });
};

/**
 * Handler dla PATCH /repertoires/{id} - częściowa aktualizacja metadanych repertuaru.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja parametru path `id` (musi być UUID)
 * 3. Walidacja ciała żądania za pomocą PATCH_COMMAND_SCHEMA
 * 4. Wywołanie serwisu updateRepertoire
 * 5. Zwrócenie odpowiedzi 200 OK z zaktualizowanym RepertoireDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji (nieprawidłowy UUID lub dane)
 * @throws {ApplicationError} 404 - repertuar nie istnieje lub nie należy do użytkownika
 * @throws {ApplicationError} 409 - konflikt nazwy (inna piosenka już używa tej nazwy)
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handleUpdateRepertoire = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
): Promise<Response> => {
    logger.info('Rozpoczęcie aktualizacji repertuaru', {
        organizerId: user.id,
        repertoireId,
    });

    // Walidacja parametru path (UUID)
    const pathResult = GET_BY_ID_PATH_SCHEMA.safeParse({ id: repertoireId });

    if (!pathResult.success) {
        logger.warn('Błędy walidacji parametru path dla PATCH /repertoires/{id}', {
            issues: pathResult.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator repertuaru', pathResult.error.format());
    }

    const validatedId = pathResult.data.id;

    // Walidacja ciała żądania
    const command = await parsePatchRequestBody(request);

    // Wywołanie serwisu
    const updatedRepertoire = await updateRepertoire({
        supabase,
        repertoireId: validatedId,
        organizerId: user.id,
        command,
    });

    logger.info('Repertuar zaktualizowany pomyślnie', {
        organizerId: user.id,
        repertoireId: updatedRepertoire.id,
        name: updatedRepertoire.name,
    });

    return jsonResponse<RepertoireDto>(updatedRepertoire, { status: 200 });
};

/**
 * Handler dla POST /repertoires/{id}/songs - dodawanie piosenek do repertuaru.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja parametru path `id` (musi być UUID)
 * 3. Walidacja ciała żądania za pomocą ADD_SONGS_COMMAND_SCHEMA
 * 4. Wywołanie serwisu addSongsToRepertoire
 * 5. Zwrócenie odpowiedzi 201 Created z RepertoireAddSongsResponseDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji (nieprawidłowy UUID lub dane)
 * @throws {ApplicationError} 404 - repertuar lub piosenka nie istnieje lub nie należy do użytkownika
 * @throws {ApplicationError} 409 - piosenka już jest w repertuarze
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handleAddSongsToRepertoire = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
): Promise<Response> => {
    logger.info('Rozpoczęcie dodawania piosenek do repertuaru', {
        organizerId: user.id,
        repertoireId,
    });

    // Walidacja parametru path (UUID)
    const pathResult = GET_BY_ID_PATH_SCHEMA.safeParse({ id: repertoireId });

    if (!pathResult.success) {
        logger.warn('Błędy walidacji parametru path dla POST /repertoires/{id}/songs', {
            issues: pathResult.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator repertuaru', pathResult.error.format());
    }

    const validatedId = pathResult.data.id;

    // Walidacja ciała żądania
    const command = await parseAddSongsRequestBody(request);

    // Wywołanie serwisu
    const response = await addSongsToRepertoire({
        supabase,
        repertoireId: validatedId,
        organizerId: user.id,
        songIds: command.songIds,
    });

    logger.info('Piosenki dodane do repertuaru pomyślnie', {
        organizerId: user.id,
        repertoireId: response.repertoireId,
        addedCount: response.added.length,
    });

    return jsonResponse<RepertoireAddSongsResponseDto>(response, { status: 201 });
};

/**
 * Handler dla DELETE /repertoires/{id}/songs/{repertoireSongId} - usunięcie piosenki z repertuaru.
 *
 * Przepływ:
 * 1. Uwierzytelnienie użytkownika (requireAuth w router)
 * 2. Walidacja parametrów path `repertoireId` i `repertoireSongId` (muszą być UUID)
 * 3. Wywołanie serwisu removeSongFromRepertoire
 * 4. Zwrócenie odpowiedzi 200 OK z RepertoireRemoveSongResponseDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji (nieprawidłowy UUID)
 * @throws {ApplicationError} 403 - brak uprawnień do repertuaru
 * @throws {ApplicationError} 404 - repertuar lub piosenka nie istnieje
 * @throws {ApplicationError} 500 - błąd serwera
 */
export const handleRemoveSongFromRepertoire = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    repertoireId: string,
    repertoireSongId: string,
): Promise<Response> => {
    logger.info('Rozpoczęcie usuwania piosenki z repertuaru', {
        organizerId: user.id,
        repertoireId,
        repertoireSongId,
    });

    // Walidacja parametrów path (UUID)
    const repertoireIdSchema = z.string().uuid('Nieprawidłowy identyfikator repertuaru');
    const repertoireSongIdSchema = z.string().uuid('Nieprawidłowy identyfikator piosenki w repertuarze');

    const repertoireIdResult = repertoireIdSchema.safeParse(repertoireId);
    if (!repertoireIdResult.success) {
        logger.warn('Błędy walidacji parametru repertoireId dla DELETE /repertoires/{id}/songs/{repertoireSongId}', {
            issues: repertoireIdResult.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator repertuaru', repertoireIdResult.error.format());
    }

    const repertoireSongIdResult = repertoireSongIdSchema.safeParse(repertoireSongId);
    if (!repertoireSongIdResult.success) {
        logger.warn('Błędy walidacji parametru repertoireSongId dla DELETE /repertoires/{id}/songs/{repertoireSongId}', {
            issues: repertoireSongIdResult.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator piosenki w repertuarze', repertoireSongIdResult.error.format());
    }

    const validatedRepertoireId = repertoireIdResult.data;
    const validatedRepertoireSongId = repertoireSongIdResult.data;

    // Wywołanie serwisu
    const response = await removeSongFromRepertoire({
        supabase,
        repertoireId: validatedRepertoireId,
        repertoireSongId: validatedRepertoireSongId,
        organizerId: user.id,
    });

    logger.info('Piosenka usunięta z repertuaru pomyślnie', {
        organizerId: user.id,
        repertoireId: response.repertoireId,
        removedRepertoireSongId: response.removed,
        positionsRebuilt: response.positionsRebuilt,
    });

    return jsonResponse<RepertoireRemoveSongResponseDto>(response, { status: 200 });
};

// ============================================================================
// Router
// ============================================================================

/**
 * Router dla endpointów repertuarów.
 * Obsługuje:
 * - GET /repertoires - pobranie paginowanej listy repertuarów
 * - POST /repertoires - utworzenie nowego repertuaru
 * - GET /repertoires/{id} - pobranie szczegółów repertuaru
 * - PATCH /repertoires/{id} - częściowa aktualizacja repertuaru
 * - POST /repertoires/{id}/songs - dodawanie piosenek do repertuaru
 * - DELETE /repertoires/{id}/songs/{repertoireSongId} - usunięcie piosenki z repertuaru
 */
export const repertoiresRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response> => {
    // DELETE /repertoires/{id}/songs/{repertoireSongId} - usunięcie piosenki z repertuaru (sprawdzamy najpierw najdłuższe ścieżki)
    const removeSongMatch = path.match(/^\/repertoires\/([^/]+)\/songs\/([^/]+)$/);

    if (removeSongMatch) {
        const repertoireId = removeSongMatch[1];
        const repertoireSongId = removeSongMatch[2];

        if (request.method === 'DELETE') {
            return await handleRemoveSongFromRepertoire(request, supabase, user, repertoireId, repertoireSongId);
        }
    }

    // POST /repertoires/{id}/songs - dodawanie piosenek do repertuaru
    const addSongsMatch = path.match(/^\/repertoires\/([^/]+)\/songs$/);

    if (addSongsMatch) {
        const repertoireId = addSongsMatch[1];

        if (request.method === 'POST') {
            return await handleAddSongsToRepertoire(request, supabase, user, repertoireId);
        }
    }

    // GET /repertoires/{id} - pobranie szczegółów repertuaru (musi być przed GET /repertoires)
    const repertoireIdMatch = path.match(/^\/repertoires\/([^/]+)$/);

    if (repertoireIdMatch) {
        const repertoireId = repertoireIdMatch[1];

        if (request.method === 'GET') {
            return await handleGetRepertoireById(request, supabase, user, repertoireId);
        }

        if (request.method === 'PATCH') {
            return await handleUpdateRepertoire(request, supabase, user, repertoireId);
        }
    }

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

