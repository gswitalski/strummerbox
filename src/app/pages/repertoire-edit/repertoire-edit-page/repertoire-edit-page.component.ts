import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Signal,
    inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { RepertoireDto } from '../../../../../packages/contracts/types';
import type {
    RepertoireSongViewModel,
    AvailableSongViewModel,
} from '../models/repertoire-edit.types';
import { RepertoireEditStateService } from '../services/repertoire-edit-state.service';
import { RepertoiresApiService } from '../services/repertoires-api.service';
import { SongsApiService } from '../services/songs-api.service';
import { RepertoireEditHeaderComponent } from '../components/repertoire-edit-header/repertoire-edit-header.component';
import { RepertoireSongListComponent } from '../components/repertoire-song-list/repertoire-song-list.component';
import { AvailableSongListComponent } from '../components/available-song-list/available-song-list.component';

@Component({
    selector: 'stbo-repertoire-edit-page',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatButtonModule,
        MatIconModule,
        RepertoireEditHeaderComponent,
        RepertoireSongListComponent,
        AvailableSongListComponent,
    ],
    providers: [
        RepertoireEditStateService,
        RepertoiresApiService,
        SongsApiService,
    ],
    templateUrl: './repertoire-edit-page.component.html',
    styleUrls: ['./repertoire-edit-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepertoireEditPageComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);
    private readonly stateService = inject(RepertoireEditStateService);

    // Publiczne sygnały dla szablonu
    public readonly repertoire: Signal<RepertoireDto | null> = this.stateService.repertoire;
    public readonly isLoading: Signal<boolean> = this.stateService.isLoading;
    public readonly isUpdatingHeader: Signal<boolean> = this.stateService.isUpdatingHeader;
    public readonly error: Signal<string | null> = this.stateService.error;
    public readonly repertoireSongs: Signal<RepertoireSongViewModel[]> = this.stateService.repertoireSongs;
    public readonly availableSongs: Signal<AvailableSongViewModel[]> = this.stateService.availableSongs;
    public readonly addingSongId: Signal<string | null> = this.stateService.addingSongId;
    public readonly removingSongId: Signal<string | null> = this.stateService.removingSongId;

    public ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            void this.router.navigate(['/management/repertoires']);
            return;
        }

        void this.loadData(id);
    }

    public async onNameChange(name: string): Promise<void> {
        try {
            await this.stateService.updateName(name);
            this.snackBar.open('Nazwa repertuaru została zaktualizowana.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireEditPageComponent: onNameChange error', error);
            this.snackBar.open(
                'Nie udało się zaktualizować nazwy repertuaru.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public async onDescriptionChange(description: string): Promise<void> {
        try {
            await this.stateService.updateDescription(description);
            this.snackBar.open('Opis repertuaru został zaktualizowany.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireEditPageComponent: onDescriptionChange error', error);
            this.snackBar.open(
                'Nie udało się zaktualizować opisu repertuaru.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public async onSongAdded(songId: string): Promise<void> {
        try {
            await this.stateService.addSong(songId);
            this.snackBar.open('Piosenka została dodana do repertuaru.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireEditPageComponent: onSongAdded error', error);
            this.snackBar.open(
                'Nie udało się dodać piosenki do repertuaru.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public async onSongRemoved(repertoireSongId: string): Promise<void> {
        try {
            await this.stateService.removeSong(repertoireSongId);
            this.snackBar.open('Piosenka została usunięta z repertuaru.', undefined, {
                duration: 3000,
            });
        } catch (error) {
            console.error('RepertoireEditPageComponent: onSongRemoved error', error);
            this.snackBar.open(
                'Nie udało się usunąć piosenki z repertuaru.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public async onOrderChanged(newOrder: string[]): Promise<void> {
        try {
            await this.stateService.reorderSongs(newOrder);
        } catch (error) {
            console.error('RepertoireEditPageComponent: onOrderChanged error', error);
            this.snackBar.open(
                'Nie udało się zmienić kolejności piosenek.',
                undefined,
                {
                    duration: 5000,
                }
            );
        }
    }

    public onBackToList(): void {
        void this.router.navigate(['/management/repertoires']);
    }

    private async loadData(repertoireId: string): Promise<void> {
        try {
            await this.stateService.load(repertoireId);
        } catch (error) {
            console.error('RepertoireEditPageComponent: loadData error', error);
            // Błąd jest już obsłużony w stateService, tutaj tylko logujemy
        }
    }
}

