/**
 * Foto repetida: a mesma imagem usada como evidência em mais de um checklist.
 * Consultas ao banco (funções fotos_repetidas / submissions_com_foto_repetida), auditoria por período e
 * cálculo das fotos antigas. Se o banco ainda não tem as colunas/funções, tudo devolve "sem repetições".
 */
import { supabase } from "./supabase";
import { fetchAllByIds, type FotoChecklistRow } from "./dashboard";
import { compararMarcadores, calcularMarcador, lerMarcadorDeBlob, dhashInformativo, type TipoRepeticao } from "./foto-marcador";
import { diaLocalISO } from "./semanas";

export interface FotoRepetida {
  photoId: string;
  submissionId: string;
  tipo: TipoRepeticao;
  sha256: string | null;
  dhash: string | null;
  r2Key: string;
  sortOrder: number;
  data: string;
  equipe: string;
  observador: string;
  base: string;
  distancia: number;
  /** Quando o checklist foi realmente enviado (a data do checklist segue a data da foto). */
  enviadoEm?: string | undefined;
}

/** Código curto da foto (6 primeiros caracteres do SHA), o mesmo que o app mostra ao observador. */
export function codigoDaFoto(f: { sha256?: string | null }): string | null {
  return f.sha256 ? f.sha256.slice(0, 6).toUpperCase() : null;
}

/** Mesma equipe no mesmo dia: quase sempre é o mesmo checklist reenviado, não reaproveitamento de foto. */
export function provavelReenvio(
  a: { equipe: string; data: string },
  b: { equipe: string; data: string },
): boolean {
  return a.equipe === b.equipe && diaLocalISO(a.data) === diaLocalISO(b.data);
}

interface LinhaRpc {
  photo_id: string; submission_id: string; tipo: string; sha256: string | null; dhash: string | null;
  r2_key: string; sort_order: number; data: string; equipe: string; observador: string; base: string; distancia: number;
}

function daLinha(l: LinhaRpc): FotoRepetida {
  return {
    photoId: l.photo_id, submissionId: l.submission_id, tipo: l.tipo === "identica" ? "identica" : "parecida",
    sha256: l.sha256, dhash: l.dhash, r2Key: l.r2_key, sortOrder: l.sort_order, data: l.data,
    equipe: l.equipe, observador: l.observador, base: l.base, distancia: l.distancia,
  };
}

/**
 * Repetições de cada foto de um checklist (id da foto → fotos iguais/parecidas em outros checklists, da mais nova
 * para a mais antiga). Foto sem marcador (antiga) não entra.
 */
export async function fetchRepeticoesDoChecklist(
  submissionId: string,
  fotos: FotoChecklistRow[],
): Promise<Map<string, FotoRepetida[]>> {
  const out = new Map<string, FotoRepetida[]>();
  const comMarcador = fotos.filter((f) => f.tipo === "local" && f.sha256);
  if (!comMarcador.length) return out;
  try {
    const { data, error } = await supabase.rpc("fotos_repetidas" as never, {
      p_sha: comMarcador.map((f) => f.sha256),
      p_dhash: comMarcador.map((f) => f.dhash).filter((d): d is string => !!d),
      p_excluir: submissionId,
    } as never);
    if (error) throw error;
    const achadas = ((data ?? []) as LinhaRpc[]).map(daLinha);
    await preencherEnvio(achadas);
    for (const foto of comMarcador) {
      const m = { s: foto.sha256 as string, d: foto.dhash ?? null };
      const lista: FotoRepetida[] = [];
      for (const a of achadas) {
        const tipo = compararMarcadores(m, { s: a.sha256 ?? "", d: a.dhash });
        if (tipo) lista.push({ ...a, tipo });
      }
      if (lista.length) out.set(foto.id, lista);
    }
  } catch (e) {
    console.warn("[foto-repetida] consulta indisponível:", (e as Error).message);
  }
  return out;
}

/** Acrescenta o horário real de envio (a data do checklist pode ser a da foto, dias antes). */
async function preencherEnvio(fotos: FotoRepetida[]): Promise<void> {
  const ids = [...new Set(fotos.map((f) => f.submissionId))];
  if (!ids.length) return;
  try {
    const linhas = await fetchAllByIds<{ id: string; created_at: string }>("checklist_submissions", "id,created_at", "id", ids);
    const envio = new Map(linhas.map((l) => [l.id, l.created_at]));
    for (const f of fotos) f.enviadoEm = envio.get(f.submissionId);
  } catch { /* sem o horário de envio a tela mostra só a data do checklist */ }
}

/** Horário real de envio de um checklist (created_at), ou null se não der para ler. */
export async function fetchEnvioDoChecklist(id: string): Promise<string | null> {
  const { data } = await supabase.from("checklist_submissions").select("created_at").eq("id", id).maybeSingle();
  return (data as { created_at?: string } | null)?.created_at ?? null;
}

/** Checklists (da lista) que têm foto repetida em outro checklist. soReenvio: só repete com a mesma equipe no mesmo dia. */
export async function fetchSubmissionsComFotoRepetida(ids: string[]): Promise<Map<string, { soReenvio: boolean }>> {
  const out = new Map<string, { soReenvio: boolean }>();
  for (let i = 0; i < ids.length; i += 150) {
    try {
      const { data, error } = await supabase.rpc("submissions_com_foto_repetida" as never, { p_ids: ids.slice(i, i + 150) } as never);
      if (error) throw error;
      for (const r of (data ?? []) as { submission_id: string; so_reenvio: boolean }[]) {
        out.set(r.submission_id, { soReenvio: !!r.so_reenvio });
      }
    } catch (e) {
      console.warn("[foto-repetida] selo indisponível:", (e as Error).message);
      return out;
    }
  }
  return out;
}

// ── Auditoria por período ───────────────────────────────────────────────────────

export interface FotoAuditoria {
  enviadoEm?: string | undefined;
  id: string;
  submissionId: string;
  sortOrder: number;
  r2Key: string;
  sha256: string | null;
  dhash: string | null;
  data: string;
  equipe: string;
  observador: string;
  base: string;
}

export interface GrupoRepetido {
  fotos: FotoAuditoria[];
  /** Quantos checklists diferentes usam a imagem. */
  checklists: number;
  /** Todos os checklists são da mesma equipe no mesmo dia (provável reenvio). */
  reenvio: boolean;
  /** Há foto só parecida (não é o mesmo arquivo). */
  temParecida: boolean;
}

/** Fotos de evidência dos checklists enviados desde `desdeISO` (AAAA-MM-DD), com data/equipe/observador. */
export async function fetchFotosParaAuditoria(desdeISO: string): Promise<{ fotos: FotoAuditoria[]; semMarcador: number }> {
  const subs: { id: string; data: string; created_at: string; equipe: string; observador: string; base: string }[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("checklist_submissions")
      .select("id,data,created_at,equipe,observador,base")
      .gte("data", `${desdeISO}T00:00:00-03:00`)
      .order("data", { ascending: false })
      .range(de, de + 999);
    if (error) throw error;
    subs.push(...((data ?? []) as typeof subs));
    if ((data ?? []).length < 1000) break;
  }
  const porId = new Map(subs.map((s) => [s.id, s]));
  type Linha = { id: string; submission_id: string; tipo: string; sort_order: number; r2_key: string; sha256: string | null; dhash: string | null };
  const linhas = await fetchAllByIds<Linha>("checklist_photos", "id,submission_id,tipo,sort_order,r2_key,sha256,dhash", "submission_id", [...porId.keys()]);
  const fotos: FotoAuditoria[] = [];
  let semMarcador = 0;
  for (const l of linhas) {
    if (l.tipo !== "local") continue;
    const s = porId.get(l.submission_id);
    if (!s) continue;
    if (!l.sha256) semMarcador++;
    fotos.push({
      id: l.id, submissionId: l.submission_id, sortOrder: l.sort_order, r2Key: l.r2_key, sha256: l.sha256, dhash: l.dhash,
      data: s.data, enviadoEm: s.created_at, equipe: s.equipe, observador: s.observador, base: s.base,
    });
  }
  return { fotos, semMarcador };
}

function partes(dhash: string): number[] {
  // 5 pedaços de 12-13 bits: dois hashes a até 4 bits de distância sempre repetem ao menos um pedaço inteiro
  const bits = BigInt(`0x${dhash}`);
  const cortes = [0, 13, 26, 39, 52, 64];
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    const largura = BigInt(cortes[i + 1]! - cortes[i]!);
    out.push(Number((bits >> BigInt(cortes[i]!)) & ((1n << largura) - 1n)));
  }
  return out;
}

/** Agrupa fotos que são a mesma imagem (mesmo SHA ou dHash muito próximo) usando união de conjuntos. */
export function agruparRepeticoes(fotos: FotoAuditoria[]): GrupoRepetido[] {
  const pai = fotos.map((_, i) => i);
  const raiz = (i: number): number => { while (pai[i] !== i) { pai[i] = pai[pai[i]!]!; i = pai[i]!; } return i; };
  const unir = (a: number, b: number) => { const ra = raiz(a), rb = raiz(b); if (ra !== rb) pai[ra] = rb; };
  const parecida = new Set<number>();

  const porSha = new Map<string, number>();
  const baldes = new Map<string, number[]>();
  fotos.forEach((f, i) => {
    if (f.sha256) {
      const antes = porSha.get(f.sha256);
      if (antes === undefined) porSha.set(f.sha256, i); else unir(antes, i);
    }
    if (f.dhash && dhashInformativo(f.dhash)) {
      partes(f.dhash).forEach((p, k) => {
        const chave = `${k}:${p}`;
        const lista = baldes.get(chave);
        if (lista) lista.push(i); else baldes.set(chave, [i]);
      });
    }
  });
  for (const lista of baldes.values()) {
    if (lista.length < 2 || lista.length > 400) continue; // balde enorme = imagem lisa: não serve de prova
    for (let x = 0; x < lista.length; x++) {
      for (let y = x + 1; y < lista.length; y++) {
        const a = fotos[lista[x]!]!, b = fotos[lista[y]!]!;
        if (raiz(lista[x]!) === raiz(lista[y]!)) continue;
        if (compararMarcadores({ s: a.sha256 ?? "", d: a.dhash }, { s: b.sha256 ?? "", d: b.dhash })) {
          unir(lista[x]!, lista[y]!);
          if (a.sha256 !== b.sha256) { parecida.add(lista[x]!); parecida.add(lista[y]!); }
        }
      }
    }
  }

  const grupos = new Map<number, number[]>();
  fotos.forEach((_, i) => { const r = raiz(i); const l = grupos.get(r); if (l) l.push(i); else grupos.set(r, [i]); });
  const out: GrupoRepetido[] = [];
  for (const indices of grupos.values()) {
    const membros = indices.map((i) => fotos[i]!);
    const subs = new Set(membros.map((m) => m.submissionId));
    if (subs.size < 2) continue; // repetição dentro do mesmo checklist não é o caso aqui
    const base = membros[0]!;
    out.push({
      fotos: membros.sort((p, q) => q.data.localeCompare(p.data)),
      checklists: subs.size,
      reenvio: membros.every((m) => provavelReenvio(m, base)),
      temParecida: indices.some((i) => parecida.has(i)),
    });
  }
  return out.sort((a, b) => b.checklists - a.checklists || b.fotos[0]!.data.localeCompare(a.fotos[0]!.data));
}

// ── Cálculo das fotos antigas ──────────────────────────────────────────────────

/** Calcula (no navegador) o marcador de uma foto já enviada e grava na linha dela. Devolve false se não deu. */
export async function calcularEGravarMarcador(foto: { id: string; url: string }): Promise<boolean> {
  const resp = await fetch(foto.url);
  if (!resp.ok) return false;
  const blob = await resp.blob();
  // foto enviada pelo app novo já carrega o marcador da imagem original embutido: ele vale mais que o da foto carimbada
  const embutido = await lerMarcadorDeBlob(blob);
  const m = embutido ?? await calcularMarcador(blob);
  if (!m.s) return false;
  const { error } = await supabase.from("checklist_photos").update({ sha256: m.s, dhash: m.d } as never).eq("id", foto.id);
  return !error;
}
