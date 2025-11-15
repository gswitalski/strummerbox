import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from './supabase.service';
import { ProfileService } from './profile.service';
import type {
    ErrorResponseDto,
    OrganizerProfileDto,
    OrganizerRegisterCommand,
    ResendConfirmationCommand,
} from '../../../../packages/contracts/types';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly supabase = inject(SupabaseService);
    private readonly profileService = inject(ProfileService);
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);

    private readonly authBaseUrl = `${environment.supabase.url}/functions/v1/auth` as const;

    private readonly isLoggingOutState: WritableSignal<boolean> = signal(false);
    private readonly logoutErrorState: WritableSignal<string | null> = signal(null);

    public readonly isLoggingOut: Signal<boolean> = this.isLoggingOutState.asReadonly();
    public readonly logoutError: Signal<string | null> = this.logoutErrorState.asReadonly();

    public async register(
        command: OrganizerRegisterCommand
    ): Promise<OrganizerProfileDto> {
        try {
            const response = await firstValueFrom(
                this.http.post<{ data: OrganizerProfileDto }>(
                    `${this.authBaseUrl}/register`,
                    command,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${environment.supabase.anonKey}`,
                            'apikey': environment.supabase.anonKey,
                        },
                    }
                )
            );

            return response.data;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                await this.handleRegisterHttpError(error);
            }

            console.error('AuthService: unexpected register error', error);
            throw new Error('Wystąpił nieoczekiwany błąd podczas rejestracji.');
        }
    }

    public async resendConfirmation(
        command: ResendConfirmationCommand
    ): Promise<void> {
        try {
            await firstValueFrom(
                this.http.post<{ message: string }>(
                    `${this.authBaseUrl}/resend-confirmation`,
                    command,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${environment.supabase.anonKey}`,
                            'apikey': environment.supabase.anonKey,
                        },
                    }
                )
            );
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                await this.handleResendConfirmationHttpError(error);
            }

            console.error('AuthService: unexpected resend confirmation error', error);
            throw new Error('Wystąpił nieoczekiwany błąd podczas wysyłania linku aktywacyjnego.');
        }
    }

    public async login(email: string, password: string): Promise<void> {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (!data.session || !data.user) {
            throw new Error('Nie udało się zalogować. Spróbuj ponownie później.');
        }

        this.profileService.reset();
    }

    public async logout(): Promise<boolean> {
        if (this.isLoggingOutState()) {
            return false;
        }

        this.isLoggingOutState.set(true);
        this.logoutErrorState.set(null);

        let isSuccessful = false;

        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                console.error('AuthService: logout error', error.message, error);
                this.logoutErrorState.set('Nie udało się wylogować. Spróbuj ponownie.');
                return false;
            }

            this.profileService.reset();
            await this.router.navigate(['/login']);
            isSuccessful = true;
        } catch (error) {
            console.error('AuthService: unexpected logout error', error);
            this.logoutErrorState.set('Wystąpił nieoczekiwany błąd podczas wylogowywania.');
        } finally {
            this.isLoggingOutState.set(false);
        }

        return isSuccessful;
    }

    /**
     * Obsługuje proces potwierdzenia e-maila po kliknięciu linku aktywacyjnego.
     * Metoda aktywnie sprawdza sesję w pętli, aby wykryć pomyślną weryfikację.
     *
     * @returns Promise który rozwiązuje się po pomyślnej weryfikacji lub odrzuca w przypadku błędu
     * @throws Error jeśli token jest nieprawidłowy, wygasł lub wystąpił błąd sieciowy
     */
    public async handleEmailConfirmation(): Promise<void> {
        const MAX_ATTEMPTS = 15; // Maksymalnie 15 prób
        const CHECK_INTERVAL_MS = 500; // Sprawdzaj co 0.5 sekundy
        const INITIAL_DELAY_MS = 1000; // Poczekaj 1 sekundę przed pierwszym sprawdzeniem

        console.log('AuthService: Starting email confirmation handler');

        // Poczekaj krótką chwilę, aby Supabase mógł przetworzyć token z URL
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS));

        // Polling - sprawdzaj sesję w pętli
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            console.log(`AuthService: Checking session (attempt ${attempt}/${MAX_ATTEMPTS})`);

            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) {
                console.error('AuthService: Error getting session:', error);
                continue; // Spróbuj ponownie
            }

            // Sprawdź czy użytkownik jest zalogowany i e-mail potwierdzony
            if (session?.user) {
                console.log('AuthService: Session found', {
                    userId: session.user.id,
                    email: session.user.email,
                    emailConfirmedAt: session.user.email_confirmed_at,
                });

                // Sukces - użytkownik jest zalogowany (nawet jeśli email_confirmed_at jeszcze nie jest ustawione)
                // Sam fakt istnienia sesji po kliknięciu w link oznacza sukces
                if (session.user.email_confirmed_at || session.user.email) {
                    console.log('AuthService: Email confirmation successful');

                    // Wylogowanie użytkownika po pomyślnej weryfikacji
                    try {
                        await this.supabase.auth.signOut();
                        console.log('AuthService: User signed out after confirmation');
                    } catch (signOutError) {
                        console.warn('AuthService: Error during post-confirmation sign out', signOutError);
                    }

                    return; // Sukces!
                }
            }

            // Poczekaj przed następną próbą
            if (attempt < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
            }
        }

        // Jeśli dotarliśmy tutaj, nie udało się wykryć sesji
        console.error('AuthService: Email confirmation timeout - no valid session found');
        throw new Error('Token potwierdzający jest nieprawidłowy lub wygasł.');
    }

    private async handleRegisterHttpError(error: HttpErrorResponse): Promise<never> {
        const errorBody = error.error as Partial<ErrorResponseDto> | undefined;
        const message = errorBody?.error?.message;

        if (error.status === 409) {
            throw new Error(
                message ?? 'Użytkownik o tym adresie e-mail już istnieje.'
            );
        }

        if (error.status === 400) {
            throw new Error(
                message ?? 'Wprowadzone dane są nieprawidłowe.'
            );
        }

        if (error.status === 0 || error.status >= 500) {
            throw new Error('Nie udało się połączyć z serwerem. Spróbuj ponownie później.');
        }

        throw new Error(
            message ?? 'Nie udało się zarejestrować. Spróbuj ponownie później.'
        );
    }

    private async handleResendConfirmationHttpError(error: HttpErrorResponse): Promise<never> {
        const errorBody = error.error as Partial<ErrorResponseDto> | undefined;
        const message = errorBody?.error?.message;

        if (error.status === 0 || error.status >= 500) {
            throw new Error('Nie udało się połączyć z serwerem. Spróbuj ponownie później.');
        }

        throw new Error(
            message ?? 'Nie udało się wysłać ponownie linku aktywacyjnego. Spróbuj ponownie później.'
        );
    }

}

