import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";

const ROT_KEY = "cgb-camera-rot-extra";

function chave(emPe: boolean) {
  return `${ROT_KEY}-${emPe ? "pe" : "deitado"}`;
}

function lerRotExtra(emPe: boolean): number {
  try {
    const v = Number(localStorage.getItem(chave(emPe)));
    return [0, 90, 180, 270].includes(v) ? v : 0;
  } catch {
    return 0;
  }
}

/**
 * Corrige a orientação da câmera.
 *
 * - Pede ao getUserMedia um vídeo 4:3 na mesma orientação da tela (4:3 usa o campo
 *   de visão completo do sensor; 16:9 dá a impressão de "zoom" no iPhone).
 * - Ao virar o celular, reinicia a câmera com a proporção da nova orientação
 *   (`reiniciar`), em vez de girar a imagem na mão.
 * - Só gira por conta própria o caso conhecido: tela em pé recebendo quadro deitado.
 * - O botão de girar ajusta em passos de 90°; a escolha é salva separadamente para
 *   o celular em pé e deitado.
 */
export function useCameraRotation(
  videoRef: Ref<HTMLVideoElement | null>,
  containerRef: Ref<HTMLElement | null>,
  reiniciar?: () => void | Promise<void>,
) {
  const telaW = ref(window.innerWidth);
  const telaH = ref(window.innerHeight);
  const vidW = ref(0);
  const vidH = ref(0);
  const boxW = ref(0);
  const boxH = ref(0);

  const telaEmPe = computed(() => telaH.value >= telaW.value);
  const rotExtra = ref(lerRotExtra(telaEmPe.value));
  watch(telaEmPe, (v) => { rotExtra.value = lerRotExtra(v); });

  /** Tela em pé recebendo quadro deitado: gira 90° (sentido horário). */
  const rotAuto = computed(() => {
    if (!vidW.value || !vidH.value) return 0;
    const videoEmPe = vidH.value >= vidW.value;
    return telaEmPe.value && !videoEmPe ? 90 : 0;
  });
  const rotTotal = computed(() => (rotAuto.value + rotExtra.value) % 360);

  function girarManual() {
    rotExtra.value = (rotExtra.value + 90) % 360;
    try {
      localStorage.setItem(chave(telaEmPe.value), String(rotExtra.value));
    } catch {
      /* sem storage */
    }
  }

  function medirVideo() {
    const v = videoRef.value;
    if (!v) return;
    vidW.value = v.videoWidth;
    vidH.value = v.videoHeight;
  }

  const videoStyle = computed(() => {
    const r = rotTotal.value;
    if (r === 0 || !boxW.value || !boxH.value) return {};
    const lado = r === 90 || r === 270;
    return {
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      width: `${lado ? boxH.value : boxW.value}px`,
      height: `${lado ? boxW.value : boxH.value}px`,
      transform: `translate(-50%, -50%) rotate(${r}deg)`,
    };
  });

  /** Dimensões a pedir ao getUserMedia: 4:3 na orientação da tela. */
  function dimensoesIdeais() {
    const emPe = window.innerHeight >= window.innerWidth;
    return emPe ? { width: 1440, height: 1920 } : { width: 1920, height: 1440 };
  }

  /** Desenha o quadro atual do vídeo no canvas já com o giro aplicado. */
  function desenharNoCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const rot = rotTotal.value;
    const lado = rot === 90 || rot === 270;
    canvas.width = lado ? h : w;
    canvas.height = lado ? w : h;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(video, -w / 2, -h / 2, w, h);
  }

  let timer = 0;
  function lerTela() {
    telaW.value = window.innerWidth;
    telaH.value = window.innerHeight;
    medirVideo();
  }
  function atualizarTela() {
    lerTela();
    // O iOS atualiza o tamanho da janela com atraso depois de girar: relê em seguida.
    window.clearTimeout(timer);
    timer = window.setTimeout(lerTela, 350);
  }

  // Virou o celular: refaz a câmera com a proporção da nova orientação.
  watch(telaEmPe, () => {
    window.setTimeout(() => { void reiniciar?.(); }, 150);
  });

  let ro: ResizeObserver | null = null;
  onMounted(() => {
    window.addEventListener("resize", atualizarTela);
    window.addEventListener("orientationchange", atualizarTela);
  });
  onUnmounted(() => {
    window.clearTimeout(timer);
    ro?.disconnect();
    window.removeEventListener("resize", atualizarTela);
    window.removeEventListener("orientationchange", atualizarTela);
  });
  watch(containerRef, (el) => {
    ro?.disconnect();
    if (!el) return;
    boxW.value = el.clientWidth;
    boxH.value = el.clientHeight;
    ro = new ResizeObserver(() => {
      boxW.value = el.clientWidth;
      boxH.value = el.clientHeight;
    });
    ro.observe(el);
  });

  return { rotTotal, videoStyle, medirVideo, girarManual, dimensoesIdeais, desenharNoCanvas };
}
