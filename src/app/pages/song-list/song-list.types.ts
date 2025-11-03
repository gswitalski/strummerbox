import type { SongSummaryDto } from '../../../../packages/contracts/types';

/**
 * View model for song list item with UI state management.
 * Extends SongSummaryDto with computed and state flags for interactive features.
 */
export interface SongListViewModel {
    id: SongSummaryDto['id'];
    publicId: SongSummaryDto['publicId'];
    title: SongSummaryDto['title'];
    publishedAt: SongSummaryDto['publishedAt'];
    createdAt: string;
    updatedAt: string;

    /**
     * Convenient flag derived from `publishedAt`.
     * true if song is published, false if it's a draft.
     */
    isPublished: boolean;

    /**
     * Flag to control loading indicator during status toggle operation.
     * When true, the toggle should be disabled and a spinner should be visible.
     */
    isTogglingStatus: boolean;

    /**
     * Flag to control loading indicator during delete check operation.
     * When true, the delete button should be disabled and a spinner should be visible.
     */
    isCheckingBeforeDelete: boolean;
}

