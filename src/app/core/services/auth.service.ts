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
     * Metoda nasłuchuje na zdarzenia onAuthStateChange od Supabase i weryfikuje,
     * czy użytkownik został pomyślnie uwierzytelniony.
     * 
     * @returns Promise który rozwiązuje się po pomyślnej weryfikacji lub odrzuca w przypadku błędu
     * @throws Error jeśli token jest nieprawidłowy, wygasł lub wystąpił błąd sieciowy
     */
    public async handleEmailConfirmation(): Promise<void> {
        const CONFIRMATION_TIMEOUT_MS = 5000;

        return new Promise((resolve, reject) => {
            let isResolved = false;
            let unsubscribe: (() => void) | null = null;

            // Ustawienie timeout na wypadek, gdyby zdarzenie SIGNED_IN nie wystąpiło
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    if (unsubscribe) {
                        unsubscribe();
                    }
                    reject(new Error('Token potwierdzający jest nieprawidłowy lub wygasł.'));
                }
            }, CONFIRMATION_TIMEOUT_MS);

            // Nasłuchiwanie na zdarzenia autentykacji
            const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (isResolved) {
                        return;
                    }

                    if (event === 'SIGNED_IN' && session) {
                        isResolved = true;
                        clearTimeout(timeoutId);
                        if (unsubscribe) {
                            unsubscribe();
                        }

                        // Wylogowanie użytkownika po pomyślnej weryfikacji
                        // aby zapewnić spójny przepływ, w którym użytkownik musi świadomie się zalogować
                        try {
                            await this.supabase.auth.signOut();
                        } catch (error) {
                            console.warn('AuthService: error during post-confirmation sign out', error);
                        }

                        resolve();
                    }
                }
            );

            unsubscribe = () => subscription.unsubscribe();
        });
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

