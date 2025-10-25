import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
    RepertoireDto,
    RepertoireCreateCommand,
    RepertoireUpdateCommand,
    RepertoireAddSongsCommand,
    RepertoireAddSongsResponseDto,
    RepertoireRemoveSongResponseDto,
    RepertoireReorderCommand,
    RepertoireReorderResponseDto,
} from '../../../../../packages/contracts/types';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/services/supabase.service';

interface SupabaseSession {
    access_token: string;
}

@Injectable()
export class RepertoiresApiService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);

    private readonly baseUrl = `${environment.supabase.url}/functions/v1/repertoires` as const;

    /**
     * Tworzy nowy repertuar
     */
    public async createRepertoire(command: RepertoireCreateCommand): Promise<RepertoireDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.post<RepertoireDto | { data: RepertoireDto }>(
                this.baseUrl,
                command,
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
     * Pobiera szczegóły repertuaru
     */
    public async getRepertoire(id: string): Promise<RepertoireDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.get<RepertoireDto | { data: RepertoireDto }>(`${this.baseUrl}/${id}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            })
        );

        // API może zwracać dane bezpośrednio lub w { data: ... }
        if (response && typeof response === 'object') {
            // Sprawdź czy odpowiedź ma strukturę { data: ... }
            if ('data' in response && response.data) {
                return response.data as RepertoireDto;
            }
            // Jeśli nie, zwróć bezpośrednio
            return response as RepertoireDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Aktualizuje nazwę lub opis repertuaru
     */
    public async updateRepertoire(
        id: string,
        command: RepertoireUpdateCommand
    ): Promise<RepertoireDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.patch<RepertoireDto | { data: RepertoireDto }>(
                `${this.baseUrl}/${id}`,
                command,
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
     * Dodaje piosenki do repertuaru
     */
    public async addSongs(
        id: string,
        command: RepertoireAddSongsCommand
    ): Promise<RepertoireAddSongsResponseDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.post<RepertoireAddSongsResponseDto | { data: RepertoireAddSongsResponseDto }>(
                `${this.baseUrl}/${id}/songs`,
                command,
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
                return response.data as RepertoireAddSongsResponseDto;
            }
            return response as RepertoireAddSongsResponseDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Usuwa piosenkę z repertuaru
     */
    public async removeSong(
        id: string,
        repertoireSongId: string
    ): Promise<RepertoireRemoveSongResponseDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.delete<RepertoireRemoveSongResponseDto | { data: RepertoireRemoveSongResponseDto }>(
                `${this.baseUrl}/${id}/songs/${repertoireSongId}`,
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
                return response.data as RepertoireRemoveSongResponseDto;
            }
            return response as RepertoireRemoveSongResponseDto;
        }

        throw new Error('Invalid API response structure');
    }

    /**
     * Zmienia kolejność piosenek w repertuarze
     */
    public async reorderSongs(
        id: string,
        command: RepertoireReorderCommand
    ): Promise<RepertoireReorderResponseDto> {
        const session = await this.getSession();

        const response = await firstValueFrom(
            this.http.post<RepertoireReorderResponseDto | { data: RepertoireReorderResponseDto }>(
                `${this.baseUrl}/${id}/songs/reorder`,
                command,
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
                return response.data as RepertoireReorderResponseDto;
            }
            return response as RepertoireReorderResponseDto;
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

