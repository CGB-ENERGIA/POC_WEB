<template>
  <div class="field-label q-mt-md q-mb-sm">
    Evidências obrigatórias
    <span class="evid-count" :class="{ 'evid-count--ok': completas }">{{ preenchidas }}/3</span>
  </div>

  <div class="evid-grid">
    <div
      v-for="(slot, idx) in SLOTS"
      :key="idx"
      class="evid-slot"
      :class="{ 'evid-slot--filled': modelValue[idx] }"
      @click="abrirCamera(idx)"
    >
      <template v-if="modelValue[idx]">
        <img :src="modelValue[idx]!" class="evid-slot__img" alt="" />
        <div class="evid-slot__retake">
          <q-icon name="mdi-camera-retake" size="18px" color="white" />
        </div>
      </template>
      <div v-else class="evid-slot__placeholder">
        <q-spinner v-if="carregandoIdx === idx" color="primary" size="22px" />
        <q-icon v-else :name="slot.icon" size="24px" color="grey-5" />
      </div>
      <div class="evid-slot__badge" :class="{ 'evid-slot__badge--ok': modelValue[idx] }">
        {{ idx + 1 }}º
      </div>
      <div class="evid-slot__label">{{ slot.label }}</div>
    </div>
  </div>

  <CameraModal v-model="cameraAberta" @captured="onCaptured" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import CameraModal from "@/components/CameraModal.vue";
import { compressBase64 } from "@/utils/image";
import { getTrustedTime, ServerTimeError } from "@/utils/server-time";
import { stampAuditPhoto } from "@/utils/photo-stamp";

const SLOTS = [
  { icon: "mdi-account-group-outline", label: "Selfie com a equipe" },
  { icon: "mdi-truck-outline", label: "Foto da viatura (prefixo)" },
  { icon: "mdi-account-hard-hat-outline", label: "Colaboradores em atividade" },
] as const;

const props = defineProps<{
  modelValue: (string | null)[];
  equipe: string;
  observador: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: (string | null)[]): void }>();

const $q = useQuasar();
const cameraAberta = ref(false);
const carregandoIdx = ref<number | null>(null);
const idxAtivo = ref<number | null>(null);

const preenchidas = computed(() => props.modelValue.filter(Boolean).length);
const completas = computed(() => preenchidas.value >= 3);

function abrirCamera(idx: number) {
  if (!props.equipe.trim()) {
    $q.notify({ type: "warning", message: "Informe a equipe antes de registrar as evidências", position: "top" });
    return;
  }
  idxAtivo.value = idx;
  cameraAberta.value = true;
}

async function onCaptured(base64: string) {
  if (idxAtivo.value === null) return;
  const idx = idxAtivo.value;
  carregandoIdx.value = idx;
  try {
    const { date } = await getTrustedTime();
    const compressed = await compressBase64(base64);
    const carimbrada = await stampAuditPhoto(compressed, {
      time: date,
      observer: props.observador || "—",
      equipe: props.equipe.trim(),
    });
    const next = [...props.modelValue];
    next[idx] = carimbrada;
    emit("update:modelValue", next);
  } catch (err) {
    const message = err instanceof ServerTimeError ? err.message : "Erro ao processar foto";
    $q.notify({ type: "warning", message, position: "top", timeout: 4500 });
  } finally {
    carregandoIdx.value = null;
  }
}
</script>

<style scoped>
.evid-count {
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  margin-left: 6px;
}
.evid-count--ok { color: #16a34a; }

.evid-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.evid-slot {
  position: relative;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: #f8fafc;
  transition: border-color 0.15s;
}
.evid-slot--filled { border-style: solid; border-color: #16a34a; }

.evid-slot__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.evid-slot__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.evid-slot__retake {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.evid-slot:active .evid-slot__retake { opacity: 1; }

.evid-slot__badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.evid-slot__badge--ok { background: #16a34a; }

.evid-slot__label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  color: #fff;
  font-size: 9.5px;
  font-weight: 600;
  text-align: center;
  line-height: 1.25;
  padding: 10px 4px 5px;
}
.evid-slot--filled .evid-slot__label { opacity: 1; }
.evid-slot:not(.evid-slot--filled) .evid-slot__label {
  position: static;
  background: none;
  color: #64748b;
  padding: 6px 2px 0;
}
</style>
