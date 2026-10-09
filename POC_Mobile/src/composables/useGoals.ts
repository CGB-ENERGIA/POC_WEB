import { ref, readonly } from "vue";
import { getSupabase } from "@/lib/supabase";

interface MonthGoal {
  normais_semanal: number;
  lideranca_semanal: number;
  seguranca_semanal: number;
}

const DEFAULTS: MonthGoal = { normais_semanal: 2, lideranca_semanal: 4, seguranca_semanal: 8 };

function foldRole(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function metaRole(gerencia?: string, funcao?: string): "encarregado" | "lideranca" | "tecnico" {
  const g = (gerencia ?? "").toUpperCase();
  const f = foldRole(funcao ?? "");
  if (g === "SESMT" || f.includes("sesmt") || f.includes("hse") || f.includes("seguranca")) {
    return "tecnico";
  }
  if (f.includes("encarregado")) return "encarregado";
  if (
    f.includes("supervisor") ||
    f.includes("coordenador") ||
    f.includes("fiscal") ||
    f.includes("planejamento") ||
    f.includes("gerente") ||
    f.includes("lideranca") ||
    /\blider\b/.test(f)
  ) {
    return "lideranca";
  }
  return "encarregado";
}

const cache = ref<Record<string, MonthGoal>>({});
const loaded = ref(false);

async function ensureLoaded(): Promise<void> {
  if (loaded.value) return;
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("metas" as never)
      .select("ano, mes, normais_semanal, lideranca_semanal, seguranca_semanal");
    if (data) {
      const next: Record<string, MonthGoal> = {};
      for (const row of data as {
        ano: number;
        mes: number;
        normais_semanal: number;
        lideranca_semanal?: number;
        seguranca_semanal: number;
      }[]) {
        const key = `${row.ano}-${String(row.mes).padStart(2, "0")}`;
        next[key] = {
          normais_semanal: Number(row.normais_semanal) || DEFAULTS.normais_semanal,
          lideranca_semanal: Number(row.lideranca_semanal) || DEFAULTS.lideranca_semanal,
          seguranca_semanal: Number(row.seguranca_semanal) || DEFAULTS.seguranca_semanal,
        };
      }
      cache.value = next;
    }
  } catch { /* sem rede: usa defaults */ }
  loaded.value = true;
}

export function useGoals() {
  function getGoal(
    gerencia: string | undefined,
    ano: number,
    mes: number,
    funcao?: string,
  ): { semanal: number; mensal: number } {
    const key = `${ano}-${String(mes).padStart(2, "0")}`;
    const g = cache.value[key] ?? DEFAULTS;
    const role = metaRole(gerencia, funcao);
    const semanal =
      role === "tecnico" ? g.seguranca_semanal
      : role === "lideranca" ? g.lideranca_semanal
      : g.normais_semanal;
    return { semanal, mensal: semanal * 4 };
  }

  return { getGoal, ensureLoaded, cache: readonly(cache), loaded: readonly(loaded) };
}
