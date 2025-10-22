import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
    SongCreateCommand,
    SongDto,
    SongPatchCommand,
} from '../../../../../packages/contracts/types';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';

interface SupabaseSession {
    access_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class SongsApiService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);

    private readonly baseUrl = `${environment.supabase.url}/functions/v1/songs` as const;

    public async createSong(command: SongCreateCommand): Promise<SongDto> {
        const session = await this.getSession();

        return await firstValueFrom(
            this.http.post<{ data: SongDto }>(this.baseUrl, command, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        ).then((response) => response.data);
    }

    public async getSong(id: string): Promise<SongDto> {
        const session = await this.getSession();

        return await firstValueFrom(
            this.http.get<{ data: SongDto }>(`${this.baseUrl}/${id}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        ).then((response) => response.data);
    }

    public async updateSong(
        id: string,
        command: SongPatchCommand
    ): Promise<SongDto> {
        const session = await this.getSession();

        return await firstValueFrom(
            this.http.patch<{ data: SongDto }>(
                `${this.baseUrl}/${id}`,
                command,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            )
        ).then((response) => response.data);
    }

    private async getSession(): Promise<SupabaseSession> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }
}

