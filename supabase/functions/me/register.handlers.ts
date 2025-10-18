import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import type { OrganizerRegisterCommand } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import { registerOrganizer } from './register.service.ts';

/**
 * Schemat wymuszający poprawny format danych rejestracji.
 */
const registerSchema = z
    .object({
        email: z
            .string({ required_error: 'Adres email jest wymagany' })
            .email('Podaj prawidłowy adres email'),
        password: z
            .string({ required_error: 'Hasło jest wymagane' })
            .min(8, 'Hasło powinno zawierać co najmniej 8 znaków')
            .max(256, 'Hasło jest zbyt długie'),
        displayName: z
            .string({ required_error: 'Nazwa wyświetlana jest wymagana' })
            .trim()
            .min(1, 'Nazwa wyświetlana nie może być pusta')
            .max(120, 'Nazwa wyświetlana może mieć maksymalnie 120 znaków'),
    })
    .strict();

/**
 * Wczytuje i waliduje ciało żądania rejestracji.
 */
const parseRequestBody = async (request: Request): Promise<OrganizerRegisterCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu rejestracji organizatora', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = registerSchema.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania rejestracji organizatora', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return {
        email: result.data.email,
        password: result.data.password,
        displayName: result.data.displayName,
    };
};

/**
 * Obsługuje żądanie rejestracji, zwracając DTO profilu w formacie API.
 */
export const handleRegister = async (request: Request): Promise<Response> => {
    const command = await parseRequestBody(request);

    const profile = await registerOrganizer(command);

    return jsonResponse({ data: profile }, { status: 201 });
};

/**
 * Router POST /register. Zapewnia zgodność metod i logowanie operacji.
 */
export const registerRouter = async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
        return new Response(null, {
            status: 405,
            headers: { Allow: 'POST' },
        });
    }

    logger.info('Obsługa żądania rejestracji organizatora');

    return await handleRegister(request);
};


