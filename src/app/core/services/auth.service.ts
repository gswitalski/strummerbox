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
     * Metoda łączy nasłuchiwanie na zdarzenia z aktywnym pollingiem sesji.
     * Obsługuje przypadek gdy link został już użyty (token usunięty z URL przez Supabase).
     *
     * @returns Promise który rozwiązuje się po pomyślnej weryfikacji lub odrzuca w przypadku błędu
     * @throws Error jeśli token jest nieprawidłowy, wygasł lub wystąpił błąd sieciowy
     */
    public async handleEmailConfirmation(): Promise<void> {
        const TIMEOUT_MS = 8000; // 8 sekund timeout (więcej czasu dla Supabase)
        const POLLING_INTERVAL_MS = 500; // Sprawdzaj sesję co 0.5 sekundy
        const INITIAL_DELAY_MS = 1000; // Poczekaj 1 sekundę przed pierwszym sprawdzeniem

        console.log('AuthService: Starting email confirmation handler');

        // Sprawdź czy w URL jest hash z tokenem (link aktywacyjny)
        // Supabase może automatycznie usunąć token z URL po przetworzeniu (detectSessionInUrl: true)
        const hash = window.location.hash;
        const hasTokenInUrl = hash.includes('access_token=') || hash.includes('type=recovery');

        console.log('AuthService: URL hash check', { hasTokenInUrl, hashLength: hash.length });

        // Poczekaj, aby Supabase mógł przetworzyć token z URL
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS));

        // Sprawdź czy już istnieje sesja z potwierdzonym e-mailem
        const { data: { session: existingSession } } = await this.supabase.auth.getSession();

        if (existingSession?.user?.email_confirmed_at) {
            // Konto jest już aktywowane - sukces!
            console.log('AuthService: Account already confirmed via existing session', {
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

        // Jeśli nie ma tokenu w URL i nie ma sesji, link został już użyty wcześniej
        // W kontekście SPA na Firebase Hosting, Supabase usuwa token z URL po przetworzeniu
        // Jeśli użytkownik jest na stronie potwierdzenia bez tokenu, oznacza to że link został już użyty
        if (!hasTokenInUrl && !existingSession) {
            console.log('AuthService: No token in URL and no session - link was already used, account is confirmed');
            // Link został już użyty - konto jest aktywowane
            // Zwróć sukces bez czekania na zdarzenia
            return;
        }

        // Kombinacja polling + nasłuchiwanie na zdarzenia dla nowych potwierdzeń
        return new Promise((resolve, reject) => {
            let resolved = false;
            let pollingAttempts = 0;
            const MAX_POLLING_ATTEMPTS = Math.floor(TIMEOUT_MS / POLLING_INTERVAL_MS);

            // Najpierw zdefiniuj zmienne, które będą używane w callbackach
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            let subscription: { unsubscribe: () => void } | null = null;

            // Funkcja pomocnicza do czyszczenia zasobów
            const cleanup = () => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (subscription !== null) {
                    subscription.unsubscribe();
                    subscription = null;
                }
            };

            // Polling - aktywnie sprawdzaj sesję
            const pollingInterval = setInterval(async () => {
                if (resolved) {
                    clearInterval(pollingInterval);
                    cleanup();
                    return;
                }

                pollingAttempts++;
                console.log(`AuthService: Polling session (attempt ${pollingAttempts}/${MAX_POLLING_ATTEMPTS})`);

                const { data: { session }, error } = await this.supabase.auth.getSession();

                if (error) {
                    console.warn('AuthService: Error during polling', error);
                    return;
                }

                if (session?.user?.email_confirmed_at) {
                    // Sukces - znaleziono sesję z potwierdzonym e-mailem
                    resolved = true;
                    clearInterval(pollingInterval);
                    cleanup();

                    console.log('AuthService: Session found via polling - confirmation successful', {
                        userId: session.user.id,
                        email: session.user.email,
                        emailConfirmedAt: session.user.email_confirmed_at,
                    });

                    // Wylogowanie użytkownika
                    this.supabase.auth.signOut()
                        .then(() => {
                            console.log('AuthService: User signed out after confirmation');
                            resolve();
                        })
                        .catch((signOutError) => {
                            console.warn('AuthService: Error during post-confirmation sign out', signOutError);
                            resolve(); // Sukces nawet jeśli wylogowanie się nie powiodło
                        });
                }
            }, POLLING_INTERVAL_MS);

            // Timeout - jeśli nie znaleziono sesji w określonym czasie
            timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    clearInterval(pollingInterval);
                    cleanup();

                    console.error('AuthService: Email confirmation timeout');

                    // Ostatnia próba - sprawdź sesję jeszcze raz
                    this.supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session?.user?.email_confirmed_at) {
                            console.log('AuthService: Session found in final check - confirmation successful');
                            this.supabase.auth.signOut().catch(err =>
                                console.warn('AuthService: Error during sign out', err)
                            );
                            resolve();
                        } else if (!hasTokenInUrl) {
                            // Jeśli nie ma tokenu w URL, link został już użyty - sukces
                            console.log('AuthService: No token in URL after timeout - link was already used, account is confirmed');
                            resolve();
                        } else {
                            // Token w URL ale brak sesji - błąd
                            reject(new Error('Token potwierdzający jest nieprawidłowy lub wygasł.'));
                        }
                    }).catch(() => {
                        if (!hasTokenInUrl) {
                            // Jeśli nie ma tokenu w URL, link został już użyty - sukces
                            console.log('AuthService: No token in URL after timeout error - link was already used, account is confirmed');
                            resolve();
                        } else {
                            reject(new Error('Token potwierdzający jest nieprawidłowy lub wygasł.'));
                        }
                    });
                }
            }, TIMEOUT_MS);

            // Nasłuchuj na zdarzenia autentykacji (backup dla polling)
            const { data: { subscription: authSubscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
                if (resolved) {
                    return;
                }

                console.log('AuthService: Auth state changed', { event, hasSession: !!session });

                if (event === 'SIGNED_IN' && session?.user) {
                    // Sprawdź czy e-mail jest potwierdzony (może być opóźnienie)
                    if (session.user.email_confirmed_at) {
                        resolved = true;
                        clearInterval(pollingInterval);
                        cleanup();

                        console.log('AuthService: SIGNED_IN event received - confirmation successful', {
                            userId: session.user.id,
                            email: session.user.email,
                            emailConfirmedAt: session.user.email_confirmed_at,
                        });

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
                }
            });

            subscription = authSubscription;
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

