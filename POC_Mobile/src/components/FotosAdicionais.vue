<template>
  <div class="field-label q-mt-md q-mb-sm">Outras fotos (opcional)</div>

  <div class="fg-grid">
    <div v-for="(foto, i) in modelValue" :key="i" class="fg-thumb">
      <img :src="foto" alt="" />
      <button class="fg-thumb__remove" @click.stop="remover(i)">
        <q-icon name="mdi-close" size="13px" color="white" />
      </button>
    </div>

    <div class="fg-add" :class="{ 'fg-add--loading': carregando }" @click="!carregando && abrirCamera()">
      <q-spinner v-if="carregando" color="primary" size="20px" />
      <q-icon v-else name="mdi-camera-plus-outline" size="22px" color="grey-5" />
    </div>
  </div>

  <CameraModal v-model="cameraAberta" @captured="onCaptured" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import CameraModal from "@/components/CameraModal.vue";
import { compressBase64 } from "@/utils/image";
import { getTrustedTime, ServerTimeError } from "@/utils/server-time";
import { stampAuditPhoto } from "@/utils/photo-stamp";

const props = defineProps<{
  modelValue: string[];
  equipe: string;
  observador: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();

const $q = useQuasar();
const cameraAberta = ref(false);
const carregando = ref(false);

function abrirCamera() {
  if (!props.equipe.trim()) {
    $q.notify({ type: "warning", message: "Informe a equipe antes de tirar a foto", position: "top" });
    return;
  }
  cameraAberta.value = true;
}

async function onCaptured(base64: string) {
  carregando.value = true;
  try {
    const { date } = await getTrustedTime();
    const compressed = await compressBase64(base64);
    const carimbrada = await stampAuditPhoto(compressed, {
      time: date,
      observer: props.observador || "—",
      equipe: props.equipe.trim(),
    });
    emit("update:modelValue", [...props.modelValue, carimbrada]);
  } catch (err) {
    const message = err instanceof ServerTimeError ? err.message : "Erro ao processar foto";
    $q.notify({ type: "warning", message, position: "top", timeout: 4500 });
  } finally {
    carregando.value = false;
  }
}

function remover(idx: number) {
  const next = [...props.modelValue];
  next.splice(idx, 1);
  emit("update:modelValue", next);
}
</script>

<style scoped>
.fg-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fg-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.fg-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fg-thumb__remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.fg-add {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 1.5px dashed #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8fafc;
  transition: border-color 0.15s;
}
.fg-add:active { border-color: var(--q-primary); }
.fg-add--loading { border-color: var(--q-primary); opacity: 0.7; cursor: wait; }
</style>
