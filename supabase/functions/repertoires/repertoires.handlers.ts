import { z } from 'zod';
import type { RepertoireCreateCommand, RepertoireDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { createRepertoire } from './repertoires.service.ts';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Maksymalna liczba piosenek, które można dodać podczas tworzenia repertuaru.
 */
const MAX_SONGS_PER_REQUEST = 100;

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

// ============================================================================
// Handlers
// ============================================================================

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
 * Obecnie obsługuje tylko POST / dla utworzenia repertuaru.
 */
export const repertoiresRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response> => {
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

