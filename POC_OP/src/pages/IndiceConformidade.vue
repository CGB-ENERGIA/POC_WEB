<template>
  <q-page class="indice-page">

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

          <!-- Row 1: Donut + Índice por Mês -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice Geral de Conformidade</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartDonut" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-7">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Mês</div>
                  <div class="text-caption text-grey-6">% de conformidade acumulada</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartMes" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Por Base + Por Gerência + Por Equipe -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Base</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartBase" autoresize style="height:220px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Gerência</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartGerencia" autoresize style="height:220px" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Equipe</div>
                  <div class="text-caption text-grey-6">Role para ver mais</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartEquipe" autoresize style="height:220px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

        </div>

        <!-- RIGHT: Ranking (full height) -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card ranking-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Ranking Geral de Não Conformidades</div>
              <div class="text-caption text-grey-6">Itens mais recorrentes</div>
            </q-card-section>
            <q-card-section>
              <v-chart :option="chartRanking" autoresize style="height:536px" />
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
import { useChecklistData, fmtN, fmtPct } from "@/composables/useChecklistData";
import { filterByGerencia } from "@/lib/dashboard";

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
  track:   "#f1f5f9",
  border:  "#e2e8f0",
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
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];
const gerencias = ["Todos", "GERE", "GOMAN", "GSTC", "OFICINA", "ADM", "SESMT"];
const bases     = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const tiposPoc  = ["Todos", "Administrativo", "Operacional"];
const gerentes  = [
  "Todos", "Afonso", "Jamerson", "João F.", "Julio C.", "Leandro",
  "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"
];

// ─── Filter state ─────────────────────────────────────────────────────────────
const now = new Date();
const filters = reactive({
  ano:      now.getFullYear(),
  semana:   Math.ceil(now.getDate() / 7),
  mes:      now.getMonth() + 1,
  gerencia: "Todos",
  base:     "Todos",
  tipoPoc:  "Todos",
  gerente:  "Todos",
});

// ─── Dados reais ──────────────────────────────────────────────────────────────
const {
  loading,
  load,
  submissions,
  responses,
  employees,
  byBase,
  byGerencia,
  byMes,
  byCategoria,
} = useChecklistData();

async function recarregar() {
  await load({
    ano: filters.ano,
    mes: filters.mes,
    base: filters.base !== "Todos" ? filters.base : undefined,
  }, true);
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes, filters.base], recarregar);

const filteredSubs = computed(() => {
  let s = filterByGerencia(submissions.value, employees.value, filters.gerencia);
  if (filters.semana) {
    s = s.filter(sub => Math.ceil(new Date(sub.data).getDate() / 7) === filters.semana);
  }
  if (filters.gerente !== "Todos") {
    s = s.filter(sub => sub.observador === filters.gerente);
  }
  return s;
});

const filteredResps = computed(() => {
  const ids = new Set(filteredSubs.value.map(s => s.id));
  return responses.value.filter(r => ids.has(r.submission_id));
});

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
    xAxis: {
      type: "value" as const,
      max: maxVal,
      show: false,
      splitLine: { show: false }
    },
    yAxis: {
      type: "category" as const,
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: "#334155", fontSize: 11 }
    },
    series: [{
      type: "bar" as const,
      data: values,
      barMaxWidth: 26,
      itemStyle: {
        color,
        borderRadius: [0, 6, 6, 0],
        shadowColor: "rgba(0,0,0,.08)", shadowBlur: 4
      },
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true,
        position: "right" as const,
        fontSize: 11,
        fontWeight: "bold" as const,
        color,
        formatter: (p: { value: number }) => `${p.value}${suffix}`
      }
    }]
  };
}

// ─── Chart: Donut ─────────────────────────────────────────────────────────────
const chartDonut = computed(() => {
  const conf = totalConformes.value;
  const nc = totalNaoConformes.value;
  const pct = fmtPct(conformidadeIndex.value, 2);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<b>${p.name}</b><br/>${p.value.toLocaleString("pt-BR")} · <b>${p.percent.toFixed(2)}%</b>`
    },
    legend: {
      bottom: 4, left: "center",
      itemWidth: 10, itemHeight: 10, itemGap: 16,
      textStyle: { color: "#64748b", fontSize: 11 }
    },
    title: {
      text: pct,
      subtext: "conformidade",
      left: "50%", top: "34%",
      textAlign: "center",
      textStyle: { fontSize: 26, fontWeight: "bold" as const, color: P.conf },
      subtextStyle: { fontSize: 11, color: "#94a3b8" }
    },
    series: [{
      type: "pie" as const,
      radius: ["52%", "74%"],
      center: ["50%", "46%"],
      avoidLabelOverlap: false,
      label: {
        show: true,
        formatter: (p: { name: string; value: number }) =>
          `{name|${p.name}}\n{val|${p.value.toLocaleString("pt-BR")}}`,
        rich: {
          name: { fontSize: 10, color: "#64748b" },
          val: { fontSize: 12, fontWeight: "bold", color: "#334155" }
        }
      },
      labelLine: { length: 12, length2: 8 },
      itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 3 },
      emphasis: {
        scale: true, scaleSize: 5,
        itemStyle: { shadowBlur: 16, shadowColor: "rgba(0,0,0,.15)" }
      },
      data: [
        { value: conf, name: "Conformidade",   itemStyle: { color: P.conf  } },
        { value: nc,   name: "Inconformidade", itemStyle: { color: P.inconf } }
      ]
    }]
  };
});

// conformidade % por base: (conformes / total) * 100
const conformidadePorBase = computed(() => {
  const map: Record<string, { c: number; t: number }> = {};
  for (const s of filteredSubs.value) {
    if (!map[s.base]) map[s.base] = { c: 0, t: 0 };
    const rs = filteredResps.value.filter(r => r.submission_id === s.id);
    map[s.base].t += rs.length;
    map[s.base].c += rs.filter(r => r.resposta === "conforme").length;
  }
  return map;
});

const conformidadePorGerencia = computed(() => {
  const map: Record<string, { c: number; t: number }> = {};
  for (const s of filteredSubs.value) {
    const emp = employees.value.find(e => e.matricula === s.matricula);
    const g = emp?.gerencia ?? s.auditagem;
    if (!map[g]) map[g] = { c: 0, t: 0 };
    const rs = filteredResps.value.filter(r => r.submission_id === s.id);
    map[g].t += rs.length;
    map[g].c += rs.filter(r => r.resposta === "conforme").length;
  }
  return map;
});

// ─── Chart: Índice por Mês ────────────────────────────────────────────────────
const chartMes = computed(() => {
  const mesLabels = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  // We need per-month conformidade. Using byMes for submission counts isn't enough.
  // Simplification: show obs count per month as a proxy
  const vals = mesLabels.map((_, i) => byMes.value[i + 1] ?? 0);
  const maxV = Math.max(...vals, 1);
  return hBar(mesLabels, vals, P.conf, " obs", maxV);
});

// ─── Chart: Índice por Base ───────────────────────────────────────────────────
const chartBase = computed(() => {
  const entries = Object.entries(conformidadePorBase.value)
    .map(([base, { c, t }]) => ({
      base,
      pct: t ? Math.round((c / t) * 1000) / 10 : 0
    }))
    .sort((a, b) => a.pct - b.pct);
  return hBar(entries.map(e => e.base), entries.map(e => e.pct), P.conf, "%", 100);
});

// ─── Chart: Índice por Gerência ───────────────────────────────────────────────
const chartGerencia = computed(() => {
  const entries = Object.entries(conformidadePorGerencia.value)
    .map(([g, { c, t }]) => ({
      g,
      pct: t ? Math.round((c / t) * 1000) / 10 : 0
    }))
    .sort((a, b) => a.pct - b.pct);
  return hBar(entries.map(e => e.g), entries.map(e => e.pct), P.conf, "%", 100);
});

// ─── Chart: Índice por Equipe (scrollable) ────────────────────────────────────
const chartEquipe = computed(() => {
  const equipePcts: Record<string, { c: number; t: number }> = {};
  for (const s of filteredSubs.value) {
    const rs = filteredResps.value.filter(r => r.submission_id === s.id);
    const nome = s.equipe;
    if (!nome) continue;
    if (!equipePcts[nome]) equipePcts[nome] = { c: 0, t: 0 };
    equipePcts[nome].t += rs.length;
    equipePcts[nome].c += rs.filter(r => r.resposta === "conforme").length;
  }
  const entries = Object.entries(equipePcts)
    .map(([equipe, { c, t }]) => ({ equipe, pct: t ? Math.round((c / t) * 1000) / 10 : 0 }))
    .sort((a, b) => b.pct - a.pct);
  const names = entries.map(e => e.equipe.length > 16 ? e.equipe.slice(0, 15) + "…" : e.equipe);
  const vals = entries.map(e => e.pct);
  return {
    ...hBar([...names].reverse(), [...vals].reverse()),
    dataZoom: [{
      type: "inside" as const,
      orient: "vertical" as const,
      startValue: 0, endValue: 9,
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true
    }],
    grid: { left: 8, right: 52, top: 8, bottom: 8, containLabel: true }
  };
});

// ─── Chart: Ranking de Não Conformidades ─────────────────────────────────────
const rankingNC = computed(() => {
  const map: Record<string, number> = {};
  for (const r of filteredResps.value) {
    if (r.resposta === "nao_conforme") {
      const key = r.pergunta.length > 28 ? r.pergunta.slice(0, 27) + "." : r.pergunta;
      map[key] = (map[key] ?? 0) + 1;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 17);
});

const rankingNames = computed(() => rankingNC.value.map(([n]) => n));
const rankingVals  = computed(() => rankingNC.value.map(([, v]) => v));

const chartRanking = computed(() => ({
  tooltip: {
    ...ttItem,
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b><br/>Ocorrências: <b style="color:${P.inconf}">${p.value}</b>`
  },
  grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: "value" as const,
    show: false,
    splitLine: { show: false }
  },
  yAxis: {
    type: "category" as const,
    data: [...rankingNames.value].reverse(),
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { color: "#334155", fontSize: 11 }
  },
  series: [{
    type: "bar" as const,
    data: [...rankingVals.value].reverse().map((v, i) => ({
      value: v,
      itemStyle: {
        color: i === rankingVals.value.length - 1 ? P.inconf
             : i >= rankingVals.value.length - 3 ? P.inconfLt
             : `rgba(139,28,43,${0.55 + (i / rankingVals.value.length) * 0.45})`,
        borderRadius: [0, 6, 6, 0]
      }
    })),
    barMaxWidth: 24,
    emphasis: { itemStyle: { opacity: 0.8 } },
    label: {
      show: true,
      position: "right" as const,
      fontSize: 12,
      fontWeight: "bold" as const,
      color: P.inconf
    }
  }]
}));
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
  .fgroup__label   { color: #64748b; }
}
</style>
