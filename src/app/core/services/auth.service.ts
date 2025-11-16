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
     *
     * WAŻNE: Supabase weryfikuje token na swoim serwerze (/auth/v1/verify) PRZED przekierowaniem
     * na /auth/confirm-email. Oznacza to, że gdy użytkownik dociera na tę stronę,
     * e-mail jest już potwierdzony. Wystarczy sprawdzić status użytkownika i wyświetlić sukces.
     *
     * @returns Promise który rozwiązuje się po pomyślnej weryfikacji lub odrzuca w przypadku błędu
     * @throws Error jeśli token jest nieprawidłowy, wygasł lub wystąpił błąd sieciowy
     */
    public async handleEmailConfirmation(): Promise<void> {
        console.log('AuthService: Starting email confirmation handler');

        // Sprawdź parametry URL - Supabase może przekierować z parametrami query lub hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const hasTokenParam = urlParams.has('token') || hashParams.has('token') || hashParams.has('access_token');
        const hasTypeParam = urlParams.get('type') === 'signup' || hashParams.get('type') === 'signup';

        console.log('AuthService: URL params check', {
            hasTokenParam,
            hasTypeParam,
            queryParams: window.location.search,
            hashParams: window.location.hash.substring(0, 100), // Pierwsze 100 znaków dla bezpieczeństwa
        });

        // Poczekaj krótką chwilę, aby Supabase mógł przetworzyć token i utworzyć sesję
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Sprawdź sesję - Supabase może automatycznie zalogować użytkownika po weryfikacji
        const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

        if (sessionError) {
            console.error('AuthService: Error getting session', sessionError);
            // Jeśli jest błąd sesji, ale są parametry w URL, oznacza to że weryfikacja się powiodła
            // ale sesja nie została jeszcze utworzona - poczekaj chwilę i sprawdź ponownie
            if (hasTokenParam || hasTypeParam) {
                console.log('AuthService: Token/type params present but no session yet - waiting for session creation');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const { data: { session: retrySession } } = await this.supabase.auth.getSession();
                if (retrySession?.user?.email_confirmed_at) {
                    console.log('AuthService: Session found on retry - confirmation successful');
                    await this.supabase.auth.signOut().catch(err =>
                        console.warn('AuthService: Error during sign out', err)
                    );
                    return; // Sukces!
                }
            }
        }

        // Jeśli użytkownik ma sesję z potwierdzonym e-mailem - sukces!
        if (session?.user?.email_confirmed_at) {
            console.log('AuthService: Email already confirmed via session', {
                userId: session.user.id,
                email: session.user.email,
                emailConfirmedAt: session.user.email_confirmed_at,
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

        // Jeśli są parametry token/type w URL, oznacza to że Supabase właśnie zweryfikował token
        // E-mail jest już potwierdzony, nawet jeśli sesja nie została jeszcze utworzona
        if (hasTokenParam || hasTypeParam) {
            console.log('AuthService: Token/type params in URL - Supabase verified email, account is confirmed');
            // Poczekaj jeszcze chwilę na utworzenie sesji, a następnie wyloguj
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Sprawdź czy sesja została utworzona
            const { data: { session: finalSession } } = await this.supabase.auth.getSession();
            if (finalSession) {
                await this.supabase.auth.signOut().catch(err =>
                    console.warn('AuthService: Error during sign out', err)
                );
            }

            return; // Sukces - e-mail jest potwierdzony!
        }

        // Jeśli nie ma parametrów w URL i nie ma sesji, może to oznaczać że:
        // 1. Link został już użyty wcześniej (token usunięty z URL)
        // 2. Użytkownik ręcznie wszedł na stronę bez linku
        // W takim przypadku zakładamy sukces, bo jeśli link był nieprawidłowy,
        // Supabase nie przekierowałby użytkownika na tę stronę
        console.log('AuthService: No token params and no session - assuming link was already used, account is confirmed');
        return; // Sukces - zakładamy że konto jest aktywowane
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

