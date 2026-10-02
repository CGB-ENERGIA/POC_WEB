import { supabase } from "./supabase";

export interface Filters {
  ano: number;
  mes?: number;
  semana?: number;
  base?: string;
  gerencia?: string;
  gerente?: string;
  /** Aprovado + pendente (o PWA já conta o registro enviado). */
  contarMeta?: boolean;
}

/** Intervalo ISO para um mês (início inclusive, fim exclusive). */
function mesRange(ano: number, mes: number) {
  const start = new Date(ano, mes - 1, 1).toISOString();
  const end   = new Date(ano, mes, 1).toISOString();
  return { start, end };
}

/**
 * Retorna o número da semana do mês (1-4) com base no cronograma padrão CGB:
 *   1ª Semana = dias 01–08
 *   2ª Semana = dias 09–15
 *   3ª Semana = dias 16–22
 *   4ª Semana = dias 23–31
 */
export function semanaDoMes(dia: number): 1 | 2 | 3 | 4 {
  if (dia <= 8)  return 1;
  if (dia <= 15) return 2;
  if (dia <= 22) return 3;
  return 4;
}

/** Dia do mês a partir do campo `data`, sem deslocar fuso. */
export function diaDoMes(data: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (m) return Number(m[3]);
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? 0 : d.getDate();
}

export function semanaDaData(data: string): 1 | 2 | 3 | 4 {
  return semanaDoMes(diaDoMes(data));
}

export function normMatricula(m: string | undefined | null): string {
  const t = (m ?? "").trim();
  if (!t) return "";
  return t.replace(/^0+/, "") || "0";
}

export function foldName(s: string | undefined | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface ObserverIndex {
  byMat: Map<string, EmployeeRow>;
  byName: Map<string, EmployeeRow[]>;
}

export function indexEmployees(employees: EmployeeRow[]): ObserverIndex {
  const byMat = new Map<string, EmployeeRow>();
  const byName = new Map<string, EmployeeRow[]>();
  const addName = (raw: string, e: EmployeeRow) => {
    const k = foldName(raw);
    if (k.length < 2) return;
    const arr = byName.get(k) ?? [];
    if (!arr.some((x) => normMatricula(x.matricula) === normMatricula(e.matricula))) arr.push(e);
    byName.set(k, arr);
  };
  for (const e of employees) {
    const mat = normMatricula(e.matricula);
    if (mat) byMat.set(mat, e);
    addName(e.nome, e);
    addName(e.nome_completo, e);
  }
  return { byMat, byName };
}

export function matchSubmissionToEmployee(
  s: SubmissionRow,
  idx: ObserverIndex,
): EmployeeRow | undefined {
  const mat = normMatricula(s.matricula);
  if (mat) {
    const hit = idx.byMat.get(mat);
    if (hit) return hit;
  }
  const obs = foldName(s.observador);
  if (!obs) return undefined;
  const exact = idx.byName.get(obs);
  if (exact?.length === 1) return exact[0];
  if (exact && exact.length > 1 && mat) {
    const byM = exact.find((e) => normMatricula(e.matricula) === mat);
    if (byM) return byM;
  }
  if (obs.length >= 5) {
    const hits: EmployeeRow[] = [];
    for (const [name, emps] of idx.byName) {
      if (!(name.startsWith(obs) || (obs.startsWith(name) && name.length >= 5))) continue;
      for (const e of emps) {
        if (!hits.some((h) => normMatricula(h.matricula) === normMatricula(e.matricula))) hits.push(e);
      }
    }
    if (hits.length === 1) return hits[0];
  }
  return undefined;
}

/** Liga cada registro ao observador do roster (matrícula normalizada ou nome). */
export function tallyObserverRecords(
  roster: EmployeeRow[],
  allEmployees: EmployeeRow[],
  subs: SubmissionRow[],
): { counts: Map<string, number>; extras: EmployeeRow[] } {
  const idx = indexEmployees(allEmployees);
  const counts = new Map<string, number>();
  const unmatched: SubmissionRow[] = [];
  for (const s of subs) {
    const emp = matchSubmissionToEmployee(s, idx);
    if (emp) {
      const k = normMatricula(emp.matricula);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    } else {
      unmatched.push(s);
    }
  }
  const rosterMats = new Set(roster.map((e) => normMatricula(e.matricula)));
  const extras: EmployeeRow[] = [];
  const seen = new Set<string>();
  for (const s of unmatched) {
    const k = normMatricula(s.matricula) || foldName(s.observador) || s.id;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (seen.has(k) || rosterMats.has(k)) continue;
    seen.add(k);
    extras.push({
      matricula: s.matricula || k,
      nome: (s.observador.split(/\s+/)[0] || s.observador).trim(),
      nome_completo: s.observador,
      gerencia: "",
      base: s.base,
      funcao: "",
    });
  }
  return { counts, extras };
}

/** Intervalo ISO para a semana do mês, conforme cronograma padrão CGB. */
function semanaRange(ano: number, mes: number, semana: number) {
  const STARTS = [1, 9, 16, 23] as const;
  const diaInicio = STARTS[semana - 1] ?? 1;
  const start = new Date(ano, mes - 1, diaInicio).toISOString();
  const end = semana >= 4
    ? new Date(ano, mes, 1).toISOString()
    : new Date(ano, mes - 1, STARTS[semana]!).toISOString();
  return { start, end };
}

// ─── Tipos de retorno ────────────────────────────────────────────────────────

export interface SubmissionRow {
  id: string;
  matricula: string;
  observador: string;
  auditagem: string;
  data: string;
  base: string;
  equipe: string;
  membros: { nome: string; matricula: string }[];
  resumo: { total: number; conformes: number; naoConformes: number };
}

export interface ResponseRow {
  submission_id: string;
  pergunta_id: string;
  categoria: string;
  pergunta: string;
  gravidade: string;
  peso: number;
  resposta: "conforme" | "nao_conforme";
  observacao: string | null;
  foto_r2_key: string | null;
  /** Resolvida no momento da auditoria (pergunta obrigatoria no PWA). null = registro antigo. */
  resolvido: boolean | null;
  /** Condicao individual de cada item, quando a pergunta menciona mais de uma coisa. */
  itens: { nome: string; conforme: boolean }[] | null;
  /** A quem a nao conformidade foi atribuida: equipe toda ou um membro especifico. */
  atribuido_tipo: "equipe" | "membro" | null;
  atribuido_nome: string | null;
  atribuido_matricula: string | null;
}

export interface EmployeeRow {
  matricula: string;
  nome: string;
  nome_completo: string;
  gerencia: string;
  base: string;
  funcao: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

function applySubmissionFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  f: Filters,
  usarSemana = false
) {
  if (usarSemana && f.semana && f.mes) {
    const { start, end } = semanaRange(f.ano, f.mes, f.semana);
    q = q.gte("data", start).lt("data", end);
  } else if (f.mes) {
    const { start, end } = mesRange(f.ano, f.mes);
    q = q.gte("data", start).lt("data", end);
  } else {
    const start = new Date(f.ano, 0, 1).toISOString();
    const end   = new Date(f.ano + 1, 0, 1).toISOString();
    q = q.gte("data", start).lt("data", end);
  }
  if (f.base && f.base !== "Todos") q = q.eq("base", f.base);
  return q;
}

/** Submissions do período. `contarMeta` inclui pendentes (já registrados no PWA). */
export async function fetchSubmissions(f: Filters, usarSemana = false): Promise<SubmissionRow[]> {
  let q = supabase
    .from("checklist_submissions")
    .select("id,matricula,observador,auditagem,data,base,equipe,membros,resumo")
    .order("data", { ascending: true });

  q = f.contarMeta
    ? q.in("status", ["aprovado", "pendente"])
    : q.eq("status", "aprovado");

  q = applySubmissionFilters(q, f, usarSemana);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SubmissionRow[];
}

/** Respostas ligadas a um conjunto de submissions (chunked para suportar grandes períodos, ex: ano inteiro). */
export async function fetchResponses(submissionIds: string[]): Promise<ResponseRow[]> {
  if (!submissionIds.length) return [];
  const CHUNK = 300;
  const all: ResponseRow[] = [];
  for (let i = 0; i < submissionIds.length; i += CHUNK) {
    const chunk = submissionIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("checklist_responses")
      .select("submission_id,pergunta_id,categoria,pergunta,gravidade,peso,resposta,observacao,foto_r2_key,resolvido,itens,atribuido_tipo,atribuido_nome,atribuido_matricula")
      .in("submission_id", chunk);
    if (error) throw error;
    all.push(...((data ?? []) as ResponseRow[]));
  }
  return all;
}

/** Contagem de não conformidades por mês, ao longo de um ano inteiro (para gráfico de tendência). */
export async function fetchNaoConformesPorMes(ano: number, base?: string): Promise<Record<number, number>> {
  let q = supabase.from("checklist_submissions").select("id,data").eq("status", "aprovado");
  const start = new Date(ano, 0, 1).toISOString();
  const end = new Date(ano + 1, 0, 1).toISOString();
  q = q.gte("data", start).lt("data", end);
  if (base && base !== "Todos") q = q.eq("base", base);

  const { data: subs, error: subErr } = await q;
  if (subErr) throw subErr;
  if (!subs?.length) return {};

  const mesPorSubmissao = new Map<string, number>();
  for (const s of subs) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.data);
    mesPorSubmissao.set(s.id, m ? Number(m[2]) : new Date(s.data).getMonth() + 1);
  }

  const ids = subs.map((s) => s.id);
  const CHUNK = 300;
  const map: Record<number, number> = {};
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data: resps, error: respErr } = await supabase
      .from("checklist_responses")
      .select("submission_id")
      .eq("resposta", "nao_conforme")
      .in("submission_id", chunk);
    if (respErr) throw respErr;
    for (const r of resps ?? []) {
      const mes = mesPorSubmissao.get(r.submission_id);
      if (mes) map[mes] = (map[mes] ?? 0) + 1;
    }
  }
  return map;
}

export interface IcitPrefixo {
  visitas: number;
  semNc: number;
}

/**
 * Mapa prefixo -> { visitas, semNc } dentro de um intervalo de datas [startIso, endIso).
 * semNc = checklists sem nenhuma resposta "nao_conforme" (base do calculo de ICIT).
 */
export async function fetchIcitPorPrefixo(startIso: string, endIso: string, base?: string): Promise<Map<string, IcitPrefixo>> {
  let q = supabase.from("checklist_submissions").select("id,equipe").eq("status", "aprovado");
  q = q.gte("data", startIso).lt("data", endIso);
  if (base && base !== "Todos") q = q.eq("base", base);

  const { data: subs, error: subErr } = await q;
  if (subErr) throw subErr;

  const map = new Map<string, IcitPrefixo>();
  if (!subs?.length) return map;

  const ids = subs.map((s) => s.id);
  const CHUNK = 300;
  const ncSubIds = new Set<string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data: resps, error: respErr } = await supabase
      .from("checklist_responses")
      .select("submission_id")
      .eq("resposta", "nao_conforme")
      .in("submission_id", chunk);
    if (respErr) throw respErr;
    for (const r of resps ?? []) ncSubIds.add(r.submission_id);
  }

  for (const s of subs) {
    if (!s.equipe) continue;
    if (!map.has(s.equipe)) map.set(s.equipe, { visitas: 0, semNc: 0 });
    const entry = map.get(s.equipe)!;
    entry.visitas++;
    if (!ncSubIds.has(s.id)) entry.semNc++;
  }
  return map;
}

/** Todos os funcionários ativos. */
export async function fetchEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("matricula,nome,nome_completo,gerencia,base,funcao")
    .eq("ativo", true)
    .order("nome_completo");
  if (error) throw error;
  return (data ?? []) as EmployeeRow[];
}

// ─── Helpers de agregação ─────────────────────────────────────────────────────

/** Conta submissions por observador (campo observador). */
export function countByObservador(subs: SubmissionRow[]): Record<string, number> {
  return subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.observador] = (acc[s.observador] ?? 0) + 1;
    return acc;
  }, {});
}

/** Conta submissions por matrícula. */
export function countByMatricula(subs: SubmissionRow[]): Record<string, number> {
  return subs.reduce<Record<string, number>>((acc, s) => {
    if (!s.matricula) return acc;
    acc[s.matricula] = (acc[s.matricula] ?? 0) + 1;
    return acc;
  }, {});
}

/** Roster de observadores para gráficos de meta (todos, inclusive quem fez 0). */
export function filterObserverRoster(
  employees: EmployeeRow[],
  opts: { gerencia?: string; gerente?: string; funcao?: string; base?: string } = {},
): EmployeeRow[] {
  let list = employees;
  if (opts.gerencia && opts.gerencia !== "Todos") {
    list = list.filter((e) => e.gerencia === opts.gerencia);
  }
  if (opts.funcao && opts.funcao !== "Todos") {
    list = list.filter((e) => e.funcao === opts.funcao);
  }
  if (opts.base && opts.base !== "Todos") {
    list = list.filter((e) => e.base === opts.base);
  }
  if (opts.gerente && opts.gerente !== "Todos") {
    const g = foldName(opts.gerente);
    list = list.filter((e) => {
      const nome = foldName(e.nome);
      const full = foldName(e.nome_completo);
      return nome === g || full === g || full.startsWith(`${g} `) || nome.startsWith(`${g} `);
    });
  }
  return list;
}

/** Inclui quem submeteu no período mas ainda não está na tabela de observadores. */
export function mergeOrphanObservers(
  roster: EmployeeRow[],
  subs: SubmissionRow[],
): EmployeeRow[] {
  const seen = new Set(roster.map((e) => e.matricula));
  const extra: EmployeeRow[] = [];
  for (const s of subs) {
    if (!s.matricula || seen.has(s.matricula)) continue;
    seen.add(s.matricula);
    extra.push({
      matricula: s.matricula,
      nome: (s.observador.split(/\s+/)[0] || s.observador).trim(),
      nome_completo: s.observador,
      gerencia: "",
      base: s.base,
      funcao: "",
    });
  }
  return extra.length ? [...roster, ...extra] : roster;
}

export function uniqueChartLabels(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((raw, i) => {
    let label = (raw || `obs ${i + 1}`).trim();
    if (used.has(label)) {
      let k = 2;
      while (used.has(`${label} ${k}`)) k++;
      label = `${label} ${k}`;
    }
    used.add(label);
    return label;
  });
}

/** Conta submissions por base. */
export function countByBase(subs: SubmissionRow[]): Record<string, number> {
  return subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.base] = (acc[s.base] ?? 0) + 1;
    return acc;
  }, {});
}

/** Conta por semana-do-mês (1-4+). */
export function countBySemana(subs: SubmissionRow[]): Record<number, number> {
  return subs.reduce<Record<number, number>>((acc, s) => {
    const dia = new Date(s.data).getDate();
    const sem = Math.ceil(dia / 7);
    acc[sem] = (acc[sem] ?? 0) + 1;
    return acc;
  }, {});
}

/** Evolução mensal: total de submissions por mês (1-12). */
export function countByMes(subs: SubmissionRow[]): Record<number, number> {
  return subs.reduce<Record<number, number>>((acc, s) => {
    const mes = new Date(s.data).getMonth() + 1;
    acc[mes] = (acc[mes] ?? 0) + 1;
    return acc;
  }, {});
}

/** Índice de conformidade por categoria. */
export function conformidadePorCategoria(
  responses: ResponseRow[]
): { categoria: string; conformes: number; total: number; pct: number }[] {
  const map: Record<string, { c: number; t: number }> = {};
  for (const r of responses) {
    if (!map[r.categoria]) map[r.categoria] = { c: 0, t: 0 };
    map[r.categoria].t++;
    if (r.resposta === "conforme") map[r.categoria].c++;
  }
  return Object.entries(map).map(([categoria, { c, t }]) => ({
    categoria,
    conformes: c,
    total: t,
    pct: t ? Math.round((c / t) * 100) : 0,
  }));
}

/** Não conformidades por gravidade. */
export function ncPorGravidade(responses: ResponseRow[]): Record<string, number> {
  return responses
    .filter((r) => r.resposta === "nao_conforme")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.gravidade] = (acc[r.gravidade] ?? 0) + 1;
      return acc;
    }, {});
}

// ─── Resolução de NCs ────────────────────────────────────────────────────────

export type AnaliseStatus = "pendente" | "aprovado" | "reprovado";

export interface ResolucaoRow {
  id: string;
  submission_id: string;
  pergunta_id: string;
  resolvido_por: string;
  observacao?: string | null;
  data_resolucao: string;
  foto_r2_key: string;
  status: AnaliseStatus;
  comentario_analise?: string | null;
  analisado_por?: string | null;
  data_analise?: string | null;
}

const RESOLUCAO_FIELDS = "id,submission_id,pergunta_id,resolvido_por,observacao,data_resolucao,foto_r2_key,status,comentario_analise,analisado_por,data_analise";

export async function fetchResolucoes(submissionIds: string[]): Promise<ResolucaoRow[]> {
  if (!submissionIds.length) return [];
  const { data, error } = await supabase
    .from("nc_resolucoes")
    .select(RESOLUCAO_FIELDS)
    .in("submission_id", submissionIds);
  if (error) throw error;
  return (data ?? []) as ResolucaoRow[];
}

export async function inserirResolucao(
  row: Omit<ResolucaoRow, "id" | "status" | "comentario_analise" | "analisado_por" | "data_analise" | "observacao"> & { observacao?: string }
): Promise<ResolucaoRow> {
  const { data, error } = await supabase
    .from("nc_resolucoes")
    .insert({ ...row, status: "pendente" })
    .select(RESOLUCAO_FIELDS)
    .single();
  if (error) throw error;
  return data as ResolucaoRow;
}

export async function fetchAnalisePendentes(): Promise<ResolucaoRow[]> {
  const { data, error } = await supabase
    .from("nc_resolucoes")
    .select(RESOLUCAO_FIELDS)
    .order("data_resolucao", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ResolucaoRow[];
}

export async function atualizarStatusAnalise(
  id: string,
  status: AnaliseStatus,
  analisadoPor: string,
  comentario?: string
): Promise<ResolucaoRow> {
  const { error } = await supabase
    .from("nc_resolucoes")
    .update({
      status,
      analisado_por: analisadoPor,
      data_analise: new Date().toISOString(),
      comentario_analise: comentario ?? null,
    })
    .eq("id", id);
  if (error) throw error;

  // Busca separada para evitar "Cannot coerce" quando RLS limita o SELECT pós-UPDATE
  const { data, error: selErr } = await supabase
    .from("nc_resolucoes")
    .select(RESOLUCAO_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw selErr;
  return (data ?? { id, status, analisado_por: analisadoPor, comentario_analise: comentario ?? null }) as ResolucaoRow;
}

/**
 * Reabre uma resolução reprovada: atualiza o registro existente com nova foto/observação
 * e volta status para "pendente" para que o admin possa analisar novamente.
 */
export async function reabrirResolucao(
  id: string,
  resolvidoPor: string,
  fotoR2Key: string,
  observacao?: string
): Promise<ResolucaoRow> {
  const { error } = await supabase
    .from("nc_resolucoes")
    .update({
      status: "pendente",
      analisado_por: null,
      comentario_analise: null,
      data_analise: null,
      resolvido_por: resolvidoPor,
      foto_r2_key: fotoR2Key,
      observacao: observacao ?? null,
      data_resolucao: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  const { data, error: selErr } = await supabase
    .from("nc_resolucoes")
    .select(RESOLUCAO_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw selErr;
  return (data ?? { id, status: "pendente" as AnaliseStatus, resolvido_por: resolvidoPor, foto_r2_key: fotoR2Key }) as ResolucaoRow;
}

export async function editarAnalise(
  id: string,
  updates: { resolvido_por?: string; comentario_analise?: string }
): Promise<ResolucaoRow> {
  const { error } = await supabase
    .from("nc_resolucoes")
    .update(updates)
    .eq("id", id);
  if (error) throw error;

  const { data, error: selErr } = await supabase
    .from("nc_resolucoes")
    .select(RESOLUCAO_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw selErr;
  return (data ?? { id, ...updates }) as ResolucaoRow;
}

export async function deletarResolucao(id: string): Promise<void> {
  const { error } = await supabase.from("nc_resolucoes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Validação de checklists enviados ────────────────────────────────────────

export interface ChecklistParaAnalise extends SubmissionRow {
  client_id: string | null;
  status: AnaliseStatus;
  analisado_por?: string | null;
  data_analise?: string | null;
  comentario_analise?: string | null;
}

const CHECKLIST_ANALISE_FIELDS =
  "id,client_id,matricula,observador,auditagem,data,base,equipe,membros,resumo,status,analisado_por,data_analise,comentario_analise";

/** Todos os checklists enviados (qualquer status), para a aba de validação. */
export async function fetchChecklistsParaAnalise(): Promise<ChecklistParaAnalise[]> {
  const { data, error } = await supabase
    .from("checklist_submissions")
    .select(CHECKLIST_ANALISE_FIELDS)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChecklistParaAnalise[];
}

/**
 * Aprova/reprova um checklist enviado. Propaga o status para user_observations
 * (mesmo id = client_id) para refletir no PWA do colaborador.
 */
export async function atualizarStatusChecklist(
  id: string,
  status: AnaliseStatus,
  analisadoPor: string,
  comentario?: string
): Promise<ChecklistParaAnalise> {
  const { data, error } = await supabase
    .from("checklist_submissions")
    .update({
      status,
      analisado_por: analisadoPor,
      data_analise: new Date().toISOString(),
      comentario_analise: comentario ?? null,
    })
    .eq("id", id)
    .select(CHECKLIST_ANALISE_FIELDS)
    .single();
  if (error) throw error;

  const row = data as ChecklistParaAnalise;
  if (row.client_id) {
    await supabase.from("user_observations").update({
      status,
      analisado_por: analisadoPor,
      comentario_analise: comentario ?? null,
    }).eq("id", row.client_id);
  }
  return row;
}

/**
 * Apaga um checklist enviado (e em cascata suas respostas/fotos via FK).
 * Remove também o registro espelho em user_observations (usado no PWA), que
 * não é apagado em cascata pois não tem FK para checklist_submissions.
 */
export async function deletarChecklist(id: string, clientId: string | null): Promise<void> {
  const { error } = await supabase.from("checklist_submissions").delete().eq("id", id);
  if (error) throw error;
  if (clientId) {
    await supabase.from("user_observations").delete().eq("id", clientId);
  }
}

// ─── Fotos obrigatórias do checklist ─────────────────────────────────────────

export interface FotoChecklistRow {
  id: string;
  submission_id: string;
  tipo: string;
  pergunta_id: string | null;
  r2_key: string;
  sort_order: number;
}

export async function fetchFotosChecklist(submissionId: string): Promise<FotoChecklistRow[]> {
  const { data, error } = await supabase
    .from("checklist_photos")
    .select("id,submission_id,tipo,pergunta_id,r2_key,sort_order")
    .eq("submission_id", submissionId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as FotoChecklistRow[];
}

/** Filtra gerência de employee lookup. */
export function filterByGerencia(
  subs: SubmissionRow[],
  employees: EmployeeRow[],
  gerencia: string
): SubmissionRow[] {
  if (!gerencia || gerencia === "Todos") return subs;
  const idx = indexEmployees(employees);
  const mats = new Set(
    employees.filter((e) => e.gerencia === gerencia).map((e) => normMatricula(e.matricula)),
  );
  return subs.filter((s) => {
    if (mats.has(normMatricula(s.matricula))) return true;
    const emp = matchSubmissionToEmployee(s, idx);
    return emp?.gerencia === gerencia;
  });
}

export function filterByGerente(
  subs: SubmissionRow[],
  employees: EmployeeRow[],
  gerente: string,
): SubmissionRow[] {
  if (!gerente || gerente === "Todos") return subs;
  const allowed = new Set(
    filterObserverRoster(employees, { gerente }).map((e) => normMatricula(e.matricula)),
  );
  const idx = indexEmployees(employees);
  const g = foldName(gerente);
  return subs.filter((s) => {
    const emp = matchSubmissionToEmployee(s, idx);
    if (emp) return allowed.has(normMatricula(emp.matricula));
    const obs = foldName(s.observador);
    return obs === g || obs.startsWith(`${g} `);
  });
}
