import type { ResendConfirmationCommand } from '../../../packages/contracts/types.ts';
import { createSupabaseServiceRoleClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

type ResendConfirmationParams = ResendConfirmationCommand;

/**
 * Wysyła ponownie email potwierdzający dla podanego adresu email.
 * 
 * WAŻNE: Funkcja celowo nie rzuca błędów i nie zwraca statusu operacji.
 * Jest to mechanizm ochrony przed enumeracją użytkowników - API zawsze zwraca
 * sukces, niezależnie od tego czy użytkownik istnieje, jest już potwierdzony, itp.
 * 
 * Supabase Auth wewnętrznie obsługuje całą logikę:
 * - Sprawdza czy użytkownik o danym emailu istnieje
 * - Sprawdza czy konto jest już potwierdzone
 * - Wysyła email tylko jeśli konto istnieje i nie jest potwierdzone
 */
export const resendConfirmationEmail = async (
    params: ResendConfirmationParams,
): Promise<void> => {
    const { email } = params;

    logger.info('Żądanie ponownego wysłania emaila potwierdzającego', { email });

    const supabase = createSupabaseServiceRoleClient();

    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) {
            // Logujemy błąd, ale nie rzucamy wyjątku - celowo ukrywamy status operacji
            logger.warn('Błąd podczas próby ponownego wysłania emaila potwierdzającego', {
                email,
                error,
            });
            return;
        }

        logger.info('Pomyślnie wywołano resend dla emaila potwierdzającego', { email });
    } catch (error) {
        // Logujemy nieoczekiwany błąd, ale nie rzucamy wyjątku
        logger.error('Nieoczekiwany błąd podczas ponownego wysyłania emaila potwierdzającego', {
            email,
            error,
        });
    }
};

