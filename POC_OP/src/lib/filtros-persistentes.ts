import { isRef, watch, type Ref } from "vue";

/**
 * Filtros das páginas ficam guardados na sessão do navegador (sessionStorage): ao ir para outra página e voltar,
 * ou ao recarregar (F5), a página reabre com o que o usuário tinha escolhido. Nova aba/sessão começa do padrão.
 * Chame logo depois de criar o estado, dentro do setup (antes do primeiro carregamento de dados).
 */
const PREFIXO = "poc:filtros:";

const mesmoTipo = (padrao: unknown, salvo: unknown) =>
  padrao == null || salvo == null
    ? true
    : Array.isArray(padrao) === Array.isArray(salvo) && typeof padrao === typeof salvo;

function ler(chave: string): unknown {
  try {
    const bruto = sessionStorage.getItem(PREFIXO + chave);
    return bruto ? JSON.parse(bruto) : undefined;
  } catch {
    return undefined;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    sessionStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch { /* sem armazenamento (aba privada, cota): a página segue funcionando sem lembrar */ }
}

/** Objeto reativo (campo a campo, só chaves que já existem e com o mesmo tipo) ou ref (valor inteiro). */
export function persistirFiltros<T extends object>(chave: string, alvo: T | Ref<unknown>): void {
  const salvo = ler(chave);
  if (salvo !== undefined) {
    if (isRef(alvo)) {
      const atual = alvo.value;
      if (atual && typeof atual === "object" && !Array.isArray(atual) && salvo && typeof salvo === "object") {
        // ref de objeto ({ ano: 2026 }): mescla campo a campo
        const dest = atual as Record<string, unknown>;
        for (const k of Object.keys(dest)) {
          const v = (salvo as Record<string, unknown>)[k];
          if (v !== undefined && mesmoTipo(dest[k], v)) dest[k] = v;
        }
      } else if (mesmoTipo(atual, salvo)) {
        alvo.value = salvo;
      }
    } else if (salvo && typeof salvo === "object") {
      const dest = alvo as Record<string, unknown>;
      for (const k of Object.keys(dest)) {
        const v = (salvo as Record<string, unknown>)[k];
        if (v !== undefined && mesmoTipo(dest[k], v)) dest[k] = v;
      }
    }
  }
  watch(alvo as Ref<unknown>, (v) => gravar(chave, v), { deep: true });
}

/** Ao sair da conta, ninguém herda os filtros do usuário anterior. */
export function limparFiltrosSalvos() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith(PREFIXO)) sessionStorage.removeItem(k);
  } catch { /* ignora */ }
}
