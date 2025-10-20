import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../../../../packages/database/database.types';

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private readonly supabase = createClient<Database>(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: true,
                persistSession: true,
                autoRefreshToken: true,
                lock: async <T>(
                    _name: string,
                    _acquireTimeout: number,
                    fn: () => Promise<T>
                ): Promise<T> => {
                    return await fn();
                },
            },
        }
    );

    get client(): SupabaseClient<Database> {
        return this.supabase as SupabaseClient<Database>;
    }

    get auth() {
        return this.supabase.auth;
    }

    get from() {
        return this.supabase.from.bind(this.supabase);
    }
}
