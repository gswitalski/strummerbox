import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'stbo-empty-state',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
    @Input()
    public message = '';

    @Input()
    public buttonText = '';

    @Input()
    public icon = 'library_music';

    @Input()
    public disableButton = false;

    @Output()
    public readonly ctaClick = new EventEmitter<void>();

    public onCtaClick(): void {
        this.ctaClick.emit();
    }
}
