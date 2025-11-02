import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import type {
    BiesiadaRepertoireListResponseDto,
    BiesiadaRepertoireSongListResponseDto,
    BiesiadaRepertoireSongDetailDto,
} from '../../../../packages/contracts/types';

interface SupabaseSession {
    access_token: string;
}

/**
 * Serwis do obsługi trybu Biesiada dla zalogowanych organizatorów.
 * Zapewnia metody do pobierania repertuarów, piosenek oraz szczegółów piosenek
 * w kontekście prowadzenia biesiady.
 */
@Injectable({
    providedIn: 'root',
})
export class BiesiadaService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);
    private readonly baseUrl = `${environment.supabase.url}/functions/v1` as const;

    /**
     * Pobiera listę repertuarów organizatora dla trybu Biesiada.
     * @returns Observable zawierający listę repertuarów
     */
    getRepertoires(): Observable<BiesiadaRepertoireListResponseDto> {
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.http.get<{ data: BiesiadaRepertoireListResponseDto } | BiesiadaRepertoireListResponseDto>(
                    `${this.baseUrl}/me/biesiada/repertoires`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                )
            ),
            map((response) => {
                // API może zwracać dane bezpośrednio lub w { data: ... }
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data;
                }
                return response as BiesiadaRepertoireListResponseDto;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('BiesiadaService: Error fetching repertoires', {
                    status: error.status,
                    message: error.message,
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Pobiera listę piosenek w danym repertuarze dla trybu Biesiada.
     * @param repertoireId - UUID repertuaru
     * @returns Observable zawierający listę piosenek z metadanymi repertuaru
     */
    getRepertoireSongs(
        repertoireId: string
    ): Observable<BiesiadaRepertoireSongListResponseDto> {
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.http.get<{ data: BiesiadaRepertoireSongListResponseDto } | BiesiadaRepertoireSongListResponseDto>(
                    `${this.baseUrl}/me/biesiada/repertoires/${repertoireId}/songs`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                )
            ),
            map((response) => {
                // API może zwracać dane bezpośrednio lub w { data: ... }
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data;
                }
                return response as BiesiadaRepertoireSongListResponseDto;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('BiesiadaService: Error fetching repertoire songs', {
                    repertoireId,
                    status: error.status,
                    message: error.message,
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Pobiera szczegóły piosenki w kontekście repertuaru dla trybu Biesiada.
     * Zawiera pełną treść z akordami, nawigację oraz dane do udostępniania.
     * @param repertoireId - UUID repertuaru
     * @param songId - UUID piosenki
     * @returns Observable zawierający szczegóły piosenki
     */
    getSongDetails(
        repertoireId: string,
        songId: string
    ): Observable<BiesiadaRepertoireSongDetailDto> {
        return from(this.getSession()).pipe(
            switchMap((session) =>
                this.http.get<{ data: BiesiadaRepertoireSongDetailDto } | BiesiadaRepertoireSongDetailDto>(
                    `${this.baseUrl}/me/biesiada/repertoires/${repertoireId}/songs/${songId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                )
            ),
            map((response) => {
                // API może zwracać dane bezpośrednio lub w { data: ... }
                if (response && typeof response === 'object' && 'data' in response) {
                    return response.data;
                }
                return response as BiesiadaRepertoireSongDetailDto;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('BiesiadaService: Error fetching song details', {
                    repertoireId,
                    songId,
                    status: error.status,
                    message: error.message,
                });
                return throwError(() => error);
            })
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

