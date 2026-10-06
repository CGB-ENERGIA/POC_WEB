<template>
  <q-dialog v-model="isOpen" position="bottom" @hide="processando = false">
    <div class="cm-sheet">
      <input
        ref="inputEl"
        type="file"
        accept="image/*"
        capture="environment"
        class="cm-input"
        @change="onArquivo"
        @cancel="onCancelar"
      />

      <template v-if="processando">
        <q-spinner color="primary" size="36px" />
        <div class="cm-text">Preparando foto…</div>
      </template>
      <template v-else>
        <div class="cm-title">Tirar foto</div>
        <div v-if="erro" class="cm-erro">
          <q-icon name="mdi-alert-circle-outline" size="18px" />
          {{ erro }}
        </div>
        <button class="cm-btn" @click="abrir">
          <q-icon name="mdi-camera" size="22px" />
          Abrir câmera
        </button>
        <button class="cm-cancel" @click="isOpen = false">Cancelar</button>
      </template>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { abrirCameraNativa, fotoNativaParaBase64 } from "@/utils/native-camera";

/**
 * Abre a câmera nativa do celular (zoom, foco, flash, rotação e selfie do próprio
 * aparelho) e devolve a foto já em pé e reduzida via evento "captured".
 */
const isOpen = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "captured", base64: string): void }>();

const inputEl = ref<HTMLInputElement | null>(null);
const processando = ref(false);
const erro = ref("");

function abrir() {
  erro.value = "";
  abrirCameraNativa(inputEl.value);
}

// Ao abrir, já chama a câmera (o toque que abriu o modal ainda vale como gesto do usuário).
// Se o aparelho bloquear, o botão "Abrir câmera" continua na tela.
watch(isOpen, async (aberto) => {
  if (!aberto) return;
  erro.value = "";
  processando.value = false;
  await nextTick();
  abrir();
});

function onCancelar() {
  if (!processando.value) isOpen.value = false;
}

async function onArquivo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  processando.value = true;
  try {
    const base64 = await fotoNativaParaBase64(file);
    isOpen.value = false;
    emit("captured", base64);
  } catch {
    erro.value = "Não foi possível ler a foto. Tente novamente.";
  } finally {
    processando.value = false;
  }
}
</script>

<style scoped>
.cm-sheet {
  width: 100%;
  background: #fff;
  border-radius: 18px 18px 0 0;
  padding: 20px 20px max(20px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  text-align: center;
}
.cm-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.cm-title { font-size: 16px; font-weight: 700; color: #1c1917; }
.cm-text { font-size: 14px; color: #57534e; }
.cm-erro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #b91c1c;
}
.cm-btn {
  appearance: none;
  border: 0;
  height: 52px;
  border-radius: 14px;
  background: var(--brand, #7a1225);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.cm-btn:active { background: var(--brand-deep, #5c0e1c); }
.cm-cancel {
  appearance: none;
  border: 0;
  background: none;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  color: #57534e;
  cursor: pointer;
}
</style>
