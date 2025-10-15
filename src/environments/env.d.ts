/* Global typings for Angular environment variables */

declare interface ImportMetaEnv {
    readonly NG_APP_SUPABASE_URL?: string;
    readonly NG_APP_SUPABASE_ANON_KEY?: string;
}

declare interface ImportMeta {
    readonly env: ImportMetaEnv;
}

