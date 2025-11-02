import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { BiesiadaRepertoireSongListViewModel } from '../models/biesiada-repertoire-song-list.types';
import type { BiesiadaRepertoireSongListResponseDto } from '../../../../../../../packages/contracts/types';
import { environment } from '../../../../../../environments/environment';
import { SupabaseService } from '../../../../../core/services/supabase.service';

interface SupabaseSession {
    access_token: string;
}

const initialState: BiesiadaRepertoireSongListViewModel = {
    repertoireId: null,
    repertoireName: null,
    songs: [],
    share: null,
    isLoading: false,
    error: null,
};

/**
 * Service managing state and API communication for Biesiada Repertoire Song List.
 * Uses Angular signals for reactive state management.
 */
@Injectable({
    providedIn: 'root',
})
export class BiesiadaRepertoireSongListService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    
    private readonly _state = signal<BiesiadaRepertoireSongListViewModel>(initialState);

    /**
     * Public readonly signal exposing the current view model state.
     */
    readonly vm = this._state.asReadonly();

    /**
     * Fetches the list of songs for a specific repertoire from the API.
     * Updates the state signal based on the response.
     */
    async fetchRepertoireSongs(repertoireId: string): Promise<void> {
        // Set loading state
        this._state.update(state => ({
            ...state,
            isLoading: true,
            error: null,
        }));

        try {
            const session = await this.getSession();
            const apiUrl = `${environment.supabase.url}/functions/v1/me/biesiada/repertoires/${repertoireId}/songs`;
            
            const response = await firstValueFrom(
                this.http.get<BiesiadaRepertoireSongListResponseDto>(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            );

            // Update state with fetched data
            this._state.update(state => ({
                ...state,
                repertoireId: response.repertoireId,
                repertoireName: response.repertoireName,
                songs: response.songs,
                share: response.share,
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            // Update state with error
            this._state.update(state => ({
                ...state,
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : 'Nie udało się pobrać listy piosenek. Spróbuj ponownie.',
            }));
        }
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
     * Resets the service state to initial values.
     */
    reset(): void {
        this._state.set(initialState);
    }
}

