/**
 * Typ określający możliwe nazwy środowisk
 */
export type EnvironmentName = 'development' | 'test' | 'production';

/**
 * Interfejs konfiguracji środowiska aplikacji
 */
export interface Environment {
    production: boolean;
    environmentName: EnvironmentName;
    supabase: {
        url: string;
        anonKey: string;
    };
}

