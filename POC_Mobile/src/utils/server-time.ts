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

/** Espera máxima pelo servidor quando já há uma sincronização válida guardada. */
const FETCH_RAPIDO_MS = 2000;
/** Uma sincronização feita há menos que isso é reaproveitada (várias fotos/etapas seguidas). */
const REUSO_SYNC_MS = 2 * 60 * 1000;

/** Depois de uma tentativa rápida falhar, não insiste no servidor por este tempo (usa a hora salva). */
const PAUSA_APOS_FALHA_MS = 30 * 1000;
let falhaRedeEm = Number.NEGATIVE_INFINITY;

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

async function fetchSupabaseServerTime(timeoutMs = 5000): Promise<Date> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .rpc("get_server_time")
    .abortSignal(AbortSignal.timeout(timeoutMs));
  if (error || !data) {
    throw error ?? new Error("Resposta de hora inválida");
  }
  return new Date(data as string);
}

async function fetchCloudflareServerTime(timeoutMs = 5000): Promise<Date> {
  const res = await fetch(TRACE_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  const ts = text.match(/ts=([0-9.]+)/)?.[1];
  if (ts) return new Date(parseFloat(ts) * 1000);

  const dateHeader = res.headers.get("date");
  if (dateHeader) return new Date(dateHeader);

  throw new Error("Resposta de hora inválida");
}

/**
 * Postgres (Supabase) → Cloudflare trace → falha.
 * `rapido`: já existe uma sincronização válida guardada; tenta só uma vez e por pouco
 * tempo, para não travar o app quando há sinal mas não há internet de verdade.
 */
async function fetchAuthoritativeTime(rapido = false): Promise<{ date: Date; provider: "supabase" | "cloudflare" }> {
  const limite = rapido ? FETCH_RAPIDO_MS : 5000;
  if (isSupabaseConfigured()) {
    try {
      return { date: await fetchSupabaseServerTime(limite), provider: "supabase" };
    } catch (err) {
      if (rapido) throw err; // com sync guardada, não gasta mais tempo no fallback
      // fallback se Supabase indisponível momentaneamente
    }
  }

  return { date: await fetchCloudflareServerTime(limite), provider: "cloudflare" };
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

function temSyncValida(): boolean {
  const sync = loadSync();
  if (!sync) return false;
  try {
    assertSyncFresh(sync);
    return true;
  } catch {
    return false;
  }
}

async function getTrustedTimeOnce(): Promise<TrustedTime> {
  if (navigator.onLine) {
    const rapido = temSyncValida();
    if (rapido && performance.now() - falhaRedeEm < PAUSA_APOS_FALHA_MS) {
      return syncResult(loadSync()!); // sinal sem internet: já falhou há pouco, usa a hora salva
    }
    try {
      const { date, provider } = await fetchAuthoritativeTime(rapido);
      persistSync(date, provider);
      return { date, source: "server", provider };
    } catch {
      if (rapido) falhaRedeEm = performance.now();
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

/**
 * Hora baseada no servidor (Postgres via Supabase, ou Cloudflare).
 * Offline: extrapola a última sync — nunca usa o relógio absoluto do aparelho.
 * Em caso de fetch_failed online, tenta uma vez após 1.5 s antes de desistir.
 */
export async function getTrustedTime(): Promise<TrustedTime> {
  // Sincronização feita há poucos segundos: extrapola com o relógio monotônico (performance.now),
  // que não é afetado por mudar a hora do celular. Evita refazer a ida ao servidor a cada passo.
  if (sessionPerfAnchor) {
    const idade = performance.now() - sessionPerfAnchor.perfMs;
    if (idade >= 0 && idade < REUSO_SYNC_MS) {
      const provider = loadSync()?.provider;
      const reuso: TrustedTime = { date: new Date(sessionPerfAnchor.serverMs + idade), source: "server" };
      if (provider) reuso.provider = provider;
      return reuso;
    }
  }
  try {
    return await getTrustedTimeOnce();
  } catch (err) {
    if (err instanceof ServerTimeError && err.code === "fetch_failed" && navigator.onLine) {
      await new Promise<void>((r) => setTimeout(r, 1500));
      return await getTrustedTimeOnce();
    }
    throw err;
  }
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
