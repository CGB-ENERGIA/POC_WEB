<template>
  <q-page class="mobile-page q-pa-md">
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state__icon">
        <q-icon name="mdi-clipboard-text-off-outline" size="36px" color="primary" />
      </div>
      <div class="section-title">Nenhuma observação ainda</div>
      <div class="section-subtitle q-mt-xs q-mb-lg">
        Suas auditagens aparecerão aqui após o envio
      </div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        class="btn-primary-lg"
        label="Registrar primeira observação"
        icon="mdi-plus"
        @click="irNova"
      />
    </div>

    <div v-else class="column q-gutter-md">
      <q-card
        v-for="obs in items"
        :key="obs.id"
        flat
        bordered
        class="mobile-card obs-item q-pa-md"
      >
        <!-- Checklist GOMAN / GSTC -->
        <template v-if="isChecklist(obs)">
          <div class="row items-start no-wrap">
            <div class="col">
              <!-- badges de tipo + status -->
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-badge :color="obs.auditagem === 'GOMAN' ? 'primary' : 'deep-purple'" :label="`Checklist ${obs.auditagem}`" />
                <q-badge outline color="grey-6" :label="obs.base" />
                <span class="text-caption text-grey-5">{{ formatDate(obs.data) }}</span>
                <q-badge
                  :color="syncColor(obs)"
                  :label="syncLabel(obs)"
                  :icon="syncIcon(obs)"
                  class="sync-badge"
                />
              </div>

              <div class="text-subtitle2 text-weight-bold text-grey-9">
                Equipe: {{ obs.equipe || '—' }}
              </div>

              <!-- resumo -->
              <div class="row q-col-gutter-xs q-mt-sm">
                <div class="col-4 text-center">
                  <div class="text-h6 text-weight-bold text-positive">{{ obs.resumo.conformes }}</div>
                  <div class="text-caption text-grey-6">Conformes</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-h6 text-weight-bold text-negative">{{ obs.resumo.naoConformes }}</div>
                  <div class="text-caption text-grey-6">Não conformes</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-h6 text-weight-bold text-primary">{{ obs.resumo.total }}</div>
                  <div class="text-caption text-grey-6">Total</div>
                </div>
              </div>

              <!-- não conformidades -->
              <q-expansion-item
                v-if="obs.resumo.naoConformes > 0"
                dense
                expand-separator
                label="Ver não conformidades"
                class="q-mt-sm"
                header-class="text-caption text-negative"
              >
                <div class="q-pb-sm">
                  <div
                    v-for="nc in naoConformidades(obs)"
                    :key="nc.perguntaId"
                    class="q-mb-sm q-pa-sm nc-resumo"
                  >
                    <div class="text-caption text-weight-bold">{{ nc.categoria }}</div>
                    <div class="text-body2">{{ nc.pergunta }}</div>
                    <div v-if="nc.observacao" class="text-caption text-grey-7 q-mt-xs">
                      {{ nc.observacao }}
                    </div>
                    <img
                      v-if="nc.foto"
                      :src="nc.foto"
                      alt="Evidência"
                      class="nc-evidencia-foto q-mt-sm"
                    />
                  </div>
                </div>
              </q-expansion-item>

              <!-- ações -->
              <div class="row q-gutter-sm q-mt-md">
                <q-btn
                  v-if="obs.syncStatus !== 'synced'"
                  outline
                  dense
                  no-caps
                  color="primary"
                  icon="mdi-cloud-upload-outline"
                  label="Reenviar"
                  :loading="reenviando === obs.id"
                  @click="reenviar(obs)"
                />
                <q-btn
                  outline
                  dense
                  no-caps
                  color="grey-7"
                  icon="mdi-pencil-outline"
                  label="Editar"
                  @click="editar(obs)"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Formulário livre (legado) -->
        <template v-else>
          <div class="row items-start no-wrap">
            <div class="col">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-badge
                  :color="tipoColor(obs.tipo)"
                  :label="tipoLabel(obs.tipo)"
                />
                <q-badge outline color="primary" :label="obs.auditagem ?? '—'" />
                <q-badge outline color="grey-6" :label="obs.base" />
                <span class="text-caption text-grey-5">{{ formatDate(obs.data) }}</span>
              </div>
              <div class="text-subtitle2 text-weight-bold text-grey-9">
                {{ obs.categoria }} · {{ obs.item }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-xs">{{ obs.descricao }}</div>
              <div class="text-caption text-grey-5 q-mt-sm">
                Equipe: {{ obs.equipe }}
                <span v-if="obs.tipo === 'inconforme'"> · {{ obs.severidade }}</span>
              </div>
            </div>
            <q-btn
              flat
              round
              dense
              :icon="obs.resolvido ? 'mdi-check-circle' : 'mdi-clock-outline'"
              :color="obs.resolvido ? 'positive' : 'warning'"
              @click="observacoes.toggleResolvido(obs.id)"
            />
          </div>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore, isChecklist } from "@/stores/observacoes";
import { tiposObservacao } from "@/data/checklist";
import { gomanChecklist } from "@/data/goman-checklist";
import { gstcChecklist } from "@/data/gstc-checklist";
import type { ObservacaoChecklist, RespostaSalva } from "@/types/checklist";

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

const items = computed(() => observacoes.byMatricula(session.matricula));
const reenviando = ref<string | null>(null);

function irNova() {
  const destino =
    session.auditagem === "GOMAN" ? "checklist-goman" : "nova-observacao";
  router.push({ name: destino });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tipoColor(tipo: string) {
  return tiposObservacao.find((t) => t.value === tipo)?.color ?? "grey";
}

function tipoLabel(tipo: string) {
  return tiposObservacao.find((t) => t.value === tipo)?.label ?? tipo;
}

function syncColor(obs: ObservacaoChecklist) {
  const s = obs.syncStatus;
  if (s === "synced") return "positive";
  if (s === "failed") return "negative";
  if (s === "pending") return "warning";
  return "grey-6";
}

function syncLabel(obs: ObservacaoChecklist) {
  const s = obs.syncStatus;
  if (s === "synced") return "Enviado";
  if (s === "failed") return "Falhou";
  if (s === "pending") return "Enviando";
  return "Local";
}

function syncIcon(obs: ObservacaoChecklist) {
  const s = obs.syncStatus;
  if (s === "synced") return "mdi-check-circle";
  if (s === "failed") return "mdi-alert-circle";
  if (s === "pending") return "mdi-sync";
  return "mdi-cloud-off-outline";
}

async function reenviar(obs: ObservacaoChecklist) {
  if (!session.employee) return;
  reenviando.value = obs.id;
  try {
    await observacoes.reenviar(obs.id, session.employee);
    if (obs.syncStatus === "synced") {
      $q.notify({ type: "positive", message: "Checklist enviado com sucesso!", position: "top" });
    } else {
      $q.notify({ type: "negative", message: "Falha ao enviar. Verifique a conexão.", position: "top" });
    }
  } finally {
    reenviando.value = null;
  }
}

function editar(obs: ObservacaoChecklist) {
  const name = obs.auditagem === "GOMAN" ? "checklist-goman" : "checklist-gstc";
  router.push({ name, query: { editId: obs.id } });
}

function naoConformidades(obs: ObservacaoChecklist): RespostaSalva[] {
  const checklist = obs.auditagem === "GOMAN" ? gomanChecklist : gstcChecklist;
  const map = new Map<string, { categoria: string; pergunta: string; gravidade: string; peso: number }>();
  for (const cat of checklist) {
    for (const p of cat.perguntas) {
      map.set(p.id, { categoria: cat.label, pergunta: p.texto, gravidade: p.gravidade, peso: p.peso });
    }
  }

  return obs.respostas
    .filter((r) => r.resposta === "nao_conforme")
    .map((r) => {
      const info = map.get(r.perguntaId);
      return {
        ...r,
        categoria: info?.categoria ?? r.categoria,
        pergunta: info?.pergunta ?? r.pergunta,
        gravidade: info?.gravidade ?? r.gravidade,
        peso: info?.peso ?? r.peso,
      };
    });
}
</script>

<style scoped>
.sync-badge {
  font-size: 10px;
}
.nc-resumo {
  background: rgba(var(--q-negative-rgb, 244, 67, 54), 0.06);
  border-radius: 8px;
  border-left: 3px solid var(--q-negative, #f44336);
}
.nc-evidencia-foto {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
