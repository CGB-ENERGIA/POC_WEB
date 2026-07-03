import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "@/lib/config";
import type { Database } from "@/types/database";

const FALLBACK_URL = "https://uqjabgsxzeekxznybhns.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamFiZ3N4emVla3h6bnliaG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mzc0ODYsImV4cCI6MjA5ODUxMzQ4Nn0.peJ2osSisTuKExQiiqDqbsplKt8tSYxQoptTDCeDC14";

function validStr(v: string | undefined): string {
  return typeof v === "string" && v && v !== "undefined" && v !== "null" ? v : "";
}

const url = validStr(appConfig.supabaseUrl) || FALLBACK_URL;
const key = validStr(appConfig.supabaseAnonKey) || FALLBACK_KEY;

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}
