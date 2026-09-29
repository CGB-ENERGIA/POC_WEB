<template>
  <q-page class="indicadores-page">
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
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Ano · Gerente -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in anosOpts" :key="a"
                :class="['pill', filters.ano === a && 'pill--active']"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select v-model="filters.gerente" :options="gerentesOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            </q-select>
          </div>
        </div>

        <!-- Row 2: Base · Gerência · Prefixo · Tipo de POC -->
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
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerenciasOpts" :key="g"
                :class="['pill', filters.gerencia === g && 'pill--active']"
                @click="filters.gerencia = g">{{ g }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--gerente" style="min-width:170px">
            <span class="fgroup__label">Prefixo</span>
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
              dense outlined hide-bottom-space class="gerente-select"
              use-input input-debounce="0" popup-content-class="gerente-popup"
              @filter="filterPrefixo" />
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposOpts" :key="t"
                :class="['pill', filters.tipo === t && 'pill--active']"
                @click="filters.tipo = t">{{ t }}</button>
            </div>
          </div>
        </div>

      </div>
      </div>
      <transition name="chip-bar">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ filters.base }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ filters.gerente }}</span>
          <span v-if="filters.prefixo !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.prefixo = 'Todos'">{{ filters.prefixo }}</span>
          <span v-if="filters.tipo !== 'Operacional'" class="filter-chip filter-chip--hit" @click="filters.tipo = 'Operacional'">{{ filters.tipo }}</span>
          <span v-if="viz.mes" class="filter-chip filter-chip--hit" @click="viz.mes = null">{{ months[viz.mes - 1] }}</span>
          <span v-if="viz.catKey" class="filter-chip filter-chip--hit" @click="viz.catKey = null">{{ catLabel(viz.catKey) }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         CONTENT
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="row q-col-gutter-md q-mb-md items-stretch">

        <div class="col-6 col-md-4">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(22,163,74,.1)">
                <q-icon name="mdi-check-circle" size="24px" style="color:#16a34a" />
              </div>
              <div :key="totalConf" class="kpi-stat-value kpi-pop" style="color:#16a34a">
                {{ totalConf.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Total conformidade</div>
              <div class="kpi-stat-sub">ano {{ filters.ano }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-6 col-md-4">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(139,28,43,.1)">
                <q-icon name="mdi-close-circle" size="24px" style="color:#8B1C2B" />
              </div>
              <div :key="totalInc" class="kpi-stat-value kpi-pop" style="color:#8B1C2B">
                {{ totalInc.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Total Inconformidade</div>
              <div class="kpi-stat-sub">ano {{ filters.ano }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="kpi-card kpi-gauge-card">
            <q-card-section class="q-pa-md kpi-gauge-section">
              <div class="kpi-gauge-label">% conformidade</div>
              <div class="kpi-gauge-wrap">
                <v-chart :option="gaugeOpt" autoresize class="kpi-gauge-chart" />
                <div class="kpi-gauge-sub">
                  {{ totalConf.toLocaleString('pt-BR') }} de
                  {{ (totalConf + totalInc).toLocaleString('pt-BR') }} observações
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

      </div>

      <!-- Section title -->
      <div class="operacional-title">{{ filters.tipo.toUpperCase() }}</div>

      <!-- Top row: APR · Regras de Ouro · Procedimento -->
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="cat in topCharts" :key="cat.id" class="col-12 col-md-4">
          <q-card flat bordered class="cat-card chart-card" :class="{ 'cat-card--on': viz.catKey === cat.id }">
            <q-card-section class="q-pa-sm">
              <div class="cat-title cat-title--hit" @click="toggleCat(cat.id)">{{ cat.title }}</div>
              <div class="cat-caption">Título filtra a categoria · barra filtra o mês</div>
              <v-chart class="chart-hit" :option="cat.option" :update-options="{ notMerge: false }" autoresize style="height:230px" @click="onMesClick" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Bottom row: 4 categories -->
      <div class="row q-col-gutter-md">
        <div v-for="cat in bottomCharts" :key="cat.id" class="col-12 col-md-3">
          <q-card flat bordered class="cat-card chart-card" :class="{ 'cat-card--on': viz.catKey === cat.id }">
            <q-card-section class="q-pa-sm">
              <div class="cat-title cat-title--hit" @click="toggleCat(cat.id)">{{ cat.title }}</div>
              <div class="cat-caption">Título filtra a categoria · barra filtra o mês</div>
              <v-chart class="chart-hit" :option="cat.option" :update-options="{ notMerge: false }" autoresize style="height:230px" @click="onMesClick" />
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
import { BarChart, GaugeChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente } from "@/lib/dashboard";

use([CanvasRenderer, BarChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent]);

const { loading, error, submissions, responses, employees, load } = useChecklistData();

// â"€â"€â"€ Colors â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const G = { green: "#16a34a", brand: "#8B1C2B" };
const reduceMotion = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const chartMotion = reduceMotion
  ? { animation: false as const }
  : {
      animation: true as const,
      animationDuration: 520,
      animationDurationUpdate: 240,
      animationEasing: "cubicOut" as const,
      animationEasingUpdate: "cubicOut" as const,
      animationDelay: (i: number) => Math.min(i * 22, 180),
      animationDelayUpdate: 0,
    };

// â"€â"€â"€ Filters â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const now = new Date();

const anosOpts     = ["2024","2025","2026"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","LOGÍSTICA"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];
const tiposOpts     = ["Operacional","Administrativo","Alojamento"];

// Mapeia o "Tipo de POC" para os valores reais de auditagem gravados no checklist
const TIPO_AUDITAGEM: Record<string, string[]> = {
  Operacional: ["GOMAN", "GSTC"],
  Administrativo: ["ADMINISTRATIVO", "LOGISTICA", "OFICINA", "ADM"],
  Alojamento: ["ALOJAMENTO"],
};

const allPrefixes: string[] = [
  "Todos","MA-BCB-E001M","MA-BCB-E002M","MA-PDT-P002M","MA-BDC-E002M",
  "MA-PDT-M001M","MA-BDC-C001M","MA-PDT-O035M","MA-BDC-F001M",
  "MA-PDT-F004M","MA-PDS-T001M","MA-PDS-F001M","MA-PDS-P002M",
  "MA-PDT-P001M","MA-PDS-O003M","MA-BCB-P002M","MA-STI-O002M",
];
const prefixoOpts = ref<string[]>([...allPrefixes]);
function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    prefixoOpts.value = allPrefixes.filter(p => p.toLowerCase().includes(n));
  });
}

const filters = reactive({
  ano: String(now.getFullYear()), base: "Todos",
  gerencia: "Todos", gerente: "Todos",
  prefixo: "Todos", tipo: "Operacional",
});

async function recarregar() {
  // Sem "mes": load() busca o ano inteiro, necessário para a quebra mensal do gráfico
  await load({
    ano: Number(filters.ano),
    base: filters.base === "Todos" ? undefined : filters.base,
  });
}
onMounted(recarregar);
watch(() => [filters.ano, filters.base], recarregar);

const viz = reactive({
  mes: null as number | null,
  catKey: null as string | null,
});

type EcClick = { componentType?: string; dataIndex?: number; name?: string };

function catLabel(key: string) {
  return CAT_DEFS.find((d) => d.key === key)?.label ?? key;
}

function toggleCat(key: string) {
  viz.catKey = viz.catKey === key ? null : key;
}

function onMesClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  const mes = (p.dataIndex ?? -1) + 1;
  if (mes < 1 || mes > 12) return;
  viz.mes = viz.mes === mes ? null : mes;
}

function resetSlice() {
  filters.gerencia = "Todos";
  filters.gerente = "Todos";
  filters.prefixo = "Todos";
  filters.tipo = "Operacional";
  viz.mes = null;
  viz.catKey = null;
}

const hasActiveFilters = computed(() =>
  filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.prefixo !== "Todos"
  || filters.tipo !== "Operacional"
  || viz.mes != null
  || !!viz.catKey,
);

function matchTipoPoc(auditagem: string | undefined) {
  const allowed = TIPO_AUDITAGEM[filters.tipo];
  if (!allowed) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function applySlice(
  source: typeof submissions.value,
  omit: { gerencia?: boolean; prefixo?: boolean; tipo?: boolean; mes?: boolean } = {},
) {
  let s = filterByGerente(source, employees.value, filters.gerente);
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.tipo) s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  if (!omit.prefixo && filters.prefixo !== "Todos") {
    s = s.filter((sub) => sub.equipe === filters.prefixo);
  }
  if (!omit.mes && viz.mes) {
    s = s.filter((sub) => {
      const d = new Date(sub.data ?? sub.created_at ?? "");
      return !isNaN(d.getTime()) && d.getMonth() + 1 === viz.mes;
    });
  }
  return s;
}

function catMatch(categoria: string | undefined, key: string) {
  const def = CAT_DEFS.find((d) => d.key === key);
  if (!def) return false;
  return !!(categoria?.includes(def.match) || categoria === def.match);
}

function respsOf(subs: typeof submissions.value, omitCat = false) {
  const ids = new Set(subs.map((s) => s.id));
  let r = responses.value.filter((resp) => ids.has(resp.submission_id));
  if (!omitCat && viz.catKey) r = r.filter((resp) => catMatch(resp.categoria, viz.catKey!));
  return r;
}

const chartSubs = computed(() => applySlice(submissions.value, { mes: true }));
const chartResps = computed(() => respsOf(chartSubs.value, true));
const filteredSubs = computed(() => applySlice(submissions.value));
const filteredResps = computed(() => respsOf(filteredSubs.value));

// â"€â"€â"€ Chart data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const CAT_DEFS = [
  { key: "apr",      label: "APR",                     match: "APR" },
  { key: "regraOuro",label: "Regras de Ouro",           match: "Regras de Ouro" },
  { key: "procedim", label: "Procedimento",             match: "Procedimento" },
  { key: "padrinho", label: "Padrinho de Segurança",    match: "Padrinho" },
  { key: "alturas",  label: "Trabalho em Altura",       match: "Altura" },
  { key: "veiculos", label: "Veículos e Equipamentos",  match: "Veículo" },
  { key: "epi",      label: "Epi, Epc e Ferramentas",   match: "EPI" },
];

const subMonthMap = computed(() => {
  const m: Record<string, number> = {};
  for (const s of chartSubs.value) {
    const d = new Date(s.data ?? s.created_at ?? "");
    if (!isNaN(d.getTime())) m[s.id] = d.getMonth() + 1;
  }
  return m;
});

const rawData = computed(() => {
  const result: Record<string, { conf: number[]; inc: number[] }> = {};
  for (const def of CAT_DEFS) {
    result[def.key] = { conf: Array(12).fill(0), inc: Array(12).fill(0) };
  }

  for (const r of chartResps.value) {
    const mes = subMonthMap.value[r.submission_id];
    if (!mes) continue;
    const def = CAT_DEFS.find(d => r.categoria?.includes(d.match) || d.match === r.categoria);
    if (!def) continue;
    if (r.resposta === "conforme") result[def.key].conf[mes - 1]++;
    else if (r.resposta === "nao_conforme") result[def.key].inc[mes - 1]++;
  }

  return result;
});

function tooltipSkin() {
  const bg = chartInk.tipBg;
  const fg = chartInk.tipText;
  const bd = chartInk.tipBorder;
  return {
    trigger: "axis" as const,
    appendTo: () => document.body,
    confine: true,
    enterable: false,
    transitionDuration: 0,
    backgroundColor: bg,
    borderColor: bd,
    borderWidth: 1,
    padding: [12, 14] as [number, number],
    textStyle: { color: fg, fontSize: 12, fontWeight: 500 as const },
    extraCssText:
      `background:${bg} !important;color:${fg} !important;border:1px solid ${bd};`
      + "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.55);opacity:1;",
  };
}

function makeCatChart(data: { conf: number[]; inc: number[] }, catKey: string) {
  const selMes = viz.mes;
  const dimCard = !!viz.catKey && viz.catKey !== catKey;
  return {
    ...chartMotion,
    tooltip: {
      ...tooltipSkin(),
      formatter: (params: { dataIndex: number }[]) => {
        const i = params[0]?.dataIndex ?? 0;
        const t = chartInk.tipText;
        const m = chartInk.tipMuted;
        return (
          `<div style="min-width:140px;color:${t}">`
          + `<div style="font-weight:800;font-size:14px;color:${t}">${months[i]}</div>`
          + `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px">`
          + `<span style="color:${m};font-size:11px;font-weight:600">Inconformidade</span>`
          + `<span style="color:${G.brand};font-size:13px;font-weight:800">${data.inc[i]}</span>`
          + `</div>`
          + `<div style="color:${m};font-size:10px;margin-top:8px">Clique para filtrar este mês</div>`
          + `</div>`
        );
      },
    },
    grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: months,
      axisLine: { lineStyle: { color: chartInk.split } },
      axisTick: { show: false },
      axisLabel: { color: chartInk.muted, fontSize: 10 },
    },
    yAxis: {
      type: "value" as const,
      show: false,
      splitLine: { show: false },
    },
    series: [{
      id: `inc-${catKey}`,
      name: "Inconformidade",
      type: "bar" as const,
      cursor: "pointer",
      barMaxWidth: 42,
      barMinHeight: 2,
      emphasis: {
        focus: "self" as const,
        itemStyle: { shadowBlur: 10, shadowColor: "rgba(139,28,43,.35)" },
      },
      itemStyle: { color: G.brand, borderRadius: [4, 4, 0, 0] },
      label: {
        show: true,
        position: "top" as const,
        color: chartInk.axis,
        fontSize: 11,
        fontWeight: "bold" as const,
        backgroundColor: chartInk.halo,
        padding: [2, 6],
        borderRadius: 4,
        formatter: (p: { value: number }) => `${p.value}`,
      },
      data: data.inc.map((v, i) => ({
        value: v,
        itemStyle: {
          color: G.brand,
          opacity: dimCard ? 0.22 : (!selMes || selMes === i + 1 ? 1 : 0.22),
        },
      })),
    }],
  };
}

// â"€â"€â"€ Chart lists â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const topCharts = computed(() => [
  { id: "apr",       title: "APR",           option: makeCatChart(rawData.value.apr, "apr") },
  { id: "regraOuro", title: "REGRAS DE OURO",option: makeCatChart(rawData.value.regraOuro, "regraOuro") },
  { id: "procedim",  title: "PROCEDIMENTO",  option: makeCatChart(rawData.value.procedim, "procedim") },
]);

const bottomCharts = computed(() => [
  { id: "padrinho", title: "PADRINHO DE SEGURANÇA",   option: makeCatChart(rawData.value.padrinho, "padrinho") },
  { id: "alturas",  title: "TRABALHO EM ALTURA",      option: makeCatChart(rawData.value.alturas, "alturas") },
  { id: "veiculos", title: "VEÍCULOS E EQUIPAMENTOS", option: makeCatChart(rawData.value.veiculos, "veiculos") },
  { id: "epi",      title: "EPI, EPC E FERRAMENTA",   option: makeCatChart(rawData.value.epi, "epi") },
]);

// â"€â"€â"€ KPI totals â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const totalConformes    = computed(() => filteredResps.value.filter(r => r.resposta === "conforme").length);
const totalNaoConformes = computed(() => filteredResps.value.filter(r => r.resposta === "nao_conforme").length);
const conformidadeIndex = computed(() => {
  const t = filteredResps.value.length;
  return t ? totalConformes.value / t : 0;
});

const totalConf = totalConformes;
const totalInc  = totalNaoConformes;
const pctGlobal = computed(() => Math.round(conformidadeIndex.value * 100));

// â"€â"€â"€ Gauge â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const gaugeOpt = computed(() => ({
  ...chartMotion,
  series: [{
    type: "gauge" as const,
    startAngle: 210, endAngle: -30,
    min: 0, max: 100,
    radius: "100%",
    center: ["50%", "50%"],
    pointer: { show: false },
    progress: {
      show: true, width: 12, roundCap: false,
      itemStyle: { color: G.green },
    },
    axisLine: { lineStyle: { width: 12, color: [[1, "#dcfce7"]] } },
    splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: !reduceMotion,
      fontSize: 26,
      fontWeight: "bold" as const,
      formatter: "{value}%",
      color: G.brand,
      offsetCenter: [0, "8%"],
    },
    data: [{ value: pctGlobal.value }],
  }],
}));
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.indicadores-page { background: #f8fafc; min-height: 100vh; }

// â"€â"€ Filter bar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

// â"€â"€ Pills â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  height: 30px; padding: 0 12px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600;
  }
}

// â"€â"€ Select â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.fgroup--gerente { min-width: 150px; }
.gerente-select {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg;
    padding: 0 10px 0 4px; transition: border-color .18s;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) {
    border-color: $brand; box-shadow: 0 0 0 2px rgba($brand,.15);
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

// â"€â"€ Divider â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
  &:hover { color: $brand; border-color: $brand; }
}
.chart-hit { cursor: pointer; }

// â"€â"€ KPI cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
.kpi-pop { animation: kpi-pop .38s cubic-bezier(0.16, 1, 0.3, 1); }
.kpi-stat-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-top: 4px;
}
.kpi-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; font-weight: 500; }

.kpi-gauge-card { overflow: hidden; }
.kpi-gauge-section {
  display: flex; flex-direction: column; align-items: center; height: 100%;
}
.kpi-gauge-label {
  font-size: 12px; font-weight: 500; color: #64748b;
  text-align: center; margin-bottom: 2px; letter-spacing: .01em;
}
.kpi-gauge-wrap {
  flex: 1; display: flex; flex-direction: column; align-items: center; width: 100%;
}
.kpi-gauge-chart { width: 100%; height: 148px; }
.kpi-gauge-sub { font-size: 11px; font-weight: 600; color: #64748b; margin-top: 0; letter-spacing: .01em; }

// â"€â"€ Section title â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.operacional-title {
  font-size: 14px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 1.5px; color: $brand;
  text-align: center; margin-bottom: 16px;
  position: relative;
  &::before, &::after {
    content: ""; position: absolute; top: 50%;
    width: calc(50% - 80px); height: 1px;
    background: linear-gradient(to right, transparent, rgba($brand,.25));
  }
  &::before { left: 0; background: linear-gradient(to right, transparent, rgba($brand,.25)); }
  &::after  { right: 0; background: linear-gradient(to left, transparent, rgba($brand,.25)); }
}

// â"€â"€ Category chart cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.cat-card {
  border-radius: 12px;
  transition: box-shadow .22s cubic-bezier(0.16, 1, 0.3, 1), border-color .22s ease, transform .22s cubic-bezier(0.16, 1, 0.3, 1), opacity .22s ease;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.indicadores-page:has(.cat-card--on) .cat-card:not(.cat-card--on) {
  opacity: .62;
}
.cat-title {
  font-size: 12px; font-weight: 800; color: $brand;
  text-transform: uppercase; letter-spacing: .8px;
  text-align: center; padding: 6px 0 2px;
  &--hit { cursor: pointer; }
  &--hit:hover { text-decoration: underline; }
}
.cat-caption {
  font-size: 10px; color: $label-color; text-align: center; margin-bottom: 4px;
}
.cat-card--on {
  border-color: $brand !important;
  box-shadow: 0 10px 28px rgba($brand, .22);
}

// â"€â"€ Dark mode â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.body--dark {
  .indicadores-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill {
    background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .gerente-select {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: #94a3b8; }
  }
  .kpi-stat-label { color: #94a3b8; }
  .kpi-stat-sub { color: #64748b; }
  .cat-card { background: #1e293b; }
  .operacional-title { color: #fca5a5; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .cat-caption { color: #64748b; }
}
.chip-bar-enter-active { transition: opacity .22s cubic-bezier(0.16, 1, 0.3, 1), transform .22s cubic-bezier(0.16, 1, 0.3, 1); }
.chip-bar-leave-active { transition: opacity .16s ease, transform .16s ease; }
.chip-bar-enter-from { opacity: 0; transform: translateY(-6px); }
.chip-bar-leave-to { opacity: 0; transform: translateY(-4px); }
@keyframes kpi-pop {
  from { opacity: .35; transform: translateY(7px); filter: blur(5px); }
  to { opacity: 1; transform: none; filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  .kpi-pop { animation: none; }
  .chip-bar-enter-from, .chip-bar-leave-to { transform: none; }
  .cat-card { transition: none; }
}
</style>

