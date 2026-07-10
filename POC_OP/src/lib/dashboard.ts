import { supabase } from "./supabase";

export interface Filters {
  ano: number;
  mes?: number;
  semana?: number;
  base?: string;
  gerencia?: string;
  gerente?: string;
}

/** Intervalo ISO para um mês (início inclusive, fim exclusive). */
function mesRange(ano: number, mes: number) {
  const start = new Date(ano, mes - 1, 1).toISOString();
  const end   = new Date(ano, mes, 1).toISOString();
  return { start, end };
}

/** Semana do mês 1-4+ (semana 1 = dias 1-7, etc.). */
function semanaRange(ano: number, mes: number, semana: number) {
  const dia = (semana - 1) * 7 + 1;
  const start = new Date(ano, mes - 1, dia).toISOString();
  const end   = new Date(ano, mes - 1, dia + 7).toISOString();
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

/** Todas as submissions no período com filtros. */
export async function fetchSubmissions(f: Filters, usarSemana = false): Promise<SubmissionRow[]> {
  let q = supabase
    .from("checklist_submissions")
    .select("id,matricula,observador,auditagem,data,base,equipe,membros,resumo")
    .order("data", { ascending: true });

  q = applySubmissionFilters(q, f, usarSemana);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SubmissionRow[];
}

/** Respostas ligadas a um conjunto de submissions. */
export async function fetchResponses(submissionIds: string[]): Promise<ResponseRow[]> {
  if (!submissionIds.length) return [];
  const { data, error } = await supabase
    .from("checklist_responses")
    .select("submission_id,pergunta_id,categoria,pergunta,gravidade,peso,resposta,observacao,foto_r2_key")
    .in("submission_id", submissionIds);
  if (error) throw error;
  return (data ?? []) as ResponseRow[];
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
  const { data, error } = await supabase
    .from("nc_resolucoes")
    .update({
      status,
      analisado_por: analisadoPor,
      data_analise: new Date().toISOString(),
      comentario_analise: comentario ?? null,
    })
    .eq("id", id)
    .select(RESOLUCAO_FIELDS)
    .single();
  if (error) throw error;
  return data as ResolucaoRow;
}

export async function editarAnalise(
  id: string,
  updates: { resolvido_por?: string; comentario_analise?: string }
): Promise<ResolucaoRow> {
  const { data, error } = await supabase
    .from("nc_resolucoes")
    .update(updates)
    .eq("id", id)
    .select(RESOLUCAO_FIELDS)
    .single();
  if (error) throw error;
  return data as ResolucaoRow;
}

/** Filtra gerência de employee lookup. */
export function filterByGerencia(
  subs: SubmissionRow[],
  employees: EmployeeRow[],
  gerencia: string
): SubmissionRow[] {
  if (!gerencia || gerencia === "Todos") return subs;
  const byMatricula = new Set(
    employees.filter((e) => e.gerencia === gerencia).map((e) => e.matricula)
  );
  return subs.filter((s) => byMatricula.has(s.matricula));
}
