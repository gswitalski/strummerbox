import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, EMPTY, from } from 'rxjs';
import { catchError, concatMap, finalize } from 'rxjs/operators';

import type { OrganizerRegisterCommand } from '../../../../packages/contracts/types';
import { AuthService } from '../../core/services/auth.service';
import { RegisterFormComponent } from './components/register-form.component';

@Component({
    selector: 'stbo-register-page',
    standalone: true,
    imports: [CommonModule, RegisterFormComponent],
    templateUrl: './register-page.component.html',
    styleUrls: ['./register-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
    private readonly errorSubject = new BehaviorSubject<string | null>(null);

    protected readonly isLoading = toSignal(
        this.isLoadingSubject.asObservable(),
        {
            initialValue: false,
        }
    );

    protected readonly serverError = toSignal(
        this.errorSubject.asObservable(),
        {
            initialValue: null,
        }
    );

    protected handleRegister(command: OrganizerRegisterCommand): void {
        if (this.isLoadingSubject.getValue()) {
            return;
        }

        this.errorSubject.next(null);
        this.isLoadingSubject.next(true);

        from(this.authService.register(command))
            .pipe(
                concatMap(() =>
                    from(
                        this.authService.login(command.email, command.password)
                    )
                ),
                concatMap(() =>
                    from(
                        this.router.navigateByUrl('/management/dashboard')
                    )
                ),
                catchError((error: unknown) => {
                    this.errorSubject.next(this.mapError(error));
                    return EMPTY;
                }),
                finalize(() => {
                    this.isLoadingSubject.next(false);
                })
            )
            .subscribe();
    }

    private mapError(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        console.error('RegisterPageComponent: unexpected error', error);
        return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
    }
}


