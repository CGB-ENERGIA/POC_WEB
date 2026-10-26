/**
 * Seleção múltipla nos filtros do painel.
 *
 * Cada filtro continua sendo um texto: "Todos" quando nada está marcado, ou os valores marcados separados por "¦"
 * (ex.: "BCB¦BDC"). Assim, as verificações antigas (`filtro !== "Todos"`) seguem valendo e só a comparação com o dado
 * passa a usar `casa()`.
 */

export const TODOS = "Todos";
const SEP = "¦";

/** Valores marcados (vazio = sem filtro). */
export function valores(sel: string | null | undefined): string[] {
  if (!sel || sel === TODOS) return [];
  return sel.split(SEP).filter(Boolean);
}

/** Monta o texto do filtro a partir dos valores marcados ("Todos" se nenhum). */
export function juntar(v: readonly string[]): string {
  const u = [...new Set(v.filter((x) => x && x !== TODOS))];
  return u.length ? u.join(SEP) : TODOS;
}

/** Há algum valor marcado? */
export function ativo(sel: string | null | undefined): boolean {
  return valores(sel).length > 0;
}

/** O valor está marcado? (para destacar o botão). O botão "Todos" fica marcado quando nada mais está. */
export function marcado(sel: string | null | undefined, v: string): boolean {
  if (v === TODOS) return valores(sel).length === 0;
  return valores(sel).includes(v);
}

/** Evento do clique (basta ter ctrlKey/metaKey). */
export type CliqueEv = { ctrlKey?: boolean; metaKey?: boolean } | null | undefined;
/** Evento do clique em um gráfico do ECharts (params.event.event), no formato que `alternar` espera. */
export const eventoDe = (p: { event?: { event?: unknown } }): CliqueEv => (p.event?.event ?? undefined) as CliqueEv;
const soma = (ev: CliqueEv) => !!(ev && (ev.ctrlKey || ev.metaKey));

/**
 * Seleção por clique, como no Explorer: clique comum escolhe só aquele valor (clicar de novo no único marcado limpa);
 * Ctrl+clique soma ou tira o valor da seleção. Clicar em "Todos" limpa.
 */
export function alternar(sel: string | null | undefined, v: string, ev?: CliqueEv): string {
  if (v === TODOS) return TODOS;
  const atual = valores(sel);
  if (soma(ev)) return juntar(atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v]);
  return atual.length === 1 && atual[0] === v ? TODOS : v;
}

/** Igual a `alternar`, mas nunca deixa vazio (ex.: o período sempre precisa de pelo menos um mês). */
export function alternarMinimo(sel: string | null | undefined, v: string, ev?: CliqueEv): string {
  const atual = valores(sel);
  if (soma(ev)) {
    if (!atual.includes(v)) return juntar([...atual, v]);
    return atual.length > 1 ? juntar(atual.filter((x) => x !== v)) : juntar(atual);
  }
  return v;
}

/** Sem filtro, tudo passa; com filtro, o valor precisa ser igual a algum dos marcados (comparação opcional, ex.: ignorar maiúsculas). */
export function casa(
  sel: string | null | undefined,
  valor: string | null | undefined,
  igual: (a: string, b: string) => boolean = (a, b) => a === b,
): boolean {
  const v = valores(sel);
  if (!v.length) return true;
  const alvo = valor ?? "";
  return v.some((x) => igual(x, alvo));
}

/** Igualdade sem diferença de maiúsculas/minúsculas. */
export const igualCI = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Texto para mostrar o filtro ("Todos", "BCB", "BCB, BDC"). */
export function rotulo(sel: string | null | undefined): string {
  const v = valores(sel);
  return v.length ? v.join(", ") : TODOS;
}

/** Lista de opções sem o "Todos" (no seletor múltiplo, deixar tudo desmarcado já é "Todos"). */
export function semTodos<T extends string>(opcoes: readonly T[]): T[] {
  return opcoes.filter((o) => o !== TODOS);
}
