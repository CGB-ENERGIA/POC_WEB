/**
 * Qual câmera o aparelho usa.
 *
 * Padrão: a câmera nativa do celular (<input capture>). Em aparelhos com pouca memória o
 * Android encerra o navegador enquanto o app da câmera está aberto; ao voltar a página
 * recarrega e a foto se perde ("Devido à insuficiência de memória…"). Marcamos a abertura
 * da câmera nativa; se o app reiniciar com a marca ainda lá, o navegador foi encerrado e
 * o aparelho passa a usar a câmera dentro do app (getUserMedia), que não sai da página.
 */
import { ref } from "vue";

const MODO_KEY = "cgb-camera-modo";
const PENDENTE_KEY = "cgb-camera-pendente";
const JANELA_QUEDA_MS = 15 * 60 * 1000;

/**
 * O que ficou decidido precisa sobreviver a quando o Android encerra o navegador, e há aparelhos em que o localStorage falha ou é limpo
 * ao reiniciar. Por isso cada valor também vai para um cookie (vale 1 ano; a marca de "câmera aberta" vale 20 minutos).
 */
function lerCookie(key: string): string | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
    return m ? decodeURIComponent(m.slice(key.length + 1)) : null;
  } catch { return null; }
}
function gravarCookie(key: string, valor: string | null, segundos: number) {
  try {
    document.cookie = valor === null
      ? `${key}=; max-age=0; path=/; SameSite=Lax`
      : `${key}=${encodeURIComponent(valor)}; max-age=${segundos}; path=/; SameSite=Lax`;
  } catch { /* sem cookie */ }
}
function ler(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch { /* cai para o cookie */ }
  return lerCookie(key);
}
function gravar(key: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(key);
    else localStorage.setItem(key, valor);
  } catch { /* sem storage */ }
  gravarCookie(key, valor, key === PENDENTE_KEY ? JANELA_QUEDA_MS / 1000 : 365 * 86400);
}

/** Aparelho com pouca memória (Chrome informa 2 GB ou menos): a câmera nativa derruba o navegador com facilidade. */
function aparelhoDePoucaMemoria(): boolean {
  const gb = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  return typeof gb === "number" && gb <= 2;
}

/** "app" = câmera dentro do app; "nativa" = o usuário escolheu a do celular; sem escolha, o aparelho de pouca memória já começa no app. */
function modoInicial(): boolean {
  const salvo = ler(MODO_KEY);
  if (salvo === "app") return true;
  if (salvo === "nativa") return false;
  return aparelhoDePoucaMemoria();
}

export const cameraNoApp = ref(modoInicial());

export function usarCameraNoApp(ativo: boolean) {
  cameraNoApp.value = ativo;
  gravar(MODO_KEY, ativo ? "app" : "nativa");
}

function limparPendente() {
  gravar(PENDENTE_KEY, null);
  document.removeEventListener("visibilitychange", aoVoltar);
}

function aoVoltar() {
  // A página continuou viva enquanto a câmera esteve aberta.
  if (document.visibilityState === "visible") limparPendente();
}

/** Chamar logo antes de abrir a câmera nativa. */
export function marcarCameraNativaAberta() {
  gravar(PENDENTE_KEY, String(Date.now()));
  document.addEventListener("visibilitychange", aoVoltar);
}

/** Chamar quando a câmera nativa devolver a foto ou for cancelada. */
export function cameraNativaRetornou() {
  limparPendente();
}

/**
 * Na abertura do app: true se a página foi encerrada com a câmera nativa aberta.
 * Nesse caso o aparelho já fica configurado para a câmera dentro do app.
 */
export function detectarQuedaDaCamera(): boolean {
  const marca = Number(ler(PENDENTE_KEY));
  gravar(PENDENTE_KEY, null);
  if (!marca || Date.now() - marca > JANELA_QUEDA_MS) return false;
  usarCameraNoApp(true);
  return true;
}

/**
 * Celular ou tablet: o <input capture> abre direto a câmera. Em computador o navegador ignora o "capture" e abre o seletor
 * de arquivos, por onde entraria qualquer foto da pasta (fraude), por isso o computador só usa a câmera dentro do app.
 */
export function aparelhoComCapture(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  const movel = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  let toque = false;
  try { toque = window.matchMedia("(pointer: coarse)").matches; } catch { /* sem matchMedia */ }
  return movel || toque;
}

/** Usa a câmera dentro do app: escolha do aparelho (queda do navegador) ou obrigatória no computador. */
export function usarCameraInterna(): boolean {
  return cameraNoAppDisponivel() && (cameraNoApp.value || !aparelhoComCapture());
}

export const MSG_SEM_CAMERA_COMPUTADOR =
  "Este computador não tem câmera disponível para o app. As fotos do checklist precisam ser tiradas na hora: use o celular.";

/** O navegador permite a câmera dentro do app (exige HTTPS e getUserMedia). */
export function cameraNoAppDisponivel(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}
