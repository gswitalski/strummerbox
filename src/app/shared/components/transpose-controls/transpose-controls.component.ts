import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reużywalny komponent prezentacyjny do zmiany wartości transpozycji akordów.
 * Składa się z dwóch przycisków (-, +) oraz wyświetlacza aktualnego offsetu.
 *
 * @example
 * ```html
 * <stbo-transpose-controls
 *   [offset]="transposeOffset()"
 *   (offsetChange)="onTransposeChanged($event)">
 * </stbo-transpose-controls>
 * ```
 */
@Component({
    selector: 'stbo-transpose-controls',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    template: `
        <div class="transpose-controls">
            <button
                mat-icon-button
                type="button"
                class="transpose-controls__button"
                [disabled]="!canDecrement"
                (click)="decrement()"
                aria-label="Obniż tonację o półton">
                <mat-icon>remove</mat-icon>
            </button>
            <span class="transpose-controls__value" aria-live="polite">
                {{ formattedOffset }}
            </span>
            <button
                mat-icon-button
                type="button"
                class="transpose-controls__button"
                [disabled]="!canIncrement"
                (click)="increment()"
                aria-label="Podnieś tonację o półton">
                <mat-icon>add</mat-icon>
            </button>
        </div>
    `,
    styles: [`
        .transpose-controls {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .transpose-controls__value {
            min-width: 32px;
            text-align: center;
            font-weight: 500;
            font-size: 14px;
            font-variant-numeric: tabular-nums;
        }

        .transpose-controls__button {
            --mdc-icon-button-state-layer-size: 36px;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransposeControlsComponent {
    private static readonly MIN_OFFSET = -11;
    private static readonly MAX_OFFSET = 11;

    /**
     * Aktualna wartość przesunięcia tonacji
     */
    @Input() offset = 0;

    /**
     * Zdarzenie emitowane po zmianie wartości transpozycji
     */
    @Output() offsetChange = new EventEmitter<number>();

    /**
     * Sformatowana wartość offsetu z prefixem +/-
     */
    get formattedOffset(): string {
        if (this.offset === 0) {
            return '0';
        }
        return this.offset > 0 ? `+${this.offset}` : `${this.offset}`;
    }

    /**
     * Czy można zwiększyć offset (nie przekroczono maksimum)
     */
    get canIncrement(): boolean {
        return this.offset < TransposeControlsComponent.MAX_OFFSET;
    }

    /**
     * Czy można zmniejszyć offset (nie przekroczono minimum)
     */
    get canDecrement(): boolean {
        return this.offset > TransposeControlsComponent.MIN_OFFSET;
    }

    /**
     * Zwiększa offset o 1 (transpozycja w górę o półton)
     */
    increment(): void {
        if (this.canIncrement) {
            this.offsetChange.emit(this.offset + 1);
        }
    }

    /**
     * Zmniejsza offset o 1 (transpozycja w dół o półton)
     */
    decrement(): void {
        if (this.canDecrement) {
            this.offsetChange.emit(this.offset - 1);
        }
    }
}

