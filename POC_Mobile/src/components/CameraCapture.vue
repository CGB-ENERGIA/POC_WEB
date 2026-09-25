<template>
  <teleport to="body">
    <transition name="cc-fade">
      <div v-if="modelValue" class="cc-overlay">

        <!-- ════════════════════════════════════════════════
             STEP 1 — SELEÇÃO DE EQUIPE
        ════════════════════════════════════════════════ -->
        <template v-if="passo === 'equipe'">
          <div class="cc-header">
            <button class="cc-icon-btn" @click="fechar">
              <q-icon name="mdi-close" size="26px" />
            </button>
            <span class="cc-header__title">Selecione a equipe</span>
            <div style="width:40px" />
          </div>

          <!-- BARRA DE BUSCA -->
          <div class="cc-equipe-search-wrap">
            <div class="cc-equipe-search">
              <q-icon name="mdi-magnify" size="20px" class="cc-equipe-search__icon" />
              <input
                ref="searchInput"
                v-model="busca"
                class="cc-equipe-search__input"
                placeholder="Buscar equipe (ex: F001, BCB…)"
                autocomplete="off"
                spellcheck="false"
              />
              <button v-if="busca" class="cc-equipe-search__clear" @click="busca = ''">
                <q-icon name="mdi-close-circle" size="18px" />
              </button>
            </div>
          </div>

          <div class="cc-equipe-body">
            <!-- Sem resultados -->
            <div v-if="equipesFiltradas.length === 0" class="cc-equipe-empty">
              <q-icon name="mdi-magnify-remove-outline" size="40px" />
              <span>Nenhuma equipe encontrada para "{{ busca }}"</span>
            </div>

            <div v-else class="cc-equipe-list">
              <button
                v-for="eq in equipesFiltradas"
                :key="eq.prefixo"
                class="cc-equipe-item"
                :class="{ 'cc-equipe-item--sel': equipeSelecionada?.prefixo === eq.prefixo }"
                @click="selecionarEquipe(eq)"
              >
                <!-- Destacar match do texto buscado -->
                <span class="cc-equipe-item__pref" v-html="destacar(eq.prefixo)" />
                <span class="cc-equipe-item__base">{{ eq.base }}</span>
                <q-icon
                  v-if="equipeSelecionada?.prefixo === eq.prefixo"
                  name="mdi-check-circle"
                  size="20px"
                  class="cc-equipe-item__check"
                />
              </button>
            </div>
          </div>

          <div class="cc-equipe-footer">
            <button
              class="cc-equipe-confirmar"
              :disabled="!equipeSelecionada"
              @click="confirmarEquipe"
            >
              <q-icon name="mdi-camera" size="22px" />
              Abrir câmera
            </button>
          </div>
        </template>

        <!-- ════════════════════════════════════════════════
             STEP 2 — CÂMERA + REVISÃO
        ════════════════════════════════════════════════ -->
        <template v-else>
          <!-- HEADER -->
          <div class="cc-header">
            <button class="cc-icon-btn" @click="voltarParaEquipe">
              <q-icon name="mdi-arrow-left" size="26px" />
            </button>
            <span class="cc-header__title">
              {{ fotoDataUrl ? 'Confirmar foto' : equipeSelecionada?.prefixo ?? 'Câmera' }}
            </span>
            <button
              class="cc-icon-btn"
              :class="{ 'cc-icon-btn--disabled': fotoDataUrl !== null }"
              @click="alternarCamera"
            >
              <q-icon name="mdi-camera-flip-outline" size="24px" />
            </button>
          </div>

          <!-- VIEWFINDER -->
          <div class="cc-viewfinder">
            <video
              v-show="!fotoDataUrl"
              ref="videoEl"
              autoplay
              playsinline
              muted
              class="cc-video"
            />
            <img
              v-if="fotoDataUrl"
              :src="fotoDataUrl"
              class="cc-preview-img"
              alt="Foto capturada"
            />
            <div v-if="!fotoDataUrl" class="cc-timestamp">
              {{ timestampAtual }}
            </div>
          </div>

          <!-- FOOTER -->
          <div class="cc-footer">
            <template v-if="!fotoDataUrl">
              <div class="cc-footer__spacer" />
              <button
                class="cc-capture-btn"
                :disabled="!streamAtivo || processando"
                @click="capturar"
              >
                <div class="cc-capture-btn__ring" />
                <div class="cc-capture-btn__disc" />
              </button>
              <div class="cc-footer__spacer" />
            </template>
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

          <!-- ERRO -->
          <div v-if="erroMsg" class="cc-error">
            <q-icon name="mdi-alert-circle-outline" size="20px" />
            {{ erroMsg }}
          </div>

          <!-- canvas oculto -->
          <canvas ref="canvasEl" style="display:none" />
        </template>

      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed, nextTick } from "vue";
import { useGaleriaStore } from "@/stores/galeria";
import { useSessionStore } from "@/stores/session";
import { useQuasar } from "quasar";
import { EQUIPES, type Equipe } from "@/data/equipes";
import { stampAuditPhoto } from "@/utils/photo-stamp";
import { getTrustedTime } from "@/utils/server-time";
import { compressBase64 } from "@/utils/image";

const props = defineProps<{
  modelValue: boolean;
  matricula: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "salva", id: string): void;
}>();

const $q      = useQuasar();
const galeria = useGaleriaStore();
const session = useSessionStore();

const videoEl  = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

// ── Fluxo ────────────────────────────────────────────────
type Passo = "equipe" | "camera";
const passo             = ref<Passo>("equipe");
const equipeSelecionada = ref<Equipe | null>(null);
const busca             = ref("");
const searchInput       = ref<HTMLInputElement | null>(null);

const equipesBase = computed(() => {
  const base = session.employee?.base;
  return base ? EQUIPES.filter(e => e.base === base) : EQUIPES;
});

const equipesFiltradas = computed(() => {
  const q = busca.value.trim().toLowerCase();
  if (!q) return equipesBase.value;
  return equipesBase.value.filter(e =>
    e.prefixo.toLowerCase().includes(q) || e.base.toLowerCase().includes(q)
  );
});

function destacar(texto: string): string {
  const q = busca.value.trim();
  if (!q) return texto;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return texto.replace(re, '<mark class="cc-mark">$1</mark>');
}

function selecionarEquipe(eq: Equipe) {
  equipeSelecionada.value = eq;
}

async function confirmarEquipe() {
  if (!equipeSelecionada.value) return;
  busca.value = "";
  passo.value = "camera";
  await iniciarStream();
}

function voltarParaEquipe() {
  descartar();
  pararStream();
  busca.value = "";
  passo.value = "equipe";
  nextTick(() => searchInput.value?.focus());
}

// ── Stream ───────────────────────────────────────────────
let stream: MediaStream | null = null;
const streamAtivo = ref(false);
const faceMode    = ref<"environment" | "user">("environment");
const erroMsg     = ref<string | null>(null);

async function iniciarStream() {
  erroMsg.value = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: faceMode.value }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  streamAtivo.value = false;
  if (videoEl.value) videoEl.value.srcObject = null;
}

// ── Timestamp live ───────────────────────────────────────
const agora = ref(new Date());
let tickId = 0;

const timestampAtual = computed(() => {
  const d    = agora.value;
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date}  ${time}`;
});

// ── Captura + stamp ──────────────────────────────────────
const fotoDataUrl = ref<string | null>(null);
const fotoBlob    = ref<Blob | null>(null);
const salvando    = ref(false);
const processando = ref(false);

async function capturar() {
  const video  = videoEl.value;
  const canvas = canvasEl.value;
  if (!video || !canvas || !streamAtivo.value || !equipeSelecionada.value) return;

  processando.value = true;
  erroMsg.value = null;

  try {
    // Captura raw do frame
    const w = video.videoWidth  || 1280;
    const h = video.videoHeight || 720;
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
    const rawBase64 = canvas.toDataURL("image/jpeg", 0.92);

    // Aplicar carimbo igual ao dos checklists
    const { date } = await getTrustedTime();
    const compressed = await compressBase64(rawBase64);
    const carimbada  = await stampAuditPhoto(compressed, {
      time:     date,
      observer: session.employee?.nomeCompleto ?? session.employee?.nome ?? "—",
      equipe:   equipeSelecionada.value.prefixo,
    });

    // Converter base64 → blob
    const resp = await fetch(carimbada);
    fotoBlob.value    = await resp.blob();
    fotoDataUrl.value = URL.createObjectURL(fotoBlob.value);
  } catch {
    erroMsg.value = "Erro ao processar foto. Tente novamente.";
  } finally {
    processando.value = false;
  }
}

async function confirmar() {
  if (!fotoBlob.value) return;
  salvando.value = true;
  try {
    const entry = await galeria.adicionarFoto(fotoBlob.value, props.matricula);
    emit("salva", entry.id);
    $q.notify({ type: "positive", message: "Foto salva na galeria!", position: "top", timeout: 2000 });
    descartar();
  } catch {
    erroMsg.value = "Erro ao salvar foto. Tente novamente.";
  } finally {
    salvando.value = false;
  }
}

function descartar() {
  if (fotoDataUrl.value) { URL.revokeObjectURL(fotoDataUrl.value); fotoDataUrl.value = null; }
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
  passo.value = "equipe";
  busca.value = "";
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      passo.value = "equipe";
      equipeSelecionada.value = null;
      busca.value = "";
      agora.value = new Date();
      tickId = window.setInterval(() => { agora.value = new Date(); }, 1000);
      nextTick(() => searchInput.value?.focus());
    } else {
      clearInterval(tickId);
      descartar();
      pararStream();
      passo.value = "equipe";
      busca.value = "";
    }
  }
);

onUnmounted(() => { clearInterval(tickId); descartar(); pararStream(); });
</script>

<style scoped>
/* ── Overlay ──────────────────────────────────────────── */
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

/* ── Header ───────────────────────────────────────────── */
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
  flex-shrink: 0;
}
.cc-header__title { font-size: 16px; font-weight: 700; letter-spacing: .01em; }
.cc-icon-btn {
  appearance: none; border: 0;
  background: rgba(255,255,255,.12);
  color: #fff; border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
}
.cc-icon-btn:active { background: rgba(255,255,255,.25); }
.cc-icon-btn--disabled { opacity: .35; pointer-events: none; }

/* ── Step equipe ──────────────────────────────────────── */
.cc-equipe-search-wrap {
  background: #0f172a;
  padding: 14px 16px 0;
  flex-shrink: 0;
}
.cc-equipe-search {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,.08);
  border: 1.5px solid rgba(255,255,255,.14);
  border-radius: 12px;
  padding: 0 12px;
  gap: 8px;
  transition: border-color .15s;
}
.cc-equipe-search:focus-within { border-color: var(--brand-accent); }
.cc-equipe-search__icon { color: #64748b; flex-shrink: 0; }
.cc-equipe-search__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: 15px;
  padding: 12px 0;
  font-family: monospace;
  letter-spacing: .02em;
}
.cc-equipe-search__input::placeholder { color: #475569; font-family: sans-serif; letter-spacing: normal; }
.cc-equipe-search__clear {
  appearance: none; border: none; background: none;
  color: #475569; cursor: pointer; display: flex; padding: 0;
  flex-shrink: 0;
}
.cc-equipe-search__clear:hover { color: #94a3b8; }

.cc-equipe-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 0;
  background: #0f172a;
  color: #fff;
}
.cc-equipe-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 16px;
  color: #475569; text-align: center; font-size: 13px;
}
.cc-equipe-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
:deep(.cc-mark) {
  background: rgba(var(--brand-accent-rgb),.5);
  color: #fff;
  border-radius: 3px;
  padding: 0 2px;
  font-style: normal;
}
.cc-equipe-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,.06);
  border: 1.5px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 14px 16px;
  color: #fff;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  text-align: left;
}
.cc-equipe-item:active   { background: rgba(255,255,255,.12); }
.cc-equipe-item--sel     { background: rgba(var(--brand-rgb),.35); border-color: var(--brand-accent); }
.cc-equipe-item__pref    { flex: 1; font-size: 15px; font-weight: 700; font-family: monospace; }
.cc-equipe-item__base    { font-size: 12px; color: #64748b; }
.cc-equipe-item__check   { color: var(--brand-accent); margin-left: 4px; }

.cc-equipe-footer {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: #0f172a;
  flex-shrink: 0;
}
.cc-equipe-confirmar {
  width: 100%;
  height: 52px;
  background: var(--brand);
  border: 0;
  border-radius: 14px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background .15s;
}
.cc-equipe-confirmar:disabled { opacity: .4; pointer-events: none; }
.cc-equipe-confirmar:active   { background: #5e0e1c; }

/* ── Viewfinder ───────────────────────────────────────── */
.cc-viewfinder {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #111;
}
.cc-video, .cc-preview-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.cc-timestamp {
  position: absolute; bottom: 12px; left: 12px; right: 12px;
  font-size: 13px; font-weight: 600; font-family: monospace;
  color: rgba(255,255,255,.9);
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
  pointer-events: none;
}

/* ── Footer câmera ────────────────────────────────────── */
.cc-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24px 32px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  background: rgba(0,0,0,.6);
  gap: 20px;
  flex-shrink: 0;
}
.cc-footer__spacer { flex: 1; }

.cc-capture-btn {
  position: relative;
  width: 72px; height: 72px;
  background: none; border: 0;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cc-capture-btn:disabled { opacity: .4; }
.cc-capture-btn__ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid #fff; }
.cc-capture-btn__disc {
  width: 56px; height: 56px; border-radius: 50%; background: #fff;
  transition: transform .1s, background .1s;
}
.cc-capture-btn:active .cc-capture-btn__disc { transform: scale(.88); background: #ddd; }

.cc-action-btn {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgba(255,255,255,.12);
  border: 1.5px solid rgba(255,255,255,.2);
  color: #fff; border-radius: 16px;
  padding: 14px 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background .15s;
}
.cc-action-btn:active     { background: rgba(255,255,255,.2); }
.cc-action-btn:disabled   { opacity: .5; pointer-events: none; }
.cc-action-btn--confirm   { background: rgba(var(--brand-rgb),.7); border-color: var(--brand-accent); }
.cc-action-btn--confirm:active { background: rgba(var(--brand-rgb),.9); }

/* ── Erro ─────────────────────────────────────────────── */
.cc-error {
  position: absolute; bottom: 140px; left: 16px; right: 16px;
  background: rgba(200,30,30,.88);
  color: #fff; border-radius: 12px;
  padding: 12px 16px; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px; text-align: left;
}

/* ── Transition ───────────────────────────────────────── */
.cc-fade-enter-active, .cc-fade-leave-active { transition: opacity .22s; }
.cc-fade-enter-from, .cc-fade-leave-to { opacity: 0; }
</style>
