<template>
  <teleport to="body">
    <div
      v-if="aberto"
      class="pa-coach"
      role="dialog"
      aria-modal="false"
      aria-labelledby="pa-coach-title"
    >
      <div
        v-if="spot.w > 0"
        class="pa-coach__spot"
        :style="spotStyle"
        aria-hidden="true"
      />
      <div class="pa-coach__block pa-coach__block--t" :style="blockTop" />
      <div class="pa-coach__block pa-coach__block--l" :style="blockLeft" />
      <div class="pa-coach__block pa-coach__block--r" :style="blockRight" />
      <div class="pa-coach__block pa-coach__block--b" :style="blockBottom" />

      <div ref="cardEl" class="pa-coach__card" :style="cardStyle">
        <div class="pa-coach__top">
          <span class="pa-coach__step">{{ passoAtual }} de {{ totalPassos }}</span>
          <button type="button" class="pa-coach__skip" @click="pular">
            Pular
          </button>
        </div>

        <div class="pa-coach__dots" aria-hidden="true">
          <span
            v-for="i in totalPassos"
            :key="i"
            class="pa-coach__dot"
            :class="{
              'pa-coach__dot--on': i === passoAtual,
              'pa-coach__dot--done': i < passoAtual,
            }"
          />
        </div>

        <!-- ── Passo de instalação ───────────────────── -->
        <template v-if="fase === 'instalacao'">
          <div class="pa-coach__row">
            <div class="pa-coach__icon" aria-hidden="true">
              <q-icon name="mdi-download-circle-outline" size="22px" />
            </div>
            <div>
              <h2 id="pa-coach-title" class="pa-coach__title">
                Antes de qualquer coisa, vamos instalar o POC 4.0
              </h2>
            </div>
          </div>

          <!-- Android: botão nativo disponível -->
          <template v-if="temPromptNativo">
            <p class="pa-coach__lead q-mt-sm">
              Instale o app para acessar sem abrir o navegador, com câmera e galeria funcionando offline.
            </p>
            <q-btn
              class="full-width q-mt-md"
              color="primary"
              unelevated no-caps
              icon="mdi-download-outline"
              label="Instalar agora"
              @click="instalarAgora"
            />
            <button class="pa-install__later" @click="pularInstalacao">
              Instalar depois
            </button>
          </template>

          <!-- iOS Safari: passos de compartilhar -->
          <template v-else-if="ehIosSafari">
            <ol class="pa-install__list">
              <li>
                <q-icon name="mdi-export-variant" size="16px" class="pa-install__li-icon" />
                Toque em <strong>Compartilhar</strong> na barra do Safari
              </li>
              <li>
                <q-icon name="mdi-plus-box-outline" size="16px" class="pa-install__li-icon" />
                Role e toque em <strong>Adicionar à Tela de Início</strong>
              </li>
              <li>
                <q-icon name="mdi-check" size="16px" class="pa-install__li-icon" />
                Toque em <strong>Adicionar</strong> no canto superior direito
              </li>
            </ol>
            <q-btn
              class="full-width q-mt-sm"
              color="primary"
              unelevated no-caps
              icon="mdi-check-circle-outline"
              label="Já instalei"
              @click="pularInstalacao"
            />
            <button class="pa-install__later" @click="pularInstalacao">
              Instalar depois
            </button>
          </template>

          <!-- iOS outro browser: instrução para abrir no Safari -->
          <template v-else-if="ehIos">
            <p class="pa-coach__lead q-mt-sm">
              Para instalar no iPhone ou iPad, abra este endereço no <strong>Safari</strong> — outros navegadores não permitem a instalação.
            </p>
            <q-btn
              class="full-width q-mt-md"
              color="primary"
              unelevated no-caps
              icon="mdi-safari"
              label="Entendido"
              @click="pularInstalacao"
            />
          </template>

          <!-- Android / outros: passos manuais -->
          <template v-else>
            <ol class="pa-install__list">
              <li>
                <q-icon name="mdi-dots-vertical" size="16px" class="pa-install__li-icon" />
                Toque nos <strong>3 pontos</strong> (⋮) do Chrome
              </li>
              <li>
                <q-icon name="mdi-plus-box-outline" size="16px" class="pa-install__li-icon" />
                Toque em <strong>Adicionar à Tela de Início</strong>
              </li>
              <li>
                <q-icon name="mdi-check" size="16px" class="pa-install__li-icon" />
                Confirme tocando em <strong>Instalar</strong>
              </li>
            </ol>
            <q-btn
              class="full-width q-mt-sm"
              color="primary"
              unelevated no-caps
              icon="mdi-check-circle-outline"
              label="Já instalei"
              @click="pularInstalacao"
            />
            <button class="pa-install__later" @click="pularInstalacao">
              Instalar depois
            </button>
          </template>
        </template>

        <!-- ── Passos normais ────────────────────────── -->
        <template v-else>
          <div class="pa-coach__row">
            <div class="pa-coach__icon" aria-hidden="true">
              <q-icon :name="atual.icon" size="22px" />
            </div>
            <div>
              <h2 id="pa-coach-title" class="pa-coach__title">{{ atual.title }}</h2>
              <p class="pa-coach__lead">{{ atual.lead }}</p>
            </div>
          </div>

          <q-btn
            v-if="fase === 'falha'"
            class="full-width q-mt-md btn-primary-lg"
            color="primary"
            unelevated
            no-caps
            icon="mdi-badge-account-outline"
            label="Entrar pela matrícula"
            @click="entrarSemBiometria"
          />
        </template>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSessionStore } from "@/stores/session";
import {
  concluirPrimeiroAcesso,
  identCoach,
  primeiroAcessoPendente,
} from "@/utils/primeiro-acesso";
import {
  isIosDevice,
  isIosSafari,
  isStandaloneDisplay,
  wasInstallDismissed,
  dismissInstallPrompt,
  deferredInstallPrompt,
} from "@/utils/pwa-install";

type Fase = "instalacao" | "matricula" | "lista" | "continuar" | "cadastro" | "falha";

const route = useRoute();
const session = useSessionStore();
const aberto = ref(false);
const cardEl = ref<HTMLElement | null>(null);

const spot = reactive({ x: 0, y: 0, w: 0, h: 0 });
const card = reactive({ top: 16, left: 12, width: 320, maxH: 280 });

// Detectado no mount (não reativo após carregar)
const deveGuiarInstalacao = ref(false);
const instalacaoVista      = ref(false);

const ehIos        = isIosDevice();
const ehIosSafari  = isIosSafari();
const temPromptNativo = computed(() => !!deferredInstallPrompt.value);

const totalPassos = computed(() => deveGuiarInstalacao.value ? 5 : 4);

const fase = computed<Fase>(() => {
  if (deveGuiarInstalacao.value && !instalacaoVista.value) return "instalacao";
  if (identCoach.erroBio) return "falha";
  if (identCoach.tela !== "ident") return "cadastro";
  if (identCoach.temColaborador) return "continuar";
  if (identCoach.digitando || identCoach.busca.length > 0 || identCoach.menuAberto) return "lista";
  return "matricula";
});

const offset = computed(() => deveGuiarInstalacao.value ? 1 : 0);

const passoAtual = computed(() => {
  if (fase.value === "instalacao") return 1;
  if (fase.value === "matricula") return 1 + offset.value;
  if (fase.value === "lista")     return 2 + offset.value;
  if (fase.value === "continuar") return 3 + offset.value;
  return 4 + offset.value;
});

const atual = computed(() => {
  switch (fase.value) {
    case "matricula":
      return {
        icon: "mdi-gesture-tap",
        title: "Toque no campo e informe a matrícula",
        lead: "Não precisa criar conta. Digite o número ou o nome até aparecer na lista.",
      };
    case "lista":
      return {
        icon: "mdi-account-search-outline",
        title: "Escolha o seu nome na lista",
        lead: "Toque na linha com a sua matrícula para preencher o campo.",
      };
    case "continuar":
      return {
        icon: "mdi-arrow-right-bold-circle-outline",
        title: "Confira e toque em Continuar",
        lead: "Se o nome, a função e a base estão certos, siga para cadastrar neste aparelho.",
      };
    case "falha":
      return {
        icon: "mdi-badge-account-outline",
        title: "Entre pela matrícula",
        lead: identCoach.temCamera
          ? "A digital não foi. Toque em Entrar pela matrícula para seguir agora, ou cadastre o Face ID pela câmera. A digital pode ficar para depois."
          : "A digital não foi. Toque em Entrar pela matrícula para completar o cadastro neste aparelho. Depois você tenta a digital de novo.",
      };
    default:
      return {
        icon: "mdi-fingerprint",
        title: "Cadastre neste aparelho",
        lead: "Siga a tela: digital, Face ID ou entrar só pela matrícula. Isso completa o cadastro neste celular.",
      };
  }
});

const alvoId = computed(() => {
  if (fase.value === "instalacao") return "";
  if (fase.value === "falha") return "coach-alvo-entrar-matricula";
  if (fase.value === "cadastro") return "coach-alvo-ident-card";
  if (fase.value === "continuar") return "coach-alvo-continuar";
  return "coach-alvo-matricula";
});

const pad = computed(() => (fase.value === "cadastro" ? 6 : 8));

const spotStyle = computed(() => ({
  left: `${spot.x}px`,
  top: `${spot.y}px`,
  width: `${spot.w}px`,
  height: `${spot.h}px`,
}));

const blockTop = computed(() => ({
  top: "0px",
  left: "0px",
  width: "100%",
  height: `${Math.max(0, spot.y)}px`,
}));
const blockLeft = computed(() => ({
  top: `${spot.y}px`,
  left: "0px",
  width: `${Math.max(0, spot.x)}px`,
  height: `${spot.h}px`,
}));
const blockRight = computed(() => ({
  top: `${spot.y}px`,
  left: `${spot.x + spot.w}px`,
  width: `calc(100% - ${spot.x + spot.w}px)`,
  height: `${spot.h}px`,
}));
const blockBottom = computed(() => ({
  top: `${spot.y + spot.h}px`,
  left: "0px",
  width: "100%",
  height: `calc(100% - ${spot.y + spot.h}px)`,
}));

const cardStyle = computed(() => ({
  left: `${card.left}px`,
  top: `${card.top}px`,
  width: `${card.width}px`,
  maxHeight: `${card.maxH}px`,
}));

function viewport() {
  const vv = window.visualViewport;
  return {
    x: vv?.offsetLeft ?? 0,
    y: vv?.offsetTop ?? 0,
    w: vv?.width ?? window.innerWidth,
    h: vv?.height ?? window.innerHeight,
  };
}

function medir() {
  const vp = viewport();
  const gap = 10;
  const margin = 12;
  const maxW = Math.min(380, vp.w - margin * 2);
  card.width = Math.max(240, maxW);
  card.maxH = Math.max(160, vp.h - margin * 2);
  card.left = vp.x + (vp.w - card.width) / 2;

  const el = document.getElementById(alvoId.value);
  if (!el) {
    spot.w = 0;
    card.top = vp.y + margin;
    encaixarNoViewport();
    return;
  }

  const r = el.getBoundingClientRect();
  const p = pad.value;
  spot.x = Math.max(vp.x + 8, r.left - p);
  spot.y = Math.max(vp.y + 8, r.top - p);
  spot.w = Math.min(vp.x + vp.w - 16 - (spot.x - vp.x), r.width + p * 2);
  spot.h = Math.min(vp.y + vp.h - 16 - (spot.y - vp.y), r.height + p * 2);

  const cardH = Math.min(cardEl.value?.offsetHeight || (fase.value === "falha" ? 240 : 160), card.maxH);
  const abaixo = spot.y + spot.h + gap;
  const acima = spot.y - gap - cardH;
  const minTop = vp.y + margin;
  const maxTop = vp.y + vp.h - margin - cardH;

  if (fase.value === "lista" || identCoach.menuAberto) {
    card.top = minTop;
  } else if (abaixo + cardH <= vp.y + vp.h - margin) {
    card.top = abaixo;
  } else if (acima >= minTop) {
    card.top = acima;
  } else {
    card.top = maxTop;
  }

  if (spot.w > 0) {
    card.left = Math.min(
      Math.max(spot.x, vp.x + margin),
      vp.x + vp.w - card.width - margin,
    );
  }
  encaixarNoViewport();
}

function encaixarNoViewport() {
  const vp = viewport();
  const margin = 12;
  const h = Math.min(cardEl.value?.offsetHeight || 160, card.maxH);
  const minTop = vp.y + margin;
  const maxTop = vp.y + vp.h - margin - h;
  card.top = Math.min(Math.max(card.top, minTop), Math.max(minTop, maxTop));
  card.left = Math.min(
    Math.max(card.left, vp.x + margin),
    vp.x + vp.w - card.width - margin,
  );
}

function tentarAbrir() {
  if (!primeiroAcessoPendente.value) return;
  if (session.isAuthenticated) {
    concluirPrimeiroAcesso();
    aberto.value = false;
    return;
  }
  if (route?.name !== "identificacao") return;
  aberto.value = true;
  void nextTick(medir);
}

function pular() {
  concluirPrimeiroAcesso();
  aberto.value = false;
}

function pularInstalacao() {
  dismissInstallPrompt();
  instalacaoVista.value = true;
  void nextTick(() => { medir(); void nextTick(medir); });
}

async function instalarAgora() {
  const prompt = deferredInstallPrompt.value;
  if (!prompt) { pularInstalacao(); return; }
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === "accepted") {
    pularInstalacao();
  }
}

function entrarSemBiometria() {
  identCoach.pularBiometria?.();
}

watch(() => session.isAuthenticated, (ok) => {
  if (!ok) return;
  concluirPrimeiroAcesso();
  aberto.value = false;
});

watch(() => route?.name, tentarAbrir);
watch(fase, () => void nextTick(() => { medir(); void nextTick(medir); }));
watch(identCoach, () => void nextTick(() => { medir(); void nextTick(medir); }), { deep: true });

onMounted(() => {
  deveGuiarInstalacao.value = !isStandaloneDisplay() && !wasInstallDismissed();
  tentarAbrir();
  window.addEventListener("resize", medir);
  window.addEventListener("scroll", medir, true);
  window.visualViewport?.addEventListener("resize", medir);
  window.visualViewport?.addEventListener("scroll", medir);
});

onUnmounted(() => {
  window.removeEventListener("resize", medir);
  window.removeEventListener("scroll", medir, true);
  window.visualViewport?.removeEventListener("resize", medir);
  window.visualViewport?.removeEventListener("scroll", medir);
});
</script>

<style scoped>
.pa-coach {
  pointer-events: none;
}

.pa-coach__block {
  position: fixed;
  z-index: 4499;
  pointer-events: auto;
}

.pa-coach__spot {
  position: fixed;
  z-index: 4500;
  border-radius: 14px;
  box-shadow: 0 0 0 9999px rgba(28, 8, 12, 0.58);
  outline: 2px solid #c41e3a;
  outline-offset: 0;
  pointer-events: none;
  animation: pa-spot-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.pa-coach__card {
  position: fixed;
  z-index: 4501;
  pointer-events: auto;
  box-sizing: border-box;
  background: #fffaf8;
  color: #1c0a0e;
  border-radius: 18px;
  padding: 14px 16px 16px;
  box-shadow: 0 12px 32px rgba(28, 8, 12, 0.28);
  border: 1px solid rgba(196, 30, 58, 0.16);
  max-width: calc(100vw - 24px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.pa-coach__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.pa-coach__step {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7a1225;
}

.pa-coach__skip {
  border: 0;
  background: transparent;
  color: #6b3d46;
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  min-width: 44px;
  padding: 0 4px;
}

.pa-coach__dots {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.pa-coach__dot {
  height: 5px;
  flex: 1;
  border-radius: 99px;
  background: #ead6da;
}

.pa-coach__dot--on {
  background: #7a1225;
}

.pa-coach__dot--done {
  background: #c4a4ab;
}

.pa-coach__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.pa-coach__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #7a1225;
  color: #fff;
}

.pa-coach__title {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #3d0912;
}

.pa-coach__lead {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.4;
  color: #4a3036;
}

.pa-coach__row > div:last-child {
  min-width: 0;
  flex: 1;
}

.pa-install__list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pa-install__list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  line-height: 1.35;
  color: #4a3036;
  background: rgba(122, 18, 37, 0.06);
  border-radius: 10px;
  padding: 8px 10px;
}

.pa-install__li-icon {
  color: #7a1225;
  flex-shrink: 0;
}

.pa-install__later {
  display: block;
  width: 100%;
  margin-top: 8px;
  background: transparent;
  border: 0;
  color: #7a5560;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  min-height: 36px;
  cursor: pointer;
}

:global(body.body--dark) .pa-install__list li {
  color: #e8d4d8;
  background: rgba(225, 29, 72, 0.1);
}

:global(body.body--dark) .pa-install__later {
  color: #c49aa4;
}

@keyframes pa-spot-in {
  from {
    opacity: 0;
    box-shadow: 0 0 0 0 rgba(28, 8, 12, 0);
  }
  to {
    opacity: 1;
    box-shadow: 0 0 0 9999px rgba(28, 8, 12, 0.58);
  }
}

:global(body.body--dark) .pa-coach__card {
  background: #1c1214;
  color: #f8eef0;
  border-color: rgba(225, 29, 72, 0.28);
}

:global(body.body--dark) .pa-coach__title {
  color: #fff;
}

:global(body.body--dark) .pa-coach__lead,
:global(body.body--dark) .pa-coach__skip {
  color: #e8d4d8;
}

:global(body.body--dark) .pa-coach__step {
  color: #fecdd3;
}

:global(body.body--dark) .pa-coach__dot {
  background: #3f2a2e;
}

:global(body.body--dark) .pa-coach__dot--on {
  background: #e11d48;
}

:global(body.body--dark) .pa-coach__spot {
  box-shadow: 0 0 0 9999px rgba(8, 4, 6, 0.72);
  outline-color: #fb7185;
}
</style>
