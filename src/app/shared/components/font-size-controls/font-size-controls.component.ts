import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FontSize, FONT_SIZE_OPTIONS } from '../../models/font-size.model';

/**
 * Reużywalny komponent prezentacyjny do wyboru wielkości czcionki.
 * Wyświetla trzy przyciski toggle z predefiniowanymi opcjami rozmiaru.
 * Komponent jest w pełni sterowany (controlled) - nie posiada własnego stanu wewnętrznego.
 *
 * @example
 * ```html
 * <stbo-font-size-controls
 *   [selectedSize]="fontSize()"
 *   (sizeChanged)="onFontSizeChanged($event)">
 * </stbo-font-size-controls>
 * ```
 */
@Component({
    selector: 'stbo-font-size-controls',
    standalone: true,
    imports: [MatButtonToggleModule],
    template: `
        <mat-button-toggle-group
            class="font-size-controls"
            [value]="selectedSize"
            (change)="onSelectionChange($event.value)"
            aria-label="Wybór wielkości czcionki">
            @for (option of fontSizeOptions; track option.key) {
                <mat-button-toggle
                    [value]="option.key"
                    [attr.aria-label]="'Wielkość czcionki: ' + getSizeLabel(option.key)">
                    <span [class]="'font-size-controls__label font-size-controls__label--' + option.key">
                        {{ option.label }}
                    </span>
                </mat-button-toggle>
            }
        </mat-button-toggle-group>
    `,
    styles: [`
        .font-size-controls {
            --mat-standard-button-toggle-height: 36px;
        }

        .font-size-controls__label {
            font-weight: 500;
            transition: font-size 0.2s ease;
        }

        .font-size-controls__label--small {
            font-size: 12px;
        }

        .font-size-controls__label--medium {
            font-size: 16px;
        }

        .font-size-controls__label--large {
            font-size: 20px;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontSizeControlsComponent {
    /**
     * Aktualnie wybrana wielkość czcionki
     */
    @Input() selectedSize: FontSize = 'small';

    /**
     * Zdarzenie emitowane po zmianie wybranej wielkości czcionki
     */
    @Output() sizeChanged = new EventEmitter<FontSize>();

    /**
     * Tablica opcji wielkości czcionek do wyświetlenia
     */
    readonly fontSizeOptions = Object.values(FONT_SIZE_OPTIONS);

    /**
     * Obsługuje zmianę wyboru w button toggle group
     * @param value - Nowa wybrana wielkość czcionki
     */
    onSelectionChange(value: FontSize): void {
        this.sizeChanged.emit(value);
    }

    /**
     * Zwraca czytelną etykietę dla danej wielkości czcionki
     * @param size - Wielkość czcionki
     * @returns Polska etykieta rozmiaru
     */
    getSizeLabel(size: FontSize): string {
        const labels: Record<FontSize, string> = {
            small: 'mała',
            medium: 'średnia',
            large: 'duża',
        };
        return labels[size];
    }
}

