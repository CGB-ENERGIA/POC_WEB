<template>
  <q-dialog
    v-model="aberto"
    persistent
    transition-show="fade"
    transition-hide="fade"
  >
    <div class="pa-guide">
      <div class="pa-guide__top">
        <BrandLogo :size="36" show-text :title="BRAND.product" subtitle="" />
        <button type="button" class="pa-guide__skip" @click="concluir">
          Pular
        </button>
      </div>

      <div class="pa-guide__dots" aria-label="Progresso do tutorial">
        <span
          v-for="(s, i) in passos"
          :key="s.id"
          class="pa-guide__dot"
          :class="{ 'pa-guide__dot--on': i === passo, 'pa-guide__dot--done': i < passo }"
        />
      </div>

      <div class="pa-guide__icon" aria-hidden="true">
        <q-icon :name="atual.icon" size="32px" />
      </div>

      <h2 class="pa-guide__title">{{ atual.title }}</h2>
      <p class="pa-guide__lead">{{ atual.lead }}</p>

      <ul v-if="atual.id !== 'instalar'" class="pa-guide__list">
        <li v-for="item in atual.items" :key="item">
          <q-icon name="mdi-check-circle" size="18px" />
          <span>{{ item }}</span>
        </li>
      </ul>

      <div v-else class="pa-install">
        <ol v-if="ios" class="pwa-steps">
          <li>
            <span class="pwa-steps__n">1</span>
            <span>Toque em <b>Compartilhar</b> na barra do Safari.</span>
          </li>
          <li>
            <span class="pwa-steps__n">2</span>
            <span>Escolha <b>Adicionar à Tela de Início</b>.</span>
          </li>
          <li>
            <span class="pwa-steps__n">3</span>
            <span>Confirme em <b>Adicionar</b>.</span>
          </li>
        </ol>
        <ol v-else-if="!podeInstalarNativo" class="pwa-steps">
          <li>
            <span class="pwa-steps__n">1</span>
            <span>Abra o menu do navegador.</span>
          </li>
          <li>
            <span class="pwa-steps__n">2</span>
            <span>Toque em <b>Instalar app</b>.</span>
          </li>
        </ol>
        <q-btn
          v-if="podeInstalarNativo"
          class="full-width btn-primary-lg q-mb-sm"
          color="primary"
          unelevated
          no-caps
          size="lg"
          icon="mdi-download"
          label="Instalar agora"
          :loading="instalando"
          @click="instalarNativo"
        />
      </div>

      <div class="pa-guide__actions">
        <q-btn
          v-if="passo > 0"
          flat
          no-caps
          color="grey-7"
          label="Voltar"
          class="col"
          @click="passo -= 1"
        />
        <q-btn
          class="col btn-primary-lg"
          color="primary"
          unelevated
          no-caps
          size="lg"
          :label="ultimo ? 'Começar a registrar' : 'Próximo'"
          :icon-right="ultimo ? 'mdi-badge-account-outline' : 'mdi-arrow-right'"
          @click="avancar"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "@/stores/session";
import BrandLogo from "@/components/BrandLogo.vue";
import { BRAND } from "@/constants/brand";
import { concluirPrimeiroAcesso, primeiroAcessoPendente } from "@/utils/primeiro-acesso";
import {
  clearDeferredInstallPrompt,
  deferredInstallPrompt,
  dismissInstallPrompt,
  isIosDevice,
  shouldOfferPwaInstall,
} from "@/utils/pwa-install";

const session = useSessionStore();
const aberto = ref(false);
const passo = ref(0);
const instalando = ref(false);
const ios = computed(() => isIosDevice());
const podeInstalarNativo = computed(() => !!deferredInstallPrompt.value && !ios.value);

const passosBase = [
  {
    id: "boas-vindas",
    icon: "mdi-shield-check-outline",
    title: "Bem-vindo ao POC",
    lead: "Este é o app de observação de segurança da CGB. Não precisa criar conta nova.",
    items: [
      "Funciona no celular e no tablet, inclusive sem internet.",
      "Cada checklist finalizado conta na sua meta da semana.",
    ],
  },
  {
    id: "matricula",
    icon: "mdi-badge-account-outline",
    title: "Entre com a matrícula",
    lead: "O cadastro já existe no sistema. Você só confirma quem é.",
    items: [
      "Digite ou busque sua matrícula CGB.",
      "Confira se o nome, a função e a base estão certos.",
      "Toque em Continuar.",
    ],
  },
  {
    id: "aparelho",
    icon: "mdi-fingerprint",
    title: "Cadastre neste aparelho",
    lead: "Na primeira vez, vale deixar Face ID ou digital para o próximo acesso ser mais rápido.",
    items: [
      "Se o aparelho tiver sensor, o POC pede para cadastrar digital ou face.",
      "Tablets sem sensor entram só pela matrícula.",
      "Isso fica neste aparelho — em outro, é só repetir.",
    ],
  },
  {
    id: "usar",
    icon: "mdi-clipboard-check-outline",
    title: "Depois de entrar",
    lead: "O registro da observação segue estes passos no campo.",
    items: [
      "Escolha o checklist (GOMAN, GSTC, Administrativo…).",
      "Responda todos os grupos: Conforme ou Não conforme.",
      "Tire as fotos obrigatórias e toque em Finalizar.",
    ],
  },
];

const passoInstalar = {
  id: "instalar",
  icon: "mdi-cellphone-arrow-down",
  title: "Instalar no aparelho",
  lead: "Coloque o POC na tela inicial para abrir como aplicativo e funcionar sem internet no campo.",
  items: [] as string[],
};

const passos = computed(() =>
  shouldOfferPwaInstall() ? [...passosBase, passoInstalar] : passosBase
);

const atual = computed(() => passos.value[passo.value] ?? passosBase[0]);
const ultimo = computed(() => passo.value >= passos.value.length - 1);

onMounted(() => {
  if (!primeiroAcessoPendente.value) return;
  if (session.isAuthenticated) {
    concluirPrimeiroAcesso();
    return;
  }
  aberto.value = true;
});

async function instalarNativo() {
  const evt = deferredInstallPrompt.value;
  if (!evt) return;
  instalando.value = true;
  try {
    await evt.prompt();
    await evt.userChoice;
    clearDeferredInstallPrompt();
    dismissInstallPrompt();
  } catch {
    /* usuário cancelou o prompt nativo */
  } finally {
    instalando.value = false;
  }
}

function avancar() {
  if (ultimo.value) {
    concluir();
    return;
  }
  passo.value += 1;
}

function concluir() {
  if (atual.value.id === "instalar") dismissInstallPrompt();
  concluirPrimeiroAcesso();
  aberto.value = false;
}
</script>

<style scoped>
.pa-guide {
  width: min(420px, 100%);
  margin: 12px;
  background: #fff;
  border-radius: 24px;
  padding: 18px 20px 20px;
  box-shadow: 0 18px 48px rgba(61, 9, 18, 0.28);
  color: #0f172a;
}

.pa-guide__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.pa-guide__skip {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  padding: 0 4px;
}

.pa-guide__dots {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}

.pa-guide__dot {
  height: 6px;
  flex: 1;
  border-radius: 99px;
  background: #e8dfe1;
}

.pa-guide__dot--on {
  background: #7a1225;
}

.pa-guide__dot--done {
  background: #c4a4ab;
}

.pa-guide__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b1b30, #5c0e1c);
  color: #fff;
  margin-bottom: 14px;
}

.pa-guide__title {
  margin: 0 0 8px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #3d0912;
  line-height: 1.2;
}

.pa-guide__lead {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.45;
  color: #4a3b40;
}

.pa-guide__list {
  list-style: none;
  margin: 0 0 18px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pa-guide__list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14.5px;
  line-height: 1.4;
  color: #1e293b;
}

.pa-guide__list .q-icon {
  color: #7a1225;
  margin-top: 2px;
  flex-shrink: 0;
}

.pwa-steps {
  list-style: none;
  margin: 4px 0 12px;
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

.pa-guide__actions {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

:global(body.body--dark) .pa-guide {
  background: #1c1214;
  color: #f8eef0;
}

:global(body.body--dark) .pa-guide__title {
  color: #fff;
}

:global(body.body--dark) .pa-guide__lead,
:global(body.body--dark) .pa-guide__list li {
  color: #e8d4d8;
}

:global(body.body--dark) .pa-guide__skip {
  color: #c4b5b8;
}

:global(body.body--dark) .pa-guide__dot {
  background: #3f2a2e;
}

:global(body.body--dark) .pa-guide__dot--on {
  background: #e11d48;
}

:global(body.body--dark) .pwa-steps li {
  color: #e8d4d8;
}

:global(body.body--dark) .pwa-steps__n {
  background: rgba(196, 33, 58, 0.22);
  color: #fecdd3;
}
</style>
