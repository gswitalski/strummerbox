import type { ErrorCode } from '../../../packages/contracts/types.ts';

export type ApplicationErrorParams = {
    code: ErrorCode;
    message: string;
    status: number;
    cause?: unknown;
    details?: unknown;
};

export class ApplicationError extends Error {
    readonly code: ErrorCode;

    readonly status: number;

    readonly details?: unknown;

    constructor({ code, message, status, cause, details }: ApplicationErrorParams) {
        super(message);
        this.name = 'ApplicationError';
        this.code = code;
        this.status = status;
        this.details = details;
        this.cause = cause;
    }
}

export const createNotFoundError = (message: string, details?: unknown): ApplicationError => {
    return new ApplicationError({
        code: 'resource_not_found',
        status: 404,
        message,
        details,
    });
};

export const createValidationError = (message: string, details?: unknown): ApplicationError => {
    return new ApplicationError({
        code: 'validation_error',
        status: 400,
        message,
        details,
    });
};

export const createUnauthorizedError = (message: string): ApplicationError => {
    return new ApplicationError({
        code: 'unauthorized',
        status: 401,
        message,
    });
};

export const createConflictError = (message: string, details?: unknown): ApplicationError => {
    return new ApplicationError({
        code: 'conflict',
        status: 409,
        message,
        details,
    });
};

export const createInternalError = (message: string, cause?: unknown): ApplicationError => {
    return new ApplicationError({
        code: 'internal_error',
        status: 500,
        message,
        cause,
    });
};

export const isApplicationError = (error: unknown): error is ApplicationError => {
    return error instanceof ApplicationError;
};

