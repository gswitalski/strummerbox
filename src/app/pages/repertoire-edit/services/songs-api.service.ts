import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { SongListResponseDto } from '../../../../../packages/contracts/types';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';

interface SupabaseSession {
    access_token: string;
}

@Injectable()
export class SongsApiService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);

    private readonly baseUrl = `${environment.supabase.url}/functions/v1/songs` as const;

    /**
     * Pobiera wszystkie piosenki użytkownika
     * Bez parametru pageSize endpoint zwraca wszystkie piosenki
     */
    public async getAllSongs(): Promise<SongListResponseDto> {
        const session = await this.getSession();

        const params = new HttpParams()
            .set('page', '1')
            .set('sort', 'title');

        const response = await firstValueFrom(
            this.http.get<SongListResponseDto | { data: SongListResponseDto }>(this.baseUrl, {
                params,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        );

        // API może zwracać dane bezpośrednio lub w { data: ... }
        if (response && typeof response === 'object') {
            if ('data' in response && response.data) {
                return response.data as SongListResponseDto;
            }
            return response as SongListResponseDto;
        }

        throw new Error('Invalid API response structure');
    }

    private async getSession(): Promise<SupabaseSession> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }
}

