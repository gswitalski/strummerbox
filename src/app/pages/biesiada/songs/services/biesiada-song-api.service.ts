import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { BiesiadaRepertoireSongDetailDto } from '../../../../../../packages/contracts/types';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { environment } from '../../../../../environments/environment';

/**
 * Serwis API dla widoku piosenki w trybie Biesiada.
 * Odpowiedzialny za komunikację z backendem (Supabase Edge Functions).
 */
@Injectable({
    providedIn: 'root',
})
export class BiesiadaSongApiService {
    private readonly httpClient = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);

    /**
     * Pobiera szczegóły piosenki z repertuaru w trybie Biesiada
     * 
     * @param repertoireId - ID repertuaru
     * @param songId - ID piosenki
     * @returns Observable z danymi piosenki
     */
    getBiesiadaSong(
        repertoireId: string,
        songId: string
    ): Observable<BiesiadaRepertoireSongDetailDto> {
        const url = `${environment.supabase.url}/functions/v1/me/biesiada/repertoires/${repertoireId}/songs/${songId}`;
        
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.httpClient.get<BiesiadaRepertoireSongDetailDto>(url, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            )
        );
    }

    /**
     * Pobiera sesję użytkownika z Supabase
     */
    private async getSession(): Promise<{ access_token: string }> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }
}

