<template>
  <q-page class="mobile-page q-pa-md">
    <!-- Saudação -->
    <div class="q-mb-lg">
      <div class="text-h6 text-weight-bold text-grey-9">
        Olá, {{ session.displayName }}!
      </div>
      <div class="text-body2 text-grey-6 q-mt-xs">
        {{ session.matricula }} · {{ session.auditagemLabel }} · Meta mensal: {{ meta }} observações
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-6">
        <q-card flat bordered class="mobile-card q-pa-md text-center">
          <div class="text-h5 text-weight-bold text-primary">{{ totalMes }}</div>
          <div class="text-caption text-grey-6">Este mês</div>
        </q-card>
      </div>
      <div class="col-6">
        <q-card flat bordered class="mobile-card q-pa-md text-center">
          <div class="text-h5 text-weight-bold" :class="metaClass">{{ metaProgress }}%</div>
          <div class="text-caption text-grey-6">Da meta</div>
        </q-card>
      </div>
    </div>

    <!-- Ações principais -->
    <div class="column q-gutter-md">
      <q-card
        flat
        bordered
        class="mobile-card action-tile cursor-pointer"
        @click="irNovaObservacao"
      >
        <q-card-section class="row items-center no-wrap q-pa-lg">
          <q-avatar color="primary" text-color="white" size="56px" class="q-mr-md">
            <q-icon name="mdi-plus" size="28px" />
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">
              {{ session.auditagem === "GOMAN" ? "Checklist GOMAN" : "Nova Observação" }}
            </div>
            <div class="text-caption text-grey-6">
              {{ session.auditagem === "GOMAN"
                ? `${totalPerguntasGoman} perguntas · Conforme / Não conforme`
                : "Registrar checklist de segurança" }}
            </div>
          </div>
          <q-icon name="mdi-chevron-right" size="24px" color="grey-5" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="mobile-card action-tile cursor-pointer"
        @click="$router.push({ name: 'minhas-observacoes' })"
      >
        <q-card-section class="row items-center no-wrap q-pa-lg">
          <q-avatar color="grey-3" text-color="primary" size="56px" class="q-mr-md">
            <q-icon name="mdi-format-list-checks" size="28px" />
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">Minhas Observações</div>
            <div class="text-caption text-grey-6">
              {{ totalGeral }} registro{{ totalGeral !== 1 ? "s" : "" }} salvos
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

const metaClass = computed(() =>
  metaProgress.value >= 100 ? "text-positive" : "text-primary"
);

function irNovaObservacao() {
  const destino =
    session.auditagem === "GOMAN" ? "checklist-goman" : "nova-observacao";
  router.push({ name: destino });
}
</script>
