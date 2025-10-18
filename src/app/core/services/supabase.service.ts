import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../../../../packages/database/database.types';

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private readonly supabase: SupabaseClient<Database>;

    constructor() {
        this.supabase = createClient<Database>(
            environment.supabase.url,
            environment.supabase.anonKey,
            {
                auth: {
                    // Konfiguracja auth
                    flowType: 'pkce',
                    detectSessionInUrl: true,
                    persistSession: true,
                    autoRefreshToken: true,
                    // Wyłączenie Web Locks API - rozwiązuje błąd "lock:sb-127-auth-token immediately failed"
                    // który może występować w trybie incognito lub gdy Web Locks API nie jest dostępne
                    // Używamy noop funkcji która natychmiast wykonuje callback bez używania Web Locks API
                    lock: async (_name: string, acquireTimeout: number, fn: () => Promise<any>) => {
                        return await fn();
                    },
                },
            }
        );
    }

    get client(): SupabaseClient<Database> {
        return this.supabase;
    }

    get auth() {
        return this.supabase.auth;
    }

    get from() {
        return this.supabase.from.bind(this.supabase);
    }
}
