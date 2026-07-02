<template>
  <q-dialog v-model="isOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <div class="camera-root">
      <video ref="videoRef" autoplay playsinline muted class="camera-video" />

      <!-- Erro de acesso -->
      <div v-if="erro" class="camera-estado">
        <q-icon name="mdi-camera-off" size="52px" color="grey-4" />
        <div class="text-body1 text-white q-mt-md text-center q-px-lg">{{ erro }}</div>
        <q-btn outline color="white" no-caps label="Fechar" class="q-mt-xl" @click="isOpen = false" />
      </div>

      <!-- Aguardando stream -->
      <div v-else-if="!pronto" class="camera-estado">
        <q-spinner color="white" size="42px" />
        <div class="text-caption text-white q-mt-md">Iniciando câmera…</div>
      </div>

      <!-- Controles -->
      <div class="camera-controls">
        <q-btn flat round icon="mdi-close" color="white" size="lg" @click="isOpen = false" />
        <button class="shutter-btn" :disabled="!pronto" @click="capturar">
          <div class="shutter-btn__ring" />
          <div class="shutter-btn__inner" />
        </button>
        <q-btn
          flat round
          icon="mdi-camera-flip-outline"
          color="white"
          size="lg"
          :disable="!pronto || virandoCamera"
          @click="virarCamera"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";

const isOpen = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "captured", base64: string): void }>();

const videoRef = ref<HTMLVideoElement | null>(null);
const pronto = ref(false);
const erro = ref("");
const virandoCamera = ref(false);
const facingMode = ref<"environment" | "user">("environment");
let stream: MediaStream | null = null;

watch(isOpen, async (val) => {
  if (val) {
    erro.value = "";
    pronto.value = false;
    facingMode.value = "environment";
    await nextTick();
    await iniciarCamera();
  } else {
    pararCamera();
  }
});

async function iniciarCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode.value }, width: { ideal: 1920 } },
      audio: false,
    });
    const video = videoRef.value;
    if (!video) return;
    video.srcObject = stream;
    video.onloadedmetadata = () => { pronto.value = true; };
  } catch {
    erro.value = "Não foi possível acessar a câmera. Verifique as permissões do navegador.";
  }
}

function pararCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  pronto.value = false;
}

async function virarCamera() {
  virandoCamera.value = true;
  facingMode.value = facingMode.value === "environment" ? "user" : "environment";
  pararCamera();
  await nextTick();
  await iniciarCamera();
  virandoCamera.value = false;
}

function capturar() {
  const video = videoRef.value;
  if (!video || !pronto.value) return;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  emit("captured", canvas.toDataURL("image/jpeg", 0.95));
  isOpen.value = false;
}

onUnmounted(pararCamera);
</script>

<style scoped>
.camera-root {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.camera-video {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-estado {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.82);
}

.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px max(env(safe-area-inset-bottom), 20px);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
}

.shutter-btn {
  position: relative;
  width: 72px;
  height: 72px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.shutter-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.shutter-btn__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.9);
}

.shutter-btn__inner {
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.1s ease;
}

.shutter-btn:not(:disabled):active .shutter-btn__inner {
  transform: scale(0.86);
}
</style>
