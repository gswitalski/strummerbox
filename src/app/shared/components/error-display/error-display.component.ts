import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reużywalny komponent do wyświetlania komunikatów błędów.
 * Automatycznie dostosowuje komunikat na podstawie kodu błędu HTTP.
 */
@Component({
    selector: 'stbo-error-display',
    standalone: true,
    imports: [MatIconModule],
    templateUrl: './error-display.component.html',
    styleUrl: './error-display.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDisplayComponent {
    /**
     * Kod błędu HTTP (np. 404, 410, 500)
     */
    @Input({ required: true }) code!: number;

    /**
     * Opcjonalna niestandardowa wiadomość błędu
     */
    @Input() message?: string;

    /**
     * Zwraca komunikat błędu na podstawie kodu HTTP
     */
    get errorMessage(): string {
        if (this.message) {
            return this.message;
        }

        switch (this.code) {
            case 404:
                return 'Nie znaleziono piosenki';
            case 410:
                return 'Ta piosenka nie jest już dostępna';
            case 500:
            case 502:
            case 503:
                return 'Wystąpił błąd serwera. Spróbuj ponownie później.';
            case 0:
                return 'Brak połączenia z internetem. Sprawdź swoje połączenie.';
            default:
                return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
        }
    }

    /**
     * Zwraca nazwę ikony Material na podstawie kodu błędu
     */
    get errorIcon(): string {
        switch (this.code) {
            case 404:
                return 'search_off';
            case 410:
                return 'block';
            case 0:
                return 'cloud_off';
            default:
                return 'error_outline';
        }
    }
}

