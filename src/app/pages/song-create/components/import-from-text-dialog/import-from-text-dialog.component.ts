import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ChordConverterService } from '../../../../core/services/chord-converter.service';

/**
 * Dialog do importu piosenki z formatu "akordy nad tekstem" do ChordPro.
 * Pozwala użytkownikowi wkleić tekst, który zostanie automatycznie przekonwertowany.
 */
@Component({
    selector: 'stbo-import-from-text-dialog',
    standalone: true,
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
    ],
    templateUrl: './import-from-text-dialog.component.html',
    styleUrl: './import-from-text-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFromTextDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<ImportFromTextDialogComponent>);
    private readonly chordConverterService = inject(ChordConverterService);

    public readonly inputText = signal<string>('');

    /**
     * Obsługuje anulowanie - zamyka dialog bez zwracania danych.
     */
    public onCancel(): void {
        this.dialogRef.close();
    }

    /**
     * Obsługuje import - konwertuje tekst i zamyka dialog zwracając wynik.
     */
    public onImport(): void {
        const text = this.inputText();
        
        if (!text || text.trim().length === 0) {
            this.dialogRef.close();
            return;
        }

        const convertedText = this.chordConverterService.convertFromChordsOverText(text);
        this.dialogRef.close(convertedText);
    }

    /**
     * Obsługuje zmianę wartości w textarea.
     */
    public onTextChange(value: string): void {
        this.inputText.set(value);
    }

    /**
     * Sprawdza, czy przycisk importu powinien być wyłączony.
     */
    public isImportDisabled(): boolean {
        return !this.inputText() || this.inputText().trim().length === 0;
    }
}

