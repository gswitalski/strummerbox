import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

@Component({
    selector: 'stbo-confirmation-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
    ],
    templateUrl: './confirmation-dialog.component.html',
    styleUrl: './confirmation-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
    public readonly dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
    public readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

    public readonly confirmText = this.data.confirmButtonText ?? 'Potwierdź';
    public readonly cancelText = this.data.cancelButtonText ?? 'Anuluj';

    public onConfirm(): void {
        this.dialogRef.close(true);
    }

    public onCancel(): void {
        this.dialogRef.close(false);
    }
}

