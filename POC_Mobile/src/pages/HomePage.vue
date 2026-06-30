<template>
  <q-page class="mobile-page q-pa-md">
    <div class="welcome-banner q-mb-lg">
      <div class="welcome-banner__badge q-mb-sm">
        <q-icon name="mdi-shield-check" size="14px" />
        {{ session.auditagemLabel }}
      </div>
      <div class="text-h6 text-weight-bold">Olá, {{ session.displayName }}!</div>
      <div class="text-body2 q-mt-xs" style="opacity: 0.88">
        {{ session.matricula }} · Meta: {{ meta }} observações/mês
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
          <div class="text-subtitle2 text-weight-bold">{{ totalMes }} deste mês</div>
          <div class="text-caption" style="opacity: 0.82">
            {{ totalGeral }} registro{{ totalGeral !== 1 ? "s" : "" }} no total
          </div>
        </div>
      </div>
    </div>

    <div class="section-title q-mb-sm">O que deseja fazer?</div>

    <div class="column q-gutter-md">
      <q-card
        flat
        class="action-tile action-tile--primary cursor-pointer"
        @click="irNovaObservacao"
      >
        <q-card-section class="row items-center no-wrap q-pa-none">
          <div class="action-tile__accent" />
          <div class="row items-center no-wrap col q-pa-lg">
            <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
              <q-icon name="mdi-clipboard-check-outline" size="28px" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ session.auditagem === "GOMAN" ? "Iniciar Checklist GOMAN" : "Nova Observação" }}
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ session.auditagem === "GOMAN"
                  ? `${totalPerguntasGoman} perguntas · Conforme / Não conforme`
                  : "Registrar checklist de segurança" }}
              </div>
            </div>
            <q-icon name="mdi-chevron-right" size="24px" color="primary" />
          </div>
        </q-card-section>
      </q-card>

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
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import { totalPerguntasGoman } from "@/data/goman-checklist";

const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

const matricula = computed(() => session.matricula);
const meta = computed(() => session.employee?.meta ?? 4);

const minhasObs = computed(() =>
  observacoes.byMatricula(matricula.value)
);

const totalGeral = computed(() => minhasObs.value.length);

const totalMes = computed(() => {
  const now = new Date();
  const mes = now.getMonth();
  const ano = now.getFullYear();
  return minhasObs.value.filter((o) => {
    const d = new Date(o.data);
    return d.getMonth() === mes && d.getFullYear() === ano;
  }).length;
});

const metaProgress = computed(() =>
  Math.min(100, Math.round((totalMes.value / meta.value) * 100))
);

function irNovaObservacao() {
  const destino =
    session.auditagem === "GOMAN" ? "checklist-goman" : "nova-observacao";
  router.push({ name: destino });
}
</script>
