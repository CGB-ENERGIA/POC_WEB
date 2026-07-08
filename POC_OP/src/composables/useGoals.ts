import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "cgb_metas_v2";

interface MonthGoal {
  normais_semanal: number;
  seguranca_semanal: number;
}

type GoalStore = Record<string, MonthGoal>; // chave: "YYYY-MM"

const DEFAULTS: MonthGoal = {
  normais_semanal: 2,
  seguranca_semanal: 5,
};

function monthKey(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function loadStore(): GoalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoalStore) : {};
  } catch {
    return {};
  }
}

function writeStore(s: GoalStore) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

// Estado global compartilhado
const store = ref<GoalStore>(loadStore());

// Carrega do Supabase ao iniciar e atualiza o cache local
async function syncFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("metas")
      .select("ano, mes, normais_semanal, seguranca_semanal");
    if (error || !data) return;
    const merged: GoalStore = { ...store.value };
    for (const row of data) {
      const key = monthKey(row.ano, row.mes);
      merged[key] = {
        normais_semanal:   Number(row.normais_semanal)   || DEFAULTS.normais_semanal,
        seguranca_semanal: Number(row.seguranca_semanal) || DEFAULTS.seguranca_semanal,
      };
    }
    store.value = merged;
    writeStore(merged);
  } catch { /* sem rede: usa cache local */ }
}

// Dispara na inicialização do módulo (não bloqueia)
syncFromSupabase();

export function useGoals() {
  function getMonthGoal(ano: number, mes: number): MonthGoal {
    const key = monthKey(ano, mes);
    const entry = store.value[key];
    if (!entry) return { ...DEFAULTS };
    return {
      normais_semanal:   Number(entry.normais_semanal)   || DEFAULTS.normais_semanal,
      seguranca_semanal: Number(entry.seguranca_semanal) || DEFAULTS.seguranca_semanal,
    };
  }

  async function save(ano: number, mes: number, normaisSem: number, segurancaSem: number) {
    const key = monthKey(ano, mes);
    store.value = {
      ...store.value,
      [key]: { normais_semanal: normaisSem, seguranca_semanal: segurancaSem },
    };
    writeStore(store.value);
    await supabase.from("metas").upsert(
      { ano, mes, normais_semanal: normaisSem, seguranca_semanal: segurancaSem, updated_at: new Date().toISOString() },
      { onConflict: "ano,mes" }
    );
  }

  function goalForGerencia(
    gerencia: string | undefined,
    ano: number,
    mes: number
  ): { semanal: number; mensal: number } {
    const g = getMonthGoal(ano, mes);
    const isSesmt = gerencia === "SESMT";
    return {
      semanal: isSesmt ? g.seguranca_semanal : g.normais_semanal,
      mensal:  isSesmt ? g.seguranca_semanal * 4 : g.normais_semanal * 4,
    };
  }

  function hasGoalDefined(ano: number, mes: number): boolean {
    return monthKey(ano, mes) in store.value;
  }

  return { getMonthGoal, save, goalForGerencia, hasGoalDefined };
}
