<template>
  <q-page class="gl-page mobile-page">

    <!-- ── INFO BAR ───────────────────────────────────── -->
    <div class="gl-info-bar">
      <div class="gl-info-bar__item">
        <q-icon name="mdi-image-multiple" size="16px" class="gl-info-bar__icon" />
        <span>{{ galeria.total }} {{ galeria.total === 1 ? 'foto' : 'fotos' }}</span>
      </div>
      <div class="gl-info-bar__item">
        <q-icon name="mdi-database-outline" size="16px" class="gl-info-bar__icon" />
        <span>{{ tamanhoFormatado }}</span>
      </div>
      <div v-if="galeria.sincronizando" class="gl-info-bar__item gl-info-bar__sync">
        <q-spinner size="14px" />
        <span>Sincronizando…</span>
      </div>
      <q-space />
      <button v-if="galeria.total > 0" class="gl-btn-cam" @click="cameraAberta = true">
        <q-icon name="mdi-camera-plus-outline" size="18px" />
        Nova foto
      </button>
    </div>

    <!-- ── LOADING ────────────────────────────────────── -->
    <div v-if="galeria.carregando" class="gl-empty">
      <q-spinner size="40px" color="primary" />
      <p>Carregando fotos…</p>
    </div>

    <!-- ── EMPTY STATE ────────────────────────────────── -->
    <div v-else-if="galeria.total === 0" class="gl-empty">
      <div class="gl-empty__icon">
        <q-icon name="mdi-camera-off-outline" size="56px" color="grey-5" />
      </div>
      <p class="gl-empty__title">Nenhuma foto ainda</p>
      <p class="gl-empty__sub">Use a câmera para registrar ocorrências com timestamp automático</p>
      <button class="gl-empty__btn" @click="cameraAberta = true">
        <q-icon name="mdi-camera-plus" size="20px" />
        Abrir câmera
      </button>
    </div>

    <!-- ── GRUPOS POR DATA ────────────────────────────── -->
    <div v-else class="gl-groups">
      <div v-for="[data, fotos] in galeria.porData" :key="data" class="gl-group">
        <div class="gl-group__header">
          <span class="gl-group__date">{{ formatarData(data) }}</span>
          <span class="gl-group__count">{{ fotos.length }}</span>
        </div>

        <div class="gl-grid">
          <div
            v-for="foto in fotos"
            :key="foto.id"
            class="gl-thumb-wrap"
          >
            <img
              :src="getUrl(foto.id, foto.blob, foto.cloudUrl)"
              class="gl-thumb"
              alt="Foto"
              loading="lazy"
              @click="abrirLightbox(foto)"
            />
            <div class="gl-thumb__time">{{ formatarHora(foto.dataHora) }}</div>
            <button class="gl-thumb__del" @click.stop="confirmarExclusao(foto.id)">
              <q-icon name="mdi-trash-can-outline" size="16px" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── LIGHTBOX ───────────────────────────────────── -->
    <teleport to="body">
      <transition name="lb-fade">
        <div v-if="lightboxFoto" class="lb-overlay" @click.self="fecharLightbox">
          <div class="lb-header">
            <button class="lb-icon-btn" @click="fecharLightbox">
              <q-icon name="mdi-close" size="24px" />
            </button>
            <div class="lb-header__info">
              <div class="lb-header__date">{{ formatarDataCompleta(lightboxFoto.dataHora) }}</div>
              <div class="lb-header__mat">{{ lightboxFoto.matricula }}</div>
            </div>
            <div class="lb-header__actions">
              <button class="lb-icon-btn" @click="baixarFoto(lightboxFoto)">
                <q-icon name="mdi-download" size="22px" />
              </button>
              <button class="lb-icon-btn lb-icon-btn--danger" @click="excluirDoLightbox(lightboxFoto.id)">
                <q-icon name="mdi-trash-can-outline" size="22px" />
              </button>
            </div>
          </div>

          <div class="lb-img-wrap">
            <img :src="getUrl(lightboxFoto.id, lightboxFoto.blob, lightboxFoto.cloudUrl)" class="lb-img" alt="Foto" />
          </div>

          <!-- Navegar entre fotos -->
          <button v-if="lightboxIdx > 0" class="lb-nav lb-nav--prev" @click="lightboxIdx--">
            <q-icon name="mdi-chevron-left" size="32px" />
          </button>
          <button v-if="lightboxIdx < fotosFlat.length - 1" class="lb-nav lb-nav--next" @click="lightboxIdx++">
            <q-icon name="mdi-chevron-right" size="32px" />
          </button>

          <div class="lb-counter">{{ lightboxIdx + 1 }} / {{ fotosFlat.length }}</div>
        </div>
      </transition>
    </teleport>

    <!-- ── CÂMERA MODAL ───────────────────────────────── -->
    <CameraCapture
      v-model="cameraAberta"
      :matricula="session.matricula"
      @salva="onFotoSalva"
    />

    <div style="height: 24px" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useGaleriaStore, type FotoEntry } from "@/stores/galeria";
import { useSessionStore } from "@/stores/session";
import { useQuasar } from "quasar";
import CameraCapture from "@/components/CameraCapture.vue";

const galeria = useGaleriaStore();
const session = useSessionStore();
const $q      = useQuasar();

const cameraAberta = ref(false);

onMounted(async () => {
  await galeria.carregar();
  // Sincroniza com Supabase em background após carregar o cache local
  if (session.matricula) galeria.sincronizarNuvem(session.matricula);
});

// ── Object URL pool ──────────────────────────────────
const urlPool = new Map<string, string>();

function getUrl(id: string, blob: Blob | undefined, cloudUrl: string | null): string {
  if (blob) {
    if (!urlPool.has(id)) urlPool.set(id, URL.createObjectURL(blob));
    return urlPool.get(id)!;
  }
  return cloudUrl ?? "";
}

function revokeAll() {
  urlPool.forEach((url) => URL.revokeObjectURL(url));
  urlPool.clear();
}

function revokeOne(id: string) {
  const url = urlPool.get(id);
  if (url) { URL.revokeObjectURL(url); urlPool.delete(id); }
}

onBeforeUnmount(revokeAll);

// Revogar URL quando foto é excluída
watch(() => galeria.fotos.length, () => {
  // Limpar URLs de fotos que não existem mais
  const ids = new Set(galeria.fotos.map(f => f.id));
  urlPool.forEach((_, id) => { if (!ids.has(id)) revokeOne(id); });
});

// ── Exclusão ─────────────────────────────────────────
function confirmarExclusao(id: string) {
  $q.dialog({
    title: "Excluir foto",
    message: "Essa ação não pode ser desfeita.",
    cancel: { label: "Cancelar", flat: true, color: "grey-7" },
    ok:     { label: "Excluir",  color: "negative", unelevated: true },
  }).onOk(async () => {
    if (lightboxFoto.value?.id === id) fecharLightbox();
    revokeOne(id);
    await galeria.excluirFoto(id);
    $q.notify({ type: "positive", message: "Foto excluída.", position: "top", timeout: 1500 });
  });
}

// ── Lightbox ─────────────────────────────────────────
const fotosFlat    = computed(() => galeria.fotos);
const lightboxIdx  = ref(-1);
const lightboxFoto = computed<FotoEntry | null>(() => {
  if (lightboxIdx.value < 0) return null;
  return fotosFlat.value[lightboxIdx.value] ?? null;
});

function abrirLightbox(foto: FotoEntry) {
  const idx = fotosFlat.value.findIndex(f => f.id === foto.id);
  if (idx !== -1) lightboxIdx.value = idx;
}

function fecharLightbox() {
  lightboxIdx.value = -1;
}

watch(lightboxFoto, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
});

async function excluirDoLightbox(id: string) {
  $q.dialog({
    title: "Excluir foto",
    message: "Essa ação não pode ser desfeita.",
    cancel: { label: "Cancelar", flat: true, color: "grey-7" },
    ok:     { label: "Excluir",  color: "negative", unelevated: true },
  }).onOk(async () => {
    fecharLightbox();
    revokeOne(id);
    await galeria.excluirFoto(id);
    $q.notify({ type: "positive", message: "Foto excluída.", position: "top", timeout: 1500 });
  });
}

function baixarFoto(foto: FotoEntry) {
  const url = getUrl(foto.id, foto.blob, foto.cloudUrl);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `cgb-foto-${foto.dataHora.replace(/[:.]/g, "-")}.jpg`;
  a.click();
}

// ── Câmera ───────────────────────────────────────────
function onFotoSalva(_id: string) {
  // A store já tem a nova foto; o watch de fotos.length vai limpar URLs desnecessários
}

// ── Formatadores ─────────────────────────────────────
const hoje   = new Date().toISOString().slice(0, 10);
const ontem  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

function formatarData(isoDate: string): string {
  if (isoDate === hoje)  return "Hoje";
  if (isoDate === ontem) return "Ontem";
  const [y, m, d] = isoDate.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function formatarHora(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarDataCompleta(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const tamanhoFormatado = computed(() => {
  const bytes = galeria.tamanhoTotalBytes;
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────── */
.gl-page { padding: 0; }

/* ── Info bar ────────────────────────────────────────── */
.gl-info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--gl-surface, #fff);
  border-bottom: 1px solid rgba(15,23,42,.07);
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.gl-info-bar__item { display: flex; align-items: center; gap: 5px; }
.gl-info-bar__sync { font-size: 11px; color: #64748b; gap: 4px; }
.gl-info-bar__icon { opacity: .7; }

.gl-btn-cam {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--brand);
  color: #fff;
  border: 0;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.gl-btn-cam:active { background: var(--brand-deep); }

/* ── Empty ───────────────────────────────────────────── */
.gl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
  gap: 10px;
}
.gl-empty__icon { margin-bottom: 4px; }
.gl-empty__title { font-size: 17px; font-weight: 700; color: #334155; }
.gl-empty__sub   { font-size: 13px; color: #94a3b8; line-height: 1.5; max-width: 260px; }
.gl-empty__btn {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  background: var(--brand); color: #fff;
  border: 0; border-radius: 99px;
  font-size: 14px; font-weight: 700;
  cursor: pointer;
}

/* ── Groups ──────────────────────────────────────────── */
.gl-groups { padding: 0 0 16px; }

.gl-group { padding: 0 16px; margin-top: 20px; }
.gl-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.gl-group__date {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: #94a3b8;
}
.gl-group__count {
  font-size: 12px;
  font-weight: 700;
  background: rgba(var(--brand-rgb),.1);
  color: var(--brand);
  padding: 2px 9px;
  border-radius: 99px;
}

/* ── Photo grid ──────────────────────────────────────── */
.gl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.gl-thumb-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background: #e2e8f0;
  cursor: pointer;
}
.gl-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .2s;
}
.gl-thumb-wrap:active .gl-thumb { transform: scale(.96); }

.gl-thumb__time {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 3px 5px;
  background: rgba(0,0,0,.55);
  color: #fff;
  font-size: 9.5px;
  font-weight: 600;
  font-family: monospace;
  text-align: center;
}
.gl-thumb__del {
  position: absolute;
  top: 4px; right: 4px;
  width: 26px; height: 26px;
  background: rgba(0,0,0,.55);
  border: 0; border-radius: 50%;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity .15s;
}
.gl-thumb-wrap:hover .gl-thumb__del,
.gl-thumb-wrap:focus-within .gl-thumb__del { opacity: 1; }

/* tablet: 4 colunas */
@media (min-width: 768px) {
  .gl-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
}

/* ── Lightbox ────────────────────────────────────────── */
.lb-overlay {
  position: fixed; inset: 0; z-index: 9500;
  background: rgba(0,0,0,.95);
  display: flex; flex-direction: column;
}
.lb-header {
  display: flex; align-items: center;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  gap: 10px;
  background: rgba(0,0,0,.4);
  color: #fff;
  flex-shrink: 0;
}
.lb-header__info { flex: 1; min-width: 0; }
.lb-header__date { font-size: 13px; font-weight: 600; }
.lb-header__mat  { font-size: 11px; opacity: .7; }
.lb-header__actions { display: flex; gap: 4px; }

.lb-icon-btn {
  appearance: none; border: 0;
  background: rgba(255,255,255,.12);
  color: #fff; border-radius: 50%;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.lb-icon-btn:active { background: rgba(255,255,255,.25); }
.lb-icon-btn--danger { background: rgba(200,30,30,.4); }
.lb-icon-btn--danger:active { background: rgba(200,30,30,.7); }

.lb-img-wrap {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.lb-img {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
  display: block;
}

.lb-nav {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,.15);
  border: 0; color: #fff; border-radius: 50%;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.lb-nav--prev { left: 12px; }
.lb-nav--next { right: 12px; }
.lb-nav:active { background: rgba(255,255,255,.3); }

.lb-counter {
  position: absolute;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,.5);
  color: #fff; border-radius: 99px;
  padding: 4px 14px; font-size: 12px; font-weight: 700;
}

.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity .2s; }
.lb-fade-enter-from,  .lb-fade-leave-to      { opacity: 0; }

/* ── Dark mode ───────────────────────────────────────── */
:global(body.body--dark) {
  .gl-info-bar  { background: #1e293b; border-color: rgba(148,163,184,.1); color: #94a3b8; }
  .gl-empty__title { color: #e2e8f0; }
  .gl-thumb-wrap { background: #1e293b; }
}
</style>
