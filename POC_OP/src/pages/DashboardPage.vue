<template>
  <q-page class="dash-page">

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
              <span class="fgroup__label">Mês</span>
              <div class="pill-group">
                <button v-for="m in meses" :key="m.value"
                  :class="['pill', { 'pill--active': filters.mes === m.value }]"
                  @click="filters.mes = m.value">{{ m.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-linear-progress v-if="loading" indeterminate color="primary" class="dash-loading" />

    <!-- ══════════════════════════════════════════════════════
         CONTENT
    ══════════════════════════════════════════════════════ -->
    <div class="q-pa-md dash-content">

      <!-- KPI CARDS ─────────────────────────────────────────────── -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div
          class="col-12 col-sm-6 col-md"
          v-for="kpi in kpis" :key="kpi.label"
        >
          <div class="kpi-card" :style="{ '--kpi-accent': kpi.accent }">
            <div class="kpi-card__stripe" />
            <div class="kpi-card__body">
              <div class="row items-start no-wrap">
                <div class="col">
                  <div class="kpi-card__value">{{ kpi.value }}</div>
                  <div class="kpi-card__label">{{ kpi.label }}</div>
                  <div class="kpi-card__trend" :style="{ color: kpi.trendColor }">
                    <q-icon :name="kpi.trendIcon" size="13px" />
                    {{ kpi.trend }}
                  </div>
                </div>
                <div class="kpi-card__icon-wrap">
                  <q-icon :name="kpi.icon" size="30px" :style="{ color: kpi.accent }" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW 1 ────────────────────────────────────────────── -->
      <div class="row q-col-gutter-md q-mb-md">

        <!-- Evolução Mensal -->
        <div class="col-12 col-md-8">
          <div class="dash-card">
            <div class="dash-card__header">
              <div>
                <div class="dash-card__title">Evolução de Observações</div>
                <div class="dash-card__sub">Total mensal · 2026</div>
              </div>
              <div class="dash-card__badge">2026</div>
            </div>
            <v-chart :option="lineOption" autoresize style="height: 250px" />
          </div>
        </div>

        <!-- Donut Gerência -->
        <div class="col-12 col-md-4">
          <div class="dash-card">
            <div class="dash-card__header">
              <div>
                <div class="dash-card__title">Por Gerência</div>
                <div class="dash-card__sub">Distribuição de obs.</div>
              </div>
            </div>
            <v-chart :option="donutOption" autoresize style="height: 250px" />
          </div>
        </div>

      </div>

      <!-- CHARTS ROW 2 ────────────────────────────────────────────── -->
      <div class="row q-col-gutter-md q-mb-lg">

        <!-- Top Observadores -->
        <div class="col-12 col-md-6">
          <div class="dash-card">
            <div class="dash-card__header">
              <div>
                <div class="dash-card__title">Top Observadores</div>
                <div class="dash-card__sub">% Conformidade · mês atual</div>
              </div>
            </div>
            <v-chart :option="observBarOption" autoresize style="height: 260px" />
          </div>
        </div>

        <!-- Por Categoria -->
        <div class="col-12 col-md-6">
          <div class="dash-card">
            <div class="dash-card__header">
              <div>
                <div class="dash-card__title">Por Categoria</div>
                <div class="dash-card__sub">Volume de observações</div>
              </div>
            </div>
            <v-chart :option="catBarOption" autoresize style="height: 260px" />
          </div>
        </div>

      </div>

      <!-- ALERTA TOLERÂNCIA ZERO ────────────────────────────────────── -->
      <div class="alert-strip q-mb-lg">
        <div class="alert-strip__icon">
          <q-icon name="mdi-alert-octagon" size="20px" color="white" />
        </div>
        <div class="alert-strip__text">
          <span class="alert-strip__title">Tolerância Zero em destaque</span>
          <span class="alert-strip__body">{{ loading ? '…' : `${toleranciaZero} ocorrência(s) registrada(s) no período selecionado.` }}</span>
        </div>
        <router-link to="/tolerancia-zero" class="alert-strip__link">
          Ver detalhes <q-icon name="mdi-chevron-right" size="16px" />
        </router-link>
      </div>

      <!-- ACESSO RÁPIDO ───────────────────────────────────────────── -->
      <div class="section-header q-mb-md">
        <div class="section-header__title">Acesso Rápido</div>
        <div class="section-header__sub">Navegue para os módulos do sistema</div>
      </div>
      <div class="row q-col-gutter-sm">
        <div
          class="col-6 col-sm-4 col-md-3 col-lg-2"
          v-for="pg in pages" :key="pg.path"
        >
          <router-link :to="pg.path" class="page-card">
            <div class="page-card__icon-wrap" :style="{ background: pg.bg }">
              <q-icon :name="pg.icon" size="20px" :style="{ color: pg.color }" />
            </div>
            <div class="page-card__body">
              <div class="page-card__name">{{ pg.name }}</div>
              <div class="page-card__desc">{{ pg.desc }}</div>
            </div>
            <q-icon name="mdi-chevron-right" size="14px" class="page-card__arrow" />
          </router-link>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, LineChart, PieChart } from "echarts/charts"
import {
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent
} from "echarts/components"
import VChart from "vue-echarts"
import { useChecklistData, fmtPct, fmtN } from "@/composables/useChecklistData"

use([
  CanvasRenderer, BarChart, LineChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent
])

// ── Filtros ──────────────────────────────────────────────────────────────────
const showFilters = ref(false)
const anos = [2024, 2025, 2026]
const meses = [
  { label: "jan", value: 1 },  { label: "fev", value: 2 },
  { label: "mar", value: 3 },  { label: "abr", value: 4 },
  { label: "mai", value: 5 },  { label: "jun", value: 6 },
  { label: "jul", value: 7 },  { label: "ago", value: 8 },
  { label: "set", value: 9 },  { label: "out", value: 10 },
  { label: "nov", value: 11 }, { label: "dez", value: 12 },
]
const filters = ref({ ano: 2026, mes: new Date().getMonth() + 1 })

// ── Dados do banco ────────────────────────────────────────────────────────────
const {
  loading,
  load,
  totalSubmissions,
  conformidadeIndex,
  toleranciaZero,
  pctPerfeitas,
  basesCovertas,
  byMes,
  byGerencia,
  byCategoria,
  conformidadePorObservador,
} = useChecklistData()

async function recarregar() {
  await load(filters.value, true)
}

onMounted(recarregar)
watch(filters, recarregar, { deep: true })

// ── Cores ────────────────────────────────────────────────────────────────────
const BRAND   = "#8B1C2B"
const GREEN   = "#16a34a"
const YELLOW  = "#eab308"
const RED     = "#dc2626"
const BLUE    = "#0ea5e9"
const PURPLE  = "#7c3aed"
const ORANGE  = "#f97316"
const TEAL    = "#0891b2"

// Paleta para donut gerência
const GERENCIA_COLORS: Record<string, string> = {
  GOMAN:   BRAND,
  GSTC:    "#b02035",
  OFICINA: "#d4405a",
  ADM:     "#e8768b",
  GERE:    "#f0a8b5",
  SESMT:   "#6b1020",
}
function gerenciaColor(nome: string, idx: number) {
  return GERENCIA_COLORS[nome] ?? ["#0ea5e9","#7c3aed","#f97316","#16a34a"][idx % 4]
}

// ── KPI Cards ────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  {
    label:      "Total de Observações",
    value:      loading.value ? "…" : fmtN(totalSubmissions.value),
    icon:       "mdi-eye-outline",
    accent:     BRAND,
    trend:      "período selecionado",
    trendIcon:  "mdi-calendar",
    trendColor: "#6b7280",
  },
  {
    label:      "Índice de Conformidade",
    value:      loading.value ? "…" : fmtPct(conformidadeIndex.value),
    icon:       "mdi-check-decagram-outline",
    accent:     GREEN,
    trend:      `${fmtN(totalSubmissions.value)} checklist(s)`,
    trendIcon:  "mdi-clipboard-check",
    trendColor: GREEN,
  },
  {
    label:      "Tolerância Zero",
    value:      loading.value ? "…" : fmtN(toleranciaZero.value),
    icon:       "mdi-alert-octagon-outline",
    accent:     RED,
    trend:      "não conformidades críticas",
    trendIcon:  "mdi-alert",
    trendColor: toleranciaZero.value > 0 ? RED : GREEN,
  },
  {
    label:      "Obs. 100% Perfeitas",
    value:      loading.value ? "…" : fmtPct(pctPerfeitas.value),
    icon:       "mdi-star-circle-outline",
    accent:     YELLOW,
    trend:      "sem nenhuma NC",
    trendIcon:  "mdi-star",
    trendColor: pctPerfeitas.value >= 0.5 ? GREEN : YELLOW,
  },
  {
    label:      "Bases Cobertas",
    value:      loading.value ? "…" : String(basesCovertas.value),
    icon:       "mdi-map-marker-multiple-outline",
    accent:     BLUE,
    trend:      "bases com observações",
    trendIcon:  "mdi-map-marker",
    trendColor: GREEN,
  },
])

// ── Evolução Mensal ───────────────────────────────────────────────────────────
const lineOption = computed(() => {
  const mesLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  const mesData = meses.map(m => byMes.value[m.value] ?? 0)
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      formatter: (p: any[]) =>
        `<b>${p[0]?.name}</b><br/>${p[0]?.value} observações`,
    },
    grid: { top: 24, right: 20, bottom: 28, left: 48 },
    xAxis: {
      type: "category",
      data: mesLabels,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
      axisLabel: { color: "#9ca3af", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#9ca3af", fontSize: 11 },
      splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" as const } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: mesData,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { color: BRAND, width: 2.5 },
        itemStyle: { color: BRAND, borderColor: "#fff", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(139,28,43,0.20)" },
              { offset: 1, color: "rgba(139,28,43,0.01)" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          data: [{ type: "average" as const }],
          lineStyle: { color: BRAND, type: "dashed" as const, width: 1 },
          label: {
            formatter: "Média: {c}",
            color: BRAND,
            fontSize: 10,
            position: "insideEndTop" as const,
          },
        },
      },
    ],
  }
})

// ── Donut Gerência ────────────────────────────────────────────────────────────
const donutOption = computed(() => {
  const entries = Object.entries(byGerencia.value)
    .sort((a, b) => b[1] - a[1])
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: "{b}: <b>{c}</b> obs. ({d}%)",
    },
    legend: {
      orient: "vertical" as const,
      right: 4,
      top: "center",
      textStyle: { fontSize: 11, color: "#6b7280" },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["42%", "72%"],
        center: ["38%", "50%"],
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
        data: entries.length
          ? entries.map(([nome, value], i) => ({
              value,
              name: nome,
              itemStyle: { color: gerenciaColor(nome, i) },
            }))
          : [{ value: 1, name: "Sem dados", itemStyle: { color: "#e5e7eb" } }],
      },
    ],
  }
})

// ── Top Observadores ──────────────────────────────────────────────────────────
const observBarOption = computed(() => {
  const top = conformidadePorObservador.value.slice(0, 8)
  return {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" as const } },
    grid: { top: 8, right: 56, bottom: 8, left: 80, containLabel: false },
    xAxis: {
      type: "value",
      max: 100,
      axisLabel: { formatter: "{value}%", color: "#9ca3af", fontSize: 10 },
      splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" as const } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: top.map(o => o.nome.split(" ")[0]),
      axisLabel: { color: "#6b7280", fontSize: 10 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: top.map(o => o.pct),
        barMaxWidth: 16,
        label: {
          show: true,
          position: "right" as const,
          formatter: (p: any) => `${p.value}%`,
          fontSize: 10,
          color: "#6b7280",
        },
        itemStyle: {
          color: (p: any) => {
            const v = p.value as number
            if (v >= 99) return GREEN
            if (v >= 97) return "#84cc16"
            if (v >= 95) return YELLOW
            return RED
          },
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  }
})

// ── Por Categoria ─────────────────────────────────────────────────────────────
const catBarOption = computed(() => {
  const cats = [...byCategoria.value].sort((a, b) => a.total - b.total)
  return {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" as const } },
    grid: { top: 8, right: 48, bottom: 8, left: 128, containLabel: false },
    xAxis: {
      type: "value",
      axisLabel: { color: "#9ca3af", fontSize: 10 },
      splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" as const } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category",
      data: cats.map(c => c.categoria),
      axisLabel: { color: "#6b7280", fontSize: 10 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: cats.map(c => c.total),
        barMaxWidth: 16,
        label: {
          show: true,
          position: "right" as const,
          fontSize: 10,
          color: "#6b7280",
        },
        itemStyle: {
          color: BRAND,
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  }
})

// ── Acesso Rápido ─────────────────────────────────────────────────────────────
const pages = [
  { path: "/acompanhamento-semanal",   name: "Acomp. Semanal",    desc: "Por semana",         icon: "mdi-calendar-week",             color: BRAND,   bg: "rgba(139,28,43,0.09)"  },
  { path: "/acompanhamento-mensal",    name: "Acomp. Mensal",     desc: "Consolidado",        icon: "mdi-calendar-month",            color: TEAL,    bg: "rgba(8,145,178,0.09)"  },
  { path: "/indice-conformidade",      name: "Conformidade",      desc: "Índice geral",       icon: "mdi-check-decagram",            color: GREEN,   bg: "rgba(22,163,74,0.09)"  },
  { path: "/icit",                     name: "ICIT",              desc: "Inspeções",          icon: "mdi-clipboard-check-outline",   color: PURPLE,  bg: "rgba(124,58,237,0.09)" },
  { path: "/historico-icit",           name: "Histórico ICIT",    desc: "Registros",          icon: "mdi-history",                   color: "#6b7280", bg: "rgba(107,114,128,0.09)" },
  { path: "/relatorio-equipes",        name: "Equipes",           desc: "Por equipe",         icon: "mdi-account-group",             color: BLUE,    bg: "rgba(14,165,233,0.09)" },
  { path: "/tolerancia-zero",          name: "Tolerância Zero",   desc: "Desvios críticos",   icon: "mdi-alert-octagon",             color: RED,     bg: "rgba(220,38,38,0.09)"  },
  { path: "/indicadores-categoria",    name: "Categorias",        desc: "Por categoria",      icon: "mdi-tag-multiple",              color: ORANGE,  bg: "rgba(249,115,22,0.09)" },
  { path: "/observadores",             name: "Observadores",      desc: "Ranking",            icon: "mdi-eye-outline",               color: BRAND,   bg: "rgba(139,28,43,0.09)"  },
  { path: "/mapa-calor-base",          name: "Mapa Calor Base",   desc: "Por base",           icon: "mdi-map-legend",                color: YELLOW,  bg: "rgba(234,179,8,0.09)"  },
  { path: "/mapa-calor-mensal",        name: "Mapa Calor Mensal", desc: "Temporal",           icon: "mdi-calendar-clock",            color: ORANGE,  bg: "rgba(249,115,22,0.09)" },
  { path: "/matriz-responsabilidade",  name: "Matriz de Resp.",   desc: "Responsabilidades",  icon: "mdi-table-large",               color: PURPLE,  bg: "rgba(124,58,237,0.09)" },
]
</script>

<style scoped lang="scss">
$brand:  #8B1C2B;
$green:  #16a34a;
$red:    #dc2626;

// ── Page ──────────────────────────────────────────────────────────────────────
.dash-page {
  background: #f1f5f9;
  min-height: 100vh;
}

.dash-content { max-width: 1600px; }

// ── KPI Card ──────────────────────────────────────────────────────────────────
.kpi-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  height: 100%;
  transition: box-shadow .2s, transform .2s;

  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-2px); }

  &__stripe {
    height: 4px;
    background: var(--kpi-accent);
  }

  &__body { padding: 16px 18px 18px; }

  &__value {
    font-size: 30px;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #9ca3af;
    margin-bottom: 10px;
  }

  &__trend {
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 3px;
    font-weight: 600;
  }

  &__icon-wrap {
    opacity: 0.22;
    margin-left: 8px;
    flex-shrink: 0;
  }
}

// ── Dash Card ─────────────────────────────────────────────────────────────────
.dash-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  padding: 18px 18px 12px;
  height: 100%;
  transition: box-shadow .2s;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
  }

  &__sub {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  &__badge {
    font-size: 10px;
    font-weight: 700;
    color: $brand;
    background: rgba(139,28,43,0.08);
    border-radius: 6px;
    padding: 2px 8px;
    letter-spacing: 0.5px;
  }
}

// ── Alert Strip ───────────────────────────────────────────────────────────────
.alert-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #7f1d1d 0%, $brand 100%);
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 4px 16px rgba(139,28,43,0.25);

  &__icon {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text { flex: 1; }

  &__title {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.75);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  &__body {
    display: block;
    font-size: 13px;
    color: #fff;
    font-weight: 500;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    white-space: nowrap;
    padding: 6px 12px;
    background: rgba(255,255,255,0.12);
    border-radius: 8px;
    transition: background .18s, color .18s;
    flex-shrink: 0;

    &:hover { background: rgba(255,255,255,0.22); color: #fff; }
  }
}

// ── Section Header ────────────────────────────────────────────────────────────
.section-header {
  &__title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }
  &__sub {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
  }
}

// ── Page Card ─────────────────────────────────────────────────────────────────
.page-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 11px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  text-decoration: none;
  transition: box-shadow .18s, transform .18s;
  min-height: 58px;

  &:hover {
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    transform: translateY(-2px);

    .page-card__arrow { color: #6b7280; }
  }

  &__icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body { flex: 1; min-width: 0; }

  &__name {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__desc {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 1px;
  }

  &__arrow {
    color: #d1d5db;
    flex-shrink: 0;
    transition: color .18s;
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .dash-page { background: #0f1117; }

  .kpi-card,
  .dash-card,
  .page-card {
    background: #1a1d27;
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  }

  .kpi-card__value,
  .dash-card__title,
  .section-header__title,
  .page-card__name {
    color: #f1f5f9;
  }

  .kpi-card__label,
  .dash-card__sub,
  .section-header__sub,
  .page-card__desc {
    color: #6b7280;
  }
}
</style>
