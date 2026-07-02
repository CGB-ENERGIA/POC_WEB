import { createClient } from "@supabase/supabase-js";

// Supports both Vite import.meta.env (dev) and Quasar build.env (process.env)
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  (process.env.VITE_SUPABASE_URL as string | undefined) ??
  "";
const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (process.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "";

if (!url) console.error("[supabase] VITE_SUPABASE_URL não definida — verifique o arquivo .env");

export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder", {
  auth: { persistSession: false, autoRefreshToken: false },
});
