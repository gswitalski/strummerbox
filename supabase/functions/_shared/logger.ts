type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const buildPayload = (level: LogLevel, message: string, context?: LogContext) => ({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
});

export const logger = {
    debug(message: string, context?: LogContext) {
        console.debug(buildPayload('debug', message, context));
    },
    info(message: string, context?: LogContext) {
        console.info(buildPayload('info', message, context));
    },
    warn(message: string, context?: LogContext) {
        console.warn(buildPayload('warn', message, context));
    },
    error(message: string, context?: LogContext) {
        console.error(buildPayload('error', message, context));
    },
};

