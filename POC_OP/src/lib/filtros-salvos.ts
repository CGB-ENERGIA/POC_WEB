/** Filtros de uma página guardados no navegador: o que o usuário escolheu volta depois de recarregar. */
const PREFIXO = "poc_op_filtros_";

/**
 * Lê os filtros salvos da página `chave`. Só aceita campos que existem em `padrao`, com o mesmo tipo
 * e aprovados por `valido`; o resto fica com o valor padrão.
 */
export function lerFiltros<T extends Record<string, string | number>>(
  chave: string,
  padrao: T,
  valido: (campo: keyof T, valor: string | number) => boolean = () => true,
): T {
  const out = { ...padrao };
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return out;
    const salvo = JSON.parse(bruto) as Record<string, unknown>;
    for (const campo of Object.keys(padrao) as (keyof T & string)[]) {
      const v = salvo[campo];
      if ((typeof v === "string" || typeof v === "number") && typeof v === typeof padrao[campo] && valido(campo, v)) {
        (out as Record<string, string | number>)[campo] = v;
      }
    }
  } catch {
    /* sem armazenamento ou conteúdo inválido: segue com o padrão */
  }
  return out;
}

export function salvarFiltros(chave: string, valor: Record<string, string | number>): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: o filtro só vale nesta sessão */
  }
}
