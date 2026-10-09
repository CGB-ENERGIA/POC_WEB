import { ref } from "vue";
import { supabase } from "./supabase";

/**
 * Cronograma das semanas de observação, configurável por mês (painel > Metas).
 * Semana 1 = dia 1 até fim[0]; 2 = fim[0]+1 até fim[1]; 3 = fim[1]+1 até fim[2]; 4 = fim[2]+1 até o fim do mês.
 * Mês sem configuração usa o padrão antigo (8/15/22).
 */
export type FimsSemanas = [number, number, number];
export const FIMS_PADRAO: FimsSemanas = [8, 15, 22];

const config = new Map<string, FimsSemanas>();
/** Muda a cada recarga/gravação; ler dentro de um computed faz a tela recalcular. */
export const semanasVersao = ref(0);
let emAndamento: Promise<void> | null = null;
let ultimaCarga = 0;
/** Dentro desse prazo, chamadas repetidas reaproveitam o que já foi carregado. */
const VALIDADE_MS = 60_000;

const chave = (ano: number, mes: number) => `${ano}-${mes}`;

export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function fimsDoMes(ano: number, mes: number): FimsSemanas {
  void semanasVersao.value;
  return config.get(chave(ano, mes)) ?? FIMS_PADRAO;
}

export function temCronogramaPersonalizado(ano: number, mes: number): boolean {
  void semanasVersao.value;
  return config.has(chave(ano, mes));
}

export function semanaDoDia(ano: number, mes: number, dia: number): 1 | 2 | 3 | 4 {
  const [a, b, c] = fimsDoMes(ano, mes);
  if (dia <= a) return 1;
  if (dia <= b) return 2;
  if (dia <= c) return 3;
  return 4;
}

/** Semana de uma data ISO (usa o dia gravado, sem deslocar fuso, como o resto do painel). */
export function semanaDeIso(data: string): 1 | 2 | 3 | 4 {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (m) return semanaDoDia(Number(m[1]), Number(m[2]), Number(m[3]));
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? 1 : semanaDoDia(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Semana de um Date no horário local (ex.: "hoje"). */
export function semanaDeData(d: Date): 1 | 2 | 3 | 4 {
  return semanaDoDia(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Primeiro e último dia (do mês) de uma semana. */
export function faixaDaSemana(ano: number, mes: number, semana: number): { ini: number; fim: number } {
  const [a, b, c] = fimsDoMes(ano, mes);
  const ultimo = ultimoDiaDoMes(ano, mes);
  const limites = [0, a, b, c, ultimo];
  const s = Math.min(4, Math.max(1, semana));
  return { ini: limites[s - 1]! + 1, fim: limites[s]! };
}

const dd = (n: number) => String(n).padStart(2, "0");

/** Ex.: "1ª (01–11)". */
export function rotuloSemana(ano: number, mes: number, semana: number): string {
  const { ini, fim } = faixaDaSemana(ano, mes, semana);
  return `${semana}ª (${dd(ini)}–${dd(fim)})`;
}

/** Mensagem de erro se o cronograma não for válido para o mês; null se estiver ok. */
export function validarFims(ano: number, mes: number, fims: number[]): string | null {
  const [a, b, c] = fims;
  const ultimo = ultimoDiaDoMes(ano, mes);
  if (![a, b, c].every((n) => Number.isInteger(n))) return "Informe o dia em que cada semana termina.";
  if (a! < 1) return "A 1ª semana precisa terminar a partir do dia 1.";
  if (!(a! < b! && b! < c!)) return "Cada semana precisa terminar depois da anterior.";
  if (c! >= ultimo) return `A 3ª semana precisa terminar antes do fim do mês (dia ${ultimo}) para sobrar dias na 4ª.`;
  return null;
}

/**
 * Carrega o cronograma do banco. Reaproveita a última carga por 1 minuto (force ignora o prazo), então
 * mudanças feitas em Metas chegam a quem está com o painel aberto assim que ele muda de tela/filtro.
 * Sem rede, mantém o que já tinha.
 */
export function carregarSemanas(force = false): Promise<void> {
  if (emAndamento) return emAndamento;
  if (!force && ultimaCarga && Date.now() - ultimaCarga < VALIDADE_MS) return Promise.resolve();
  emAndamento = (async () => {
    try {
      const { data, error } = await supabase.from("semanas_config" as never).select("ano,mes,fim_s1,fim_s2,fim_s3");
      if (error) throw error;
      config.clear();
      for (const r of (data ?? []) as { ano: number; mes: number; fim_s1: number; fim_s2: number; fim_s3: number }[]) {
        config.set(chave(r.ano, r.mes), [r.fim_s1, r.fim_s2, r.fim_s3]);
      }
      ultimaCarga = Date.now();
      semanasVersao.value++;
    } catch {
      /* mantém o que já tinha; tenta de novo na próxima chamada */
    } finally {
      emAndamento = null;
    }
  })();
  return emAndamento;
}

export async function salvarSemanas(ano: number, mes: number, fims: FimsSemanas): Promise<void> {
  const erro = validarFims(ano, mes, fims);
  if (erro) throw new Error(erro);
  const { error } = await supabase.from("semanas_config" as never).upsert(
    { ano, mes, fim_s1: fims[0], fim_s2: fims[1], fim_s3: fims[2], updated_at: new Date().toISOString() } as never,
    { onConflict: "ano,mes" },
  );
  if (error) throw new Error(error.message);
  config.set(chave(ano, mes), [...fims] as FimsSemanas);
  semanasVersao.value++;
}

export async function restaurarSemanas(ano: number, mes: number): Promise<void> {
  const { error } = await supabase.from("semanas_config" as never).delete().eq("ano", ano).eq("mes", mes);
  if (error) throw new Error(error.message);
  config.delete(chave(ano, mes));
  semanasVersao.value++;
}
