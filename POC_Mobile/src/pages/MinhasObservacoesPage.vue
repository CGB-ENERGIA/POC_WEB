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

    <div v-else class="column q-gutter-lg">
      <section v-if="emAndamento.length" class="mo-sec">
        <div class="mo-sec__head">
          <div>
            <div class="mo-sec__title">Em andamento</div>
            <div class="mo-sec__sub">Retome pelo Continuar. Não conta na meta.</div>
          </div>
          <span class="mo-sec__count mo-sec__count--draft">{{ emAndamento.length }}</span>
        </div>
        <div class="column q-gutter-md">
          <q-card
            v-for="obs in emAndamento"
            :key="obs.id"
            flat
            bordered
            class="mobile-card obs-item obs-item--draft q-pa-md"
          >
            <div class="row items-center q-gutter-xs q-mb-xs">
              <q-badge :color="obs.auditagem === 'GOMAN' ? 'primary' : 'deep-purple'" :label="`Checklist ${obs.auditagem}`" />
              <q-badge outline color="grey-6" :label="obs.base" />
              <span class="text-caption text-grey-5">{{ formatDate(obs.data) }}</span>
            </div>
            <div class="text-subtitle2 text-weight-bold text-grey-9">
              Equipe: {{ obs.equipe || "—" }}
            </div>
            <div class="mo-progress q-mt-sm">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7">{{ labelProgresso(obs) }}</span>
                <span class="text-caption text-weight-bold" style="color: #c2410c">{{ pctProgresso(obs) }}%</span>
              </div>
              <q-linear-progress
                :value="fracProgresso(obs)"
                color="orange"
                track-color="orange-1"
                rounded
                size="6px"
              />
            </div>
            <q-btn
              class="full-width q-mt-md"
              unelevated
              no-caps
              color="orange"
              icon="mdi-play-circle-outline"
              label="Continuar"
              @click="continuar(obs)"
            />
          </q-card>
        </div>
      </section>

      <section v-if="concluidos.length" class="mo-sec">
        <div class="mo-sec__head">
          <div>
            <div class="mo-sec__title">Concluídos</div>
            <div class="mo-sec__sub">Enviados ou na fila de sincronização</div>
          </div>
          <span class="mo-sec__count">{{ concluidos.length }}</span>
        </div>
        <div class="column q-gutter-md">
      <q-card
        v-for="obs in concluidos"
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

              <div
                v-if="obs.syncStatus && obs.syncStatus !== 'synced'"
                class="sync-hint q-mt-xs"
              >
                <q-icon name="mdi-information-outline" size="14px" />
                <span>{{ syncHint(obs) }}</span>
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

              <!-- banner de reprovação -->
              <div v-if="obs.analiseStatus === 'reprovado'" class="reprovado-aviso q-mt-sm">
                <q-icon name="mdi-close-circle" color="negative" size="16px" class="q-mr-xs" style="flex-shrink:0" />
                <div>
                  <div class="text-caption text-weight-bold text-negative">Checklist reprovado</div>
                  <div v-if="obs.analiseMotivo" class="text-caption text-grey-7 q-mt-xs">
                    <span v-if="obs.analisadoPor" class="text-weight-medium">{{ obs.analisadoPor }}: </span>{{ obs.analiseMotivo }}
                  </div>
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
                    v-if="obs.syncStatus !== 'synced' && obs.analiseStatus !== 'reprovado'"
                    outline
                    dense
                    no-caps
                    color="primary"
                    icon="mdi-cloud-upload-outline"
                    label="Enviar agora"
                    :loading="reenviando === obs.id"
                    @click="reenviar(obs)"
                  />
                  <q-btn
                    v-if="podeEditar(obs) && obs.analiseStatus !== 'reprovado'"
                    outline
                    dense
                    no-caps
                    color="grey-7"
                    icon="mdi-pencil-outline"
                    label="Editar"
                    @click="editar(obs)"
                  />
                  <div v-else-if="obs.analiseStatus !== 'reprovado'" class="text-caption text-grey-5 row items-center">
                    <q-icon name="mdi-lock-outline" size="14px" class="q-mr-xs" />
                    Edição disponível só até 24h após o envio
                  </div>
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
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore, isChecklist } from "@/stores/observacoes";
import { tiposObservacao } from "@/data/checklist";
import { gomanChecklist } from "@/data/goman-checklist";
import { gstcChecklist } from "@/data/gstc-checklist";
import type { ObservacaoChecklist, RespostaSalva } from "@/types/checklist";
import { totalPerguntasAuditagem } from "@/utils/checklist-meta";

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

onMounted(() => {
  if (session.matricula) void observacoes.fetchSynced(session.matricula);
});

const items = computed(() => observacoes.byMatricula(session.matricula));
const emAndamento = computed(() =>
  items.value.filter((o): o is ObservacaoChecklist => isChecklist(o) && o.status === "em_andamento")
);
const concluidos = computed(() =>
  items.value.filter((o) => !isChecklist(o) || o.status !== "em_andamento")
);
const reenviando = ref<string | null>(null);

function labelProgresso(obs: ObservacaoChecklist) {
  const total = totalPerguntasAuditagem(obs.auditagem);
  const feitas = obs.resumo?.total ?? obs.respostas?.length ?? 0;
  return total ? `${feitas} de ${total} respondidas` : `${feitas} respondidas`;
}

function fracProgresso(obs: ObservacaoChecklist) {
  const total = totalPerguntasAuditagem(obs.auditagem);
  const feitas = obs.resumo?.total ?? obs.respostas?.length ?? 0;
  if (!total) return feitas > 0 ? 1 : 0;
  return Math.min(1, feitas / total);
}

function pctProgresso(obs: ObservacaoChecklist) {
  return Math.round(fracProgresso(obs) * 100);
}

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

const isOnline = ref(navigator.onLine);
function updateOnline() { isOnline.value = navigator.onLine; }
onMounted(() => {
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
});
onUnmounted(() => {
  window.removeEventListener("online", updateOnline);
  window.removeEventListener("offline", updateOnline);
});

type SyncVisual = "synced" | "sending" | "queued";

function syncVisual(obs: ObservacaoChecklist): SyncVisual {
  if (obs.syncStatus === "synced") return "synced";
  if (obs.syncStatus === "pending" && isOnline.value && (observacoes.syncing || reenviando.value === obs.id)) {
    return "sending";
  }
  return "queued";
}

function syncColor(obs: ObservacaoChecklist) {
  if (obs.analiseStatus === "reprovado") return "negative";
  if (obs.analiseStatus === "aprovado") return "positive";
  const v = syncVisual(obs);
  if (v === "synced") return "grey-6";
  if (v === "sending") return "info";
  return "warning";
}

function syncLabel(obs: ObservacaoChecklist) {
  if (obs.analiseStatus === "reprovado") return "Reprovado";
  if (obs.analiseStatus === "aprovado") return "Aprovado";
  const v = syncVisual(obs);
  if (v === "synced") return "Enviado";
  if (v === "sending") return "Enviando…";
  return isOnline.value ? "Aguardando envio" : "Na fila";
}

function syncIcon(obs: ObservacaoChecklist) {
  if (obs.analiseStatus === "reprovado") return "mdi-close-circle";
  if (obs.analiseStatus === "aprovado") return "mdi-check-circle";
  const v = syncVisual(obs);
  if (v === "synced") return "mdi-cloud-check-outline";
  if (v === "sending") return "mdi-cloud-sync-outline";
  return isOnline.value ? "mdi-cloud-clock-outline" : "mdi-cloud-off-outline";
}

function syncHint(obs: ObservacaoChecklist) {
  if (!isOnline.value) return "Salvo no aparelho. Envio automático quando a internet voltar.";
  if (syncVisual(obs) === "sending") return "Enviando para o servidor…";
  const motivo = obs.syncError ? `${obs.syncError}. ` : "";
  return `${motivo}Nova tentativa automática em instantes.`;
}

async function reenviar(obs: ObservacaoChecklist) {
  reenviando.value = obs.id;
  const erro = await observacoes.reenviar(obs.id);
  reenviando.value = null;
  if (!erro) {
    $q.notify({ type: "positive", icon: "mdi-cloud-check-outline", message: "Checklist enviado com sucesso!", position: "top" });
  } else if (!navigator.onLine) {
    $q.notify({ type: "info", icon: "mdi-cloud-off-outline", message: erro, position: "top", timeout: 5000 });
  } else {
    $q.notify({
      type: "warning",
      message: `Não foi possível enviar agora: ${erro}`,
      caption: "Continuaremos tentando automaticamente.",
      position: "top",
      timeout: 6000,
    });
  }
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;
function podeEditar(obs: ObservacaoChecklist): boolean {
  return Date.now() - new Date(obs.data).getTime() < UM_DIA_MS;
}

function editar(obs: ObservacaoChecklist) {
  const name = AUDITAGEM_ROTA[obs.auditagem];
  if (name) router.push({ name, query: { editId: obs.id } });
}

const AUDITAGEM_ROTA: Record<string, string> = {
  GOMAN: "checklist-goman",
  GSTC: "checklist-gstc",
  ADMINISTRATIVO: "checklist-administrativo",
  ALOJAMENTO: "checklist-alojamento",
  LOGISTICA: "checklist-logistica",
  OFICINA: "checklist-oficina",
};

function continuar(obs: ObservacaoChecklist) {
  const name = AUDITAGEM_ROTA[obs.auditagem];
  if (name) router.push({ name, query: { continuarId: obs.id } });
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
.mo-sec__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.mo-sec__title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #3d0912;
  line-height: 1.2;
}
.mo-sec__sub {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.35;
  color: #64748b;
}
.mo-sec__count {
  flex-shrink: 0;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
  color: #7a1225;
  background: rgba(122, 18, 37, 0.1);
}
.mo-sec__count--draft {
  color: #c2410c;
  background: #ffedd5;
}
.obs-item--draft {
  border-color: rgba(234, 88, 12, 0.28) !important;
  box-shadow: 0 6px 18px rgba(194, 65, 12, 0.08);
}
.mo-progress {
  background: #fff7ed;
  border-radius: 10px;
  padding: 8px 10px;
}
.sync-badge {
  font-size: 10px;
}
.sync-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 12px;
  line-height: 1.35;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid rgba(217, 119, 6, 0.22);
  border-radius: 8px;
  padding: 6px 8px;
}
.sync-hint .q-icon {
  margin-top: 1px;
  flex-shrink: 0;
}
:global(body.body--dark) .sync-hint {
  color: #fcd34d;
  background: rgba(217, 119, 6, 0.14);
  border-color: rgba(252, 211, 77, 0.28);
}
.nc-resumo {
  background: rgba(var(--q-negative-rgb, 244, 67, 54), 0.06);
  border-radius: 8px;
  border-left: 3px solid var(--q-negative, #f44336);
}
.reprovado-aviso {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #fef2f2;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 8px;
  padding: 8px 10px;
}
.nc-evidencia-foto {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
