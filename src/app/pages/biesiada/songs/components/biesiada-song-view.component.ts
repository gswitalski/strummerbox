import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';
import { BiesiadaRepertoireSongDetailDto } from '../../../../../../packages/contracts/types';
import { SongDisplayComponent } from '../../../../shared/components/song-display/song-display.component';

/**
 * Komponent prezentacyjny wyświetlający piosenkę w trybie Biesiada.
 * Odpowiedzialny za:
 * - Wyświetlenie tytułu piosenki
 * - Renderowanie treści z akordami (ChordPro)
 * - Przyciski nawigacyjne (poprzednia/następna)
 * - Przycisk FAB do udostępniania
 */
@Component({
    selector: 'stbo-biesiada-song-view',
    standalone: true,
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatFabButton,
        SongDisplayComponent,
    ],
    templateUrl: './biesiada-song-view.component.html',
    styleUrl: './biesiada-song-view.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiesiadaSongViewComponent {
    /**
     * Dane piosenki do wyświetlenia
     */
    public readonly songData = input.required<BiesiadaRepertoireSongDetailDto>();

    /**
     * Event emitowany po kliknięciu przycisku "wstecz"
     */
    public readonly navigateBack = output<void>();

    /**
     * Event emitowany po kliknięciu przycisku "Poprzednia"
     * Emituje songId poprzedniej piosenki
     */
    public readonly navigatePrevious = output<string>();

    /**
     * Event emitowany po kliknięciu przycisku "Następna"
     * Emituje songId następnej piosenki
     */
    public readonly navigateNext = output<string>();

    /**
     * Event emitowany po kliknięciu przycisku FAB (udostępnianie)
     * Emituje dane potrzebne do dialogu udostępniania
     */
    public readonly showQrCode = output<{
        title: string;
        publicUrl: string;
        qrPayload: string;
    }>();

    /**
     * Sprawdza czy istnieje poprzednia piosenka
     */
    get hasPrevious(): boolean {
        return this.songData().order.previous !== null;
    }

    /**
     * Sprawdza czy istnieje następna piosenka
     */
    get hasNext(): boolean {
        return this.songData().order.next !== null;
    }

    /**
     * Obsługa kliknięcia przycisku "wstecz"
     */
    onBackClick(): void {
        this.navigateBack.emit();
    }

    /**
     * Obsługa kliknięcia przycisku "Poprzednia"
     */
    onPreviousClick(): void {
        const previous = this.songData().order.previous;
        if (previous) {
            this.navigatePrevious.emit(previous.songId);
        }
    }

    /**
     * Obsługa kliknięcia przycisku "Następna"
     */
    onNextClick(): void {
        const next = this.songData().order.next;
        if (next) {
            this.navigateNext.emit(next.songId);
        }
    }

    /**
     * Obsługa kliknięcia przycisku FAB (udostępnianie)
     */
    onShareClick(): void {
        const data = this.songData();
        this.showQrCode.emit({
            title: data.title,
            publicUrl: data.share.publicUrl,
            qrPayload: data.share.qrPayload,
        });
    }
}



