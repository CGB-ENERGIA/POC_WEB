/** Variáveis públicas (Vite) — ver `.env.example`. */
export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  r2UploadUrl: import.meta.env.VITE_R2_UPLOAD_URL as string | undefined,
  r2UploadToken: import.meta.env.VITE_R2_UPLOAD_TOKEN as string | undefined,
  r2PublicBaseUrl: import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined,
};

export function isSupabaseConfigured(): boolean {
  return true; // fallback hardcoded em supabase.ts garante conectividade
}

export function isR2Configured(): boolean {
  return Boolean(appConfig.r2UploadUrl && appConfig.r2UploadToken);
}

export function isRemoteSyncEnabled(): boolean {
  return isSupabaseConfigured() && isR2Configured();
}

/** Sync de dados para Supabase (independente do R2 de fotos). */
export function isSupabaseSyncEnabled(): boolean {
  return isSupabaseConfigured();
}
