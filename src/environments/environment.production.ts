const env = import.meta.env;

export const environment = {
    production: true,
    supabase: {
        url: env.NG_APP_SUPABASE_URL ?? 'YOUR_PRODUCTION_SUPABASE_URL',
        anonKey: env.NG_APP_SUPABASE_ANON_KEY ?? 'YOUR_PRODUCTION_SUPABASE_ANON_KEY',
    },
} as const;
