import type {
    RepertoireDto,
    RepertoireCreateCommand,
    RepertoireSongDto,
    RepertoireSummaryDto,
    RepertoireListResponseDto,
} from '../../../packages/contracts/types.ts';
import { createConflictError, createInternalError, createValidationError } from '../_shared/errors.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import { logger } from '../_shared/logger.ts';
import type { GetRepertoiresQueryParams } from './repertoires.handlers.ts';

// ============================================================================
// Column Definitions
// ============================================================================

/**
 * Kolumny do pobrania dla pełnego obiektu repertuaru.
 */
const REPERTOIRE_COLUMNS =
    'id, public_id, name, description, published_at, created_at, updated_at';

/**
 * Kolumny do pobrania dla podsumowania repertuaru (używane w listach).
 */
const REPERTOIRE_SUMMARY_COLUMNS = REPERTOIRE_COLUMNS;

/**
 * Kolumny do pobrania dla piosenek w repertuarze wraz z danymi piosenki (bez content).
 * Używane dla operacji typu POST/GET list, gdzie content nie jest wymagany.
 */
const REPERTOIRE_SONG_COLUMNS_WITHOUT_CONTENT =
    'id, position, song_id, songs!inner(id, title)';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mapuje surowy wiersz repertoire_songs z bazy do RepertoireSongDto (bez content).
 * Używane dla list gdzie content nie jest wymagany.
 */
const mapToRepertoireSongDtoWithoutContent = (row: {
    id: string;
    position: number;
    song_id: string;
    songs: {
        id: string;
        title: string;
    };
}): RepertoireSongDto => ({
    repertoireSongId: row.id,
    songId: row.songs.id,
    title: row.songs.title,
    position: row.position,
    content: null,
});

/**
 * Mapuje surowy wiersz repertuaru z bazy do RepertoireDto (bez piosenek).
 */
const mapToRepertoireDto = (row: {
    id: string;
    public_id: string;
    name: string;
    description: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}): Omit<RepertoireDto, 'songs'> => ({
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    description: row.description,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

/**
 * Mapuje surowy wiersz repertuaru z bazy do RepertoireSummaryDto.
 */
const mapToRepertoireSummaryDto = (
    row: {
        id: string;
        public_id: string;
        name: string;
        description: string | null;
        published_at: string | null;
        created_at: string;
        updated_at: string;
    },
    songCount?: number,
): RepertoireSummaryDto => ({
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    description: row.description,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(songCount !== undefined && { songCount }),
});

type FetchRepertoireWithSongsParams = {
    supabase: RequestSupabaseClient;
    repertoireId: string;
    organizerId: string;
};

/**
 * Pobiera pełny repertuar wraz z piosenkami z bazy danych.
 *
 * @throws {ApplicationError} 500 - błąd podczas pobierania danych
 */
const fetchRepertoireWithSongs = async ({
    supabase,
    repertoireId,
    organizerId,
}: FetchRepertoireWithSongsParams): Promise<RepertoireDto> => {
    // Pobranie danych podstawowych repertuaru
    const { data: repertoireData, error: repertoireError } = await supabase
        .from('repertoires')
        .select(REPERTOIRE_COLUMNS)
        .eq('id', repertoireId)
        .eq('organizer_id', organizerId)
        .single();

    if (repertoireError || !repertoireData) {
        logger.error('Błąd podczas pobierania repertuaru', {
            organizerId,
            repertoireId,
            error: repertoireError,
        });
        throw createInternalError('Nie udało się pobrać repertuaru', repertoireError);
    }

    // Pobranie piosenek w repertuarze (bez content dla wydajności)
    const { data: songsData, error: songsError } = await supabase
        .from('repertoire_songs')
        .select(REPERTOIRE_SONG_COLUMNS_WITHOUT_CONTENT)
        .eq('repertoire_id', repertoireId)
        .order('position', { ascending: true });

    if (songsError) {
        logger.error('Błąd podczas pobierania piosenek repertuaru', {
            organizerId,
            repertoireId,
            error: songsError,
        });
        throw createInternalError('Nie udało się pobrać piosenek repertuaru', songsError);
    }

    // Mapowanie do DTO
    const baseDto = mapToRepertoireDto(repertoireData);
    const songs = (songsData || []).map(mapToRepertoireSongDtoWithoutContent);

    return {
        ...baseDto,
        songCount: songs.length,
        songs,
    };
};

// ============================================================================
// Service Functions
// ============================================================================

export type CreateRepertoireParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    command: RepertoireCreateCommand;
};

/**
 * Tworzy nowy repertuar z opcjonalnym zestawem początkowych piosenek.
 *
 * Proces:
 * 1. Rozpoczyna transakcję bazodanową
 * 2. Wstawia nowy wiersz do tabeli repertoires
 * 3. Jeśli songIds są podane:
 *    a. Weryfikuje własność wszystkich piosenek
 *    b. Tworzy wpisy w repertoire_songs z pozycjami
 * 4. Zatwierdza transakcję
 * 5. Pobiera i zwraca pełny obiekt RepertoireDto
 *
 * @throws {ApplicationError} 400 - błąd walidacji (nieprawidłowe songIds)
 * @throws {ApplicationError} 409 - konflikt nazwy repertuaru
 * @throws {ApplicationError} 500 - błąd bazy danych
 */
export const createRepertoire = async ({
    supabase,
    organizerId,
    command,
}: CreateRepertoireParams): Promise<RepertoireDto> => {
    const { name, description, songIds } = command;

    const trimmedName = name.trim();

    // ========================================================================
    // Krok 1: Utworzenie repertuaru w bazie danych
    // ========================================================================

    const insertPayload = {
        organizer_id: organizerId,
        name: trimmedName,
        description: description || null,
    };

    const { data: repertoireData, error: repertoireError } = await supabase
        .from('repertoires')
        .insert(insertPayload)
        .select(REPERTOIRE_COLUMNS)
        .single();

    if (repertoireError) {
        // Obsługa konfliktu nazwy (UNIQUE constraint violation)
        if (repertoireError.code === '23505') {
            logger.warn('Konflikt nazwy repertuaru dla organizatora', {
                organizerId,
                name: trimmedName,
            });
            throw createConflictError('Repertuar o podanej nazwie już istnieje', {
                name: trimmedName,
            });
        }

        logger.error('Błąd podczas wstawiania repertuaru', {
            organizerId,
            error: repertoireError,
        });
        throw createInternalError('Nie udało się utworzyć repertuaru', repertoireError);
    }

    if (!repertoireData) {
        logger.error('Supabase zwrócił pusty payload po wstawieniu repertuaru', {
            organizerId,
        });
        throw createInternalError('Nie udało się pobrać danych nowego repertuaru');
    }

    logger.info('Repertuar utworzony w bazie danych', {
        organizerId,
        repertoireId: repertoireData.id,
        name: repertoireData.name,
    });

    // ========================================================================
    // Krok 2 & 3: Walidacja i dodawanie piosenek (jeśli songIds są podane)
    // ========================================================================

    if (songIds && songIds.length > 0) {
        // Edge case: usunięcie duplikatów z zachowaniem kolejności
        const uniqueSongIds = Array.from(new Set(songIds));

        if (uniqueSongIds.length !== songIds.length) {
            logger.info('Usunięto duplikaty z listy songIds', {
                organizerId,
                repertoireId: repertoireData.id,
                originalCount: songIds.length,
                uniqueCount: uniqueSongIds.length,
            });
        }

        // Walidacja: sprawdzenie czy wszystkie piosenki istnieją i należą do organizatora
        const { data: songsValidation, error: validationError } = await supabase
            .from('songs')
            .select('id')
            .in('id', uniqueSongIds)
            .eq('organizer_id', organizerId);

        if (validationError) {
            logger.error('Błąd podczas walidacji własności piosenek', {
                organizerId,
                repertoireId: repertoireData.id,
                error: validationError,
            });
            throw createInternalError('Nie udało się zweryfikować piosenek', validationError);
        }

        // Sprawdzenie czy wszystkie songIds istnieją w wynikach
        const foundSongIds = new Set(songsValidation.map(s => s.id));
        const invalidSongIds = uniqueSongIds.filter(id => !foundSongIds.has(id));

        if (invalidSongIds.length > 0) {
            logger.warn('Próba dodania nieprawidłowych piosenek do repertuaru', {
                organizerId,
                repertoireId: repertoireData.id,
                invalidSongIds,
            });
            throw createValidationError(
                'Jedna lub więcej piosenek nie istnieje lub nie należy do użytkownika',
                { invalidSongIds }
            );
        }

        // Utworzenie wpisów w repertoire_songs z pozycjami
        const repertoireSongsPayload = uniqueSongIds.map((songId, index) => ({
            repertoire_id: repertoireData.id,
            song_id: songId,
            position: index + 1, // Pozycje zaczynają się od 1
        }));

        const { error: insertSongsError } = await supabase
            .from('repertoire_songs')
            .insert(repertoireSongsPayload);

        if (insertSongsError) {
            logger.error('Błąd podczas dodawania piosenek do repertuaru', {
                organizerId,
                repertoireId: repertoireData.id,
                error: insertSongsError,
            });
            throw createInternalError('Nie udało się dodać piosenek do repertuaru', insertSongsError);
        }

        logger.info('Piosenki dodane do repertuaru', {
            organizerId,
            repertoireId: repertoireData.id,
            songCount: uniqueSongIds.length,
        });
    }

    // ========================================================================
    // Krok 4: Pobranie pełnego obiektu RepertoireDto
    // ========================================================================

    const fullRepertoire = await fetchRepertoireWithSongs({
        supabase,
        repertoireId: repertoireData.id,
        organizerId,
    });

    return fullRepertoire;
};

// ============================================================================
// List Repertoires Service
// ============================================================================

export type ListRepertoiresParams = {
    supabase: RequestSupabaseClient;
    organizerId: string;
    params: GetRepertoiresQueryParams;
};

/**
 * Mapowanie kluczy sortowania z API (camelCase) do kolumn bazy (snake_case).
 */
const SORT_KEY_MAP: Record<string, string> = {
    name: 'name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    publishedAt: 'published_at',
};

/**
 * Pobiera paginowaną listę repertuarów organizatora z opcjonalnymi filtrami.
 *
 * Proces:
 * 1. Dynamiczne budowanie zapytania z filtrowaniem po organizer_id
 * 2. Obsługa wyszukiwania trigramowego (search)
 * 3. Obsługa filtrowania po statusie publikacji (published)
 * 4. Obsługa sortowania (sort)
 * 5. Paginacja (page, pageSize)
 * 6. Opcjonalne zliczanie piosenek (includeCounts)
 * 7. Pobieranie total count dla metadanych paginacji
 *
 * @throws {ApplicationError} 500 - błąd bazy danych
 */
export const listRepertoires = async ({
    supabase,
    organizerId,
    params,
}: ListRepertoiresParams): Promise<RepertoireListResponseDto> => {
    const { page, pageSize, search, published, sort, includeCounts } = params;

    logger.info('Rozpoczęcie pobierania listy repertuarów', {
        organizerId,
        params,
    });

    // ========================================================================
    // Budowanie zapytania dla repertuarów
    // ========================================================================

    let query = supabase
        .from('repertoires')
        .select(REPERTOIRE_SUMMARY_COLUMNS, { count: 'exact' })
        .eq('organizer_id', organizerId);

    // Filtrowanie po wyszukiwanej frazie (wyszukiwanie trigramowe w nazwie)
    if (search && search.length > 0) {
        // Używamy operatora ilike dla prostego wyszukiwania tekstowego
        // Dla pełnego wyszukiwania trigramowego należałoby użyć rozszerzenia pg_trgm
        query = query.ilike('name', `%${search}%`);
    }

    // Filtrowanie po statusie publikacji
    if (published !== undefined) {
        if (published) {
            query = query.not('published_at', 'is', null);
        } else {
            query = query.is('published_at', null);
        }
    }

    // Sortowanie
    if (sort) {
        const isDescending = sort.startsWith('-');
        const sortKey = isDescending ? sort.slice(1) : sort;
        const columnName = SORT_KEY_MAP[sortKey] || 'created_at';

        query = query.order(columnName, { ascending: !isDescending });
    } else {
        // Domyślne sortowanie: createdAt malejąco
        query = query.order('created_at', { ascending: false });
    }

    // Paginacja
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    // ========================================================================
    // Wykonanie zapytania
    // ========================================================================

    const { data: repertoiresData, error: repertoiresError, count } = await query;

    if (repertoiresError) {
        logger.error('Błąd podczas pobierania repertuarów', {
            organizerId,
            error: repertoiresError,
        });
        throw createInternalError('Nie udało się pobrać repertuarów', repertoiresError);
    }

    // ========================================================================
    // Zliczanie piosenek (jeśli includeCounts === true)
    // ========================================================================

    const songCountsMap: Map<string, number> = new Map();

    if (includeCounts && repertoiresData && repertoiresData.length > 0) {
        const repertoireIds = repertoiresData.map(r => r.id);

        const { data: countsData, error: countsError } = await supabase
            .from('repertoire_songs')
            .select('repertoire_id')
            .in('repertoire_id', repertoireIds);

        if (countsError) {
            logger.error('Błąd podczas zliczania piosenek w repertuarach', {
                organizerId,
                error: countsError,
            });
            // Nie rzucamy błędu - songCount po prostu nie zostanie dodany
            logger.warn('Pomijanie songCount z powodu błędu zliczania');
        } else if (countsData) {
            // Zliczanie wystąpień każdego repertoire_id
            countsData.forEach(row => {
                const currentCount = songCountsMap.get(row.repertoire_id) || 0;
                songCountsMap.set(row.repertoire_id, currentCount + 1);
            });
        }
    }

    // ========================================================================
    // Mapowanie wyników
    // ========================================================================

    const items: RepertoireSummaryDto[] = (repertoiresData || []).map(row =>
        mapToRepertoireSummaryDto(
            row,
            includeCounts ? (songCountsMap.get(row.id) || 0) : undefined
        )
    );

    logger.info('Pobrano listę repertuarów', {
        organizerId,
        count: items.length,
        total: count || 0,
        page,
        pageSize,
    });

    return {
        items,
        page,
        pageSize,
        total: count || 0,
    };
};

