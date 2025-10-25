import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { RepertoireDto } from '../../../../../../packages/contracts/types';

type EditMode = 'name' | 'description' | null;

@Component({
    selector: 'stbo-repertoire-edit-header',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './repertoire-edit-header.component.html',
    styleUrls: ['./repertoire-edit-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireEditHeaderComponent {
    @Input({ required: true }) public repertoire!: Signal<RepertoireDto | null>;
    @Input({ required: true }) public isUpdating!: Signal<boolean>;

    @Output() public nameChange = new EventEmitter<string>();
    @Output() public descriptionChange = new EventEmitter<string>();

    // Stan lokalny dla edycji
    private readonly editModeState: WritableSignal<EditMode> = signal(null);
    private readonly editValueState: WritableSignal<string> = signal('');

    public readonly editMode: Signal<EditMode> = this.editModeState.asReadonly();
    public readonly editValue: Signal<string> = this.editValueState.asReadonly();

    /**
     * Rozpoczyna edycję nazwy
     */
    public startEditName(): void {
        const currentName = this.repertoire()?.name ?? '';
        this.editValueState.set(currentName);
        this.editModeState.set('name');
    }

    /**
     * Rozpoczyna edycję opisu
     */
    public startEditDescription(): void {
        const currentDescription = this.repertoire()?.description ?? '';
        this.editValueState.set(currentDescription);
        this.editModeState.set('description');
    }

    /**
     * Anuluje edycję
     */
    public cancelEdit(): void {
        this.editModeState.set(null);
        this.editValueState.set('');
    }

    /**
     * Zatwierdza edycję nazwy
     */
    public confirmNameEdit(): void {
        const newValue = this.editValueState().trim();

        // Walidacja: nazwa nie może być pusta
        if (newValue.length === 0) {
            return;
        }

        // Walidacja: nazwa nie może być dłuższa niż 160 znaków
        if (newValue.length > 160) {
            return;
        }

        // Sprawdź czy wartość się zmieniła
        if (newValue !== this.repertoire()?.name) {
            this.nameChange.emit(newValue);
        }

        this.cancelEdit();
    }

    /**
     * Zatwierdza edycję opisu
     */
    public confirmDescriptionEdit(): void {
        const newValue = this.editValueState().trim();

        // Sprawdź czy wartość się zmieniła
        if (newValue !== this.repertoire()?.description) {
            this.descriptionChange.emit(newValue);
        }

        this.cancelEdit();
    }

    /**
     * Aktualizuje wartość podczas edycji
     */
    public updateEditValue(value: string): void {
        this.editValueState.set(value);
    }

    /**
     * Sprawdza czy nazwa jest prawidłowa
     */
    public isNameValid(): boolean {
        const value = this.editValueState().trim();
        return value.length > 0 && value.length <= 160;
    }

    /**
     * Obsługuje naciśnięcie Enter w polu edycji
     */
    public onEnterKey(mode: EditMode): void {
        if (mode === 'name' && this.isNameValid()) {
            this.confirmNameEdit();
        } else if (mode === 'description') {
            // Dla opisu Enter nie zatwierdza (wieloliniowy)
        }
    }

    /**
     * Obsługuje naciśnięcie Escape w polu edycji
     */
    public onEscapeKey(): void {
        this.cancelEdit();
    }
}

