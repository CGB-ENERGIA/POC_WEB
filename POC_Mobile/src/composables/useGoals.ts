import { ref, readonly } from "vue";
import { getSupabase } from "@/lib/supabase";

interface MonthGoal {
  normais_semanal: number;
  seguranca_semanal: number;
}

const DEFAULTS: MonthGoal = { normais_semanal: 2, seguranca_semanal: 5 };

// Cache in-memory compartilhado entre componentes
const cache = ref<Record<string, MonthGoal>>({});
const loaded = ref(false);

async function ensureLoaded(): Promise<void> {
  if (loaded.value) return;
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("metas" as never)
      .select("ano, mes, normais_semanal, seguranca_semanal");
    if (data) {
      const next: Record<string, MonthGoal> = {};
      for (const row of data as { ano: number; mes: number; normais_semanal: number; seguranca_semanal: number }[]) {
        const key = `${row.ano}-${String(row.mes).padStart(2, "0")}`;
        next[key] = {
          normais_semanal:   Number(row.normais_semanal)   || DEFAULTS.normais_semanal,
          seguranca_semanal: Number(row.seguranca_semanal) || DEFAULTS.seguranca_semanal,
        };
      }
      cache.value = next;
    }
  } catch { /* sem rede: usa defaults */ }
  loaded.value = true;
}

export function useGoals() {
  function getGoal(gerencia: string | undefined, ano: number, mes: number): { semanal: number; mensal: number } {
    const key = `${ano}-${String(mes).padStart(2, "0")}`;
    const g = cache.value[key] ?? DEFAULTS;
    const isSesmt = gerencia === "SESMT";
    return {
      semanal: isSesmt ? g.seguranca_semanal : g.normais_semanal,
      mensal:  isSesmt ? g.seguranca_semanal * 4 : g.normais_semanal * 4,
    };
  }

  return { getGoal, ensureLoaded, cache: readonly(cache), loaded: readonly(loaded) };
}
