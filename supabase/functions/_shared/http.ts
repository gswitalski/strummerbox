import { ApplicationError, createInternalError, isApplicationError } from './errors.ts';
import { logger } from './logger.ts';

type ErrorResponseBody = {
    error: {
        code: string;
        message: string;
        details: unknown;
    };
};

const DEFAULT_ALLOWED_HEADERS = [
    'authorization',
    'apikey',
    'content-type',
    'x-client-info',
    'cache-control',
    'pragma',
    'expires',
    'if-none-match',
];

const buildAllowHeadersValue = (request?: Request): string => {
    const headers = new Set<string>(DEFAULT_ALLOWED_HEADERS);
    const requestedHeaders = request?.headers.get('Access-Control-Request-Headers');

    if (requestedHeaders) {
        requestedHeaders
            .split(',')
            .map((header) => header.trim())
            .filter((header) => header.length > 0)
            .forEach((header) => headers.add(header.toLowerCase()));
    }

    return Array.from(headers).join(', ');
};

const buildCorsHeaders = (request?: Request): Record<string, string> => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': buildAllowHeadersValue(request),
});

export const handleCorsPreFlight = (request?: Request): Response => {
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request),
    });
};

export const jsonResponse = <T>(body: T, init?: ResponseInit, request?: Request): Response => {
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            ...buildCorsHeaders(request),
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

