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

      <template v-if="!modoSelecao">
        <button v-if="galeria.total > 0" class="gl-btn-sel" @click="entrarModoSelecao">
          <q-icon name="mdi-checkbox-multiple-outline" size="17px" />
          Selecionar
        </button>
        <button v-if="galeria.total > 0" class="gl-btn-cam" @click="cameraAberta = true">
          <q-icon name="mdi-camera-plus-outline" size="18px" />
          Nova foto
        </button>
      </template>
      <button v-else class="gl-btn-cancel" @click="sairModoSelecao">
        Cancelar
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
          <div class="gl-group__header-right">
            <button
              v-if="modoSelecao"
              class="gl-group__sel-all"
              @click="toggleGrupo(fotos)"
            >
              {{ grupoTodoSelecionado(fotos) ? 'Desmarcar' : 'Selecionar tudo' }}
            </button>
            <span class="gl-group__count">{{ fotos.length }}</span>
          </div>
        </div>

        <div class="gl-grid">
          <div
            v-for="foto in fotos"
            :key="foto.id"
            class="gl-thumb-wrap"
            :class="{ 'gl-thumb-wrap--selected': selecionadas.has(foto.id) }"
            @click="modoSelecao ? toggleSelecao(foto.id) : abrirLightbox(foto)"
          >
            <img
              :src="getUrl(foto.id, foto.blob, foto.cloudUrl)"
              class="gl-thumb"
              alt="Foto"
              loading="lazy"
            />
            <div class="gl-thumb__time">{{ formatarHora(foto.dataHora) }}</div>

            <!-- Botão lixeira individual (fora do modo seleção) -->
            <button
              v-if="!modoSelecao"
              class="gl-thumb__del"
              @click.stop="confirmarExclusao(foto.id)"
            >
              <q-icon name="mdi-trash-can-outline" size="15px" />
            </button>

            <!-- Indicador de seleção -->
            <div v-if="modoSelecao" class="gl-thumb__check">
              <q-icon
                :name="selecionadas.has(foto.id) ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
                size="22px"
                color="white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── BARRA DE SELEÇÃO ──────────────────────────── -->
    <transition name="sel-bar">
      <div v-if="modoSelecao" class="gl-sel-bar">
        <span class="gl-sel-bar__count">
          {{ selecionadas.size }} selecionada{{ selecionadas.size !== 1 ? 's' : '' }}
        </span>
        <button class="gl-sel-bar__btn gl-sel-bar__btn--all" @click="toggleTodas">
          {{ todasSelecionadas ? 'Desmarcar tudo' : 'Selecionar tudo' }}
        </button>
        <button
          class="gl-sel-bar__btn gl-sel-bar__btn--del"
          :disabled="selecionadas.size === 0"
          @click="confirmarExclusaoLote"
        >
          <q-icon name="mdi-trash-can-outline" size="16px" />
          Excluir
        </button>
      </div>
    </transition>

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
              <button class="lb-icon-btn lb-icon-btn--danger" @click="pedirConfirmacaoLightbox">
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

          <!-- Confirmação inline (z-index acima do lightbox) -->
          <transition name="lb-confirm-fade">
            <div v-if="confirmandoExclusaoLightbox" class="lb-confirm">
              <div class="lb-confirm__box">
                <p class="lb-confirm__title">Excluir esta foto?</p>
                <p class="lb-confirm__sub">Essa ação não pode ser desfeita.</p>
                <div class="lb-confirm__btns">
                  <button class="lb-confirm__btn lb-confirm__btn--cancel" @click="confirmandoExclusaoLightbox = false">
                    Cancelar
                  </button>
                  <button class="lb-confirm__btn lb-confirm__btn--ok" @click="executarExclusaoLightbox">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

    <!-- ── CÂMERA MODAL ───────────────────────────────── -->
    <CameraCapture
      v-model="cameraAberta"
      :matricula="session.matricula"
      @salva="onFotoSalva"
    />

    <div style="height: 80px" />
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
  if (!session.matricula) return;
  await galeria.carregar(session.matricula);
  galeria.sincronizarNuvem(session.matricula);
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

watch(() => galeria.fotos.length, () => {
  const ids = new Set(galeria.fotos.map(f => f.id));
  urlPool.forEach((_, id) => { if (!ids.has(id)) revokeOne(id); });
});

// ── Exclusão individual (thumbnail) ──────────────────
function confirmarExclusao(id: string) {
  $q.dialog({
    title: "Excluir foto",
    message: "Essa ação não pode ser desfeita.",
    cancel: { label: "Cancelar", flat: true, color: "grey-7" },
    ok:     { label: "Excluir",  color: "negative", unelevated: true },
  }).onOk(async () => {
    revokeOne(id);
    await galeria.excluirFoto(id);
    $q.notify({ type: "positive", message: "Foto excluída.", position: "top", timeout: 1500 });
  });
}

// ── Modo de seleção em lote ───────────────────────────
const modoSelecao  = ref(false);
const selecionadas = ref(new Set<string>());

const todasSelecionadas = computed(
  () => galeria.fotos.length > 0 && selecionadas.value.size === galeria.fotos.length
);

function entrarModoSelecao() {
  modoSelecao.value = true;
  selecionadas.value = new Set();
}

function sairModoSelecao() {
  modoSelecao.value = false;
  selecionadas.value = new Set();
}

function toggleSelecao(id: string) {
  const s = new Set(selecionadas.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  selecionadas.value = s;
}

function toggleTodas() {
  if (todasSelecionadas.value) {
    selecionadas.value = new Set();
  } else {
    selecionadas.value = new Set(galeria.fotos.map(f => f.id));
  }
}

function grupoTodoSelecionado(fotos: FotoEntry[]): boolean {
  return fotos.every(f => selecionadas.value.has(f.id));
}

function toggleGrupo(fotos: FotoEntry[]) {
  const s = new Set(selecionadas.value);
  if (grupoTodoSelecionado(fotos)) {
    fotos.forEach(f => s.delete(f.id));
  } else {
    fotos.forEach(f => s.add(f.id));
  }
  selecionadas.value = s;
}

function confirmarExclusaoLote() {
  if (selecionadas.value.size === 0) return;
  const qtd = selecionadas.value.size;
  $q.dialog({
    title: `Excluir ${qtd} foto${qtd !== 1 ? "s" : ""}`,
    message: "Essa ação não pode ser desfeita.",
    cancel: { label: "Cancelar", flat: true, color: "grey-7" },
    ok:     { label: `Excluir ${qtd}`,  color: "negative", unelevated: true },
  }).onOk(async () => {
    const ids = [...selecionadas.value];
    sairModoSelecao();
    for (const id of ids) {
      revokeOne(id);
      await galeria.excluirFoto(id);
    }
    $q.notify({ type: "positive", message: `${ids.length} foto${ids.length !== 1 ? "s" : ""} excluída${ids.length !== 1 ? "s" : ""}.`, position: "top", timeout: 2000 });
  });
}

// ── Lightbox ─────────────────────────────────────────
const fotosFlat    = computed(() => galeria.fotos);
const lightboxIdx  = ref(-1);
const lightboxFoto = computed<FotoEntry | null>(() => {
  if (lightboxIdx.value < 0) return null;
  return fotosFlat.value[lightboxIdx.value] ?? null;
});

const confirmandoExclusaoLightbox = ref(false);

function abrirLightbox(foto: FotoEntry) {
  const idx = fotosFlat.value.findIndex(f => f.id === foto.id);
  if (idx !== -1) lightboxIdx.value = idx;
}

function fecharLightbox() {
  confirmandoExclusaoLightbox.value = false;
  lightboxIdx.value = -1;
}

watch(lightboxFoto, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
  if (!v) confirmandoExclusaoLightbox.value = false;
});

function pedirConfirmacaoLightbox() {
  confirmandoExclusaoLightbox.value = true;
}

async function executarExclusaoLightbox() {
  const id = lightboxFoto.value?.id;
  if (!id) return;
  confirmandoExclusaoLightbox.value = false;
  fecharLightbox();
  revokeOne(id);
  await galeria.excluirFoto(id);
  $q.notify({ type: "positive", message: "Foto excluída.", position: "top", timeout: 1500 });
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
  // A store já tem a nova foto
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
  gap: 10px;
  padding: 10px 16px;
  background: var(--gl-surface, #fff);
  border-bottom: 1px solid rgba(15,23,42,.07);
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.gl-info-bar__item { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.gl-info-bar__sync { font-size: 11px; color: #64748b; gap: 4px; }
.gl-info-bar__icon { opacity: .7; }

.gl-btn-cam {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--brand);
  color: #fff;
  border: 0;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.gl-btn-cam:active { background: var(--brand-deep); }

.gl-btn-sel {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(15,23,42,.06);
  color: #475569;
  border: 0;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.gl-btn-sel:active { background: rgba(15,23,42,.12); }

.gl-btn-cancel {
  padding: 6px 16px;
  background: none;
  color: var(--brand);
  border: 0;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

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
.gl-group__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
.gl-group__sel-all {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0;
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
  /* Sem transform em :active para não conflitar com modo seleção */
}
.gl-thumb-wrap--selected {
  outline: 3px solid var(--brand);
  outline-offset: -3px;
}

.gl-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gl-thumb-wrap--selected .gl-thumb { opacity: 0.75; }

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
  pointer-events: none;
}

/* Botão de lixeira — sempre visível em mobile (sem hover-only) */
.gl-thumb__del {
  position: absolute;
  top: 4px; right: 4px;
  width: 26px; height: 26px;
  background: rgba(0,0,0,.50);
  border: 0; border-radius: 50%;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.gl-thumb__del:active { background: rgba(180,30,30,.8); }

/* Indicador de seleção */
.gl-thumb__check {
  position: absolute;
  top: 5px; left: 5px;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
}

/* tablet: 4 colunas */
@media (min-width: 768px) {
  .gl-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
}

/* ── Barra flutuante de seleção ──────────────────────── */
.gl-sel-bar {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 16px; right: 16px;
  z-index: 200;
  background: #1e2433;
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 24px rgba(0,0,0,.35);
}
.gl-sel-bar__count {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.gl-sel-bar__btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.gl-sel-bar__btn--all {
  background: rgba(255,255,255,.1);
  color: #fff;
}
.gl-sel-bar__btn--all:active { background: rgba(255,255,255,.2); }
.gl-sel-bar__btn--del {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #dc2626;
  color: #fff;
}
.gl-sel-bar__btn--del:disabled { opacity: .4; cursor: default; }
.gl-sel-bar__btn--del:not(:disabled):active { background: #b91c1c; }

.sel-bar-enter-active, .sel-bar-leave-active { transition: transform .25s, opacity .25s; }
.sel-bar-enter-from,  .sel-bar-leave-to      { transform: translateY(24px); opacity: 0; }

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

/* Confirmação inline no lightbox */
.lb-confirm {
  position: absolute;
  inset: 0;
  z-index: 9600;
  background: rgba(0,0,0,.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.lb-confirm__box {
  background: #1e293b;
  border-radius: 18px;
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 320px;
  text-align: center;
}
.lb-confirm__title {
  font-size: 17px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px;
}
.lb-confirm__sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 20px;
}
.lb-confirm__btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.lb-confirm__btn {
  height: 46px;
  border: 0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.lb-confirm__btn--cancel {
  background: rgba(255,255,255,.08);
  color: #cbd5e1;
}
.lb-confirm__btn--cancel:active { background: rgba(255,255,255,.15); }
.lb-confirm__btn--ok {
  background: #dc2626;
  color: #fff;
}
.lb-confirm__btn--ok:active { background: #b91c1c; }

.lb-confirm-fade-enter-active, .lb-confirm-fade-leave-active { transition: opacity .18s; }
.lb-confirm-fade-enter-from,   .lb-confirm-fade-leave-to    { opacity: 0; }

.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity .2s; }
.lb-fade-enter-from,  .lb-fade-leave-to      { opacity: 0; }

/* ── Dark mode ───────────────────────────────────────── */
:global(body.body--dark) {
  .gl-info-bar  { background: #1e293b; border-color: rgba(148,163,184,.1); color: #94a3b8; }
  .gl-btn-sel   { background: rgba(255,255,255,.08); color: #94a3b8; }
  .gl-empty__title { color: #e2e8f0; }
  .gl-thumb-wrap { background: #1e293b; }
}
</style>
