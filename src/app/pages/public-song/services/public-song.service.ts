import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { PublicSongDto } from '../../../../../packages/contracts/types';

/**
 * Serwis do pobierania publicznych piosenek dla niezalogowanych użytkowników.
 * Endpoint nie wymaga autoryzacji.
 */
@Injectable({
    providedIn: 'root',
})
export class PublicSongService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1/songs/public` as const;

    /**
     * Pobiera publiczną piosenkę na podstawie publicId.
     *
     * @param publicId - Publiczny identyfikator piosenki
     * @returns Observable z danymi piosenki (z akordami)
     *
     * @throws HttpErrorResponse
     * - 404: Piosenka nie została znaleziona
     * - 410: Piosenka nie jest już dostępna (unpublished)
     * - 5xx: Błąd serwera
     */
    public getSongByPublicId(publicId: string): Observable<PublicSongDto> {
        return this.http
            .get<{ data: PublicSongDto } | PublicSongDto>(`${this.baseUrl}/${publicId}`, {
                headers: {
                    Authorization: `Bearer ${environment.supabase.anonKey}`,
                    apikey: environment.supabase.anonKey,
                },
            })
            .pipe(
                map((response) => {
                    // API może zwracać dane bezpośrednio lub w { data: ... }
                    if (response && typeof response === 'object' && 'data' in response) {
                        return response.data;
                    }
                    return response as PublicSongDto;
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('PublicSongService: Error fetching song', {
                        publicId,
                        status: error.status,
                        message: error.message,
                    });
                    return throwError(() => error);
                })
            );
    }
}

