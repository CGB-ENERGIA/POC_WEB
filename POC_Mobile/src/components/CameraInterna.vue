<template>
  <teleport to="body">
    <div v-if="aberta" class="ci-overlay">
      <div class="ci-header">
        <button class="ci-icon-btn" aria-label="Fechar" @click="aberta = false">
          <q-icon name="mdi-close" size="26px" />
        </button>
        <span class="ci-title">{{ titulo }}</span>
        <button
          v-if="temTorch"
          class="ci-icon-btn"
          :class="{ 'ci-icon-btn--on': torchLigada }"
          aria-label="Lanterna"
          @click="alternarTorch"
        >
          <q-icon :name="torchLigada ? 'mdi-flashlight' : 'mdi-flashlight-off'" size="22px" />
        </button>
        <div v-else class="ci-spacer" />
      </div>

      <div class="ci-stage">
        <video ref="videoEl" class="ci-video" autoplay playsinline muted />
        <div v-if="flash" class="ci-flash" aria-hidden="true" />
        <div v-if="!pronto && !erro" class="ci-msg">
          <q-spinner color="white" size="36px" />
          <span>Abrindo câmera…</span>
        </div>
        <div v-if="erro" class="ci-msg">
          <q-icon name="mdi-camera-off-outline" size="44px" />
          <span>{{ erro }}</span>
          <button class="ci-link" @click="trocarParaNativa">Usar a câmera do celular</button>
        </div>
      </div>

      <div class="ci-footer">
        <button class="ci-side-btn" aria-label="Trocar câmera" :disabled="!pronto" @click="virar">
          <q-icon name="mdi-camera-flip-outline" size="26px" />
        </button>
        <button class="ci-shutter" aria-label="Tirar foto" :disabled="!pronto || capturando" @click="capturar">
          <q-spinner v-if="capturando" color="grey-8" size="28px" />
        </button>
        <div class="ci-side-btn ci-side-btn--count">
          <template v-if="tiradas > 0">{{ tiradas }}</template>
        </div>
      </div>

      <button v-if="aparelhoComCapture()" class="ci-nativa" @click="trocarParaNativa">
        Usar a câmera do celular
      </button>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { usarCameraNoApp, aparelhoComCapture } from "@/utils/camera-mode";

/**
 * Câmera dentro do app (getUserMedia). Usada nos aparelhos em que o Android encerra o
 * navegador ao abrir a câmera nativa; aqui a foto é tirada sem sair da página.
 */
const aberta = defineModel<boolean>({ required: true });
withDefaults(defineProps<{ titulo?: string; tiradas?: number }>(), { titulo: "Tirar foto", tiradas: 0 });
const emit = defineEmits<{
  (e: "captured", blob: Blob): void;
  (e: "usarNativa"): void;
}>();

const MAX_LADO = 1280;

const videoEl = ref<HTMLVideoElement | null>(null);
const pronto = ref(false);
const erro = ref("");
const capturando = ref(false);
const flash = ref(false);
const facing = ref<"environment" | "user">("environment");
const temTorch = ref(false);
const torchLigada = ref(false);

let stream: MediaStream | null = null;
let inicio = 0;

function mensagemErro(err: unknown): string {
  const name = (err as DOMException)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permissão de câmera negada. Libere a câmera nas configurações do navegador.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "Câmera não encontrada neste aparelho.";
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "A câmera está em uso por outro app. Feche-o e tente de novo.";
  }
  return "Não foi possível abrir a câmera.";
}

function parar() {
  inicio++;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  pronto.value = false;
  temTorch.value = false;
  torchLigada.value = false;
  if (videoEl.value) videoEl.value.srcObject = null;
}

async function iniciar() {
  parar();
  const meu = inicio;
  erro.value = "";
  if (!navigator.mediaDevices?.getUserMedia) {
    erro.value = "Este navegador não permite a câmera dentro do app.";
    return;
  }

  const tentativas: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: facing.value }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false },
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
      if (n === "NotAllowedError" || n === "PermissionDeniedError" || n === "NotFoundError") break;
    }
  }
  if (!obtido) {
    if (meu === inicio) erro.value = mensagemErro(ultimoErro);
    return;
  }
  if (meu !== inicio || !aberta.value) { obtido.getTracks().forEach((t) => t.stop()); return; }

  stream = obtido;
  const track = stream.getVideoTracks()[0];
  const caps = (track as unknown as { getCapabilities?: () => { torch?: boolean } })?.getCapabilities?.() ?? {};
  temTorch.value = !!caps.torch;

  await nextTick();
  const v = videoEl.value;
  if (!v) return;
  v.srcObject = stream;
  try { await v.play(); } catch { /* autoplay cobre */ }
  if (meu === inicio) pronto.value = true;
}

async function alternarTorch() {
  const track = stream?.getVideoTracks()[0];
  if (!track) return;
  const alvo = !torchLigada.value;
  try {
    await track.applyConstraints({ advanced: [{ torch: alvo } as MediaTrackConstraintSet] });
    torchLigada.value = alvo;
  } catch { /* aparelho recusou */ }
}

async function virar() {
  facing.value = facing.value === "environment" ? "user" : "environment";
  await iniciar();
}

function capturar() {
  const v = videoEl.value;
  if (!v || !pronto.value || !v.videoWidth) return;
  capturando.value = true;
  const escala = Math.min(1, MAX_LADO / Math.max(v.videoWidth, v.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(v.videoWidth * escala);
  canvas.height = Math.round(v.videoHeight * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) { capturando.value = false; return; }
  ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

  flash.value = true;
  window.setTimeout(() => { flash.value = false; }, 160);
  try { navigator.vibrate?.(25); } catch { /* sem vibração */ }

  canvas.toBlob((blob) => {
    capturando.value = false;
    canvas.width = 0;
    canvas.height = 0;
    if (blob) emit("captured", blob);
    else erro.value = "Não foi possível gerar a foto. Tente de novo.";
  }, "image/jpeg", 0.9);
}

function trocarParaNativa() {
  usarCameraNoApp(false);
  aberta.value = false;
  emit("usarNativa");
}

function aoMudarVisibilidade() {
  if (document.hidden) parar();
  else if (aberta.value && !stream) void iniciar();
}

watch(aberta, (v) => {
  if (v) {
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    void iniciar();
  } else {
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    parar();
  }
}, { immediate: true });

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  parar();
});
</script>

<style scoped>
.ci-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: #000;
  display: flex;
  flex-direction: column;
  color: #fff;
}
.ci-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(10px, env(safe-area-inset-top)) 12px 10px;
}
.ci-title { font-size: 16px; font-weight: 700; }
.ci-spacer { width: 44px; }
.ci-icon-btn {
  appearance: none;
  border: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
}
.ci-icon-btn--on { background: #facc15; color: #111; }

.ci-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ci-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.ci-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  pointer-events: none;
  animation: ci-flash 0.16s ease-out forwards;
}
@keyframes ci-flash {
  from { opacity: 0.85; }
  to { opacity: 0; }
}
.ci-msg {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}
.ci-link {
  appearance: none;
  border: 0;
  background: none;
  color: #facc15;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.ci-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 18px 24px 8px;
}
.ci-side-btn {
  appearance: none;
  border: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
}
.ci-side-btn:disabled { opacity: 0.4; }
.ci-side-btn--count {
  background: none;
  font-size: 15px;
  font-weight: 700;
  cursor: default;
}
.ci-shutter {
  appearance: none;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.45);
  background: #fff;
  background-clip: padding-box;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ci-shutter:active { transform: scale(0.94); }
.ci-shutter:disabled { opacity: 0.5; }

.ci-nativa {
  appearance: none;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  padding: 6px 0 max(14px, env(safe-area-inset-bottom));
  cursor: pointer;
}
</style>
