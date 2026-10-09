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

/** Chave da função (igual à do painel): minúsculas, sem acento e sem pontuação. */
function chaveFuncao(funcao?: string): string {
  return foldRole(funcao ?? "").replace(/[^a-z0-9]+/g, " ").trim();
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

const FUNC_STORAGE_KEY = "cgb-metas-funcao";

function lerFuncGuardada(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(FUNC_STORAGE_KEY) ?? "{}") as Record<string, number>; }
  catch { return {}; }
}

const cache = ref<Record<string, MonthGoal>>({});
/** Metas próprias por função ("YYYY-MM|chave" -> meta semanal); cópia local para funcionar sem internet. */
const funcCache = ref<Record<string, number>>(lerFuncGuardada());
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

    const { data: fn, error: fnErr } = await sb
      .from("metas_funcao" as never)
      .select("ano, mes, funcao, meta_semanal");
    if (!fnErr && fn) {
      const porFuncao: Record<string, number> = {};
      for (const row of fn as unknown as { ano: number; mes: number; funcao: string; meta_semanal: number }[]) {
        porFuncao[`${row.ano}-${String(row.mes).padStart(2, "0")}|${row.funcao}`] = Number(row.meta_semanal);
      }
      funcCache.value = porFuncao;
      try { localStorage.setItem(FUNC_STORAGE_KEY, JSON.stringify(porFuncao)); } catch { /* sem espaço */ }
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
    // Meta própria da função (Técnico de Segurança segue sempre o perfil de Segurança)
    if (role !== "tecnico") {
      const f = funcCache.value[`${key}|${chaveFuncao(funcao)}`];
      if (f !== undefined) return { semanal: f, mensal: f * 4 };
    }
    const semanal =
      role === "tecnico" ? g.seguranca_semanal
      : role === "lideranca" ? g.lideranca_semanal
      : g.normais_semanal;
    return { semanal, mensal: semanal * 4 };
  }

  return { getGoal, ensureLoaded, cache: readonly(cache), loaded: readonly(loaded) };
}
