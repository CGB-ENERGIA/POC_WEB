<template>
  <q-dialog v-model="isOpen" maximized transition-show="slide-up" transition-hide="slide-down">
    <div class="gp-root">

      <!-- Header -->
      <div class="gp-header">
        <q-btn flat round dense icon="mdi-close" color="white" @click="isOpen = false" />
        <span class="gp-header__title">Importar da galeria</span>
        <div style="width:40px" />
      </div>

      <!-- Loading -->
      <div v-if="galeria.carregando" class="gp-center">
        <q-spinner size="40px" color="white" />
        <div class="gp-center__txt">Carregando galeria…</div>
      </div>

      <!-- Vazia -->
      <div v-else-if="galeria.total === 0" class="gp-center">
        <q-icon name="mdi-image-off-outline" size="56px" color="grey-5" />
        <div class="gp-center__txt">Galeria vazia</div>
        <div class="gp-center__sub">Tire fotos com a câmera do sistema primeiro</div>
      </div>

      <!-- Grupos por data -->
      <div v-else class="gp-scroll">
        <div v-for="[data, fotos] in galeria.porData" :key="data" class="gp-group">
          <div class="gp-group__date">{{ formatarData(data) }}</div>
          <div class="gp-grid">
            <div
              v-for="foto in fotos"
              :key="foto.id"
              class="gp-thumb"
              :class="{ 'gp-thumb--sel': selecionada === foto.id }"
              @click="selecionar(foto)"
            >
              <img :src="getUrl(foto.id, foto.blob, foto.cloudUrl)" class="gp-thumb__img" alt="" loading="lazy" />
              <div class="gp-thumb__time">{{ formatarHora(foto.dataHora) }}</div>
              <div v-if="selecionada === foto.id" class="gp-thumb__check">
                <q-icon name="mdi-check-circle" size="26px" color="white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmar seleção -->
      <div v-if="selecionada" class="gp-footer">
        <q-btn
          unelevated no-caps
          color="primary"
          class="gp-footer__btn"
          label="Usar esta foto"
          icon="mdi-check"
          :loading="processando"
          @click="confirmar"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useGaleriaStore, type FotoEntry } from "@/stores/galeria";

const props = defineProps<{ matricula?: string }>();
const emit = defineEmits<{
  (e: "selected", blob: Blob): void;
}>();

const isOpen    = defineModel<boolean>({ required: true });
const galeria   = useGaleriaStore();
const selecionada  = ref<string | null>(null);
const fotoSelecionada = ref<FotoEntry | null>(null);
const processando = ref(false);

onMounted(() => galeria.carregar());

// Ao abrir o picker, sincroniza fotos da nuvem (para ver fotos de outros dispositivos)
watch(isOpen, (aberta) => {
  if (aberta && props.matricula) {
    galeria.sincronizarNuvem(props.matricula);
  }
});

// ── Object URL pool ─────────────────────────────────
const urlPool = new Map<string, string>();
function getUrl(id: string, blob: Blob | undefined, cloudUrl: string | null): string {
  if (blob) {
    if (!urlPool.has(id)) urlPool.set(id, URL.createObjectURL(blob));
    return urlPool.get(id)!;
  }
  return cloudUrl ?? "";
}
onBeforeUnmount(() => { urlPool.forEach(u => URL.revokeObjectURL(u)); urlPool.clear(); });

function selecionar(foto: FotoEntry) {
  selecionada.value   = foto.id;
  fotoSelecionada.value = foto;
}

async function confirmar() {
  if (!fotoSelecionada.value) return;
  processando.value = true;
  try {
    let blob = fotoSelecionada.value.blob;
    if (!blob && fotoSelecionada.value.cloudUrl) {
      const resp = await fetch(fotoSelecionada.value.cloudUrl);
      blob = await resp.blob();
    }
    if (!blob) return;
    emit("selected", blob);
    isOpen.value = false;
    selecionada.value    = null;
    fotoSelecionada.value = null;
  } finally {
    processando.value = false;
  }
}

// ── Formatadores ─────────────────────────────────────
const hoje  = new Date().toISOString().slice(0, 10);
const ontem = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

function formatarData(d: string): string {
  if (d === hoje)  return "Hoje";
  if (d === ontem) return "Ontem";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day))
    .toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}
function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
</script>

<style scoped>
.gp-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #fff;
}

.gp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top));
  background: #7a1225;
  flex-shrink: 0;
}
.gp-header__title { font-size: 16px; font-weight: 700; }

.gp-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  text-align: center;
}
.gp-center__txt { font-size: 16px; font-weight: 600; color: #94a3b8; }
.gp-center__sub { font-size: 13px; color: #475569; }

.gp-scroll { flex: 1; overflow-y: auto; }

.gp-group { padding: 16px 16px 0; }
.gp-group__date {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 8px;
}

.gp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
@media (min-width: 600px) {
  .gp-grid { grid-template-columns: repeat(4, 1fr); }
}

.gp-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2.5px solid transparent;
  transition: border-color .15s;
}
.gp-thumb--sel { border-color: #c4213a; }
.gp-thumb__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gp-thumb__time {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 2px 4px;
  background: rgba(0,0,0,.55);
  color: #fff; font-size: 9px; font-weight: 600;
  font-family: monospace;
  text-align: center;
}
.gp-thumb__check {
  position: absolute; inset: 0;
  background: rgba(122,18,37,.45);
  display: flex; align-items: center; justify-content: center;
}

.gp-footer {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: rgba(0,0,0,.6);
  flex-shrink: 0;
}
.gp-footer__btn { width: 100%; height: 48px; font-size: 15px; font-weight: 700; border-radius: 12px; }
</style>
