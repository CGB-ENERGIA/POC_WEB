import { supabase } from "@/lib/supabase";
import { allPages, type ChecklistParaAnalise } from "@/lib/dashboard";

/**
 * Aviso ao coordenador quando um checklist é reprovado.
 * O coordenador responsável é sempre o do observador que enviou o checklist (employees.coordenador pela matrícula),
 * nunca o da equipe inspecionada. Sem coordenador cadastrado no observador, quem valida escolhe quem avisar.
 * O envio é pelo WhatsApp do analista (link wa.me com a mensagem pronta) e cada aviso fica registrado em avisos_reprovacao.
 */

export interface ContatoCoord {
  nome: string;
  telefone: string;
}

export interface AvisoCtx {
  contatos: ContatoCoord[];
  porMatricula: Map<string, string>;
}

export interface AvisoRow {
  submission_id: string;
  coordenador: string;
  enviado_por: string | null;
  created_at: string;
}

export interface ItemAviso {
  item: ChecklistParaAnalise;
  motivo: string;
}

/** Chave de comparação de nomes: sem acento, minúsculas e espaços únicos ("AFONSO" e "Afonso" são o mesmo coordenador). */
export function chaveNome(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Só dígitos com DDI: aceita DDD + número (10 ou 11 dígitos) ou já com 55. Devolve "" se não parecer um celular/fixo do Brasil. */
export function normalizarTelefone(txt: string): string {
  const d = txt.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if (d.length === 12 || d.length === 13) return d.startsWith("55") ? d : "";
  return "";
}

/** 5599984698713 -> +55 (99) 98469-8713 */
export function formatarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "");
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(d);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : tel;
}

export function iniciais(nome: string): string {
  const p = nome.replace(/[.]/g, "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0]!.slice(0, 2) : p[0]![0]! + p[1]![0]!).toUpperCase();
}

export function linkWhatsapp(tel: string, mensagem: string): string {
  return `https://wa.me/${tel.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
}

// ─── Carga ────────────────────────────────────────────────────────────────────

export async function carregarContatos(): Promise<ContatoCoord[]> {
  const { data, error } = await supabase.from("coordenadores_contato").select("nome,telefone").eq("ativo", true).order("nome");
  if (error) throw error;
  return (data ?? []) as ContatoCoord[];
}

export async function carregarAvisoCtx(): Promise<AvisoCtx> {
  const [contatos, emps] = await Promise.all([
    carregarContatos().catch(() => [] as ContatoCoord[]),
    allPages<{ matricula: string; coordenador: string | null }>(
      () => supabase.from("employees").select("matricula,coordenador").not("coordenador", "is", null).order("matricula"),
      "matricula",
    ).catch(() => []),
  ]);
  const porMatricula = new Map<string, string>();
  for (const e of emps) if (e.coordenador?.trim()) porMatricula.set(String(e.matricula).trim(), e.coordenador.trim());
  return { contatos, porMatricula };
}

/** Nome do coordenador como está nos contatos (ou o texto original, se ele ainda não tem contato). */
export function nomeCanonico(nome: string, ctx: AvisoCtx): string {
  const k = chaveNome(nome);
  return ctx.contatos.find((c) => chaveNome(c.nome) === k)?.nome ?? nome.trim();
}

export function contatoDe(nome: string | null, ctx: AvisoCtx): ContatoCoord | null {
  if (!nome) return null;
  const k = chaveNome(nome);
  return ctx.contatos.find((c) => chaveNome(c.nome) === k) ?? null;
}

/** Coordenador do observador que enviou o checklist (null quando o observador não tem coordenador cadastrado). */
export function coordenadorDoItem(item: ChecklistParaAnalise, ctx: AvisoCtx): string | null {
  const nome = ctx.porMatricula.get(String(item.matricula ?? "").trim());
  return nome ? nomeCanonico(nome, ctx) : null;
}

export async function salvarTelefone(nome: string, telefone: string): Promise<void> {
  const { error } = await supabase.from("coordenadores_contato").upsert({ nome, telefone, ativo: true, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ─── Registro dos avisos ──────────────────────────────────────────────────────

/** Último aviso de cada checklist (mais recente primeiro vence). */
export async function buscarAvisos(ids: string[]): Promise<Record<string, AvisoRow>> {
  const out: Record<string, AvisoRow> = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabase
      .from("avisos_reprovacao")
      .select("submission_id,coordenador,enviado_por,created_at")
      .in("submission_id", ids.slice(i, i + 200))
      .order("created_at", { ascending: true });
    if (error) throw error;
    for (const r of (data ?? []) as AvisoRow[]) out[r.submission_id] = r;
  }
  return out;
}

export async function registrarAvisos(ids: string[], coordenador: string, enviadoPor: string): Promise<AvisoRow[]> {
  const rows = ids.map((submission_id) => ({ submission_id, coordenador, canal: "whatsapp", enviado_por: enviadoPor }));
  const { data, error } = await supabase.from("avisos_reprovacao").insert(rows).select("submission_id,coordenador,enviado_por,created_at");
  if (error) throw error;
  return (data ?? []) as AvisoRow[];
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

const RODAPE = "_Validação POC · CGB_";

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(",", "");
}

function primeiroNome(nome: string | null): string {
  return nome ? nome.trim() : "coordenação";
}

export function montarMensagem(coordenador: string | null, { item, motivo }: ItemAviso): string {
  return [
    "⚠️ *POC reprovado na validação*",
    "",
    `Olá, ${primeiroNome(coordenador)}! Um checklist de observação da sua equipe não foi aprovado.`,
    "",
    `*Observador:* ${item.observador}`,
    `*Equipe:* ${item.equipe}${item.base ? ` (${item.base})` : ""}`,
    `*Checklist:* ${item.auditagem} · enviado em ${dataHora(item.data)}`,
    `*Motivo:* ${motivo.trim() || "não informado"}`,
    "",
    "Por favor, oriente o observador a refazer o envio com a correção. Ele também vê o motivo no PWA.",
    "",
    RODAPE,
  ].join("\n");
}

/** O link do WhatsApp aceita ~2.000 caracteres já codificados (acento, quebra de linha e emoji incham): o que não couber fica de fora e segue como "não avisado" para o próximo envio. */
const LIMITE_RESUMO = 1800;
const tamanhoNoLink = (t: string) => encodeURIComponent(t).length;

export function montarResumo(coordenador: string | null, lista: ItemAviso[]): { texto: string; incluidos: string[] } {
  const cab = [
    "⚠️ *POC · reprovações para acompanhar*",
    "",
    `Olá, ${primeiroNome(coordenador)}! Estes checklists da sua equipe foram reprovados na validação:`,
    "",
  ];
  const fim = ["", "Por favor, oriente os observadores a refazer os envios com as correções.", "", RODAPE];
  const incluidos: string[] = [];
  const blocos: string[] = [];
  let tamanho = tamanhoNoLink([...cab, ...fim].join("\n")) + 90; // 90 = folga para a linha "+N em um próximo aviso"
  for (const { item, motivo } of lista) {
    const bloco = `${blocos.length + 1}. *${item.observador}* · ${item.equipe} · ${item.auditagem} · ${dataHora(item.data)}\n    Motivo: ${motivo.trim() || "não informado"}`;
    const custo = tamanhoNoLink(bloco + "\n");
    if (blocos.length && tamanho + custo > LIMITE_RESUMO) break;
    blocos.push(bloco);
    incluidos.push(item.id);
    tamanho += custo;
  }
  const faltam = lista.length - blocos.length;
  if (faltam > 0) blocos.push(`_(+ ${faltam} em um próximo aviso)_`);
  return { texto: [...cab, ...blocos, ...fim].join("\n"), incluidos };
}

/** Agrupa por coordenador; checklists sem coordenador identificado ficam na chave "". */
export function agruparPorCoordenador(lista: ItemAviso[], ctx: AvisoCtx): Map<string, ItemAviso[]> {
  const grupos = new Map<string, ItemAviso[]>();
  for (const it of lista) {
    const k = coordenadorDoItem(it.item, ctx) ?? "";
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(it);
  }
  return grupos;
}
