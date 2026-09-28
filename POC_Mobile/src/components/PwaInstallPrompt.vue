<template>
  <q-dialog
    v-model="aberto"
    :position="ios ? 'standard' : 'bottom'"
    persistent
    :transition-show="ios ? 'scale' : 'slide-up'"
    :transition-hide="ios ? 'scale' : 'slide-down'"
  >
    <div class="pwa-sheet" :class="{ 'pwa-sheet--ios': ios }">
      <div v-if="!ios" class="pwa-sheet__handle" aria-hidden="true" />

      <div class="pwa-sheet__icon" aria-hidden="true">
        <q-icon name="mdi-cellphone-arrow-down" size="28px" />
      </div>

      <h2 class="pwa-sheet__title">{{ titulo }}</h2>
      <p class="pwa-sheet__lead">{{ lead }}</p>

      <div v-if="modo === 'ios-outro'" class="pwa-alert q-mt-md">
        <q-icon name="mdi-apple-safari" size="20px" />
        <span>Abra este link no <b>Safari</b> para instalar. No Chrome ou em outro app do iPhone a instalação não fica disponível.</span>
      </div>

      <ol v-if="modo === 'ios' || modo === 'ios-outro'" class="pwa-steps">
        <li>
          <span class="pwa-steps__n">1</span>
          <span>
            Toque em
            <span class="pwa-share">
              <q-icon name="mdi-export-variant" size="18px" />
              Compartilhar
            </span>
            na barra do Safari
            <template v-if="modo === 'ios-outro'"> (depois de abrir no Safari)</template>.
          </span>
        </li>
        <li>
          <span class="pwa-steps__n">2</span>
          <span>Role a lista e toque em <b>Adicionar à Tela de Início</b>.</span>
        </li>
        <li>
          <span class="pwa-steps__n">3</span>
          <span>Toque em <b>Adicionar</b>. O ícone CGB aparece na tela inicial.</span>
        </li>
      </ol>

      <ol v-else-if="modo === 'manual'" class="pwa-steps">
        <li>
          <span class="pwa-steps__n">1</span>
          <span>Abra o menu <q-icon name="mdi-dots-vertical" size="16px" /> no canto do navegador.</span>
        </li>
        <li>
          <span class="pwa-steps__n">2</span>
          <span>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</span>
        </li>
      </ol>

      <q-btn
        v-if="modo === 'nativo'"
        class="full-width btn-primary-lg q-mt-md"
        color="primary"
        unelevated
        no-caps
        size="lg"
        icon="mdi-download"
        label="Instalar no aparelho"
        :loading="instalando"
        @click="instalarNativo"
      />

      <q-btn
        class="full-width q-mt-sm"
        flat
        no-caps
        color="grey-7"
        label="Agora não"
        :class="{ 'q-mt-md': modo !== 'nativo' }"
        :disable="instalando"
        @click="pular"
      />
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  clearDeferredInstallPrompt,
  deferredInstallPrompt,
  dismissInstallPrompt,
  isIosDevice,
  isIosSafari,
  shouldOfferPwaInstall,
} from "@/utils/pwa-install";
import { primeiroAcessoPendente } from "@/utils/primeiro-acesso";

const aberto = ref(false);
const instalando = ref(false);
const mostrarManual = ref(false);
const ios = computed(() => isIosDevice());
let delayTimer: ReturnType<typeof setTimeout> | undefined;

const modo = computed<"nativo" | "ios" | "ios-outro" | "manual">(() => {
  if (ios.value) return isIosSafari() ? "ios" : "ios-outro";
  if (deferredInstallPrompt.value && !mostrarManual.value) return "nativo";
  return "manual";
});

const titulo = computed(() =>
  ios.value ? "Instalar o POC no iPhone" : "Instalar o POC no aparelho"
);

const lead = computed(() =>
  ios.value
    ? "A Apple não deixa instalar com um toque. Siga os 3 passos abaixo para o POC aparecer na tela inicial e funcionar sem internet."
    : "Abre pela tela inicial, como um aplicativo, e continua funcionando sem internet no campo."
);

function tentarAbrir() {
  if (primeiroAcessoPendente.value) return;
  if (!shouldOfferPwaInstall()) {
    aberto.value = false;
    return;
  }
  aberto.value = true;
}

onMounted(() => {
  delayTimer = setTimeout(tentarAbrir, 400);
});

onUnmounted(() => {
  clearTimeout(delayTimer);
});

watch(primeiroAcessoPendente, (pendente) => {
  if (!pendente) delayTimer = setTimeout(tentarAbrir, 500);
});

watch(deferredInstallPrompt, (evt) => {
  if (evt && !primeiroAcessoPendente.value && shouldOfferPwaInstall()) aberto.value = true;
});

async function instalarNativo() {
  const evt = deferredInstallPrompt.value;
  if (!evt) {
    mostrarManual.value = true;
    return;
  }
  instalando.value = true;
  try {
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    clearDeferredInstallPrompt();
    if (outcome === "accepted") {
      dismissInstallPrompt();
      aberto.value = false;
    } else {
      mostrarManual.value = true;
    }
  } catch {
    mostrarManual.value = true;
  } finally {
    instalando.value = false;
  }
}

function pular() {
  dismissInstallPrompt();
  aberto.value = false;
}
</script>

<style scoped>
.pwa-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
  border-radius: 22px 22px 0 0;
  padding: 10px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 36px rgba(61, 9, 18, 0.18);
  color: #0f172a;
}

.pwa-sheet--ios {
  border-radius: 22px;
  margin: 16px;
  max-width: calc(100vw - 32px);
  padding: 22px 20px calc(18px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 18px 48px rgba(61, 9, 18, 0.28);
}

.pwa-sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: #dbe3ee;
  margin: 4px auto 16px;
}

.pwa-sheet__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b1b30, #5c0e1c);
  color: #fff;
  margin-bottom: 14px;
}

.pwa-sheet__title {
  margin: 0 0 6px;
  font-size: 1.28rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #3d0912;
  line-height: 1.2;
}

.pwa-sheet__lead {
  margin: 0 0 4px;
  font-size: 14.5px;
  line-height: 1.45;
  color: #4a3b40;
}

.pwa-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13.5px;
  line-height: 1.4;
}

.pwa-alert .q-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.pwa-share {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #f3e6e9;
  color: #7a1225;
  font-weight: 700;
  vertical-align: middle;
}

.pwa-steps {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pwa-steps li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 15px;
  line-height: 1.4;
  color: #1e293b;
}

.pwa-steps__n {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 99px;
  background: #f3e6e9;
  color: #7a1225;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

:global(body.body--dark) .pwa-sheet {
  background: #1c1214;
  color: #f8eef0;
  box-shadow: 0 -12px 36px rgba(0, 0, 0, 0.45);
}

:global(body.body--dark) .pwa-sheet__title {
  color: #fff;
}

:global(body.body--dark) .pwa-sheet__lead,
:global(body.body--dark) .pwa-steps li {
  color: #e8d4d8;
}

:global(body.body--dark) .pwa-steps__n,
:global(body.body--dark) .pwa-share {
  background: rgba(196, 33, 58, 0.22);
  color: #fecdd3;
}

:global(body.body--dark) .pwa-sheet__handle {
  background: #3f2a2e;
}

:global(body.body--dark) .pwa-alert {
  background: rgba(194, 65, 12, 0.18);
  color: #fed7aa;
}
</style>
