import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";

const ROT_KEY = "cgb-camera-rot-extra";

function lerRotExtra(): number {
  try {
    const v = Number(localStorage.getItem(ROT_KEY));
    return [0, 90, 180, 270].includes(v) ? v : 0;
  } catch {
    return 0;
  }
}

/**
 * Corrige a orientação da câmera.
 *
 * Alguns iPhones (principalmente no PWA instalado) entregam o quadro do sensor
 * deitado mesmo com o celular em pé. Comparamos a orientação da tela com a do
 * vídeo e giramos a imagem (preview e foto capturada) para ficar em pé. O botão
 * de girar permite ajustar à mão em passos de 90° (a escolha fica salva).
 */
export function useCameraRotation(
  videoRef: Ref<HTMLVideoElement | null>,
  containerRef: Ref<HTMLElement | null>,
) {
  const telaW = ref(window.innerWidth);
  const telaH = ref(window.innerHeight);
  const vidW = ref(0);
  const vidH = ref(0);
  const boxW = ref(0);
  const boxH = ref(0);
  const rotExtra = ref(lerRotExtra());

  const rotAuto = computed(() => {
    if (!vidW.value || !vidH.value) return 0;
    const telaEmPe = telaH.value >= telaW.value;
    const videoEmPe = vidH.value >= vidW.value;
    if (telaEmPe === videoEmPe) return 0;
    return telaEmPe ? 90 : 270;
  });
  const rotTotal = computed(() => (rotAuto.value + rotExtra.value) % 360);

  function girarManual() {
    rotExtra.value = (rotExtra.value + 90) % 360;
    try {
      localStorage.setItem(ROT_KEY, String(rotExtra.value));
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

  /** Dimensões a pedir ao getUserMedia, na mesma orientação da tela. */
  function dimensoesIdeais() {
    const emPe = window.innerHeight >= window.innerWidth;
    return emPe ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
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

  function atualizarTela() {
    telaW.value = window.innerWidth;
    telaH.value = window.innerHeight;
    medirVideo();
  }

  let ro: ResizeObserver | null = null;
  onMounted(() => {
    window.addEventListener("resize", atualizarTela);
    window.addEventListener("orientationchange", atualizarTela);
  });
  onUnmounted(() => {
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
