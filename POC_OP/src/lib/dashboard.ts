import { supabase } from "./supabase";
import { semanaDeIso, faixaDaSemana } from "./semanas";

export { semanaDeData, rotuloSemana } from "./semanas";

/**
 * Gerências válidas — exatamente como estão na tabela `employees`.
 * Usar sempre esta constante para evitar inconsistências entre páginas.
 */
export const GERENCIAS = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"] as const;
export type Gerencia = typeof GERENCIAS[number];

/**
 * Nomes únicos de gerente/coordenador a partir do banco (`employees` / equipes).
 * Os filtros das dashboards usam isto — não uma lista fixa — para acompanhar a planilha.
 */
export function uniqueHierarchyOpts(
  rows: Array<{ coordenador?: string | null; gerente?: string | null }>,
  field: "coordenador" | "gerente",
  includeTodos = true,
): string[] {
  const names = [
    ...new Set(
      rows
        .map((r) => (r[field] ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  return includeTodos ? ["Todos", ...names] : names;
}

export interface Filters {
  ano: number;
  mes?: number;
  /** Vários meses de uma vez (ex.: jan, fev e mar); vale no lugar de `mes`. */
  meses?: number[] | undefined;
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

/** Meses seguidos viram um só intervalo ISO (início inclusive, fim exclusive). */
function intervalosDeMeses(ano: number, meses: number[]): { start: string; end: string }[] {
  const ord = [...new Set(meses)].sort((a, b) => a - b);
  const out: { ini: number; fim: number }[] = [];
  for (const m of ord) {
    const ult = out[out.length - 1];
    if (ult && ult.fim === m - 1) ult.fim = m;
    else out.push({ ini: m, fim: m });
  }
  return out.map((r) => ({
    start: new Date(ano, r.ini - 1, 1).toISOString(),
    end: new Date(ano, r.fim, 1).toISOString(),
  }));
}

/** Dia do mês a partir do campo `data`, sem deslocar fuso. */
export function diaDoMes(data: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (m) return Number(m[3]);
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? 0 : d.getDate();
}

/** Semana (1–4) de uma data, conforme o cronograma do mês (configurável em Metas). */
export function semanaDaData(data: string): 1 | 2 | 3 | 4 {
  return semanaDeIso(data);
}

/**
 * Data de referência do checklist: quando a inspeção aconteceu (data da foto mais antiga, gravada no envio), desde que seja
 * do mesmo mês do envio e anterior a ele. Sem isso, a data do envio. É ela que define a semana nas páginas de acompanhamento.
 */
export function dataReferencia(sub: { data: string; resumo?: { dataFoto?: string } | null }): string {
  const f = sub.resumo?.dataFoto;
  if (f && f < sub.data && f.slice(0, 7) === sub.data.slice(0, 7)) return f;
  return sub.data;
}

/**
 * Semana (1–4) do checklist. Vale primeiro a semana que o analista direcionou ao validar (resumo.semanaManual);
 * sem ela, a da data de referência (a da foto, quando houver).
 */
export function semanaDaSub(sub: { data: string; resumo?: { dataFoto?: string; semanaManual?: number } | null }): 1 | 2 | 3 | 4 {
  const m = sub.resumo?.semanaManual;
  if (m === 1 || m === 2 || m === 3 || m === 4) return m;
  return semanaDaData(dataReferencia(sub));
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
    for (const alias of e.aliasMatriculas ?? []) {
      const am = normMatricula(alias);
      if (am && !byMat.has(am)) byMat.set(am, e);
    }
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

/** Intervalo ISO para a semana do mês, conforme o cronograma configurado. */
function semanaRange(ano: number, mes: number, semana: number) {
  const { ini, fim } = faixaDaSemana(ano, mes, semana);
  const start = new Date(ano, mes - 1, ini).toISOString();
  const end = new Date(ano, mes - 1, fim + 1).toISOString(); // dia 32 vira dia 1 do mês seguinte
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
  resumo: { total: number; conformes: number; naoConformes: number; dataFoto?: string; semanaManual?: number };
}

/** Perguntas com vários itens que o BI conta um a um (Regras de Ouro: 6 itens). */
const PERGUNTAS_COM_ITENS = new Set(["goman-012", "gstc-021"]);
const ITENS_REGRAS_DE_OURO = 6;

/**
 * Conformes e não conformes de uma resposta, contando item a item nas perguntas de vários itens (como o BI):
 * "Cumpriu todas as regras de ouro" vale 6 conformes quando conforme, e 5 conformes + 1 não conforme quando não conforme.
 */
export function contagemItens(r: { pergunta_id: string; resposta: string; itens?: { conforme: boolean }[] | null }): { conf: number; nc: number } {
  if (PERGUNTAS_COM_ITENS.has(r.pergunta_id)) {
    if (r.itens?.length) {
      const conf = r.itens.filter((i) => i.conforme).length;
      return { conf, nc: r.itens.length - conf };
    }
    return r.resposta === "conforme" ? { conf: ITENS_REGRAS_DE_OURO, nc: 0 } : { conf: ITENS_REGRAS_DE_OURO - 1, nc: 1 };
  }
  return r.resposta === "conforme" ? { conf: 1, nc: 0 } : { conf: 0, nc: 1 };
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
  coordenador?: string | null;
  gerente?: string | null;
  processo?: string | null;
  /** Data de desligamento (AAAA-MM-DD): a pessoa não entra em períodos que começam depois dela. */
  desligado_em?: string | null;
  /** Outras matrículas da mesma pessoa (cadastro duplicado unificado por dedupeEmployees). */
  aliasMatriculas?: string[];
}

/**
 * Junta cadastros duplicados da mesma pessoa em um só: mesma matrícula escrita com/sem zeros à esquerda
 * ("04745" e "4745") ou mesmo nome curto + gerência + base + função (ex.: matrícula antiga e nova).
 * Fica o cadastro com o nome mais completo; campos vazios são preenchidos pelos demais e as outras
 * matrículas viram `aliasMatriculas`, para os checklists delas continuarem sendo atribuídos à pessoa.
 */
export function dedupeEmployees(list: EmployeeRow[]): EmployeeRow[] {
  const grupos: EmployeeRow[][] = [];
  const porMat = new Map<string, number>();
  const porIdentidade = new Map<string, number>();
  const identidade = (e: EmployeeRow) => {
    const nome = foldName(e.nome);
    return nome ? `${nome}|${e.gerencia}|${e.base}|${foldName(e.funcao)}` : "";
  };
  for (const e of list) {
    const km = normMatricula(e.matricula);
    const ki = identidade(e);
    const g = (km ? porMat.get(km) : undefined) ?? (ki ? porIdentidade.get(ki) : undefined);
    if (g === undefined) {
      grupos.push([e]);
      if (km) porMat.set(km, grupos.length - 1);
      if (ki) porIdentidade.set(ki, grupos.length - 1);
    } else {
      grupos[g]!.push(e);
      if (km) porMat.set(km, g);
      if (ki) porIdentidade.set(ki, g);
    }
  }
  return grupos.map((g) => {
    if (g.length === 1) return g[0]!;
    const ordenado = [...g].sort(
      (a, b) =>
        (b.nome_completo?.length ?? 0) - (a.nome_completo?.length ?? 0) ||
        (a.matricula.startsWith("0") ? 1 : 0) - (b.matricula.startsWith("0") ? 1 : 0),
    );
    const principal = { ...ordenado[0]! };
    for (const outro of ordenado.slice(1)) {
      for (const campo of ["coordenador", "gerente", "processo", "gerencia", "base", "funcao", "desligado_em"] as const) {
        if (!principal[campo] && outro[campo]) principal[campo] = outro[campo] as never;
      }
    }
    const meu = normMatricula(principal.matricula);
    principal.aliasMatriculas = [...new Set(ordenado.slice(1).map((o) => o.matricula))].filter(
      (m) => normMatricula(m) !== meu || m !== principal.matricula,
    );
    return principal;
  });
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
  } else if (f.meses?.length) {
    const faixas = intervalosDeMeses(f.ano, f.meses);
    if (faixas.length === 1) q = q.gte("data", faixas[0]!.start).lt("data", faixas[0]!.end);
    else q = q.or(faixas.map((r) => `and(data.gte.${r.start},data.lt.${r.end})`).join(","));
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

// Supabase limita 1000 linhas por query; esta função pagina automaticamente.
// Em checklist_responses (>1 mi de linhas) ordene por submission_id,pergunta_id: order by id varre o índice
// inteiro e estoura o statement_timeout (erro 500).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function allPages<T>(buildQ: () => any, desempate: string | string[] = "id"): Promise<T[]> {
  const colunas = Array.isArray(desempate) ? desempate : [desempate];
  const PAGE = 1000;
  const WAVE = 4; // páginas baixadas ao mesmo tempo
  const all: T[] = [];
  for (let page = 0; ; page += WAVE) {
    // Desempate por coluna única é obrigatório: sem ordem determinística o Postgres pode repetir/pular linhas entre páginas
    const wave = await Promise.all(
      Array.from({ length: WAVE }, (_, i) =>
        colunas
          .reduce((q, col) => q.order(col, { ascending: true }), buildQ())
          .range((page + i) * PAGE, (page + i + 1) * PAGE - 1),
      ),
    );
    let fim = false;
    for (const { data, error } of wave) {
      if (error) throw error;
      const rows = (data ?? []) as T[];
      all.push(...rows);
      if (rows.length < PAGE) { fim = true; break; }
    }
    if (fim) return all;
  }
}

/** Executa fn para cada item com no máximo `limit` chamadas simultâneas, mantendo a ordem dos resultados. */
async function mapLimit<I, O>(items: I[], limit: number, fn: (item: I) => Promise<O>): Promise<O[]> {
  const out: O[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i] as I);
      }
    }),
  );
  return out;
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Todas as linhas de `table` cujo `coluna` está em `ids` (lotes de 300 para não estourar a URL + paginação sem limite de 1000). */
export async function fetchAllByIds<T>(table: string, select: string, coluna: string, ids: string[]): Promise<T[]> {
  if (!ids.length) return [];
  const lotes = await mapLimit(chunked(ids, 300), 3, (chunk) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPages<T>(
      () => (supabase.from(table) as any).select(select).in(coluna, chunk),
      table === "checklist_responses" ? ORD_RESP : coluna === "id" ? "id" : [coluna, "id"],
    ),
  );
  return lotes.flat();
}

/** Submissions do período. `contarMeta` inclui pendentes (já registrados no PWA). */
export async function fetchSubmissions(f: Filters, usarSemana = false): Promise<SubmissionRow[]> {
  return allPages<SubmissionRow>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from("checklist_submissions")
      .select("id,matricula,observador,auditagem,data,base,equipe,membros,resumo")
      .order("data", { ascending: true });
    q = f.contarMeta
      ? q.in("status", ["aprovado", "pendente"])
      : q.eq("status", "aprovado");
    return applySubmissionFilters(q, f, usarSemana);
  });
}

/** Respostas ligadas a um conjunto de submissions (chunked + paginado para datasets grandes). */
/** Ordenação que usa o índice único de checklist_responses (ver allPages). */
const ORD_RESP = ["submission_id", "pergunta_id"];

export async function fetchResponses(submissionIds: string[], opts: { soNc?: boolean } = {}): Promise<ResponseRow[]> {
  if (!submissionIds.length) return [];
  const lotes = await mapLimit(chunked(submissionIds, 300), 3, (chunk) =>
    allPages<ResponseRow>(() => {
      let q = supabase
        .from("checklist_responses")
        .select("submission_id,pergunta_id,categoria,pergunta,gravidade,peso,resposta,observacao,foto_r2_key,resolvido,itens,atribuido_tipo,atribuido_nome,atribuido_matricula")
        .in("submission_id", chunk);
      if (opts.soNc) q = q.eq("resposta", "nao_conforme");
      return q;
    }, ORD_RESP),
  );
  return lotes.flat();
}

/** Conformes/não conformes por categoria de cada checklist, calculado no banco: [conformes, não conformes]. */
export type CatAgg = Record<string, Record<string, [number, number]>>;

export async function fetchRespostasPorCategoria(submissionIds: string[]): Promise<CatAgg> {
  const out: CatAgg = {};
  if (!submissionIds.length) return out;
  const lotes = await mapLimit(chunked(submissionIds, 1000), 3, async (chunk) => {
    const { data, error } = await supabase.rpc("resp_cat_agg" as never, { p_ids: chunk } as never);
    if (error) throw error;
    return (data ?? []) as unknown as { submission_id: string; cats: Record<string, [number, number]> }[];
  });
  for (const row of lotes.flat()) out[row.submission_id] = row.cats;
  return out;
}

export interface NcPorMesOpts {
  contarMeta?: boolean;
  allowedAuditagens?: string[];
  employees?: EmployeeRow[];
  gerencia?: string;
  gerente?: string;
  coordenador?: string;
  /** Filtro extra sobre as submissions (ex.: hierarquia da equipe), aplicado depois dos demais. */
  filtro?: (s: { id: string; data: string; auditagem: string; equipe: string; base: string }) => boolean;
}

/** Contagem de não conformidades por mês, ao longo de um ano inteiro (para gráfico de tendência). */
export async function fetchNaoConformesPorMes(
  ano: number,
  base?: string,
  opts?: NcPorMesOpts,
): Promise<Record<number, number>> {
  const start = new Date(ano, 0, 1).toISOString();
  const end = new Date(ano + 1, 0, 1).toISOString();
  const { contarMeta, allowedAuditagens, employees = [], gerencia, gerente, coordenador, filtro } = opts ?? {};

  type SubLight = Pick<SubmissionRow, "id" | "data" | "auditagem" | "matricula" | "observador" | "equipe" | "base">;
  let subs = await allPages<SubLight>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("checklist_submissions")
      .select("id,data,auditagem,matricula,observador,equipe,base")
      .gte("data", start).lt("data", end);
    q = contarMeta ? q.in("status", ["aprovado", "pendente"]) : q.eq("status", "aprovado");
    if (base && base !== "Todos") q = q.eq("base", base);
    return q;
  });
  if (!subs.length) return {};

  if (allowedAuditagens?.length) {
    subs = subs.filter((s) => allowedAuditagens.includes((s.auditagem ?? "").toUpperCase()));
  }
  if (employees.length) {
    if (gerente && gerente !== "Todos") {
      subs = filterByGerente(subs as SubmissionRow[], employees, gerente) as SubLight[];
    }
    if (coordenador && coordenador !== "Todos") {
      subs = filterByCoordenador(subs as SubmissionRow[], employees, coordenador) as SubLight[];
    }
    if (gerencia && gerencia !== "Todos") {
      subs = filterByGerencia(subs as SubmissionRow[], employees, gerencia) as SubLight[];
    }
  }
  if (filtro) subs = subs.filter((s) => filtro(s as never));
  if (!subs.length) return {};

  const mesPorSubmissao = new Map<string, number>();
  for (const s of subs) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.data);
    mesPorSubmissao.set(s.id, m ? Number(m[2]) : new Date(s.data).getMonth() + 1);
  }

  const ids = subs.map((s) => s.id);
  const map: Record<number, number> = {};
  const lotes = await mapLimit(chunked(ids, 300), 3, (chunk) =>
    allPages<{ submission_id: string }>(
      () => supabase.from("checklist_responses").select("submission_id")
        .eq("resposta", "nao_conforme").in("submission_id", chunk),
      ORD_RESP,
    ),
  );
  for (const r of lotes.flat()) {
    const mes = mesPorSubmissao.get(r.submission_id);
    if (mes) map[mes] = (map[mes] ?? 0) + 1;
  }
  return map;
}

/**
 * Meta semanal de uma pessoa (tabela "Metas POC", a mesma que alimenta o BI): quem estava na lista de observadores
 * naquela semana, a meta, o realizado e o "real" (realizado limitado à meta).
 */
export interface MetaSemanalRow {
  aba: "Operacional" | "Administrativo";
  ano: number;
  mes: number;
  semana: number;
  matricula: string;
  nome: string;
  funcao: string | null;
  base: string | null;
  gerencia: string | null;
  gerente: string | null;
  processo: string | null;
  realizado: number;
  meta: number;
  real: number;
}

/** Linhas da tabela de metas semanais de um mês (vazio quando o mês ainda não foi carregado). */
export async function fetchMetasSemanais(ano: number, mes: number): Promise<MetaSemanalRow[]> {
  return allPages<MetaSemanalRow>(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("metas_semanais" as never) as any)
      .select("aba,ano,mes,semana,matricula,nome,funcao,base,gerencia,gerente,processo,realizado,meta,real")
      .eq("ano", ano).eq("mes", mes),
  );
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
  const subs = await allPages<{ id: string; equipe: string }>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("checklist_submissions").select("id,equipe").eq("status", "aprovado")
      .gte("data", startIso).lt("data", endIso);
    if (base && base !== "Todos") q = q.eq("base", base);
    return q;
  });

  const map = new Map<string, IcitPrefixo>();
  if (!subs.length) return map;

  const ids = subs.map((s) => s.id);
  const ncSubIds = new Set<string>();
  const lotes = await mapLimit(chunked(ids, 300), 3, (chunk) =>
    allPages<{ submission_id: string }>(
      () => supabase.from("checklist_responses").select("submission_id")
        .eq("resposta", "nao_conforme").in("submission_id", chunk),
      ORD_RESP,
    ),
  );
  for (const r of lotes.flat()) ncSubIds.add(r.submission_id);

  for (const s of subs) {
    if (!s.equipe) continue;
    if (!map.has(s.equipe)) map.set(s.equipe, { visitas: 0, semNc: 0 });
    const entry = map.get(s.equipe)!;
    entry.visitas++;
    if (!ncSubIds.has(s.id)) entry.semNc++;
  }
  return map;
}

export interface NcLightRow {
  submission_id: string;
  categoria: string;
}

/** Busca apenas NCs (submission_id + categoria) — versão leve para o mapa de calor. */
export async function fetchNcLight(submissionIds: string[]): Promise<NcLightRow[]> {
  if (!submissionIds.length) return [];
  const lotes = await mapLimit(chunked(submissionIds, 300), 3, (chunk) =>
    allPages<NcLightRow>(
      () => supabase
        .from("checklist_responses")
        .select("submission_id,categoria")
        .eq("resposta", "nao_conforme")
        .in("submission_id", chunk),
      ORD_RESP,
    ),
  );
  return lotes.flat();
}

/** Todos os funcionários ativos. */
export async function fetchEmployees(): Promise<EmployeeRow[]> {
  const lista = await allPages<EmployeeRow>(
    () => supabase
      .from("employees")
      .select("matricula,nome,nome_completo,gerencia,base,funcao,coordenador,gerente,processo,desligado_em")
      .eq("ativo", true)
      .order("nome_completo"),
    "matricula",
  );
  return dedupeEmployees(lista);
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
  opts: {
    gerencia?: string; gerente?: string; coordenador?: string; funcao?: string; base?: string;
    /** AAAA-MM-DD: primeiro dia do período; quem foi desligado antes dele não entra. */
    periodoInicio?: string;
  } = {},
): EmployeeRow[] {
  let list = employees;
  if (opts.periodoInicio) {
    const ini = opts.periodoInicio;
    list = list.filter((e) => !e.desligado_em || e.desligado_em >= ini);
  }
  if (opts.gerencia && opts.gerencia !== "Todos") {
    list = list.filter((e) => e.gerencia === opts.gerencia);
  }
  if (opts.funcao && opts.funcao !== "Todos") {
    list = list.filter((e) => e.funcao === opts.funcao);
  }
  if (opts.base && opts.base !== "Todos") {
    list = list.filter((e) => e.base === opts.base);
  }
  if (opts.coordenador && opts.coordenador !== "Todos") {
    const c = foldName(opts.coordenador);
    list = list.filter((e) => {
      if (foldName(e.coordenador) === c) return true;
      const nome = foldName(e.nome);
      const full = foldName(e.nome_completo);
      if (nome === c || full === c) return true; // o próprio coordenador
      // Pelo primeiro nome só quando a pessoa não tem coordenador cadastrado:
      // quem já tem outro coordenador (ex.: Paulo Cesar -> Luis C.) não vira do "Paulo"
      if (foldName(e.coordenador)) return false;
      return full.startsWith(`${c} `) || nome.startsWith(`${c} `);
    });
  }
  if (opts.gerente && opts.gerente !== "Todos") {
    const g = foldName(opts.gerente);
    list = list.filter((e) => {
      if (foldName(e.coordenador) === g || foldName(e.gerente) === g) return true;
      const nome = foldName(e.nome);
      const full = foldName(e.nome_completo);
      if (nome === g || full === g) return true; // o próprio gerente
      if (foldName(e.coordenador) || foldName(e.gerente)) return false;
      return full.startsWith(`${g} `) || nome.startsWith(`${g} `);
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
  return fetchAllByIds<ResolucaoRow>("nc_resolucoes", RESOLUCAO_FIELDS, "submission_id", submissionIds);
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
  return allPages<ResolucaoRow>(() =>
    supabase.from("nc_resolucoes").select(RESOLUCAO_FIELDS).order("data_resolucao", { ascending: false }),
  );
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

/** Checklists enviados (qualquer status), para a aba de validação. Sem `ano`, traz todos; sem `mes`, o ano inteiro. */
export async function fetchChecklistsParaAnalise(
  opts: { ano?: number | undefined; mes?: number | undefined } = {},
): Promise<ChecklistParaAnalise[]> {
  return allPages<ChecklistParaAnalise>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("checklist_submissions").select(CHECKLIST_ANALISE_FIELDS).order("data", { ascending: false });
    if (opts.ano) {
      const { start, end } = opts.mes
        ? mesRange(opts.ano, opts.mes)
        : { start: new Date(opts.ano, 0, 1).toISOString(), end: new Date(opts.ano + 1, 0, 1).toISOString() };
      q = q.gte("data", start).lt("data", end);
    }
    return q;
  });
}

/** Quantos checklists aguardam validação, em qualquer período. */
export async function fetchContagemPendentes(): Promise<number> {
  const { count, error } = await supabase
    .from("checklist_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  if (error) throw error;
  return count ?? 0;
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

/** Direciona o checklist para uma semana do mês (1–4) ou, com null, devolve ao cálculo automático pela data. */
export async function direcionarSemanaChecklist(
  id: string,
  resumoAtual: Record<string, unknown> | null | undefined,
  semana: 1 | 2 | 3 | 4 | null,
): Promise<ChecklistParaAnalise> {
  const resumo: Record<string, unknown> = { ...(resumoAtual ?? {}) };
  if (semana === null) delete resumo.semanaManual;
  else resumo.semanaManual = semana;
  const { data, error } = await supabase
    .from("checklist_submissions")
    .update({ resumo })
    .eq("id", id)
    .select(CHECKLIST_ANALISE_FIELDS)
    .single();
  if (error) throw error;
  return data as ChecklistParaAnalise;
}

export interface EdicaoChecklist {
  equipe: string;
  base: string;
  observador: string;
  membros: { nome: string; matricula: string }[];
  /** Somente respostas alteradas. */
  respostas: { pergunta_id: string; resposta: "conforme" | "nao_conforme"; observacao: string | null }[];
}

/**
 * Corrige um checklist já enviado (cabeçalho + respostas) e recalcula o resumo.
 * Reflete equipe/base/observador/contagens no espelho de user_observations (PWA).
 */
export async function editarChecklist(
  item: ChecklistParaAnalise,
  edit: EdicaoChecklist,
): Promise<ChecklistParaAnalise> {
  for (const r of edit.respostas) {
    // Ao marcar conforme, os sub-itens deixam de ficar como não conformes.
    const patch: Record<string, unknown> = { resposta: r.resposta, observacao: r.observacao };
    if (r.resposta === "conforme") {
      const { data: atual } = await supabase
        .from("checklist_responses")
        .select("itens")
        .eq("submission_id", item.id)
        .eq("pergunta_id", r.pergunta_id)
        .maybeSingle();
      const itens = (atual?.itens ?? null) as { nome: string; conforme: boolean }[] | null;
      if (itens?.length) patch.itens = itens.map((it) => ({ ...it, conforme: true }));
    }
    const { error } = await supabase
      .from("checklist_responses")
      .update(patch)
      .eq("submission_id", item.id)
      .eq("pergunta_id", r.pergunta_id);
    if (error) throw error;
  }

  const { data: respostas, error: respErr } = await supabase
    .from("checklist_responses")
    .select("resposta")
    .eq("submission_id", item.id);
  if (respErr) throw respErr;
  const total = respostas?.length ?? 0;
  const conformes = (respostas ?? []).filter((r) => r.resposta === "conforme").length;
  const resumo = {
    ...(item.resumo as unknown as Record<string, unknown>),
    total,
    conformes,
    naoConformes: total - conformes,
  };

  const cab = {
    equipe: edit.equipe.trim(),
    base: edit.base.trim(),
    observador: edit.observador.trim(),
    membros: edit.membros,
    resumo,
  };
  const { data, error } = await supabase
    .from("checklist_submissions")
    .update(cab)
    .eq("id", item.id)
    .select(CHECKLIST_ANALISE_FIELDS)
    .single();
  if (error) throw error;

  if (item.client_id) {
    const { data: espelho } = await supabase
      .from("user_observations")
      .select("resumo")
      .eq("id", item.client_id)
      .maybeSingle();
    await supabase
      .from("user_observations")
      .update({
        equipe: cab.equipe,
        base: cab.base,
        observador: cab.observador,
        resumo: { ...((espelho?.resumo ?? {}) as Record<string, unknown>), total, conformes, naoConformes: total - conformes },
      })
      .eq("id", item.client_id);
  }
  return data as ChecklistParaAnalise;
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

/** Quantas evidências obrigatórias o app exige: 2 em Administrativo/Alojamento/Logística/Oficina, 3 nos demais. */
export function evidenciasExigidas(auditagem: string | undefined): number {
  return ["ADMINISTRATIVO", "ALOJAMENTO", "LOGISTICA", "OFICINA"].includes((auditagem ?? "").toUpperCase()) ? 2 : 3;
}

/** Evidências obrigatórias já enviadas por checklist (id -> quantidade; ids sem foto entram com 0). */
export async function fetchContagemEvidencias(
  checklists: { id: string; auditagem: string }[],
): Promise<Record<string, number>> {
  const exigidas = new Map(checklists.map((c) => [c.id, evidenciasExigidas(c.auditagem)]));
  const fotos = await fetchAllByIds<{ submission_id: string; tipo: string; sort_order: number }>(
    "checklist_photos", "submission_id,tipo,sort_order", "submission_id", [...exigidas.keys()],
  );
  const out: Record<string, number> = {};
  for (const id of exigidas.keys()) out[id] = 0;
  for (const f of fotos) {
    if (f.tipo === "local" && f.sort_order < (exigidas.get(f.submission_id) ?? 3)) {
      out[f.submission_id] = (out[f.submission_id] ?? 0) + 1;
    }
  }
  return out;
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

/**
 * Coordenador de cada equipe (chave = prefixo em MAIÚSCULAS). O cadastro pwa_equipes tem prioridade;
 * equipes que não estão nele usam o coordenador registrado nas planilhas históricas.
 */
export async function fetchCoordenadorPorEquipe(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const [hist, cadastro] = await Promise.all([
    allPages<{ prefixo: string | null; coordenador: string | null }>(
      () => supabase.from("equipes_coordenacao_historico" as never).select("prefixo,coordenador"),
      "prefixo",
    ).catch(() => []),
    allPages<{ prefixo: string | null; coordenador: string | null }>(
      () => supabase.from("pwa_equipes").select("id,prefixo,coordenador"),
    ).catch(() => []),
  ]);
  for (const lista of [hist, cadastro]) {
    for (const r of lista) {
      const chave = (r.prefixo ?? "").trim().toUpperCase();
      const coord = (r.coordenador ?? "").trim();
      if (chave && coord) mapa.set(chave, coord);
    }
  }
  return mapa;
}

/** Coordenador da equipe pelo prefixo; aceita nomes com cidade ("ALOJ43 – MIRANDA"). Vazio se não houver. */
export function coordenadorDaEquipe(mapa: Map<string, string>, equipe: string | null | undefined): string {
  const chave = (equipe ?? "").trim().toUpperCase();
  if (!chave) return "";
  return mapa.get(chave) ?? mapa.get((chave.split(/\s+[–-]\s+/)[0] ?? "").trim()) ?? "";
}

export interface AcidenteRow {
  id: string;
  data: string; // AAAA-MM-DD
  prefixo: string;
  descricao: string;
  colaborador: string;
  caracteristica: string;
  gravidade: string;
  lesao: string;
  cidade: string;
}

/** Acidentes registrados no ano (tabela acidentes; só para usuários logados). */
export async function fetchAcidentes(ano: number): Promise<AcidenteRow[]> {
  return allPages<AcidenteRow>(
    () => supabase.from("acidentes" as never).select("id,data,prefixo,descricao,colaborador,caracteristica,gravidade,lesao,cidade")
      .gte("data", `${ano}-01-01`).lt("data", `${ano + 1}-01-01`),
    ["data", "id"],
  );
}

/** Hierarquia de uma equipe (prefixo): quem coordena, quem gerencia, a gerência e a base da equipe. */
export interface EquipeHier {
  coordenador: string;
  gerente: string;
  gerencia: string;
  base: string;
}

/**
 * Coordenador, gerente e gerência de cada equipe (chave = prefixo em MAIÚSCULAS). O cadastro pwa_equipes tem
 * prioridade campo a campo; o que faltar vem da tabela equipes_coordenacao_historico (planilhas históricas).
 */
export async function fetchHierarquiaEquipes(): Promise<Map<string, EquipeHier>> {
  type Linha = { prefixo: string | null; coordenador: string | null; gerente?: string | null; gerencia: string | null; base: string | null };
  const mapa = new Map<string, EquipeHier>();
  const [hist, cadastro] = await Promise.all([
    allPages<Linha>(
      () => supabase.from("equipes_coordenacao_historico" as never).select("prefixo,coordenador,gerencia,base"),
      "prefixo",
    ).catch(() => [] as Linha[]),
    allPages<Linha>(
      () => supabase.from("pwa_equipes").select("id,prefixo,coordenador,gerente,gerencia,base"),
    ).catch(() => [] as Linha[]),
  ]);
  for (const lista of [hist, cadastro]) {
    for (const r of lista) {
      const chave = (r.prefixo ?? "").trim().toUpperCase();
      if (!chave) continue;
      const atual = mapa.get(chave) ?? { coordenador: "", gerente: "", gerencia: "", base: "" };
      mapa.set(chave, {
        coordenador: (r.coordenador ?? "").trim() || atual.coordenador,
        gerente: (r.gerente ?? "").trim() || atual.gerente,
        gerencia: (r.gerencia ?? "").trim().toUpperCase() || atual.gerencia,
        base: (r.base ?? "").trim().toUpperCase() || atual.base,
      });
    }
  }
  return mapa;
}

/** Hierarquia da equipe pelo prefixo; aceita nomes com cidade ("ALOJ43 – MIRANDA"). */
export function hierarquiaDaEquipe(mapa: Map<string, EquipeHier>, equipe: string | null | undefined): EquipeHier | undefined {
  const chave = (equipe ?? "").trim().toUpperCase();
  if (!chave) return undefined;
  return mapa.get(chave) ?? mapa.get((chave.split(/\s+[–-]\s+/)[0] ?? "").trim());
}

export function filterByCoordenador(
  subs: SubmissionRow[],
  employees: EmployeeRow[],
  coordenador: string | null | undefined,
): SubmissionRow[] {
  if (!coordenador || coordenador === "Todos") return subs;
  const allowed = new Set(
    filterObserverRoster(employees, { coordenador }).map((e) => normMatricula(e.matricula)),
  );
  const idx = indexEmployees(employees);
  const c = foldName(coordenador);
  return subs.filter((s) => {
    const emp = matchSubmissionToEmployee(s, idx);
    if (emp) return allowed.has(normMatricula(emp.matricula));
    const obs = foldName(s.observador);
    return obs === c || obs.startsWith(`${c} `);
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
