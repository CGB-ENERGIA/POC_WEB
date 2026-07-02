<template>
  <q-page class="obs-page">

    <!-- ═══════════════════════════ FILTER BAR ═══════════════════════════ -->
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

        <!-- Row 1: Ano · Base · Gerência · Tipo de POC -->
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
          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposOpts" :key="t"
                :class="['pill', filters.tipo === t && 'pill--active']"
                @click="filters.tipo = t">{{ t }}</button>
            </div>
          </div>
        </div>

        <!-- Row 2: Mês · Semana · Função · Gerente · Observador -->
        <div class="filter-row">
          <div class="fgroup fgroup--sel" style="min-width:110px">
            <span class="fgroup__label">Mês</span>
            <q-select v-model="filters.mes" :options="mesesOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel" style="min-width:130px">
            <span class="fgroup__label">Semana</span>
            <q-select v-model="filters.semana" :options="semanasOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel" style="min-width:150px">
            <span class="fgroup__label">Função</span>
            <q-select v-model="filters.funcao" :options="funcoesOpts"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" />
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel">
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
          <div class="fgroup fgroup--sel" style="min-width:160px">
            <span class="fgroup__label">Observador</span>
            <q-select v-model="filters.observador" :options="observadoresOpts"
              dense outlined hide-bottom-space class="gerente-select"
              use-input input-debounce="0" popup-content-class="gerente-popup"
              @filter="filterObservador" />
          </div>
        </div>

      </div>
      </div>
    </div>

    <!-- ═══════════════════════════ CONTENT ═══════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="row q-col-gutter-md q-mb-md items-stretch">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#0284c7" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(2,132,199,.1)">
                <q-icon name="mdi-eye" size="24px" style="color:#0284c7" />
              </div>
              <div class="kpi-stat-value" style="color:#0284c7">{{ totalObs.toLocaleString('pt-BR') }}</div>
              <div class="kpi-stat-label">Total de Obs</div>
              <div class="kpi-stat-sub">observações realizadas</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(22,163,74,.1)">
                <q-icon name="mdi-check-all" size="24px" style="color:#16a34a" />
              </div>
              <div class="kpi-stat-value" style="color:#16a34a">{{ totalObs100.toLocaleString('pt-BR') }}</div>
              <div class="kpi-stat-label">Obs 100%</div>
              <div class="kpi-stat-sub">sem nenhum desvio</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(139,28,43,.1)">
                <q-icon name="mdi-alert-circle" size="24px" style="color:#8B1C2B" />
              </div>
              <div class="kpi-stat-value" style="color:#8B1C2B">{{ obsDesvio.toLocaleString('pt-BR') }}</div>
              <div class="kpi-stat-label">Obs c/ Desvio</div>
              <div class="kpi-stat-sub">com não conformidade</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-gauge-card">
            <q-card-section class="q-pa-md kpi-gauge-section">
              <div class="kpi-gauge-label">% Obs 100%</div>
              <div class="kpi-gauge-wrap">
                <v-chart :option="gaugeOpt" autoresize class="kpi-gauge-chart" />
                <div class="kpi-gauge-sub">{{ totalObs100.toLocaleString('pt-BR') }} de {{ totalObs.toLocaleString('pt-BR') }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Main row: table left, charts right -->
      <div class="row q-col-gutter-md items-start">

        <!-- Ranking table -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="obs-table-card">
            <q-card-section class="q-pa-sm q-pb-none">
              <div class="table-card-title">Comportamento dos Observadores</div>
            </q-card-section>
            <q-card-section class="q-pa-sm q-pt-xs">
              <div class="obs-table-wrap">
                <table class="obs-table">
                  <thead>
                    <tr>
                      <th>Observador</th>
                      <th>Função</th>
                      <th>Base</th>
                      <th>Obs</th>
                      <th>Obs 100%</th>
                      <th>Conformidade</th>
                      <th>Inconformidade</th>
                      <th>% Conf</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in tableDataSorted" :key="row.nome">
                      <td class="td-nome">{{ row.nome }}</td>
                      <td>{{ row.funcao }}</td>
                      <td>{{ row.base }}</td>
                      <td class="td-num">{{ row.obs }}</td>
                      <td class="td-num">{{ row.obs100 }}</td>
                      <td class="td-num">{{ row.conf.toLocaleString('pt-BR') }}</td>
                      <td class="td-num">{{ row.inc }}</td>
                      <td class="td-pct" :style="{ background: pctColor(rowPct(row)) }">
                        {{ rowPct(row).toFixed(2).replace('.', ',') }}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="3">Total</td>
                      <td class="td-num">{{ totalObs.toLocaleString('pt-BR') }}</td>
                      <td class="td-num">{{ totalObs100.toLocaleString('pt-BR') }}</td>
                      <td class="td-num">{{ totalConf.toLocaleString('pt-BR') }}</td>
                      <td class="td-num">{{ totalInc.toLocaleString('pt-BR') }}</td>
                      <td class="td-pct total-pct">
                        {{ globalPct.toFixed(2).replace('.', ',') }}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 4 charts grid -->
        <div class="col-12 col-md-5">
          <div class="row q-col-gutter-sm">

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Obs 100% por Função</div>
                  <v-chart :option="chartFuncao" autoresize style="height:190px" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Obs 100% por Gerência</div>
                  <v-chart :option="chartGerencia" autoresize style="height:190px" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card q-mt-sm">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Equipes Visitadas</div>
                  <v-chart :option="chartEquipes" autoresize style="height:190px" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card q-mt-sm">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Inconformidades por Categoria</div>
                  <v-chart :option="chartIncCat" autoresize style="height:190px" />
                </q-card-section>
              </q-card>
            </div>

          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, GaugeChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import VChart from "vue-echarts";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";

use([CanvasRenderer, BarChart, GaugeChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

const G = { green: "#16a34a", brand: "#8B1C2B" };

// ─── Filters ──────────────────────────────────────────────────────────────────
const showFilters = ref(false);

const anosOpts     = ["2024","2025","2026"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT"];
const tiposOpts     = ["Todos","Administrativo","Operacional"];
const mesesOpts     = ["Todos","jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const semanasOpts   = ["Todos","Semana 1","Semana 2","Semana 3","Semana 4"];
const funcoesOpts   = ["Todos","ENCARREGADO","SUPERVISOR","SESMT","FISCAL","COORDENADOR","GERENTE"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Leandro","Marcos","Paulo","Rafaela"];
const observadoresOpts = ref<string[]>(["Todos"]);
function filterObservador(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    observadoresOpts.value = ["Todos", ...conformidadePorObservador.value.map(o => o.nome)].filter(o => o.toLowerCase().includes(n));
  });
}

const filters = reactive({
  ano: "2026", base: "Todos", gerencia: "Todos", tipo: "Operacional",
  mes: "Todos", semana: "Todos", funcao: "Todos",
  gerente: "Todos", observador: "Todos",
});

// ─── Dados reais ─────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const {
  loading,
  load,
  submissions,
  responses,
  employees,
  conformidadePorObservador,
  totalSubmissions,
  totalConformes,
  totalNaoConformes,
  pctPerfeitas,
  byGerencia,
  byCategoria,
} = useChecklistData();

async function recarregar() {
  const mes = MONTH_MAP[filters.mes] ?? undefined;
  await load({ ano: Number(filters.ano), mes, base: filters.base !== "Todos" ? filters.base : undefined });
}

onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// ─── Table data ───────────────────────────────────────────────────────────────
type ObsRow = { nome: string; funcao: string; base: string; obs: number; obs100: number; conf: number; inc: number };

const rawRows = computed<ObsRow[]>(() =>
  conformidadePorObservador.value.map(o => {
    const emp = employees.value.find(e => e.matricula === o.matricula);
    const obsSubs = submissions.value.filter(s => s.matricula === o.matricula);
    const obs100 = obsSubs.filter(s =>
      !responses.value.some(r => r.submission_id === s.id && r.resposta === "nao_conforme")
    ).length;
    return {
      nome: o.nome,
      funcao: emp?.funcao ?? "—",
      base: emp?.base ?? "—",
      obs: o.totalObs,
      obs100,
      conf: o.conformes,
      inc: o.naoConformes,
    };
  })
);

const tableDataSorted = computed(() =>
  [...rawRows.value].sort((a, b) => rowPct(b) - rowPct(a))
);

function rowPct(row: ObsRow): number {
  const t = row.conf + row.inc;
  return t === 0 ? 100 : (row.conf / t) * 100;
}

function pctColor(pct: number): string {
  if (pct < 95)  return "#dc2626";
  if (pct < 97)  return "#ea580c";
  if (pct < 98)  return "#f59e0b";
  if (pct < 99)  return "#84cc16";
  return "#16a34a";
}

// ─── KPI totals ───────────────────────────────────────────────────────────────
const totalObs    = totalSubmissions;
const totalConf   = totalConformes;
const totalInc    = totalNaoConformes;
const totalObs100 = computed(() => rawRows.value.reduce((s, r) => s + r.obs100, 0));
const obsDesvio   = computed(() => totalObs.value - totalObs100.value);
const globalPct   = computed(() => {
  const t = totalConf.value + totalInc.value;
  return t === 0 ? 100 : (totalConf.value / t) * 100;
});
const pctObs100   = computed(() => Math.round((pctPerfeitas.value) * 100));

// ─── Gauge ────────────────────────────────────────────────────────────────────
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
      offsetCenter: [0, "72%"],
    },
    data: [{ value: pctObs100.value }],
  }],
}));

// ─── Donut palette ────────────────────────────────────────────────────────────
const donPalette = ["#6b1321","#8B1C2B","#c43d52","#e06070","#f3b8c0","#fde2e6"];

const ttItem = {
  trigger: "item" as const,
  backgroundColor: "rgba(255,255,255,.97)",
  borderColor: "#e2e8f0", borderWidth: 1,
  textStyle: { color: "#334155", fontSize: 11 },
  extraCssText: "box-shadow:0 4px 16px rgba(0,0,0,.1);border-radius:8px;padding:8px 12px;",
};

// ─── Obs 100% por Função ──────────────────────────────────────────────────────
const chartFuncao = computed(() => {
  const byFuncao: Record<string, number> = {};
  for (const r of rawRows.value) {
    byFuncao[r.funcao] = (byFuncao[r.funcao] ?? 0) + r.obs100;
  }
  const data = Object.entries(byFuncao)
    .filter(([k]) => k !== "—")
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  return {
    tooltip: { ...ttItem, formatter: "{b}: {c} ({d}%)" },
    legend: { show: false },
    color: donPalette,
    series: [{
      type: "pie" as const,
      radius: ["48%", "76%"],
      center: ["50%", "52%"],
      label: {
        fontSize: 9.5, fontWeight: "bold" as const,
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`,
      },
      labelLine: { length: 6, length2: 6 },
      data: data.length ? data : [{ name: "Sem dados", value: 1 }],
      itemStyle: { borderRadius: 3, borderColor: "#fff", borderWidth: 1 },
    }],
  };
});

// ─── Obs 100% por Gerência ────────────────────────────────────────────────────
const chartGerencia = computed(() => {
  const data = Object.entries(byGerencia.value)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  return {
    tooltip: { ...ttItem, formatter: "{b}: {c} ({d}%)" },
    legend: { show: false },
    color: donPalette,
    series: [{
      type: "pie" as const,
      radius: ["48%", "76%"],
      center: ["50%", "52%"],
      label: {
        fontSize: 9.5, fontWeight: "bold" as const,
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`,
      },
      labelLine: { length: 6, length2: 6 },
      data: data.length ? data : [{ name: "Sem dados", value: 1 }],
      itemStyle: { borderRadius: 3, borderColor: "#fff", borderWidth: 1 },
    }],
  };
});

// ─── Equipes Visitadas ────────────────────────────────────────────────────────
const chartEquipes = computed(() => {
  const equipeCounts: Record<string, number> = {};
  for (const s of submissions.value) {
    for (const m of (s.membros ?? [])) {
      const key = m.matricula ?? m.nome;
      equipeCounts[key] = (equipeCounts[key] ?? 0) + 1;
    }
  }
  const top = Object.entries(equipeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Visitas: <b style="color:${G.green}">${p.value}</b>`,
    },
    grid: { left: 6, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false },
    yAxis: {
      type: "category" as const, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: "#334155", fontSize: 9.5 },
      data: top.map(([nome]) => nome.length > 14 ? nome.slice(0, 13) + "…" : nome),
    },
    series: [{
      type: "bar" as const,
      data: top.map(([, v]) => v),
      barMaxWidth: 16,
      itemStyle: { color: G.green, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: "right" as const, fontSize: 10, fontWeight: "bold" as const, color: G.green },
    }],
  };
});

// ─── Inconformidades por Categoria ────────────────────────────────────────────
const chartIncCat = computed(() => {
  const cats = [...byCategoria.value]
    .sort((a, b) => b.total - b.conformes - (a.total - a.conformes))
    .slice(0, 6);
  return {
    tooltip: {
      ...ttItem,
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Inc: <b style="color:${G.brand}">${p.value}</b>`,
    },
    grid: { left: 6, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, show: false },
    yAxis: {
      type: "category" as const, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: "#334155", fontSize: 9.5 },
      data: cats.map(c => c.categoria.length > 14 ? c.categoria.slice(0, 13) + "…" : c.categoria),
    },
    series: [{
      type: "bar" as const,
      data: cats.map(c => c.total - c.conformes),
      barMaxWidth: 16,
      itemStyle: { color: G.brand, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: "right" as const, fontSize: 10, fontWeight: "bold" as const, color: G.brand },
    }],
  };
});

// suppress unused warning
void fmtN;
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.obs-page { background: #f8fafc; min-height: 100vh; }

// ── Filter bar ────────────────────────────────────────────────────────────────
.filter-bar {
  background: #fff; border-bottom: 1px solid $border;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 10px 20px 6px; position: sticky; top: 0; z-index: 100;
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
  font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600;
  }
}

// ── Select ────────────────────────────────────────────────────────────────────
.fgroup--sel { min-width: 140px; }
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

// ── Divider ───────────────────────────────────────────────────────────────────
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
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
  text-align: center; margin-bottom: 2px;
}
.kpi-gauge-wrap {
  flex: 1; display: flex; flex-direction: column; align-items: center; width: 100%;
}
.kpi-gauge-chart { width: 100%; height: 140px; }
.kpi-gauge-sub {
  font-size: 11px; font-weight: 600; color: #64748b; margin-top: -4px;
}

// ── Table ─────────────────────────────────────────────────────────────────────
.obs-table-card { border-radius: 12px; }
.table-card-title {
  font-size: 13px; font-weight: 700; color: $brand;
  text-transform: uppercase; letter-spacing: .6px; padding: 6px 8px 4px;
}
.obs-table-wrap {
  max-height: 520px; overflow-y: auto;
  border: 1px solid $border; border-radius: 8px;
}
.obs-table {
  width: 100%; border-collapse: collapse; font-size: 11.5px;

  thead th {
    background: $brand; color: #fff;
    padding: 7px 10px; font-size: 11px; font-weight: 700;
    text-align: center; white-space: nowrap;
    position: sticky; top: 0; z-index: 1;
    &:first-child { text-align: left; }
  }

  tbody tr {
    &:nth-child(even) { background: #f8fafc; }
    &:hover { background: rgba($brand,.04); }
  }
  td {
    padding: 5px 10px; border-bottom: 1px solid $border;
    text-align: center; white-space: nowrap;
  }
  .td-nome { text-align: left; font-weight: 600; color: #334155; }
  .td-num  { font-weight: 500; color: #475569; font-variant-numeric: tabular-nums; }
  .td-pct  {
    font-weight: 700; color: #fff; border-radius: 4px;
    padding: 3px 8px; font-size: 11px;
  }

  tfoot .total-row {
    background: #1e293b; color: #fff;
    td {
      padding: 7px 10px; border-bottom: none;
      font-weight: 700; font-size: 12px;
    }
    .td-num { color: #e2e8f0; }
    .total-pct { background: $brand; border-radius: 4px; }
  }
}

// ── Chart cards ───────────────────────────────────────────────────────────────
.chart-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.chart-card-title {
  font-size: 11px; font-weight: 700; color: $brand;
  text-transform: uppercase; letter-spacing: .5px;
  text-align: center; padding: 8px 4px 0;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .obs-page { background: #0f172a; }
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
  .obs-table-card { background: #1e293b; }
  .obs-table {
    tbody tr {
      &:nth-child(even) { background: #162032; }
      &:hover { background: rgba($brand,.08); }
      td { border-bottom-color: #334155; color: #cbd5e1; }
    }
    .td-nome { color: #e2e8f0; }
    .obs-table-wrap { border-color: #334155; }
  }
  .chart-card { background: #1e293b; }
  .chart-card-title { color: #fca5a5; }
}
</style>
