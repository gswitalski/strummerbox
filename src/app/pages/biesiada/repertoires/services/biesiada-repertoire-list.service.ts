import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BiesiadaRepertoireListResponseDto } from '../../../../../../packages/contracts/types';
import { BiesiadaRepertoireListViewModel } from '../models/biesiada-repertoire-list.types';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface SupabaseSession {
    access_token: string;
}

/**
 * Service managing state and API communication for Biesiada Repertoire List.
 * Uses Angular signals for reactive state management.
 */
@Injectable({
    providedIn: 'root',
})
export class BiesiadaRepertoireListService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    private readonly apiUrl = `${environment.supabase.url}/functions/v1/me/biesiada/repertoires` as const;

    /**
     * Private writable signal holding the view model state.
     */
    private readonly _state = signal<BiesiadaRepertoireListViewModel>({
        repertoires: [],
        isLoading: false,
        error: null,
    });

    /**
     * Public readonly signal exposing the current view model state.
     */
    readonly vm = this._state.asReadonly();

    /**
     * Fetches the list of repertoires from the API.
     * Updates the state signal based on the response.
     */
    async fetchRepertoires(): Promise<void> {
        // Set loading state
        this._state.update((state) => ({
            ...state,
            isLoading: true,
            error: null,
        }));

        try {
            const session = await this.getSession();
            
            const response = await firstValueFrom(
                this.http.get<BiesiadaRepertoireListResponseDto>(this.apiUrl, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            );

            // Update state with fetched data
            this._state.update((state) => ({
                ...state,
                repertoires: response.items,
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            // Update state with error
            this._state.update((state) => ({
                ...state,
                repertoires: [],
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
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
        this._state.set({
            repertoires: [],
            isLoading: false,
            error: null,
        });
    }
}

