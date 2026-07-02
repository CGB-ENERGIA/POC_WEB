import { createClient } from "@supabase/supabase-js";

// Supabase anon keys are public client-side credentials; RLS enforces access control.
const FALLBACK_URL = "https://uqjabgsxzeekxznybhns.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamFiZ3N4emVla3h6bnliaG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mzc0ODYsImV4cCI6MjA5ODUxMzQ4Nn0.peJ2osSisTuKExQiiqDqbsplKt8tSYxQoptTDCeDC14";

function validStr(v: unknown): string {
  return typeof v === "string" && v && v !== "undefined" && v !== "null" ? v : "";
}

const url =
  validStr(import.meta.env.VITE_SUPABASE_URL) ||
  validStr(process.env.VITE_SUPABASE_URL) ||
  FALLBACK_URL;

const key =
  validStr(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  validStr(process.env.VITE_SUPABASE_ANON_KEY) ||
  FALLBACK_KEY;

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
