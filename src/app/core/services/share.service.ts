import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import type { SongShareMetaDto, RepertoireShareMetaDto } from '../../../../packages/contracts/types';

interface SupabaseSession {
    access_token: string;
}

/**
 * Serwis do obsługi udostępniania piosenek i repertuarów.
 * Zapewnia metody do pobierania metadanych potrzebnych do generowania linków i kodów QR.
 */
@Injectable({
    providedIn: 'root'
})
export class ShareService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1` as const;

    /**
     * Pobiera metadane do udostępniania piosenki.
     * @param songId - ID piosenki do udostępnienia
     * @returns Observable zawierający metadane udostępniania piosenki
     */
    getSongShareMeta(songId: string): Observable<SongShareMetaDto> {
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.http.get<{ data: SongShareMetaDto }>(`${this.baseUrl}/share/songs/${songId}`, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            ),
            switchMap((response) => [response.data])
        );
    }

    /**
     * Pobiera metadane do udostępniania repertuaru.
     * @param repertoireId - ID repertuaru do udostępnienia
     * @returns Observable zawierający metadane udostępniania repertuaru
     */
    getRepertoireShareMeta(repertoireId: string): Observable<RepertoireShareMetaDto> {
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.http.get<{ data: RepertoireShareMetaDto }>(`${this.baseUrl}/share/repertoires/${repertoireId}`, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            ),
            switchMap((response) => [response.data])
        );
    }

    /**
     * Pobiera aktywną sesję użytkownika z Supabase.
     * @private
     * @throws Error jeśli brak aktywnej sesji
     */
    private async getSession(): Promise<SupabaseSession> {
        const { data, error } = await this.supabase.auth.getSession();

        if (error || !data.session) {
            throw new Error('Brak aktywnej sesji.');
        }

        return data.session;
    }
}

