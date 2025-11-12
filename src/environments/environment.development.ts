import { Environment } from './environment.interface';

const env = import.meta.env;

export const environment: Environment = {
    production: false,
    environmentName: 'development',
    supabase: {
        url: env.NG_APP_SUPABASE_URL ?? 'http://127.0.0.1:54321',
        anonKey:
            env.NG_APP_SUPABASE_ANON_KEY ??
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
};
