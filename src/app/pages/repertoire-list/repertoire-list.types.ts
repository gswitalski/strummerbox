import type { RepertoireSummaryDto } from '../../../../packages/contracts/types';

/**
 * Typy sortowania dla listy repertuarów
 */
export type RepertoireListSortDirection = 'asc' | 'desc';
export type RepertoireListSortField = 'name' | 'createdAt' | 'updatedAt' | 'publishedAt';

/**
 * ViewModel reprezentujący pojedynczy repertuar na liście
 */
export interface RepertoireSummaryVM {
    id: string;
    name: string;
    songCount: number;
    createdAt: string; // Sformatowana data, np. '23.10.2025'
    updatedAt: string; // Sformatowana data
    isPublished: boolean;
    /**
     * Flag to control loading indicator during status toggle operation.
     * When true, the toggle should be disabled and a spinner should be visible.
     */
    isTogglingStatus: boolean;
}

/**
 * Parametry zapytania do API dla listy repertuarów
 */
export interface RepertoireListQueryParams {
    page: number;
    pageSize: number;
    search?: string;
    sortField: RepertoireListSortField;
    sortDirection: RepertoireListSortDirection;
}

/**
 * Stan zarządzany w RepertoireListPageComponent
 */
export interface RepertoireListState {
    repertoires: RepertoireSummaryVM[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchTerm: string;
    sort: {
        active: RepertoireListSortField;
        direction: RepertoireListSortDirection;
    };
    isLoading: boolean;
    error: string | null;
}

/**
 * Funkcja mapująca DTO z API na ViewModel
 */
export const mapRepertoireDtoToViewModel = (dto: RepertoireSummaryDto): RepertoireSummaryVM => ({
    id: dto.id,
    name: dto.name,
    songCount: dto.songCount ?? 0,
    createdAt: new Date(dto.createdAt).toLocaleDateString('pl-PL'),
    updatedAt: new Date(dto.updatedAt).toLocaleDateString('pl-PL'),
    isPublished: dto.publishedAt !== null,
    isTogglingStatus: false,
});

