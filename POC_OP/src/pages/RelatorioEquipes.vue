<template>
  <q-page class="relatorio-page">
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

        <!-- Row 1: Mês · Ano · Base · Gerente -->
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

        <!-- Row 2: Gerência · Tipo de POC · Função -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerenciasOpts" :key="g"
                :class="['pill', filters.gerencia === g && 'pill--active']"
                @click="filters.gerencia = g">{{ g }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposPoc" :key="t"
                :class="['pill', filters.tipoPoc === t && 'pill--active']"
                @click="filters.tipoPoc = t">{{ t }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Função</span>
            <div class="pill-group">
              <button v-for="f in funcaoOpts" :key="f"
                :class="['pill', filters.funcao === f && 'pill--active']"
                @click="filters.funcao = f">{{ f }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--gerente" style="min-width:220px">
            <span class="fgroup__label">Categoria</span>
            <q-select v-model="filters.categoria" :options="categoriasOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
          </div>
          <div class="fgroup fgroup--gerente" style="min-width:160px">
            <span class="fgroup__label">Prefixo</span>
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
              dense outlined hide-bottom-space class="gerente-select"
              use-input input-debounce="0" popup-content-class="gerente-popup"
              @filter="filterPrefixo" />
          </div>
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Observador</span>
            <q-select v-model="filters.observador" :options="observadorOpts"
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
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#0284c7" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(2,132,199,.1)">
                <q-icon name="mdi-eye-check" size="24px" style="color:#0284c7" />
              </div>
              <div class="kpi-stat-value" style="color:#0284c7">{{ totalSubmissions }}</div>
              <div class="kpi-stat-label">Visitas Recebidas</div>
              <div class="kpi-stat-sub">no período selecionado</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#ea580c" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(234,88,12,.1)">
                <q-icon name="mdi-account-group" size="24px" style="color:#ea580c" />
              </div>
              <div class="kpi-stat-value" style="color:#ea580c">{{ allPrefixes.length }}</div>
              <div class="kpi-stat-label">Total de Equipes</div>
              <div class="kpi-stat-sub">equipes monitoradas</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(22,163,74,.1)">
                <q-icon name="mdi-check-decagram" size="24px" style="color:#16a34a" />
              </div>
              <div class="kpi-stat-value" style="color:#16a34a">{{ visitadasSorted.length }}</div>
              <div class="kpi-stat-label">Equipes Visitadas</div>
              <div class="kpi-stat-sub">{{ naoVisitadas.length }} equipes não visitadas</div>
            </q-card-section>
          </q-card>
        </div>
        <!-- Taxa de Contato gauge -->
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-gauge-card">
            <q-card-section class="q-pa-md kpi-gauge-section">
              <div class="kpi-gauge-label">Taxa de Contato</div>
              <div class="kpi-gauge-wrap">
                <v-chart :option="gaugeOpt" autoresize class="kpi-gauge-chart" />
                <div class="kpi-gauge-sub">{{ visitadasSorted.length }} de {{ allPrefixes.length }} equipes</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- CHARTS GRID (4 cols) -->
      <div class="row q-col-gutter-md items-start">

        <!-- Col 1: Equipes Visitadas -->
        <div class="col-12 col-md-3">
          <q-card flat bordered>
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Equipes Visitadas</div>
              <div class="text-h5 text-weight-bold" style="color:#16a34a">{{ visitadasSorted.length }}</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <v-chart :option="chartVisitadas" autoresize style="height:440px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 2: Equipes Não Visitadas -->
        <div class="col-12 col-md-2">
          <q-card flat bordered>
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Equipes Não Visitadas</div>
              <div class="text-h5 text-weight-bold" style="color:#dc2626">{{ naoVisitadas.length }}</div>
            </q-card-section>
            <q-card-section class="q-pt-xs">
              <div v-for="eq in naoVisitadas" :key="eq" class="nv-row">
                <span class="nv-nome">{{ eq }}</span>
                <span class="nv-zero">0</span>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 3: Ranking NC Equipes + NC por Categoria -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Ranking de Equipes com Não Conformidades</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <v-chart :option="chartRankingNcEq" autoresize style="height:220px" />
            </q-card-section>
          </q-card>
          <q-card flat bordered>
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Não Conformidades por Categoria</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <v-chart :option="chartNcCat" autoresize style="height:196px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 4: Ranking Geral NC -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Ranking Geral de Não Conformidades</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <v-chart :option="chartRankingGeralNc" autoresize style="height:460px" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, GaugeChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useChecklistData, fmtPct } from "@/composables/useChecklistData";

use([CanvasRenderer, BarChart, GaugeChart, GridComponent, TooltipComponent, DataZoomComponent]);

const {
  loading, error,
  totalSubmissions, conformidadeIndex, byCategoria, responses, submissions,
  load,
} = useChecklistData();

// â"€â"€â"€ Colors â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const G = { green: "#16a34a", brand: "#8B1C2B", brandLt: "#C4364E" };

// â"€â"€â"€ Filter options â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const now = new Date();
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
  "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
};

const mesesOpts    = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26","jul/26","ago/26","set/26","out/26","nov/26","dez/26"];
const anosOpts     = ["2024","2025","2026"];
const categoriasOpts = ["Todos","Procedimento","Padrinho de Segurança","Veículos e Equipamentos","EPI/EPC","APR","Trabalho em Altura","Regras de Ouro"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","GERE","GOMAN","GSTC","SPOT"];
const gerentesOpts = ["Todos","Afonso","Jackson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];
const observadorOpts = ["Todos"];
const funcaoOpts   = ["Todos","Eletricista","Motorista","Operador","Técnico"];
const tiposPoc     = ["Administrativo","Operacional","Alojamento"];

const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  mes: curMesLabel, ano: String(now.getFullYear()), categoria: "Todos",
  base: "Todos", prefixo: "Todos", gerencia: "Todos",
  gerente: "Todos", observador: "Todos", funcao: "Todos",
  tipoPoc: "Operacional",
});

async function recarregar() {
  const mesNum = MONTH_MAP[filters.mes.slice(0, 3)] ?? (now.getMonth() + 1);
  await load({
    ano: Number(filters.ano),
    mes: mesNum,
    base: filters.base === "Todos" ? undefined : filters.base,
    gerencia: filters.gerencia === "Todos" ? undefined : filters.gerencia,
  });
}
onMounted(recarregar);
watch(() => [filters.ano, filters.mes, filters.base, filters.gerencia], recarregar);

const filteredSubs = computed(() => {
  let s = submissions.value;
  if (filters.gerente !== "Todos") {
    s = s.filter(sub => sub.observador === filters.gerente);
  }
  if (filters.observador !== "Todos") {
    s = s.filter(sub => sub.observador === filters.observador);
  }
  if (filters.prefixo !== "Todos") {
    s = s.filter(sub => sub.equipe === filters.prefixo);
  }
  return s;
});

const filteredResps = computed(() => {
  const ids = new Set(filteredSubs.value.map(s => s.id));
  let r = responses.value.filter(resp => ids.has(resp.submission_id));
  if (filters.categoria !== "Todos") {
    r = r.filter(resp => resp.categoria === filters.categoria);
  }
  return r;
});

// â"€â"€â"€ Full prefix list â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const allPrefixes: string[] = [
  "MA-BCB-E001M","MA-BCB-E002M","MA-PDT-P002M","MA-BDC-E002M",
  "MA-PDT-M001M","MA-BDC-C001M","MA-PDT-O035M","MA-BDC-F001M",
  "MA-PDT-F004M","MA-PDS-T001M","MA-PDS-F001M","MA-PDS-P002M",
  "MA-PDT-P001M","MA-PDS-O003M","MA-BCB-P002M","MA-STI-O002M",
  "MA-ZDC-E001M","MA-PDS-E002M","MA-PDT-T001M","MA-VRF-E001M",
  "MA-BCB-Q001M","MA-PDT-E001M","MA-BCB-O006M","MA-PDT-O031M",
  "MA-ITM-O002M","MA-BCB-O004M","MA-BCB-O005M","MA-BCB-P001M",
  "MA-BCB-T001M","MA-ITM-P001M","MA-STI-P001M","MA-STI-C001M",
  "MA-PDT-V001M","MA-ITM-P002M","MA-BCB-C002M","MA-BCB-C001M",
  "MA-SDM-E001M","MA-BDC-M001M","MA-PDS-C001M","MA-IGG-E001M",
  "MA-GCD-M001M","MA-TTM-E001M","MA-DPO-E001M","MA-PDT-D001M",
  "MA-SJB-E001M","MA-PDS-F003M","MA-PDS-O001M","MA-ANJ-E001M",
  "MA-BCB-F002M","MA-ITM-O004M","MA-STI-T001M","MA-PRO-E001M",
  "MA-PDT-O030M","MA-BDC-F002M","MA-PDT-F001M","MA-PDT-F006M",
  "MA-ATM-E001M","MA-STI-P002M","MA-PDS-O002M","MA-LDP-C001M",
  "MA-ARI-E001M","MA-BCB-O001M","MA-ODC-M001M","MA-BCB-F006M",
  "MA-PDT-F003M","MA-BCB-V001M","MA-MRA-M001M","MA-STI-C002M",
  "MA-ITM-M001M","MA-STI-D003M","MA-GEB-E001M","MA-STI-D002M",
  "MA-PDT-O032M","MA-ITM-O001M","MA-VTO-M001M","MA-MRA-D001M",
  "MA-PDS-O004M","MA-PDT-O034M","MA-STI-F004M","MA-BCB-F007M",
  "MA-PDS-E001M","MA-LDP-M002M","MA-LGM-M001M","MA-PDS-P001M",
  "MA-PDT-F002M","MA-PDT-F008M","MA-BCB-F001M","MA-VGD-E001M",
  "MA-PDS-F008M","MA-BCB-O003M","MA-BCB-O002M","MA-BCB-W003M",
  "MA-ITM-E002M","MA-STI-F007M","MA-ITM-E001M","MA-BDC-M002M",
  "MA-PDS-F004M","MA-STI-O004M","MA-PDT-F007M","MA-PDT-F005M",
  "MA-ITM-C001M","MA-STI-E001M","MA-PDT-C002M","MA-PIO-E001M",
  "MA-STI-D001M","MA-STI-E004M","MA-STI-F010M","MA-PDS-V001M",
  "MA-PDS-M001M","MA-STI-O003M","MA-PDS-F005M","MA-STI-E003M",
  "MA-LDP-M001M","MA-BCB-F008M","MA-SMT-M001M","MA-SMT-E001M",
  "MA-ESP-E001M","MA-LDP-E001M","MA-STI-O001M","MA-SJC-M001M",
  "MA-BCB-D002M","MA-BMJ-E001M","MA-COR-M001M","MA-DPO-M001M",
  "MA-BCB-E003M","MA-ZDC-C001M","MA-STI-E002M","MA-MRA-E001M",
  "MA-MRA-C001M","MA-STI-V001M","MA-BCB-F012M","MA-BCB-F009M",
  "MA-PDT-C001M","MA-BCB-W001M","MA-ZDC-M001M","MA-STL-E001M",
  "MA-STL-M001M","MA-BCB-C003M","MA-ITM-F001M","MA-VGD-E002M",
  "MA-ITM-C002M","MA-STI-F008M","MA-BCB-F020M","MA-BCB-F021M",
  "MA-PDS-F006M","MA-SLG-M001M","MA-LGV-E001M","MA-ITM-V001M",
  "MA-BCB-F005M","MA-STI-F003M","MA-BCB-W002M","MA-ALP-E001M",
  "MA-PLR-E001M","MA-MON-M001M","MA-STI-F001M","MA-ITM-O003M",
  "MA-PDT-E002M","MA-BDC-O001M","MA-BDC-O002M","MA-BCB-F003M",
  "MA-PDS-F002M","MA-CTD-E001M","MA-ITM-F002M","MA-SDM-M001M",
  "MA-BDC-E001M","MA-FFC-E001M","MA-STI-F005M","MA-STI-F002M",
  "MA-BCB-F011M","MA-COR-C001M","MA-STI-F006M","MA-BCB-F004M",
  "MA-COR-E001M","MA-BCB-D001M","MA-BCB-F023M","MA-BCB-P003M",
  "MA-BDC-O004M","MA-BDC-O003M","MA-BDC-O005M","MA-BDC-V001M",
  "MA-PDT-P005M","MA-PDT-D000M","MA-PDT-V002M","MA-PDT-O036M",
  "MA-BCB-O007M","MA-PDT-O038M","MA-BCB-H001M","MA-STI-H001M",
  "MA-BDC-H001M","MA-PDT-H001M","MA-ITM-H001M",
];

const prefixoOpts = ref<string[]>(["Todos", ...allPrefixes]);
function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    prefixoOpts.value = ["Todos", ...allPrefixes.filter(p => p.toLowerCase().includes(n))];
  });
}

// â"€â"€â"€ Visit count from real data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const visitadasSorted = computed(() => {
  const counts: Record<string, number> = {};
  for (const sub of filteredSubs.value) {
    const equipes: string[] = Array.isArray(sub.membros)
      ? (sub.membros as string[])
      : sub.equipe ? [sub.equipe] : [];
    for (const eq of equipes) {
      counts[eq] = (counts[eq] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([nome, v]) => ({ nome, v }))
    .sort((a, b) => b.v - a.v);
});

const naoVisitadas = computed(() => {
  const visited = new Set(visitadasSorted.value.map(e => e.nome));
  return allPrefixes.filter(p => !visited.has(p));
});

// â"€â"€â"€ Tooltip helper â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const ttItem = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,.97)",
  borderColor: "#e2e8f0", borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 12 },
  extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;",
};

// â"€â"€â"€ Gauge â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const gaugeOpt = computed(() => ({
  series: [{
    type: "gauge" as const,
    startAngle: 210, endAngle: -30,
    min: 0, max: 100,
    radius: "88%",
    center: ["50%", "65%"],
    pointer: { show: false },
    progress: {
      show: true, width: 16, roundCap: true,
      itemStyle: { color: "#16a34a" },
    },
    axisLine: {
      lineStyle: { width: 16, color: [[1, "#dcfce7"]] },
    },
    splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: true,
      fontSize: 30,
      fontWeight: "bold" as const,
      formatter: "{value}%",
      color: G.brand,
      offsetCenter: [0, "-8%"],
    },
    data: [{ value: Math.round(conformidadeIndex.value * 100) }],
  }],
}));

// â"€â"€â"€ Equipes Visitadas chart â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const chartVisitadas = computed(() => {
  const data = visitadasSorted.value;
  const cats = data.map(e => e.nome);
  const vals = data.map(e => e.v);

  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Visitas: <b style="color:${G.green}">${p.value}</b>`,
    },
    grid: { left: 8, right: 36, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: cats, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 10 },
    },
    dataZoom: [{
      type: "inside" as const, orient: "vertical" as const,
      startValue: 0, endValue: 19,
      zoomOnMouseWheel: false, moveOnMouseWheel: true,
    }],
    series: [{
      type: "bar" as const,
      data: vals,
      barMaxWidth: 18,
      itemStyle: { color: G.green, borderRadius: [0, 5, 5, 0] },
      emphasis: { itemStyle: { opacity: .8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 10, fontWeight: "bold" as const, color: G.green,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

// â"€â"€â"€ NC per equipe from real data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const ncPerEquipe = computed(() => {
  const ncPerSub: Record<string, number> = {};
  for (const r of filteredResps.value) {
    if (r.resposta === "nao_conforme") {
      ncPerSub[r.submission_id] = (ncPerSub[r.submission_id] ?? 0) + 1;
    }
  }
  const counts: Record<string, number> = {};
  for (const sub of filteredSubs.value) {
    const nc = ncPerSub[sub.id] ?? 0;
    if (nc === 0) continue;
    const equipes: string[] = Array.isArray(sub.membros)
      ? (sub.membros as string[])
      : sub.equipe ? [sub.equipe] : [];
    for (const eq of equipes) {
      counts[eq] = (counts[eq] ?? 0) + nc;
    }
  }
  return Object.entries(counts)
    .map(([name, v]) => ({ name, v }))
    .sort((a, b) => a.v - b.v);
});

// â"€â"€â"€ Ranking NC Equipes â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const chartRankingNcEq = computed(() => {
  const data = ncPerEquipe.value;
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>NC: <b style="color:${G.brand}">${p.value}</b>`,
    },
    grid: { left: 8, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: data.map(e => e.name),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 10 },
    },
    series: [{
      type: "bar" as const,
      data: data.map(e => e.v),
      barMaxWidth: 22,
      itemStyle: { color: G.brand, borderRadius: [0, 6, 6, 0] },
      emphasis: { itemStyle: { opacity: .8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const, color: G.brand,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

// â"€â"€â"€ NC por Categoria â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const chartNcCat = computed(() => {
  const entries = Object.entries(byCategoria.value)
    .map(([cat, d]) => ({ cat, nc: d.nc }))
    .filter(e => e.nc > 0)
    .sort((a, b) => a.nc - b.nc);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Ocorrências: <b style="color:${G.brand}">${p.value}</b>`,
    },
    grid: { left: 8, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: entries.map(e => e.cat),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: "#334155", fontSize: 10 },
    },
    series: [{
      type: "bar" as const,
      data: entries.map(e => e.nc),
      barMaxWidth: 28,
      itemStyle: { color: G.brand, borderRadius: [0, 6, 6, 0] },
      emphasis: { itemStyle: { opacity: .8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const, color: G.brand,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

// â"€â"€â"€ Ranking Geral NC â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const rgData = computed(() => {
  const counts: Record<string, number> = {};
  for (const r of filteredResps.value) {
    if (r.resposta === "nao_conforme") {
      const key = (r.pergunta ?? "Sem descrição").slice(0, 50) + "...";
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([q, v]) => ({ q, v }))
    .sort((a, b) => a.v - b.v);
});

const chartRankingGeralNc = computed(() => {
  const data = rgData.value;
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `${p.name}<br/>NC: <b style="color:${G.brand}">${p.value}</b>`,
    },
    grid: { left: 8, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: data.map(e => e.q), inverse: false,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: "#334155", fontSize: 10, width: 200, overflow: "truncate" as const },
    },
    dataZoom: [{
      type: "inside" as const, orient: "vertical" as const,
      startValue: 0, endValue: data.length - 1,
      zoomOnMouseWheel: false, moveOnMouseWheel: true,
    }],
    series: [{
      type: "bar" as const,
      data: data.map((e, i) => ({
        value: e.v,
        itemStyle: {
          color: `rgba(139,28,43,${0.45 + (i / (data.length || 1)) * 0.55})`,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 22,
      emphasis: { itemStyle: { opacity: .8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const, color: G.brand,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.relatorio-page { background: #f8fafc; min-height: 100vh; }

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

// â"€â"€ Select (Gerente / Categoria / Prefixo / Observador) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.fgroup--gerente { min-width: 150px; }
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

// â"€â"€ Divider â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

/* â"€â"€â"€ KPI cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
.kpi-card {
  border-radius: 12px;
  height: 100%;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}

// Stat cards (cards 1-3)
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
  width: 44px; height: 44px; border-radius: 12px;
  margin-bottom: 8px;
}
.kpi-stat-value {
  font-size: 32px; font-weight: 800; line-height: 1.1;
  letter-spacing: -.5px;
}
.kpi-stat-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-top: 4px;
}
.kpi-stat-sub {
  font-size: 11px; color: #94a3b8; margin-top: 2px; font-weight: 500;
}

.kpi-gauge-card { overflow: hidden; }
.kpi-gauge-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.kpi-gauge-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-align: center;
  margin-bottom: 2px;
  letter-spacing: .01em;
}
.kpi-gauge-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.kpi-gauge-chart { width: 100%; height: 120px; }
.kpi-gauge-sub {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-top: -4px;
  letter-spacing: .01em;
}

/* â"€â"€â"€ Equipes Não Visitadas list â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
.nv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 4px;
  border-bottom: 1px solid $border;
  &:last-child { border-bottom: none; }
}
.nv-nome { font-size: 11px; font-weight: 600; color: #334155; }
.nv-zero {
  font-size: 12px; font-weight: 700; color: #dc2626;
  background: #fee2e2; border-radius: 6px;
  padding: 1px 8px; min-width: 28px; text-align: center;
}

// â"€â"€ Dark mode â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.body--dark {
  .relatorio-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand, .1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .gerente-select {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: #94a3b8; }
  }
  .nv-row { border-bottom-color: #334155; }
  .nv-nome { color: #e2e8f0; }
  .kpi-stat-label { color: #94a3b8; }
  .kpi-stat-sub { color: #64748b; }
}
</style>

