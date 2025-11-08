import { ApplicationError, createInternalError, isApplicationError } from './errors.ts';
import { logger } from './logger.ts';

type ErrorResponseBody = {
    error: {
        code: string;
        message: string;
        details: unknown;
    };
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handleCorsPreFlight = (): Response => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
};

export const jsonResponse = <T>(body: T, init?: ResponseInit): Response => {
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...init?.headers,
        },
        status: init?.status ?? 200,
        statusText: init?.statusText,
    });
};

export const buildErrorResponse = (error: ApplicationError): Response => {
    const body: ErrorResponseBody = {
        error: {
            code: error.code,
            message: error.message,
            details: error.details ?? null,
        },
    };

    return jsonResponse(body, { status: error.status });
};

export const withErrorHandling = <T>(
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
): (() => Promise<T>) => {
    return async () => {
        try {
            return await fn();
        } catch (error) {
            if (isApplicationError(error)) {
                logger.warn('Handled application error', { ...context, code: error.code, details: error.details });
                throw error;
            }

            logger.error('Unhandled error', { ...context, error });
            throw createInternalError('Wystąpił nieoczekiwany błąd serwera', error);
        }
    };
};

