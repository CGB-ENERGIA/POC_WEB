<template>
  <div class="field-label q-mt-md q-mb-sm">
    Outras fotos (opcional)
    <span class="fg-count" :class="{ 'fg-count--max': modelValue.length >= MAX_FOTOS }">{{ modelValue.length }}/{{ MAX_FOTOS }}</span>
  </div>

  <div class="fg-grid">
    <div v-for="(foto, i) in modelValue" :key="i" class="fg-thumb">
      <img :src="foto" alt="" />
      <button class="fg-thumb__remove" @click.stop="remover(i)">
        <q-icon name="mdi-close" size="13px" color="white" />
      </button>
    </div>

    <div
      v-if="modelValue.length < MAX_FOTOS"
      class="fg-add"
      :class="{ 'fg-add--loading': carregando }"
      @click="!carregando && abrirSheet()"
    >
      <q-spinner v-if="carregando" color="primary" size="20px" />
      <q-icon v-else name="mdi-camera-plus-outline" size="22px" color="grey-5" />
    </div>
  </div>

  <!-- Action sheet -->
  <q-dialog v-model="sheetAberto" position="bottom">
    <div class="foto-sheet">
      <div class="foto-sheet__handle" />
      <div class="foto-sheet__title">
        <q-icon name="mdi-image-multiple-outline" size="18px" class="q-mr-sm" />
        Outras fotos (opcional)
      </div>
      <div class="foto-sheet__actions">
        <button class="foto-sheet__btn" @click="escolher('camera')">
          <div class="foto-sheet__btn-icon">
            <q-icon name="mdi-camera" size="26px" />
          </div>
          <span class="foto-sheet__btn-label">Tirar foto</span>
        </button>
        <button class="foto-sheet__btn" @click="escolher('galeria')">
          <div class="foto-sheet__btn-icon foto-sheet__btn-icon--gallery">
            <q-icon name="mdi-image-multiple-outline" size="26px" />
          </div>
          <span class="foto-sheet__btn-label">Da galeria</span>
        </button>
      </div>
    </div>
  </q-dialog>

  <CameraModal v-model="cameraAberta" @captured="onCaptured" />
  <GaleriaPicker v-model="galeriaAberta" :matricula="matricula ?? ''" @selected="onGaleriaImportada" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import CameraModal from "@/components/CameraModal.vue";
import GaleriaPicker from "@/components/GaleriaPicker.vue";
import { getTrustedTime, ServerTimeError } from "@/utils/server-time";
import { stampAuditPhoto } from "@/utils/photo-stamp";

const MAX_FOTOS = 5;

const props = defineProps<{
  modelValue: string[];
  equipe: string;
  observador: string;
  matricula?: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();

const $q = useQuasar();
const cameraAberta = ref(false);
const galeriaAberta = ref(false);
const sheetAberto = ref(false);
const carregando = ref(false);

function abrirSheet() {
  if (!props.equipe.trim()) {
    $q.notify({ type: "warning", message: "Informe a equipe antes de adicionar fotos", position: "top" });
    return;
  }
  sheetAberto.value = true;
}

function escolher(opcao: "camera" | "galeria") {
  sheetAberto.value = false;
  if (opcao === "camera") cameraAberta.value = true;
  else galeriaAberta.value = true;
}

async function processarFoto(base64: string) {
  carregando.value = true;
  try {
    const { date } = await getTrustedTime();
    const carimbrada = await stampAuditPhoto(base64, {
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

async function onCaptured(base64: string) {
  await processarFoto(base64);
}

async function onGaleriaImportada(blob: Blob) {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  await processarFoto(base64);
}

function remover(idx: number) {
  const next = [...props.modelValue];
  next.splice(idx, 1);
  emit("update:modelValue", next);
}
</script>

<style scoped>
.fg-count {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-left: 6px;
}
.fg-count--max { color: #f59e0b; }

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

/* ── Action sheet ── */
.foto-sheet {
  background: #1e2433;
  border-radius: 20px 20px 0 0;
  padding: 0 16px 32px;
  width: 100%;
}

.foto-sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
  margin: 12px auto 20px;
}

.foto-sheet__title {
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.55);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 20px;
}

.foto-sheet__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.foto-sheet__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  color: #fff;
}
.foto-sheet__btn:active {
  background: rgba(255,255,255,0.12);
  transform: scale(0.97);
}

.foto-sheet__btn-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.foto-sheet__btn-icon--gallery {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
}

.foto-sheet__btn-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}
</style>
