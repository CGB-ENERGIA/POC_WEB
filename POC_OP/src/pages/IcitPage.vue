<template>
  <q-page class="icit-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FILTER BAR
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="filter-bar">
      <div class="filter-fab-wrap">
        <button
          class="filter-fab"
          :class="{ 'filter-fab--active': showFilters }"
          @click="showFilters = !showFilters">
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
          <span class="filter-fab__label">{{ showFilters ? 'Ocultar filtros' : 'Filtros' }}</span>
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Ano · Semana · Gerente -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in anos" :key="a"
                :class="['pill', { 'pill--active': filters.ano === a }]"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Semana</span>
            <div class="pill-group">
              <button v-for="s in semanas" :key="s.value"
                :class="['pill', { 'pill--active': filters.semana === s.value }]"
                @click="filters.semana = s.value">{{ s.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select v-model="filters.gerente" :options="gerentes"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            </q-select>
          </div>
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Coordenador</span>
            <q-select v-model="filters.coordenador" :options="coordenadores"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            </q-select>
          </div>

        </div>

        <!-- Row 2: Mês · Gerência -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button v-for="m in meses" :key="m.value"
                :class="['pill', { 'pill--active': filters.mes === m.value }]"
                @click="filters.mes = m.value">{{ m.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerencias" :key="g"
                :class="['pill', { 'pill--active': filters.gerencia === g }]"
                @click="filters.gerencia = g">{{ g }}</button>
            </div>
          </div>

        </div>

        <!-- Row 3: Base · Segurança · Tipo de POC -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in bases" :key="b"
                :class="['pill', { 'pill--active': filters.base === b }]"
                @click="filters.base = b">{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Segurança</span>
            <div class="pill-group">
              <button v-for="s in segurancas" :key="s"
                :class="['pill', { 'pill--active': filters.seguranca === s }]"
                @click="filters.seguranca = s">{{ s }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposPoc" :key="t"
                :class="['pill', { 'pill--active': filters.tipoPoc === t }]"
                @click="filters.tipoPoc = t">{{ t }}</button>
            </div>
          </div>

        </div>
      </div>
      </div>
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ mesLabel }}</span>
          <span v-if="filters.semana" class="filter-chip filter-chip--hit" @click="filters.semana = 0">{{ semanaLabel }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ nomeBase(filters.base) }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip">{{ filters.gerente }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip">{{ filters.coordenador }}</span>
          <span v-if="filters.tipoPoc !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.tipoPoc = 'Todos'">{{ filters.tipoPoc }}</span>
          <span v-if="filters.seguranca !== 'Segurança'" class="filter-chip filter-chip--hit" @click="filters.seguranca = 'Segurança'">{{ filters.seguranca }}</span>
          <span v-if="viz.equipe" class="filter-chip filter-chip--hit" @click="viz.equipe = null">{{ viz.equipe }}</span>
          <span v-if="viz.categoria" class="filter-chip filter-chip--hit" @click="viz.categoria = null">{{ viz.categoria }}</span>
          <span v-if="viz.lado" class="filter-chip filter-chip--hit" @click="viz.lado = null">{{ viz.lado === 'semNc' ? 'Checklists perfeitos' : 'Com inconformidade' }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         KPI + CHARTS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="row q-col-gutter-md q-mb-md items-stretch">
        <div class="col-6 col-md-2" v-for="kpi in kpis" :key="kpi.label">
          <q-card flat bordered class="kpi-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-grey-6">{{ kpi.label }}</div>
                  <div class="text-h6 text-weight-bold" :style="{ color: kpi.hex }">{{ kpi.value }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <!-- Histórico button -->
        <div class="col-6 col-md-4">
          <q-card flat bordered class="kpi-card historico-card cursor-pointer"
            @click="$router.push('/historico-icit')">
            <q-card-section class="q-pa-md full-height">
              <div class="row items-center justify-between no-wrap full-height">
                <div>
                  <div class="text-caption text-grey-6">Visualizar</div>
                  <div class="text-subtitle1 text-weight-bold" style="color:#8B1C2B">Histórico ICIT</div>
                  <div class="text-caption text-grey-5">Clique aqui para seguir</div>
                </div>
                <q-icon name="mdi-chart-timeline-variant" size="48px" color="deep-orange-8" style="opacity:.7" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts main grid: LEFT 9 cols + RIGHT 3 cols (equipe) -->
      <div class="row q-col-gutter-md">

        <!-- LEFT: 3Ã—2 grid -->
        <div class="col-12 col-md-9">

          <!-- Row 1: Donut · Mês · Gerência -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice Geral de conformidade</div>
                  <div class="text-caption text-grey-6">Clique na fatia para filtrar</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartDonut" autoresize style="height:260px" @click="onDonutClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de conformidade por Mês</div>
                  <div class="text-caption text-grey-6">ICIT no ano · clique no mês para abrir</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartMes" autoresize style="height:260px" @click="onMesClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de conformidade por Gerência</div>
                  <div class="text-caption text-grey-6">Clique para filtrar a gerência</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartGerencia" autoresize style="height:260px" @click="onGerenciaClick" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Base · Não conformidades por Categoria -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de conformidade por Base</div>
                  <div class="text-caption text-grey-6">Clique para ver só esta base</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartBase" autoresize style="height:260px" @click="onBaseClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-8">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Não conformidades por Categoria</div>
                  <div class="text-caption text-grey-6">Clique na categoria para filtrar</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartCategoria" autoresize style="height:260px" @click="onCategoriaClick" />
                </q-card-section>
              </q-card>
            </div>
          </div>

        </div>

        <!-- RIGHT: Equipe (full height) -->
        <div class="col-12 col-md-3 equipe-col">
          <q-card flat bordered class="equipe-card chart-card chart-card--vertical">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Índice de conformidade por Equipe</div>
              <div class="text-caption text-grey-6">Clique na equipe · role para ver mais</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartEquipe" autoresize style="height:564px" @click="onEquipeClick" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtPct, fmtN } from "@/composables/useChecklistData";
import { rotuloSemana } from "@/lib/semanas";
import { filterByGerencia, filterByGerente, semanaDaData, indexEmployees, matchSubmissionToEmployee, fetchSubmissions, fetchResponses, type ResponseRow, type SubmissionRow, filterByCoordenador } from "@/lib/dashboard";
import { lerTipoPoc, salvarTipoPoc } from "@/lib/tipo-poc";
import { metaRoleFrom } from "@/composables/useGoals";

use([
  CanvasRenderer, BarChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent
]);

const {
  loading,
  submissions, responses, employees,
  load,
  gerentesOpts: gerentes,
  coordenadoresOpts: coordenadores,
} = useChecklistData();

// â"€â"€â"€ Paleta â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const P = {
  conf:    "#16a34a",
  confLt:  "#22c55e",
  inconf:  "#8B1C2B",
  inconfLt:"#C4364E",
};

// â"€â"€â"€ Filter options â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const now = new Date();
const anos     = [2024, 2025, 2026];
const semanas = computed(() => [
  { value: 0, label: "Todas" },
  ...[1, 2, 3, 4].map((v) => ({ value: v, label: rotuloSemana(filters.ano, filters.mes, v) })),
]);
const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];
const gerencias  = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];
const bases      = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const segurancas = ["Todos", "Segurança"];
const tiposPoc   = ["Todos", "Administrativo", "Operacional"];
// â"€â"€â"€ Filter state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const filters = reactive({
  ano:       now.getFullYear(),
  semana:    0,
  mes:       now.getMonth() + 1,
  gerencia:  "Todos",
  base:      "Todos",
  seguranca: "Segurança",
  tipoPoc:   lerTipoPoc(tiposPoc),
  gerente:   "Todos", coordenador: "Todos",
});
watch(() => filters.tipoPoc, salvarTipoPoc);

async function recarregarMes() {
  await load({
    ano: filters.ano,
    mes: filters.mes,
    contarMeta: true,
  });
}

const yearSubs = ref<SubmissionRow[]>([]);
const yearResps = ref<ResponseRow[]>([]);

async function recarregarAno() {
  const subs = await fetchSubmissions({ ano: filters.ano, contarMeta: true });
  yearSubs.value = subs;
  yearResps.value = await fetchResponses(subs.map((s) => s.id));
}

async function recarregar() {
  await Promise.all([recarregarMes(), recarregarAno()]);
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregarMes);
watch(() => filters.ano, recarregarAno);

const viz = reactive({
  equipe: null as string | null,
  categoria: null as string | null,
  lado: null as "semNc" | "comNc" | null,
});

const BASE_NOME: Record<string, string> = {
  BCB: "Bacabal",
  BDC: "Barra do Corda",
  ITM: "Imperatriz",
  PDS: "Pedreiras",
  PDT: "Presidente Dutra",
  STI: "Santa Inês",
};

const TIPO_AUDITAGEM: Record<string, string[]> = {
  Administrativo: ["ADMINISTRATIVO", "LOGISTICA", "OFICINA", "ADM"],
  Operacional: ["GOMAN", "GSTC"],
};

function nomeBase(code: string) {
  return BASE_NOME[code] ? `${BASE_NOME[code]} (${code})` : code;
}

function matchTipoPoc(auditagem: string | undefined) {
  if (filters.tipoPoc === "Todos") return true;
  const allowed = TIPO_AUDITAGEM[filters.tipoPoc];
  if (!allowed) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function isSegurancaSub(sub: SubmissionRow, idx: ReturnType<typeof indexEmployees>) {
  const emp = matchSubmissionToEmployee(sub, idx);
  return metaRoleFrom(emp?.gerencia ?? sub.auditagem, emp?.funcao) === "tecnico";
}

function resetSlice() {
  filters.semana = 0;
  filters.gerencia = "Todos";
  filters.base = "Todos";
  filters.tipoPoc = "Todos";
  filters.seguranca = "Segurança";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  viz.equipe = null;
  viz.categoria = null;
  viz.lado = null;
}

type EcClick = {
  componentType?: string;
  dataIndex?: number;
  name?: string;
};

function onMesClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  let mes = 0;
  if (typeof p.dataIndex === "number") mes = p.dataIndex + 1;
  const fromName = meses.find((m) => m.label === p.name);
  if (fromName) mes = fromName.value;
  if (mes < 1 || mes > 12) return;
  filters.mes = mes;
}

function onBaseClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.base = filters.base === p.name ? "Todos" : p.name;
}

function onGerenciaClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.gerencia = filters.gerencia === p.name ? "Todos" : p.name;
}

function onEquipeClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = equipeRows.value[p.dataIndex ?? -1];
  if (!row) return;
  viz.equipe = viz.equipe === row.equipe ? null : row.equipe;
}

function onCategoriaClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = categoriaRows.value[p.dataIndex ?? -1];
  if (!row) return;
  viz.categoria = viz.categoria === row.cat ? null : row.cat;
}

function onDonutClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  const name = (p.name ?? "").toLowerCase();
  const next = name.startsWith("inconf") ? "comNc" : name.startsWith("conf") ? "semNc" : null;
  if (!next) return;
  viz.lado = viz.lado === next ? null : next;
}

const mesLabel = computed(() => meses.find((m) => m.value === filters.mes)?.label ?? "");
const semanaLabel = computed(() => semanas.value.find((s) => s.value === filters.semana)?.label ?? "");
const hasActiveFilters = computed(() =>
  filters.semana !== 0
  || filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.tipoPoc !== "Todos"
  || filters.seguranca !== "Segurança"
  || !!viz.equipe
  || !!viz.categoria
  || !!viz.lado,
);

function applySlice(
  source: SubmissionRow[],
  omit: { week?: boolean; base?: boolean; gerencia?: boolean; tipo?: boolean; seguranca?: boolean; equipe?: boolean; lado?: boolean } = {},
) {
  const idx = indexEmployees(employees.value);
  let s = filterByGerente(source, employees.value, filters.gerente);
  s = filterByCoordenador(s, employees.value, filters.coordenador);
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.week && filters.semana) {
    s = s.filter((sub) => semanaDaData(sub.data) === filters.semana);
  }
  if (!omit.base && filters.base !== "Todos") {
    s = s.filter((sub) => sub.base === filters.base);
  }
  if (!omit.tipo && filters.tipoPoc !== "Todos") {
    s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  }
  if (!omit.seguranca && filters.seguranca === "Segurança") {
    s = s.filter((sub) => isSegurancaSub(sub, idx));
  }
  if (!omit.equipe && viz.equipe) {
    s = s.filter((sub) => (sub.equipe ?? "Sem equipe") === viz.equipe);
  }
  return s;
}

function ncIdSet(resps: ResponseRow[]) {
  const ids = new Set<string>();
  for (const r of resps) {
    if (r.resposta === "nao_conforme") ids.add(r.submission_id);
  }
  return ids;
}

function respsOf(subs: SubmissionRow[], allResps: ResponseRow[], omitCat = false) {
  const ids = new Set(subs.map((s) => s.id));
  let r = allResps.filter((resp) => ids.has(resp.submission_id));
  if (!omitCat && viz.categoria) r = r.filter((resp) => (resp.categoria ?? "Sem categoria") === viz.categoria);
  return r;
}

function applyLado(subs: SubmissionRow[], resps: ResponseRow[]) {
  if (!viz.lado) return subs;
  const ncIds = ncIdSet(resps);
  return viz.lado === "comNc"
    ? subs.filter((s) => ncIds.has(s.id))
    : subs.filter((s) => !ncIds.has(s.id));
}

const slicedSubs = computed(() => applySlice(submissions.value));
const slicedResps = computed(() => respsOf(slicedSubs.value, responses.value));
const filteredSubs = computed(() => applyLado(slicedSubs.value, slicedResps.value));
const filteredResps = computed(() => respsOf(filteredSubs.value, responses.value));

const subsNoBase = computed(() => applyLado(applySlice(submissions.value, { base: true }), respsOf(applySlice(submissions.value, { base: true }), responses.value)));
const subsNoGerencia = computed(() => applyLado(applySlice(submissions.value, { gerencia: true }), respsOf(applySlice(submissions.value, { gerencia: true }), responses.value)));
const subsNoEquipe = computed(() => applyLado(applySlice(submissions.value, { equipe: true }), respsOf(applySlice(submissions.value, { equipe: true }), responses.value)));
const subsNoLado = computed(() => slicedSubs.value);

const totalConformes    = computed(() => filteredResps.value.filter(r => r.resposta === "conforme").length);
const totalNaoConformes = computed(() => filteredResps.value.filter(r => r.resposta === "nao_conforme").length);
const conformidadeIndex = computed(() => {
  const t = filteredResps.value.length;
  return t ? totalConformes.value / t : 0;
});
const equipesAuditadas = computed(() => new Set(filteredSubs.value.map(s => s.equipe).filter(Boolean)).size);

const donutNcIds = computed(() => ncIdSet(respsOf(subsNoLado.value, responses.value)));
const subsComNc = computed(() => subsNoLado.value.filter(s => donutNcIds.value.has(s.id)).length);
const subsSemNc = computed(() => subsNoLado.value.length - subsComNc.value);
const checklistIndex = computed(() => {
  const t = filteredSubs.value.length;
  const ncIds = ncIdSet(filteredResps.value);
  const sem = filteredSubs.value.filter((s) => !ncIds.has(s.id)).length;
  return t ? sem / t : 0;
});

const kpiNcIds = computed(() => ncIdSet(filteredResps.value));
const kpiSemNc = computed(() => filteredSubs.value.filter((s) => !kpiNcIds.value.has(s.id)).length);
const kpiComNc = computed(() => filteredSubs.value.filter((s) => kpiNcIds.value.has(s.id)).length);

const kpis = computed(() => [
  { label: "Conformidade",     value: fmtN(kpiSemNc.value),            icon: "mdi-check-circle",  color: "positive", hex: "#16a34a" },
  { label: "Inconformidade",   value: fmtN(kpiComNc.value),            icon: "mdi-alert-circle",  color: "negative", hex: "#dc2626" },
  { label: "Índice Geral",     value: fmtPct(checklistIndex.value),    icon: "mdi-gauge",         color: "teal",     hex: "#0d9488" },
  { label: "Equipes Auditadas",value: fmtN(equipesAuditadas.value),    icon: "mdi-account-group", color: "primary",  hex: "#0284c7" },
]);

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function tooltipSkin(trigger: "axis" | "item") {
  return {
    trigger,
    backgroundColor: chartInk.tipBg,
    borderColor: chartInk.tipBorder,
    borderWidth: 1,
    padding: [12, 14] as [number, number],
    textStyle: { color: chartInk.tipText, fontSize: 12, fontWeight: 500 as const },
    extraCssText: "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.45);",
  };
}

function tipHtml(title: string, rows: { label: string; value: string; color?: string }[], foot?: string) {
  const t = chartInk.tipText;
  const m = chartInk.tipMuted;
  const body = rows
    .map((r) =>
      `<div style="display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-top:6px">`
      + `<span style="color:${m};font-size:11px;font-weight:600;letter-spacing:.02em">${r.label}</span>`
      + `<span style="color:${r.color ?? t};font-size:13px;font-weight:800">${r.value}</span>`
      + `</div>`,
    )
    .join("");
  const hint = foot
    ? `<div style="color:${m};font-size:10px;margin-top:8px;opacity:.9">${foot}</div>`
    : "";
  return `<div style="min-width:168px;color:${t};font-family:inherit">`
    + `<div style="font-weight:800;font-size:14px;line-height:1.25;color:${t}">${title}</div>`
    + body
    + hint
    + `</div>`;
}

function mesDaData(data: string) {
  const m = /^(\d{4})-(\d{2})/.exec(data);
  return m ? Number(m[2]) : 0;
}

function icitPct(subs: SubmissionRow[], resps: ResponseRow[]) {
  if (!subs.length) return 0;
  const nc = ncIdSet(resps);
  const sem = subs.filter((s) => !nc.has(s.id)).length;
  return Math.round((sem / subs.length) * 100);
}

function answerPct(subs: SubmissionRow[], resps: ResponseRow[]) {
  const ids = new Set(subs.map((s) => s.id));
  let conf = 0;
  let total = 0;
  for (const r of resps) {
    if (!ids.has(r.submission_id)) continue;
    total++;
    if (r.resposta === "conforme") conf++;
  }
  return total ? Math.round((conf / total) * 100) : 0;
}

function hBar(
  rows: { name: string; value: number }[],
  selected: string | null,
  color = P.conf,
  suffix = "%",
  maxVal = 100,
  foot = "Clique para filtrar as outras visões",
) {
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: suffix === "%" ? "ICIT" : "Ocorrências", value: `${p.value}${suffix}`, color },
        ], foot),
    },
    grid: { left: 12, right: 44, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, max: maxVal, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: rows.map((r) => r.name),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 11 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: rows.map((r) => ({
        value: r.value,
        itemStyle: {
          color,
          opacity: !selected || selected === r.name ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
          shadowColor: "rgba(0,0,0,.06)",
          shadowBlur: 4,
        },
      })),
      barMaxWidth: 28,
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const,
        color,
        formatter: (p: { value: number }) => `${p.value}${suffix}`,
      },
    }],
  };
}

const chartDonut = computed(() => ({
  tooltip: {
    ...tooltipSkin("item"),
    formatter: (p: { name: string; value: number; percent: number }) =>
      tipHtml(p.name, [
        { label: "Checklists", value: String(p.value), color: p.name.toLowerCase().startsWith("inconf") ? P.inconf : P.conf },
        { label: "Fatia", value: `${p.percent.toFixed(0)}%` },
      ], "Clique para ver só este grupo"),
  },
  legend: {
    bottom: 4, left: "center", itemWidth: 10, itemHeight: 10, itemGap: 16,
    textStyle: { color: chartInk.muted, fontSize: 11 },
  },
  title: {
    text: fmtPct(checklistIndex.value),
    subtext: "checklists perfeitos",
    left: "50%", top: "34%", textAlign: "center",
    textStyle: { fontSize: 26, fontWeight: "bold" as const, color: P.conf },
    subtextStyle: { fontSize: 11, color: chartInk.faint },
  },
  series: [{
    type: "pie" as const,
    radius: ["52%", "74%"], center: ["50%", "46%"],
    avoidLabelOverlap: false,
    cursor: "pointer",
    label: {
      show: true,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `{nm|${p.name}}\n{vl|${p.value} (${p.percent.toFixed(0)}%)}`,
      rich: {
        nm: { fontSize: 10, color: chartInk.muted },
        vl: { fontSize: 11, fontWeight: "bold", color: chartInk.axis },
      },
    },
    labelLine: { length: 10, length2: 8 },
    itemStyle: { borderRadius: 8, borderColor: chartInk.halo, borderWidth: 3 },
    emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 16, shadowColor: "rgba(0,0,0,.15)" } },
    data: [
      {
        value: subsSemNc.value,
        name: "conformidade",
        itemStyle: { color: P.conf, opacity: !viz.lado || viz.lado === "semNc" ? 1 : 0.22 },
      },
      {
        value: subsComNc.value,
        name: "Inconformidade",
        itemStyle: { color: P.inconf, opacity: !viz.lado || viz.lado === "comNc" ? 1 : 0.22 },
      },
    ],
  }],
}));

const yearSliced = computed(() => applyLado(applySlice(yearSubs.value), respsOf(applySlice(yearSubs.value), yearResps.value)));

const chartMes = computed(() => {
  const mesLabels = meses.map((m) => m.label);
  const groups: SubmissionRow[][] = Array.from({ length: 12 }, () => []);
  for (const s of yearSliced.value) {
    const m = mesDaData(s.data);
    if (m >= 1 && m <= 12) groups[m - 1]!.push(s);
  }
  const rows = mesLabels.map((name, i) => ({
    name,
    value: icitPct(groups[i]!, respsOf(groups[i]!, yearResps.value)),
  }));
  return hBar(
    rows,
    mesLabels[filters.mes - 1] ?? null,
    P.conf,
    "%",
    100,
    "Clique para abrir o recorte daquele mês",
  );
});

const chartGerencia = computed(() => {
  const idx = indexEmployees(employees.value);
  const map: Record<string, SubmissionRow[]> = {};
  for (const s of subsNoGerencia.value) {
    const emp = matchSubmissionToEmployee(s, idx);
    const g = emp?.gerencia ?? s.auditagem ?? "Outro";
    (map[g] ??= []).push(s);
  }
  const resps = respsOf(subsNoGerencia.value, responses.value);
  const rows = Object.entries(map)
    .map(([name, list]) => ({ name, value: answerPct(list, resps) }))
    .sort((a, b) => a.value - b.value);
  return hBar(rows, filters.gerencia !== "Todos" ? filters.gerencia : null, P.conf, "%", 100, "Clique para filtrar a gerência");
});

const chartBase = computed(() => {
  const map: Record<string, SubmissionRow[]> = {};
  for (const s of subsNoBase.value) {
    (map[s.base] ??= []).push(s);
  }
  const resps = respsOf(subsNoBase.value, responses.value);
  const rows = Object.entries(map)
    .map(([name, list]) => ({ name, value: answerPct(list, resps) }))
    .sort((a, b) => a.value - b.value);
  return hBar(rows, filters.base !== "Todos" ? filters.base : null, P.conf, "%", 100, "Clique para ver só esta base");
});

const categoriaRows = computed(() => {
  const ncMap: Record<string, number> = {};
  for (const r of respsOf(filteredSubs.value, responses.value, true)) {
    if (r.resposta !== "nao_conforme") continue;
    const cat = r.categoria ?? "Sem categoria";
    ncMap[cat] = (ncMap[cat] ?? 0) + 1;
  }
  return Object.entries(ncMap)
    .map(([cat, nc]) => ({ cat, nc }))
    .filter((e) => e.nc > 0)
    .sort((a, b) => a.nc - b.nc);
});

const chartCategoria = computed(() => {
  const rows = categoriaRows.value;
  const maxV = Math.max(...rows.map((e) => e.nc), 1);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number; value: number }) => {
        const o = rows[p.dataIndex];
        if (!o) return "";
        return tipHtml(o.cat, [
          { label: "Não conformes", value: String(p.value), color: P.inconf },
        ], "Clique para filtrar esta categoria");
      },
    },
    grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: rows.map((e) => e.cat),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 11 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: rows.map((e) => ({
        value: e.nc,
        itemStyle: {
          color: e.nc <= 2 ? P.inconfLt : `rgba(139,28,43,${0.6 + (e.nc / maxV) * 0.4})`,
          opacity: !viz.categoria || viz.categoria === e.cat ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 28,
      emphasis: { itemStyle: { opacity: 0.8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 12, fontWeight: "bold" as const,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

const equipeRows = computed(() => {
  const map: Record<string, SubmissionRow[]> = {};
  for (const s of subsNoEquipe.value) {
    const eq = s.equipe ?? "Sem equipe";
    (map[eq] ??= []).push(s);
  }
  const resps = respsOf(subsNoEquipe.value, responses.value);
  return Object.entries(map)
    .map(([equipe, list]) => ({ equipe, value: answerPct(list, resps) }))
    .sort((a, b) => a.value - b.value);
});

const chartEquipe = computed(() => {
  const data = equipeRows.value.length ? equipeRows.value : [{ equipe: "Sem dados", value: 0 }];
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Conformidade", value: `${p.value}%`, color: p.value === 100 ? P.conf : P.inconfLt },
        ], "Clique para filtrar esta equipe"),
    },
    grid: { left: 12, right: 52, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, max: 100, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const,
      data: data.map((e) => e.equipe),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 10 },
    },
    dataZoom: [{
      type: "inside" as const,
      orient: "vertical" as const,
      startValue: Math.max(0, data.length - 16),
      endValue: Math.max(0, data.length - 1),
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true,
    }],
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: data.map((e) => ({
        value: e.value,
        itemStyle: {
          color: e.value === 100 ? P.conf : e.value >= 90 ? "#84cc16" : P.inconfLt,
          opacity: !viz.equipe || viz.equipe === e.equipe ? 1 : 0.22,
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barMaxWidth: 18,
      emphasis: { itemStyle: { opacity: 0.8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 10, fontWeight: "bold" as const,
        formatter: (p: { value: number }) => `${p.value}%`,
      },
    }],
  };
});

</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$border:       #e2e8f0;
$label-color:  #94a3b8;

.icit-page {
  background: #f8fafc;
  min-height: 100vh;
}

.filter-bar {
  background: #fff;
  border-bottom: 1px solid $border;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 10px 20px 6px;
  position: sticky;
  top: 0;
  z-index: 100;
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
  font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;

  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand, .05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35); font-weight: 600;
  }
}

.fgroup--gerente { min-width: 180px; }
.gerente-select {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg; padding: 0 10px 0 4px;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) { border-color: $brand; box-shadow: 0 0 0 2px rgba($brand,.15); }
  :deep(.q-field__native) { font-size: 12px; font-weight: 500; color: $inactive-text; padding: 0; min-height: unset; line-height: 30px; }
  :deep(.q-field__append) { height: 30px; .q-icon { font-size: 16px; color: $label-color; } }
  :deep(.q-field__prepend) { height: 30px; padding-right: 4px; }
}
.gerente-icon { color: $label-color; }
:global(.gerente-popup .q-item) { font-size: 12px; min-height: 32px; padding: 4px 12px; }
:global(.gerente-popup .q-item--active) { color: $brand !important; font-weight: 600; }

.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  flex-wrap: wrap;
}

.filter-summary__label {
  font-size: 11px;
  color: $label-color;
  font-weight: 600;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  background: rgba($brand, .1);
  color: $brand;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;

  &--hit { cursor: pointer; }
  &--hit:hover { filter: brightness(0.92); }
}

.filter-clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 10px;
  background: none;
  border: 1px solid $border;
  border-radius: 999px;
  font-size: 11px;
  color: $label-color;
  cursor: pointer;

  &:hover {
    color: $brand;
    border-color: $brand;
  }
}

.chart-hit { cursor: pointer; }

.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.historico-card {
  border: 1.5px solid rgba(139,28,43,.2);
  background: linear-gradient(135deg, #fff9f9 0%, #fff 100%);
  &:hover {
    box-shadow: 0 4px 20px rgba(139,28,43,.2);
    border-color: rgba(139,28,43,.4);
  }
}

.equipe-col { display: flex; flex-direction: column; }
.equipe-card { height: 100%; }

.body--dark {
  .icit-page   { background: #0f172a; }
  .filter-bar  { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label  { color: #64748b; }
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

