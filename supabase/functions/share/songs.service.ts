import type { SongShareMetaDto } from '../../../packages/contracts/types.ts';
import { createInternalError, createNotFoundError } from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';

/**
 * Kolumny pobierane do generowania metadanych udostępniania piosenki
 */
const SONG_SHARE_COLUMNS = 'id, public_id';

/**
 * Parametry dla funkcji pobierającej metadane udostępniania piosenki
 */
export type GetSongShareMetaParams = {
    supabase: RequestSupabaseClient;
    songId: string;
    organizerId: string;
};

/**
 * Pobiera metadane do udostępniania konkretnej piosenki.
 * Zwraca publicUrl i qrPayload dla piosenki należącej do danego organizatora.
 * Rzuca NotFoundError jeśli piosenka nie istnieje lub nie należy do organizatora.
 */
export const getSongShareMeta = async ({
    supabase,
    songId,
    organizerId,
}: GetSongShareMetaParams): Promise<SongShareMetaDto> => {
    // Pobranie piosenki z bazy danych z filtrowaniem po organizerId
    const { data, error } = await supabase
        .from('songs')
        .select(SONG_SHARE_COLUMNS)
        .eq('id', songId)
        .eq('organizer_id', organizerId)
        .maybeSingle();

    if (error) {
        logger.error('Nie udało się pobrać metadanych udostępniania piosenki', {
            organizerId,
            songId,
            error,
        });
        throw createInternalError('Nie udało się pobrać metadanych udostępniania piosenki', error);
    }

    if (!data) {
        logger.warn('Piosenka nie została znaleziona lub nie należy do organizatora', {
            organizerId,
            songId,
        });
        throw createNotFoundError('Piosenka nie została znaleziona', { songId });
    }

    // Pobranie bazowego URL aplikacji ze zmiennych środowiskowych
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL');

    if (!appPublicUrl) {
        logger.error('Brak konfiguracji APP_PUBLIC_URL w zmiennych środowiskowych');
        throw createInternalError('Brak konfiguracji adresu publicznego aplikacji');
    }

    // Budowanie publicUrl i qrPayload
    const publicUrl = `${appPublicUrl}/public/songs/${data.public_id}`;
    const qrPayload = publicUrl;

    logger.info('Pomyślnie pobrano metadane udostępniania piosenki', {
        organizerId,
        songId,
        publicId: data.public_id,
    });

    return {
        id: data.id,
        publicId: data.public_id,
        publicUrl,
        qrPayload,
    };
};

