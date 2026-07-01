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
            {{ totalPeriodo }} deste{{ periodo === "semana" ? "a semana" : " mês" }}
          </div>
          <div class="text-caption" style="opacity: 0.82">
            {{ totalGeral }} {{ totalGeral === 1 ? "registro" : "registros" }} no total
          </div>
        </div>
      </div>
    </div>

    <div class="section-title q-mb-sm">O que deseja fazer?</div>

    <div class="column q-gutter-md">
      <!-- Checklist GOMAN -->
      <q-card
        flat
        class="action-tile action-tile--primary cursor-pointer"
        @click="$router.push({ name: 'checklist-goman' })"
      >
        <q-card-section class="row items-center no-wrap q-pa-none">
          <div class="action-tile__accent" />
          <div class="row items-center no-wrap col q-pa-lg">
            <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
              <q-icon name="mdi-wrench-outline" size="28px" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">Checklist GOMAN</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ totalPerguntasGoman }} perguntas · Conforme / Não conforme
              </div>
            </div>
            <q-icon name="mdi-chevron-right" size="24px" color="primary" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Checklist GSTC -->
      <q-card
        flat
        class="action-tile action-tile--primary cursor-pointer"
        @click="$router.push({ name: 'nova-observacao' })"
      >
        <q-card-section class="row items-center no-wrap q-pa-none">
          <div class="action-tile__accent" />
          <div class="row items-center no-wrap col q-pa-lg">
            <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
              <q-icon name="mdi-crane" size="28px" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">Checklist GSTC</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Registrar observação de segurança
              </div>
            </div>
            <q-icon name="mdi-chevron-right" size="24px" color="primary" />
          </div>
        </q-card-section>
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
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import { totalPerguntasGoman } from "@/data/goman-checklist";
import { getMetaMensal, getMetaSemanal, META_SEMANAL_PADRAO, diasUteisNoMes } from "@/data/employees";

type PeriodoVisao = "semana" | "mes";

const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();
const periodo = ref<PeriodoVisao>("mes");

const matricula = computed(() => session.matricula);
const metaMensal = computed(() => {
  const now = new Date()
  if (session.employee) return getMetaMensal(session.employee, now)
  const dias = diasUteisNoMes(now.getFullYear(), now.getMonth() + 1)
  return Math.min(Math.round(META_SEMANAL_PADRAO * dias / 5), 20)
});
const metaSemanal = computed(() =>
  session.employee ? getMetaSemanal(session.employee) : META_SEMANAL_PADRAO
);

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

function semanaDoMes(date: Date) {
  return Math.ceil(date.getDate() / 7);
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
