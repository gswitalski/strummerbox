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
    RepertoireDto,
    RepertoireListResponseDto,
} from '../../../../../packages/contracts/types';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';
import type { RepertoireListQueryParams } from '../repertoire-list.types';

interface SupabaseSession {
    access_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class RepertoireListService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1/repertoires` as const;

    private readonly isDeletingState: WritableSignal<boolean> = signal(false);
    private readonly deleteErrorState: WritableSignal<string | null> = signal(null);

    public readonly isDeleting: Signal<boolean> = computed(() => this.isDeletingState());
    public readonly deleteError: Signal<string | null> = computed(() => this.deleteErrorState());

    /**
     * Pobiera paginowaną listę repertuarów z API
     */
    public async fetchRepertoires(params: RepertoireListQueryParams): Promise<RepertoireListResponseDto> {
        const session = await this.getSession();
        const httpParams = this.buildQueryParams(params);

        const response = await firstValueFrom(
            this.http.get<RepertoireListResponseDto>(this.baseUrl, {
                params: httpParams,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        );

        console.log('RepertoireListService: API response', response);

        // API może zwracać dane bezpośrednio lub w { data: ... }
        if (response && typeof response === 'object') {
            // Sprawdź czy odpowiedź ma strukturę { data: ... }
            if ('data' in response && response.data) {
                return response.data as RepertoireListResponseDto;
            }
            // Jeśli nie, zwróć bezpośrednio (zakładając że to już jest RepertoireListResponseDto)
            return response as RepertoireListResponseDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Usuwa repertuar na podstawie ID
     */
    public async deleteRepertoire(repertoireId: string): Promise<void> {
        if (this.isDeletingState()) {
            throw new Error('Usuwanie jest już w toku.');
        }

        this.isDeletingState.set(true);
        this.deleteErrorState.set(null);

        try {
            const session = await this.getSession();
            const url = `${this.baseUrl}/${repertoireId}`;

            await firstValueFrom(
                this.http.delete<{ data: { id: string; deleted: true } }>(url, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            );
        } catch (error) {
            this.deleteErrorState.set('Nie udało się usunąć repertuaru. Spróbuj ponownie.');
            throw error;
        } finally {
            this.isDeletingState.set(false);
        }
    }

    /**
     * Publishes a repertoire by calling the POST /repertoires/{id}/publish endpoint.
     * @param repertoireId - The ID of the repertoire to publish
     * @returns Promise with updated repertoire data including publishedAt timestamp
     * @throws Error if no active session or API call fails
     */
    public async publishRepertoire(repertoireId: string): Promise<RepertoireDto> {
        const session = await this.getSession();
        const url = `${this.baseUrl}/${repertoireId}/publish`;

        const response = await firstValueFrom(
            this.http.post<RepertoireDto | { data: RepertoireDto }>(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            )
        );

        // API może zwracać dane bezpośrednio lub w { data: ... }
        if (response && typeof response === 'object') {
            if ('data' in response && response.data) {
                return response.data as RepertoireDto;
            }
            return response as RepertoireDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Unpublishes a repertoire by calling the POST /repertoires/{id}/unpublish endpoint.
     * @param repertoireId - The ID of the repertoire to unpublish
     * @returns Promise with updated repertoire data with publishedAt set to null
     * @throws Error if no active session or API call fails
     */
    public async unpublishRepertoire(repertoireId: string): Promise<RepertoireDto> {
        const session = await this.getSession();
        const url = `${this.baseUrl}/${repertoireId}/unpublish`;

        const response = await firstValueFrom(
            this.http.post<RepertoireDto | { data: RepertoireDto }>(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            )
        );

        // API może zwracać dane bezpośrednio lub w { data: ... }
        if (response && typeof response === 'object') {
            if ('data' in response && response.data) {
                return response.data as RepertoireDto;
            }
            return response as RepertoireDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Pobiera sesję użytkownika z Supabase
     */
    private async getSession(): Promise<SupabaseSession> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }

    /**
     * Buduje parametry zapytania HTTP dla API
     */
    private buildQueryParams(params: RepertoireListQueryParams): HttpParams {
        let httpParams = new HttpParams()
            .set('page', String(params.page))
            .set('pageSize', String(params.pageSize))
            .set('includeCounts', 'true')
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

