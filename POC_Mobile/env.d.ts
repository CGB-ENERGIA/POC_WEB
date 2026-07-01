interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_R2_UPLOAD_URL?: string;
  readonly VITE_R2_UPLOAD_TOKEN?: string;
  readonly VITE_R2_PUBLIC_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
