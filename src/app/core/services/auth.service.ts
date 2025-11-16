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
     * Metoda nasłuchuje na zdarzenia autentykacji z Supabase i sprawdza czy link został już użyty.
     *
     * @returns Promise który rozwiązuje się po pomyślnej weryfikacji lub odrzuca w przypadku błędu
     * @throws Error jeśli token jest nieprawidłowy, wygasł lub wystąpił błąd sieciowy
     */
    public async handleEmailConfirmation(): Promise<void> {
        const TIMEOUT_MS = 5000; // 5 sekund timeout
        const INITIAL_DELAY_MS = 500; // Poczekaj 0.5 sekundy przed pierwszym sprawdzeniem

        console.log('AuthService: Starting email confirmation handler');

        // Sprawdź czy w URL jest hash z tokenem (link aktywacyjny)
        const hash = window.location.hash;
        const hasTokenInUrl = hash.includes('access_token=') || hash.includes('type=recovery');

        // Poczekaj krótką chwilę, aby Supabase mógł przetworzyć token z URL
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS));

        // Najpierw sprawdź czy już istnieje sesja (link został już użyty wcześniej)
        const { data: { session: existingSession }, error: sessionError } = await this.supabase.auth.getSession();

        if (existingSession?.user?.email_confirmed_at) {
            // Konto jest już aktywowane - sukces!
            console.log('AuthService: Account already confirmed', {
                userId: existingSession.user.id,
                email: existingSession.user.email,
                emailConfirmedAt: existingSession.user.email_confirmed_at,
            });

            // Wylogowanie użytkownika po potwierdzeniu
            try {
                await this.supabase.auth.signOut();
                console.log('AuthService: User signed out after confirmation');
            } catch (signOutError) {
                console.warn('AuthService: Error during post-confirmation sign out', signOutError);
            }

            return; // Sukces!
        }

        // Jeśli nie ma tokenu w URL, ale jesteśmy na stronie potwierdzenia, sprawdź czy link został już użyty
        if (!hasTokenInUrl && !existingSession) {
            // Brak tokenu w URL i brak sesji - link został już użyty lub jest nieprawidłowy
            console.log('AuthService: No token in URL and no session - link may have been used already');
            // Kontynuuj dalej, aby sprawdzić czy może Supabase przetworzył token już wcześniej
        }

        // Nasłuchuj na zdarzenia autentykacji z timeoutem
        return new Promise((resolve, reject) => {
            let resolved = false;

            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.error('AuthService: Email confirmation timeout - no SIGNED_IN event received');

                    // Sprawdź jeszcze raz czy może sesja została utworzona podczas timeoutu
                    this.supabase.auth.getSession().then(({ data: { session }, error }) => {
                        if (session?.user?.email_confirmed_at) {
                            console.log('AuthService: Session found after timeout - confirmation successful');
                            // Wylogowanie użytkownika
                            this.supabase.auth.signOut().catch(err =>
                                console.warn('AuthService: Error during sign out', err)
                            );
                            resolve();
                        } else {
                            reject(new Error('Token potwierdzający jest nieprawidłowy lub wygasł.'));
                        }
                    }).catch(() => {
                        reject(new Error('Token potwierdzający jest nieprawidłowy lub wygasł.'));
                    });
                }
            }, TIMEOUT_MS);

            // Nasłuchuj na zmiany stanu autentykacji
            const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('AuthService: Auth state changed', { event, hasSession: !!session });

                if (resolved) {
                    return;
                }

                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('AuthService: SIGNED_IN event received', {
                        userId: session.user.id,
                        email: session.user.email,
                        emailConfirmedAt: session.user.email_confirmed_at,
                    });

                    // Sukces - użytkownik został zalogowany po kliknięciu w link
                    resolved = true;
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();

                    // Wylogowanie użytkownika po pomyślnej weryfikacji
                    this.supabase.auth.signOut()
                        .then(() => {
                            console.log('AuthService: User signed out after confirmation');
                            resolve();
                        })
                        .catch((signOutError) => {
                            console.warn('AuthService: Error during post-confirmation sign out', signOutError);
                            // Nawet jeśli wylogowanie się nie powiodło, potwierdzenie było sukcesem
                            resolve();
                        });
                } else if (event === 'TOKEN_REFRESHED' && session?.user?.email_confirmed_at) {
                    // Token został odświeżony i e-mail jest potwierdzony
                    console.log('AuthService: TOKEN_REFRESHED with confirmed email');
                    resolved = true;
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();

                    this.supabase.auth.signOut()
                        .then(() => {
                            console.log('AuthService: User signed out after confirmation');
                            resolve();
                        })
                        .catch((signOutError) => {
                            console.warn('AuthService: Error during post-confirmation sign out', signOutError);
                            resolve();
                        });
                }
            });
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

