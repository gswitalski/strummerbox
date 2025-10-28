import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { QRCodeComponent } from 'angularx-qrcode';
import { ShareDialogData } from '../../models/share-dialog.model';

/**
 * Okno modalne do wyświetlania informacji o udostępnieniu zasobu.
 * Wyświetla publiczny link, kod QR i umożliwia kopiowanie linku do schowka.
 */
@Component({
    selector: 'stbo-share-dialog',
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        QRCodeComponent
    ],
    templateUrl: './share-dialog.component.html',
    styleUrl: './share-dialog.component.scss'
})
export class ShareDialogComponent {
    readonly dialogRef = inject(MatDialogRef<ShareDialogComponent>);
    readonly data = inject<ShareDialogData>(MAT_DIALOG_DATA);
    private readonly clipboard = inject(Clipboard);
    private readonly snackBar = inject(MatSnackBar);

    /**
     * Kopiuje publiczny URL do schowka i wyświetla komunikat zwrotny.
     */
    copyToClipboard(): void {
        const success = this.clipboard.copy(this.data.publicUrl);

        if (success) {
            this.snackBar.open('Link skopiowano do schowka', 'OK', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
            });
        } else {
            this.snackBar.open('Nie udało się skopiować linku', 'OK', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
            });
        }
    }

    /**
     * Zamyka okno dialogowe.
     */
    close(): void {
        this.dialogRef.close();
    }
}
