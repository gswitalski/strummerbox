import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { SongNavigation } from '../song-viewer/song-viewer.types';

/**
 * Komponent prezentacyjny odpowiedzialny za wyświetlanie nawigacji między piosenkami.
 * Wyświetla przyciski "Poprzednia" i "Następna" z tytułami piosenek.
 * 
 * @example
 * ```html
 * <stbo-song-navigation
 *   [navigation]="navigation">
 * </stbo-song-navigation>
 * ```
 */
@Component({
    selector: 'stbo-song-navigation',
    standalone: true,
    imports: [RouterLink, MatButtonModule, MatIconModule],
    templateUrl: './song-navigation.component.html',
    styleUrl: './song-navigation.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongNavigationComponent {
    /**
     * Obiekt nawigacyjny zawierający dane o poprzedniej i następnej piosence
     */
    @Input({ required: true }) navigation!: SongNavigation;
}

