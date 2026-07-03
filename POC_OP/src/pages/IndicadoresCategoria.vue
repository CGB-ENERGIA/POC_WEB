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
          <q-icon name="mdi-tune" size="20px" />
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Mês · Ano · Base · Gerência -->
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
        </div>

        <!-- Row 2: Semana · Gerente · Prefixo · Tipo de POC -->
        <div class="filter-row">
          <div class="fgroup fgroup--gerente" style="min-width:140px">
            <span class="fgroup__label">Semana</span>
            <q-select v-model="filters.semana" :options="semanasOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
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
          <div class="filter-divider" />
          <div class="fgroup fgroup--gerente" style="min-width:170px">
            <span class="fgroup__label">Prefixo</span>
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
              dense outlined hide-bottom-space class="gerente-select"
              use-input input-debounce="0" popup-content-class="gerente-popup"
              @filter="filterPrefixo" />
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--gerente" style="min-width:170px">
            <span class="fgroup__label">Tipo de POC</span>
            <q-select v-model="filters.tipo" :options="tiposOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
          </div>
        </div>

      </div>
      </div>
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
              <div class="kpi-stat-value" style="color:#16a34a">
                {{ totalConf.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Total conformidade</div>
              <div class="kpi-stat-sub">jan – jun 2026</div>
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
              <div class="kpi-stat-value" style="color:#8B1C2B">
                {{ totalInc.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Total Inconformidade</div>
              <div class="kpi-stat-sub">jan – jun 2026</div>
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
      <div class="operacional-title">OPERACIONAL</div>

      <!-- Top row: APR · Regras de Ouro · Procedimento -->
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="cat in topCharts" :key="cat.id" class="col-12 col-md-4">
          <q-card flat bordered class="cat-card">
            <q-card-section class="q-pa-sm">
              <div class="cat-title">{{ cat.title }}</div>
              <v-chart :option="cat.option" autoresize style="height:230px" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Bottom row: 4 categories -->
      <div class="row q-col-gutter-md">
        <div v-for="cat in bottomCharts" :key="cat.id" class="col-12 col-md-3">
          <q-card flat bordered class="cat-card">
            <q-card-section class="q-pa-sm">
              <div class="cat-title">{{ cat.title }}</div>
              <v-chart :option="cat.option" autoresize style="height:230px" />
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
import { useChecklistData } from "@/composables/useChecklistData";

use([CanvasRenderer, BarChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent]);

const { loading, error, submissions, responses, totalConformes, totalNaoConformes, conformidadeIndex, load } = useChecklistData();

// â”€â”€â”€ Colors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const G = { green: "#16a34a", brand: "#8B1C2B" };

// â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showFilters = ref(false);

const now = new Date();
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
  "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
};

const mesesOpts    = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26","jul/26","ago/26","set/26","out/26","nov/26","dez/26"];
const anosOpts     = ["2024","2025","2026"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","LOGÍSTICA"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];
const semanasOpts   = ["Todos","Semana 1","Semana 2","Semana 3","Semana 4"];
const tiposOpts     = ["Todos","Administrativo","Operacional","Alojamento"];

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

const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  mes: curMesLabel, ano: String(now.getFullYear()), base: "Todos",
  gerencia: "Todos", gerente: "Todos",
  semana: "Todos", prefixo: "Todos", tipo: "Operacional",
});

async function recarregar() {
  const mesNum = MONTH_MAP[filters.mes.slice(0, 3)];
  await load({
    ano: Number(filters.ano),
    mes: mesNum,
    base: filters.base === "Todos" ? undefined : filters.base,
    gerencia: filters.gerencia === "Todos" ? undefined : filters.gerencia,
  }, true); // loadYear=true for monthly breakdown
}
onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// â”€â”€â”€ Chart data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

// Category key mapping
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
  for (const s of submissions.value) {
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

  for (const r of responses.value) {
    const mes = subMonthMap.value[r.submission_id];
    if (!mes) continue;
    const def = CAT_DEFS.find(d => r.categoria?.includes(d.match) || d.match === r.categoria);
    if (!def) continue;
    if (r.resposta === "conforme") result[def.key].conf[mes - 1]++;
    else if (r.resposta === "nao_conforme") result[def.key].inc[mes - 1]++;
  }

  // Fallback to static if no real data
  const hasData = Object.values(result).some(d => d.conf.some(v => v > 0) || d.inc.some(v => v > 0));
  if (!hasData) return {
    apr:       { conf: [15053,13844,15107,17425,17471,14172,0,0,0,0,0,0], inc: [11,15,25,9,19,26,0,0,0,0,0,0] },
    regraOuro: { conf: [5825,5477,6029,6834,5676,5442,0,0,0,0,0,0],       inc: [1,1,1,0,2,0,0,0,0,0,0,0] },
    procedim:  { conf: [8687,8177,8986,10197,9968,8126,0,0,0,0,0,0],      inc: [52,40,59,54,49,37,0,0,0,0,0,0] },
    padrinho:  { conf: [2904,2720,2980,3366,3300,2701,0,0,0,0,0,0],       inc: [0,0,0,1,0,0,0,0,0,0,0,0] },
    alturas:   { conf: [4361,4067,4447,5081,5016,4091,0,0,0,0,0,0],       inc: [10,9,25,20,19,6,0,0,0,0,0,0] },
    veiculos:  { conf: [8210,7955,8859,9815,9241,7564,0,0,0,0,0,0],       inc: [33,33,30,37,34,37,0,0,0,0,0,0] },
    epi:       { conf: [12114,11403,12590,14203,13846,11285,0,0,0,0,0,0], inc: [22,42,22,59,40,37,0,0,0,0,0,0] },
  };
  return result;
});

// â”€â”€â”€ Chart factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeCatChart(data: { conf: number[]; inc: number[] }) {
  const pct = data.conf.map((c, i) => {
    const t = c + (data.inc[i] || 0);
    return t === 0 ? 100 : Math.round((c / t) * 100);
  });

  return {
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "rgba(255,255,255,.97)",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { color: "#334155", fontSize: 11 },
      extraCssText:
        "box-shadow:0 4px 16px rgba(0,0,0,.1);border-radius:8px;padding:8px 12px;",
      formatter: (params: { dataIndex: number }[]) => {
        const i = params[0]?.dataIndex ?? 0;
        return (
          `<b>${months[i]}</b><br/>` +
          `<span style="color:${G.green}">â— conformidade: ${data.conf[i].toLocaleString("pt-BR")}</span><br/>` +
          `<span style="color:${G.brand}">â— Inconformidade: ${data.inc[i]}</span><br/>` +
          `<b>% Conf: ${pct[i]}%</b>`
        );
      },
    },
    legend: {
      top: 2,
      left: "center",
      data: [
        { name: "conformidade",    icon: "circle" },
        { name: "Inconformidade",  icon: "circle" },
        { name: "% conformidade",  icon: "circle" },
      ],
      textStyle: { fontSize: 9.5, color: "#64748b" },
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 10,
    },
    grid: { left: 4, right: 4, top: 46, bottom: 4, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: months,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#64748b",
        fontSize: 10,
        // Show month + inconformidade value on second line
        formatter: (_val: string, idx: number) =>
          `{m|${months[idx]}}\n{i|${data.inc[idx] > 0 ? data.inc[idx] : "·"}}`,
        rich: {
          m: { color: "#64748b", fontSize: 10, lineHeight: 14 },
          i: { color: G.brand, fontSize: 9, fontWeight: "bold", lineHeight: 13 },
        },
      },
    },
    yAxis: {
      type: "value" as const,
      show: false,
      splitLine: { show: false },
    },
    series: [
      {
        name: "conformidade",
        type: "bar" as const,
        stack: "total",
        barMaxWidth: 52,
        itemStyle: { color: G.green, borderRadius: [0, 0, 0, 0] },
        label: {
          show: true,
          position: "inside" as const,
          color: "#fff",
          fontSize: 10,
          fontWeight: "bold" as const,
          formatter: (p: { value: number }) => p.value.toLocaleString("pt-BR"),
        },
        data: data.conf,
      },
      {
        name: "Inconformidade",
        type: "bar" as const,
        stack: "total",
        barMaxWidth: 52,
        barMinHeight: 3,
        itemStyle: { color: G.brand, borderRadius: [3, 3, 0, 0] },
        label: {
          show: true,
          position: "top" as const,
          color: "#334155",
          fontSize: 10,
          fontWeight: "bold" as const,
          backgroundColor: "#f1f5f9",
          padding: [2, 5],
          borderRadius: 3,
          formatter: (p: { dataIndex: number }) => `${pct[p.dataIndex]}%`,
        },
        data: data.inc,
      },
      {
        // legend placeholder only
        name: "% conformidade",
        type: "bar" as const,
        itemStyle: { color: "#475569" },
        data: [],
        silent: true,
      },
    ],
  };
}

// â”€â”€â”€ Chart lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const topCharts = computed(() => [
  { id: "apr",    title: "APR",           option: makeCatChart(rawData.value.apr) },
  { id: "regra",  title: "REGRAS DE OURO",option: makeCatChart(rawData.value.regraOuro) },
  { id: "proc",   title: "PROCEDIMENTO",  option: makeCatChart(rawData.value.procedim) },
]);

const bottomCharts = computed(() => [
  { id: "padrinho", title: "PADRINHO DE SEGURANÇA",   option: makeCatChart(rawData.value.padrinho) },
  { id: "altura",   title: "TRABALHO EM ALTURA",      option: makeCatChart(rawData.value.alturas) },
  { id: "veiculos", title: "VEÍCULOS E EQUIPAMENTOS", option: makeCatChart(rawData.value.veiculos) },
  { id: "epi",      title: "EPI, EPC E FERRAMENTA",   option: makeCatChart(rawData.value.epi) },
]);

// â”€â”€â”€ KPI totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const totalConf = totalConformes;
const totalInc  = totalNaoConformes;
const pctGlobal = computed(() => Math.round(conformidadeIndex.value * 100));

// â”€â”€â”€ Gauge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const gaugeOpt = computed(() => ({
  series: [{
    type: "gauge" as const,
    startAngle: 210, endAngle: -30,
    min: 0, max: 100,
    radius: "78%",
    center: ["50%", "52%"],
    pointer: { show: false },
    progress: {
      show: true, width: 14, roundCap: false,
      itemStyle: { color: G.green },
    },
    axisLine: { lineStyle: { width: 14, color: [[1, "#dcfce7"]] } },
    splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: true,
      fontSize: 28,
      fontWeight: "bold" as const,
      formatter: "{value}%",
      color: G.brand,
      // text fica no gap (abertura do "U"), abaixo dos endpoints do arco
      offsetCenter: [0, "72%"],
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

// â”€â”€ Filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Select â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

// â”€â”€ KPI cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
.kpi-gauge-chart { width: 100%; height: 140px; }
.kpi-gauge-sub { font-size: 11px; font-weight: 600; color: #64748b; margin-top: -4px; letter-spacing: .01em; }

// â”€â”€ Section title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Category chart cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.cat-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.cat-title {
  font-size: 12px; font-weight: 800; color: $brand;
  text-transform: uppercase; letter-spacing: .8px;
  text-align: center; padding: 6px 0 2px;
}

// â”€â”€ Dark mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
}
</style>

