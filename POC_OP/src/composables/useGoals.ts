import { ref } from "vue";

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

// Estado global compartilhado
const store = ref<GoalStore>(loadStore());

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

  function save(ano: number, mes: number, normaisSem: number, segurancaSem: number) {
    const key = monthKey(ano, mes);
    store.value = {
      ...store.value,
      [key]: { normais_semanal: normaisSem, seguranca_semanal: segurancaSem },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.value));
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
