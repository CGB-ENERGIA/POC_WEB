<template>
  <q-page class="icit-page">

    <!-- ══════════════════════════════════════════════════════
         FILTER BAR
    ══════════════════════════════════════════════════════ -->
    <div class="filter-bar">
      <div class="filter-fab-wrap">
        <button
          v-draggable
          class="filter-fab"
          :class="{ 'filter-fab--active': showFilters }"
          @click="showFilters = !showFilters">
          <q-icon name="mdi-tune" size="20px" />
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
    </div>

    <!-- ══════════════════════════════════════════════════════
         KPI + CHARTS
    ══════════════════════════════════════════════════════ -->
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

        <!-- LEFT: 3×2 grid -->
        <div class="col-12 col-md-9">

          <!-- Row 1: Donut · Mês · Gerência -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice Geral de Conformidade</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartDonut" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Mês</div>
                  <div class="text-caption text-grey-6">% acumulada</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartMes" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Gerência</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartGerencia" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Base · Não Conformidades por Categoria -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Base</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartBase" autoresize style="height:240px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-8">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Não Conformidades por Categoria</div>
                  <div class="text-caption text-grey-6">Ocorrências no período</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartCategoria" autoresize style="height:240px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

        </div>

        <!-- RIGHT: Equipe (full height) -->
        <div class="col-12 col-md-3 equipe-col">
          <q-card flat bordered class="equipe-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Equipe</div>
              <div class="text-caption text-grey-6">Role para ver mais</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartEquipe" autoresize style="height:564px" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
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

use([
  CanvasRenderer, BarChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent
]);

// ─── Paleta ───────────────────────────────────────────────────────────────────
const P = {
  conf:    "#16a34a",
  confLt:  "#22c55e",
  inconf:  "#8B1C2B",
  inconfLt:"#C4364E",
};

// ─── Filter options ───────────────────────────────────────────────────────────
const showFilters = ref(false);

const anos     = [2024, 2025, 2026];
const semanas  = [
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda"  },
  { value: 3, label: "3. Terceira" },
  { value: 4, label: "4. Quarta"   },
];
const meses = [
  { value: 1, label: "jan/26" }, { value: 2, label: "fev/26" },
  { value: 3, label: "mar/26" }, { value: 4, label: "abr/26" },
  { value: 5, label: "mai/26" }, { value: 6, label: "jun/26" },
];
const gerencias  = ["Todos", "GERE", "GOMAN", "GSTC", "SPOT"];
const bases      = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const segurancas = ["Todos", "Segurança"];
const tiposPoc   = ["Todos", "Administrativo", "Operacional"];
const gerentes   = [
  "Todos", "Afonso", "Jamerson", "João F.", "Julio C.", "Leandro",
  "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"
];

// ─── Filter state ─────────────────────────────────────────────────────────────
const filters = reactive({
  ano:       2026,
  semana:    3,
  mes:       6,
  gerencia:  "Todos",
  base:      "Todos",
  seguranca: "Segurança",
  tipoPoc:   "Operacional",
  gerente:   "Todos",
});

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = [
  { label: "Conformidade",    value: "219",   icon: "mdi-check-circle",  color: "positive", hex: "#16a34a" },
  { label: "Inconformidade",  value: "25",    icon: "mdi-alert-circle",  color: "negative", hex: "#dc2626" },
  { label: "Índice Geral",    value: "90%",   icon: "mdi-gauge",         color: "teal",     hex: "#0d9488" },
  { label: "Equipes Auditadas",value: "24",   icon: "mdi-account-group", color: "primary",  hex: "#0284c7" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ttItem = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,0.97)",
  borderColor: "#e2e8f0", borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 12 },
  extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;"
};

function hBar(
  categories: string[],
  values: number[],
  color = P.conf,
  suffix = "%",
  maxVal = 100
) {
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b>: <b style="color:${color}">${p.value}${suffix}</b>`
    },
    grid: { left: 8, right: 52, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, max: maxVal, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: categories,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 11 }
    },
    series: [{
      type: "bar" as const,
      data: values,
      barMaxWidth: 28,
      itemStyle: { color, borderRadius: [0, 6, 6, 0], shadowColor: "rgba(0,0,0,.06)", shadowBlur: 4 },
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const,
        color,
        formatter: (p: { value: number }) => `${p.value}${suffix}`
      }
    }]
  };
}

// ─── Chart: Donut ─────────────────────────────────────────────────────────────
const chartDonut = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number; percent: number }) =>
      `<b>${p.name}</b><br/>${p.value} · <b>${p.percent.toFixed(0)}%</b>`
  },
  legend: {
    bottom: 4, left: "center", itemWidth: 10, itemHeight: 10, itemGap: 16,
    textStyle: { color: "#64748b", fontSize: 11 }
  },
  title: {
    text: "90%",
    subtext: "conformidade",
    left: "50%", top: "34%", textAlign: "center",
    textStyle: { fontSize: 26, fontWeight: "bold" as const, color: P.conf },
    subtextStyle: { fontSize: 11, color: "#94a3b8" }
  },
  series: [{
    type: "pie" as const,
    radius: ["52%", "74%"], center: ["50%", "46%"],
    avoidLabelOverlap: false,
    label: {
      show: true,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `{nm|${p.name}}\n{vl|${p.value} (${p.percent.toFixed(0)}%)}`,
      rich: {
        nm: { fontSize: 10, color: "#64748b" },
        vl: { fontSize: 11, fontWeight: "bold", color: "#334155" }
      }
    },
    labelLine: { length: 10, length2: 8 },
    itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 3 },
    emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 16, shadowColor: "rgba(0,0,0,.15)" } },
    data: [
      { value: 219, name: "Conformidade",   itemStyle: { color: P.conf   } },
      { value: 25,  name: "Inconformidade", itemStyle: { color: P.inconf } }
    ]
  }]
};

// ─── Chart: Por Mês ───────────────────────────────────────────────────────────
const chartMes = hBar(
  ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26"],
  [88, 91, 89, 92, 87, 90]
);

// ─── Chart: Por Gerência ──────────────────────────────────────────────────────
const chartGerencia = hBar(
  ["GSTC","GOMAN","GERE"],
  [80, 96, 100]
);

// ─── Chart: Por Base ──────────────────────────────────────────────────────────
const chartBase = hBar(
  ["BCB","PDT","ITM","PDS","STI","BDC"],
  [83, 89, 91, 91, 93, 100]
);

// ─── Chart: Não Conformidades por Categoria ───────────────────────────────────
const naoConfCats = [
  "Regras de Ouro",
  "Trabalho em Altura",
  "APR",
  "Padrinho de Segur.",
  "Veículos e Equipa.",
  "Epi, Epc e Ferrame.",
  "Procedimento",
];
const naoConfVals = [0, 2, 2, 4, 7, 7, 15];

const chartCategoria = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b><br/>Ocorrências: <b style="color:${P.inconf}">${p.value}</b>`
  },
  grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
  xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
  yAxis: {
    type: "category" as const, data: naoConfCats,
    axisLine: { show: false }, axisTick: { show: false },
    splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 11 }
  },
  series: [{
    type: "bar" as const,
    data: naoConfVals.map((v, i) => ({
      value: v,
      itemStyle: {
        color: v === 0 ? "#cbd5e1"
             : v <= 2  ? P.inconfLt
             : `rgba(139,28,43,${0.6 + (i / naoConfVals.length) * 0.4})`,
        borderRadius: [0, 6, 6, 0]
      }
    })),
    barMaxWidth: 28,
    emphasis: { itemStyle: { opacity: 0.8 } },
    label: {
      show: true, position: "right" as const,
      fontSize: 12, fontWeight: "bold" as const,
      formatter: (p: { value: number }) => `${p.value}`
    }
  }]
};

// ─── Chart: Por Equipe (scrollable vertical) ──────────────────────────────────
const equipeNames = [
  "MA-ANJ-E001M","MA-ARI-E001M","MA-BCB-C001M","MA-BCB-C002M","MA-BCB-D001M",
  "MA-BCB-E002M","MA-BCB-E003M","MA-BCB-F001M","MA-BCB-F004M","MA-BCB-F006M",
  "MA-BCB-F011M","MA-BCB-F012M","MA-BCB-O001M","MA-BCB-O002M","MA-BCB-O003M",
  "MA-BCB-O004M","MA-BCB-O005M","MA-BCB-O006M","MA-BCB-P001M","MA-BCB-W003M",
  "MA-BDC-C001M","MA-BDC-E001M","MA-BDC-E002M","MA-BDC-F001M","MA-BDC-F002M",
  "MA-ITM-C001M","MA-ITM-D001M","MA-PDS-C001M","MA-PDT-C001M","MA-STI-C001M",
  "MA-STI-D001M","MA-STI-E001M",
];
const equipeVals = Array(equipeNames.length).fill(100);
equipeVals[6]  = 95;
equipeVals[14] = 92;
equipeVals[22] = 88;

const chartEquipe = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b>: <b style="color:${p.value === 100 ? P.conf : P.inconfLt}">${p.value}%</b>`
  },
  grid: { left: 8, right: 52, top: 4, bottom: 4, containLabel: true },
  xAxis: { type: "value" as const, max: 100, show: false, splitLine: { show: false } },
  yAxis: {
    type: "category" as const,
    data: [...equipeNames].reverse(),
    axisLine: { show: false }, axisTick: { show: false },
    splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 10 }
  },
  dataZoom: [{
    type: "inside" as const,
    orient: "vertical" as const,
    startValue: 0, endValue: 15,
    zoomOnMouseWheel: false,
    moveOnMouseWheel: true
  }],
  series: [{
    type: "bar" as const,
    data: [...equipeVals].reverse().map((v) => ({
      value: v,
      itemStyle: {
        color: v === 100 ? P.conf : v >= 90 ? "#84cc16" : P.inconfLt,
        borderRadius: [0, 4, 4, 0]
      }
    })),
    barMaxWidth: 18,
    emphasis: { itemStyle: { opacity: 0.8 } },
    label: {
      show: true, position: "right" as const,
      fontSize: 10, fontWeight: "bold" as const,
      formatter: (p: { value: number }) => `${p.value}%`
    }
  }]
};
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
  .fgroup__label  { color: #64748b; }
}
</style>
