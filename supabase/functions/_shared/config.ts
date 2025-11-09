import { createInternalError } from './errors.ts';
import { logger } from './logger.ts';

/**
 * Pobiera i waliduje zmienną środowiskową APP_PUBLIC_URL.
 *
 * @returns Wartość zmiennej APP_PUBLIC_URL.
 * @throws {ApplicationError} Jeśli zmienna nie jest ustawiona.
 */
export const getAppPublicUrl = (): string => {
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL');

    if (!appPublicUrl) {
        const errorMessage =
            'Błąd konfiguracji serwera: Zmienna środowiskowa APP_PUBLIC_URL nie jest ustawiona. Skonfiguruj ją w ustawieniach Supabase.';
        logger.error(errorMessage);
        throw createInternalError(errorMessage);
    }

    return appPublicUrl;
};
