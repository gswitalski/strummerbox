import type { RepertoireShareMetaDto } from '../../../packages/contracts/types.ts';
import { createInternalError, createNotFoundError } from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

/**
 * Kolumny pobierane do generowania metadanych udostępniania repertuaru
 */
const REPERTOIRE_SHARE_COLUMNS = 'id, public_id';

/**
 * Parametry dla funkcji pobierającej metadane udostępniania repertuaru
 */
export type GetRepertoireShareMetaParams = {
    supabase: RequestSupabaseClient;
    repertoireId: string;
    organizerId: string;
};

/**
 * Pobiera metadane do udostępniania konkretnego repertuaru.
 * Zwraca publicUrl i qrPayload dla repertuaru należącego do danego organizatora.
 * Rzuca NotFoundError jeśli repertuar nie istnieje lub nie należy do organizatora.
 */
export const getRepertoireShareMeta = async ({
    supabase,
    repertoireId,
    organizerId,
}: GetRepertoireShareMetaParams): Promise<RepertoireShareMetaDto> => {
    // Pobranie repertuaru z bazy danych z filtrowaniem po organizerId
    const { data, error } = await supabase
        .from('repertoires')
        .select(REPERTOIRE_SHARE_COLUMNS)
        .eq('id', repertoireId)
        .eq('organizer_id', organizerId)
        .maybeSingle();

    if (error) {
        logger.error('Nie udało się pobrać metadanych udostępniania repertuaru', {
            organizerId,
            repertoireId,
            error,
        });
        throw createInternalError('Nie udało się pobrać metadanych udostępniania repertuaru', error);
    }

    if (!data) {
        logger.warn('Repertuar nie został znaleziony lub nie należy do organizatora', {
            organizerId,
            repertoireId,
        });
        throw createNotFoundError('Repertuar nie został znaleziony', { repertoireId });
    }

    // Pobranie bazowego URL aplikacji ze zmiennych środowiskowych
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL');

    if (!appPublicUrl) {
        logger.error('Brak konfiguracji APP_PUBLIC_URL w zmiennych środowiskowych');
        throw createInternalError('Brak konfiguracji adresu publicznego aplikacji');
    }

    // Budowanie publicUrl i qrPayload
    const publicUrl = `${appPublicUrl}/public/repertoires/${data.public_id}`;
    const qrPayload = publicUrl;

    logger.info('Pomyślnie pobrano metadane udostępniania repertuaru', {
        organizerId,
        repertoireId,
        publicId: data.public_id,
    });

    return {
        id: data.id,
        publicId: data.public_id,
        publicUrl,
        qrPayload,
    };
};

