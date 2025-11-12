import { Environment } from './environment.interface';

export const environment: Environment = {
    production: true,
    environmentName: 'production',
    supabase: {
        url: '#{SUPABASE_URL}#',
        anonKey: '#{SUPABASE_ANON_KEY}#',
    },
};
