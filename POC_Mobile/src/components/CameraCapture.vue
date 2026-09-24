<template>
  <teleport to="body">
    <transition name="cc-fade">
      <div v-if="modelValue" class="cc-overlay">

        <!-- ── HEADER ───────────────────────────────── -->
        <div class="cc-header">
          <button class="cc-icon-btn" @click="fechar">
            <q-icon name="mdi-close" size="26px" />
          </button>
          <span class="cc-header__title">
            {{ fotoDataUrl ? 'Confirmar foto' : 'Câmera' }}
          </span>
          <button
            class="cc-icon-btn"
            :class="{ 'cc-icon-btn--disabled': fotoDataUrl !== null }"
            @click="alternarCamera"
          >
            <q-icon name="mdi-camera-flip-outline" size="24px" />
          </button>
        </div>

        <!-- ── VIEWFINDER ────────────────────────────── -->
        <div class="cc-viewfinder">
          <!-- Live preview -->
          <video
            v-show="!fotoDataUrl"
            ref="videoEl"
            autoplay
            playsinline
            muted
            class="cc-video"
          />

          <!-- Captured photo review -->
          <img
            v-if="fotoDataUrl"
            :src="fotoDataUrl"
            class="cc-preview-img"
            alt="Foto capturada"
          />

          <!-- Timestamp overlay -->
          <div class="cc-timestamp">
            {{ timestampAtual }}
          </div>
        </div>

        <!-- ── FOOTER ────────────────────────────────── -->
        <div class="cc-footer">

          <!-- LIVE MODE: capture button -->
          <template v-if="!fotoDataUrl">
            <div class="cc-footer__spacer" />
            <button
              class="cc-capture-btn"
              :disabled="!streamAtivo"
              @click="capturar"
            >
              <div class="cc-capture-btn__ring" />
              <div class="cc-capture-btn__disc" />
            </button>
            <div class="cc-footer__spacer" />
          </template>

          <!-- REVIEW MODE: retake + confirm -->
          <template v-else>
            <button class="cc-action-btn cc-action-btn--cancel" @click="descartar">
              <q-icon name="mdi-camera-retake-outline" size="24px" />
              <span>Refazer</span>
            </button>
            <button
              class="cc-action-btn cc-action-btn--confirm"
              :disabled="salvando"
              @click="confirmar"
            >
              <q-spinner v-if="salvando" size="24px" />
              <q-icon v-else name="mdi-check-circle-outline" size="24px" />
              <span>{{ salvando ? 'Salvando…' : 'Salvar' }}</span>
            </button>
          </template>
        </div>

        <!-- ── ERRO ──────────────────────────────────── -->
        <div v-if="erroMsg" class="cc-error">
          <q-icon name="mdi-alert-circle-outline" size="20px" />
          {{ erroMsg }}
        </div>

        <!-- canvas oculto para captura -->
        <canvas ref="canvasEl" style="display:none" />

      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from "vue";
import { useGaleriaStore } from "@/stores/galeria";
import { useQuasar } from "quasar";

const props = defineProps<{
  modelValue: boolean;
  matricula: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "salva", id: string): void;
}>();

const $q       = useQuasar();
const galeria  = useGaleriaStore();
const videoEl  = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

let stream: MediaStream | null = null;
const streamAtivo  = ref(false);
const faceMode     = ref<"environment" | "user">("environment");
const fotoDataUrl  = ref<string | null>(null);
const fotoBlob     = ref<Blob | null>(null);
const erroMsg      = ref<string | null>(null);
const salvando     = ref(false);

// Timestamp atualizado a cada segundo quando o modal está aberto
const agora = ref(new Date());
let   tickId = 0;

const timestampAtual = computed(() => {
  const d = agora.value;
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date}  ${time}`;
});

async function iniciarStream() {
  erroMsg.value = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: faceMode.value },
        width:  { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
      await videoEl.value.play();
    }
    streamAtivo.value = true;
  } catch (err: unknown) {
    const name = (err as DOMException)?.name ?? "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      erroMsg.value = "Permissão de câmera negada. Verifique as configurações do navegador.";
    } else if (name === "NotFoundError") {
      erroMsg.value = "Câmera não encontrada neste dispositivo.";
    } else {
      erroMsg.value = "Não foi possível acessar a câmera.";
    }
    streamAtivo.value = false;
  }
}

function pararStream() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  streamAtivo.value = false;
  if (videoEl.value) videoEl.value.srcObject = null;
}

function capturar() {
  const video  = videoEl.value;
  const canvas = canvasEl.value;
  if (!video || !canvas || !streamAtivo.value) return;

  const w = video.videoWidth  || 1280;
  const h = video.videoHeight || 720;
  canvas.width  = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);

  // Timestamp gravado diretamente na imagem
  const ts = timestampAtual.value;
  const fontSize = Math.max(14, Math.round(w * 0.018));
  ctx.font      = `bold ${fontSize}px monospace`;
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(0, h - fontSize * 2.4, w, fontSize * 2.4);
  ctx.fillStyle = "#fff";
  ctx.fillText(ts, 12, h - fontSize * 0.7);

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      fotoBlob.value    = blob;
      fotoDataUrl.value = URL.createObjectURL(blob);
    },
    "image/jpeg",
    0.88
  );
}

async function confirmar() {
  if (!fotoBlob.value) return;
  salvando.value = true;
  try {
    const entry = await galeria.adicionarFoto(fotoBlob.value, props.matricula);
    emit("salva", entry.id);
    $q.notify({ type: "positive", message: "Foto salva na galeria!", position: "top", timeout: 2000 });
    descartar(); // volta para o preview ao vivo
  } catch {
    erroMsg.value = "Erro ao salvar foto. Tente novamente.";
  } finally {
    salvando.value = false;
  }
}

function descartar() {
  if (fotoDataUrl.value) {
    URL.revokeObjectURL(fotoDataUrl.value);
    fotoDataUrl.value = null;
  }
  fotoBlob.value = null;
  erroMsg.value  = null;
}

async function alternarCamera() {
  if (fotoDataUrl.value) return;
  faceMode.value = faceMode.value === "environment" ? "user" : "environment";
  pararStream();
  await iniciarStream();
}

function fechar() {
  descartar();
  pararStream();
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  async (aberto) => {
    if (aberto) {
      agora.value = new Date();
      tickId = window.setInterval(() => { agora.value = new Date(); }, 1000);
      await iniciarStream();
    } else {
      clearInterval(tickId);
      descartar();
      pararStream();
    }
  }
);

onUnmounted(() => {
  clearInterval(tickId);
  descartar();
  pararStream();
});
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.cc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: #000;
  display: flex;
  flex-direction: column;
  user-select: none;
  touch-action: none;
}

/* ── Header ──────────────────────────────────────────── */
.cc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: rgba(0,0,0,.6);
  color: #fff;
  position: relative;
  z-index: 2;
}
.cc-header__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .01em;
}
.cc-icon-btn {
  appearance: none;
  border: 0;
  background: rgba(255,255,255,.12);
  color: #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .15s;
}
.cc-icon-btn:active { background: rgba(255,255,255,.25); }
.cc-icon-btn--disabled { opacity: .35; pointer-events: none; }

/* ── Viewfinder ──────────────────────────────────────── */
.cc-viewfinder {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #111;
}
.cc-video,
.cc-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cc-timestamp {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: monospace;
  color: rgba(255,255,255,.9);
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
  pointer-events: none;
}

/* ── Footer ──────────────────────────────────────────── */
.cc-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24px 32px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  background: rgba(0,0,0,.6);
  gap: 20px;
}
.cc-footer__spacer { flex: 1; }

/* Capture button */
.cc-capture-btn {
  position: relative;
  width: 72px; height: 72px;
  background: none;
  border: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cc-capture-btn:disabled { opacity: .4; }
.cc-capture-btn__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #fff;
}
.cc-capture-btn__disc {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #fff;
  transition: transform .1s, background .1s;
}
.cc-capture-btn:active .cc-capture-btn__disc {
  transform: scale(.88);
  background: #ddd;
}

/* Action buttons (review mode) */
.cc-action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,.12);
  border: 1.5px solid rgba(255,255,255,.2);
  color: #fff;
  border-radius: 16px;
  padding: 14px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.cc-action-btn:active       { background: rgba(255,255,255,.2); }
.cc-action-btn:disabled     { opacity: .5; pointer-events: none; }
.cc-action-btn--confirm {
  background: rgba(122,18,37,.7);
  border-color: #c4213a;
}
.cc-action-btn--confirm:active { background: rgba(122,18,37,.9); }

/* ── Error ───────────────────────────────────────────── */
.cc-error {
  position: absolute;
  bottom: 140px;
  left: 16px; right: 16px;
  background: rgba(200,30,30,.88);
  color: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

/* ── Transition ──────────────────────────────────────── */
.cc-fade-enter-active, .cc-fade-leave-active { transition: opacity .22s; }
.cc-fade-enter-from,  .cc-fade-leave-to      { opacity: 0; }
</style>
