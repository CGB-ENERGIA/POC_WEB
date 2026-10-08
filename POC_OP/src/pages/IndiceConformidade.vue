<template>
  <q-page class="indice-page">

    <!-- ══════════════════════════════════════════════════════
         FILTER BAR
    ══════════════════════════════════════════════════════ -->
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

        <!-- Row 2: Mês · Gerência · Base · Tipo de POC -->
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

          <div class="filter-divider" />

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
          <span v-if="viz.equipe" class="filter-chip filter-chip--hit" @click="viz.equipe = null">{{ viz.equipe }}</span>
          <span v-if="viz.perguntaCurta" class="filter-chip filter-chip--hit" @click="clearPergunta">{{ viz.perguntaCurta }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- ══════════════════════════════════════════════════════
         KPI + CHARTS
    ══════════════════════════════════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3" v-for="kpi in kpis" :key="kpi.label">
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
      </div>

      <!-- Charts main grid -->
      <div class="row q-col-gutter-md">

        <!-- LEFT+CENTER (8 cols) -->
        <div class="col-12 col-md-8">

          <!-- Row 1: Comportamento de Desvio Mensal + Qnt Inconformidade por Base -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Comportamento de Desvio Mensal</div>
                  <div class="text-caption text-grey-6">Clique no mês para abrir aquele recorte</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartTendenciaMensal" autoresize style="height:260px" @click="onMesClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Qnt Inconformidade por Base</div>
                  <div class="text-caption text-grey-6">Clique na base para filtrar o restante</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartBase" autoresize style="height:260px" @click="onBaseClick" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Por Gerência + Por Equipe -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Qnt de Inconformidade por Gerência</div>
                  <div class="text-caption text-grey-6">Clique na gerência para filtrar</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartGerencia" autoresize style="height:260px" @click="onGerenciaClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Qnt de Inconformidade por Equipe</div>
                  <div class="text-caption text-grey-6">Clique na equipe · role para ver mais</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartEquipe" autoresize style="height:260px" @click="onEquipeClick" />
                </q-card-section>
              </q-card>
            </div>
          </div>

        </div>

        <!-- RIGHT: Ranking (full height) -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card ranking-card chart-card--vertical">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Ranking Geral de Não Conformidades</div>
              <div class="text-caption text-grey-6">Clique no item para ver só ele</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartRanking" autoresize style="height:536px" @click="onRankingClick" />
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
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN, fmtPct } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, fetchNaoConformesPorMes, semanaDaData, indexEmployees, matchSubmissionToEmployee, filterByCoordenador, type NcPorMesOpts } from "@/lib/dashboard";
import { lerTipoPoc, salvarTipoPoc } from "@/lib/tipo-poc";

use([
  CanvasRenderer, BarChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent
]);

// ─── Paleta ───────────────────────────────────────────────────────────────────
const P = {
  conf:    "#16a34a",
  confLt:  "#22c55e",
  inconf:  "#8B1C2B",
  inconfLt:"#C4364E",
  track:   "#f1f5f9",
  border:  "#e2e8f0",
};

// ─── Filter options ───────────────────────────────────────────────────────────
const showFilters = ref(false);

const anos     = [2024, 2025, 2026];
const semanas  = [
  { value: 0, label: "Todas"       },
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda"  },
  { value: 3, label: "3. Terceira" },
  { value: 4, label: "4. Quarta"   },
];
const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];
const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];
const bases     = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const tiposPoc  = ["Todos", "Administrativo", "Operacional"];

// ─── Filter state ─────────────────────────────────────────────────────────────
const now = new Date();
const filters = reactive({
  ano:      now.getFullYear(),
  semana:   0,
  mes:      now.getMonth() + 1,
  gerencia: "Todos",
  base:     "Todos",
  tipoPoc:  lerTipoPoc(tiposPoc),
  gerente:  "Todos", coordenador: "Todos",
});
watch(() => filters.tipoPoc, salvarTipoPoc);

// ─── Dados reais ──────────────────────────────────────────────────────────────
const {
  loading,
  load,
  submissions,
  responses,
  employees,
  gerentesOpts: gerentes,
  coordenadoresOpts: coordenadores,
} = useChecklistData();

const ncPorMes = ref<Record<number, number>>({});

const viz = reactive({
  equipe: null as string | null,
  pergunta: null as string | null,
  perguntaCurta: null as string | null,
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

function clearPergunta() {
  viz.pergunta = null;
  viz.perguntaCurta = null;
}

function resetSlice() {
  filters.semana = 0;
  filters.gerencia = "Todos";
  filters.base = "Todos";
  filters.tipoPoc = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  viz.equipe = null;
  clearPergunta();
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

function onRankingClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = rankingRows.value[p.dataIndex ?? -1];
  if (!row) return;
  if (viz.pergunta === row.pergunta) {
    clearPergunta();
    return;
  }
  viz.pergunta = row.pergunta;
  viz.perguntaCurta = row.short;
}

const mesLabel = computed(() => meses.find((m) => m.value === filters.mes)?.label ?? "");
const semanaLabel = computed(() => semanas.find((s) => s.value === filters.semana)?.label ?? "");
const hasActiveFilters = computed(() =>
  filters.semana !== 0
  || filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.tipoPoc !== "Todos"
  || !!viz.equipe
  || !!viz.pergunta,
);

async function recarregarMes() {
  await load({
    ano: filters.ano,
    mes: filters.mes,
    contarMeta: true,
  });
}

async function recarregarAno() {
  const opts: NcPorMesOpts = {
    contarMeta: true,
    allowedAuditagens: filters.tipoPoc !== "Todos" ? TIPO_AUDITAGEM[filters.tipoPoc] : undefined,
    employees: employees.value,
    gerencia: filters.gerencia,
    gerente: filters.gerente,
    coordenador: filters.coordenador,
  };
  ncPorMes.value = await fetchNaoConformesPorMes(
    filters.ano,
    filters.base !== "Todos" ? filters.base : undefined,
    opts,
  );
}

async function recarregar() {
  await recarregarMes();
  await recarregarAno();
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregarMes);
watch(
  () => [filters.ano, filters.base, filters.tipoPoc, filters.gerencia, filters.gerente, filters.coordenador],
  recarregarAno,
);

function applySlice(
  source: typeof submissions.value,
  omit: { week?: boolean; base?: boolean; gerencia?: boolean; tipo?: boolean; equipe?: boolean } = {},
) {
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
  if (!omit.equipe && viz.equipe) {
    s = s.filter((sub) => sub.equipe === viz.equipe);
  }
  return s;
}

const filteredSubs = computed(() => applySlice(submissions.value));
const subsNoBase = computed(() => applySlice(submissions.value, { base: true }));
const subsNoGerencia = computed(() => applySlice(submissions.value, { gerencia: true }));
const subsNoEquipe = computed(() => applySlice(submissions.value, { equipe: true }));

function respsOf(subs: typeof submissions.value, omitPergunta = false) {
  const ids = new Set(subs.map((s) => s.id));
  let r = responses.value.filter((resp) => ids.has(resp.submission_id));
  if (!omitPergunta && viz.pergunta) r = r.filter((resp) => resp.pergunta === viz.pergunta);
  return r;
}

const filteredResps = computed(() => respsOf(filteredSubs.value));
const respsNoPergunta = computed(() => respsOf(filteredSubs.value, true));

const totalConformes    = computed(() => filteredResps.value.filter(r => r.resposta === "conforme").length);
const totalNaoConformes = computed(() => filteredResps.value.filter(r => r.resposta === "nao_conforme").length);
const conformidadeIndex = computed(() => {
  const t = filteredResps.value.length;
  return t ? totalConformes.value / t : 0;
});
const basesCovertas = computed(() => new Set(filteredSubs.value.map(s => s.base)).size);

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: "Conformidade",    value: loading.value ? "…" : fmtN(totalConformes.value),    icon: "mdi-check-circle",     color: "positive", hex: "#16a34a" },
  { label: "Inconformidade",  value: loading.value ? "…" : fmtN(totalNaoConformes.value), icon: "mdi-alert-circle",     color: "negative", hex: "#dc2626" },
  { label: "Índice Geral",    value: loading.value ? "…" : fmtPct(conformidadeIndex.value, 2), icon: "mdi-gauge-full", color: "teal",     hex: "#0d9488" },
  { label: "Bases Auditadas", value: loading.value ? "…" : String(basesCovertas.value),   icon: "mdi-map-marker-check", color: "primary",  hex: "#0284c7" },
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function ncCount(subs: typeof submissions.value, resps: typeof responses.value) {
  const ids = new Set(subs.map((s) => s.id));
  let n = 0;
  for (const r of resps) {
    if (ids.has(r.submission_id) && r.resposta === "nao_conforme") n++;
  }
  return n;
}

function hBar(
  rows: { name: string; value: number }[],
  selected: string | null,
  color = P.inconf,
  foot = "Clique para filtrar as outras visões",
) {
  const names = rows.map((r) => r.name);
  const maxVal = Math.max(...rows.map((r) => r.value), 1);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Não conformes", value: String(p.value), color },
        ], foot),
    },
    grid: { left: 12, right: 44, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "value" as const,
      max: maxVal,
      show: false,
      splitLine: { show: false },
    },
    yAxis: {
      type: "category" as const,
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 11 },
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
          shadowColor: "rgba(0,0,0,.08)",
          shadowBlur: !selected || selected === r.name ? 4 : 0,
        },
      })),
      barMaxWidth: 26,
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true,
        position: "right" as const,
        fontSize: 11,
        fontWeight: "bold" as const,
        color,
        formatter: (p: { value: number }) => String(p.value),
      },
    }],
  };
}

const ncPorBase = computed(() => {
  const map: Record<string, number> = {};
  const resps = respsOf(subsNoBase.value);
  for (const s of subsNoBase.value) {
    const n = ncCount([s], resps);
    if (!n) continue;
    map[s.base] = (map[s.base] ?? 0) + n;
  }
  return map;
});

const ncPorGerenciaLocal = computed(() => {
  const map: Record<string, number> = {};
  const idx = indexEmployees(employees.value);
  const resps = respsOf(subsNoGerencia.value);
  for (const s of subsNoGerencia.value) {
    const n = ncCount([s], resps);
    if (!n) continue;
    const emp = matchSubmissionToEmployee(s, idx);
    const g = emp?.gerencia ?? s.auditagem;
    map[g] = (map[g] ?? 0) + n;
  }
  return map;
});

const equipeRows = computed(() => {
  const map: Record<string, number> = {};
  const resps = respsOf(subsNoEquipe.value);
  for (const s of subsNoEquipe.value) {
    if (!s.equipe) continue;
    const n = ncCount([s], resps);
    if (!n) continue;
    map[s.equipe] = (map[s.equipe] ?? 0) + n;
  }
  return Object.entries(map)
    .sort((a, b) => a[1] - b[1])
    .map(([equipe, value]) => ({
      equipe,
      name: equipe.length > 16 ? `${equipe.slice(0, 15)}…` : equipe,
      value,
    }));
});

const rankingRows = computed(() => {
  const map: Record<string, number> = {};
  for (const r of respsNoPergunta.value) {
    if (r.resposta !== "nao_conforme") continue;
    map[r.pergunta] = (map[r.pergunta] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => a[1] - b[1])
    .slice(-17)
    .map(([pergunta, value]) => ({
      pergunta,
      short: pergunta.length > 28 ? `${pergunta.slice(0, 27)}.` : pergunta,
      value,
    }));
});

const chartTendenciaMensal = computed(() => {
  const mesLabels = meses.map((m) => m.label);
  const vals = mesLabels.map((_, i) => ncPorMes.value[i + 1] ?? 0);
  return {
    tooltip: {
      ...tooltipSkin("axis"),
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return tipHtml(`${p.name} · ${filters.ano}`, [
          { label: "Desvios no mês", value: String(p.value), color: P.inconf },
        ], "Clique para abrir o recorte daquele mês");
      },
    },
    grid: { left: 8, right: 16, top: 32, bottom: 8 },
    xAxis: {
      type: "category" as const,
      data: mesLabels,
      axisLine: { lineStyle: { color: chartInk.split } },
      axisTick: { show: false },
      axisLabel: { color: chartInk.muted, fontSize: 11 },
    },
    yAxis: {
      type: "value" as const,
      show: false,
      splitLine: { show: false },
    },
    series: [{
      type: "line" as const,
      cursor: "pointer",
      data: vals.map((v, i) => ({
        value: v,
        itemStyle: { opacity: filters.mes === i + 1 ? 1 : 0.28 },
      })),
      smooth: false,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { color: P.inconf, width: 3 },
      itemStyle: { color: P.inconf, borderColor: chartInk.halo, borderWidth: 2 },
      label: {
        show: true,
        position: "top" as const,
        fontSize: 11,
        fontWeight: "bold" as const,
        color: chartInk.axis,
        formatter: (p: { value: number; dataIndex: number }) =>
          filters.mes === p.dataIndex + 1 || p.value ? String(p.value) : "",
      },
      areaStyle: {
        color: {
          type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(139,28,43,.22)" },
            { offset: 1, color: "rgba(139,28,43,0)" },
          ],
        },
      },
    }],
  };
});

const chartBase = computed(() => {
  const entries = Object.entries(ncPorBase.value).sort((a, b) => a[1] - b[1]);
  return hBar(
    entries.map(([name, value]) => ({ name, value })),
    filters.base !== "Todos" ? filters.base : null,
    P.inconf,
    "Clique para ver só esta base",
  );
});

const chartGerencia = computed(() => {
  const entries = Object.entries(ncPorGerenciaLocal.value).sort((a, b) => a[1] - b[1]);
  return hBar(
    entries.map(([name, value]) => ({ name, value })),
    filters.gerencia !== "Todos" ? filters.gerencia : null,
    P.inconf,
    "Clique para filtrar a gerência",
  );
});

const chartEquipe = computed(() => {
  const rows = equipeRows.value;
  const selected = viz.equipe
    ? (rows.find((r) => r.equipe === viz.equipe)?.name ?? viz.equipe)
    : null;
  return {
    ...hBar(
      rows.map((r) => ({ name: r.name, value: r.value })),
      selected,
      P.inconf,
      "Clique para filtrar esta equipe",
    ),
    dataZoom: [{
      type: "inside" as const,
      orient: "vertical" as const,
      startValue: Math.max(0, rows.length - 10),
      endValue: Math.max(0, rows.length - 1),
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true,
    }],
  };
});

const chartRanking = computed(() => {
  const rows = rankingRows.value;
  const n = rows.length;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number; value: number }) => {
        const o = rows[p.dataIndex];
        if (!o) return "";
        return tipHtml(o.pergunta, [
          { label: "Ocorrências", value: String(p.value), color: P.inconf },
        ], "Clique para ver só este item");
      },
    },
    grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const,
      data: rows.map((r) => r.short),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 11 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: rows.map((r, i) => ({
        value: r.value,
        itemStyle: {
          color: i === n - 1 ? P.inconf
            : i >= n - 3 ? P.inconfLt
            : `rgba(139,28,43,${0.55 + (i / Math.max(n, 1)) * 0.45})`,
          opacity: !viz.pergunta || viz.pergunta === r.pergunta ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 24,
      emphasis: { itemStyle: { opacity: 0.8 } },
      label: {
        show: true,
        position: "right" as const,
        fontSize: 12,
        fontWeight: "bold" as const,
        color: P.inconf,
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

.indice-page {
  background: #f8fafc;
  min-height: 100vh;
}

// ── Filter bar ────────────────────────────────────────────────────────────────
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

// ── Pills ─────────────────────────────────────────────────────────────────────
.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  height: 30px; padding: 0 12px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;

  &:hover:not(.pill--active) {
    border-color: $brand; color: $brand;
    background: rgba($brand, .05);
  }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35); font-weight: 600;
  }
}

// ── Gerente select ────────────────────────────────────────────────────────────
.fgroup--gerente { min-width: 180px; }
.gerente-select {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg;
    padding: 0 10px 0 4px;
    transition: border-color .18s;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) {
    border-color: $brand;
    box-shadow: 0 0 0 2px rgba($brand, .15);
  }
  :deep(.q-field__native) {
    font-size: 12px; font-weight: 500; color: $inactive-text;
    padding: 0; min-height: unset; line-height: 30px;
  }
  :deep(.q-field__append) { height: 30px; .q-icon { font-size: 16px; color: $label-color; } }
  :deep(.q-field__prepend) { height: 30px; padding-right: 4px; }
}
.gerente-icon { color: $label-color; }
:global(.gerente-popup .q-item) { font-size: 12px; min-height: 32px; padding: 4px 12px; }
:global(.gerente-popup .q-item--active) { color: $brand !important; font-weight: 600; }

// ── Divider ───────────────────────────────────────────────────────────────────
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
  transition: color .15s, border-color .15s;

  &:hover {
    color: $brand;
    border-color: $brand;
  }
}

.chart-hit { cursor: pointer; }

// ── KPI card ──────────────────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}

// ── Ranking card full height ───────────────────────────────────────────────────
.ranking-card { height: 100%; }

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .indice-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand, .1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label   { color: #64748b; }
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
