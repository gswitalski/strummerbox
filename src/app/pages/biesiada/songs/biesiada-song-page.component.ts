import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BiesiadaSongPageService } from './services/biesiada-song-page.service';
import { BiesiadaSongViewComponent } from './components/biesiada-song-view.component';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import { ShareDialogData } from '../../../shared/models/share-dialog.model';
import { BiesiadaRepertoireSongDetailDto } from '../../../../../packages/contracts/types';

/**
 * Główny komponent routowalny dla widoku piosenki w trybie Biesiada.
 * Odpowiedzialny za:
 * - Odczytanie parametrów z URL (repertoireId, songId)
 * - Zarządzanie stanem widoku przez serwis
 * - Obsługę nawigacji między piosenkami
 * - Obsługę interakcji użytkownika (wstecz, nawigacja, udostępnianie)
 */
@Component({
    selector: 'stbo-biesiada-song-page',
    standalone: true,
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        BiesiadaSongViewComponent,
    ],
    templateUrl: './biesiada-song-page.component.html',
    styleUrl: './biesiada-song-page.component.scss',
    providers: [BiesiadaSongPageService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaSongPageComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly pageService = inject(BiesiadaSongPageService);
    private readonly dialog = inject(MatDialog);
    private readonly destroy$ = new Subject<void>();

    /**
     * ViewModel eksponowany z serwisu
     */
    public readonly viewModel = this.pageService.viewModel;

    /**
     * Repertoire ID z URL - używany do nawigacji wstecz
     */
    public readonly repertoireId = signal<string | null>(null);

    /**
     * Getter zwracający dane piosenki tylko gdy są załadowane (bez null)
     */
    get loadedSongData(): BiesiadaRepertoireSongDetailDto | null {
        const vm = this.viewModel();
        return vm.state === 'loaded' ? vm.data : null;
    }

    ngOnInit(): void {
        // Subskrybuj się do zmian parametrów URL - dzięki temu komponent reaguje
        // na nawigację między piosenkami bez przeładowania całego komponentu
        this.route.params
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const repertoireId = params['repertoireId'];
                const songId = params['songId'];

                // Walidacja parametrów
                if (!repertoireId || !songId) {
                    this.router.navigate(['/biesiada/repertoires']);
                    return;
                }

                // Zapisz repertoireId do sygnału dla nawigacji wstecz
                this.repertoireId.set(repertoireId);

                // Załaduj dane piosenki
                this.pageService.loadSong(repertoireId, songId);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Obsługa nawigacji wstecz do listy piosenek repertuaru
     */
    handleNavigateBack(): void {
        const repId = this.repertoireId();
        if (repId) {
            this.router.navigate(['/biesiada/repertoires', repId]);
        }
    }

    /**
     * Obsługa nawigacji do poprzedniej piosenki
     */
    handleNavigatePrevious(previousSongId: string): void {
        const repId = this.repertoireId();
        if (repId && previousSongId) {
            this.router.navigate([
                '/biesiada/repertoires',
                repId,
                'songs',
                previousSongId,
            ]);
        }
    }

    /**
     * Obsługa nawigacji do następnej piosenki
     */
    handleNavigateNext(nextSongId: string): void {
        const repId = this.repertoireId();
        if (repId && nextSongId) {
            this.router.navigate([
                '/biesiada/repertoires',
                repId,
                'songs',
                nextSongId,
            ]);
        }
    }

    /**
     * Obsługa pokazania kodu QR
     */
    handleShowQrCode(title: string, publicUrl: string, qrPayload: string): void {
        const dialogData: ShareDialogData = {
            title: `Udostępnij piosenkę "${title}"`,
            publicUrl,
            qrPayload,
        };

        this.dialog.open(ShareDialogComponent, {
            data: dialogData,
            width: '400px',
            maxWidth: '90vw',
        });
    }

    /**
     * Obsługa ponownego ładowania danych (w przypadku błędu)
     */
    handleRetry(): void {
        const params = this.route.snapshot.params;
        const repertoireId = params['repertoireId'];
        const songId = params['songId'];

        if (repertoireId && songId) {
            this.pageService.loadSong(repertoireId, songId);
        }
    }
}

