<template>
  <q-page class="icit-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FILTER BAR
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Ãndice Geral de conformidade</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartDonut" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Ãndice de conformidade por Mês</div>
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
                  <div class="text-subtitle1 text-weight-bold">Ãndice de conformidade por Gerência</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartGerencia" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Base · Não conformidades por Categoria -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Ãndice de conformidade por Base</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartBase" autoresize style="height:240px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-8">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Não conformidades por Categoria</div>
                  <div class="text-caption text-grey-6">Ocorrências no Período</div>
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
              <div class="text-subtitle1 text-weight-bold">Ãndice de conformidade por Equipe</div>
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
import { useChecklistData, fmtPct, fmtN } from "@/composables/useChecklistData";

use([
  CanvasRenderer, BarChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent
]);

const {
  loading, error,
  totalConformes, totalNaoConformes, conformidadeIndex, basesCovertas,
  byCategoria, byBase, byGerencia, byMes, submissions,
  load,
} = useChecklistData();

// â”€â”€â”€ Paleta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const P = {
  conf:    "#16a34a",
  confLt:  "#22c55e",
  inconf:  "#8B1C2B",
  inconfLt:"#C4364E",
};

// â”€â”€â”€ Filter options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showFilters = ref(false);

const now = new Date();
const anos     = [2024, 2025, 2026];
const semanas  = [
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
const gerencias  = ["Todos", "GERE", "GOMAN", "GSTC", "SPOT"];
const bases      = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const segurancas = ["Todos", "Segurança"];
const tiposPoc   = ["Todos", "Administrativo", "Operacional"];
const gerentes   = [
  "Todos", "Afonso", "Jamerson", "João F.", "Julio C.", "Leandro",
  "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"
];

// â”€â”€â”€ Filter state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const filters = reactive({
  ano:       now.getFullYear(),
  semana:    Math.ceil(now.getDate() / 7),
  mes:       now.getMonth() + 1,
  gerencia:  "Todos",
  base:      "Todos",
  seguranca: "Segurança",
  tipoPoc:   "Operacional",
  gerente:   "Todos",
});

async function recarregar() {
  await load({ ano: filters.ano, mes: filters.mes, base: filters.base === "Todos" ? undefined : filters.base, gerencia: filters.gerencia === "Todos" ? undefined : filters.gerencia }, true);
}
onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// â”€â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const kpis = computed(() => [
  { label: "conformidade",     value: fmtN(totalConformes.value),   icon: "mdi-check-circle",  color: "positive", hex: "#16a34a" },
  { label: "Inconformidade",   value: fmtN(totalNaoConformes.value), icon: "mdi-alert-circle",  color: "negative", hex: "#dc2626" },
  { label: "Ãndice Geral",     value: fmtPct(conformidadeIndex.value), icon: "mdi-gauge",       color: "teal",     hex: "#0d9488" },
  { label: "Equipes Auditadas",value: fmtN(basesCovertas.value),    icon: "mdi-account-group", color: "primary",  hex: "#0284c7" },
]);

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Chart: Donut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const chartDonut = computed(() => ({
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
    text: fmtPct(conformidadeIndex.value),
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
      { value: totalConformes.value, name: "conformidade",   itemStyle: { color: P.conf   } },
      { value: totalNaoConformes.value, name: "Inconformidade", itemStyle: { color: P.inconf } }
    ]
  }]
}));

// â”€â”€â”€ Chart: Por Mês â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const chartMes = computed(() => {
  const mesLabels = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const entries = Object.entries(byMes.value).sort((a, b) => Number(a[0]) - Number(b[0]));
  return hBar(
    entries.map(([m]) => mesLabels[Number(m) - 1] ?? m),
    entries.map(([, v]) => v)
  );
});

// â”€â”€â”€ Chart: Por Gerência â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const chartGerencia = computed(() => {
  const entries = Object.entries(byGerencia.value).sort((a, b) => a[1] - b[1]);
  return hBar(entries.map(([k]) => k), entries.map(([, v]) => v), P.conf, "", Math.max(...entries.map(([,v]) => v), 1));
});

// â”€â”€â”€ Chart: Por Base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const chartBase = computed(() => {
  const entries = Object.entries(byBase.value).sort((a, b) => a[1] - b[1]);
  return hBar(entries.map(([k]) => k), entries.map(([, v]) => v), P.conf, "", Math.max(...entries.map(([,v]) => v), 1));
});

// â”€â”€â”€ Chart: Não conformidades por Categoria â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const chartCategoria = computed(() => {
  const catEntries = Object.entries(byCategoria.value)
    .map(([cat, d]) => ({ cat, nc: d.nc }))
    .filter(e => e.nc > 0)
    .sort((a, b) => a.nc - b.nc);
  const cats = catEntries.map(e => e.cat);
  const vals = catEntries.map(e => e.nc);
  const maxV = Math.max(...vals, 1);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Ocorrências: <b style="color:${P.inconf}">${p.value}</b>`
    },
    grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: cats,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 11 }
    },
    series: [{
      type: "bar" as const,
      data: vals.map((v) => ({
        value: v,
        itemStyle: {
          color: v === 0 ? "#cbd5e1"
               : v <= 2  ? P.inconfLt
               : `rgba(139,28,43,${0.6 + (v / maxV) * 0.4})`,
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
});

// â”€â”€â”€ Chart: Por Equipe (scrollable vertical) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const equipePct = computed(() => {
  const map: Record<string, { conf: number; total: number }> = {};
  for (const sub of submissions.value) {
    const equipes: string[] = Array.isArray(sub.membros)
      ? (sub.membros as string[])
      : sub.equipe ? [sub.equipe] : [];
    for (const eq of equipes) {
      if (!map[eq]) map[eq] = { conf: 0, total: 0 };
      map[eq].total++;
    }
  }
  return Object.entries(map)
    .map(([name, d]) => ({ name, pct: d.total > 0 ? Math.round((d.conf / d.total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);
});

const chartEquipe = computed(() => {
  const data = equipePct.value.length
    ? equipePct.value
    : [{ name: "Sem dados", pct: 0 }];
  const cats = data.map(e => e.name);
  const vals = data.map(e => e.pct);
  return {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b>: <b style="color:${p.value === 100 ? P.conf : P.inconfLt}">${p.value}%</b>`
  },
  grid: { left: 8, right: 52, top: 4, bottom: 4, containLabel: true },
  xAxis: { type: "value" as const, max: 100, show: false, splitLine: { show: false } },
  yAxis: {
    type: "category" as const,
    data: cats,
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
    data: vals.map((v) => ({
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

