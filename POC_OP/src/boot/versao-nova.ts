import { Notify } from "quasar";

/**
 * Depois de cada publicação, os arquivos antigos do site (ex.: ConfigMetas-C60gD9d1.js) deixam de existir.
 * Quem estava com o painel aberto tenta abrir uma tela, recebe 404 e fica travado.
 *  1) Erro ao carregar um arquivo da tela -> recarrega a página sozinha (uma vez).
 *  2) De tempos em tempos (e ao voltar para a aba) confere se saiu uma versão nova e avisa com botão "Atualizar".
 */
const CHAVE_RECARGA = "poc-recarga-por-versao";
const INTERVALO_MS = 5 * 60 * 1000;

const ERRO_ARQUIVO = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export function ehErroDeArquivo(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return ERRO_ARQUIVO.test(msg);
}

/** Recarrega a página, no máximo uma vez a cada 15 s (evita laço se o servidor realmente estiver fora). */
export function recarregarPorVersaoNova(): void {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE_RECARGA) ?? 0);
    if (Date.now() - ultima < 15_000) return;
    sessionStorage.setItem(CHAVE_RECARGA, String(Date.now()));
  } catch {
    /* sem sessionStorage: recarrega mesmo assim */
  }
  window.location.reload();
}

function arquivoPrincipalAtual(): string | null {
  const s = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]');
  return s?.getAttribute("src")?.match(/\/assets\/index-[\w-]+\.js/)?.[0] ?? null;
}

let avisado = false;

async function conferirVersao(): Promise<void> {
  if (avisado) return;
  const atual = arquivoPrincipalAtual();
  if (!atual) return;
  try {
    const html = await (await fetch(`${window.location.origin}/`, { cache: "no-store" })).text();
    const nova = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
    if (nova && nova !== atual) {
      avisado = true;
      Notify.create({
        type: "info",
        icon: "mdi-update",
        message: "Nova versão do painel disponível",
        caption: "Atualize para ver as novidades.",
        position: "bottom",
        timeout: 0,
        actions: [
          { label: "Atualizar", color: "white", handler: () => window.location.reload() },
          { label: "Depois", color: "white" },
        ],
      });
    }
  } catch {
    /* sem rede: tenta na próxima */
  }
}

export default () => {
  // Vite avisa quando um arquivo da tela não carrega
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    recarregarPorVersaoNova();
  });

  if (!import.meta.env.PROD) return;
  window.setInterval(() => void conferirVersao(), INTERVALO_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void conferirVersao();
  });
};
