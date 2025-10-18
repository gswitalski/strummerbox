import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
    Injectable,
    Signal,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import type { OrganizerProfileDto } from '../../../../packages/contracts/types';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

interface ProfileResponse {
    data: OrganizerProfileDto;
}

@Injectable({
    providedIn: 'root',
})
export class ProfileService {
    private readonly http = inject(HttpClient);
    private readonly supabase = inject(SupabaseService);

    private readonly profileState: WritableSignal<OrganizerProfileDto | null> = signal<OrganizerProfileDto | null>(null);
    private readonly isLoadingState: WritableSignal<boolean> = signal(false);
    private readonly errorState: WritableSignal<string | null> = signal(null);
    private readonly hasLoadedState: WritableSignal<boolean> = signal(false);

    public readonly profile: Signal<OrganizerProfileDto | null> = this.profileState.asReadonly();
    public readonly profile$ = toObservable(this.profile);

    public readonly isLoading: Signal<boolean> = this.isLoadingState.asReadonly();
    public readonly isLoading$ = toObservable(this.isLoading);

    public readonly error: Signal<string | null> = this.errorState.asReadonly();
    public readonly error$ = toObservable(this.error);

    public readonly isEmptyProfile: Signal<boolean> = computed(() => !this.profileState());

    public async loadProfile(options?: { force?: boolean }): Promise<void> {
        if (this.isLoadingState()) {
            return;
        }

        const shouldForce = options?.force ?? false;

        if (this.hasLoadedState() && !shouldForce) {
            return;
        }

        this.isLoadingState.set(true);
        this.errorState.set(null);

        try {
            const sessionResult = await this.supabase.auth.getSession();

            if (sessionResult.error) {
                console.error('ProfileService: session error', sessionResult.error);
                this.profileState.set(null);
                this.errorState.set('Nie udało się pobrać danych profilu.');
                this.hasLoadedState.set(true);
                return;
            }

            const session = sessionResult.data.session;

            if (!session) {
                this.profileState.set(null);
                this.hasLoadedState.set(true);
                return;
            }

            const url = `${environment.supabase.url}/functions/v1/me/profile`;

            const response = await firstValueFrom(
                this.http.get<ProfileResponse>(url, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })
            );

            this.profileState.set(response.data);
            this.hasLoadedState.set(true);
        } catch (error) {
            this.profileState.set(null);
            this.hasLoadedState.set(true);

            if (error instanceof HttpErrorResponse) {
                console.error('ProfileService: HTTP error', error.message, error.error);

                if (error.status === 401) {
                    this.errorState.set('Twoja sesja wygasła. Zaloguj się ponownie.');
                    return;
                }

                this.errorState.set('Nie udało się pobrać danych profilu. Spróbuj ponownie później.');
                return;
            }

            console.error('ProfileService: unexpected error', error);
            this.errorState.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.');
        } finally {
            this.isLoadingState.set(false);
        }
    }

    public reset(): void {
        this.profileState.set(null);
        this.errorState.set(null);
        this.isLoadingState.set(false);
        this.hasLoadedState.set(false);
    }
}

