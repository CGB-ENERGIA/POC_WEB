import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY      = "cgb_metas_v2";
const OVERRIDES_KEY    = "cgb_metas_overrides_v1";
const FUNC_KEY         = "cgb_metas_funcao_v1";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface MonthGoal {
  normais_semanal: number;
  lideranca_semanal: number;
  seguranca_semanal: number;
}

export interface IndividualOverride {
  id?: string;
  matricula: string;
  nome: string;
  ano: number;
  mes: number;
  semana: number; // 0 = todas as semanas do mês; 1-4 = semana específica
  meta_semanal: number;
  motivo: string;
}

type GoalStore     = Record<string, MonthGoal>;          // "YYYY-MM"
type OverrideStore = Record<string, IndividualOverride>; // "YYYY-MM-matricula"
type FuncStore     = Record<string, { meta: number; rotulo: string }>; // "YYYY-MM|chave da função"

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS: MonthGoal = { normais_semanal: 2, lideranca_semanal: 4, seguranca_semanal: 8 };

export const META_LIDERANCA_SEMANAL = DEFAULTS.lideranca_semanal;

export type MetaRole = "encarregado" | "lideranca" | "tecnico";

function foldRole(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Chave da função: minúsculas, sem acento e sem pontuação ("Tec. De Planejamento" -> "tec de planejamento"). */
export function chaveFuncao(funcao: string | undefined | null): string {
  return foldRole(funcao ?? "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function metaRoleFrom(gerencia?: string, funcao?: string): MetaRole {
  const g = (gerencia ?? "").toUpperCase();
  const f = foldRole(funcao ?? "");
  if (
    g === "SESMT" ||
    f.includes("sesmt") ||
    f.includes("hse") ||
    f.includes("seguranca")
  ) {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthKey(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function overrideKey(matricula: string, ano: number, mes: number, semana = 0): string {
  return `${monthKey(ano, mes)}-S${semana}-${matricula}`;
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

function loadFunc(): FuncStore {
  try { return JSON.parse(localStorage.getItem(FUNC_KEY) ?? "{}") as FuncStore; }
  catch { return {}; }
}
function writeFunc(s: FuncStore) { try { localStorage.setItem(FUNC_KEY, JSON.stringify(s)); } catch { /* noop */ } }

// ─── Estado global ────────────────────────────────────────────────────────────
const store     = ref<GoalStore>(loadStore());
const overrides = ref<OverrideStore>(loadOverrides());
const funcStore = ref<FuncStore>(loadFunc());

// ─── Sync Supabase ────────────────────────────────────────────────────────────
async function syncFromSupabase(): Promise<void> {
  try {
    const [metasRes, ovRes, fnRes] = await Promise.all([
      supabase.from("metas").select("ano, mes, normais_semanal, lideranca_semanal, seguranca_semanal"),
      supabase.from("individual_goal_overrides").select("*"),
      supabase.from("metas_funcao" as never).select("ano, mes, funcao, rotulo, meta_semanal"),
    ]);

    if (!metasRes.error && metasRes.data) {
      const merged: GoalStore = { ...store.value };
      for (const row of metasRes.data) {
        merged[monthKey(row.ano, row.mes)] = {
          normais_semanal:   Number(row.normais_semanal)   || DEFAULTS.normais_semanal,
          lideranca_semanal: Number(row.lideranca_semanal) || DEFAULTS.lideranca_semanal,
          seguranca_semanal: Number(row.seguranca_semanal) || DEFAULTS.seguranca_semanal,
        };
      }
      store.value = merged;
      writeStore(merged);
    }

    if (!ovRes.error && ovRes.data) {
      const merged: OverrideStore = {};
      for (const row of ovRes.data) {
        const sem = Number(row.semana ?? 0);
        merged[overrideKey(row.matricula, row.ano, row.mes, sem)] = {
          id: row.id, matricula: row.matricula, nome: row.nome,
          ano: row.ano, mes: row.mes, semana: sem,
          meta_semanal: Number(row.meta_semanal),
          motivo: row.motivo ?? "",
        };
      }
      overrides.value = merged;
      writeOverrides(merged);
    }

    if (!fnRes.error && fnRes.data) {
      const merged: FuncStore = {};
      for (const row of fnRes.data as unknown as { ano: number; mes: number; funcao: string; rotulo: string; meta_semanal: number }[]) {
        merged[`${monthKey(row.ano, row.mes)}|${row.funcao}`] = { meta: Number(row.meta_semanal), rotulo: row.rotulo ?? "" };
      }
      funcStore.value = merged;
      writeFunc(merged);
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
      lideranca_semanal: Number(entry.lideranca_semanal) || DEFAULTS.lideranca_semanal,
      seguranca_semanal: Number(entry.seguranca_semanal) || DEFAULTS.seguranca_semanal,
    };
  }

  async function save(
    ano: number,
    mes: number,
    normaisSem: number,
    liderancaSem: number,
    segurancaSem: number,
  ) {
    const key = monthKey(ano, mes);
    store.value = {
      ...store.value,
      [key]: {
        normais_semanal: normaisSem,
        lideranca_semanal: liderancaSem,
        seguranca_semanal: segurancaSem,
      },
    };
    writeStore(store.value);
    await supabase.from("metas").upsert(
      {
        ano,
        mes,
        normais_semanal: normaisSem,
        lideranca_semanal: liderancaSem,
        seguranca_semanal: segurancaSem,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ano,mes" },
    );
  }

  // Meta por perfil (sem override individual)
  function goalForGerencia(
    gerencia: string | undefined,
    ano: number,
    mes: number,
    funcao?: string,
  ): { semanal: number; mensal: number } {
    const g = getMonthGoal(ano, mes);
    const role = metaRoleFrom(gerencia, funcao);
    // Meta própria da função (Técnico de Segurança segue sempre o perfil de Segurança)
    if (role !== "tecnico") {
      const f = funcStore.value[`${monthKey(ano, mes)}|${chaveFuncao(funcao)}`];
      if (f) return { semanal: f.meta, mensal: f.meta * 4 };
    }
    const semanal =
      role === "tecnico" ? g.seguranca_semanal
      : role === "lideranca" ? g.lideranca_semanal
      : g.normais_semanal;
    return { semanal, mensal: semanal * 4 };
  }

  // Metas próprias por função, no mês (chave da função -> meta)
  function getFunctionGoals(ano: number, mes: number): Record<string, { meta: number; rotulo: string }> {
    const prefix = `${monthKey(ano, mes)}|`;
    const out: Record<string, { meta: number; rotulo: string }> = {};
    for (const [k, v] of Object.entries(funcStore.value)) {
      if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
    }
    return out;
  }

  /** Grava (upsert) as metas de função informadas e remove as listadas; falha se o banco recusar. */
  async function saveFunctionGoals(
    ano: number,
    mes: number,
    salvar: { chave: string; rotulo: string; meta: number }[],
    remover: string[],
  ): Promise<void> {
    if (salvar.length) {
      const { error } = await supabase.from("metas_funcao" as never).upsert(
        salvar.map((r) => ({
          ano, mes, funcao: r.chave, rotulo: r.rotulo, meta_semanal: r.meta, updated_at: new Date().toISOString(),
        })) as never,
        { onConflict: "ano,mes,funcao" },
      );
      if (error) throw new Error(error.message);
    }
    if (remover.length) {
      const { error } = await supabase.from("metas_funcao" as never)
        .delete().eq("ano", ano).eq("mes", mes).in("funcao", remover);
      if (error) throw new Error(error.message);
    }
    const prefix = `${monthKey(ano, mes)}|`;
    const next = { ...funcStore.value };
    for (const r of salvar) next[`${prefix}${r.chave}`] = { meta: r.meta, rotulo: r.rotulo };
    for (const c of remover) delete next[`${prefix}${c}`];
    funcStore.value = next;
    writeFunc(next);
  }

  // Meta com override individual — use este nas páginas de acompanhamento
  function goalForColaborador(
    matricula: string | undefined,
    gerencia: string | undefined,
    ano: number,
    mes: number,
    semana?: number,
    funcao?: string,
  ): { semanal: number; mensal: number; isOverride: boolean } {
    if (matricula) {
      // Override de semana específica tem prioridade
      if (semana && semana > 0) {
        const weekOv = overrides.value[overrideKey(matricula, ano, mes, semana)];
        if (weekOv !== undefined) {
          return { semanal: weekOv.meta_semanal, mensal: weekOv.meta_semanal * 4, isOverride: true };
        }
      }
      // Override mensal (todas as semanas)
      const monthOv = overrides.value[overrideKey(matricula, ano, mes, 0)];
      if (monthOv !== undefined) {
        return { semanal: monthOv.meta_semanal, mensal: monthOv.meta_semanal * 4, isOverride: true };
      }
    }
    return { ...goalForGerencia(gerencia, ano, mes, funcao), isOverride: false };
  }

  function hasGoalDefined(ano: number, mes: number): boolean {
    return monthKey(ano, mes) in store.value;
  }

  // ─── Override individual ────────────────────────────────────────────────────
  function getOverridesForMonth(ano: number, mes: number): IndividualOverride[] {
    const prefix = monthKey(ano, mes) + "-S";
    return Object.entries(overrides.value)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v)
      .sort((a, b) => {
        if ((a.semana ?? 0) !== (b.semana ?? 0)) return (a.semana ?? 0) - (b.semana ?? 0);
        return a.nome.localeCompare(b.nome);
      });
  }

  function getOverride(matricula: string, ano: number, mes: number, semana = 0): IndividualOverride | undefined {
    return overrides.value[overrideKey(matricula, ano, mes, semana)];
  }

  async function saveOverride(ov: IndividualOverride): Promise<void> {
    const sem = ov.semana ?? 0;
    const key = overrideKey(ov.matricula, ov.ano, ov.mes, sem);
    overrides.value = { ...overrides.value, [key]: { ...ov, semana: sem } };
    writeOverrides(overrides.value);

    const { data } = await supabase
      .from("individual_goal_overrides")
      .upsert(
        { matricula: ov.matricula, nome: ov.nome, ano: ov.ano, mes: ov.mes,
          semana: sem,
          meta_semanal: ov.meta_semanal, motivo: ov.motivo, updated_at: new Date().toISOString() },
        { onConflict: "matricula,ano,mes,semana" }
      )
      .select("id")
      .single();

    if (data?.id) {
      overrides.value[key] = { ...ov, semana: sem, id: data.id };
      writeOverrides(overrides.value);
    }
  }

  async function removeOverride(matricula: string, ano: number, mes: number, semana = 0): Promise<void> {
    const key = overrideKey(matricula, ano, mes, semana);
    const ov  = overrides.value[key];
    const copy = { ...overrides.value };
    delete copy[key];
    overrides.value = copy;
    writeOverrides(copy);

    if (ov?.id) {
      await supabase.from("individual_goal_overrides").delete().eq("id", ov.id);
    } else {
      await supabase.from("individual_goal_overrides")
        .delete().eq("matricula", matricula).eq("ano", ano).eq("mes", mes).eq("semana", semana);
    }
  }

  return {
    getMonthGoal, save,
    goalForGerencia, goalForColaborador,
    getFunctionGoals, saveFunctionGoals,
    hasGoalDefined,
    getOverridesForMonth, getOverride, saveOverride, removeOverride,
  };
}
