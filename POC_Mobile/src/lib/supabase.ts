import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appConfig, isSupabaseConfigured } from "@/lib/config";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }

  if (!client) {
    client = createClient<Database>(appConfig.supabaseUrl!, appConfig.supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
