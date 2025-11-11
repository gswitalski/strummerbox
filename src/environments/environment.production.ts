import { Environment } from './environment.interface';

const env = import.meta.env;

export const environment: Environment = {
    production: true,
    environmentName: 'production',
    supabase: {
        url: env.NG_APP_SUPABASE_URL ?? 'YOUR_PRODUCTION_SUPABASE_URL',
        anonKey: env.NG_APP_SUPABASE_ANON_KEY ?? 'YOUR_PRODUCTION_SUPABASE_ANON_KEY',
    },
};
