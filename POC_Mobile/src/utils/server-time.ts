import { LocalStorage } from "quasar";

import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

export type TimeSource = "server" | "sync";

export interface TrustedTime {
  date: Date;
  source: TimeSource;
  /** Origem da última sincronização online (informativo). */
  provider?: "supabase" | "cloudflare";
}

export type ServerTimeErrorCode = "no_sync" | "sync_expired" | "fetch_failed";

export class ServerTimeError extends Error {
  code: ServerTimeErrorCode;

  constructor(message: string, code: ServerTimeErrorCode) {
    super(message);
    this.name = "ServerTimeError";
    this.code = code;
  }
}

const STORAGE_KEY = "cgb-mobile-server-time-sync";
const TRACE_URL = "https://www.cloudflare.com/cdn-cgi/trace";

/** Com Supabase: janela maior para uso offline em campo. */
const MAX_SYNC_AGE_LOCAL_MS = 48 * 60 * 60 * 1000;
const MAX_SYNC_AGE_REMOTE_MS = 7 * 24 * 60 * 60 * 1000;

interface TimeSyncRecord {
  serverMs: number;
  wallMs: number;
  provider?: "supabase" | "cloudflare";
}

let sessionPerfAnchor: { serverMs: number; perfMs: number } | null = null;

function maxSyncAgeMs(): number {
  return isSupabaseConfigured() ? MAX_SYNC_AGE_REMOTE_MS : MAX_SYNC_AGE_LOCAL_MS;
}

function loadSync(): TimeSyncRecord | null {
  return LocalStorage.getItem<TimeSyncRecord>(STORAGE_KEY);
}

function persistSync(date: Date, provider: "supabase" | "cloudflare") {
  const record: TimeSyncRecord = {
    serverMs: date.getTime(),
    wallMs: Date.now(),
    provider,
  };
  LocalStorage.set(STORAGE_KEY, record);
  sessionPerfAnchor = {
    serverMs: record.serverMs,
    perfMs: performance.now(),
  };
}

async function fetchSupabaseServerTime(): Promise<Date> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_server_time");
  if (error || !data) {
    throw error ?? new Error("Resposta de hora inválida");
  }
  return new Date(data as string);
}

async function fetchCloudflareServerTime(): Promise<Date> {
  const res = await fetch(TRACE_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const text = await res.text();
  const ts = text.match(/ts=([0-9.]+)/)?.[1];
  if (ts) return new Date(parseFloat(ts) * 1000);

  const dateHeader = res.headers.get("date");
  if (dateHeader) return new Date(dateHeader);

  throw new Error("Resposta de hora inválida");
}

/** Postgres (Supabase) → Cloudflare trace → falha. */
async function fetchAuthoritativeTime(): Promise<{ date: Date; provider: "supabase" | "cloudflare" }> {
  if (isSupabaseConfigured()) {
    try {
      return { date: await fetchSupabaseServerTime(), provider: "supabase" };
    } catch {
      // fallback se Supabase indisponível momentaneamente
    }
  }

  return { date: await fetchCloudflareServerTime(), provider: "cloudflare" };
}

function extrapolateFromSync(sync: TimeSyncRecord): Date {
  if (sessionPerfAnchor && sessionPerfAnchor.serverMs === sync.serverMs) {
    const elapsed = performance.now() - sessionPerfAnchor.perfMs;
    return new Date(sessionPerfAnchor.serverMs + elapsed);
  }

  return new Date(sync.serverMs + (Date.now() - sync.wallMs));
}

function assertSyncFresh(sync: TimeSyncRecord) {
  const maxAge = maxSyncAgeMs();
  if (Date.now() - sync.wallMs > maxAge) {
    const dias = Math.round(maxAge / (24 * 60 * 60 * 1000));
    throw new ServerTimeError(
      `Horário do servidor desatualizado (>${dias} dias). Conecte-se à internet para sincronizar.`,
      "sync_expired"
    );
  }
}

function syncResult(sync: TimeSyncRecord): TrustedTime {
  return {
    date: extrapolateFromSync(sync),
    source: "sync",
    provider: sync.provider,
  };
}

/** Sincroniza horário do servidor quando online (ex.: abertura do app). */
export async function refreshServerTimeSync(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    const { date, provider } = await fetchAuthoritativeTime();
    persistSync(date, provider);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hora baseada no servidor (Postgres via Supabase, ou Cloudflare).
 * Offline: extrapola a última sync — nunca usa o relógio absoluto do aparelho.
 */
export async function getTrustedTime(): Promise<TrustedTime> {
  if (navigator.onLine) {
    try {
      const { date, provider } = await fetchAuthoritativeTime();
      persistSync(date, provider);
      return { date, source: "server", provider };
    } catch {
      const sync = loadSync();
      if (!sync) {
        throw new ServerTimeError(
          "Não foi possível obter o horário do servidor. Verifique a conexão.",
          "fetch_failed"
        );
      }
      assertSyncFresh(sync);
      return syncResult(sync);
    }
  }

  const sync = loadSync();
  if (!sync) {
    throw new ServerTimeError(
      "Conecte-se à internet uma vez para sincronizar o horário do servidor.",
      "no_sync"
    );
  }

  assertSyncFresh(sync);
  return syncResult(sync);
}

/** Estado da última sincronização (útil para UI/diagnóstico). */
export function getTimeSyncInfo(): {
  syncedAt: Date | null;
  provider: "supabase" | "cloudflare" | null;
  ageMs: number | null;
} {
  const sync = loadSync();
  if (!sync) {
    return { syncedAt: null, provider: null, ageMs: null };
  }
  return {
    syncedAt: new Date(sync.serverMs),
    provider: sync.provider ?? null,
    ageMs: Date.now() - sync.wallMs,
  };
}
