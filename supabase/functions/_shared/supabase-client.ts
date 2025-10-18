import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7?target=deno&no-check';
import type { Database } from '../../../packages/database/database.types.ts';
import { createInternalError } from './errors.ts';

export type RequestSupabaseClient = ReturnType<typeof createSupabaseClient>;
export type ServiceRoleSupabaseClient = ReturnType<typeof createSupabaseServiceRoleClient>;

export const createSupabaseClient = (request: Request) => {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
        throw createInternalError('Brak konfiguracji Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)');
    }

    return createClient<Database>(url, anonKey, {
        global: {
            headers: {
                Authorization: request.headers.get('Authorization') ?? '',
            },
        },
    });
};

export const createSupabaseServiceRoleClient = () => {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
        throw createInternalError('Brak konfiguracji Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    }

    return createClient<Database>(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

