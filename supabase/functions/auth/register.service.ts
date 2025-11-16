import type {
    OrganizerProfileDto,
    OrganizerRegisterCommand,
} from '../../../packages/contracts/types.ts';
import {
    createConflictError,
    createInternalError,
} from '../_shared/errors.ts';
import {
    createSupabaseServiceRoleClient,
    type ServiceRoleSupabaseClient,
} from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

const PROFILE_COLUMNS = 'id, display_name, created_at, updated_at';

type RegisterOrganizerParams = OrganizerRegisterCommand;

/**
 * Usuwa świeżo utworzonego użytkownika w Supabase Auth w razie błędu tworzenia profilu.
 * Zgodnie z planem zapewnia to atomowość operacji rejestracji.
 */
const rollbackUserCreation = async (
    client: ServiceRoleSupabaseClient,
    userId: string,
): Promise<void> => {
    const { error } = await client.auth.admin.deleteUser(userId);

    if (error) {
        logger.error('Nie udało się wycofać nowo utworzonego użytkownika', {
            userId,
            error,
        });
        return;
    }

    logger.warn('Wycofano nowo utworzonego użytkownika po błędzie profilu', {
        userId,
    });
};

/**
 * Rejestruje nowego organizatora tworząc konto w Supabase Auth oraz odpowiadający profil.
 * W przypadku niepowodzenia drugiego kroku próbuje wycofać utworzone konto użytkownika.
 * 
 * WAŻNE: Konto użytkownika pozostaje nieaktywne do momentu potwierdzenia adresu email
 * poprzez kliknięcie w link wysłany automatycznie przez Supabase Auth.
 */
export const registerOrganizer = async (
    params: RegisterOrganizerParams,
): Promise<OrganizerProfileDto> => {
    const { email, password, displayName } = params;
    const trimmedDisplayName = displayName.trim();

    logger.info('Rejestracja nowego organizatora', { email });

    const supabase = createSupabaseServiceRoleClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: trimmedDisplayName,
            },
        },
    });

    if (signUpError) {
        logger.warn('Nie udało się utworzyć konta w Supabase Auth', {
            email,
            error: signUpError,
        });

        const errorMessage = signUpError.message ?? 'Nie udało się utworzyć konta użytkownika';

        if (
            signUpError.status === 400 ||
            errorMessage.toLowerCase().includes('already registered')
        ) {
            throw createConflictError('Użytkownik o podanym adresie email już istnieje', {
                email,
            });
        }

        throw createInternalError('Nie udało się utworzyć konta użytkownika', signUpError);
    }

    const user = signUpData?.user;

    if (!user) {
        logger.error('Supabase Auth zwrócił pustego użytkownika po rejestracji', {
            email,
        });
        throw createInternalError('Nie udało się pobrać danych utworzonego użytkownika');
    }

    const userId = user.id;

    // Supabase Auth automatycznie wysyła email weryfikacyjny na podany adres.
    // Konto pozostaje nieaktywne do momentu kliknięcia w link weryfikacyjny przez użytkownika.
    logger.info('Utworzono konto użytkownika - oczekiwanie na weryfikację email', { 
        userId,
        email 
    });

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            display_name: trimmedDisplayName,
        })
        .select(PROFILE_COLUMNS)
        .single();

    if (profileError) {
        logger.error('Nie udało się utworzyć profilu organizatora', {
            userId,
            error: profileError,
        });

        await rollbackUserCreation(supabase, userId);

        throw createInternalError('Nie udało się utworzyć profilu organizatora', profileError);
    }

    logger.info('Pomyślnie zarejestrowano organizatora', {
        userId,
    });

    return {
        id: profileData.id,
        email,
        displayName: profileData.display_name,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
    };
};

