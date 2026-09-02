import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY      = "cgb_metas_v2";
const OVERRIDES_KEY    = "cgb_metas_overrides_v1";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface MonthGoal {
  normais_semanal: number;
  seguranca_semanal: number;
}

export interface IndividualOverride {
  id?: string;
  matricula: string;
  nome: string;
  ano: number;
  mes: number;
  meta_semanal: number;
  motivo: string;
}

type GoalStore     = Record<string, MonthGoal>;          // "YYYY-MM"
type OverrideStore = Record<string, IndividualOverride>; // "YYYY-MM-matricula"

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS: MonthGoal = { normais_semanal: 2, seguranca_semanal: 5 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthKey(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function overrideKey(matricula: string, ano: number, mes: number): string {
  return `${monthKey(ano, mes)}-${matricula}`;
}

// ─── Persistência local ───────────────────────────────────────────────────────
function loadStore(): GoalStore {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as GoalStore; }
  catch { return {}; }
}

function loadOverrides(): OverrideStore {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}") as OverrideStore; }
  catch { return {}; }
}

function writeStore(s: GoalStore)        { try { localStorage.setItem(STORAGE_KEY,   JSON.stringify(s)); } catch { /* noop */ } }
function writeOverrides(s: OverrideStore){ try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(s)); } catch { /* noop */ } }

// ─── Estado global ────────────────────────────────────────────────────────────
const store     = ref<GoalStore>(loadStore());
const overrides = ref<OverrideStore>(loadOverrides());

// ─── Sync Supabase ────────────────────────────────────────────────────────────
async function syncFromSupabase(): Promise<void> {
  try {
    const [metasRes, ovRes] = await Promise.all([
      supabase.from("metas").select("ano, mes, normais_semanal, seguranca_semanal"),
      supabase.from("individual_goal_overrides").select("*"),
    ]);

    if (!metasRes.error && metasRes.data) {
      const merged: GoalStore = { ...store.value };
      for (const row of metasRes.data) {
        merged[monthKey(row.ano, row.mes)] = {
          normais_semanal:   Number(row.normais_semanal)   || DEFAULTS.normais_semanal,
          seguranca_semanal: Number(row.seguranca_semanal) || DEFAULTS.seguranca_semanal,
        };
      }
      store.value = merged;
      writeStore(merged);
    }

    if (!ovRes.error && ovRes.data) {
      const merged: OverrideStore = {};
      for (const row of ovRes.data) {
        merged[overrideKey(row.matricula, row.ano, row.mes)] = {
          id: row.id, matricula: row.matricula, nome: row.nome,
          ano: row.ano, mes: row.mes,
          meta_semanal: Number(row.meta_semanal),
          motivo: row.motivo ?? "",
        };
      }
      overrides.value = merged;
      writeOverrides(merged);
    }
  } catch { /* sem rede: usa cache local */ }
}

syncFromSupabase();

// ─── Composable público ───────────────────────────────────────────────────────
export function useGoals() {

  function getMonthGoal(ano: number, mes: number): MonthGoal {
    const entry = store.value[monthKey(ano, mes)];
    if (!entry) return { ...DEFAULTS };
    return {
      normais_semanal:   Number(entry.normais_semanal)   || DEFAULTS.normais_semanal,
      seguranca_semanal: Number(entry.seguranca_semanal) || DEFAULTS.seguranca_semanal,
    };
  }

  async function save(ano: number, mes: number, normaisSem: number, segurancaSem: number) {
    const key = monthKey(ano, mes);
    store.value = { ...store.value, [key]: { normais_semanal: normaisSem, seguranca_semanal: segurancaSem } };
    writeStore(store.value);
    await supabase.from("metas").upsert(
      { ano, mes, normais_semanal: normaisSem, seguranca_semanal: segurancaSem, updated_at: new Date().toISOString() },
      { onConflict: "ano,mes" }
    );
  }

  // Meta por perfil (sem override individual)
  function goalForGerencia(gerencia: string | undefined, ano: number, mes: number): { semanal: number; mensal: number } {
    const g = getMonthGoal(ano, mes);
    const isSesmt = gerencia === "SESMT";
    return {
      semanal: isSesmt ? g.seguranca_semanal : g.normais_semanal,
      mensal:  isSesmt ? g.seguranca_semanal * 4 : g.normais_semanal * 4,
    };
  }

  // Meta com override individual — use este nas páginas de acompanhamento
  function goalForColaborador(
    matricula: string | undefined,
    gerencia: string | undefined,
    ano: number,
    mes: number
  ): { semanal: number; mensal: number; isOverride: boolean } {
    if (matricula) {
      const ov = overrides.value[overrideKey(matricula, ano, mes)];
      if (ov !== undefined) {
        return { semanal: ov.meta_semanal, mensal: ov.meta_semanal * 4, isOverride: true };
      }
    }
    return { ...goalForGerencia(gerencia, ano, mes), isOverride: false };
  }

  function hasGoalDefined(ano: number, mes: number): boolean {
    return monthKey(ano, mes) in store.value;
  }

  // ─── Override individual ────────────────────────────────────────────────────
  function getOverridesForMonth(ano: number, mes: number): IndividualOverride[] {
    const prefix = monthKey(ano, mes) + "-";
    return Object.entries(overrides.value)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  function getOverride(matricula: string, ano: number, mes: number): IndividualOverride | undefined {
    return overrides.value[overrideKey(matricula, ano, mes)];
  }

  async function saveOverride(ov: IndividualOverride): Promise<void> {
    const key = overrideKey(ov.matricula, ov.ano, ov.mes);
    overrides.value = { ...overrides.value, [key]: ov };
    writeOverrides(overrides.value);

    const { data } = await supabase
      .from("individual_goal_overrides")
      .upsert(
        { matricula: ov.matricula, nome: ov.nome, ano: ov.ano, mes: ov.mes,
          meta_semanal: ov.meta_semanal, motivo: ov.motivo, updated_at: new Date().toISOString() },
        { onConflict: "matricula,ano,mes" }
      )
      .select("id")
      .single();

    if (data?.id) {
      overrides.value[key] = { ...ov, id: data.id };
      writeOverrides(overrides.value);
    }
  }

  async function removeOverride(matricula: string, ano: number, mes: number): Promise<void> {
    const key = overrideKey(matricula, ano, mes);
    const ov  = overrides.value[key];
    const copy = { ...overrides.value };
    delete copy[key];
    overrides.value = copy;
    writeOverrides(copy);

    if (ov?.id) {
      await supabase.from("individual_goal_overrides").delete().eq("id", ov.id);
    } else {
      await supabase.from("individual_goal_overrides")
        .delete().eq("matricula", matricula).eq("ano", ano).eq("mes", mes);
    }
  }

  return {
    getMonthGoal, save,
    goalForGerencia, goalForColaborador,
    hasGoalDefined,
    getOverridesForMonth, getOverride, saveOverride, removeOverride,
  };
}
