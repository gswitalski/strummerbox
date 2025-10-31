import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'stbo-not-found',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
    constructor(private readonly router: Router) {}

    goHome(): void {
        this.router.navigate(['/']);
    }

    goBack(): void {
        window.history.back();
    }
}
