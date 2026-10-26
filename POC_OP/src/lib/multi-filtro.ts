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

/** O valor está marcado? (para destacar o botão) */
export function marcado(sel: string | null | undefined, v: string): boolean {
  return valores(sel).includes(v);
}

/** Marca ou desmarca um valor. */
export function alternar(sel: string | null | undefined, v: string): string {
  const atual = valores(sel);
  return juntar(atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v]);
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
