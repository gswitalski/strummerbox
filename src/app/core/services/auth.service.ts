import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
    FunctionsFetchError,
    FunctionsHttpError,
    FunctionsRelayError,
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { ProfileService } from './profile.service';
import type {
    ErrorResponseDto,
    OrganizerProfileDto,
    OrganizerRegisterCommand,
} from '../../../../packages/contracts/types';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly supabase = inject(SupabaseService);
    private readonly profileService = inject(ProfileService);
    private readonly router = inject(Router);

    private readonly isLoggingOutState: WritableSignal<boolean> = signal(false);
    private readonly logoutErrorState: WritableSignal<string | null> = signal(null);

    public readonly isLoggingOut: Signal<boolean> = this.isLoggingOutState.asReadonly();
    public readonly logoutError: Signal<string | null> = this.logoutErrorState.asReadonly();

    public async register(
        command: OrganizerRegisterCommand
    ): Promise<OrganizerProfileDto> {
        const result = await this.supabase.client.functions.invoke<RegisterResponse>(
            'me/register',
            {
                body: command,
                headers: {
                    Authorization: `Bearer ${environment.supabase.anonKey}`,
                    apikey: environment.supabase.anonKey,
                },
            }
        );

        if (result.error) {
            await this.handleRegisterError(result.error);
        }

        if (!result.data || !result.data.data) {
            throw new Error(
                'Nie udało się zarejestrować. Spróbuj ponownie później.'
            );
        }

        return result.data.data;
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

    private async handleRegisterError(error: unknown): Promise<never> {
        if (error instanceof FunctionsHttpError) {
            const status = this.extractStatus(error.context);
            const message = await this.extractErrorMessage(error.context);

            if (status === 409) {
                throw new Error(
                    message ?? 'Użytkownik o tym adresie e-mail już istnieje.'
                );
            }

            throw new Error(
                message ?? 'Nie udało się zarejestrować. Spróbuj ponownie później.'
            );
        }

        if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
            throw new Error('Nie udało się połączyć z serwerem. Spróbuj ponownie później.');
        }

        console.error('AuthService: unexpected register error', error);
        throw new Error('Wystąpił nieoczekiwany błąd podczas rejestracji.');
    }

    private extractStatus(context: unknown): number | null {
        if (!context || typeof context !== 'object') {
            return null;
        }

        const maybeResponse = context as Response;

        if (typeof maybeResponse.status === 'number') {
            return maybeResponse.status;
        }

        return null;
    }

    private async extractErrorMessage(context: unknown): Promise<string | null> {
        if (!context || typeof context !== 'object') {
            return null;
        }

        const maybeResponse = context as Response;

        if (typeof maybeResponse.json !== 'function') {
            return null;
        }

        try {
            const payload = (await maybeResponse.json()) as Partial<ErrorResponseDto>;
            return payload.error?.message ?? null;
        } catch (error) {
            console.warn('AuthService: unable to parse register error payload', error);
            return null;
        }
    }
}

interface RegisterResponse {
    data: OrganizerProfileDto;
}

