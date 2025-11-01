import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { PublicRepertoireDto } from '../../../../../packages/contracts/types';

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
}

