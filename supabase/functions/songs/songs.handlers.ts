import { z } from 'npm:zod';
import type { SongCreateCommand, SongDetailDto, SongListResponseDto, PublicSongDto, SongDeleteResponseDto } from '../../../packages/contracts/types.ts';
import { jsonResponse } from '../_shared/http.ts';
import { createValidationError } from '../_shared/errors.ts';
import { logger } from '../_shared/logger.ts';
import type { AuthenticatedUser } from '../_shared/auth.ts';
import type { RequestSupabaseClient } from '../_shared/supabase-client.ts';
import {
    createSong,
    getSongDetails,
    getSongs,
    updateSong,
    getPublicSongByPublicId,
    type SongPatchCommand,
    publishSong,
    unpublishSong,
    deleteSong,
} from './songs.service.ts';
import type { GetSongsFilters } from './songs.service.ts';

const SONG_ID_SCHEMA = z.string().uuid('Nieprawidłowy identyfikator piosenki');

const RAW_GET_QUERY_SCHEMA = z
    .object({
        page: z.string().optional(),
        pageSize: z.string().optional(),
        search: z.string().optional(),
        published: z.enum(['true', 'false']).optional(),
        sort: z.string().optional(),
    })
    .strict();

const SORTABLE_FIELDS = ['title', 'createdAt', 'updatedAt', 'publishedAt'] as const;

type SortField = typeof SORTABLE_FIELDS[number];

type SortDirection = 'asc' | 'desc';

type ParsedSort = GetSongsFilters['sort'];

type GetSongsQuery = {
    page: number;
    pageSize: number;
    search?: string;
    published?: boolean;
    sort: ParsedSort;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 1000;
const MAX_PAGE_SIZE = 1000;
const DEFAULT_SORT = '-createdAt';
const MAX_SEARCH_LENGTH = 200;

const POST_COMMAND_SCHEMA = z
    .object({
        title: z
            .string({ required_error: 'Tytuł piosenki jest wymagany' })
            .trim()
            .min(1, 'Tytuł piosenki jest wymagany')
            .max(180, 'Tytuł może mieć maksymalnie 180 znaków'),
        content: z
            .string({ required_error: 'Treść piosenki jest wymagana' })
            .min(1, 'Treść piosenki nie może być pusta'),
        published: z.boolean().optional(),
    })
    .strict();

const PATCH_COMMAND_SCHEMA = z
    .object({
        title: z
            .string({ required_error: 'Tytuł piosenki jest wymagany' })
            .trim()
            .min(1, 'Tytuł piosenki jest wymagany')
            .max(180, 'Tytuł może mieć maksymalnie 180 znaków'),
        content: z
            .string({ required_error: 'Treść piosenki jest wymagana' })
            .min(1, 'Treść piosenki nie może być pusta'),
    })
    .strict();

const parsePostRequestBody = async (request: Request): Promise<SongCreateCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu utworzenia piosenki', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = POST_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania utworzenia piosenki', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

const parsePatchRequestBody = async (request: Request): Promise<SongPatchCommand> => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        logger.warn('Nieprawidłowy JSON w żądaniu aktualizacji piosenki', { error });
        throw createValidationError('Nieprawidłowy format JSON w żądaniu');
    }

    const result = PATCH_COMMAND_SCHEMA.safeParse(payload);

    if (!result.success) {
        logger.warn('Błędy walidacji żądania aktualizacji piosenki', {
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowe dane wejściowe', result.error.format());
    }

    return result.data;
};

const parseSongId = (rawSongId: string): string => {
    const result = SONG_ID_SCHEMA.safeParse(rawSongId);

    if (!result.success) {
        logger.warn('Nieprawidłowy identyfikator piosenki w ścieżce', {
            songId: rawSongId,
            issues: result.error.issues,
        });

        throw createValidationError('Nieprawidłowy identyfikator piosenki', result.error.format());
    }

    return result.data;
};

const parseIncludeUsageFlag = (request: Request): boolean => {
    const url = new URL(request.url);
    const includeUsageParam = url.searchParams.get('includeUsage');

    if (includeUsageParam === null) {
        return false;
    }

    if (includeUsageParam === 'true') {
        return true;
    }

    if (includeUsageParam === 'false') {
        return false;
    }

    logger.warn('Nieprawidłowa wartość parametru includeUsage', {
        value: includeUsageParam,
    });

    throw createValidationError('Parametr includeUsage musi mieć wartość true lub false', {
        field: 'includeUsage',
        value: includeUsageParam,
    });
};

const parsePositiveInteger = (
    rawValue: string,
    field: 'page' | 'pageSize',
    { min, max }: { min: number; max?: number },
): number => {
    if (!/^\d+$/.test(rawValue)) {
        logger.warn('Parametr zapytania nie jest dodatnią liczbą całkowitą', {
            field,
            value: rawValue,
        });
        throw createValidationError(`Parametr ${field} musi być dodatnią liczbą całkowitą`, {
            field,
        });
    }

    const parsed = Number.parseInt(rawValue, 10);

    if (!Number.isSafeInteger(parsed)) {
        logger.warn('Parametr zapytania przekracza bezpieczny zakres liczb', {
            field,
            value: rawValue,
        });
        throw createValidationError(`Parametr ${field} ma nieprawidłową wartość`, {
            field,
        });
    }

    if (parsed < min) {
        logger.warn('Parametr zapytania jest mniejszy od minimalnej wartości', {
            field,
            value: parsed,
            min,
        });
        throw createValidationError(`Parametr ${field} nie może być mniejszy niż ${min}`, {
            field,
        });
    }

    if (max !== undefined && parsed > max) {
        logger.warn('Parametr zapytania przekracza maksymalną dozwoloną wartość', {
            field,
            value: parsed,
            max,
        });
        throw createValidationError(`Parametr ${field} nie może być większy niż ${max}`, {
            field,
        });
    }

    return parsed;
};

const parseSort = (rawSort?: string): ParsedSort => {
    const value = rawSort ?? DEFAULT_SORT;
    const direction: SortDirection = value.startsWith('-') ? 'desc' : 'asc';
    const fieldName = direction === 'desc' ? value.slice(1) : value;

    if (!SORTABLE_FIELDS.includes(fieldName as SortField)) {
        logger.warn('Nieprawidłowa wartość sortowania', { value });
        throw createValidationError('Nieprawidłowy parametr sortowania', {
            field: 'sort',
            value,
        });
    }

    return {
        field: fieldName as SortField,
        direction,
    };
};

const normalizeSearch = (rawValue?: string): string | undefined => {
    if (rawValue === undefined) {
        return undefined;
    }

    const trimmed = rawValue.trim();

    if (trimmed.length === 0) {
        return undefined;
    }

    if (trimmed.length > MAX_SEARCH_LENGTH) {
        logger.warn('Parametr search przekracza maksymalną długość', {
            length: trimmed.length,
            max: MAX_SEARCH_LENGTH,
        });
        throw createValidationError(`Parametr search nie może przekraczać ${MAX_SEARCH_LENGTH} znaków`, {
            field: 'search',
        });
    }

    return trimmed;
};

const parseGetSongsQuery = (request: Request): GetSongsQuery => {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());

    const result = RAW_GET_QUERY_SCHEMA.safeParse(rawParams);

    if (!result.success) {
        logger.warn('Błędy walidacji parametrów zapytania GET /songs', {
            issues: result.error.issues,
        });
        throw createValidationError('Nieprawidłowe parametry zapytania', result.error.format());
    }

    const { page, pageSize, search, published, sort } = result.data;

    const parsedPage = page ? parsePositiveInteger(page, 'page', { min: 1 }) : DEFAULT_PAGE;
    const parsedPageSize = pageSize
        ? parsePositiveInteger(pageSize, 'pageSize', { min: 1, max: MAX_PAGE_SIZE })
        : DEFAULT_PAGE_SIZE;

    const normalizedSearch = normalizeSearch(search);
    const parsedPublished = published === undefined ? undefined : published === 'true';
    const parsedSort = parseSort(sort);

    return {
        page: parsedPage,
        pageSize: parsedPageSize,
        search: normalizedSearch,
        published: parsedPublished,
        sort: parsedSort,
    };
};

export const handleGetSongs = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const query = parseGetSongsQuery(request);

    logger.info('Rozpoczęto pobieranie listy piosenek', {
        userId: user.id,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search ?? null,
        published: query.published ?? 'all',
        sort: `${query.sort.direction === 'desc' ? '-' : ''}${query.sort.field}`,
    });

    const result = await getSongs({
        organizerId: user.id,
        supabase,
        filters: {
            page: query.page,
            pageSize: query.pageSize,
            search: query.search,
            published: query.published,
            sort: query.sort,
        },
    });

    const headers = new Headers({
        'X-Total-Count': String(result.total),
        'Cache-Control': 'no-store',
    });

    return jsonResponse<{ data: SongListResponseDto }>({ data: result }, { headers });
};

export const handleGetSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);
    const includeUsage = parseIncludeUsageFlag(request);

    logger.info('Rozpoczęto pobieranie szczegółów piosenki', {
        userId: user.id,
        songId,
        includeUsage,
    });

    const song = await getSongDetails({
        supabase,
        organizerId: user.id,
        songId,
        includeUsage,
    });

    const responseBody: { data: SongDetailDto } = {
        data: song,
    };

    const headers = new Headers({
        'Cache-Control': 'no-store',
    });

    return jsonResponse(responseBody, { status: 200, headers });
};

export const handlePostSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
): Promise<Response> => {
    const command = await parsePostRequestBody(request);

    logger.info('Rozpoczęto tworzenie nowej piosenki', {
        userId: user.id,
        title: command.title,
    });

    const song = await createSong({
        command,
        organizerId: user.id,
        supabase,
    });

    return jsonResponse({ data: song }, { status: 201 });
};

export const handlePatchSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);
    const command = await parsePatchRequestBody(request);

    logger.info('Rozpoczęto częściową aktualizację piosenki', {
        userId: user.id,
        songId,
        title: command.title,
    });

    const song = await updateSong({
        command,
        organizerId: user.id,
        songId,
        supabase,
    });

    return jsonResponse({ data: song }, { status: 200 });
};

export const handlePublishSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);

    logger.info('Rozpoczęto publikowanie piosenki', {
        userId: user.id,
        songId,
    });

    const song = await publishSong({
        supabase,
        organizerId: user.id,
        songId,
    });

    return jsonResponse({ data: song }, { status: 200 });
};

/**
 * Handler dla POST /songs/{id}/unpublish
 * Odpublikowanie piosenki przez uwierzytelnionego organizatora
 */
export const handleUnpublishSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);

    logger.info('Rozpoczęto odpublikowanie piosenki', {
        userId: user.id,
        songId,
    });

    const song = await unpublishSong({
        supabase,
        organizerId: user.id,
        songId,
    });

    return jsonResponse({ data: song }, { status: 200 });
};

/**
 * Handler dla DELETE /songs/{id}
 * Usunięcie piosenki z biblioteki uwierzytelnionego organizatora
 */
export const handleDeleteSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    rawSongId: string,
): Promise<Response> => {
    const songId = parseSongId(rawSongId);

    logger.info('Rozpoczęto usuwanie piosenki', {
        userId: user.id,
        songId,
    });

    const deletedSongId = await deleteSong({
        supabase,
        organizerId: user.id,
        songId,
    });

    const responseBody: SongDeleteResponseDto = {
        id: deletedSongId,
        deleted: true,
    };

    return jsonResponse({ data: responseBody }, { status: 200 });
};

export const songsRouter = async (
    request: Request,
    supabase: RequestSupabaseClient,
    user: AuthenticatedUser,
    path: string,
): Promise<Response> => {
    if (path.endsWith('/songs')) {
        if (request.method === 'GET') {
            return await handleGetSongs(request, supabase, user);
        }

        if (request.method === 'POST') {
            return await handlePostSong(request, supabase, user);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'GET, POST',
            },
        });
    }

    const songPublishMatch = path.match(/\/songs\/([^/]+)\/publish$/);
    if (songPublishMatch) {
        if (request.method === 'POST') {
            const songId = songPublishMatch[1];
            return await handlePublishSong(request, supabase, user, songId);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'POST',
            },
        });
    }

    const songUnpublishMatch = path.match(/\/songs\/([^/]+)\/unpublish$/);
    if (songUnpublishMatch) {
        if (request.method === 'POST') {
            const songId = songUnpublishMatch[1];
            return await handleUnpublishSong(request, supabase, user, songId);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'POST',
            },
        });
    }

    const songMatch = path.match(/\/songs\/([^/]+)$/);

    if (songMatch) {
        const songId = songMatch[1];

        if (request.method === 'PATCH') {
            return await handlePatchSong(request, supabase, user, songId);
        }

        if (request.method === 'GET') {
            return await handleGetSong(request, supabase, user, songId);
        }

        if (request.method === 'DELETE') {
            return await handleDeleteSong(request, supabase, user, songId);
        }

        return new Response(null, {
            status: 405,
            headers: {
                Allow: 'GET, PATCH, DELETE',
            },
        });
    }

    logger.warn('Router songs nie dopasował ścieżki', { path });

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

/**
 * Handler dla publicznego endpointa GET /public/songs/{publicId}
 * Nie wymaga uwierzytelnienia - dostępny dla wszystkich użytkowników
 */
export const handleGetPublicSong = async (
    request: Request,
    supabase: RequestSupabaseClient,
    rawPublicId: string,
): Promise<Response> => {
    // Walidacja publicId - musi być UUID
    const publicIdSchema = z.string().uuid('Nieprawidłowy publiczny identyfikator piosenki');
    const result = publicIdSchema.safeParse(rawPublicId);

    if (!result.success) {
        logger.warn('Nieprawidłowy publicId w żądaniu publicznej piosenki', {
            publicId: rawPublicId,
            issues: result.error.issues,
        });

        throw createValidationError(
            'Nieprawidłowy publiczny identyfikator piosenki',
            result.error.format()
        );
    }

    const publicId = result.data;

    logger.info('Rozpoczęto pobieranie publicznej piosenki', {
        publicId,
    });

    // Pobranie danych piosenki z serwisu
    const songData = await getPublicSongByPublicId({
        supabase,
        publicId,
    });

    // Formatowanie odpowiedzi jako PublicSongDto
    const response: PublicSongDto = {
        title: songData.title,
        content: songData.content,
        repertoireNavigation: null, // Dla pojedynczej piosenki brak nawigacji
    };

    const headers = new Headers({
        'Cache-Control': 'public, max-age=300', // Cache na 5 minut dla publicznych treści
    });

    return jsonResponse({ data: response }, { status: 200, headers });
};

