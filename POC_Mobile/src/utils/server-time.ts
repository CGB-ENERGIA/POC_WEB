export type TimeSource = "server" | "device";

export interface TrustedTime {
  date: Date;
  source: TimeSource;
}

const TRACE_URL = "https://www.cloudflare.com/cdn-cgi/trace";

async function fetchServerTime(): Promise<Date> {
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

/** Hora confiável para carimbo: servidor quando online, relógio do aparelho offline. */
export async function getTrustedTime(): Promise<TrustedTime> {
  if (!navigator.onLine) {
    return { date: new Date(), source: "device" };
  }

  try {
    return { date: await fetchServerTime(), source: "server" };
  } catch {
    return { date: new Date(), source: "device" };
  }
}
