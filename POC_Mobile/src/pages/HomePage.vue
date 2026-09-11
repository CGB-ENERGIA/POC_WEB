<template>
  <q-page class="mobile-page q-pa-md">
    <div class="welcome-banner q-mb-lg">
      <div class="welcome-banner__badge q-mb-sm">
        <q-icon name="mdi-shield-check" size="14px" />
        {{ session.auditagemLabel }}
      </div>
      <div class="text-h6 text-weight-bold">Olá, {{ session.displayName }}!</div>
      <div class="text-body2 q-mt-xs" style="opacity: 0.88">
        {{ session.matricula }} · Meta: {{ metaAtual }} {{ metaAtual === 1 ? "observação" : "observações" }}/{{ periodoLabel }}
      </div>

      <div class="welcome-banner__period q-mt-md">
        <button
          type="button"
          class="welcome-banner__period-btn"
          :class="{ 'welcome-banner__period-btn--active': periodo === 'semana' }"
          @click="periodo = 'semana'"
        >
          Semana
        </button>
        <button
          type="button"
          class="welcome-banner__period-btn"
          :class="{ 'welcome-banner__period-btn--active': periodo === 'mes' }"
          @click="periodo = 'mes'"
        >
          Mês
        </button>
      </div>

      <div class="row items-center q-mt-md q-gutter-md">
        <q-circular-progress
          :value="metaProgress / 100"
          size="54px"
          :thickness="0.2"
          color="white"
          track-color="rgba(255,255,255,0.25)"
          show-value
          class="text-weight-bold"
        >
          {{ metaProgress }}%
        </q-circular-progress>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            {{ totalPeriodo }} {{ periodo === "semana" ? "desta semana" : "deste mês" }}
          </div>
          <div class="text-caption" style="opacity: 0.82">
            {{ totalGeral }} {{ totalGeral === 1 ? "registro" : "registros" }} no total
          </div>
        </div>
      </div>
    </div>

    <div class="section-title q-mb-sm">O que deseja fazer?</div>

    <div class="column q-gutter-md">

      <!-- Grupo OPERACIONAL -->
      <q-card flat class="action-tile action-tile--primary">
        <!-- Cabeçalho do grupo -->
        <q-card-section
          class="row items-center no-wrap q-pa-none cursor-pointer"
          @click="operacionalAberto = !operacionalAberto"
        >
          <div class="action-tile__accent" />
          <div class="row items-center no-wrap col q-pa-lg">
            <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
              <q-icon name="mdi-clipboard-list-outline" size="28px" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">Operacional</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Checklist de campo · GOMAN / GSTC
              </div>
            </div>
            <q-icon
              :name="operacionalAberto ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="24px" color="primary"
              style="transition: transform .2s"
            />
          </div>
        </q-card-section>

        <!-- Sub-opções expansíveis -->
        <q-slide-transition>
          <div v-if="operacionalAberto">
            <q-separator />

            <!-- GOMAN -->
            <q-item
              clickable v-ripple
              class="sub-option"
              @click="$router.push({ name: 'checklist-goman' })"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-wrench-outline" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Checklist GOMAN</q-item-label>
                <q-item-label caption>{{ totalPerguntasGoman }} perguntas · Conforme / Não conforme</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="mdi-chevron-right" color="primary" />
              </q-item-section>
            </q-item>

            <q-separator inset="item" />

            <!-- GSTC -->
            <q-item
              clickable v-ripple
              class="sub-option"
              @click="$router.push({ name: 'checklist-gstc' })"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-crane" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Checklist GSTC</q-item-label>
                <q-item-label caption>{{ totalPerguntasGstc }} perguntas · Conforme / Não conforme</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="mdi-chevron-right" color="primary" />
              </q-item-section>
            </q-item>
          </div>
        </q-slide-transition>
      </q-card>

      <!-- Grupo ADMINISTRATIVO -->
      <q-card flat class="action-tile action-tile--primary">
        <q-card-section
          class="row items-center no-wrap q-pa-none cursor-pointer"
          @click="administrativoAberto = !administrativoAberto"
        >
          <div class="action-tile__accent" />
          <div class="row items-center no-wrap col q-pa-lg">
            <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
              <q-icon name="mdi-office-building-outline" size="28px" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">Administrativo</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Escritório · Alojamento · Logística · Oficina
              </div>
            </div>
            <q-icon
              :name="administrativoAberto ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="24px" color="primary"
              style="transition: transform .2s"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <div v-if="administrativoAberto">
            <q-separator />

            <q-item clickable v-ripple class="sub-option" @click="$router.push({ name: 'checklist-administrativo' })">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-domain" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Administrativo</q-item-label>
                <q-item-label caption>EPI · Procedimento · Instalações prediais</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="mdi-chevron-right" color="primary" /></q-item-section>
            </q-item>

            <q-separator inset="item" />

            <q-item clickable v-ripple class="sub-option" @click="$router.push({ name: 'checklist-alojamento' })">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-home-outline" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Alojamento</q-item-label>
                <q-item-label caption>Repúblicas · Higiene · Estrutura</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="mdi-chevron-right" color="primary" /></q-item-section>
            </q-item>

            <q-separator inset="item" />

            <q-item clickable v-ripple class="sub-option" @click="$router.push({ name: 'checklist-logistica' })">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-truck-outline" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Logística</q-item-label>
                <q-item-label caption>APR · EPI · Veículos e equipamentos</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="mdi-chevron-right" color="primary" /></q-item-section>
            </q-item>

            <q-separator inset="item" />

            <q-item clickable v-ripple class="sub-option" @click="$router.push({ name: 'checklist-oficina' })">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="mdi-car-wrench" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Oficina</q-item-label>
                <q-item-label caption>EPI · Procedimento · Segurança veicular</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="mdi-chevron-right" color="primary" /></q-item-section>
            </q-item>
          </div>
        </q-slide-transition>
      </q-card>

      <!-- Minhas Observações -->
      <q-card
        flat
        class="action-tile cursor-pointer"
        @click="$router.push({ name: 'minhas-observacoes' })"
      >
        <q-card-section class="row items-center no-wrap q-pa-lg">
          <q-avatar color="grey-2" text-color="primary" size="56px" class="q-mr-md">
            <q-icon name="mdi-format-list-checks" size="28px" />
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">Minhas Observações</div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Consultar histórico e não conformidades
            </div>
          </div>
          <q-icon name="mdi-chevron-right" size="24px" color="grey-5" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { LocalStorage } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import { totalPerguntasGoman } from "@/data/goman-checklist";
import { totalPerguntasGstc } from "@/data/gstc-checklist";
import { PERIODO_VISAO_STORAGE_KEY } from "@/constants/theme";
import { useGoals } from "@/composables/useGoals";

type PeriodoVisao = "semana" | "mes";

function loadPeriodoSalvo(): PeriodoVisao {
  const saved = LocalStorage.getItem<string | null>(PERIODO_VISAO_STORAGE_KEY);
  return saved === "semana" || saved === "mes" ? saved : "mes";
}

const session = useSessionStore();
const observacoes = useObservacoesStore();
const periodo = ref<PeriodoVisao>(loadPeriodoSalvo());
const operacionalAberto = ref(false);
const administrativoAberto = ref(false);
const { getGoal, ensureLoaded } = useGoals();

watch(periodo, (valor) => {
  LocalStorage.set(PERIODO_VISAO_STORAGE_KEY, valor);
});

onMounted(() => {
  void ensureLoaded();
  if (session.matricula) void observacoes.fetchSynced(session.matricula);
});

const matricula = computed(() => session.matricula);

const metaSemanal = computed(() => {
  const now = new Date();
  return getGoal(session.employee?.gerencia, now.getFullYear(), now.getMonth() + 1).semanal;
});

const metaMensal = computed(() => {
  const now = new Date();
  return getGoal(session.employee?.gerencia, now.getFullYear(), now.getMonth() + 1).mensal;
});

const metaAtual = computed(() =>
  periodo.value === "semana" ? metaSemanal.value : metaMensal.value
);

const periodoLabel = computed(() =>
  periodo.value === "semana" ? "semana" : "mês"
);

const minhasObs = computed(() =>
  observacoes.byMatricula(matricula.value)
);

const totalGeral = computed(() => minhasObs.value.length);

function semanaDoMes(date: Date): number {
  const d = date.getDate();
  if (d <= 8)  return 1;
  if (d <= 15) return 2;
  if (d <= 22) return 3;
  return 4;
}

function isMesmoMes(date: Date, ref: Date) {
  return (
    date.getMonth() === ref.getMonth() &&
    date.getFullYear() === ref.getFullYear()
  );
}

function isMesmaSemanaDoMes(date: Date, ref: Date) {
  return isMesmoMes(date, ref) && semanaDoMes(date) === semanaDoMes(ref);
}

const totalMes = computed(() => {
  const now = new Date();
  return minhasObs.value.filter((o) => isMesmoMes(new Date(o.data), now)).length;
});

const totalSemana = computed(() => {
  const now = new Date();
  return minhasObs.value.filter((o) =>
    isMesmaSemanaDoMes(new Date(o.data), now)
  ).length;
});

const totalPeriodo = computed(() =>
  periodo.value === "semana" ? totalSemana.value : totalMes.value
);

const metaProgress = computed(() =>
  Math.min(100, Math.round((totalPeriodo.value / metaAtual.value) * 100))
);
</script>

<style scoped>
.sub-option {
  padding: 12px 16px;
  min-height: 64px;
}
</style>
