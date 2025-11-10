import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { PublicRepertoireDto, PublicRepertoireSongDto } from '../../../../../packages/contracts/types';

/**
 * Serwis do pobierania publicznych repertuarów dla niezalogowanych użytkowników.
 * Endpoint nie wymaga autoryzacji.
 */
@Injectable({
    providedIn: 'root',
})
export class PublicRepertoireService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1/public/repertoires` as const;

    /**
     * Pobiera publiczny repertuar na podstawie publicId.
     *
     * @param publicId - Publiczny identyfikator repertuaru
     * @returns Observable z danymi repertuaru (lista piosenek z publicznymi URL-ami)
     *
     * @throws HttpErrorResponse
     * - 404: Repertuar nie został znaleziony
     * - 410: Repertuar nie jest już dostępny (unpublished)
     * - 5xx: Błąd serwera
     */
    public getRepertoireByPublicId(publicId: string): Observable<PublicRepertoireDto> {
        return this.http
            .get<{ data: PublicRepertoireDto } | PublicRepertoireDto>(`${this.baseUrl}/${publicId}`, {
                headers: {
                    Authorization: `Bearer ${environment.supabase.anonKey}`,
                    apikey: environment.supabase.anonKey,
                    // Wyłącz cache przeglądarki - zapobiega cachowaniu odpowiedzi błędów (np. 410)
                    // gdy repertuar zostanie odpublikowany i opublikowany ponownie
                    // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                    // 'Pragma': 'no-cache',
                    // 'Expires': '0',
                },
            })
            .pipe(
                map((response) => {
                    // API może zwracać dane bezpośrednio lub w { data: ... }
                    if (response && typeof response === 'object' && 'data' in response) {
                        return response.data;
                    }
                    return response as PublicRepertoireDto;
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('PublicRepertoireService: Error fetching repertoire', {
                        publicId,
                        status: error.status,
                        message: error.message,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Pobiera publiczną piosenkę w kontekście repertuaru.
     *
     * @param repertoirePublicId - Publiczny identyfikator repertuaru
     * @param songPublicId - Publiczny identyfikator piosenki
     * @returns Observable z danymi piosenki w kontekście repertuaru (z nawigacją)
     *
     * @throws HttpErrorResponse
     * - 404: Piosenka lub repertuar nie zostały znalezione
     * - 410: Piosenka lub repertuar nie są już dostępne (unpublished)
     * - 5xx: Błąd serwera
     */
    public getRepertoireSong(
        repertoirePublicId: string,
        songPublicId: string
    ): Observable<PublicRepertoireSongDto> {
        return this.http
            .get<{ data: PublicRepertoireSongDto } | PublicRepertoireSongDto>(
                `${this.baseUrl}/${repertoirePublicId}/songs/${songPublicId}`,
                {
                    headers: {
                        Authorization: `Bearer ${environment.supabase.anonKey}`,
                        apikey: environment.supabase.anonKey,
                        // Wyłącz cache przeglądarki - zapobiega cachowaniu odpowiedzi błędów (np. 410)
                        // gdy piosenka/repertuar zostanie odpublikowany i opublikowany ponownie
                        // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                        // 'Pragma': 'no-cache',
                        // 'Expires': '0',
                    },
                }
            )
            .pipe(
                map((response) => {
                    // API może zwracać dane bezpośrednio lub w { data: ... }
                    if (response && typeof response === 'object' && 'data' in response) {
                        return response.data;
                    }
                    return response as PublicRepertoireSongDto;
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('PublicRepertoireService: Error fetching repertoire song', {
                        repertoirePublicId,
                        songPublicId,
                        status: error.status,
                        message: error.message,
                    });
                    return throwError(() => error);
                })
            );
    }
}

