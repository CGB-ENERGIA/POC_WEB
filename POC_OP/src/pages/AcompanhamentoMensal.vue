<template>
  <q-page class="acomp-mensal">

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
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Mês · Semana · Gerente -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button
                v-for="m in meses" :key="m.value"
                :class="['pill', { 'pill--active': filters.mes === m.value }]"
                @click="filters.mes = m.value"
              >{{ m.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Semana</span>
            <div class="pill-group">
              <button
                v-for="s in semanas" :key="s.value"
                :class="['pill', { 'pill--active': filters.semana === s.value }]"
                @click="filters.semana = s.value"
              >{{ s.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select
              v-model="filters.gerente"
              :options="gerentes"
              dense outlined hide-bottom-space
              class="gerente-select"
              popup-content-class="gerente-popup"
            >
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            </q-select>
          </div>

        </div>

        <!-- Row 2: Ano · Base · Função · Gerência -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button
                v-for="a in anos" :key="a"
                :class="['pill', { 'pill--active': filters.ano === a }]"
                @click="filters.ano = a"
              >{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button
                v-for="b in bases" :key="b"
                :class="['pill', { 'pill--active': filters.base === b }]"
                @click="filters.base = b"
              >{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--funcao">
            <span class="fgroup__label">Função</span>
            <q-select
              v-model="filters.funcao"
              :options="funcoes"
              dense outlined hide-bottom-space
              class="funcao-select"
              popup-content-class="gerente-popup"
            />
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button
                v-for="g in gerencias" :key="g"
                :class="['pill', { 'pill--active': filters.gerencia === g }]"
                @click="filters.gerencia = g"
              >{{ g }}</button>
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
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3" v-for="kpi in kpis" :key="kpi.label">
          <q-card flat bordered class="kpi-card">
            <q-card-section class="q-pa-md">
              <div class="row items-center no-wrap">
                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-grey-6">{{ kpi.label }}</div>
                  <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="row q-col-gutter-md q-mb-md">

        <!-- Obs x Meta (Mês) -->
        <div class="col-12 col-md-3">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações x Meta</div>
              <div class="text-caption text-grey-6">Mês atual</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartMetaMes" autoresize style="height:220px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Semana -->
        <div class="col-12 col-md-3">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Obs. Realizadas por Semana</div>
              <div class="text-caption text-grey-6">4 semanas do mês</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartMetaSemana" autoresize style="height:220px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Base -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Nº de Observações por Base</div>
              <div class="text-caption text-grey-6">Realizado vs Meta</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartBase" autoresize style="height:220px" />
            </q-card-section>
          </q-card>
        </div>

      </div>

      <!-- Charts Row 2 -->
      <div class="row q-col-gutter-md">

        <!-- Obs por Gerência -->
        <div class="col-12 col-md-3">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Nº de Obs. por Gerência</div>
              <div class="text-caption text-grey-6">Realizado vs Meta</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartGerencia" autoresize style="height:260px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Observador -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Nº de Obs. Realizadas por Observador</div>
              <div class="text-caption text-grey-6">Realizado · arraste para rolar</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartObservador" autoresize style="height:260px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Ranking -->
        <div class="col-12 col-md-3">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Ranking de Observadores</div>
              <div class="text-caption text-grey-6">Top 11 do mês</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartRanking" autoresize style="height:260px" />
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
  MarkLineComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";

use([
  CanvasRenderer, BarChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent,
  MarkLineComponent, DataZoomComponent
]);

// ─── Paleta verde (Realizado) + cinza (Meta) ──────────────────────────────────
const G = {
  real:   "#16a34a",
  light:  "#22c55e",
  meta:   "#94a3b8",
  metaTx: "#64748b",
  red:    "#ef4444",
};

// ─── Filter options ───────────────────────────────────────────────────────────
const showFilters = ref(false);

const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];

const semanas = [
  { value: 0, label: "Todas" },
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda"  },
  { value: 3, label: "3. Terceira" },
  { value: 4, label: "4. Quarta"   },
];

const anos = [2024, 2025, 2026];

const bases = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];

const funcoes = ["Todos", "Analista", "Coordenador", "Especialista", "Técnico"];

const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT"];

const gerentes = [
  "Todos", "Afonso", "Jamerson", "João F.", "Julio C.", "Leandro",
  "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"
];

// ─── Filter state ─────────────────────────────────────────────────────────────
const now = new Date();
const filters = reactive({
  mes:      now.getMonth() + 1,
  semana:   0,
  ano:      now.getFullYear(),
  base:     "Todos",
  funcao:   "Todos",
  gerencia: "Todos",
  gerente:  "Todos",
});

// ─── Dados reais ──────────────────────────────────────────────────────────────
const {
  loading,
  load,
  totalSubmissions,
  basesCovertas,
  byObservador,
  byBase,
  bySemana,
  byGerencia,
  conformidadePorObservador,
} = useChecklistData();

async function recarregar() {
  await load({ ano: filters.ano, mes: filters.mes, base: filters.base !== "Todos" ? filters.base : undefined });
}

onMounted(recarregar);
watch(filters, recarregar, { deep: true });

const mesLabel = computed(() => meses.find(m => m.value === filters.mes)?.label ?? "");

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: "Total Realizado",  value: loading.value ? "…" : fmtN(totalSubmissions.value), icon: "mdi-eye-check",        color: "positive" },
  { label: "Meta do Mês",      value: "—",   icon: "mdi-bullseye-arrow",    color: "primary"  },
  { label: "Atingimento",      value: "—",   icon: "mdi-check-decagram",    color: "teal"     },
  { label: "Bases Ativas",     value: loading.value ? "…" : String(basesCovertas.value), icon: "mdi-map-marker-radius", color: "orange"   },
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ttItem = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,0.97)",
  borderColor: "#e2e8f0", borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 12 },
  extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;"
};

function cleanXAxis(data: string[], extra: Record<string, unknown> = {}) {
  return {
    type: "category" as const, data,
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisPointer: { show: false },
    axisLabel: { color: "#64748b", fontSize: 11, ...extra }
  };
}

const legend = {
  bottom: 4, left: "center",
  itemWidth: 10, itemHeight: 10, itemGap: 16,
  textStyle: { color: "#64748b", fontSize: 11 }
};

function singleBar(labels: string[], data: number[]) {
  return [{
    name: "Realizado",
    type: "bar" as const,
    data,
    barMaxWidth: 48,
    itemStyle: {
      color: G.real,
      borderRadius: [6, 6, 0, 0],
      shadowColor: "rgba(22,163,74,.2)",
      shadowBlur: 6, shadowOffsetY: 3
    },
    emphasis: { itemStyle: { color: G.light, shadowBlur: 12 } },
    label: { show: true, position: "top" as const, fontSize: 12, fontWeight: "bold" as const, color: G.real, distance: 4 }
  }];
  void labels;
}

// ─── Chart: Observações x Meta (Mês) ─────────────────────────────────────────
const chartMetaMes = computed(() => ({
  tooltip: {
    ...ttItem,
    formatter: (p: { seriesName: string; value: number }) =>
      `${p.seriesName}: <b style="color:${G.real}">${p.value}</b>`
  },
  legend,
  grid: { left: 12, right: 12, top: 12, bottom: 36, containLabel: true },
  xAxis: cleanXAxis([mesLabel.value]),
  yAxis: { show: false },
  series: singleBar([mesLabel.value], [totalSubmissions.value])
}));

// ─── Chart: Obs Realizadas por Semana ─────────────────────────────────────────
const chartMetaSemana = computed(() => ({
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b><br/>Realizado: <b style="color:${G.real}">${p.value}</b>`
  },
  legend,
  grid: { left: 12, right: 12, top: 12, bottom: 36, containLabel: true },
  xAxis: cleanXAxis(["1ª Sem", "2ª Sem", "3ª Sem", "4ª Sem"]),
  yAxis: { show: false },
  series: singleBar(["1ª Sem","2ª Sem","3ª Sem","4ª Sem"], [1,2,3,4].map(s => bySemana.value[s] ?? 0))
}));

// ─── Chart: Obs por Base ──────────────────────────────────────────────────────
const chartBase = computed(() => {
  const entries = Object.entries(byBase.value).sort((a, b) => b[1] - a[1]);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Realizado: <b style="color:${G.real}">${p.value}</b>`
    },
    legend,
    grid: { left: 12, right: 12, top: 12, bottom: 36, containLabel: true },
    xAxis: cleanXAxis(entries.map(([n]) => n)),
    yAxis: { show: false },
    series: singleBar(entries.map(([n]) => n), entries.map(([, v]) => v))
  };
});

// ─── Chart: Obs por Gerência ──────────────────────────────────────────────────
const chartGerencia = computed(() => {
  const entries = Object.entries(byGerencia.value).sort((a, b) => b[1] - a[1]);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Realizado: <b style="color:${G.real}">${p.value}</b>`
    },
    legend,
    grid: { left: 12, right: 12, top: 12, bottom: 52, containLabel: true },
    xAxis: cleanXAxis(entries.map(([n]) => n), { rotate: 20 }),
    yAxis: { show: false },
    series: singleBar(entries.map(([n]) => n), entries.map(([, v]) => v))
  };
});

// ─── Chart: Obs por Observador (scrollável) ───────────────────────────────────
const chartObservador = computed(() => {
  const entries = Object.entries(byObservador.value).sort((a, b) => b[1] - a[1]);
  const obsNames = entries.map(([n]) => n.split(" ")[0]);
  const obsReal = entries.map(([, v]) => v);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Realizado: <b style="color:${G.real}">${p.value}</b>`
    },
    legend: { ...legend, bottom: 30 },
    grid: { left: 12, right: 12, top: 12, bottom: 62, containLabel: true },
    dataZoom: [
      {
        type: "inside" as const,
        startValue: 0, endValue: 14,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true
      },
      {
        type: "slider" as const,
        bottom: 4,
        height: 20,
        startValue: 0, endValue: 14,
        brushSelect: false,
        showDetail: false,
        showDataShadow: false,
        borderRadius: 10,
        borderColor: "#e2e8f0",
        backgroundColor: "#f1f5f9",
        fillerColor: "rgba(22,163,74,0.18)",
        handleSize: "110%",
        handleStyle: {
          color: "#fff",
          borderColor: G.real,
          borderWidth: 2,
          shadowColor: "rgba(22,163,74,.4)",
          shadowBlur: 6
        },
        moveHandleSize: 6,
      }
    ],
    xAxis: cleanXAxis(obsNames, { fontSize: 10, rotate: 30, interval: 0 }),
    yAxis: { show: false },
    series: [{
      name: "Realizado",
      type: "bar" as const,
      data: obsReal,
      barMaxWidth: 28,
      itemStyle: { color: G.real, borderRadius: [4, 4, 0, 0], shadowColor: "rgba(22,163,74,.15)", shadowBlur: 4 },
      emphasis: { itemStyle: { color: G.light, shadowBlur: 10 } },
      label: { show: true, position: "top" as const, fontSize: 10, fontWeight: "bold" as const, color: G.real, distance: 3 }
    }]
  };
});

// ─── Chart: Ranking de Observadores ──────────────────────────────────────────
const chartRanking = computed(() => {
  const top11 = conformidadePorObservador.value.slice(0, 11).sort((a, b) => b.totalObs - a.totalObs);
  const names = top11.map(o => o.nome.split(" ")[0]);
  const vals = top11.map(o => o.totalObs);
  const rankingColors = vals.map((_, i) => {
    if (i === 0) return "#f59e0b";
    if (i === 1) return "#94a3b8";
    if (i === 2) return "#b45309";
    return G.real;
  });
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number; dataIndex: number }) =>
        `<b>${p.name}</b>: <b style="color:${rankingColors[p.dataIndex]}">${p.value}</b>`
    },
    grid: { left: 82, right: 36, top: 8, bottom: 8 },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const,
      data: [...names].reverse(),
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { color: "#334155", fontSize: 11 }
    },
    series: [{
      type: "bar" as const,
      data: [...vals].reverse().map((v, i) => ({
        value: v,
        itemStyle: { color: rankingColors[vals.length - 1 - i], borderRadius: [0, 6, 6, 0] }
      })),
      barMaxWidth: 22,
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,.15)" } },
      label: { show: true, position: "right" as const, fontSize: 12, fontWeight: "bold" as const, color: "#334155" }
    }]
  };
});
</script>

<style scoped lang="scss">
// ── Tokens ───────────────────────────────────────────────────────────────────
$brand:        #8B1C2B;
$brand-text:   #fff;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$border:       #e2e8f0;
$label-color:  #94a3b8;

// ── Page ─────────────────────────────────────────────────────────────────────
.acomp-mensal {
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

.filter-bar__inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.fgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fgroup__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
  line-height: 1;
}

// ── Pills ─────────────────────────────────────────────────────────────────────
.pill-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border: 1.5px solid $border;
  border-radius: 999px;
  background: $inactive-bg;
  color: $inactive-text;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;
  white-space: nowrap;
  outline: none;

  &:hover:not(.pill--active) {
    border-color: $brand;
    color: $brand;
    background: rgba($brand, .05);
  }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand;
    color: $brand-text;
    border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35);
    font-weight: 600;
  }
}

// ── Gerente select ────────────────────────────────────────────────────────────
.fgroup--gerente, .fgroup--funcao { min-width: 180px; }

.gerente-select, .funcao-select {
  height: 30px;

  :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
    border-radius: 999px;
    border-color: $border;
    background: $inactive-bg;
    padding: 0 10px 0 4px;
    transition: border-color .18s, box-shadow .18s;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) {
    border-color: $brand;
    box-shadow: 0 0 0 2px rgba($brand, .15);
  }
  :deep(.q-field__native) {
    font-size: 12px;
    font-weight: 500;
    color: $inactive-text;
    padding: 0;
    min-height: unset;
    line-height: 30px;
  }
  :deep(.q-field__append) {
    height: 30px;
    .q-icon { font-size: 16px; color: $label-color; }
  }
  :deep(.q-field__prepend) {
    height: 30px;
    padding-right: 4px;
  }
}

.gerente-icon { color: $label-color; }

:global(.gerente-popup .q-item) {
  font-size: 12px;
  min-height: 32px;
  padding: 4px 12px;
}
:global(.gerente-popup .q-item--active) {
  color: $brand !important;
  font-weight: 600;
}

// ── Divider ───────────────────────────────────────────────────────────────────
.filter-divider {
  width: 1px;
  height: 36px;
  background: $border;
  flex-shrink: 0;
  align-self: flex-end;
  margin: 0 4px;
}

// ── KPI card ──────────────────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .acomp-mensal { background: #0f172a; }

  .filter-bar {
    background: #1e293b;
    border-bottom-color: #334155;
    box-shadow: 0 2px 12px rgba(0,0,0,.3);
  }

  .pill {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;

    &:hover:not(.pill--active) {
      border-color: $brand;
      color: #fca5a5;
      background: rgba($brand, .1);
    }
    &--active {
      background: $brand;
      color: #fff;
      border-color: $brand;
    }
  }

  .filter-divider  { background: #334155; }
  .fgroup__label   { color: #64748b; }
}
</style>
