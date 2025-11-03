import { Injectable, WritableSignal, computed, signal, inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BiesiadaSongApiService } from './biesiada-song-api.service';
import type { BiesiadaSongPageViewModel } from '../models/biesiada-song-page.types';

/**
 * Serwis zarządzający stanem widoku piosenki w trybie Biesiada.
 * Używa Angular Signals do reaktywnego zarządzania stanem.
 */
@Injectable()
export class BiesiadaSongPageService {
    private readonly apiService = inject(BiesiadaSongApiService);

    /**
     * Wewnętrzny, zapisywalny sygnał stanu
     */
    private readonly state: WritableSignal<BiesiadaSongPageViewModel> = signal({
        state: 'loading',
        data: null,
        error: null,
    });

    /**
     * Publiczny, tylko do odczytu sygnał stanu
     */
    public readonly viewModel = computed<BiesiadaSongPageViewModel>(() => this.state());

    /**
     * Ładuje dane piosenki z API
     * 
     * @param repertoireId - ID repertuaru
     * @param songId - ID piosenki
     */
    loadSong(repertoireId: string, songId: string): void {
        // Ustaw stan ładowania
        this.state.set({
            state: 'loading',
            data: null,
            error: null,
        });

        // Wykonaj zapytanie API
        this.apiService
            .getBiesiadaSong(repertoireId, songId)
            .pipe(
                tap((data) => {
                    // Sukces - ustaw stan załadowano
                    this.state.set({
                        state: 'loaded',
                        data,
                        error: null,
                    });
                }),
                catchError((error: HttpErrorResponse) => {
                    // Błąd - ustaw stan błędu z odpowiednim komunikatem
                    const errorMessage = this.getErrorMessage(error.status);
                    this.state.set({
                        state: 'error',
                        data: null,
                        error: errorMessage,
                    });
                    return of(null);
                })
            )
            .subscribe();
    }

    /**
     * Zwraca odpowiedni komunikat błędu na podstawie kodu HTTP
     */
    private getErrorMessage(statusCode: number): string {
        switch (statusCode) {
            case 404:
                return 'Nie znaleziono piosenki w tym repertuarze';
            case 401:
            case 403:
                return 'Brak uprawnień do wyświetlenia tej piosenki';
            case 410:
                return 'Ta piosenka nie jest już dostępna';
            default:
                return 'Wystąpił błąd serwera. Spróbuj ponownie później.';
        }
    }
}



