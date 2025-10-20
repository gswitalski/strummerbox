import { HttpClient, HttpParams } from '@angular/common/http';
import {
    Injectable,
    Signal,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
    SongDeleteResponseDto,
    SongListResponseDto,
} from '../../../../../packages/contracts/types';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';

export type SongListSortDirection = 'asc' | 'desc';

export type SongListSortField = 'title' | 'createdAt' | 'updatedAt' | 'publishedAt';

export interface SongListQueryParams {
    page: number;
    pageSize: number;
    search?: string;
    sortField: SongListSortField;
    sortDirection: SongListSortDirection;
}

interface SupabaseSession {
    access_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class SongListService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1/songs` as const;

    private readonly isDeletingState: WritableSignal<boolean> = signal(false);
    private readonly deleteErrorState: WritableSignal<string | null> = signal(null);

    public readonly isDeleting: Signal<boolean> = computed(() => this.isDeletingState());
    public readonly deleteError: Signal<string | null> = computed(() => this.deleteErrorState());

    public async fetchSongs(params: SongListQueryParams): Promise<SongListResponseDto> {
        const session = await this.getSession();
        const httpParams = this.buildQueryParams(params);

        return await firstValueFrom(
            this.http.get<{ data: SongListResponseDto }>(this.baseUrl, {
                params: httpParams,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        ).then((response) => response.data);
    }

    public async deleteSong(songId: string): Promise<SongDeleteResponseDto> {
        if (this.isDeletingState()) {
            throw new Error('Usuwanie jest już w toku.');
        }

        this.isDeletingState.set(true);
        this.deleteErrorState.set(null);

        try {
            const session = await this.getSession();
            const url = `${this.baseUrl}/${songId}`;

            const response = await firstValueFrom(
                this.http.delete<{ data: SongDeleteResponseDto }>(url, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            );

            return response.data;
        } catch (error) {
            this.deleteErrorState.set('Nie udało się usunąć piosenki. Spróbuj ponownie.');
            throw error;
        } finally {
            this.isDeletingState.set(false);
        }
    }

    private async getSession(): Promise<SupabaseSession> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }

    private buildQueryParams(params: SongListQueryParams): HttpParams {
        let httpParams = new HttpParams()
            .set('page', String(params.page))
            .set('pageSize', String(params.pageSize))
            .set(
                'sort',
                `${params.sortDirection === 'desc' ? '-' : ''}${params.sortField}`
            );

        if (params.search && params.search.trim().length > 0) {
            httpParams = httpParams.set('search', params.search.trim());
        }

        return httpParams;
    }
}
