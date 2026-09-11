<template>
  <div class="ac-tab">
    <q-linear-progress v-if="loading" indeterminate color="primary" style="position:sticky;top:0;z-index:200" />

    <!-- KPIs -->
    <div class="kpi-row q-mb-md">
      <div class="kpi-mini" style="--kc:#d97706;--kbg:rgba(217,119,6,.1)">
        <q-icon name="mdi-clock-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ pendentes.length }}</div>
        <div class="kpi-mini__label">Aguardando</div>
      </div>
      <div class="kpi-mini" style="--kc:#16a34a;--kbg:rgba(22,163,74,.1)">
        <q-icon name="mdi-check-circle-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ aprovados.length }}</div>
        <div class="kpi-mini__label">Aprovados</div>
      </div>
      <div class="kpi-mini" style="--kc:#dc2626;--kbg:rgba(220,38,38,.1)">
        <q-icon name="mdi-close-circle-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ reprovados.length }}</div>
        <div class="kpi-mini__label">Reprovados</div>
      </div>
      <div class="kpi-mini" style="--kc:#8B1C2B;--kbg:rgba(139,28,43,.1)">
        <q-icon name="mdi-gauge" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ taxaAprovacao }}%</div>
        <div class="kpi-mini__label">Taxa Aprovação</div>
      </div>
    </div>

    <!-- Erro -->
    <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      <template #avatar><q-icon name="mdi-alert-circle-outline" /></template>
      {{ loadError }}
      <template #action><q-btn flat label="Tentar novamente" @click="recarregar" /></template>
    </q-banner>

    <!-- Filtros -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <button
        v-for="s in statusOpts" :key="s.value"
        :class="['pill', filtroStatus === s.value && 'pill--active']"
        @click="filtroStatus = s.value"
      >
        <q-icon :name="s.icon" size="14px" class="q-mr-xs" />
        {{ s.label }}
        <q-badge v-if="contagem(s.value) > 0" :color="s.badgeColor" :label="contagem(s.value)" class="q-ml-xs" />
      </button>
      <q-input v-model="search" dense outlined placeholder="Buscar..." class="search-input q-ml-auto" style="min-width:200px">
        <template #prepend><q-icon name="mdi-magnify" size="18px" color="grey-6" /></template>
      </q-input>
    </div>

    <!-- Lista -->
    <div class="analise-list">
      <div v-if="listaFiltrada.length === 0" class="analise-empty">
        <q-icon name="mdi-check-all" size="48px" color="grey-4" />
        <div class="text-grey-5 q-mt-sm">Nenhum checklist encontrado</div>
      </div>

      <div
        v-for="item in listaFiltrada"
        :key="item.id"
        class="analise-item"
        :class="`analise-item--${item.status}`"
      >
        <!-- Cabeçalho -->
        <div class="analise-item__header">
          <div class="analise-item__meta">
            <span class="status-badge" :class="`status-badge--${item.status}`">
              <q-icon :name="statusIcon(item.status)" size="13px" class="q-mr-xs" />
              {{ statusLabel(item.status) }}
            </span>
            <span class="aud-badge">{{ auditagemLabel(item.auditagem) }}</span>
            <span class="base-badge">{{ item.base }}</span>
            <span class="td-mono" style="font-size:11px;color:#94a3b8">{{ item.equipe }}</span>
          </div>
          <div class="analise-item__date">{{ fmtDate(item.data) }}</div>
        </div>

        <!-- Corpo -->
        <div class="analise-item__body">
          <div class="analise-item__enviado">
            <q-icon name="mdi-account" size="14px" color="grey-5" class="q-mr-xs" />
            Observador: <strong>{{ item.observador }}</strong>
            <span v-if="item.membros?.length"> · Equipe: {{ item.membros.map(m => m.nome).join(", ") }}</span>
          </div>

          <div class="checklist-resumo">
            <div class="cr-chip cr-chip--total">
              <q-icon name="mdi-clipboard-list-outline" size="14px" />
              {{ item.resumo?.total ?? 0 }} itens
            </div>
            <div class="cr-chip cr-chip--ok">
              <q-icon name="mdi-check" size="14px" />
              {{ item.resumo?.conformes ?? 0 }} conformes
            </div>
            <div class="cr-chip cr-chip--nc">
              <q-icon name="mdi-close" size="14px" />
              {{ item.resumo?.naoConformes ?? 0 }} não conformes
            </div>
          </div>

          <!-- Comentário da análise -->
          <div v-if="item.comentario_analise" class="analise-item__comentario" :class="`analise-item__comentario--${item.status}`">
            <q-icon name="mdi-message-text-outline" size="14px" class="q-mr-xs" />
            <span><strong>{{ item.analisado_por }}</strong>: {{ item.comentario_analise }}</span>
          </div>

          <!-- Ver respostas (expandível) -->
          <div class="ac-expand">
            <button class="ac-expand__btn" @click="toggleExpand(item.id)">
              <q-icon :name="expandedId === item.id ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="16px" />
              {{ expandedId === item.id ? "Ocultar respostas" : "Ver respostas do checklist" }}
            </button>
            <div v-if="expandedId === item.id" class="ac-expand__body">
              <q-spinner v-if="loadingResp" color="primary" size="20px" />
              <div v-else-if="!respostasExpand.length" class="text-caption text-grey-5">Nenhuma resposta encontrada.</div>
              <div v-else class="ac-resp-list">
                <div v-for="r in respostasExpand" :key="r.pergunta_id" class="ac-resp-row">
                  <q-icon
                    :name="r.resposta === 'conforme' ? 'mdi-check-circle' : 'mdi-close-circle'"
                    :color="r.resposta === 'conforme' ? 'positive' : 'negative'"
                    size="16px"
                  />
                  <div class="ac-resp-row__text">
                    <div class="ac-resp-row__pergunta">{{ r.pergunta }}</div>
                    <div v-if="r.observacao" class="ac-resp-row__obs">{{ r.observacao }}</div>
                  </div>
                  <img
                    v-if="fotoUrl(r.foto_r2_key)"
                    :src="fotoUrl(r.foto_r2_key)!"
                    class="ac-resp-row__foto"
                    @click="abrirFoto(fotoUrl(r.foto_r2_key)!)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="analise-item__actions">
          <template v-if="item.status === 'pendente'">
            <q-btn
              unelevated color="positive" icon="mdi-check" label="Aprovar"
              size="sm" class="q-mr-sm"
              @click="abrirAcao(item, 'aprovado')"
            />
            <q-btn
              unelevated color="negative" icon="mdi-close" label="Reprovar"
              size="sm" class="q-mr-sm"
              @click="abrirAcao(item, 'reprovado')"
            />
          </template>
          <template v-else>
            <q-btn
              flat size="sm" color="grey-7"
              :icon="item.status === 'aprovado' ? 'mdi-close' : 'mdi-check'"
              :label="item.status === 'aprovado' ? 'Reverter p/ reprovado' : 'Reverter p/ aprovado'"
              @click="abrirAcao(item, item.status === 'aprovado' ? 'reprovado' : 'aprovado')"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Dialog aprovar/reprovar -->
    <q-dialog v-model="acaoDialog.open" persistent>
      <q-card style="min-width:340px;max-width:480px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <q-icon
            :name="acaoDialog.tipo === 'aprovado' ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="acaoDialog.tipo === 'aprovado' ? 'positive' : 'negative'"
            size="24px" class="q-mr-sm"
          />
          <div class="text-subtitle1 text-weight-bold">
            {{ acaoDialog.tipo === 'aprovado' ? 'Aprovar Checklist' : 'Reprovar Checklist' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="acaoDialog.open = false" />
        </q-card-section>
        <q-card-section>
          <div v-if="acaoDialog.tipo === 'reprovado'" class="text-caption text-grey-7 q-mb-sm">
            O checklist reprovado será desconsiderado nas métricas e não contará mais para o colaborador no PWA.
          </div>
          <q-input
            v-model="acaoDialog.analisadoPor"
            outlined dense label="Seu nome"
            placeholder="Quem está analisando"
            class="q-mb-sm"
            :disable="acaoDialog.saving"
          />
          <q-input
            v-model="acaoDialog.comentario"
            outlined dense type="textarea" rows="3"
            :label="acaoDialog.tipo === 'reprovado' ? 'Motivo da reprovação *' : 'Comentário (opcional)'"
            :placeholder="acaoDialog.tipo === 'reprovado' ? 'Explique o motivo...' : 'Observações...'"
            :disable="acaoDialog.saving"
          />
          <div v-if="acaoDialog.error" class="text-negative text-caption q-mt-xs">
            <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ acaoDialog.error }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="acaoDialog.open = false" :disable="acaoDialog.saving" />
          <q-btn
            unelevated
            :color="acaoDialog.tipo === 'aprovado' ? 'positive' : 'negative'"
            :label="acaoDialog.tipo === 'aprovado' ? 'Confirmar Aprovação' : 'Confirmar Reprovação'"
            :loading="acaoDialog.saving"
            :disable="!acaoDialog.analisadoPor.trim() || (acaoDialog.tipo === 'reprovado' && !acaoDialog.comentario.trim())"
            @click="confirmarAcao"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Lightbox foto -->
    <q-dialog v-model="fotoDialog.open">
      <q-card style="max-width:90vw;max-height:90vh;overflow:hidden;background:transparent;box-shadow:none">
        <img :src="fotoDialog.url" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px" />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import {
  fetchChecklistsParaAnalise,
  atualizarStatusChecklist,
  fetchResponses,
  type ChecklistParaAnalise,
  type ResponseRow,
  type AnaliseStatus,
} from "@/lib/dashboard";

const R2_PUBLIC_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string ?? "").replace(/\/$/, "");

function fotoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (!R2_PUBLIC_BASE) return null;
  return `${R2_PUBLIC_BASE}/${key}`;
}

const AUDITAGEM_LABELS: Record<string, string> = {
  GOMAN: "GOMAN",
  GSTC: "GSTC",
  ADMINISTRATIVO: "Administrativo",
  ALOJAMENTO: "Alojamento",
  LOGISTICA: "Logística",
  OFICINA: "Oficina",
};
function auditagemLabel(a: string) { return AUDITAGEM_LABELS[a] ?? a; }

// ── Dados ─────────────────────────────────────────────────────────────────────
const loading = ref(false);
const loadError = ref<string | null>(null);
const itens = ref<ChecklistParaAnalise[]>([]);

async function recarregar() {
  loading.value = true;
  loadError.value = null;
  try {
    itens.value = await fetchChecklistsParaAnalise();
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(recarregar);

// ── Filtros ───────────────────────────────────────────────────────────────────
const filtroStatus = ref<"todos" | AnaliseStatus>("pendente");
const search = ref("");

const statusOpts = [
  { value: "todos",    label: "Todos",     icon: "mdi-format-list-bulleted", badgeColor: "grey" },
  { value: "pendente", label: "Pendentes", icon: "mdi-clock-outline",        badgeColor: "warning" },
  { value: "aprovado", label: "Aprovados", icon: "mdi-check-circle",         badgeColor: "positive" },
  { value: "reprovado",label: "Reprovados",icon: "mdi-close-circle",         badgeColor: "negative" },
] as const;

const pendentes  = computed(() => itens.value.filter((i) => i.status === "pendente"));
const aprovados  = computed(() => itens.value.filter((i) => i.status === "aprovado"));
const reprovados = computed(() => itens.value.filter((i) => i.status === "reprovado"));
const taxaAprovacao = computed(() => {
  const analisados = aprovados.value.length + reprovados.value.length;
  return analisados === 0 ? 0 : Math.round((aprovados.value.length / analisados) * 100);
});

defineExpose({ recarregar, pendentes });

function contagem(status: string): number {
  if (status === "todos") return itens.value.length;
  return itens.value.filter((i) => i.status === status).length;
}

const listaFiltrada = computed(() => {
  let lista = filtroStatus.value === "todos" ? itens.value : itens.value.filter((i) => i.status === filtroStatus.value);
  const q = search.value.toLowerCase().trim();
  if (!q) return lista;
  return lista.filter((i) =>
    [i.base, i.equipe, i.observador, i.auditagem].filter(Boolean).join(" ").toLowerCase().includes(q)
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(s: string) {
  return s === "aprovado" ? "Aprovado" : s === "reprovado" ? "Reprovado" : "Pendente";
}
function statusIcon(s: string) {
  return s === "aprovado" ? "mdi-check-circle" : s === "reprovado" ? "mdi-close-circle" : "mdi-clock-outline";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// ── Expandir respostas ──────────────────────────────────────────────────────────
const expandedId = ref<string | null>(null);
const loadingResp = ref(false);
const respostasExpand = ref<ResponseRow[]>([]);

async function toggleExpand(id: string) {
  if (expandedId.value === id) { expandedId.value = null; return; }
  expandedId.value = id;
  loadingResp.value = true;
  respostasExpand.value = [];
  try {
    respostasExpand.value = await fetchResponses([id]);
  } finally {
    loadingResp.value = false;
  }
}

// ── Dialog ação ───────────────────────────────────────────────────────────────
const acaoDialog = reactive({
  open: false,
  tipo: "aprovado" as AnaliseStatus,
  item: null as ChecklistParaAnalise | null,
  analisadoPor: "",
  comentario: "",
  saving: false,
  error: null as string | null,
});

function abrirAcao(item: ChecklistParaAnalise, tipo: AnaliseStatus) {
  acaoDialog.item = item;
  acaoDialog.tipo = tipo;
  acaoDialog.analisadoPor = "";
  acaoDialog.comentario = "";
  acaoDialog.error = null;
  acaoDialog.open = true;
}

async function confirmarAcao() {
  if (!acaoDialog.item) return;
  acaoDialog.saving = true;
  acaoDialog.error = null;
  try {
    const updated = await atualizarStatusChecklist(
      acaoDialog.item.id, acaoDialog.tipo,
      acaoDialog.analisadoPor.trim(),
      acaoDialog.comentario.trim() || undefined
    );
    const idx = itens.value.findIndex((i) => i.id === updated.id);
    if (idx >= 0) itens.value[idx] = { ...itens.value[idx], ...updated };
    acaoDialog.open = false;
  } catch (e) {
    acaoDialog.error = (e as Error).message;
  } finally {
    acaoDialog.saving = false;
  }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
const fotoDialog = reactive({ open: false, url: "" });
function abrirFoto(url: string) { fotoDialog.url = url; fotoDialog.open = true; }
</script>

<style scoped lang="scss">
$brand: #8B1C2B;
$border: #e2e8f0;
$inactive-bg: #f1f5f9;
$inactive-text: #475569;

.ac-tab { }

// ── KPI cards (compactos) ────────────────────────────────────────────────────
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
}
.kpi-mini {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1.5px solid $border; border-radius: 10px;
  padding: 10px 12px;

  &__icon {
    color: var(--kc);
    background: var(--kbg);
    border-radius: 8px; padding: 6px; flex-shrink: 0;
  }
  &__value { font-size: 18px; font-weight: 800; color: var(--kc); line-height: 1; }
  &__label { font-size: 11px; font-weight: 600; color: #64748b; margin-left: 2px; }
}

// ── Filtro pills ──────────────────────────────────────────────────────────────
.pill {
  display: inline-flex; align-items: center;
  height: 32px; padding: 0 14px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500; cursor: pointer; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &--active { background: $brand; color: #fff; border-color: $brand; box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600; }
}
.search-input {
  :deep(.q-field__control) { height: 32px; min-height: 32px; border-radius: 8px; }
  :deep(.q-field__native) { font-size: 12px; }
  :deep(.q-field__prepend) { height: 32px; }
}

// ── Lista ─────────────────────────────────────────────────────────────────────
.analise-list { display: flex; flex-direction: column; gap: 12px; }
.analise-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; }

.analise-item {
  background: #fff; border-radius: 12px;
  border: 1.5px solid $border;
  padding: 14px 16px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }

  &--pendente  { border-left: 4px solid #d97706; }
  &--aprovado  { border-left: 4px solid #16a34a; }
  &--reprovado { border-left: 4px solid #dc2626; }
}

.analise-item__header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
}
.analise-item__meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.analise-item__date { font-size: 11px; color: #94a3b8; white-space: nowrap; }

.analise-item__body { display: flex; flex-direction: column; gap: 10px; }
.analise-item__enviado { font-size: 12px; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }

.checklist-resumo { display: flex; gap: 8px; flex-wrap: wrap; }
.cr-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px;
  font-size: 11.5px; font-weight: 600;
  &--total { background: #f1f5f9; color: #475569; }
  &--ok    { background: #f0fdf4; color: #15803d; }
  &--nc    { background: #fef2f2; color: #991b1b; }
}

.analise-item__comentario {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; padding: 8px 12px; border-radius: 8px;
  &--aprovado  { background: #f0fdf4; color: #15803d; border: 1px solid rgba(22,163,74,.2); }
  &--reprovado { background: #fef2f2; color: #991b1b; border: 1px solid rgba(220,38,38,.2); }
  &--pendente  { background: #fffbeb; color: #92400e; border: 1px solid rgba(217,119,6,.2); }
}

.analise-item__actions { display: flex; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid $border; flex-wrap: wrap; gap: 6px; }

// ── Expand respostas ───────────────────────────────────────────────────────────
.ac-expand__btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: $brand;
  padding: 2px 0;
}
.ac-expand__body { margin-top: 8px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; }
.ac-resp-list { display: flex; flex-direction: column; gap: 8px; }
.ac-resp-row { display: flex; align-items: flex-start; gap: 8px; }
.ac-resp-row__text { flex: 1; min-width: 0; }
.ac-resp-row__pergunta { font-size: 12px; color: #334155; font-weight: 500; }
.ac-resp-row__obs { font-size: 11px; color: #64748b; margin-top: 2px; }
.ac-resp-row__foto { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; cursor: zoom-in; flex-shrink: 0; }

// ── Badges ────────────────────────────────────────────────────────────────────
.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &--pendente  { background: #fef9c3; color: #854d0e; }
  &--aprovado  { background: #dcfce7; color: #15803d; }
  &--reprovado { background: #fee2e2; color: #991b1b; }
}
.aud-badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  background: #ede9fe; color: #6d28d9;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.base-badge {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  background: rgba($brand,.1); color: $brand;
  font-size: 11px; font-weight: 700; letter-spacing: .5px;
}
.td-mono { font-variant-numeric: tabular-nums; }

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .analise-item { background: #1e293b; border-color: #334155; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.3); } }
  .analise-item__enviado { color: #94a3b8; }
  .analise-item__actions { border-top-color: #334155; }
  .kpi-mini { background: #1e293b; border-color: #334155; }
  .kpi-mini__label { color: #94a3b8; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8; &--active { background: $brand; color: #fff; border-color: $brand; } }
  .ac-expand__body { background: #0f172a; }
  .ac-resp-row__pergunta { color: #e2e8f0; }
}
</style>
