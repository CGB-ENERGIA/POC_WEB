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
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
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
      <transition name="chip-bar">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span v-if="filters.mes !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.mes = 'Todos'">{{ filters.mes }}</span>
          <span v-if="filters.semana !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.semana = 'Todos'">{{ filters.semana }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ filters.base }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.tipo !== 'Operacional'" class="filter-chip filter-chip--hit" @click="filters.tipo = 'Operacional'">{{ filters.tipo }}</span>
          <span v-if="filters.funcao !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.funcao = 'Todos'">{{ filters.funcao }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ filters.gerente }}</span>
          <span v-if="filters.observador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.observador = 'Todos'">{{ filters.observador }}</span>
          <span v-if="viz.prefixo" class="filter-chip filter-chip--hit" @click="viz.prefixo = null">{{ viz.prefixo }}</span>
          <span v-if="viz.categoria" class="filter-chip filter-chip--hit" @click="viz.categoria = null">{{ viz.categoria }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
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
              <div class="chart-caption">Clique na linha para filtrar o observador</div>
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
                    <tr
                      v-for="row in tableDataSorted" :key="row.nome"
                      :class="{ 'obs-row--on': filters.observador === row.nome }"
                      @click="toggleObservador(row.nome)"
                    >
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
                  <div class="chart-caption">Clique para filtrar</div>
                  <v-chart class="chart-hit" :option="chartFuncao" autoresize style="height:190px" @click="onFuncaoClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Obs 100% por Gerência</div>
                  <div class="chart-caption">Clique para filtrar</div>
                  <v-chart class="chart-hit" :option="chartGerencia" autoresize style="height:190px" @click="onGerenciaClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Equipes Visitadas</div>
                  <div class="chart-caption">Clique para filtrar o prefixo</div>
                  <v-chart class="chart-hit" :option="chartEquipes" autoresize style="height:190px" @click="onPrefixoClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Inconformidades por Categoria</div>
                  <div class="chart-caption">Clique para filtrar</div>
                  <v-chart class="chart-hit" :option="chartIncCat" autoresize style="height:190px" @click="onCategoriaClick" />
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
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, semanaDoMes, indexEmployees, matchSubmissionToEmployee } from "@/lib/dashboard";

use([CanvasRenderer, BarChart, GaugeChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

const G = { green: "#16a34a", brand: "#8B1C2B" };

// ─── Filters ──────────────────────────────────────────────────────────────────
const showFilters = ref(false);

const anosOpts     = ["2024","2025","2026"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT"];
const tiposOpts     = ["Todos","Administrativo","Operacional"];
const TIPO_AUDITAGEM: Record<string, string[]> = {
  Administrativo: ["ADMINISTRATIVO", "LOGISTICA", "OFICINA", "ADM"],
  Operacional: ["GOMAN", "GSTC"],
};
const mesesOpts     = ["Todos","jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const semanasOpts   = ["Todos","Semana 1","Semana 2","Semana 3","Semana 4"];
const funcoesOpts   = ["Todos","ENCARREGADO","SUPERVISOR","SESMT","FISCAL","COORDENADOR","GERENTE"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Leandro","Marcos","Paulo","Rafaela"];

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
} = useChecklistData();

const viz = reactive({
  prefixo: null as string | null,
  categoria: null as string | null,
});

type EcClick = { componentType?: string; dataIndex?: number; name?: string };

function toggleObservador(nome: string) {
  filters.observador = filters.observador === nome ? "Todos" : nome;
}

function onFuncaoClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name || p.name === "Sem dados") return;
  filters.funcao = filters.funcao === p.name ? "Todos" : p.name;
}

function onGerenciaClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name || p.name === "Sem dados") return;
  filters.gerencia = filters.gerencia === p.name ? "Todos" : p.name;
}

function onPrefixoClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name?.trim()) return;
  viz.prefixo = viz.prefixo === p.name ? null : p.name;
}

function onCategoriaClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name?.trim()) return;
  viz.categoria = viz.categoria === p.name ? null : p.name;
}

function resetSlice() {
  filters.gerencia = "Todos";
  filters.tipo = "Operacional";
  filters.semana = "Todos";
  filters.funcao = "Todos";
  filters.gerente = "Todos";
  filters.observador = "Todos";
  viz.prefixo = null;
  viz.categoria = null;
}

const hasActiveFilters = computed(() =>
  filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.tipo !== "Operacional"
  || filters.mes !== "Todos"
  || filters.semana !== "Todos"
  || filters.funcao !== "Todos"
  || filters.gerente !== "Todos"
  || filters.observador !== "Todos"
  || !!viz.prefixo
  || !!viz.categoria,
);

function matchTipoPoc(auditagem: string | undefined) {
  if (filters.tipo === "Todos") return true;
  const allowed = TIPO_AUDITAGEM[filters.tipo];
  if (!allowed) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function applySlice(
  source: typeof submissions.value,
  omit: { gerencia?: boolean; tipo?: boolean; funcao?: boolean; observador?: boolean; week?: boolean; prefixo?: boolean } = {},
) {
  const idx = indexEmployees(employees.value);
  let s = filterByGerente(source, employees.value, filters.gerente);
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.tipo) s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  if (!omit.week && filters.semana !== "Todos") {
    const semNum = Number(filters.semana.replace(/\D/g, "")) || 0;
    if (semNum) s = s.filter((sub) => semanaDoMes(new Date(sub.data).getDate()) === semNum);
  }
  if (!omit.funcao && filters.funcao !== "Todos") {
    s = s.filter((sub) => matchSubmissionToEmployee(sub, idx)?.funcao === filters.funcao);
  }
  if (!omit.observador && filters.observador !== "Todos") {
    s = s.filter((sub) => sub.observador === filters.observador);
  }
  if (!omit.prefixo && viz.prefixo) {
    s = s.filter((sub) => (sub.equipe ?? "Sem equipe") === viz.prefixo);
  }
  return s;
}

function respsOf(subs: typeof submissions.value, omitCat = false) {
  const ids = new Set(subs.map((s) => s.id));
  let r = responses.value.filter((resp) => ids.has(resp.submission_id));
  if (!omitCat && viz.categoria) {
    r = r.filter((resp) => (resp.categoria ?? "Sem categoria") === viz.categoria);
  }
  return r;
}

const filteredSubs = computed(() => applySlice(submissions.value));
const filteredResps = computed(() => respsOf(filteredSubs.value));
const subsNoFuncao = computed(() => applySlice(submissions.value, { funcao: true }));
const subsNoGerencia = computed(() => applySlice(submissions.value, { gerencia: true }));
const subsNoPrefixo = computed(() => applySlice(submissions.value, { prefixo: true }));
const respsNoCat = computed(() => respsOf(filteredSubs.value, true));

const observadoresOpts = ref<string[]>(["Todos"]);
watch(
  () => submissions.value,
  () => {
    const names = [...new Set(submissions.value.map((s) => s.observador).filter(Boolean))].sort();
    observadoresOpts.value = ["Todos", ...names];
  },
  { immediate: true, deep: true },
);
function filterObservador(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    const names = [...new Set(submissions.value.map((s) => s.observador).filter(Boolean))].sort();
    observadoresOpts.value = ["Todos", ...names.filter((o) => o.toLowerCase().includes(n))];
  });
}

async function recarregar() {
  const mes = MONTH_MAP[filters.mes] ?? undefined;
  await load({
    ano: Number(filters.ano),
    mes,
    base: filters.base !== "Todos" ? filters.base : undefined,
  });
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes, filters.base], recarregar);

// ─── Table data ───────────────────────────────────────────────────────────────
type ObsRow = { nome: string; funcao: string; base: string; obs: number; obs100: number; conf: number; inc: number };

const rawRows = computed<ObsRow[]>(() => {
  const idx = indexEmployees(employees.value);
  const tableSubs = applySlice(submissions.value, { observador: true });
  const tableResps = respsOf(tableSubs);
  const ncIds = new Set(
    tableResps.filter((r) => r.resposta === "nao_conforme").map((r) => r.submission_id),
  );
  const byMat: Record<string, ObsRow> = {};
  for (const s of tableSubs) {
    const emp = matchSubmissionToEmployee(s, idx);
    if (!byMat[s.matricula]) {
      byMat[s.matricula] = {
        nome: s.observador,
        funcao: emp?.funcao ?? "—",
        base: emp?.base ?? s.base ?? "—",
        obs: 0,
        obs100: 0,
        conf: 0,
        inc: 0,
      };
    }
    byMat[s.matricula].obs++;
    if (!ncIds.has(s.id)) byMat[s.matricula].obs100++;
  }
  for (const r of tableResps) {
    const sub = tableSubs.find((s) => s.id === r.submission_id);
    if (!sub || !byMat[sub.matricula]) continue;
    if (r.resposta === "conforme") byMat[sub.matricula].conf++;
    else if (r.resposta === "nao_conforme") byMat[sub.matricula].inc++;
  }
  return Object.values(byMat);
});

const tableDataSorted = computed(() =>
  [...rawRows.value].sort((a, b) => rowPct(b) - rowPct(a)),
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
const ncSubIds = computed(() =>
  new Set(filteredResps.value.filter((r) => r.resposta === "nao_conforme").map((r) => r.submission_id)),
);
const totalObs    = computed(() => filteredSubs.value.length);
const totalConf   = computed(() => filteredResps.value.filter((r) => r.resposta === "conforme").length);
const totalInc    = computed(() => filteredResps.value.filter((r) => r.resposta === "nao_conforme").length);
const totalObs100 = computed(() => filteredSubs.value.filter((s) => !ncSubIds.value.has(s.id)).length);
const obsDesvio   = computed(() => totalObs.value - totalObs100.value);
const globalPct   = computed(() => {
  const t = totalConf.value + totalInc.value;
  return t === 0 ? 100 : (totalConf.value / t) * 100;
});
const pctObs100   = computed(() => totalObs.value ? Math.round((totalObs100.value / totalObs.value) * 100) : 0);

// ─── Gauge ────────────────────────────────────────────────────────────────────
const gaugeOpt = computed(() => ({
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
      valueAnimation: true,
      fontSize: 26,
      fontWeight: "bold" as const,
      formatter: "{value}%",
      color: G.brand,
      offsetCenter: [0, "8%"],
    },
    data: [{ value: pctObs100.value }],
  }],
}));

// ─── Donut palette ────────────────────────────────────────────────────────────
const donPalette = ["#6b1321","#8B1C2B","#c43d52","#e06070","#f3b8c0","#fde2e6"];

function tooltipSkin(trigger: "item" | "axis" = "item") {
  const bg = chartInk.tipBg;
  const fg = chartInk.tipText;
  const bd = chartInk.tipBorder;
  return {
    trigger,
    appendTo: () => document.body,
    confine: true,
    enterable: false,
    transitionDuration: 0,
    backgroundColor: bg,
    borderColor: bd,
    borderWidth: 1,
    padding: [10, 12] as [number, number],
    textStyle: { color: fg, fontSize: 11, fontWeight: 500 as const },
    extraCssText:
      `background:${bg} !important;color:${fg} !important;border:1px solid ${bd};`
      + "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.55);opacity:1;",
  };
}

function pieData(entries: { name: string; value: number }[], selected: string | null) {
  return entries.map((e) => ({
    ...e,
    itemStyle: { opacity: !selected || selected === e.name ? 1 : 0.22 },
  }));
}

const chartFuncao = computed(() => {
  const idx = indexEmployees(employees.value);
  const ncIds = new Set(
    respsOf(subsNoFuncao.value).filter((r) => r.resposta === "nao_conforme").map((r) => r.submission_id),
  );
  const byFuncao: Record<string, number> = {};
  for (const s of subsNoFuncao.value) {
    if (ncIds.has(s.id)) continue;
    const fn = matchSubmissionToEmployee(s, idx)?.funcao ?? "—";
    if (fn === "—") continue;
    byFuncao[fn] = (byFuncao[fn] ?? 0) + 1;
  }
  const data = Object.entries(byFuncao)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const selected = filters.funcao !== "Todos" ? filters.funcao : null;
  return {
    tooltip: { ...tooltipSkin(), formatter: "{b}: {c} ({d}%)" },
    legend: { show: false },
    color: donPalette,
    series: [{
      type: "pie" as const,
      cursor: "pointer",
      radius: ["48%", "76%"],
      center: ["50%", "52%"],
      label: {
        fontSize: 9.5, fontWeight: "bold" as const, color: chartInk.axis,
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`,
      },
      labelLine: { length: 6, length2: 6 },
      data: pieData(data.length ? data : [{ name: "Sem dados", value: 1 }], selected),
      itemStyle: { borderRadius: 3, borderColor: chartInk.halo, borderWidth: 1 },
    }],
  };
});

const chartGerencia = computed(() => {
  const idx = indexEmployees(employees.value);
  const ncIds = new Set(
    respsOf(subsNoGerencia.value).filter((r) => r.resposta === "nao_conforme").map((r) => r.submission_id),
  );
  const map: Record<string, number> = {};
  for (const s of subsNoGerencia.value) {
    if (ncIds.has(s.id)) continue;
    const g = matchSubmissionToEmployee(s, idx)?.gerencia ?? s.auditagem ?? "—";
    map[g] = (map[g] ?? 0) + 1;
  }
  const data = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const selected = filters.gerencia !== "Todos" ? filters.gerencia : null;
  return {
    tooltip: { ...tooltipSkin(), formatter: "{b}: {c} ({d}%)" },
    legend: { show: false },
    color: donPalette,
    series: [{
      type: "pie" as const,
      cursor: "pointer",
      radius: ["48%", "76%"],
      center: ["50%", "52%"],
      label: {
        fontSize: 9.5, fontWeight: "bold" as const, color: chartInk.axis,
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`,
      },
      labelLine: { length: 6, length2: 6 },
      data: pieData(data.length ? data : [{ name: "Sem dados", value: 1 }], selected),
      itemStyle: { borderRadius: 3, borderColor: chartInk.halo, borderWidth: 1 },
    }],
  };
});

const chartEquipes = computed(() => {
  const counts: Record<string, number> = {};
  for (const s of subsNoPrefixo.value) {
    const key = s.equipe || "Sem equipe";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 9);
  const selected = viz.prefixo;
  return {
    tooltip: {
      ...tooltipSkin(),
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Visitas: <b style="color:${G.green}">${p.value}</b><div style="font-size:10px;margin-top:6px;opacity:.8">Clique para filtrar</div>`,
    },
    grid: { left: 6, right: 32, top: 6, bottom: 6, containLabel: true },
    xAxis: { type: "value" as const, show: false, max: Math.max(...top.map(([, v]) => v), 1) * 1.3 },
    yAxis: {
      type: "category" as const, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 9.5, width: 88, overflow: "truncate" as const },
      data: top.map(([nome]) => nome),
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: top.map(([nome, v]) => ({
        name: nome,
        value: v,
        itemStyle: { color: G.green, opacity: !selected || selected === nome ? 1 : 0.22, borderRadius: [0, 4, 4, 0] },
      })),
      barMaxWidth: 16,
      label: { show: true, position: "right" as const, fontSize: 10, fontWeight: "bold" as const, color: G.green },
    }],
  };
});

const chartIncCat = computed(() => {
  const map: Record<string, number> = {};
  for (const r of respsNoCat.value) {
    if (r.resposta !== "nao_conforme") continue;
    const cat = r.categoria ?? "Sem categoria";
    map[cat] = (map[cat] ?? 0) + 1;
  }
  const cats = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const selected = viz.categoria;
  return {
    tooltip: {
      ...tooltipSkin(),
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>Inc: <b style="color:${G.brand}">${p.value}</b><div style="font-size:10px;margin-top:6px;opacity:.8">Clique para filtrar</div>`,
    },
    grid: { left: 6, right: 32, top: 6, bottom: 6, containLabel: true },
    xAxis: { type: "value" as const, show: false, max: Math.max(...cats.map(([, v]) => v), 1) * 1.3 },
    yAxis: {
      type: "category" as const, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 9.5, width: 88, overflow: "truncate" as const },
      data: cats.map(([c]) => c),
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: cats.map(([cat, v]) => ({
        name: cat,
        value: v,
        itemStyle: { color: G.brand, opacity: !selected || selected === cat ? 1 : 0.22, borderRadius: [0, 4, 4, 0] },
      })),
      barMaxWidth: 16,
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
.filter-summary {
  display: flex; align-items: center; gap: 6px; padding-top: 6px; flex-wrap: wrap;
}
.filter-summary__label { font-size: 11px; color: $label-color; font-weight: 600; }
.filter-chip {
  display: inline-flex; align-items: center; height: 22px; padding: 0 10px;
  background: rgba($brand, .1); color: $brand; border-radius: 999px;
  font-size: 11px; font-weight: 600; max-width: 240px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  &--hit { cursor: pointer; }
  &--hit:hover { filter: brightness(0.92); }
}
.filter-clear {
  display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 10px;
  background: none; border: 1px solid $border; border-radius: 999px;
  font-size: 11px; color: $label-color; cursor: pointer;
  &:hover { color: $brand; border-color: $brand; }
}
.chart-hit { cursor: pointer; }
.chart-caption { font-size: 10px; color: $label-color; text-align: center; margin: 0 0 2px; }

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
.kpi-gauge-chart { width: 100%; height: 148px; }
.kpi-gauge-sub {
  font-size: 11px; font-weight: 600; color: #64748b; margin-top: 0;
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
    cursor: pointer;
    &:nth-child(even) { background: #f8fafc; }
    &:hover { background: rgba($brand,.04); }
    &.obs-row--on td { background: rgba($brand,.12); }
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
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .chart-caption { color: #64748b; }
  .obs-table tbody tr.obs-row--on td { background: rgba($brand,.28); }
}
.chip-bar-enter-active { transition: opacity .22s cubic-bezier(0.16, 1, 0.3, 1), transform .22s cubic-bezier(0.16, 1, 0.3, 1); }
.chip-bar-leave-active { transition: opacity .16s ease, transform .16s ease; }
.chip-bar-enter-from { opacity: 0; transform: translateY(-6px); }
.chip-bar-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
