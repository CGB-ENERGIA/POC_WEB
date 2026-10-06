import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";

// v3: valores salvos por versões anteriores (sem ângulo/câmera) são ignorados.
const ROT_KEY = "cgb-camera-rot-v3";

/** Ângulo atual da tela (0, 90, 180, 270), em qualquer navegador. */
function anguloTela(): number {
  const a = screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0;
  return ((Math.round(Number(a) / 90) * 90) % 360 + 360) % 360;
}

function chave(facing: string, angulo: number) {
  return `${ROT_KEY}-${facing}-${angulo}`;
}

function lerRotExtra(facing: string, angulo: number): number {
  try {
    const v = Number(localStorage.getItem(chave(facing, angulo)));
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
 * - O botão de girar ajusta em passos de 90°; a escolha é salva separadamente para cada
 *   câmera (traseira/frontal) e para cada ângulo da tela (em pé, deitado p/ esquerda,
 *   deitado p/ direita, de cabeça para baixo), então se aprende uma vez por posição.
 */
export function useCameraRotation(
  videoRef: Ref<HTMLVideoElement | null>,
  containerRef: Ref<HTMLElement | null>,
  reiniciar?: () => void | Promise<void>,
  facing?: Ref<string>,
) {
  const telaW = ref(window.innerWidth);
  const telaH = ref(window.innerHeight);
  const vidW = ref(0);
  const vidH = ref(0);
  const boxW = ref(0);
  const boxH = ref(0);

  const telaEmPe = computed(() => telaH.value >= telaW.value);
  const angulo = ref(anguloTela());
  const camera = () => facing?.value ?? "environment";
  const rotExtra = ref(lerRotExtra(camera(), angulo.value));
  const relerExtra = () => { rotExtra.value = lerRotExtra(camera(), angulo.value); };
  watch([angulo, () => facing?.value], relerExtra);

  /**
   * Só no iOS: tela em pé recebendo quadro deitado (sensor sem girar) → gira 90° (horário).
   * No Android o Chrome já entrega o quadro em pé, mesmo quando a proporção é deitada;
   * girar lá deixaria a imagem de lado.
   */
  const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const rotAuto = computed(() => {
    if (!ehIOS || !vidW.value || !vidH.value) return 0;
    const videoEmPe = vidH.value >= vidW.value;
    return telaEmPe.value && !videoEmPe ? 90 : 0;
  });
  const rotTotal = computed(() => (rotAuto.value + rotExtra.value) % 360);

  function girarManual() {
    rotExtra.value = (rotExtra.value + 90) % 360;
    try {
      localStorage.setItem(chave(camera(), angulo.value), String(rotExtra.value));
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

  /** Dimensões a pedir ao getUserMedia: 4:3 na orientação da tela (com a proporção explícita). */
  function dimensoesIdeais() {
    const emPe = window.innerHeight >= window.innerWidth;
    return emPe
      ? { width: 1440, height: 1920, aspectRatio: 3 / 4 }
      : { width: 1920, height: 1440, aspectRatio: 4 / 3 };
  }

  let timer = 0;
  let reinicioTimer = 0;
  function lerTela() {
    telaW.value = window.innerWidth;
    telaH.value = window.innerHeight;
    angulo.value = anguloTela();
    medirVideo();
  }
  function atualizarTela() {
    lerTela();
    // O iOS atualiza o tamanho da janela com atraso depois de girar: relê em seguida.
    window.clearTimeout(timer);
    timer = window.setTimeout(lerTela, 350);
  }

  // Virou o celular: refaz a câmera com a proporção da nova orientação.
  watch([telaEmPe, angulo], () => {
    window.clearTimeout(reinicioTimer);
    reinicioTimer = window.setTimeout(() => { void reiniciar?.(); }, 250);
  });

  let ro: ResizeObserver | null = null;
  onMounted(() => {
    window.addEventListener("resize", atualizarTela);
    window.addEventListener("orientationchange", atualizarTela);
    screen.orientation?.addEventListener?.("change", atualizarTela);
  });
  onUnmounted(() => {
    window.clearTimeout(timer);
    window.clearTimeout(reinicioTimer);
    ro?.disconnect();
    window.removeEventListener("resize", atualizarTela);
    window.removeEventListener("orientationchange", atualizarTela);
    screen.orientation?.removeEventListener?.("change", atualizarTela);
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

  return { rotTotal, rotExtra, angulo, videoStyle, medirVideo, girarManual, dimensoesIdeais, vidW, vidH };
}
