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

function ler(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function gravar(key: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(key);
    else localStorage.setItem(key, valor);
  } catch { /* sem storage */ }
}

export const cameraNoApp = ref(ler(MODO_KEY) === "app");

export function usarCameraNoApp(ativo: boolean) {
  cameraNoApp.value = ativo;
  gravar(MODO_KEY, ativo ? "app" : null);
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
