/**
 * Extrai uma lista de itens de uma pergunta que menciona mais de uma coisa entre parênteses.
 * Ex: "Os EPI (capacete, vestimenta, bota de segurança, etc.) estão em condições de uso?"
 *  -> ["Capacete", "Vestimenta", "Bota de segurança"]
 * Retorna null quando a pergunta não descreve uma lista com 2+ itens.
 */
export function extrairItensPergunta(texto: string): string[] | null {
  const match = texto.match(/\(([^)]+)\)/);
  if (!match) return null;

  const itens = match[1]
    .split(",")
    .map((s) => s.trim().replace(/\.{2,}$/, "").replace(/\s*etc\.?$/i, "").trim())
    .filter((s) => s.length > 0 && !/^etc\.?$/i.test(s))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  return itens.length >= 2 ? itens : null;
}
