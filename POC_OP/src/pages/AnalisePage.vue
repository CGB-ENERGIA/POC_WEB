<template>
  <q-page class="analise-page">
    <q-linear-progress v-if="loading" indeterminate color="primary" style="position:sticky;top:0;z-index:200" />

    <div class="q-pa-md">

      <!-- KPIs -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#d97706" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(217,119,6,.1)">
                <q-icon name="mdi-clock-outline" size="24px" style="color:#d97706" />
              </div>
              <div class="kpi-stat-value" style="color:#d97706">{{ pendentes.length }}</div>
              <div class="kpi-stat-label">Aguardando</div>
              <div class="kpi-stat-sub">análise pendente</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(22,163,74,.1)">
                <q-icon name="mdi-check-circle-outline" size="24px" style="color:#16a34a" />
              </div>
              <div class="kpi-stat-value" style="color:#16a34a">{{ aprovados.length }}</div>
              <div class="kpi-stat-label">Aprovados</div>
              <div class="kpi-stat-sub">resoluções aceitas</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#dc2626" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(220,38,38,.1)">
                <q-icon name="mdi-close-circle-outline" size="24px" style="color:#dc2626" />
              </div>
              <div class="kpi-stat-value" style="color:#dc2626">{{ reprovados.length }}</div>
              <div class="kpi-stat-label">Reprovados</div>
              <div class="kpi-stat-sub">resoluções recusadas</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(139,28,43,.1)">
                <q-icon name="mdi-gauge" size="24px" style="color:#8B1C2B" />
              </div>
              <div class="kpi-stat-value" style="color:#8B1C2B">{{ taxaAprovacao }}%</div>
              <div class="kpi-stat-label">Taxa Aprovação</div>
              <div class="kpi-stat-sub">das analisadas</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Filtro de status -->
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
          <div class="text-grey-5 q-mt-sm">Nenhum item encontrado</div>
        </div>

        <div
          v-for="item in listaFiltrada"
          :key="item.id"
          class="analise-item"
          :class="`analise-item--${item.status}`"
        >
          <!-- Cabeçalho do item -->
          <div class="analise-item__header">
            <div class="analise-item__meta">
              <span class="status-badge" :class="`status-badge--${item.status}`">
                <q-icon :name="statusIcon(item.status)" size="13px" class="q-mr-xs" />
                {{ statusLabel(item.status) }}
              </span>
              <span class="cat-badge" :class="catClass(item._nc?.categoria)">{{ item._nc?.categoria ?? '—' }}</span>
              <span class="base-badge">{{ item._sub?.base ?? '—' }}</span>
              <span class="td-mono" style="font-size:11px;color:#94a3b8">{{ item._sub?.equipe ?? '—' }}</span>
            </div>
            <div class="analise-item__date">
              {{ fmtDate(item.data_resolucao) }}
            </div>
          </div>

          <!-- Corpo -->
          <div class="analise-item__body">
            <!-- Pergunta e observação -->
            <div class="analise-item__nc">
              <div class="text-caption text-grey-5 text-uppercase" style="letter-spacing:.4px;margin-bottom:2px">Não Conformidade</div>
              <div class="analise-item__pergunta">{{ item._nc?.pergunta ?? '—' }}</div>
              <div v-if="item._nc?.observacao" class="analise-item__obs">
                <q-icon name="mdi-comment-text-outline" size="12px" color="grey-5" class="q-mr-xs" />
                {{ item._nc.observacao }}
              </div>
            </div>

            <!-- Foto evidência + resolução lado a lado -->
            <div class="analise-item__fotos">
              <div v-if="item._nc?.fotoUrl" class="analise-item__foto-wrap">
                <div class="foto-label">Ocorrência</div>
                <img :src="item._nc.fotoUrl" class="analise-foto" alt="Foto ocorrência" @click="abrirFoto(item._nc!.fotoUrl!)" />
              </div>
              <div v-if="resolucaoFotoUrl(item)" class="analise-item__foto-wrap">
                <div class="foto-label">Resolução</div>
                <img :src="resolucaoFotoUrl(item)!" class="analise-foto" alt="Foto resolução" @click="abrirFoto(resolucaoFotoUrl(item)!)" />
              </div>
            </div>

            <!-- Enviado por -->
            <div class="analise-item__enviado">
              <q-icon name="mdi-account-outline" size="14px" color="grey-5" class="q-mr-xs" />
              Enviado por <strong>{{ item.resolvido_por }}</strong>
              <span v-if="item._sub?.observador"> · Observador: <strong>{{ item._sub.observador }}</strong></span>
            </div>

            <!-- Comentário da análise (se reprovado) -->
            <div v-if="item.comentario_analise" class="analise-item__comentario" :class="`analise-item__comentario--${item.status}`">
              <q-icon name="mdi-message-text-outline" size="14px" class="q-mr-xs" />
              <span><strong>{{ item.analisado_por }}</strong>: {{ item.comentario_analise }}</span>
            </div>
          </div>

          <!-- Ações -->
          <div class="analise-item__actions">
            <template v-if="item.status === 'pendente'">
              <q-btn
                unelevated color="positive" icon="mdi-check" label="Aprovar"
                size="sm" class="q-mr-sm"
                @click="abrirAcao(item, 'aprovar')"
              />
              <q-btn
                unelevated color="negative" icon="mdi-close" label="Reprovar"
                size="sm" class="q-mr-sm"
                @click="abrirAcao(item, 'reprovar')"
              />
            </template>
            <q-btn
              flat icon="mdi-pencil-outline" label="Editar"
              size="sm" color="grey-7"
              @click="abrirEdicao(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog ação (aprovar / reprovar) -->
    <q-dialog v-model="acaoDialog.open" persistent>
      <q-card style="min-width:340px;max-width:480px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <q-icon
            :name="acaoDialog.tipo === 'aprovar' ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="acaoDialog.tipo === 'aprovar' ? 'positive' : 'negative'"
            size="24px" class="q-mr-sm"
          />
          <div class="text-subtitle1 text-weight-bold">
            {{ acaoDialog.tipo === 'aprovar' ? 'Aprovar Resolução' : 'Reprovar Resolução' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="acaoDialog.open = false" />
        </q-card-section>
        <q-card-section>
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
            :label="acaoDialog.tipo === 'reprovar' ? 'Motivo da reprovação *' : 'Comentário (opcional)'"
            :placeholder="acaoDialog.tipo === 'reprovar' ? 'Explique o motivo...' : 'Observações...'"
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
            :color="acaoDialog.tipo === 'aprovar' ? 'positive' : 'negative'"
            :label="acaoDialog.tipo === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Reprovação'"
            :loading="acaoDialog.saving"
            :disable="!acaoDialog.analisadoPor.trim() || (acaoDialog.tipo === 'reprovar' && !acaoDialog.comentario.trim())"
            @click="confirmarAcao"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog edição -->
    <q-dialog v-model="edicaoDialog.open" persistent>
      <q-card style="min-width:340px;max-width:480px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="mdi-pencil" color="primary" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Editar Resolução</div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="edicaoDialog.open = false" />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="edicaoDialog.resolvidoPor"
            outlined dense label="Enviado por"
            class="q-mb-sm"
            :disable="edicaoDialog.saving"
          />
          <q-input
            v-model="edicaoDialog.comentario"
            outlined dense type="textarea" rows="3"
            label="Comentário da análise"
            :disable="edicaoDialog.saving"
          />
          <div v-if="edicaoDialog.error" class="text-negative text-caption q-mt-xs">
            <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ edicaoDialog.error }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="edicaoDialog.open = false" :disable="edicaoDialog.saving" />
          <q-btn unelevated color="primary" label="Salvar" :loading="edicaoDialog.saving" @click="confirmarEdicao" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Lightbox foto -->
    <q-dialog v-model="fotoDialog.open">
      <q-card style="max-width:90vw;max-height:90vh;overflow:hidden;background:transparent;box-shadow:none">
        <img :src="fotoDialog.url" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px" />
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import {
  fetchAnalisePendentes,
  atualizarStatusAnalise,
  editarAnalise,
  type ResolucaoRow,
  type ResponseRow,
} from "@/lib/dashboard";
import { supabase } from "@/lib/supabase";

const R2_PUBLIC_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string ?? "").replace(/\/$/, "");

function fotoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (!R2_PUBLIC_BASE) return null;
  return `${R2_PUBLIC_BASE}/${key}`;
}

// ── Tipos internos ────────────────────────────────────────────────────────────
type ItemAnalise = ResolucaoRow & {
  _sub?: { base: string; equipe: string; observador: string; auditagem: string; data: string };
  _nc?: { pergunta: string; categoria: string; observacao: string | null; fotoUrl: string | null };
};

// ── Dados ─────────────────────────────────────────────────────────────────────
const loading = ref(false);
const itens = ref<ItemAnalise[]>([]);

async function recarregar() {
  loading.value = true;
  try {
    const rows = await fetchAnalisePendentes() as unknown as (ResolucaoRow & {
      checklist_submissions?: { data: string; base: string; equipe: string; observador: string; auditagem: string };
    })[];

    // Buscar respostas para obter pergunta/categoria/foto
    const subIds = [...new Set(rows.map((r) => r.submission_id))];
    let responses: ResponseRow[] = [];
    if (subIds.length) {
      const { data } = await supabase
        .from("checklist_responses")
        .select("submission_id,pergunta_id,pergunta,categoria,observacao,foto_r2_key")
        .in("submission_id", subIds);
      responses = (data ?? []) as ResponseRow[];
    }

    const respMap = new Map<string, ResponseRow>();
    for (const r of responses) respMap.set(`${r.submission_id}:${r.pergunta_id}`, r);

    itens.value = rows.map((row) => {
      const sub = row.checklist_submissions;
      const resp = respMap.get(`${row.submission_id}:${row.pergunta_id}`);
      return {
        ...row,
        _sub: sub ? { base: sub.base, equipe: sub.equipe, observador: sub.observador, auditagem: sub.auditagem, data: sub.data } : undefined,
        _nc: resp ? {
          pergunta: resp.pergunta,
          categoria: resp.categoria,
          observacao: resp.observacao ?? null,
          fotoUrl: fotoUrl(resp.foto_r2_key),
        } : undefined,
      };
    });
  } finally {
    loading.value = false;
  }
}

onMounted(recarregar);

// ── Filtros ───────────────────────────────────────────────────────────────────
const filtroStatus = ref<"todos" | "pendente" | "aprovado" | "reprovado">("pendente");
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

function contagem(status: string): number {
  if (status === "todos") return itens.value.length;
  return itens.value.filter((i) => i.status === status).length;
}

const listaFiltrada = computed(() => {
  let lista = filtroStatus.value === "todos" ? itens.value : itens.value.filter((i) => i.status === filtroStatus.value);
  const q = search.value.toLowerCase().trim();
  if (!q) return lista;
  return lista.filter((i) =>
    [i._sub?.base, i._sub?.equipe, i._sub?.observador, i._nc?.categoria, i._nc?.pergunta, i.resolvido_por]
      .filter(Boolean).join(" ").toLowerCase().includes(q)
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(s: string) {
  return s === "aprovado" ? "Aprovado" : s === "reprovado" ? "Reprovado" : "Em Análise";
}
function statusIcon(s: string) {
  return s === "aprovado" ? "mdi-check-circle" : s === "reprovado" ? "mdi-close-circle" : "mdi-clock-outline";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function resolucaoFotoUrl(item: ItemAnalise): string | null {
  return fotoUrl(item.foto_r2_key);
}
function catClass(cat?: string): string {
  const m: Record<string, string> = {
    "APR": "cat-apr", "Regras de Ouro": "cat-regra",
    "Padrinho de Segurança": "cat-pad", "EPI, EPC e Ferramentas": "cat-epi",
    "Procedimento": "cat-proc", "Trabalho em Altura": "cat-altura",
    "Veículos e Equipamentos": "cat-veic",
  };
  return cat ? (m[cat] ?? "") : "";
}

// ── Dialog ação ───────────────────────────────────────────────────────────────
const acaoDialog = reactive({
  open: false,
  tipo: "aprovar" as "aprovar" | "reprovar",
  item: null as ItemAnalise | null,
  analisadoPor: "",
  comentario: "",
  saving: false,
  error: null as string | null,
});

function abrirAcao(item: ItemAnalise, tipo: "aprovar" | "reprovar") {
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
    const status = acaoDialog.tipo === "aprovar" ? "aprovado" : "reprovado";
    const updated = await atualizarStatusAnalise(
      acaoDialog.item.id, status,
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

// ── Dialog edição ─────────────────────────────────────────────────────────────
const edicaoDialog = reactive({
  open: false,
  item: null as ItemAnalise | null,
  resolvidoPor: "",
  comentario: "",
  saving: false,
  error: null as string | null,
});

function abrirEdicao(item: ItemAnalise) {
  edicaoDialog.item = item;
  edicaoDialog.resolvidoPor = item.resolvido_por;
  edicaoDialog.comentario = item.comentario_analise ?? "";
  edicaoDialog.error = null;
  edicaoDialog.open = true;
}

async function confirmarEdicao() {
  if (!edicaoDialog.item) return;
  edicaoDialog.saving = true;
  edicaoDialog.error = null;
  try {
    const updated = await editarAnalise(edicaoDialog.item.id, {
      resolvido_por: edicaoDialog.resolvidoPor.trim(),
      comentario_analise: edicaoDialog.comentario.trim() || undefined,
    });
    const idx = itens.value.findIndex((i) => i.id === updated.id);
    if (idx >= 0) itens.value[idx] = { ...itens.value[idx], ...updated };
    edicaoDialog.open = false;
  } catch (e) {
    edicaoDialog.error = (e as Error).message;
  } finally {
    edicaoDialog.saving = false;
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

.analise-page { background: #f8fafc; min-height: 100vh; }

// ── KPI cards ─────────────────────────────────────────────────────────────────
.kpi-card { border-radius: 12px; height: 100%; transition: box-shadow .2s; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); } }
.kpi-stat-card { position: relative; overflow: hidden; }
.kpi-stat-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
.kpi-stat-section { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; padding-top: 18px !important; }
.kpi-stat-icon-wrap { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; margin-bottom: 8px; }
.kpi-stat-value { font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -.5px; }
.kpi-stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #64748b; margin-top: 4px; }
.kpi-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

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

// ── Lista de análises ─────────────────────────────────────────────────────────
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

.analise-item__nc { }
.analise-item__pergunta { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; }
.analise-item__obs { font-size: 12px; color: #64748b; margin-top: 4px; display: flex; align-items: flex-start; }

.analise-item__fotos { display: flex; gap: 12px; flex-wrap: wrap; }
.analise-item__foto-wrap { display: flex; flex-direction: column; gap: 4px; }
.foto-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; }
.analise-foto { width: 140px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid $border; cursor: zoom-in; transition: opacity .15s; &:hover { opacity: .85; } }

.analise-item__enviado { font-size: 12px; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }

.analise-item__comentario {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; padding: 8px 12px; border-radius: 8px;
  &--aprovado  { background: #f0fdf4; color: #15803d; border: 1px solid rgba(22,163,74,.2); }
  &--reprovado { background: #fef2f2; color: #991b1b; border: 1px solid rgba(220,38,38,.2); }
  &--pendente  { background: #fffbeb; color: #92400e; border: 1px solid rgba(217,119,6,.2); }
}

.analise-item__actions { display: flex; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid $border; flex-wrap: wrap; gap: 6px; }

// ── Badges ────────────────────────────────────────────────────────────────────
.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &--pendente  { background: #fef9c3; color: #854d0e; }
  &--aprovado  { background: #dcfce7; color: #15803d; }
  &--reprovado { background: #fee2e2; color: #991b1b; }
}
.cat-badge {
  display: inline-block; flex-shrink: 0;
  padding: 2px 8px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.cat-apr    { background: #ede9fe; color: #6d28d9; }
.cat-regra  { background: #fef3c7; color: #92400e; }
.cat-pad    { background: #fff7ed; color: #9a3412; }
.cat-epi    { background: #fce7f3; color: #9d174d; }
.cat-proc   { background: #fef9c3; color: #854d0e; }
.cat-altura { background: #fef2f2; color: #991b1b; }
.cat-veic   { background: #f0fdf4; color: #14532d; }
.base-badge {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  background: rgba($brand,.1); color: $brand;
  font-size: 11px; font-weight: 700; letter-spacing: .5px;
}
.td-mono { font-variant-numeric: tabular-nums; }

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .analise-page { background: #0f172a; }
  .analise-item { background: #1e293b; border-color: #334155; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.3); } }
  .analise-item__pergunta { color: #f1f5f9; }
  .analise-item__obs, .analise-item__enviado { color: #94a3b8; }
  .analise-item__actions { border-top-color: #334155; }
  .kpi-card { background: #1e293b; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8; &--active { background: $brand; color: #fff; border-color: $brand; } }
}
</style>
