import { BreakpointObserver } from '@angular/cdk/layout';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Signal,
    inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { map } from 'rxjs';

/**
 * Breakpoint dla układu side-by-side vs tabs.
 * Poniżej 768px używamy zakładek, powyżej - układ side-by-side.
 */
const SIDE_BY_SIDE_BREAKPOINT = '(min-width: 768px)';

/**
 * Komponent prezentacyjny odpowiedzialny za responsywny układ edytora piosenki.
 * 
 * Na szerokich ekranach (>= 768px): wyświetla edytor i podgląd obok siebie.
 * Na wąskich ekranach (< 768px): używa mat-tab-group do przełączania między nimi.
 * 
 * Wykorzystuje ng-content z selektorami [editor] i [preview] do projekcji zawartości.
 * 
 * @example
 * ```html
 * <stbo-song-editor-layout>
 *   <textarea editor></textarea>
 *   <stbo-song-display preview [content]="content()"></stbo-song-display>
 * </stbo-song-editor-layout>
 * ```
 */
@Component({
    selector: 'stbo-song-editor-layout',
    standalone: true,
    imports: [MatTabsModule],
    templateUrl: './song-editor-layout.component.html',
    styleUrl: './song-editor-layout.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongEditorLayoutComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly destroyRef = inject(DestroyRef);

    /**
     * Sygnał określający aktualny tryb wyświetlania.
     * 'split' - edytor i podgląd obok siebie
     * 'tabs' - zakładki na urządzeniach mobilnych
     */
    public readonly layoutMode: Signal<'split' | 'tabs'>;

    constructor() {
        this.layoutMode = toSignal(
            this.breakpointObserver.observe(SIDE_BY_SIDE_BREAKPOINT).pipe(
                map(result => result.matches ? 'split' : 'tabs'),
                takeUntilDestroyed(this.destroyRef)
            ),
            { initialValue: 'split' }
        );
    }
}

