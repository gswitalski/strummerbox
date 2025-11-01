import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    WritableSignal,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PublicRepertoireService } from './services/public-repertoire.service';
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import type { PublicRepertoireState } from './public-repertoire.types';
import type { PublicRepertoireDto } from '../../../../packages/contracts/types';

/**
 * Główny komponent widoku publicznego repertuaru (smart component).
 * Odpowiedzialny za:
 * - Odczytanie parametru publicId z URL
 * - Pobranie danych repertuaru z API
 * - Zarządzanie stanem widoku
 * - Dynamiczne ustawianie metatagów
 * - Wyświetlanie listy piosenek z linkami
 */
@Component({
    selector: 'stbo-public-repertoire-view',
    standalone: true,
    imports: [
        MatProgressSpinnerModule,
        MatListModule,
        ErrorDisplayComponent,
    ],
    templateUrl: './public-repertoire.view.html',
    styleUrl: './public-repertoire.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRepertoireViewComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly publicRepertoireService = inject(PublicRepertoireService);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);

    /**
     * Stan komponentu zarządzany za pomocą sygnałów
     */
    public readonly state: WritableSignal<PublicRepertoireState> = signal({
        status: 'loading',
    });

    /**
     * Pomocnicze gettery dla type narrowing w template
     */
    get isLoading(): boolean {
        return this.state().status === 'loading';
    }

    get isLoaded(): boolean {
        return this.state().status === 'loaded';
    }

    get isError(): boolean {
        return this.state().status === 'error';
    }

    get loadedRepertoire(): PublicRepertoireDto | null {
        const currentState = this.state();
        return currentState.status === 'loaded' ? currentState.repertoire : null;
    }

    get errorData() {
        const currentState = this.state();
        return currentState.status === 'error' ? currentState.error : null;
    }

    ngOnInit(): void {
        // Pobierz publicId z parametrów trasy
        const publicId = this.route.snapshot.paramMap.get('publicId');

        if (!publicId) {
            this.handleError({
                status: 404,
                message: 'Brak identyfikatora repertuaru',
            } as HttpErrorResponse);
            return;
        }

        void this.loadRepertoire(publicId);
    }

    /**
     * Pobiera dane repertuaru z API
     */
    private async loadRepertoire(publicId: string): Promise<void> {
        this.state.set({ status: 'loading' });

        try {
            const dto: PublicRepertoireDto = await firstValueFrom(
                this.publicRepertoireService.getRepertoireByPublicId(publicId)
            );

            // Zaktualizuj stan
            this.state.set({
                status: 'loaded',
                repertoire: dto,
            });

            // Ustaw tytuł strony i metatagi
            this.updateMetaTags(dto.name);
        } catch (error) {
            this.handleError(error as HttpErrorResponse);
        }
    }

    /**
     * Obsługuje błędy API
     */
    private handleError(error: HttpErrorResponse): void {
        const code = error.status || 0;
        const message = this.getErrorMessage(code);

        this.state.set({
            status: 'error',
            error: { code, message },
        });

        // Ustaw ogólny tytuł dla błędów
        this.titleService.setTitle('Błąd - StrummerBox');
        this.metaService.updateTag({
            name: 'robots',
            content: 'noindex, nofollow',
        });
    }

    /**
     * Zwraca komunikat błędu na podstawie kodu HTTP
     */
    private getErrorMessage(code: number): string {
        switch (code) {
            case 404:
                return 'Nie znaleziono takiego repertuaru';
            case 410:
                return 'Ten repertuar nie jest już dostępny';
            default:
                return 'Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.';
        }
    }

    /**
     * Aktualizuje tytuł strony i metatagi
     */
    private updateMetaTags(repertoireName: string): void {
        this.titleService.setTitle(`${repertoireName} - StrummerBox`);
        this.metaService.updateTag({
            name: 'robots',
            content: 'noindex, nofollow',
        });
    }
}

