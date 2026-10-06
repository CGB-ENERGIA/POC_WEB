<template>
  <div class="vf-root">
    <!-- Área disponível: o quadro é calculado dentro dela com a proporção real do vídeo -->
    <div
      ref="areaEl"
      class="vf-area"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    >
      <div ref="stageEl" class="vf-stage">
        <div class="vf-zoomwrap" :style="zoomStyle">
          <video
            ref="videoEl"
            autoplay
            playsinline
            webkit-playsinline
            muted
            class="vf-video"
            :style="videoStyle"
            @loadedmetadata="medirVideo"
            @resize="medirVideo"
          />
        </div>

        <div v-if="grade" class="vf-grid" aria-hidden="true" />

        <div
          v-if="foco"
          :key="foco.k"
          class="vf-focus"
          :style="{ left: `${foco.x}px`, top: `${foco.y}px` }"
          aria-hidden="true"
        />

        <div v-if="flash" class="vf-flash" aria-hidden="true" />

        <!-- Conteúdo extra da tela que usa a câmera (ex.: data e hora ao vivo) -->
        <slot />
      </div>
    </div>

    <!-- Ferramentas -->
    <div class="vf-tools">
      <button
        v-if="temTorch"
        class="vf-tool"
        :class="{ 'vf-tool--on': torchLigada }"
        aria-label="Lanterna"
        @click="alternarTorch"
      >
        <q-icon :name="torchLigada ? 'mdi-flashlight' : 'mdi-flashlight-off'" size="22px" />
      </button>
      <button
        class="vf-tool"
        :class="{ 'vf-tool--on': grade }"
        aria-label="Grade"
        @click="alternarGrade"
      >
        <q-icon name="mdi-grid" size="22px" />
      </button>
      <button
        class="vf-tool"
        aria-label="Girar imagem"
        @click="girarManual"
        @pointerdown="iniciarPressao"
        @pointerup="cancelarPressao"
        @pointerleave="cancelarPressao"
      >
        <q-icon name="mdi-screen-rotation" size="22px" />
      </button>
    </div>

    <!-- Zoom -->
    <div v-if="pronto" class="vf-zoombar">
      <button
        v-for="z in atalhosZoom"
        :key="z"
        class="vf-chip"
        :class="{ 'vf-chip--on': Math.abs(zoom - z) < 0.15 }"
        @click="definirZoom(z)"
      >
        {{ z }}×
      </button>
      <span v-if="!atalhosZoom.some((z) => Math.abs(zoom - z) < 0.15)" class="vf-chip vf-chip--on">
        {{ zoom.toFixed(1).replace(".", ",") }}×
      </span>
    </div>

    <!-- Diagnóstico (segure o botão de girar por 1 segundo) -->
    <pre v-if="debugOn" class="vf-debug" @click="debugOn = false">{{ debugTexto }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useCameraRotation } from "@/composables/useCameraRotation";

const props = defineProps<{ ativo: boolean }>();
const emit = defineEmits<{
  (e: "pronto", v: boolean): void;
  (e: "erro", v: string | null): void;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const areaEl = ref<HTMLElement | null>(null);
const stageEl = ref<HTMLElement | null>(null);

// ── Estado da câmera ─────────────────────────────────────
const facing = ref<"environment" | "user">("environment");
const pronto = ref(false);
let stream: MediaStream | null = null;
let track: MediaStreamTrack | null = null;
let inicio = 0; // descarta inícios obsoletos (virar o celular, trocar de câmera…)

type Capacidades = {
  zoom?: { min: number; max: number; step?: number };
  torch?: boolean;
  focusMode?: string[];
};
const caps = ref<Capacidades>({});
const zoom = ref(1);
const zoomHw = ref(false);
const zoomMax = ref(4);
const torchLigada = ref(false);
const temTorch = computed(() => !!caps.value.torch);

const GRADE_KEY = "cgb-camera-grade";
function lerGrade(): boolean {
  try { return localStorage.getItem(GRADE_KEY) === "1"; } catch { return false; }
}
const grade = ref(lerGrade());
function alternarGrade() {
  grade.value = !grade.value;
  try { localStorage.setItem(GRADE_KEY, grade.value ? "1" : "0"); } catch { /* sem storage */ }
}

// ── Orientação / tamanho do quadro ───────────────────────
const {
  rotTotal, videoStyle, medirVideo, girarManual, dimensoesIdeais, vidW, vidH,
} = useCameraRotation(videoEl, stageEl, reiniciarPorOrientacao);

const areaW = ref(0);
const areaH = ref(0);
let roArea: ResizeObserver | null = null;

// Sem espelhar (nem na selfie): a foto é evidência e textos/prefixos não podem sair invertidos.
const zoomStyle = computed(() => {
  const z = zoomHw.value ? 1 : zoom.value;
  return { transform: `scale(${z})` };
});

const atalhosZoom = computed(() => {
  const max = zoomMax.value;
  return [1, 2, 3].filter((z) => z <= max);
});

// ── Ciclo de vida ────────────────────────────────────────
function mensagemErro(err: unknown): string {
  const name = (err as DOMException)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permissão de câmera negada. Libere o acesso à câmera nas configurações do navegador.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Câmera não encontrada neste dispositivo.";
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "A câmera está sendo usada por outro app. Feche-o e tente de novo.";
  }
  return "Não foi possível acessar a câmera.";
}

function parar() {
  inicio++;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  track = null;
  pronto.value = false;
  torchLigada.value = false;
  if (videoEl.value) videoEl.value.srcObject = null;
  emit("pronto", false);
}

async function iniciar() {
  parar();
  const meu = ++inicio;
  emit("erro", null);

  const dim = dimensoesIdeais();
  const tentativas: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: { ideal: facing.value },
        width: { ideal: dim.width },
        height: { ideal: dim.height },
        aspectRatio: { ideal: dim.aspectRatio },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: facing.value },
        width: { ideal: dim.width },
        height: { ideal: dim.height },
      },
      audio: false,
    },
    { video: { facingMode: { ideal: facing.value } }, audio: false },
    { video: true, audio: false },
  ];

  let obtido: MediaStream | null = null;
  let ultimoErro: unknown = null;
  for (const c of tentativas) {
    try {
      obtido = await navigator.mediaDevices.getUserMedia(c);
      break;
    } catch (e) {
      ultimoErro = e;
      const n = (e as DOMException)?.name ?? "";
      // Sem permissão ou sem câmera: tentar outras restrições não adianta.
      if (n === "NotAllowedError" || n === "PermissionDeniedError" || n === "NotFoundError") break;
    }
  }

  if (!obtido) {
    if (meu === inicio) emit("erro", mensagemErro(ultimoErro));
    return;
  }
  if (meu !== inicio) { obtido.getTracks().forEach((t) => t.stop()); return; }

  stream = obtido;
  track = stream.getVideoTracks()[0] ?? null;
  track?.addEventListener("ended", () => { if (props.ativo && meu === inicio) void iniciar(); });

  // Recursos que o aparelho oferece (zoom, lanterna, foco)
  const c = ((track as unknown as { getCapabilities?: () => Capacidades })?.getCapabilities?.() ?? {}) as Capacidades;
  caps.value = c;
  zoomHw.value = !!c.zoom && c.zoom.max > 1;
  zoomMax.value = zoomHw.value ? Math.min(c.zoom!.max, 8) : 4;
  zoom.value = 1;
  if (c.focusMode?.includes("continuous")) await aplicar({ focusMode: "continuous" });
  if (zoomHw.value) await aplicar({ zoom: Math.max(c.zoom!.min, 1) });

  await nextTick();
  const v = videoEl.value;
  if (!v) return;
  v.srcObject = stream;
  try { await v.play(); } catch { /* o autoplay cobre */ }
  if (meu !== inicio) return;
  medirVideo();
  pronto.value = true;
  emit("pronto", true);
}

async function aplicar(adv: Record<string, unknown>) {
  try {
    await track?.applyConstraints({ advanced: [adv] } as MediaTrackConstraints);
    return true;
  } catch {
    return false;
  }
}

async function reiniciarPorOrientacao() {
  if (!props.ativo || !pronto.value) return;
  await iniciar();
}

function aoMudarVisibilidade() {
  // No iOS o stream congela (tela preta) quando o app vai para segundo plano.
  if (document.hidden) { if (stream) parar(); }
  else if (props.ativo && !stream) void iniciar();
}

async function virar() {
  facing.value = facing.value === "environment" ? "user" : "environment";
  await iniciar();
}

// ── Zoom ─────────────────────────────────────────────────
async function definirZoom(z: number) {
  const min = zoomHw.value ? Math.max(caps.value.zoom!.min, 1) : 1;
  const alvo = Math.min(zoomMax.value, Math.max(min, z));
  zoom.value = alvo;
  if (zoomHw.value) await aplicar({ zoom: alvo });
}

async function alternarTorch() {
  const alvo = !torchLigada.value;
  if (await aplicar({ torch: alvo })) torchLigada.value = alvo;
}

// ── Toque: pinça para zoom e toque para focar ───────────
const ptrs = new Map<number, { x: number; y: number }>();
let pinchBase = 0;
let zoomBase = 1;
let toque: { x: number; y: number; t: number } | null = null;

function distancia() {
  const [a, b] = [...ptrs.values()];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}
function onDown(e: PointerEvent) {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { pinchBase = distancia(); zoomBase = zoom.value; toque = null; }
  else if (ptrs.size === 1) toque = { x: e.clientX, y: e.clientY, t: Date.now() };
}
function onMove(e: PointerEvent) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && pinchBase > 0) void definirZoom(zoomBase * (distancia() / pinchBase));
}
function onUp(e: PointerEvent) {
  const eraToque =
    ptrs.size === 1 && toque && Date.now() - toque.t < 300 &&
    Math.hypot(e.clientX - toque.x, e.clientY - toque.y) < 10;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinchBase = 0;
  if (eraToque) void focarEm(e.clientX, e.clientY);
  toque = null;
}
function onCancel(e: PointerEvent) {
  ptrs.delete(e.pointerId);
  pinchBase = 0;
  toque = null;
}

const foco = ref<{ x: number; y: number; k: number } | null>(null);
let focoTimer = 0;
async function focarEm(cx: number, cy: number) {
  // Só mostra o anel quando o aparelho aceita foco por toque (o iPhone foca sozinho, de forma contínua).
  const modos = caps.value.focusMode ?? [];
  if (!modos.includes("single-shot") && !modos.includes("manual")) return;
  const r = stageEl.value?.getBoundingClientRect();
  if (!r) return;
  const x = cx - r.left;
  const y = cy - r.top;
  if (x < 0 || y < 0 || x > r.width || y > r.height) return;
  foco.value = { x, y, k: Date.now() };
  window.clearTimeout(focoTimer);
  focoTimer = window.setTimeout(() => { foco.value = null; }, 900);
  await aplicar({
    focusMode: modos.includes("single-shot") ? "single-shot" : "manual",
    pointsOfInterest: [{ x: x / r.width, y: y / r.height }],
  });
}

// ── Captura ──────────────────────────────────────────────
const flash = ref(false);

/**
 * Foto com exatamente o enquadramento mostrado na tela: mesma região (a tela mostra o
 * quadro preenchendo a área, cortando o excesso), com zoom e giro aplicados, sem espelhar.
 */
function capturar(): string {
  const v = videoEl.value;
  if (!v || !pronto.value || !v.videoWidth || !areaW.value || !areaH.value) {
    throw new Error("Câmera não está pronta");
  }

  const z = zoomHw.value ? 1 : zoom.value;
  const w = v.videoWidth;
  const h = v.videoHeight;
  const rot = rotTotal.value;
  const lado = rot === 90 || rot === 270;

  // Quadro já girado, como aparece na tela
  const dw = lado ? h : w;
  const dh = lado ? w : h;
  // Região visível: a área da tela (object-fit: cover corta o excesso, centralizado)
  const areaR = areaW.value / areaH.value;
  let cw: number;
  let ch: number;
  if (dw / dh > areaR) { ch = dh; cw = dh * areaR; }
  else { cw = dw; ch = dw / areaR; }
  cw /= z;
  ch /= z;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw);
  canvas.height = Math.round(ch);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(v, -w / 2, -h / 2, w, h);

  flash.value = true;
  window.setTimeout(() => { flash.value = false; }, 160);
  try { navigator.vibrate?.(25); } catch { /* sem vibração */ }

  return canvas.toDataURL("image/jpeg", 0.92);
}

// ── Diagnóstico ──────────────────────────────────────────
const debugOn = ref(false);
let pressTimer = 0;
function iniciarPressao() {
  window.clearTimeout(pressTimer);
  pressTimer = window.setTimeout(() => { debugOn.value = !debugOn.value; }, 1000);
}
function cancelarPressao() { window.clearTimeout(pressTimer); }

const debugTexto = computed(() => {
  const s = (track?.getSettings?.() ?? {}) as MediaTrackSettings;
  const ang = (screen.orientation && screen.orientation.angle) ?? (window as unknown as { orientation?: number }).orientation;
  return [
    `tela ${window.innerWidth}x${window.innerHeight} ang=${ang}`,
    `video ${vidW.value}x${vidH.value} settings ${s.width}x${s.height}`,
    `giro total=${rotTotal.value} zoom=${zoom.value.toFixed(2)} hw=${zoomHw.value}`,
    `facing=${facing.value} torch=${caps.value.torch ? "sim" : "nao"} foco=${(caps.value.focusMode ?? []).join(",")}`,
    `${navigator.userAgent.slice(0, 80)}`,
    "(toque para fechar)",
  ].join("\n");
});

// ── Montagem ─────────────────────────────────────────────
onMounted(() => {
  document.addEventListener("visibilitychange", aoMudarVisibilidade);
  if (areaEl.value) {
    areaW.value = areaEl.value.clientWidth;
    areaH.value = areaEl.value.clientHeight;
    roArea = new ResizeObserver(() => {
      areaW.value = areaEl.value?.clientWidth ?? 0;
      areaH.value = areaEl.value?.clientHeight ?? 0;
    });
    roArea.observe(areaEl.value);
  }
  if (props.ativo) void iniciar();
});

watch(() => props.ativo, (v) => { if (v) void iniciar(); else parar(); });

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  roArea?.disconnect();
  window.clearTimeout(focoTimer);
  window.clearTimeout(pressTimer);
  parar();
});

defineExpose({ capturar, virar });
</script>

<style scoped>
.vf-root {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: #000;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.vf-area {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vf-stage {
  position: relative;
  overflow: hidden;
  background: #111;
  width: 100%;
  height: 100%;
}
.vf-zoomwrap {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  will-change: transform;
}
.vf-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #111;
}

.vf-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, transparent calc(33.333% - 0.5px), rgba(255, 255, 255, 0.45) calc(33.333% - 0.5px), rgba(255, 255, 255, 0.45) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgba(255, 255, 255, 0.45) calc(66.666% - 0.5px), rgba(255, 255, 255, 0.45) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)),
    linear-gradient(to bottom, transparent calc(33.333% - 0.5px), rgba(255, 255, 255, 0.45) calc(33.333% - 0.5px), rgba(255, 255, 255, 0.45) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgba(255, 255, 255, 0.45) calc(66.666% - 0.5px), rgba(255, 255, 255, 0.45) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px));
}

.vf-focus {
  position: absolute;
  width: 68px;
  height: 68px;
  margin: -34px 0 0 -34px;
  border: 2px solid #facc15;
  border-radius: 14px;
  pointer-events: none;
  animation: vf-focus 0.9s ease-out forwards;
}
@keyframes vf-focus {
  0% { transform: scale(1.35); opacity: 0; }
  25% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

.vf-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  pointer-events: none;
  animation: vf-flash 0.16s ease-out forwards;
}
@keyframes vf-flash {
  from { opacity: 0.85; }
  to { opacity: 0; }
}

.vf-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 3;
}
.vf-tool {
  appearance: none;
  border: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: background 0.15s;
}
.vf-tool:active { background: rgba(255, 255, 255, 0.3); }
.vf-tool--on { background: #facc15; color: #111; }

.vf-zoombar {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 3;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
}
.vf-chip {
  appearance: none;
  border: 0;
  min-width: 38px;
  height: 32px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.vf-chip--on { background: #facc15; color: #111; }

.vf-debug {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 8px;
  z-index: 5;
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.78);
  color: #86efac;
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
}
</style>
