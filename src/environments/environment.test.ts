import { Environment } from './environment.interface';

export const environment: Environment = {
    production: false,
    environmentName: 'test',
    supabase: {
        url: '#{SUPABASE_URL_TEST}#',
        anonKey: '#{SUPABASE_ANON_KEY_TEST}#',
    },
};

