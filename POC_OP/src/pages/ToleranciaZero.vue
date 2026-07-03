<template>
  <q-page class="tz-page">
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

        <!-- Row 1: Ano · Categoria · Gerente Final · Observador -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in anos" :key="a"
                :class="['pill', filters.ano === a && 'pill--active']"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Categoria</span>
            <div class="pill-group">
              <button v-for="c in categorias" :key="c"
                :class="['pill', filters.categoria === c && 'pill--active']"
                @click="filters.categoria = c">{{ c }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerente Final</span>
            <div class="pill-group">
              <button v-for="g in gerentesFinal" :key="g"
                :class="['pill', filters.gerenteFinal === g && 'pill--active']"
                @click="filters.gerenteFinal = g">{{ g }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Observador</span>
            <q-select v-model="filters.observador" :options="observadorOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>
        </div>

        <!-- Row 2: Mês · Semana · Base · Gerência da Equipe · Prefixo -->
        <div class="filter-row">
          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Mês</span>
            <q-select v-model="filters.mes" :options="mesesOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Semana</span>
            <q-select v-model="filters.semana" :options="semanasOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in bases" :key="b"
                :class="['pill', filters.base === b && 'pill--active']"
                @click="filters.base = b">{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--select" style="min-width:160px">
            <span class="fgroup__label">Gerência da Equipe</span>
            <q-select v-model="filters.gerencia" :options="gerenciasOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="fgroup fgroup--select" style="min-width:170px">
            <span class="fgroup__label">Prefixo da Equipe</span>
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
              dense outlined hide-bottom-space class="fselect"
              use-input input-debounce="0" popup-content-class="fselect-popup"
              @filter="filterPrefixo" />
          </div>
        </div>

      </div>
      </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         CONTENT
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">
      <div class="row q-col-gutter-md items-stretch">

        <!-- Col 1: Treemap -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Risco de Alto Potencial por Categoria</div>
            </q-card-section>
            <q-card-section class="q-pt-none" style="padding-bottom:0">
              <v-chart :option="chartTreemap" autoresize style="height:460px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 2: Ranking table -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Ranking do Risco de Alto Potencial</div>
            </q-card-section>
            <q-card-section class="q-pa-none">
              <div class="rank-wrap">
                <table class="rank-table">
                  <thead>
                    <tr>
                      <th class="rh-q">Não conformidade</th>
                      <th class="rh-v">Qnt Não Conforme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in rankingNc" :key="i" :class="['rank-row', i % 2 === 0 && 'rank-row--alt']">
                      <td class="rd-q">{{ r.q }}</td>
                      <td class="rd-v">{{ r.v }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="rank-total">
                      <td class="rd-q">Total</td>
                      <td class="rd-v">{{ totalNc }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 3: Bar chart ranking equipes -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Ranking de Equipes com Não conformidades</div>
            </q-card-section>
            <q-card-section class="q-pt-none" style="padding-bottom:0">
              <v-chart :option="chartRankingEq" autoresize style="height:460px" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, TreemapChart } from "echarts/charts";
import { TooltipComponent, GridComponent, DataZoomComponent } from "echarts/components";
import VChart from "vue-echarts";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";

use([CanvasRenderer, BarChart, TreemapChart, TooltipComponent, GridComponent, DataZoomComponent]);

const {
  loading, error,
  totalNaoConformes, byCategoria, byGravidade, submissions, responses,
  load,
} = useChecklistData();

// â”€â”€â”€ Filter options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showFilters = ref(false);

const anos         = ["2024", "2025", "2026"];
const categorias   = ["Todos", "APR", "Padrinho de Segurança", "Procedimento", "Regras de Ouro"];
const gerentesFinal = ["Todos","Afonso","Jamerson","João F.","Julio C.","Leandro","Marcos","Paulo","Pryscilla"];
const bases        = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const mesesOpts    = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26"];
const semanasOpts  = ["Todos","1ª Semana","2ª Semana","3ª Semana","4ª Semana"];
const gerenciasOpts = ["Todos","GERE","GOMAN","GSTC","SPOT"];
const observadorOpts = ["Todos"];

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

const now = new Date();
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
  "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
};
const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  ano: String(now.getFullYear()), categoria: "Todos", gerenteFinal: "Todos",
  observador: "Todos", mes: curMesLabel, semana: "Todos",
  base: "Todos", gerencia: "Todos", prefixo: "Todos",
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
watch(filters, recarregar, { deep: true });

// â”€â”€â”€ Treemap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const treemapData = computed(() => {
  const gravs = byGravidade.value;
  const cats = byCategoria.value;
  // Build treemap from NC per category (tolerÃ¢ncia zero focus)
  const entries = Object.entries(cats)
    .map(([name, d]) => ({ name, value: d.nc }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value);
  return entries;
});

const tmPalette = ["#6b1321","#8B1C2B","#a32636","#c43d52","#e8889a","#f9c5cb"];

const chartTreemap = computed(() => ({
  tooltip: {
    backgroundColor: "rgba(255,255,255,.97)",
    borderColor: "#e2e8f0", borderWidth: 1,
    textStyle: { color: "#334155", fontSize: 12 },
    extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;",
    formatter: (p: { name: string; value: number }) =>
      `<b>${p.name}</b><br/>Ocorrências: <b style="color:#8B1C2B">${p.value}</b>`,
  },
  series: [{
    type: "treemap" as const,
    roam: false,
    nodeClick: false as const,
    breadcrumb: { show: false },
    label: {
      show: true,
      position: "insideTopLeft" as const,
      padding: [10, 10],
      formatter: (p: { name: string; value: number }) => `${p.name}\n\n${p.value}`,
      fontSize: 13,
      fontWeight: "bold" as const,
      color: "#fff",
      textBorderColor: "rgba(0,0,0,.2)",
      textBorderWidth: 1,
    },
    data: treemapData.value.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: tmPalette[i] ?? "#f9c5cb" },
    })),
    itemStyle: { borderWidth: 2, borderColor: "#fff" },
  }],
}));

// â”€â”€â”€ Ranking NC table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const rankingNc = computed(() => {
  const counts: Record<string, number> = {};
  for (const r of responses.value) {
    if (r.resposta === "nao_conforme") {
      const key = r.pergunta ?? "Sem descrição";
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([q, v]) => ({ q, v }))
    .sort((a, b) => b.v - a.v);
});

const totalNc = computed(() => totalNaoConformes.value);

// â”€â”€â”€ Ranking equipes bar chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const rankEquipes = computed(() => {
  const ncPerSub: Record<string, number> = {};
  for (const r of responses.value) {
    if (r.resposta === "nao_conforme") {
      ncPerSub[r.submission_id] = (ncPerSub[r.submission_id] ?? 0) + 1;
    }
  }
  const counts: Record<string, number> = {};
  for (const sub of submissions.value) {
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

function barColor(v: number): string {
  if (v >= 6) return "#6b1321";
  if (v >= 4) return "#8B1C2B";
  if (v >= 2) return "#a32636";
  return "#c43d52";
}

const chartRankingEq = computed(() => ({
  tooltip: {
    trigger: "axis" as const,
    axisPointer: { type: "shadow" as const },
    backgroundColor: "rgba(255,255,255,.97)",
    borderColor: "#e2e8f0", borderWidth: 1,
    textStyle: { color: "#334155", fontSize: 12 },
    extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:10px;padding:10px 14px;",
    formatter: (p: { name: string; value: number }[]) => {
      const d = p[0];
      return `<b>${d.name}</b><br/>NCs: <b style="color:#8B1C2B">${d.value}</b>`;
    },
  },
  grid: { left: 8, right: 36, top: 4, bottom: 4, containLabel: true },
  xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
  yAxis: {
    type: "category" as const,
    data: rankEquipes.value.map(r => r.name),
    inverse: false,
    axisLine: { show: false }, axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { color: "#334155", fontSize: 10 },
  },
  dataZoom: [{
    type: "inside" as const, orient: "vertical" as const,
    startValue: 6, endValue: rankEquipes.value.length - 1,
    zoomOnMouseWheel: false, moveOnMouseWheel: true,
  }],
  series: [{
    type: "bar" as const,
    data: rankEquipes.value.map(r => ({
      value: r.v,
      itemStyle: { color: barColor(r.v), borderRadius: [0, 6, 6, 0] },
    })),
    barMaxWidth: 20,
    emphasis: { itemStyle: { opacity: .8 } },
    label: {
      show: true, position: "right" as const,
      fontSize: 11, fontWeight: "bold" as const, color: "#8B1C2B",
    },
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

.tz-page { background: #f8fafc; min-height: 100vh; }

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

// â”€â”€ Select dropdowns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.fgroup--select { min-width: 120px; }
.fselect {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg;
    padding: 0 10px 0 10px;
    transition: border-color .18s;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) {
    border-color: $brand;
    box-shadow: 0 0 0 2px rgba($brand,.15);
  }
  :deep(.q-field__native) {
    font-size: 12px; font-weight: 500; color: $inactive-text;
    padding: 0; min-height: unset; line-height: 30px;
  }
  :deep(.q-field__append) { height: 30px; .q-icon { font-size: 16px; color: $label-color; } }
}
:global(.fselect-popup .q-item) { font-size: 12px; min-height: 32px; padding: 4px 12px; }
:global(.fselect-popup .q-item--active) { color: $brand !important; font-weight: 600; }

// â”€â”€ Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

// â”€â”€ Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.chart-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
}
.chart-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
}

// â”€â”€ Ranking table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.rank-wrap {
  max-height: 490px;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
}
.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  thead tr {
    background: $brand;
    th {
      color: #fff;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
      padding: 8px 12px;
      text-align: left;
      border: none;
    }
    th.rh-v { text-align: center; white-space: nowrap; }
  }

  .rank-row td {
    padding: 7px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
    line-height: 1.4;
  }
  .rank-row--alt td { background: #f8fafc; }
  td.rd-v { text-align: center; font-weight: 700; color: $brand; white-space: nowrap; }

  tfoot .rank-total td {
    background: $brand;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    padding: 8px 12px;
    border: none;
  }
  tfoot .rank-total td.rd-v { color: #fff; }
}

// â”€â”€ Dark mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.body--dark {
  .tz-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .fselect {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: #94a3b8; }
  }
  .chart-title { color: #e2e8f0; }
  .rank-row td { color: #cbd5e1; border-bottom-color: #1e293b; }
  .rank-row--alt td { background: #0f172a; }
}
</style>

