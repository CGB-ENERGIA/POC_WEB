<template>
  <q-page class="matriz-page">

    <!-- ═══════════════════════════ FILTER BAR ═══════════════════════════ -->
    <div class="filter-bar">
      <div class="filter-fab-wrap">
        <button
          v-draggable
          class="filter-fab"
          :class="{ 'filter-fab--active': showFilters }"
          @click="showFilters = !showFilters">
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Mês · Ano · Gerência -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button v-for="m in mesesOpts" :key="m"
                :class="['pill', filters.mes === m && 'pill--active']"
                @click="filters.mes = m">{{ m }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in anosOpts" :key="a"
                :class="['pill', filters.ano === a && 'pill--active']"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerenciasOpts" :key="g"
                :class="['pill', filters.gerencia === g && 'pill--active']"
                @click="filters.gerencia = g">{{ g }}</button>
            </div>
          </div>
        </div>

        <!-- Row 2: Base · Gerente -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in basesOpts" :key="b"
                :class="['pill', filters.base === b && 'pill--active']"
                @click="filters.base = b">{{ b }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Gerente</span>
            <div class="pill-group">
              <button v-for="g in gerentesOpts" :key="g"
                :class="['pill', filters.gerente === g && 'pill--active']"
                @click="filters.gerente = g">{{ g }}</button>
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>

    <!-- ═══════════════════════════ CONTENT ═══════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI row -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#dc2626" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(220,38,38,.1)">
                <q-icon name="mdi-clock-alert-outline" size="24px" style="color:#dc2626" />
              </div>
              <div class="kpi-stat-value" style="color:#dc2626">{{ naoResolvidos }}</div>
              <div class="kpi-stat-label">Não Resolvidos</div>
              <div class="kpi-stat-sub">pendentes no período</div>
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
              <div class="kpi-stat-value" style="color:#16a34a">{{ resolvidos }}</div>
              <div class="kpi-stat-label">Resolvidos</div>
              <div class="kpi-stat-sub">concluídos no período</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered class="kpi-card kpi-progress-card">
            <q-card-section class="q-pa-md">
              <div class="kpi-prog-label">Taxa de Resolução</div>
              <div class="kpi-prog-value">{{ taxaResolucao }}%</div>
              <q-linear-progress
                :value="taxaResolucao / 100"
                color="positive" track-color="red-2"
                rounded style="height:10px;border-radius:8px" class="q-mt-sm"
              />
              <div class="kpi-prog-sub">{{ resolvidos }} de {{ totalInc }} inconformidades resolvidas</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Table card -->
      <q-card flat bordered class="matriz-card">
        <q-card-section class="q-pa-sm q-pb-xs">
          <div class="row items-center">
            <div class="col">
              <div class="matriz-card-title">Matriz de Responsabilidade</div>
            </div>
            <div class="col-auto">
              <q-input v-model="search" dense outlined placeholder="Buscar..."
                class="search-input" style="min-width:220px">
                <template #prepend>
                  <q-icon name="mdi-magnify" size="18px" color="grey-6" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-pa-sm q-pt-xs">
          <div class="matriz-table-wrap">
            <table class="matriz-table">
              <thead>
                <tr>
                  <th class="col-toggle"></th>
                  <th class="col-data">Data</th>
                  <th class="col-base">Base</th>
                  <th class="col-obs">Observador</th>
                  <th class="col-equipe">Equipe</th>
                  <th class="col-nc">Não Conformidades</th>
                  <th class="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="sub in filteredData" :key="sub.submissionId">
                  <!-- Linha principal do checklist -->
                  <tr
                    class="tr-main tr-clickable"
                    :class="{ 'tr-expanded-open': isExpanded(sub.submissionId) }"
                    @click="toggleExpand(sub.submissionId)"
                  >
                    <td class="col-toggle">
                      <q-icon
                        :name="isExpanded(sub.submissionId) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                        size="18px" color="grey-6"
                      />
                    </td>
                    <td class="col-data td-mono">{{ sub.data }}</td>
                    <td class="col-base">
                      <span class="base-badge">{{ sub.base }}</span>
                    </td>
                    <td class="col-obs">{{ sub.observador }}</td>
                    <td class="col-equipe td-mono">{{ sub.equipe }}</td>
                    <td class="col-nc">
                      <span class="nc-count-badge">{{ sub.totalNc }}</span>
                    </td>
                    <td class="col-status">
                      <span v-if="sub.naoResolvidos > 0" class="res-badge res-nao">
                        {{ sub.naoResolvidos }} pendente{{ sub.naoResolvidos !== 1 ? 's' : '' }}
                      </span>
                      <span v-else class="res-badge res-sim">Resolvido</span>
                    </td>
                  </tr>

                  <!-- NCs expandidas -->
                  <tr v-if="isExpanded(sub.submissionId)" class="tr-nc-container">
                    <td colspan="7" class="td-nc-container">
                      <div class="nc-list">
                        <div
                          v-for="(nc, i) in sub.ncs"
                          :key="i"
                          class="nc-item"
                          :class="{
                            'nc-item--resolved':  nc.resolucao?.status === 'aprovado',
                            'nc-item--analise':   nc.resolucao?.status === 'pendente',
                            'nc-item--reprovado': nc.resolucao?.status === 'reprovado',
                          }"
                          @click.stop="abrirDetalhe(sub, nc)"
                        >
                          <span class="nc-item__num">{{ i + 1 }}</span>
                          <span class="cat-badge" :class="catClass(nc.categoria)">{{ nc.categoria }}</span>
                          <span class="nc-item__desc">{{ nc.inconformidade }}</span>
                          <div class="nc-item__actions">
                            <span v-if="nc.fotoUrl" class="ev-badge ev-com-foto" title="Tem foto">
                              <q-icon name="mdi-camera" size="14px" />
                            </span>
                            <span v-else class="ev-badge ev-sem-foto" title="Sem foto">
                              <q-icon name="mdi-camera-off" size="14px" />
                            </span>
                            <span class="res-badge" :class="ncStatusClass(nc.resolucao)">
                              {{ ncStatusLabel(nc.resolucao) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>

                <tr v-if="filteredData.length === 0">
                  <td colspan="7" class="td-empty">Nenhum registro encontrado.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="q-mt-xs q-px-xs row items-center">
            <span class="table-count">{{ filteredData.length }} checklist{{ filteredData.length !== 1 ? 's' : '' }}</span>
          </div>
        </q-card-section>
      </q-card>

      <!-- ═══ HISTÓRICO DE RESOLUÇÕES ═══ -->
      <q-card v-if="historicoResolvidos.length > 0" flat bordered class="matriz-card q-mt-md">
        <q-card-section class="q-pa-sm q-pb-xs">
          <div class="row items-center">
            <q-icon name="mdi-check-circle-outline" size="18px" color="positive" class="q-mr-xs" />
            <div class="matriz-card-title" style="color:#16a34a">Histórico de Resoluções</div>
            <q-badge color="positive" :label="historicoResolvidos.length" class="q-ml-sm" />
          </div>
        </q-card-section>
        <q-card-section class="q-pa-sm q-pt-xs">
          <div class="hist-list">
            <div
              v-for="(item, i) in historicoResolvidos"
              :key="i"
              class="hist-item"
              @click="abrirDetalhe(item.sub, item.nc)"
            >
              <div class="hist-item__foto-wrap">
                <img
                  v-if="item.nc.resolucao?.fotoUrl"
                  :src="item.nc.resolucao.fotoUrl"
                  class="hist-item__foto"
                  alt=""
                />
                <div v-else class="hist-item__foto-placeholder">
                  <q-icon name="mdi-image-off-outline" size="18px" color="grey-4" />
                </div>
              </div>
              <div class="hist-item__body">
                <div class="row items-center q-gutter-xs q-mb-xs">
                  <span class="cat-badge" :class="catClass(item.nc.categoria)">{{ item.nc.categoria }}</span>
                  <span class="base-badge">{{ item.sub.base }}</span>
                  <span class="td-mono" style="font-size:10px;color:#94a3b8">{{ item.sub.equipe }}</span>
                </div>
                <div class="hist-item__desc">{{ item.nc.inconformidade }}</div>
                <div class="hist-item__meta">
                  <q-icon name="mdi-check-circle" size="12px" color="positive" class="q-mr-xs" />
                  {{ item.nc.resolucao?.dataResolucao }}
                  <span class="hist-item__por">por {{ item.nc.resolucao?.resolvidoPor }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

    </div>

    <!-- ═══════════════════════════ DETAIL DIALOG ═══════════════════════════ -->
    <q-dialog v-model="dialogOpen" max-width="580px">
      <q-card v-if="detalhe" style="min-width:320px;max-width:580px;width:100%">

        <!-- Header -->
        <q-card-section class="row items-center q-pb-none">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold" style="color:#8B1C2B">Detalhe da Não Conformidade</div>
            <div class="text-caption text-grey-6">{{ detalhe.sub.data }} · {{ detalhe.sub.base }} · {{ detalhe.sub.equipe }}</div>
          </div>
          <q-btn flat round dense icon="mdi-close" v-close-popup />
        </q-card-section>

        <q-separator class="q-mt-sm" />

        <!-- NC info -->
        <q-card-section class="q-pt-sm q-pb-xs">
          <div class="row items-center q-gutter-xs q-mb-sm">
            <span class="cat-badge" :class="catClass(detalhe.nc.categoria)">{{ detalhe.nc.categoria }}</span>
            <span class="res-badge" :class="ncStatusClass(detalhe.nc.resolucao)">
              {{ ncStatusLabel(detalhe.nc.resolucao) }}
            </span>
          </div>

          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Pergunta do checklist</div>
          <div class="text-body2 text-weight-medium q-mb-md" style="color:#334155">{{ detalhe.nc.pergunta }}</div>

          <template v-if="detalhe.nc.observacao">
            <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Observação do auditor</div>
            <div class="obs-box q-mb-md">{{ detalhe.nc.observacao }}</div>
          </template>

          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Observador · Equipe</div>
          <div class="text-body2 q-mb-xs" style="color:#334155">{{ detalhe.sub.observador }} · {{ detalhe.sub.equipe }}</div>
        </q-card-section>

        <!-- Foto de evidência (ocorrência) -->
        <q-card-section v-if="detalhe.nc.fotoUrl" class="q-pt-none q-pb-sm">
          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Foto de Evidência (Ocorrência)</div>
          <img :src="detalhe.nc.fotoUrl" class="foto-evidencia" alt="Evidência" />
        </q-card-section>
        <q-card-section v-else class="q-pt-none q-pb-sm">
          <div class="sem-foto">
            <q-icon name="mdi-camera-off" size="28px" color="grey-4" />
            <span class="text-caption text-grey-5 q-ml-sm">Sem foto de evidência</span>
          </div>
        </q-card-section>

        <q-separator />

        <!-- ── ENVIADO PARA ANÁLISE / APROVADO / REPROVADO ── -->
        <template v-if="detalhe.nc.resolucao">
          <q-card-section class="q-pb-xs">
            <div class="resolucao-header">
              <q-icon
                :name="detalhe.nc.resolucao.status === 'aprovado' ? 'mdi-check-circle' : detalhe.nc.resolucao.status === 'reprovado' ? 'mdi-close-circle' : 'mdi-clock-outline'"
                :color="detalhe.nc.resolucao.status === 'aprovado' ? 'positive' : detalhe.nc.resolucao.status === 'reprovado' ? 'negative' : 'warning'"
                size="22px"
              />
              <span class="resolucao-titulo" :style="{ color: detalhe.nc.resolucao.status === 'aprovado' ? '#15803d' : detalhe.nc.resolucao.status === 'reprovado' ? '#991b1b' : '#92400e' }">
                {{ detalhe.nc.resolucao.status === 'aprovado' ? 'Resolução Aprovada' : detalhe.nc.resolucao.status === 'reprovado' ? 'Resolução Reprovada' : 'Aguardando Análise' }}
              </span>
            </div>
            <div class="resolucao-meta q-mt-sm">
              <div class="resolucao-meta-item">
                <span class="resolucao-label">Enviado por</span>
                <span class="resolucao-valor">{{ detalhe.nc.resolucao.resolvidoPor }}</span>
              </div>
              <div class="resolucao-meta-item">
                <span class="resolucao-label">Data / Hora</span>
                <span class="resolucao-valor">{{ detalhe.nc.resolucao.dataResolucao }}</span>
              </div>
              <div v-if="detalhe.nc.resolucao.analisadoPor" class="resolucao-meta-item">
                <span class="resolucao-label">Analisado por</span>
                <span class="resolucao-valor">{{ detalhe.nc.resolucao.analisadoPor }}</span>
              </div>
              <div v-if="detalhe.nc.resolucao.comentario" class="resolucao-meta-item" style="flex-direction:column;gap:2px">
                <span class="resolucao-label">Comentário</span>
                <span class="resolucao-valor">{{ detalhe.nc.resolucao.comentario }}</span>
              </div>
            </div>
          </q-card-section>
          <q-card-section v-if="detalhe.nc.resolucao.fotoUrl" class="q-pt-none">
            <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Foto da Resolução</div>
            <img :src="detalhe.nc.resolucao.fotoUrl" class="foto-evidencia" alt="Foto da resolução" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Fechar" color="grey-7" v-close-popup />
          </q-card-actions>
        </template>

        <!-- ── FORM DE RESOLUÇÃO ── -->
        <template v-else>
          <q-card-section class="q-pb-sm">
            <div class="resolver-header q-mb-md">
              <q-icon name="mdi-wrench-check-outline" color="grey-6" size="20px" />
              <span class="resolver-titulo">Registrar Resolução</span>
            </div>

            <q-input
              v-model="resolverForm.por"
              outlined dense
              label="Resolvido por (nome)"
              placeholder="Nome do responsável"
              class="q-mb-sm"
              :disable="resolverForm.saving"
            />

            <!-- Seleção de foto -->
            <input
              ref="fotoInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onFotoChange"
            />
            <div v-if="resolverForm.fotoBase64" class="foto-preview-wrap q-mb-sm">
              <img :src="resolverForm.fotoBase64" class="foto-preview" alt="Preview" />
              <q-btn
                flat round dense
                icon="mdi-close-circle"
                color="grey-6"
                class="foto-preview-remove"
                :disable="resolverForm.saving"
                @click="resolverForm.fotoBase64 = null"
              />
            </div>
            <q-btn
              v-else
              outline color="grey-7"
              icon="mdi-camera-plus-outline"
              label="Adicionar Foto da Resolução (opcional)"
              class="full-width q-mb-xs"
              :disable="resolverForm.saving"
              @click="fotoInput?.click()"
            />

            <div v-if="resolverForm.error" class="text-negative text-caption q-mt-xs q-px-xs">
              <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ resolverForm.error }}
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pt-none q-px-md q-pb-md">
            <q-btn flat label="Fechar" color="grey-7" v-close-popup :disable="resolverForm.saving" />
            <q-btn
              unelevated color="primary"
              icon="mdi-send"
              label="Mandar para Análise"
              :loading="resolverForm.saving"
              :disable="!resolverForm.por.trim()"
              @click="resolverNc"
            />
          </q-card-actions>
        </template>

      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useChecklistData } from "@/composables/useChecklistData";
import { fetchResolucoes, inserirResolucao, type ResolucaoRow } from "@/lib/dashboard";

// ─── R2 upload ────────────────────────────────────────────────────────────────
const R2_UPLOAD_URL = (import.meta.env.VITE_R2_UPLOAD_URL as string ?? "").replace(/\/$/, "");
const R2_UPLOAD_TOKEN = import.meta.env.VITE_R2_UPLOAD_TOKEN as string ?? "";
const R2_PUBLIC_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string ?? "").replace(/\/$/, "");

async function uploadToR2(key: string, base64: string): Promise<string> {
  const idx = base64.indexOf(",");
  const data = idx >= 0 ? base64.slice(idx + 1) : base64;
  const res = await fetch(`${R2_UPLOAD_URL}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${R2_UPLOAD_TOKEN}` },
    body: JSON.stringify({ key, contentType: "image/jpeg", data }),
  });
  if (!res.ok) throw new Error(`Upload falhou (${res.status})`);
  const body = (await res.json()) as { key?: string };
  return body.key ?? key;
}

// ─── Filters ──────────────────────────────────────────────────────────────────
const showFilters = ref(false);
const search = ref("");

const mesesOpts     = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const anosOpts      = ["2024","2025","2026"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","LOGÍSTICA","OFICINA","SESMT","SPOT"];
const basesOpts     = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];

const MONTH_MAP: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const filters = reactive({
  mes: mesesOpts[new Date().getMonth()],
  ano: String(new Date().getFullYear()),
  gerencia: "Todos", base: "Todos", gerente: "Todos",
});

// ─── Dados reais ──────────────────────────────────────────────────────────────
const { loading, load, submissions, responses, employees } = useChecklistData();
const resolucoes = ref<ResolucaoRow[]>([]);

async function recarregar() {
  const mes = MONTH_MAP[filters.mes];
  const ano = Number(filters.ano);
  await load({ ano, mes, base: filters.base !== "Todos" ? filters.base : undefined });
  resolucoes.value = await fetchResolucoes(submissions.value.map((s) => s.id));
}

onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// ─── Photo URL helper ─────────────────────────────────────────────────────────
function fotoUrl(key: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("https://") || key.startsWith("http://")) return key;
  if (!R2_PUBLIC_BASE) return null;
  return `${R2_PUBLIC_BASE}/${key}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Resolucao = {
  id: string;
  resolvidoPor: string;
  dataResolucaoIso: string;
  dataResolucao: string;
  fotoUrl: string | null;
  status: "pendente" | "aprovado" | "reprovado";
  comentario: string | null;
  analisadoPor: string | null;
};

type NcRow = {
  perguntaId: string;
  categoria: string;
  pergunta: string;
  inconformidade: string;
  observacao: string | null;
  fotoUrl: string | null;
  resolucao: Resolucao | null;
};

type SubRow = {
  submissionId: string;
  matricula: string;
  data: string;
  base: string;
  gerencia: string;
  observador: string;
  equipe: string;
  ncs: NcRow[];
  totalNc: number;
  naoResolvidos: number;
};

// ─── Dados agrupados por checklist ───────────────────────────────────────────
const allData = computed<SubRow[]>(() => {
  const resolucaoMap = new Map<string, ResolucaoRow>();
  for (const r of resolucoes.value) {
    resolucaoMap.set(`${r.submission_id}:${r.pergunta_id}`, r);
  }

  const empMap = new Map(employees.value.map((e) => [e.matricula, e]));

  const subMap = new Map<string, SubRow>();
  for (const sub of submissions.value) {
    const dt = new Date(sub.data);
    const fmt = `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    const emp = empMap.get(sub.matricula);
    subMap.set(sub.id, {
      submissionId: sub.id,
      matricula: sub.matricula,
      data: fmt,
      base: sub.base,
      gerencia: emp?.gerencia ?? sub.auditagem ?? "",
      observador: sub.observador,
      equipe: sub.equipe,
      ncs: [],
      totalNc: 0,
      naoResolvidos: 0,
    });
  }

  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    const sub = subMap.get(r.submission_id);
    if (!sub) continue;
    const raw = resolucaoMap.get(`${r.submission_id}:${r.pergunta_id}`);
    const resolucao: Resolucao | null = raw
      ? {
          id: raw.id,
          resolvidoPor: raw.resolvido_por,
          dataResolucaoIso: raw.data_resolucao,
          dataResolucao: new Date(raw.data_resolucao).toLocaleString("pt-BR"),
          fotoUrl: fotoUrl(raw.foto_r2_key),
          status: raw.status,
          comentario: raw.comentario_analise ?? null,
          analisadoPor: raw.analisado_por ?? null,
        }
      : null;

    sub.ncs.push({
      perguntaId: r.pergunta_id,
      categoria: r.categoria,
      pergunta: r.pergunta,
      inconformidade: r.observacao ?? r.pergunta,
      observacao: r.observacao,
      fotoUrl: fotoUrl(r.foto_r2_key),
      resolucao,
    });
    sub.totalNc++;
    if (!resolucao || resolucao.status !== "aprovado") sub.naoResolvidos++;
  }

  return Array.from(subMap.values())
    .filter((s) => s.totalNc > 0)
    .sort((a, b) => b.data.localeCompare(a.data));
});

// ─── Expand / collapse ────────────────────────────────────────────────────────
const expanded = reactive<Record<string, boolean>>({});
function toggleExpand(id: string) { expanded[id] = !expanded[id]; }
function isExpanded(id: string) { return !!expanded[id]; }

// ─── Filtrado ─────────────────────────────────────────────────────────────────
const filteredData = computed<SubRow[]>(() => {
  let data = allData.value;

  if (filters.gerencia !== "Todos") {
    data = data.filter((s) => s.gerencia === filters.gerencia);
  }
  if (filters.gerente !== "Todos") {
    data = data.filter((s) => s.observador === filters.gerente);
  }

  const q = search.value.toLowerCase();
  if (!q) return data;
  return data.filter((s) => {
    const base = `${s.data} ${s.base} ${s.observador} ${s.equipe}`.toLowerCase();
    if (base.includes(q)) return true;
    return s.ncs.some((nc) =>
      `${nc.categoria} ${nc.inconformidade} ${nc.pergunta}`.toLowerCase().includes(q)
    );
  });
});

// ─── Histórico de resoluções ──────────────────────────────────────────────────
const historicoResolvidos = computed(() => {
  const items: { sub: SubRow; nc: NcRow }[] = [];
  for (const sub of allData.value) {
    for (const nc of sub.ncs) {
      if (nc.resolucao) items.push({ sub, nc });
    }
  }
  return items.sort((a, b) =>
    b.nc.resolucao!.dataResolucaoIso.localeCompare(a.nc.resolucao!.dataResolucaoIso)
  );
});

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const naoResolvidos = computed(() =>
  filteredData.value.reduce((acc, s) => acc + s.naoResolvidos, 0)
);
const resolvidos = computed(() =>
  filteredData.value.reduce((acc, s) => acc + (s.totalNc - s.naoResolvidos), 0)
);
const totalInc = computed(() =>
  filteredData.value.reduce((acc, s) => acc + s.totalNc, 0)
);
const taxaResolucao = computed(() =>
  totalInc.value === 0 ? 0 : Math.round((resolvidos.value / totalInc.value) * 100)
);

// ─── Dialog de detalhe ────────────────────────────────────────────────────────
const dialogOpen = ref(false);
const detalhe = ref<{ sub: SubRow; nc: NcRow } | null>(null);

function abrirDetalhe(sub: SubRow, nc: NcRow) {
  detalhe.value = { sub, nc };
  resolverForm.por = "";
  resolverForm.fotoBase64 = null;
  resolverForm.error = null;
  dialogOpen.value = true;
}

// ─── Form de resolução ────────────────────────────────────────────────────────
const fotoInput = ref<HTMLInputElement | null>(null);
const resolverForm = reactive({
  por: "",
  fotoBase64: null as string | null,
  saving: false,
  error: null as string | null,
});

function onFotoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { resolverForm.fotoBase64 = e.target?.result as string; };
  reader.readAsDataURL(file);
  // Reset input so selecting same file again triggers change
  (event.target as HTMLInputElement).value = "";
}

async function resolverNc() {
  if (!detalhe.value || !resolverForm.por.trim()) return;
  resolverForm.saving = true;
  resolverForm.error = null;
  try {
    const { sub, nc } = detalhe.value;
    let r2Key = "";
    if (resolverForm.fotoBase64) {
      try {
        const key = `resolucoes/${sub.submissionId}/${nc.perguntaId}_${Date.now()}.jpg`;
        r2Key = await uploadToR2(key, resolverForm.fotoBase64);
      } catch {
        resolverForm.error = "Falha no upload da foto. Verifique sua conexão e tente novamente, ou envie sem foto.";
        resolverForm.saving = false;
        return;
      }
    }
    const nova = await inserirResolucao({
      submission_id: sub.submissionId,
      pergunta_id: nc.perguntaId,
      resolvido_por: resolverForm.por.trim(),
      data_resolucao: new Date().toISOString(),
      foto_r2_key: r2Key,
    });
    resolucoes.value = [...resolucoes.value, nova];
    dialogOpen.value = false;
  } catch (e) {
    const msg = (e as { message?: string }).message ?? String(e);
    resolverForm.error = msg.includes("column") && msg.includes("status")
      ? "Execute a migration SQL no Supabase antes de usar este recurso."
      : msg;
  } finally {
    resolverForm.saving = false;
  }
}

void loading;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ncStatusClass(resolucao: Resolucao | null): string {
  if (!resolucao) return "res-nao";
  if (resolucao.status === "aprovado") return "res-sim";
  if (resolucao.status === "reprovado") return "res-nao";
  return "res-analise";
}

function ncStatusLabel(resolucao: Resolucao | null): string {
  if (!resolucao) return "Pendente";
  if (resolucao.status === "aprovado") return "Resolvido";
  if (resolucao.status === "reprovado") return "Reprovado";
  return "Em Análise";
}

function catClass(cat: string): string {
  const m: Record<string, string> = {
    "Repúblicas":                       "cat-rep",
    "Procedimentos":                    "cat-proc",
    "EPI, EPC e Ferramentas":           "cat-epi",
    "APR":                              "cat-apr",
    "Regras de Ouro":                   "cat-regra",
    "Trabalho em Altura":               "cat-altura",
    "Veículos e Equipamentos":          "cat-veic",
    "Padrinho de Segurança":            "cat-pad",
    "Estruturas e Instalações Prediais":"cat-struct",
  };
  return m[cat] ?? "";
}
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$header-bg:    #fce4e8;

.matriz-page { background: #f8fafc; min-height: 100vh; }

// ── Filter bar ────────────────────────────────────────────────────────────────
.filter-bar {
  background: #fff; border-bottom: 1px solid $border;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 10px 20px 6px; position: sticky; top: 0; z-index: 100;
}
.filter-bar__inner { display: flex; flex-direction: column; gap: 8px; }
.filter-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.fgroup { display: flex; flex-direction: column; gap: 4px; }
.fgroup__label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: $label-color; line-height: 1;
}
.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  height: 30px; padding: 0 12px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600;
  }
}
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px; height: 100%;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.kpi-stat-card { position: relative; overflow: hidden; }
.kpi-stat-accent {
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px; border-radius: 12px 12px 0 0;
}
.kpi-stat-section {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; height: 100%;
  padding-top: 18px !important;
}
.kpi-stat-icon-wrap {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 12px; margin-bottom: 8px;
}
.kpi-stat-value { font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -.5px; }
.kpi-stat-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-top: 4px;
}
.kpi-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.kpi-progress-card { border-radius: 12px; }
.kpi-prog-label {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-bottom: 4px;
}
.kpi-prog-value { font-size: 36px; font-weight: 800; color: $brand; line-height: 1; }
.kpi-prog-sub { font-size: 11px; color: #94a3b8; margin-top: 6px; }

// ── Table card ────────────────────────────────────────────────────────────────
.matriz-card { border-radius: 12px; }
.matriz-card-title {
  font-size: 13px; font-weight: 700; color: $brand;
  text-transform: uppercase; letter-spacing: .6px; padding: 6px 8px 4px;
}
.search-input {
  :deep(.q-field__control) {
    height: 32px; min-height: 32px; border-radius: 8px; border-color: $border;
  }
  :deep(.q-field__native) { font-size: 12px; }
  :deep(.q-field__prepend) { height: 32px; }
}
.matriz-table-wrap {
  overflow: auto; max-height: 620px;
  border: 1px solid $border; border-radius: 8px;
}
.table-count { font-size: 11px; color: #94a3b8; padding: 2px 4px; }

// ── Matrix table ──────────────────────────────────────────────────────────────
.matriz-table {
  width: 100%; border-collapse: collapse; font-size: 12px;

  thead th {
    background: $header-bg; color: $brand;
    padding: 8px 10px; font-size: 11px; font-weight: 800;
    text-align: center; white-space: nowrap;
    position: sticky; top: 0; z-index: 1;
    border-bottom: 2px solid rgba($brand,.2);
    &:first-child, &.col-obs { text-align: left; }
  }

  tbody {
    .tr-main {
      border-bottom: 1px solid $border;
      transition: background .15s;
      &:nth-child(4n+1), &:nth-child(4n+2) { background: #f8fafc; }
      &:hover { background: rgba($brand,.04); }
      &.tr-expanded-open {
        background: rgba($brand,.06) !important;
        border-bottom: none;
      }
    }
    .tr-clickable { cursor: pointer; }
    .tr-nc-container { border-bottom: 1px solid $border; }
  }

  td {
    padding: 8px 10px; vertical-align: middle; text-align: center;
  }
  .col-toggle  { width: 32px; padding: 8px 4px; }
  .col-data    { min-width: 140px; font-size: 11px; text-align: left; }
  .col-base    { min-width: 60px; }
  .col-obs     { min-width: 110px; font-weight: 600; color: #1e293b; text-align: left; }
  .col-equipe  { min-width: 140px; font-size: 11px; }
  .col-nc      { min-width: 80px; }
  .col-status  { min-width: 110px; }
  .td-mono     { font-variant-numeric: tabular-nums; color: #475569; }
  .td-empty    { text-align: center; padding: 32px; color: #94a3b8; font-style: italic; }

  .td-nc-container {
    padding: 0 !important;
    background: #f8fafc;
  }
}

// ── NC count badge ────────────────────────────────────────────────────────────
.nc-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 24px; height: 24px; padding: 0 7px;
  border-radius: 999px;
  background: rgba($brand,.12); color: $brand;
  font-size: 12px; font-weight: 700;
}

// ── Expanded NC list ──────────────────────────────────────────────────────────
.nc-list {
  display: flex; flex-direction: column;
  padding: 6px 12px 8px 44px;
  gap: 4px;
}
.nc-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid $border;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  &:hover { background: #fef2f2; border-color: rgba($brand,.25); }
  &--resolved {
    background: #f0fdf4;
    border-color: rgba(22,163,74,.25);
    &:hover { background: #dcfce7; border-color: rgba(22,163,74,.4); }
    .nc-item__desc { color: #166534; }
  }
  &--analise {
    background: #fefce8;
    border-color: rgba(217,119,6,.3);
    animation: analise-row-pulse 2s ease-in-out infinite;
    &:hover { background: #fef9c3; border-color: rgba(217,119,6,.5); }
    .nc-item__desc { color: #92400e; }
  }
  &--reprovado {
    background: #fef2f2;
    border-color: rgba(220,38,38,.25);
    &:hover { background: #fee2e2; border-color: rgba(220,38,38,.4); }
    .nc-item__desc { color: #991b1b; }
  }
}

@keyframes analise-row-pulse {
  0%, 100% { border-color: rgba(217,119,6,.3); }
  50%       { border-color: rgba(217,119,6,.7); }
}
.nc-item__num {
  font-size: 10px; font-weight: 700; color: #94a3b8;
  min-width: 16px; text-align: right;
}
.nc-item__desc {
  flex: 1; font-size: 11.5px; color: #334155;
  line-height: 1.4; white-space: pre-line;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.nc-item__actions {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}

// ── Badges ────────────────────────────────────────────────────────────────────
.base-badge {
  display: inline-block;
  padding: 2px 8px; border-radius: 6px;
  background: rgba($brand,.1); color: $brand;
  font-size: 11px; font-weight: 700; letter-spacing: .5px;
}

.cat-badge {
  display: inline-block; flex-shrink: 0;
  padding: 2px 8px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.cat-rep    { background: #e0f2fe; color: #0369a1; }
.cat-proc   { background: #fef9c3; color: #854d0e; }
.cat-epi    { background: #fce7f3; color: #9d174d; }
.cat-apr    { background: #ede9fe; color: #6d28d9; }
.cat-regra  { background: #fef3c7; color: #92400e; }
.cat-altura { background: #fef2f2; color: #991b1b; }
.cat-veic   { background: #f0fdf4; color: #14532d; }
.cat-pad    { background: #fff7ed; color: #9a3412; }
.cat-struct { background: #f0f9ff; color: #0c4a6e; }

.res-badge {
  display: inline-block;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.res-sim     { background: #dcfce7; color: #15803d; }
.res-nao     { background: #fee2e2; color: #991b1b; }
.res-analise {
  background: #fef9c3;
  color: #854d0e;
  animation: analise-pulse 1.8s ease-in-out infinite;
  position: relative;
}

@keyframes analise-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(217, 119, 6, 0); }
}

.ev-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
}
.ev-com-foto { background: rgba(37,99,235,.12); color: #2563eb; }
.ev-sem-foto { background: rgba(148,163,184,.12); color: #94a3b8; }

// ── Histórico de resoluções ────────────────────────────────────────────────────
.hist-list {
  display: flex; flex-direction: column; gap: 8px;
}
.hist-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid rgba(22,163,74,.2);
  cursor: pointer;
  transition: background .15s, border-color .15s;
  &:hover { background: #dcfce7; border-color: rgba(22,163,74,.4); }
}
.hist-item__foto-wrap {
  flex-shrink: 0; width: 56px; height: 56px; border-radius: 8px; overflow: hidden;
  background: #e2e8f0;
}
.hist-item__foto {
  width: 100%; height: 100%; object-fit: cover;
}
.hist-item__foto-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9;
}
.hist-item__body { flex: 1; min-width: 0; }
.hist-item__desc {
  font-size: 12px; color: #166534; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  margin-bottom: 4px;
}
.hist-item__meta {
  display: flex; align-items: center;
  font-size: 11px; color: #16a34a; gap: 2px;
}
.hist-item__por {
  margin-left: 4px; font-weight: 600; color: #15803d;
}

// ── Dialog ────────────────────────────────────────────────────────────────────
.obs-box {
  background: #f8fafc; border-left: 3px solid #dc2626;
  border-radius: 0 6px 6px 0; padding: 8px 12px;
  font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;
}
.foto-evidencia {
  width: 100%; max-height: 300px;
  object-fit: contain; border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.sem-foto {
  display: flex; align-items: center; justify-content: center;
  padding: 20px; border: 1px dashed #e2e8f0; border-radius: 8px;
}

// ── Resolução (dialog) ────────────────────────────────────────────────────────
.resolucao-header {
  display: flex; align-items: center; gap: 8px;
}
.resolucao-titulo {
  font-size: 14px; font-weight: 700; color: #15803d;
}
.resolucao-meta {
  display: flex; flex-direction: column; gap: 6px;
  background: #f0fdf4; border-radius: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(22,163,74,.2);
}
.resolucao-meta-item {
  display: flex; align-items: baseline; gap: 8px;
}
.resolucao-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #86efac; min-width: 90px;
}
.resolucao-valor { font-size: 13px; color: #14532d; font-weight: 500; }

.resolver-header {
  display: flex; align-items: center; gap: 8px;
}
.resolver-titulo {
  font-size: 13px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: .5px;
}

.foto-preview-wrap {
  position: relative; border-radius: 8px; overflow: hidden;
  border: 1px solid $border;
}
.foto-preview {
  width: 100%; max-height: 200px; object-fit: cover; display: block;
}
.foto-preview-remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(255,255,255,.85) !important;
  border-radius: 50%;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .matriz-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill {
    background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .matriz-card { background: #1e293b; }
  .kpi-progress-card { background: #1e293b; }
  .kpi-prog-label { color: #94a3b8; }
  .kpi-prog-sub { color: #64748b; }
  .matriz-table {
    thead th { background: #4a1525; color: #fca5a5; border-bottom-color: #7f1d2e; }
    tbody {
      .tr-main {
        border-bottom-color: #334155;
        &:nth-child(4n+1), &:nth-child(4n+2) { background: #162032; }
        &.tr-expanded-open { background: rgba($brand,.12) !important; }
      }
      .tr-nc-container { border-bottom-color: #334155; }
      td { color: #cbd5e1; }
      .col-obs { color: #f1f5f9; }
    }
    .td-nc-container { background: #131e2e; }
    .nc-item {
      background: #1e293b; border-color: #334155;
      .nc-item__desc { color: #94a3b8; }
      &:hover { background: rgba($brand,.12); border-color: rgba($brand,.3); }
      &--resolved {
        background: #052e16; border-color: rgba(22,163,74,.3);
        .nc-item__desc { color: #86efac; }
        &:hover { background: #064e3b; }
      }
      &--analise {
        background: #1c1a05; border-color: rgba(217,119,6,.4);
        .nc-item__desc { color: #fcd34d; }
        &:hover { background: #292207; }
      }
      &--reprovado {
        background: #2d0a0a; border-color: rgba(220,38,38,.3);
        .nc-item__desc { color: #fca5a5; }
        &:hover { background: #450a0a; }
      }
    }
  }
  .hist-item {
    background: #052e16; border-color: rgba(22,163,74,.25);
    &:hover { background: #064e3b; }
    .hist-item__desc { color: #86efac; }
    .hist-item__meta { color: #4ade80; }
    .hist-item__por { color: #86efac; }
  }
  .resolucao-meta {
    background: #052e16; border-color: rgba(22,163,74,.25);
  }
  .resolucao-label { color: #4ade80; }
  .resolucao-valor { color: #bbf7d0; }
}
</style>
