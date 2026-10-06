<template>
  <q-dialog v-model="isOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <div class="camera-root">
      <CameraViewfinder
        ref="vf"
        class="camera-vf"
        :ativo="isOpen"
        @pronto="pronto = $event"
        @erro="erro = $event ?? ''"
      />

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
        <button class="shutter-btn" :disabled="!pronto" aria-label="Tirar foto" @click="capturar">
          <div class="shutter-btn__ring" />
          <div class="shutter-btn__inner" />
        </button>
        <q-btn
          flat round
          icon="mdi-camera-flip-outline"
          color="white"
          size="lg"
          aria-label="Virar câmera"
          :disable="!pronto || virandoCamera"
          @click="virarCamera"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { compressBase64 } from "@/utils/image";
import CameraViewfinder from "@/components/CameraViewfinder.vue";

const isOpen = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "captured", base64: string): void }>();

const vf = ref<InstanceType<typeof CameraViewfinder> | null>(null);
const pronto = ref(false);
const erro = ref("");
const virandoCamera = ref(false);

async function virarCamera() {
  virandoCamera.value = true;
  try { await vf.value?.virar(); } finally { virandoCamera.value = false; }
}

async function capturar() {
  if (!pronto.value || !vf.value) return;
  let raw: string;
  try {
    raw = vf.value.capturar();
  } catch {
    erro.value = "Não foi possível tirar a foto. Tente novamente.";
    return;
  }
  isOpen.value = false;
  const compressed = await compressBase64(raw);
  emit("captured", compressed);
}
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

.camera-vf {
  flex: 1;
  min-height: 0;
}

.camera-side {
  display: flex;
  align-items: center;
  gap: 4px;
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
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px max(env(safe-area-inset-bottom), 20px);
  background: #000;
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
