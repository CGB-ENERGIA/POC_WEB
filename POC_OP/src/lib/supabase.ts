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
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE usa ?code= (query), compatível com o vueRouterMode "hash" do painel.
    // O fluxo implícito colocava o token em #access_token=… e batia com as rotas #/….
    flowType: "pkce",
  },
});

export const supabaseUrl = url;

/** Troca o ?code= do e-mail de recuperação por sessão (uma vez só por carga da página). */
let pkceExchange: Promise<{ ok: boolean; error?: string }> | null = null;

export function exchangeRecoveryCodeFromUrl(): Promise<{ ok: boolean; error?: string }> {
  if (pkceExchange) return pkceExchange;
  pkceExchange = (async () => {
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get("code");
    if (!code) return { ok: false };

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("type");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);

    if (error) {
      return {
        ok: false,
        error: /expired|invalid|otp/i.test(error.message)
          ? "Este link já foi usado ou expirou. Peça um novo em Esqueci minha senha."
          : "Não foi possível validar o link. Peça um novo em Esqueci minha senha.",
      };
    }
    return { ok: true };
  })();
  return pkceExchange;
}
