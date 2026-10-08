const KEY = "poc_op_tipo_poc";

/** Último "Tipo de POC" escolhido pelo usuário; "Todos" se não houver ou se a página não tiver essa opção. */
export function lerTipoPoc(opcoes: string[]): string {
  try {
    const v = localStorage.getItem(KEY);
    return v && opcoes.includes(v) ? v : "Todos";
  } catch {
    return "Todos";
  }
}

export function salvarTipoPoc(valor: string): void {
  try {
    if (valor === "Todos") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, valor);
  } catch {
    /* sem armazenamento: segue com o padrão */
  }
}
