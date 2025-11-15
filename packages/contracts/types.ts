// DTO and Command models leverage Supabase-generated types from `packages/database/database.types.ts`.
// This approach maintains strong coupling with database tables and minimizes field definition duplication.
import type {
    Tables,
    TablesInsert,
    TablesUpdate,
} from '../database/database.types.ts';

// ============================================================================
// Database Type Aliases
// ============================================================================

type ProfileRow = Tables<'profiles'>;
type SongRow = Tables<'songs'>;
type SongInsert = TablesInsert<'songs'>;
type SongUpdate = TablesUpdate<'songs'>;
type RepertoireRow = Tables<'repertoires'>;
type RepertoireInsert = TablesInsert<'repertoires'>;
type RepertoireUpdate = TablesUpdate<'repertoires'>;
type RepertoireSongRow = Tables<'repertoire_songs'>;

// ============================================================================
// Profile DTOs (Section 2.1)
// ============================================================================

/**
 * Organizer profile DTO. Combines `profiles` table columns with Supabase Auth data (`email`).
 * Used in: GET /me/profile, PUT /me/profile
 */
export type OrganizerProfileDto = {
    id: ProfileRow['id'];
    email: string;
    displayName: ProfileRow['display_name'];
    createdAt: ProfileRow['created_at'];
    updatedAt: ProfileRow['updated_at'];
};

/**
 * Command to upsert organizer profile display name.
 * Used in: PUT /me/profile
 */
export type OrganizerProfileUpsertCommand = {
    displayName: ProfileRow['display_name'];
};

/**
 * Command to register a new organizer.
 * Used in: POST /register
 */
export type OrganizerRegisterCommand = {
    email: string;
    password: string;
    displayName: ProfileRow['display_name'];
};

/**
 * Command to resend a confirmation email.
 * Used in: POST /auth/resend-confirmation
 */
export type ResendConfirmationCommand = {
    email: string;
};


// ============================================================================
// Song DTOs and Commands (Section 2.2)
// ============================================================================

/**
 * Command to create a new song. The `published` flag controls publication status,
 * mapped to `published_at` in the database.
 * Used in: POST /songs
 */
export type SongCreateCommand = Pick<SongInsert, 'title' | 'content'> & {
    published?: boolean;
};

/**
 * Command for partial song updates.
 * Used in: PATCH /songs/{id}
 */
export type SongPatchCommand = Partial<Pick<SongUpdate, 'title' | 'content'>>;

/**
 * Summary view of a song used in lists. Excludes content for performance.
 * Used in: GET /songs (list items)
 */
export type SongSummaryDto = {
    id: SongRow['id'];
    publicId: SongRow['public_id'];
    title: SongRow['title'];
    publishedAt: SongRow['published_at'];
    createdAt: SongRow['created_at'];
    updatedAt: SongRow['updated_at'];
};

/**
 * Complete song DTO including chord content.
 * Used in: POST /songs, GET /songs/{id}, PATCH /songs/{id}
 */
export type SongDto = SongSummaryDto & {
    content: SongRow['content'];
};

/**
 * Information about song usage in organizer's repertoires.
 * Used in: GET /songs/{id}?includeUsage=true
 */
export type SongUsageDto = {
    repertoireId: RepertoireRow['id'];
    name: RepertoireRow['name'];
};

/**
 * Detailed song view with optional repertoire usage information.
 * Used in: GET /songs/{id}
 */
export type SongDetailDto = SongDto & {
    repertoires?: SongUsageDto[];
};

/**
 * Pagination metadata shared across list responses.
 */
export type PaginationMeta = {
    page: number;
    pageSize: number;
    total: number;
};

/**
 * Paginated song list response.
 * Used in: GET /songs
 */
export type SongListResponseDto = PaginationMeta & {
    items: SongSummaryDto[];
};

/**
 * Song deletion confirmation response.
 * Used in: DELETE /songs/{id}
 */
export type SongDeleteResponseDto = {
    id: SongRow['id'];
    deleted: true;
};

/**
 * Sharing metadata for a song, including public URL and QR payload.
 * Used in: GET /share/songs/{id}
 */
export type SongShareMetaDto = {
    id: SongRow['id'];
    publicId: SongRow['public_id'];
    publicUrl: string;
    qrPayload: string;
};

// ============================================================================
// Repertoire DTOs and Commands (Section 2.3)
// ============================================================================

/**
 * Command to create a new repertoire with optional initial songs.
 * Used in: POST /repertoires
 */
export type RepertoireCreateCommand = Pick<
    RepertoireInsert,
    'name' | 'description'
> & {
    songIds?: Array<SongRow['id']>;
};

/**
 * Command for partial repertoire updates (metadata only).
 * Used in: PATCH /repertoires/{id}
 */
export type RepertoireUpdateCommand = Partial<
    Pick<RepertoireUpdate, 'name' | 'description'>
>;

/**
 * Summary view of a repertoire used in lists.
 * Used in: GET /repertoires (list items)
 */
export type RepertoireSummaryDto = {
    id: RepertoireRow['id'];
    publicId: RepertoireRow['public_id'];
    name: RepertoireRow['name'];
    description: RepertoireRow['description'];
    publishedAt: RepertoireRow['published_at'];
    createdAt: RepertoireRow['created_at'];
    updatedAt: RepertoireRow['updated_at'];
    songCount?: number;
};

/**
 * Song within a repertoire context, including position and optional content.
 * Used in: GET /repertoires/{id}, GET /repertoires/{id}/songs
 */
export type RepertoireSongDto = {
    repertoireSongId: RepertoireSongRow['id'];
    songId: SongRow['id'];
    title: SongRow['title'];
    position: RepertoireSongRow['position'];
    content?: SongRow['content'] | null;
};

/**
 * Complete repertoire DTO with ordered songs.
 * Used in: POST /repertoires, GET /repertoires/{id}, PATCH /repertoires/{id}
 */
export type RepertoireDto = RepertoireSummaryDto & {
    songs?: RepertoireSongDto[];
};

/**
 * Paginated repertoire list response.
 * Used in: GET /repertoires
 */
export type RepertoireListResponseDto = PaginationMeta & {
    items: RepertoireSummaryDto[];
};

/**
 * Command to add songs to a repertoire.
 * Used in: POST /repertoires/{id}/songs
 */
export type RepertoireAddSongsCommand = {
    songIds: Array<SongRow['id']>;
};

/**
 * Response after adding songs to a repertoire.
 * Used in: POST /repertoires/{id}/songs
 */
export type RepertoireAddSongsResponseDto = {
    repertoireId: RepertoireRow['id'];
    added: Array<{
        repertoireSongId: RepertoireSongRow['id'];
        songId: SongRow['id'];
        position: RepertoireSongRow['position'];
    }>;
};

/**
 * Command to reorder songs in a repertoire using repertoireSongId array.
 * Used in: POST /repertoires/{id}/songs/reorder
 */
export type RepertoireReorderCommand = {
    order: Array<RepertoireSongRow['id']>;
};

/**
 * Response after reordering repertoire songs.
 * Used in: POST /repertoires/{id}/songs/reorder
 */
export type RepertoireReorderResponseDto = {
    repertoireId: RepertoireRow['id'];
    songs: Array<{
        repertoireSongId: RepertoireSongRow['id'];
        position: RepertoireSongRow['position'];
    }>;
};

/**
 * Response after removing a song from a repertoire.
 * Used in: DELETE /repertoires/{id}/songs/{repertoireSongId}
 */
export type RepertoireRemoveSongResponseDto = {
    repertoireId: RepertoireRow['id'];
    removed: RepertoireSongRow['id'];
    positionsRebuilt: boolean;
};

/**
 * Repertoire deletion confirmation response.
 * Used in: DELETE /repertoires/{id}
 */
export type RepertoireDeleteResponseDto = {
    id: RepertoireRow['id'];
    deleted: true;
};

/**
 * Sharing metadata for a repertoire, including public URL and QR payload.
 * Used in: GET /share/repertoires/{id}
 */
export type RepertoireShareMetaDto = {
    id: RepertoireRow['id'];
    publicId: RepertoireRow['public_id'];
    publicUrl: string;
    qrPayload: string;
};

// ============================================================================
// Repertoire Songs (Section 2.4)
// ============================================================================

/**
 * Response containing ordered songs for a specific repertoire.
 * Used in: GET /repertoires/{id}/songs
 */
export type RepertoireSongsResponseDto = {
    repertoireId: RepertoireRow['id'];
    songs: RepertoireSongDto[];
};

// ============================================================================
// Public Content DTOs (Section 2.5)
// ============================================================================

/**
 * Navigation metadata for songs in a public repertoire context.
 * Used in: GET /public/songs/{publicId}, GET /public/repertoires/{publicId}/songs/{songPublicId}
 */
export type PublicSongNavigationDto = {
    position: number;
    total: number;
    previous: string | null;
    next: string | null;
};

/**
 * Public song view with chord-stripped content.
 * Used in: GET /public/songs/{publicId}
 */
export type PublicSongDto = {
    title: SongRow['title'];
    content: string; // Chord-stripped content
    repertoireNavigation: PublicSongNavigationDto | null;
};

/**
 * Song link entry in a public repertoire.
 * Used in: GET /public/repertoires/{publicId}
 */
export type PublicRepertoireSongLinkDto = {
    title: SongRow['title'];
    publicSongUrl: string;
};

/**
 * Public repertoire view with song list.
 * Used in: GET /public/repertoires/{publicId}
 */
export type PublicRepertoireDto = {
    name: RepertoireRow['name'];
    description: RepertoireRow['description'];
    songs: PublicRepertoireSongLinkDto[];
};

/**
 * Order metadata for songs within a public repertoire.
 * Used in: GET /public/repertoires/{publicId}/songs/{songPublicId}
 */
export type PublicRepertoireSongOrderDto = {
    position: number;
    total: number;
    previous: PublicSongNavLinkDto | null;
    next: PublicSongNavLinkDto | null;
};

/**
 * Public song view within a repertoire context, with navigation.
 * Used in: GET /public/repertoires/{publicId}/songs/{songPublicId}
 */
export type PublicRepertoireSongDto = {
    title: SongRow['title'];
    content: string; // Chord-stripped content
    order: PublicRepertoireSongOrderDto;
};

/**
 * Represents a navigation link to another song in a public repertoire view.
 */
export type PublicSongNavLinkDto = {
    url: string;
    title: string;
};

// ============================================================================
// Biesiada Mode DTOs (Section 2.6)
// ============================================================================

/**
 * Lightweight repertoire summary for Biesiada mode.
 * Used in: GET /me/biesiada/repertoires
 */
export type BiesiadaRepertoireSummaryDto = {
    id: RepertoireRow['id'];
    name: RepertoireRow['name'];
    songCount: number;
    publishedAt: RepertoireRow['published_at'];
};

/**
 * Response listing repertoires for Biesiada mode.
 * Used in: GET /me/biesiada/repertoires
 */
export type BiesiadaRepertoireListResponseDto = {
    items: BiesiadaRepertoireSummaryDto[];
};

/**
 * Sharing metadata for a repertoire in Biesiada mode.
 */
export type BiesiadaRepertoireShareMetaDto = {
    publicUrl: string;
    qrPayload: string;
};

/**
 * A simplified song entry for a repertoire list in Biesiada mode.
 */
export type BiesiadaRepertoireSongEntryDto = {
    songId: SongRow['id'];
    title: SongRow['title'];
    position: RepertoireSongRow['position'];
};

/**
 * Response containing a list of songs for a specific repertoire in Biesiada mode,
 * including repertoire-level sharing information.
 * Used in: GET /me/biesiada/repertoires/{id}/songs
 */
export type BiesiadaRepertoireSongListResponseDto = {
    repertoireId: RepertoireRow['id'];
    repertoireName: RepertoireRow['name'];
    share: BiesiadaRepertoireShareMetaDto;
    songs: BiesiadaRepertoireSongEntryDto[];
};

/**
 * Song with chords for Biesiada mode, including QR sharing URL.
 * Used in: GET /me/biesiada/repertoires/{id}/songs
 */
export type BiesiadaRepertoireSongDto = {
    songId: SongRow['id'];
    title: SongRow['title'];
    content: SongRow['content'];
    position: RepertoireSongRow['position'];
    qrUrl: string;
};

/**
 * Response containing songs for Biesiada mode.
 * Used in: GET /me/biesiada/repertoires/{id}/songs
 */
export type BiesiadaRepertoireSongsResponseDto = {
    repertoireId: RepertoireRow['id'];
    songs: BiesiadaRepertoireSongDto[];
};

/**
 * Song link with ID and title for Biesiada navigation.
 * Used in: GET /me/biesiada/repertoires/{id}/songs/{songId}
 */
export type BiesiadaSongLinkDto = {
    songId: SongRow['id'];
    title: SongRow['title'];
};

/**
 * Navigation order metadata for Biesiada song detail.
 * Used in: GET /me/biesiada/repertoires/{id}/songs/{songId}
 */
export type BiesiadaSongOrderDto = {
    position: number;
    total: number;
    previous: BiesiadaSongLinkDto | null;
    next: BiesiadaSongLinkDto | null;
};

/**
 * Sharing metadata for Biesiada song detail.
 * Used in: GET /me/biesiada/repertoires/{id}/songs/{songId}
 */
export type BiesiadaSongShareMetaDto = {
    publicUrl: string;
    qrPayload: string;
};

/**
 * Detailed song view for Biesiada mode with navigation and sharing.
 * Used in: GET /me/biesiada/repertoires/{id}/songs/{songId}
 */
export type BiesiadaRepertoireSongDetailDto = {
    songId: SongRow['id'];
    title: SongRow['title'];
    content: SongRow['content'];
    order: BiesiadaSongOrderDto;
    share: BiesiadaSongShareMetaDto;
};

// ============================================================================
// Utility DTOs (Section 2.7)
// ============================================================================

/**
 * Base URLs and CDN configuration for public link construction.
 * Used in: GET /metadata/public-links
 */
export type MetadataPublicLinksDto = {
    songBaseUrl: string;
    repertoireBaseUrl: string;
    qrCdn?: string;
};

// ============================================================================
// Error Response DTOs (Section 4.6)
// ============================================================================

/**
 * Standard error response envelope for all API errors.
 */
export type ErrorResponseDto = {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};

/**
 * Supported error codes as per API plan section 4.6.
 */
export type ErrorCode =
    | 'validation_error'
    | 'unauthorized'
    | 'forbidden'
    | 'conflict'
    | 'resource_not_found'
    | 'resource_gone'
    | 'rate_limited'
    | 'internal_error';
