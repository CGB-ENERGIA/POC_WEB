<template>
  <q-page class="acomp-page">

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

        <!-- Row 1 -->
        <div class="filter-row">

          <!-- Semana -->
          <div class="fgroup">
            <span class="fgroup__label">Semana</span>
            <div class="pill-group">
              <button
                v-for="s in semanas"
                :key="s.value"
                :class="['pill', { 'pill--active': filters.semana === s.value }]"
                @click="filters.semana = s.value"
              >{{ s.label }}</button>
            </div>
          </div>

          <!-- Divisor -->
          <div class="filter-divider" />

          <!-- Gerente -->
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select
              v-model="filters.gerente"
              :options="gerentes"
              dense
              outlined
              hide-bottom-space
              class="gerente-select"
              popup-content-class="gerente-popup"
            >
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            </q-select>
          </div>

        </div>

        <!-- Row 2 -->
        <div class="filter-row">

          <!-- Ano -->
          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button
                v-for="a in anos"
                :key="a"
                :class="['pill', { 'pill--active': filters.ano === a }]"
                @click="filters.ano = a"
              >{{ a }}</button>
            </div>
          </div>

          <!-- Mês -->
          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button
                v-for="m in meses"
                :key="m.value"
                :class="['pill', { 'pill--active': filters.mes === m.value }]"
                @click="filters.mes = m.value"
              >{{ m.label }}</button>
            </div>
          </div>

          <!-- Divisor -->
          <div class="filter-divider" />

          <!-- Gerência -->
          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button
                v-for="g in gerencias"
                :key="g"
                :class="['pill', { 'pill--active': filters.gerencia === g }]"
                @click="filters.gerencia = g"
              >{{ g }}</button>
            </div>
          </div>

          <!-- Alojamento toggle -->
          <button
            :class="['pill pill--alojamento', { 'pill--active': filters.alojamento }]"
            @click="filters.alojamento = !filters.alojamento"
          >Alojamento</button>

        </div>

      </div>

      <!-- Active filter chips summary -->
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ mesLabel }}</span>
          <span class="filter-chip">{{ semanaLabel }}</span>
          <span v-if="filters.gerente && filters.gerente !== 'Todos'" class="filter-chip">{{ filters.gerente }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip">{{ filters.gerencia }}</span>
          <span v-if="filters.alojamento" class="filter-chip">Alojamento</span>
          <button class="filter-clear" @click="resetFilters">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         KPI + Charts (placeholder area – untouched)
    ══════════════════════════════════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="row q-col-gutter-md q-mb-lg">
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
        <div class="col-12 col-md-8">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações por Observador</div>
              <div class="text-caption text-grey-6">Semana atual</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="barObservadores" autoresize style="height: 260px" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered style="height: 100%">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Evolução Semanal</div>
              <div class="text-caption text-grey-6">Últimas 4 semanas</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="lineWeekly" autoresize style="height: 260px" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações por Base</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="barBase" autoresize style="height: 240px" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações por Processo</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="barProcesso" autoresize style="height: 240px" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Distribuição por Semana</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="donutWeekly" autoresize style="height: 240px" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  GraphicComponent
} from "echarts/components";
import VChart from "vue-echarts";

use([
  CanvasRenderer, BarChart, LineChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  MarkLineComponent, GraphicComponent
]);

// ─── Filter options ──────────────────────────────────────────────────────────
const semanas = [
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda" },
  { value: 3, label: "3. Terceira" },
  { value: 4, label: "4. Quarta" }
];

const showFilters = ref(false);

const anos = [2024, 2025, 2026];

const meses = [
  { value: 1, label: "jan" }, { value: 2, label: "fev" }, { value: 3, label: "mar" },
  { value: 4, label: "abr" }, { value: 5, label: "mai" }, { value: 6, label: "jun" }
];

const gerentes = [
  "Todos", "Afonso", "Jamerson", "Julio C.", "Leandro",
  "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"
];

const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT"];

// ─── Filter state ────────────────────────────────────────────────────────────
const filters = reactive({
  semana: 4,
  ano: 2026,
  mes: 4,
  gerente: "Todos",
  gerencia: "Todos",
  alojamento: false
});

function resetFilters() {
  filters.semana = 4;
  filters.ano = 2026;
  filters.mes = 4;
  filters.gerente = "Todos";
  filters.gerencia = "Todos";
  filters.alojamento = false;
}

const semanaLabel = computed(() => semanas.find(s => s.value === filters.semana)?.label ?? "");
const mesLabel = computed(() => meses.find(m => m.value === filters.mes)?.label ?? "");
const hasActiveFilters = computed(() =>
  filters.gerente !== "Todos" || filters.gerencia !== "Todos" || filters.alojamento
);

// ─── KPI ────────────────────────────────────────────────────────────────────
const kpis = [
  { label: "Total de Observações", value: "36", icon: "mdi-eye-check", color: "primary" },
  { label: "Meta da Semana", value: "36", icon: "mdi-bullseye-arrow", color: "teal" },
  { label: "Bases Cobertas", value: "5", icon: "mdi-map-marker-radius", color: "orange" },
  { label: "Atingimento", value: "100%", icon: "mdi-check-circle", color: "positive" }
];

// ─── Paleta CGB ──────────────────────────────────────────────────────────────
const C = {
  d1:  "#5C0F1A",
  d2:  "#7B1728",
  p:   "#8B1C2B",
  m:   "#A82336",
  l1:  "#C4364E",
  l2:  "#D95A6E",
  l3:  "#E8909C",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function grad(top: string, bot: string) {
  return { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [{ offset: 0, color: top }, { offset: 1, color: bot }] };
}

const ttAxis = {
  trigger: "axis" as const,
  backgroundColor: "rgba(255,255,255,0.97)",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 12 },
  extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;"
};

const ttItem = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,0.97)",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 12 },
  extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;"
};

const silentYAxis = {
  type: "value" as const,
  splitLine: { show: false },
  axisLabel: { show: false },
  axisTick: { show: false },
  axisLine: { show: false }
};

function cleanXAxis(data: string[], extra: Record<string, unknown> = {}) {
  return {
    type: "category" as const,
    data,
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisPointer: { show: false },
    axisLabel: { color: "#64748b", fontSize: 11, ...extra }
  };
}

// ─── Observações por Observador ───────────────────────────────────────────────
const barObservadores = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b><br/>Observações: <b style="color:${C.p}">${p.value}</b>`
  },
  grid: { left: 12, right: 12, top: 44, bottom: 44, containLabel: true },
  xAxis: cleanXAxis(
    ["A.Samuel","Adalton","Arilson","Deilton","Emanuel","Fabio L.","Gleyson",
     "Guilherme F.","Jamerson","Jordon C.","Leonardo E.","Madson F.",
     "Paulo","R.Hermesson","R.Matos","Reinaldo","Vanilson","Washington S."],
    { fontSize: 10, interval: 0, rotate: 22 }
  ),
  yAxis: silentYAxis,
  series: [{
    type: "bar" as const,
    data: [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    barMaxWidth: 30,
    itemStyle: {
      color: grad(C.m, C.l2),
      borderRadius: [8, 8, 0, 0],
      shadowColor: "rgba(139,28,43,.25)",
      shadowBlur: 8,
      shadowOffsetY: 4
    },
    emphasis: {
      itemStyle: {
        color: grad(C.p, C.m),
        shadowBlur: 16,
        shadowColor: "rgba(139,28,43,.45)"
      }
    },
    label: {
      show: true,
      position: "top" as const,
      fontSize: 11,
      fontWeight: "bold" as const,
      color: C.p,
      distance: 6
    }
  }]
};

// ─── Evolução Semanal ────────────────────────────────────────────────────────
const weekData = [38, 34, 36, 40];
const weekAvg  = Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length);

const lineWeekly = {
  tooltip: {
    ...ttAxis,
    formatter: (p: { name: string; value: number }[]) =>
      `<b>${p[0]?.name}</b><br/>Observações: <b style="color:${C.p}">${p[0]?.value}</b>`
  },
  grid: { left: 12, right: 20, top: 44, bottom: 32, containLabel: true },
  xAxis: {
    ...cleanXAxis(["1ª Semana","2ª Semana","3ª Semana","4ª Semana"]),
    axisLine: { show: false }
  },
  yAxis: { ...silentYAxis, min: 28 },
  series: [{
    type: "line" as const,
    data: weekData,
    smooth: 0.3,
    symbol: "circle",
    symbolSize: 12,
    lineStyle: {
      color: C.p, width: 3,
      shadowColor: "rgba(139,28,43,.35)", shadowBlur: 10
    },
    itemStyle: {
      color: C.p, borderColor: "#fff", borderWidth: 3,
      shadowColor: "rgba(139,28,43,.45)", shadowBlur: 10
    },
    areaStyle: { color: grad(C.p + "50", C.p + "06") },
    label: {
      show: true, position: "top" as const,
      fontSize: 13, fontWeight: "bold" as const,
      color: C.p, distance: 12,
      formatter: (p: { value: number }) => String(p.value)
    },
    markLine: {
      silent: true,
      symbol: "none",
      lineStyle: { color: C.l1, type: "dashed" as const, width: 1.5 },
      label: {
        position: "end" as const, fontSize: 10,
        color: C.l1, formatter: `Média: ${weekAvg}`
      },
      data: [{ type: "average" as const }]
    }
  }]
};

// ─── Observações por Base ────────────────────────────────────────────────────
const baseColors: [string, string][] = [
  [C.p, C.l1], [C.d2, C.m], [C.m, C.l2], [C.d1, C.p], [C.l1, C.l3]
];

const barBase = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `Base: <b>${p.name}</b><br/>Observações: <b style="color:${C.p}">${p.value}</b>`
  },
  grid: { left: 12, right: 12, top: 44, bottom: 40, containLabel: true },
  xAxis: cleanXAxis(["BCB","PDS","STI","ITM","PDT"]),
  yAxis: { show: false },
  series: [{
    type: "bar" as const,
    data: [8, 8, 8, 6, 6],
    barMaxWidth: 56,
    itemStyle: {
      borderRadius: [10, 10, 0, 0],
      color: (params: { dataIndex: number }) => grad(...baseColors[params.dataIndex]),
      shadowColor: "rgba(139,28,43,.2)",
      shadowBlur: 8,
      shadowOffsetY: 4
    },
    emphasis: {
      itemStyle: { shadowBlur: 18, shadowColor: "rgba(139,28,43,.4)" }
    },
    label: {
      show: true, position: "top" as const,
      fontSize: 13, fontWeight: "bold" as const,
      color: C.p, distance: 6
    }
  }]
};

// ─── Observações por Processo ─────────────────────────────────────────────────
const processoColors: [string, string][] = [[C.p, C.l1], [C.l1, C.l3]];

const barProcesso = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `Processo: <b>${p.name}</b><br/>Observações: <b style="color:${C.p}">${p.value}</b>`
  },
  grid: { left: 12, right: 12, top: 52, bottom: 40, containLabel: true },
  xAxis: cleanXAxis(["Plantão","Ligação Nova"]),
  yAxis: silentYAxis,
  series: [{
    type: "bar" as const,
    data: [34, 2],
    barMaxWidth: 80,
    barMinHeight: 20,
    itemStyle: {
      borderRadius: [10, 10, 0, 0],
      color: (params: { dataIndex: number }) => grad(...processoColors[params.dataIndex]),
      shadowColor: "rgba(139,28,43,.25)",
      shadowBlur: 10,
      shadowOffsetY: 4
    },
    emphasis: {
      itemStyle: { shadowBlur: 20, shadowColor: "rgba(139,28,43,.45)" }
    },
    label: {
      show: true, position: "top" as const,
      fontSize: 14, fontWeight: "bold" as const,
      color: C.p, distance: 8
    }
  }]
};

// ─── Distribuição por Semana ──────────────────────────────────────────────────
const donutData = [
  { value: 38, name: "1ª Semana", itemStyle: { color: C.p } },
  { value: 34, name: "2ª Semana", itemStyle: { color: C.m } },
  { value: 36, name: "3ª Semana", itemStyle: { color: C.l1 } },
  { value: 40, name: "4ª Semana", itemStyle: { color: C.d1 } }
];
const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

const donutWeekly = {
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number; percent: number }) =>
      `<b>${p.name}</b><br/>${p.value} obs &nbsp;·&nbsp; <b>${p.percent.toFixed(1)}%</b>`
  },
  legend: {
    bottom: 4, left: "center",
    itemWidth: 10, itemHeight: 10, itemGap: 14,
    textStyle: { color: "#64748b", fontSize: 11 }
  },
  title: {
    text: String(donutTotal),
    subtext: "observações",
    left: "49.5%",
    top: "33%",
    textAlign: "center",
    textStyle: { fontSize: 28, fontWeight: "bold" as const, color: C.p, lineHeight: 32 },
    subtextStyle: { fontSize: 11, color: "#94a3b8", lineHeight: 20 }
  },
  series: [{
    type: "pie" as const,
    radius: ["50%", "74%"],
    center: ["50%", "44%"],
    avoidLabelOverlap: false,
    label: { show: false },
    itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 3 },
    emphasis: {
      scale: true,
      scaleSize: 6,
      label: { show: false },
      itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,.2)" }
    },
    data: donutData
  }]
};
</script>

<style scoped lang="scss">
// ── Brand token ──────────────────────────────────────────────────────────────
$brand: #8B1C2B;
$brand-hover: #a52234;
$brand-text: #fff;
$inactive-bg: #f1f5f9;
$inactive-text: #475569;
$border: #e2e8f0;
$label-color: #94a3b8;

// ── Page ─────────────────────────────────────────────────────────────────────
.acomp-page {
  background: #f8fafc;
  min-height: 100vh;
}

// ── Filter bar wrapper ────────────────────────────────────────────────────────
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

// ── Row ──────────────────────────────────────────────────────────────────────
.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

// ── Group ────────────────────────────────────────────────────────────────────
.fgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--grow { flex: 1; }
}

.fgroup__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
  line-height: 1;
}

// ── Pill group ───────────────────────────────────────────────────────────────
.pill-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

// ── Pill button ───────────────────────────────────────────────────────────────
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
  line-height: 1;
  outline: none;

  &:hover:not(.pill--active) {
    border-color: $brand;
    color: $brand;
    background: rgba($brand, .05);
  }

  &:active {
    transform: scale(.96);
  }

  &--active {
    background: $brand;
    color: $brand-text;
    border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35);
    font-weight: 600;
  }

  // Alojamento pill — slightly bigger / distinct
  &--alojamento {
    height: 34px;
    padding: 0 18px;
    font-size: 13px;
    align-self: flex-end;
    margin-left: 4px;
  }
}

// ── Gerente select ───────────────────────────────────────────────────────────
.fgroup--gerente {
  min-width: 180px;
}

.gerente-select {
  height: 30px;

  // Remove o padding extra do Quasar
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

// popup items
:global(.gerente-popup .q-item) {
  font-size: 12px;
  min-height: 32px;
  padding: 4px 12px;
}

:global(.gerente-popup .q-item--active) {
  color: $brand !important;
  font-weight: 600;
}

// ── Vertical divider ─────────────────────────────────────────────────────────
.filter-divider {
  width: 1px;
  height: 36px;
  background: $border;
  flex-shrink: 0;
  align-self: flex-end;
  margin: 0 4px;
}

// ── Summary chips ────────────────────────────────────────────────────────────
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

// ── KPI card ─────────────────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,.1);
  }
}

// ── Dark mode overrides ───────────────────────────────────────────────────────
.body--dark {
  .acomp-page { background: #0f172a; }

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

  .filter-divider { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label { color: #64748b; }
}

// ── Transition ───────────────────────────────────────────────────────────────
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
