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
            <div style="width:40px" />
          </div>

          <!-- Câmera nativa do aparelho (zoom, foco, flash, rotação e selfie do próprio celular) -->
          <input
            ref="inputEl"
            type="file"
            accept="image/*"
            capture="environment"
            class="cc-input"
            @change="onArquivo"
          />

          <div class="cc-viewfinder">
            <img
              v-if="fotoDataUrl"
              :src="fotoDataUrl"
              class="cc-preview-img"
              alt="Foto capturada"
            />
            <div v-else class="cc-wait">
              <template v-if="processando">
                <q-spinner color="white" size="40px" />
                <span>Preparando foto…</span>
              </template>
              <template v-else-if="miniaturas.length">
                <q-icon name="mdi-check-circle" size="52px" color="positive" />
                <span class="cc-wait__title">
                  {{ miniaturas.length }} {{ miniaturas.length === 1 ? 'foto salva' : 'fotos salvas' }}
                </span>
                <div class="cc-thumbs">
                  <img v-for="(m, i) in miniaturas" :key="i" :src="m" alt="" />
                </div>
                <button class="cc-equipe-confirmar cc-wait__btn" @click="abrirCamera">
                  <q-icon name="mdi-camera-plus" size="22px" />
                  Tirar outra foto
                </button>
                <button class="cc-wait__done" @click="fechar">Concluir</button>
              </template>
              <template v-else>
                <q-icon name="mdi-camera-outline" size="56px" />
                <span>Toque para abrir a câmera do celular</span>
                <button class="cc-equipe-confirmar cc-wait__btn" @click="abrirCamera">
                  <q-icon name="mdi-camera" size="22px" />
                  Abrir câmera
                </button>
              </template>
            </div>
          </div>

          <!-- FOOTER -->
          <div v-if="fotoDataUrl" class="cc-footer">
            <button class="cc-action-btn cc-action-btn--cancel" @click="refazer">
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
          </div>

          <!-- ERRO -->
          <div v-if="erroMsg" class="cc-error">
            <q-icon name="mdi-alert-circle-outline" size="20px" />
            {{ erroMsg }}
          </div>

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
import { abrirCameraNativa, fotoNativaParaBase64, FotoAntigaError } from "@/utils/native-camera";

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

// ── Fluxo ────────────────────────────────────────────────
type Passo = "equipe" | "camera";
const passo             = ref<Passo>("equipe");
const equipeSelecionada = ref<Equipe | null>(null);
const busca             = ref("");
const searchInput       = ref<HTMLInputElement | null>(null);

const equipesFiltradas = computed(() => {
  const q = busca.value.trim().toLowerCase();
  if (!q) return EQUIPES;
  return EQUIPES.filter(e =>
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

function confirmarEquipe() {
  if (!equipeSelecionada.value) return;
  busca.value = "";
  passo.value = "camera";
  // Abre a câmera ainda dentro do toque no botão (exigência do navegador).
  abrirCamera();
}

function voltarParaEquipe() {
  descartar();
  limparMiniaturas();
  busca.value = "";
  passo.value = "equipe";
  nextTick(() => searchInput.value?.focus());
}

// ── Câmera nativa ───────────────────────────────────────
const inputEl = ref<HTMLInputElement | null>(null);
const erroMsg = ref<string | null>(null);

function abrirCamera() {
  erroMsg.value = null;
  // O input só existe no passo 2; quando vem do botão do passo 1, espera o render.
  if (inputEl.value) abrirCameraNativa(inputEl.value);
  else void nextTick(() => abrirCameraNativa(inputEl.value));
}

// ── Captura + stamp ──────────────────────────────────────
const miniaturas  = ref<string[]>([]); // fotos salvas nesta sessão (para o resumo)
const fotoDataUrl = ref<string | null>(null);
const fotoBlob    = ref<Blob | null>(null);
const salvando    = ref(false);
const processando = ref(false);

async function onArquivo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !equipeSelecionada.value) return;

  processando.value = true;
  erroMsg.value = null;

  try {
    // Foto já em pé (orientação do aparelho) e reduzida
    const foto = await fotoNativaParaBase64(file);

    // Aplicar carimbo igual ao dos checklists
    const { date } = await getTrustedTime();
    const carimbada = await stampAuditPhoto(foto, {
      time:     date,
      observer: session.employee?.nomeCompleto ?? session.employee?.nome ?? "—",
      equipe:   equipeSelecionada.value.prefixo,
    });

    // Converter base64 → blob
    const resp = await fetch(carimbada);
    fotoBlob.value    = await resp.blob();
    fotoDataUrl.value = URL.createObjectURL(fotoBlob.value);
  } catch (err) {
    erroMsg.value = err instanceof FotoAntigaError ? err.message : "Erro ao processar foto. Tente novamente.";
  } finally {
    processando.value = false;
  }
}

function refazer() {
  descartar();
  abrirCamera();
}

async function confirmar() {
  if (!fotoBlob.value) return;
  salvando.value = true;
  try {
    const entry = await galeria.adicionarFoto(fotoBlob.value, props.matricula);
    miniaturas.value.push(URL.createObjectURL(fotoBlob.value));
    emit("salva", entry.id);
    $q.notify({ type: "positive", message: "Foto salva na galeria!", position: "top", timeout: 1500 });
    descartar(); // volta ao resumo: "Tirar outra foto" ou "Concluir"
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

function limparMiniaturas() {
  miniaturas.value.forEach((u) => URL.revokeObjectURL(u));
  miniaturas.value = [];
}

function fechar() {
  descartar();
  limparMiniaturas();
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
      nextTick(() => searchInput.value?.focus());
    } else {
      descartar();
      limparMiniaturas();
      passo.value = "equipe";
      busca.value = "";
    }
  }
);

onUnmounted(() => { descartar(); });
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
.cc-input {
  position: absolute; width: 1px; height: 1px;
  opacity: 0; pointer-events: none;
}
.cc-wait {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 24px;
  color: rgba(255,255,255,.75); font-size: 14px; text-align: center;
}
.cc-wait__btn { width: auto; padding: 0 28px; margin-top: 6px; }
.cc-wait__title { font-size: 18px; font-weight: 700; color: #fff; }
.cc-wait__done {
  appearance: none; border: 0; background: none;
  color: rgba(255,255,255,.8); font-size: 15px; font-weight: 600;
  height: 44px; padding: 0 20px; cursor: pointer;
}
.cc-thumbs {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
  max-width: 100%; max-height: 190px; overflow-y: auto;
}
.cc-thumbs img {
  width: 64px; height: 64px; object-fit: cover; border-radius: 10px;
  border: 1.5px solid rgba(255,255,255,.25);
}
.cc-preview-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain; display: block;
  background: #000;
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
