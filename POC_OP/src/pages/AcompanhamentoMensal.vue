<template>
  <q-page class="acomp-mensal">

    <!-- ══════════════════════════════════════════════════════
         FILTER BAR
    ══════════════════════════════════════════════════════ -->
    <div class="filter-bar">
      <div class="filter-fab-wrap">
        <button
          class="filter-fab"
          :class="{ 'filter-fab--active': showFilters }"
          @click="showFilters = !showFilters">
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
          <span class="filter-fab__label">{{ showFilters ? 'Ocultar filtros' : 'Filtros' }}</span>
        </button>
      </div>
      <div class="filter-collapsible" :class="{ 'is-hidden': !showFilters }">
      <div class="filter-bar__inner">

        <!-- Row 1: Mês · Semana · Gerente -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button
                v-for="m in meses" :key="m.value"
                :class="['pill', { 'pill--active': marcado(filters.mes, String(m.value)) }]"
                :title="marcado(filters.mes, String(m.value)) ? 'Ctrl+clique para tirar este mês' : 'Ctrl+clique para somar este mês'"
                @click="filters.mes = alternarMinimo(filters.mes, String(m.value), $event)"
              >{{ m.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Semana</span>
            <div class="pill-group">
              <button
                v-for="s in semanas" :key="s.value"
                :class="['pill', { 'pill--active': s.value ? marcado(filters.semana, String(s.value)) : !ativo(filters.semana) }]"
                @click="filters.semana = s.value ? alternar(filters.semana, String(s.value), $event) : 'Todos'"
              >{{ s.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select
              multiple :model-value="valores(filters.gerente)" @update:model-value="(v: string[]) => filters.gerente = juntar(v)" :display-value="rotulo(filters.gerente)"
              :clearable="filters.gerente !== 'Todos'"
              @clear="filters.gerente = 'Todos'"
              :options="semTodos(gerentes)"
              dense outlined hide-bottom-space
              class="gerente-select"
              popup-content-class="gerente-popup"
            >
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Coordenador</span>
            <q-select
              multiple :model-value="valores(filters.coordenador)" @update:model-value="(v: string[]) => filters.coordenador = juntar(v)" :display-value="rotulo(filters.coordenador)"
              :clearable="filters.coordenador !== 'Todos'"
              @clear="filters.coordenador = 'Todos'"
              :options="semTodos(coordenadores)"
              dense outlined hide-bottom-space
              class="gerente-select"
              popup-content-class="gerente-popup"
            >
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>

        </div>

        <!-- Row 2: Ano · Base · Função · Gerência -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button
                v-for="a in anos" :key="a"
                :class="['pill', { 'pill--active': filters.ano === a }]"
                @click="filters.ano = a"
              >{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button
                v-for="b in bases" :key="b"
                :class="['pill', { 'pill--active': marcado(filters.base, b) }]"
                @click="filters.base = alternar(filters.base, b)"
              >{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--funcao">
            <span class="fgroup__label">Função</span>
            <q-select
              multiple :model-value="valores(filters.funcao)" @update:model-value="(v: string[]) => filters.funcao = juntar(v)" :display-value="rotulo(filters.funcao)"
              :clearable="filters.funcao !== 'Todos'"
              @clear="filters.funcao = 'Todos'"
              :options="semTodos(funcoes)"
              dense outlined hide-bottom-space
              class="funcao-select"
              popup-content-class="gerente-popup"
            ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button
                v-for="g in gerencias" :key="g"
                :class="['pill', { 'pill--active': marcado(filters.gerencia, g) }]"
                @click="filters.gerencia = alternar(filters.gerencia, g)"
              >{{ g }}</button>
            </div>
          </div>

        </div>
      </div>
      </div>
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ mesLabel }}</span>
          <span v-if="ativo(filters.semana)" class="filter-chip filter-chip--hit" @click="filters.semana = 'Todos'">{{ semanaLabel }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ valores(filters.base).map(nomeBase).join(", ") }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ rotulo(filters.gerencia) }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ rotulo(filters.gerente) }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.coordenador = 'Todos'">{{ rotulo(filters.coordenador) }}</span>
          <span v-if="filters.funcao !== 'Todos'" class="filter-chip">{{ rotulo(filters.funcao) }}</span>
          <span v-if="viz.observadorNome" class="filter-chip filter-chip--hit" @click="clearObs">{{ viz.observadorNome }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- ══════════════════════════════════════════════════════
         KPI + CHARTS
    ══════════════════════════════════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="kpi-sticky">
      <div class="row q-col-gutter-sm q-mb-none">
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
      </div>

      <!-- Charts Row 1 -->
      <div class="row q-col-gutter-md q-mb-md">

        <!-- Obs x Meta (Mês) -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações x Meta</div>
              <div class="text-caption text-grey-6">Mês atual</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartMetaMes" autoresize style="height:260px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Semana -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Obs. Realizadas por Semana</div>
              <div class="text-caption text-grey-6">Clique na semana · clique de novo para ver o mês todo</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartMetaSemana" autoresize style="height:260px" @click="onWeekClick" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Base -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Nº de Observações por Base</div>
              <div class="text-caption text-grey-6">Clique numa base para ver só ela</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartBase" autoresize style="height:260px" @click="onBaseClick" />
            </q-card-section>
          </q-card>
        </div>

      </div>

      <!-- Charts Row 2 -->
      <div class="row q-col-gutter-md">

        <!-- Obs por Gerência -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Nº de Obs. por Gerência</div>
              <div class="text-caption text-grey-6">Clique numa gerência para filtrar</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartGerencia" autoresize style="height:260px" @click="onGerenciaClick" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Obs por Observador -->
        <div :class="verTodosObs ? 'col-12' : 'col-12 col-md-6'">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none row items-start no-wrap">
              <div class="col">
                <div class="text-subtitle1 text-weight-bold">Observações Realizadas no Mês</div>
                <div class="text-caption text-grey-6">Clique numa vela para filtrar o observador · arraste para ver a lista</div>
              </div>
              <q-btn-toggle
                v-model="ordemObs"
                dense no-caps flat clearable
                toggle-color="primary"
                toggle-text-color="white"
                size="sm"
                class="q-mr-xs"
                :options="[
                  { label: 'Maior → menor', value: 'desc', icon: 'mdi-sort-descending' },
                  { label: 'Menor → maior', value: 'asc', icon: 'mdi-sort-ascending' },
                ]"
              />
              <q-btn
                flat round dense
                :icon="verTodosObs ? 'mdi-magnify-minus-outline' : 'mdi-magnify-plus-outline'"
                :color="verTodosObs ? 'primary' : 'grey-7'"
                @click="verTodosObs = !verTodosObs"
              >
                <q-tooltip>{{ verTodosObs ? 'Voltar à visão com rolagem' : `Mostrar todos os ${observerRows.length} observadores de uma vez` }}</q-tooltip>
              </q-btn>
            </q-card-section>
            <q-card-section>
              <div ref="obsWrap">
                <v-chart
                  :key="`obs-${verTodosObs}-${linhasObs}-${ordemObs}`"
                  class="chart-hit"
                  :option="chartObservador"
                  autoresize
                  :style="{ height: `${alturaObs}px` }"
                  @click="onObsClick"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Ranking -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Ranking de Observadores</div>
              <div class="text-caption text-grey-6">Clique no nome para filtrar</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="chartRanking" autoresize style="height:260px" @click="onRankingClick" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { valores, juntar, marcado, alternar, alternarMinimo, rotulo, semTodos, casa, igualCI, ativo, eventoDe } from "@/lib/multi-filtro";
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { persistirFiltros } from "@/lib/filtros-persistentes";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, ScatterChart, CustomChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";
import { faixaDaSemana } from "@/lib/semanas";
import { filterByGerencia, filterByGerente, semanaDaSub, filterObserverRoster, uniqueChartLabels, tallyObserverRecords, normMatricula, indexEmployees, matchSubmissionToEmployee, filterByCoordenador } from "@/lib/dashboard";
import { useGoals } from "@/composables/useGoals";
const { goalForColaborador } = useGoals();

use([
  CanvasRenderer, BarChart, LineChart, ScatterChart, CustomChart,
  GridComponent, TooltipComponent, LegendComponent,
  MarkLineComponent, DataZoomComponent
]);

// ─── Paleta verde (Realizado) + cinza (Meta) ──────────────────────────────────
const G = {
  real:   "#16a34a",
  light:  "#22c55e",
  meta:   "#94a3b8",
  metaTx: "#64748b",
  red:    "#ef4444",
};

// ─── Filter options ───────────────────────────────────────────────────────────
const showFilters = ref(false);

const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];

const semanas = [
  { value: 0, label: "Todas" },
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda"  },
  { value: 3, label: "3. Terceira" },
  { value: 4, label: "4. Quarta"   },
];

const anos = [2024, 2025, 2026];

const bases = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];

const funcoes = ["Todos", "Analista", "Coordenador", "Especialista", "Técnico"];

const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];


// ─── Filter state ─────────────────────────────────────────────────────────────
const now = new Date();
const filters = reactive({
  mes:      String(now.getMonth() + 1),
  semana:   "Todos",
  ano:      now.getFullYear(),
  base:     "Todos",
  funcao:   "Todos",
  gerencia: "Todos",
  gerente:  "Todos", coordenador: "Todos",
});
persistirFiltros("acomp-mensal", filters);

// ─── Dados reais ──────────────────────────────────────────────────────────────
const {
  loading,
  load,
  submissions,
  responses,
  employees,
  gerentesOpts: gerentes,
  coordenadoresOpts: coordenadores,
} = useChecklistData();

/** Meses e semanas escolhidos (um ou vários; semana vazia = o mês todo). */
const mesesNum = computed(() => {
  const n = valores(filters.mes).map(Number).filter(Boolean).sort((a, b) => a - b);
  return n.length ? n : [now.getMonth() + 1];
});
const semanasNum = computed(() => valores(filters.semana).map(Number).filter((n) => n >= 1 && n <= 4).sort((a, b) => a - b));

async function recarregar() {
  clearObs();
  const nums = mesesNum.value;
  await load(nums.length === 1
    ? { ano: filters.ano, mes: nums[0]!, contarMeta: true }
    : { ano: filters.ano, meses: nums, contarMeta: true });
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);

const viz = reactive({
  matricula: null as string | null,
  observadorNome: null as string | null,
});
persistirFiltros("acomp-mensal-viz", viz);

const BASE_NOME: Record<string, string> = {
  BCB: "Bacabal",
  BDC: "Barra do Corda",
  ITM: "Imperatriz",
  PDS: "Pedreiras",
  PDT: "Presidente Dutra",
  STI: "Santa Inês",
};

function nomeBase(code: string) {
  return BASE_NOME[code] ? `${BASE_NOME[code]} (${code})` : code;
}

function clearObs() {
  viz.matricula = null;
  viz.observadorNome = null;
}

function resetSlice() {
  filters.semana = "Todos";
  filters.base = "Todos";
  filters.funcao = "Todos";
  filters.gerencia = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  clearObs();
}

type EcClick = {
  componentType?: string;
  dataIndex?: number;
  seriesIndex?: number;
  name?: string;
  event?: { event?: unknown };
};

function onWeekClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  let n = 0;
  const fromName = p.name?.match(/(\d)/);
  if (fromName) n = Number(fromName[1]);
  else if (typeof p.dataIndex === "number") n = p.dataIndex + 1;
  if (n < 1 || n > 4) return;
  filters.semana = alternar(filters.semana, String(n), eventoDe(p));
}

function onBaseClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.base = alternar(filters.base, p.name, eventoDe(p));
}

function onGerenciaClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.gerencia = alternar(filters.gerencia, p.name, eventoDe(p));
}

function onObsClick(p: EcClick) {
  if (p.componentType !== "series") return;
  // Na lupa com várias linhas, cada linha tem suas séries (2 por linha): converte para o índice global
  const idxGlobal = (p.dataIndex ?? -1) + Math.floor((p.seriesIndex ?? 0) / 2) * porLinhaObs.value;
  const row = observerRowsOrd.value[idxGlobal];
  if (!row) return;
  if (viz.matricula === row.matricula) {
    clearObs();
    return;
  }
  viz.matricula = row.matricula;
  viz.observadorNome = row.short;
}

function onRankingClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = rankingRows.value[p.dataIndex ?? -1];
  if (!row) return;
  if (viz.matricula === row.matricula) {
    clearObs();
    return;
  }
  viz.matricula = row.matricula;
  viz.observadorNome = row.nome.split(" ")[0] || row.nome;
}

const semanaLabel = computed(() => valores(filters.semana).map((v) => semanas.find((s) => String(s.value) === v)?.label ?? v).join(", "));
const hasActiveFilters = computed(() =>
  ativo(filters.semana)
  || filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.funcao !== "Todos"
  || !!viz.matricula,
);

const barraGerente = computed(() =>
  filterByCoordenador(
    filterByGerente(submissions.value, employees.value, filters.gerente),
    employees.value,
    filters.coordenador,
  ),
);

function applySlice(
  source: typeof submissions.value,
  omit: { week?: boolean; base?: boolean; gerencia?: boolean; funcao?: boolean; mat?: boolean } = {},
) {
  let s = source;
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.week && ativo(filters.semana)) {
    s = s.filter((sub) => casa(filters.semana, String(semanaDaSub(sub))));
  }
  if (!omit.base && ativo(filters.base)) {
    s = s.filter((sub) => casa(filters.base, sub.base));
  }
  if (!omit.funcao && ativo(filters.funcao)) {
    const idx = indexEmployees(employees.value);
    s = s.filter((sub) => casa(filters.funcao, matchSubmissionToEmployee(sub, idx)?.funcao));
  }
  if (!omit.mat && viz.matricula) {
    const idx = indexEmployees(employees.value);
    const want = viz.matricula;
    s = s.filter((sub) => {
      const emp = matchSubmissionToEmployee(sub, idx);
      return normMatricula(emp?.matricula ?? sub.matricula) === want;
    });
  }
  return s;
}

const filteredSubs = computed(() => applySlice(barraGerente.value));
const subsNoObs = computed(() => applySlice(barraGerente.value, { mat: true }));
const subsNoBase = computed(() => applySlice(barraGerente.value, { base: true }));
const subsNoWeek = computed(() => applySlice(barraGerente.value, { week: true }));
const subsNoGerencia = computed(() => applySlice(barraGerente.value, { gerencia: true }));

const totalSubmissions = computed(() => filteredSubs.value.length);
const basesCovertas = computed(() => new Set(filteredSubs.value.map(s => s.base)).size);

const byBase = computed(() => {
  const m: Record<string, number> = {};
  for (const s of subsNoBase.value) m[s.base] = (m[s.base] ?? 0) + 1;
  return m;
});

const bySemana = computed(() => {
  const m: Record<number, number> = {};
  for (const s of subsNoWeek.value) {
    const sem = semanaDaSub(s);
    m[sem] = (m[sem] ?? 0) + 1;
  }
  return m;
});

/** Primeiro dia do período em análise (a semana escolhida ou o mês): quem saiu antes dele não entra na lista. */
const inicioPeriodo = computed(() => {
  const mes = mesesNum.value[0]!;
  const primeiraSemana = semanasNum.value[0];
  const dia = primeiraSemana ? faixaDaSemana(filters.ano, mes, primeiraSemana).ini : 1;
  return `${filters.ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
});

const observerRoster = computed(() =>
  filterObserverRoster(employees.value, {
    gerencia: filters.gerencia,
    gerente: filters.gerente,
    coordenador: filters.coordenador,
    funcao: filters.funcao,
    periodoInicio: inicioPeriodo.value,
  }),
);

const observerRows = computed(() => {
  let roster = observerRoster.value;
  const idx = indexEmployees(employees.value);
  const slice = subsNoObs.value;
  if (ativo(filters.base)) {
    roster = roster.filter((e) => casa(filters.base, e.base));
  }
  const { counts, extras } = tallyObserverRecords(roster, employees.value, slice);
  const list = extras.length ? [...roster, ...extras] : roster;
  const shorts = uniqueChartLabels(
    list.map((e) => e.nome || e.nome_completo.split(/\s+/)[0] || e.matricula),
  );
  return list.map((emp, i) => {
    // Meta do período: soma dos meses escolhidos; com semanas escolhidas, soma das metas dessas semanas em cada mês
    let meta = 0;
    for (const mes of mesesNum.value) {
      if (semanasNum.value.length) {
        for (const w of semanasNum.value) meta += goalForColaborador(emp.matricula, emp.gerencia, filters.ano, mes, w, emp.funcao, emp.desligado_em).semanal;
      } else {
        meta += goalForColaborador(emp.matricula, emp.gerencia, filters.ano, mes, undefined, emp.funcao, emp.desligado_em).mensal;
      }
    }
    const key = normMatricula(emp.matricula);
    return {
      matricula: key,
      nome: emp.nome_completo || emp.nome,
      short: shorts[i]!,
      realizado: counts.get(key) ?? 0,
      meta,
      funcao: emp.funcao || "—",
    };
    // Quem está com meta 0 (atestado, férias…) e não observou nada não entra na lista.
  }).filter((r) => r.meta > 0 || r.realizado > 0);
});

// Ordenação do gráfico "Observações Realizadas no Mês" (null = ordem do cadastro)
const ordemObs = ref<"desc" | "asc" | null>("desc");
const observerRowsOrd = computed(() => {
  const rows = observerRows.value;
  if (!ordemObs.value) return rows;
  const dir = ordemObs.value === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => dir * (a.realizado - b.realizado) || a.nome.localeCompare(b.nome, "pt-BR"));
});

const byGerencia = computed(() => {
  const m: Record<string, number> = {};
  const idx = indexEmployees(employees.value);
  for (const s of subsNoGerencia.value) {
    const emp = matchSubmissionToEmployee(s, idx);
    const g = emp?.gerencia ?? s.auditagem;
    m[g] = (m[g] ?? 0) + 1;
  }
  return m;
});

const conformidadePorObservador = computed(() => {
  const idx = indexEmployees(employees.value);
  const filteredIds = new Set(filteredSubs.value.map(s => s.id));
  const filteredResps = responses.value.filter(r => filteredIds.has(r.submission_id));
  const map: Record<string, { nome: string; total: number; conformes: number; totalObs: number }> = {};
  const keyPorSub = new Map<string, string>();
  for (const s of filteredSubs.value) {
    const emp = matchSubmissionToEmployee(s, idx);
    const key = normMatricula(emp?.matricula ?? s.matricula);
    keyPorSub.set(s.id, key);
    if (!map[key]) map[key] = { nome: emp?.nome_completo || emp?.nome || s.observador, total: 0, conformes: 0, totalObs: 0 };
    map[key].totalObs++;
  }
  for (const r of filteredResps) {
    const key = keyPorSub.get(r.submission_id);
    if (key === undefined) continue;
    map[key]!.total++;
    if (r.resposta === "conforme") map[key]!.conformes++;
  }
  return Object.entries(map)
    .map(([matricula, d]) => ({
      matricula,
      nome: d.nome,
      totalObs: d.totalObs,
      total: d.total,
      conformes: d.conformes,
    }))
    .sort((a, b) => b.totalObs - a.totalObs);
});

const mesLabel = computed(() => mesesNum.value.map((n) => meses.find((m) => m.value === n)?.label ?? String(n)).join(", "));

const scopedObservers = computed(() =>
  viz.matricula
    ? observerRows.value.filter((x) => x.matricula === viz.matricula)
    : observerRows.value,
);

const metaMensal = computed(() =>
  scopedObservers.value.reduce((total, r) => total + r.meta, 0)
);

// Atingimento = Total Realizado ÷ Meta do Mês (pode passar de 100% quando ultrapassa a meta).
const atingimento = computed(() => {
  if (metaMensal.value === 0) return "—";
  return `${Math.round((totalSubmissions.value / metaMensal.value) * 100)}%`;
});

const rankingRows = computed(() =>
  [...conformidadePorObservador.value.slice(0, 11)].reverse(),
);

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: "Total Realizado",  value: loading.value ? "…" : fmtN(totalSubmissions.value), icon: "mdi-eye-check",        color: "positive" },
  { label: "Meta do Mês",      value: loading.value ? "…" : String(metaMensal.value),      icon: "mdi-bullseye-arrow",    color: "primary"  },
  { label: "Atingimento",      value: loading.value ? "…" : atingimento.value,             icon: "mdi-check-decagram",    color: "teal"     },
  { label: "Bases Ativas",     value: loading.value ? "…" : String(basesCovertas.value),   icon: "mdi-map-marker-radius", color: "orange"   },
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tooltipSkin(trigger: "axis" | "item") {
  return {
    trigger,
    backgroundColor: chartInk.tipBg,
    borderColor: chartInk.tipBorder,
    borderWidth: 1,
    padding: [12, 14] as [number, number],
    textStyle: { color: chartInk.tipText, fontSize: 12, fontWeight: 500 as const },
    extraCssText: "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.45);",
  };
}

function tipHtml(title: string, rows: { label: string; value: string; color?: string }[], foot?: string) {
  const t = chartInk.tipText;
  const m = chartInk.tipMuted;
  const body = rows
    .map((r) =>
      `<div style="display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-top:6px">`
      + `<span style="color:${m};font-size:11px;font-weight:600;letter-spacing:.02em">${r.label}</span>`
      + `<span style="color:${r.color ?? t};font-size:13px;font-weight:800">${r.value}</span>`
      + `</div>`,
    )
    .join("");
  const hint = foot
    ? `<div style="color:${m};font-size:10px;margin-top:8px;opacity:.9">${foot}</div>`
    : "";
  return `<div style="min-width:168px;color:${t};font-family:inherit">`
    + `<div style="font-weight:800;font-size:14px;line-height:1.25;color:${t}">${title}</div>`
    + body
    + hint
    + `</div>`;
}

function cleanXAxis(data: string[], extra: Record<string, unknown> = {}) {
  return {
    type: "category" as const, data,
    axisLine: { lineStyle: { color: chartInk.split } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisPointer: { show: false },
    axisLabel: { color: chartInk.axis, fontSize: 11, ...extra }
  };
}

function yPadMax(values: number[], meta?: number | number[]) {
  const metas = meta == null ? [] : Array.isArray(meta) ? meta : [meta];
  const peak = Math.max(1, ...values, ...metas, 0);
  // Folga extra quando o realizado chega perto da meta — senão o número colide com o traço.
  const near = values.some((v, i) => {
    const m = metas[Math.min(i, metas.length - 1)] ?? metas[0];
    return m != null && m > 0 && Math.abs(v - m) / peak < 0.22;
  });
  return peak * (near ? 1.48 : 1.32);
}

function barItem(value: number, dimmed: boolean) {
  return {
    value,
    itemStyle: {
      color: chartInk.ok,
      opacity: dimmed ? 0.22 : 1,
      borderRadius: [6, 6, 0, 0],
      shadowColor: "rgba(22,163,74,.2)",
      shadowBlur: dimmed ? 0 : 6,
      shadowOffsetY: dimmed ? 0 : 3,
    },
  };
}

function singleBar(labels: string[], data: number[], selected?: string | number | number[] | null) {
  // "selected" pode ser um texto com vários marcados (ver multi-filtro): cada barra clara se estiver entre eles
  const marcados = typeof selected === "string" ? valores(selected) : [];
  return [{
    name: "Realizado",
    type: "bar" as const,
    cursor: "pointer",
    z: 3, // acima da markLine da meta — a vela cobre o traço quando ultrapassa
    data: data.map((v, i) => {
      const key = labels[i];
      const dimmed = Array.isArray(selected)
        ? selected.length > 0 && !selected.includes(i + 1)
        : selected != null && selected !== "" && selected !== key && selected !== i + 1 && !(key !== undefined && marcados.includes(key));
      return barItem(v, dimmed);
    }),
    barMaxWidth: 48,
    clip: false,
    emphasis: { itemStyle: { color: chartInk.okHi, shadowBlur: 12 } },
    label: {
      opacity: 1, // o número não esmaece com a barra (ficaria cinza no fundo branco)
      show: true,
      position: "top" as const,
      fontSize: 13,
      fontWeight: "bold" as const,
      color: chartInk.ok,
      distance: 10,
      textBorderColor: chartInk.halo,
      textBorderWidth: 3,
    },
  }];
}

/** Linha de meta atrás das velas (z baixo): não corta o verde nem o número. */
function metaMarkLine(meta: number) {
  return {
    silent: true,
    symbol: "none" as const,
    z: 1,
    animation: false,
    data: [{ yAxis: meta }],
    lineStyle: { color: "#0ea5e9", width: 2, type: "solid" as const },
    label: {
      formatter: `Meta: ${Math.round(meta)}`,
      position: "insideEndTop" as const,
      color: "#0ea5e9",
      fontWeight: "bold" as const,
      fontSize: 11,
      distance: 6,
      backgroundColor: chartInk.halo,
      padding: [2, 5] as [number, number],
      borderRadius: 3,
    },
  };
}

// ─── Chart: Observações x Meta (Mês) ─────────────────────────────────────────
const chartMetaMes = computed(() => ({
  tooltip: {
    ...tooltipSkin("item"),
    formatter: (p: { value: number }) =>
      tipHtml(`${mesLabel.value} · ${filters.ano}`, [
        { label: "Realizado", value: String(p.value), color: chartInk.ok },
        { label: "Meta", value: String(metaMensal.value), color: "#0ea5e9" },
      ], viz.observadorNome || (ativo(filters.base) ? valores(filters.base).map(nomeBase).join(", ") : undefined)),
  },
  grid: { left: 12, right: 28, top: 52, bottom: 28 },
  xAxis: cleanXAxis([mesLabel.value]),
  yAxis: { show: false, min: 0, max: yPadMax([totalSubmissions.value], metaMensal.value) },
  series: [{
    ...singleBar([mesLabel.value], [totalSubmissions.value])[0],
    markLine: metaMarkLine(metaMensal.value),
  }],
}));

const WEEK_LABELS = ["1ª Sem", "2ª Sem", "3ª Sem", "4ª Sem"];

const chartMetaSemana = computed(() => {
  const vals = [1, 2, 3, 4].map((s) => bySemana.value[s] ?? 0);
  // meta de cada semana: com semanas escolhidas, a soma dividida por elas; sem, o total dividido pelas 4 semanas de cada mês
  const weekMeta = semanasNum.value.length
    ? metaMensal.value / (semanasNum.value.length * mesesNum.value.length)
    : metaMensal.value / (4 * mesesNum.value.length);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number; dataIndex: number }) =>
        tipHtml(p.name, [
          { label: "Realizado", value: String(p.value), color: chartInk.ok },
          { label: "Meta da semana", value: String(Math.round(weekMeta)), color: "#0ea5e9" },
        ], "Clique para filtrar as outras visões"),
    },
    grid: { left: 12, right: 28, top: 52, bottom: 28 },
    xAxis: cleanXAxis(WEEK_LABELS),
    yAxis: { show: false, min: 0, max: yPadMax(vals, weekMeta) },
    series: [{
      ...singleBar(WEEK_LABELS, vals, semanasNum.value.length ? semanasNum.value : null)[0],
      markLine: metaMarkLine(weekMeta),
    }],
  };
});

const chartBase = computed(() => {
  const entries = Object.entries(byBase.value).sort((a, b) => b[1] - a[1]);
  const names = entries.map(([n]) => n);
  const vals = entries.map(([, v]) => v);
  const selected = filters.base !== "Todos" ? filters.base : null;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(nomeBase(p.name), [
          { label: "Realizado", value: String(p.value), color: chartInk.ok },
        ], "Clique para ver só esta base"),
    },
    grid: { left: 12, right: 12, top: 44, bottom: 28 },
    xAxis: cleanXAxis(names, { interval: 0, hideOverlap: false }),
    yAxis: { show: false, min: 0, max: yPadMax(vals) },
    series: singleBar(names, vals, selected),
  };
});

const chartGerencia = computed(() => {
  const entries = Object.entries(byGerencia.value).sort((a, b) => b[1] - a[1]);
  const names = entries.map(([n]) => n);
  const vals = entries.map(([, v]) => v);
  const selected = filters.gerencia !== "Todos" ? filters.gerencia : null;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Realizado", value: String(p.value), color: chartInk.ok },
        ], "Clique para filtrar a gerência"),
    },
    grid: { left: 12, right: 12, top: 44, bottom: 52 },
    xAxis: cleanXAxis(names, { rotate: 20, interval: 0, hideOverlap: false }),
    yAxis: { show: false, min: 0, max: yPadMax(vals) },
    series: singleBar(names, vals, selected),
  };
});

// ─── Chart: Obs por Observador (scrollável) ───────────────────────────────────
/** Lupa: mostra todos os observadores de uma vez (sem rolagem), para tirar um print só. */
const verTodosObs = ref(false);

// Com a lupa e muitos nomes, o gráfico é quebrado em várias linhas (cada uma com seu eixo) para
// nada ficar um em cima do outro. Tudo continua numa única imagem.
const obsWrap = ref<HTMLElement | null>(null);
const larguraObs = ref(1400);
const PX_POR_NOME = 52;
const ALTURA_LINHA_OBS = 210;
const porLinhaObs = computed(() =>
  verTodosObs.value ? Math.max(12, Math.floor(larguraObs.value / PX_POR_NOME)) : Number.MAX_SAFE_INTEGER,
);
const linhasObs = computed(() =>
  verTodosObs.value ? Math.max(1, Math.ceil(observerRows.value.length / porLinhaObs.value)) : 1,
);
const alturaObs = computed(() =>
  verTodosObs.value ? Math.max(380, linhasObs.value * ALTURA_LINHA_OBS + 24) : 280,
);

let roObs: ResizeObserver | null = null;
onMounted(() => {
  if (!obsWrap.value) return;
  larguraObs.value = obsWrap.value.clientWidth || larguraObs.value;
  roObs = new ResizeObserver(() => { larguraObs.value = obsWrap.value?.clientWidth || larguraObs.value; });
  roObs.observe(obsWrap.value);
});
onBeforeUnmount(() => roObs?.disconnect());

const chartObservador = computed(() => {
  const rows = observerRowsOrd.value;
  const maxY = Math.max(4, ...rows.map(r => Math.max(r.realizado, r.meta)), 0) + 2;
  const okColor = chartInk.ok;
  const missColor = chartInk.miss;
  const metaTick = "#0ea5e9";
  const todos = verTodosObs.value;
  const porLinha = porLinhaObs.value;
  const multi = todos && rows.length > porLinha;
  const visible = todos ? rows.length : Math.min(15, Math.max(8, rows.length));
  const labelHalo = {
    textBorderColor: chartInk.halo,
    textBorderWidth: 3,
  };

  // Quando o realizado fica logo abaixo da meta, o número da barra bateria no tracinho da meta:
  // nesse caso o número sobe acima do tracinho (e o número da meta sobe junto).
  const alturaPlot = multi ? ALTURA_LINHA_OBS - 104 : alturaObs.value - 44 - (todos ? 62 : 78);
  const pxPorUnidade = alturaPlot / maxY;
  const colide = (r: { realizado: number; meta: number }) =>
    r.meta >= r.realizado && (r.meta - r.realizado) * pxPorUnidade < 16;

  // Cada "bloco" é uma linha do gráfico (ou o gráfico inteiro, se não precisar quebrar).
  const blocos = multi
    ? Array.from({ length: Math.ceil(rows.length / porLinha) }, (_, c) => ({ ini: c * porLinha, rows: rows.slice(c * porLinha, (c + 1) * porLinha) }))
    : [{ ini: 0, rows }];

  const series = blocos.flatMap((bl, i) => [
    {
      name: "Realizado",
      type: "bar" as const,
      xAxisIndex: i,
      yAxisIndex: i,
      cursor: "pointer",
      data: bl.rows.map(r => ({
        value: r.realizado,
        itemStyle: {
          color: r.realizado >= r.meta ? okColor : chartInk.missBar,
          opacity: !viz.matricula || r.matricula === viz.matricula ? 1 : 0.22,
          borderRadius: [6, 6, 0, 0],
          shadowColor: r.realizado >= r.meta ? "rgba(74,222,128,.25)" : "rgba(244,63,94,.35)",
          shadowBlur: 4,
        },
        label: {
          color: r.realizado >= r.meta ? okColor : missColor,
          offset: colide(r) ? [0, -13] : [0, 0],
        },
      })),
      barMaxWidth: 22,
      emphasis: { itemStyle: { shadowBlur: 10 } },
      label: {
        opacity: 1, // o número não esmaece com a barra (ficaria cinza no fundo branco)
        show: true,
        position: "top" as const,
        fontSize: 11,
        fontWeight: "bold" as const,
        distance: 2,
        formatter: (p: { value: number }) => String(p.value),
        ...labelHalo,
      },
    },
    {
      name: "Meta",
      type: "scatter" as const,
      xAxisIndex: i,
      yAxisIndex: i,
      data: bl.rows.map((r) => ({
        value: [r.short, r.meta],
        label: { distance: colide(r) ? 22 : 8 },
      })),
      symbol: "rect",
      symbolSize: [20, 5],
      itemStyle: { color: "transparent", borderWidth: 0 },
      z: 10,
      label: {
        show: true,
        position: "top" as const,
        distance: 8,
        fontSize: 11,
        fontWeight: "bold" as const,
        color: metaTick,
        ...labelHalo,
        formatter: (p: { value: [string, number]; dataIndex: number }) => {
          const r = bl.rows[p.dataIndex];
          if (r && r.realizado === r.meta) return "";
          const val = Array.isArray(p.value) ? p.value[1] : r?.meta;
          return String(val ?? "");
        },
      },
      emphasis: { scale: false },
    },
    {
      name: "Meta traço",
      type: "custom" as const,
      xAxisIndex: i,
      yAxisIndex: i,
      silent: true,
      animation: false,
      z: 11,
      data: bl.rows.map((r, idx) => [idx, r.meta, !viz.matricula || r.matricula === viz.matricula ? 1 : 0.22]),
      renderItem: (_p: unknown, api: { value: (d: number) => number; coord: (v: number[]) => number[] }) => {
        const [cx, cy] = api.coord([api.value(0), api.value(1)]) as [number, number];
        return {
          type: "line",
          shape: { x1: cx - 11, y1: cy, x2: cx + 11, y2: cy },
          style: { stroke: metaTick, lineWidth: 2, opacity: api.value(2) },
        };
      },
    },
  ]);

  return {
    tooltip: {
      ...tooltipSkin("axis"),
      formatter: (params: { seriesIndex: number; dataIndex: number }[]) => {
        const first = params[0];
        if (!first) return "";
        const r = rows[Math.floor(first.seriesIndex / 3) * (multi ? porLinha : rows.length) + first.dataIndex];
        if (!r) return "";
        const ok = r.realizado >= r.meta;
        return tipHtml(r.nome, [
          { label: "Função", value: r.funcao },
          { label: "Realizado", value: String(r.realizado), color: ok ? okColor : missColor },
          { label: "Meta", value: String(r.meta), color: metaTick },
        ], "Clique para filtrar este observador");
      },
    },
    grid: multi
      ? blocos.map((_, i) => ({ left: 12, right: 12, top: i * ALTURA_LINHA_OBS + 36, height: ALTURA_LINHA_OBS - 106 }))
      : { left: 12, right: 12, top: 44, bottom: todos ? 62 : 78 },
    dataZoom: todos ? [] : [
      {
        type: "inside" as const,
        startValue: 0, endValue: visible - 1,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
      },
      {
        type: "slider" as const,
        bottom: 4,
        height: 16,
        startValue: 0, endValue: visible - 1,
        brushSelect: false,
        showDetail: false,
        showDataShadow: false,
        borderRadius: 10,
        borderColor: chartInk.split,
        backgroundColor: "rgba(148,163,184,.12)",
        fillerColor: "rgba(251,113,133,0.28)",
        handleSize: "110%",
        handleStyle: {
          color: "#fff",
          borderColor: chartInk.miss,
          borderWidth: 2,
          shadowColor: "rgba(251,113,133,.4)",
          shadowBlur: 6,
        },
        moveHandleSize: 6,
      },
    ],
    xAxis: blocos.map((bl, i) => ({
      ...cleanXAxis(bl.rows.map(r => r.short), { fontSize: 10, rotate: 30, interval: 0 }),
      gridIndex: i,
    })),
    yAxis: blocos.map((_, i) => ({ show: false, min: 0, max: maxY, gridIndex: i })),
    series,
  };
});

// ─── Chart: Ranking de Observadores ──────────────────────────────────────────
const chartRanking = computed(() => {
  const display = rankingRows.value;
  const names = display.map((o) => o.nome.split(" ")[0]);
  const vals = display.map((o) => o.totalObs);
  const rankingColors = display.map((_, i, arr) => {
    const rank = arr.length - 1 - i;
    if (rank === 0) return "#f59e0b";
    if (rank === 1) return "#94a3b8";
    if (rank === 2) return "#b45309";
    return G.real;
  });
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number; value: number }) => {
        const o = display[p.dataIndex];
        if (!o) return "";
        const pct = o.total ? Math.round((o.conformes / o.total) * 100) : 0;
        return tipHtml(o.nome, [
          { label: "Observações", value: String(p.value), color: rankingColors[p.dataIndex] },
          { label: "Conformidade", value: `${pct}%` },
        ], "Clique para filtrar este observador");
      },
    },
    grid: { left: 82, right: 36, top: 8, bottom: 8 },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const,
      data: names,
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 11 }
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: vals.map((v, i) => ({
        value: v,
        itemStyle: {
          color: rankingColors[i],
          opacity: !viz.matricula || display[i]?.matricula === viz.matricula ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 22,
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,.15)" } },
      label: { opacity: 1, show: true, position: "right" as const, fontSize: 12, fontWeight: "bold" as const, color: chartInk.axis }
    }]
  };
});
</script>

<style scoped lang="scss">
// ── Tokens ───────────────────────────────────────────────────────────────────
$brand:        #8B1C2B;
$brand-text:   #fff;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$border:       #e2e8f0;
$label-color:  var(--poc-muted);

// ── Page ─────────────────────────────────────────────────────────────────────
.acomp-mensal {
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

.filter-bar__inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.fgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fgroup__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
  line-height: 1;
}

// ── Pills ─────────────────────────────────────────────────────────────────────
.pill-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

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
  outline: none;

  &:hover:not(.pill--active) {
    border-color: $brand;
    color: $brand;
    background: rgba($brand, .05);
  }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand;
    color: $brand-text;
    border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35);
    font-weight: 600;
  }
}

// ── Gerente select ────────────────────────────────────────────────────────────
.fgroup--gerente, .fgroup--funcao { min-width: 180px; }

.gerente-select, .funcao-select {
  height: 30px;

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

:global(.gerente-popup .q-item) {
  font-size: 12px;
  min-height: 32px;
  padding: 4px 12px;
}
:global(.gerente-popup .q-item--active) {
  color: $brand !important;
  font-weight: 600;
}

// ── Divider ───────────────────────────────────────────────────────────────────
.filter-divider {
  width: 1px;
  height: 36px;
  background: $border;
  flex-shrink: 0;
  align-self: flex-end;
  margin: 0 4px;
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
  transition: color .15s, border-color .15s;

  &:hover {
    color: $brand;
    border-color: $brand;
  }
}

.chart-hit { cursor: pointer; }

// ── KPI card ──────────────────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .acomp-mensal { background: #0f172a; }

  .filter-bar {
    background: #1e293b;
    border-bottom-color: #334155;
    box-shadow: 0 2px 12px rgba(0,0,0,.3);
  }

  .pill {
    background: #1e293b;
    border-color: #334155;
    color: var(--poc-muted);

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

  .filter-divider  { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label   { color: #64748b; }
}
</style>
