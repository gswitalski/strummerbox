import { z } from 'npm:zod';
import type { ResendConfirmationCommand } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import { resendConfirmationEmail } from './resend-confirmation.service.ts';

/**
 * Schemat walidacji dla żądania ponownego wysłania emaila potwierdzającego.
 */
const resendConfirmationSchema = z
    .object({
        email: z
            .string({ required_error: 'Adres email jest wymagany' })
            .email('Podaj prawidłowy adres email'),
    })
    .strict();

/**
 * Generyczna wiadomość zwracana niezależnie od stanu konta.
 * WAŻNE: Ta sama wiadomość jest zwracana zawsze, aby chronić przed enumeracją użytkowników.
 */
const GENERIC_SUCCESS_MESSAGE =
    'If an account with this email exists and is not yet confirmed, a new confirmation link has been sent.';

/**
 * Wczytuje i waliduje ciało żądania ponownego wysłania emaila potwierdzającego.
 */
const parseRequestBody = async (request: Request): Promise<ResendConfirmationCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu ponownego wysłania emaila', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = resendConfirmationSchema.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania ponownego wysłania emaila', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return {
        email: result.data.email,
    };
};

/**
 * Obsługuje żądanie ponownego wysłania emaila potwierdzającego.
 * 
 * WAŻNE: Zawsze zwraca 200 OK z generyczną wiadomością, niezależnie od tego:
 * - Czy użytkownik istnieje
 * - Czy konto jest już potwierdzone
 * - Czy wystąpił błąd podczas wysyłania emaila
 * 
 * Jest to celowe zachowanie zapobiegające enumeracji użytkowników.
 */
export const handleResendConfirmation = async (request: Request): Promise<Response> => {
    const command = await parseRequestBody(request);

    // Wywołanie serwisu nie rzuca wyjątków - zawsze kończy się sukcesem z perspektywy handlera
    await resendConfirmationEmail(command);

    // Zawsze zwracamy generyczną wiadomość sukcesu
    return jsonResponse(
        { message: GENERIC_SUCCESS_MESSAGE },
        { status: 200 }
    );
};

/**
 * Router POST /resend-confirmation. Zapewnia zgodność metod i logowanie operacji.
 */
export const resendConfirmationRouter = async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
        return new Response(null, {
            status: 405,
            headers: { Allow: 'POST' },
        });
    }

    logger.info('Obsługa żądania ponownego wysłania emaila potwierdzającego');

    return await handleResendConfirmation(request);
};

