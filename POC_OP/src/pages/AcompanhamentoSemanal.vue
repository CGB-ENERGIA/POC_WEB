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
          <q-icon :name="showFilters ? `mdi-chevron-up` : `mdi-tune`" size="20px" />
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
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Coordenador</span>
            <q-select
              v-model="filters.coordenador"
              :options="coordenadores"
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
            :class="['pill pill--alojamento', { 'pill--active': viz.processo === 'ALOJAMENTO' }]"
            @click="toggleProcesso('ALOJAMENTO')"
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
          <span v-if="filters.coordenador && filters.coordenador !== 'Todos'" class="filter-chip">{{ filters.coordenador }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip">{{ filters.gerencia }}</span>
          <span v-if="viz.observadorNome" class="filter-chip filter-chip--hit" @click="viz.matricula = null; viz.observadorNome = null">{{ viz.observadorNome }}</span>
          <span v-if="viz.base" class="filter-chip filter-chip--hit" @click="viz.base = null">{{ viz.base }}</span>
          <span v-if="viz.processo" class="filter-chip filter-chip--hit" @click="toggleProcesso(viz.processo)">{{ labelProcesso(viz.processo) }}</span>
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
        <div :class="verTodosObs ? 'col-12' : 'col-12 col-md-8'">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none row items-start no-wrap">
              <div class="col">
                <div class="text-subtitle1 text-weight-bold">Observações Realizadas na Semana</div>
                <div class="text-caption text-grey-6">Clique numa vela, base, processo ou semana para filtrar a página · clique de novo para limpar</div>
              </div>
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
                  :key="`obs-${verTodosObs}-${linhasObs}`"
                  class="chart-hit"
                  :option="barObservadores"
                  autoresize
                  :style="{ height: `${alturaObs}px` }"
                  @click="onObsClick"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Evolução Semanal</div>
              <div class="text-caption text-grey-6">Últimas 4 semanas</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="lineWeekly" autoresize style="height: 260px" @click="onWeekClick" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações por Base</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="barBase" autoresize style="height: 260px" @click="onBaseClick" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Observações por Processo</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="barProcesso" autoresize style="height: 260px" @click="onProcessoClick" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Distribuição por Semana</div>
            </q-card-section>
            <q-card-section>
              <v-chart class="chart-hit" :option="donutWeekly" autoresize style="height: 260px" @click="onWeekClick" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  GraphicComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, semanaDaData, semanaDoMes, filterObserverRoster, uniqueChartLabels, tallyObserverRecords, normMatricula, indexEmployees, matchSubmissionToEmployee, filterByCoordenador } from "@/lib/dashboard";
import { useGoals } from "@/composables/useGoals";
const { goalForColaborador } = useGoals();

use([
  CanvasRenderer, BarChart, LineChart, PieChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  MarkLineComponent, GraphicComponent, DataZoomComponent,
]);

// ─── Filter options ──────────────────────────────────────────────────────────
const semanas = [
  { value: 1, label: "1ª (01–08)" },
  { value: 2, label: "2ª (09–15)" },
  { value: 3, label: "3ª (16–22)" },
  { value: 4, label: "4ª (23–31)" },
];

const showFilters = ref(false);

const anos = [2024, 2025, 2026];

const meses = [
  { value: 1, label: "jan" }, { value: 2, label: "fev" }, { value: 3, label: "mar" },
  { value: 4, label: "abr" }, { value: 5, label: "mai" }, { value: 6, label: "jun" },
  { value: 7, label: "jul" }, { value: 8, label: "ago" }, { value: 9, label: "set" },
  { value: 10, label: "out" }, { value: 11, label: "nov" }, { value: 12, label: "dez" }
];


const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];

// ─── Filter state ────────────────────────────────────────────────────────────
const now = new Date();
const filters = reactive({
  semana: semanaDoMes(now.getDate()),
  ano: now.getFullYear(),
  mes: now.getMonth() + 1,
  gerente: "Todos", coordenador: "Todos",
  gerencia: "Todos",
  alojamento: false,
});

const viz = reactive({
  matricula: null as string | null,
  observadorNome: null as string | null,
  base: null as string | null,
  processo: null as string | null,
});

const PROCESSO_LABEL: Record<string, string> = {
  GOMAN: "GOMAN",
  GSTC: "GSTC",
  ADMINISTRATIVO: "Administrativo",
  ALOJAMENTO: "Alojamento",
  LOGISTICA: "Logística",
  OFICINA: "Oficina",
};

function labelProcesso(code: string) {
  return PROCESSO_LABEL[code] ?? code;
}

function auditagemKey(s: { auditagem?: string }) {
  return (s.auditagem ?? "Outro").toUpperCase();
}

function resetViz() {
  viz.matricula = null;
  viz.observadorNome = null;
  viz.base = null;
  viz.processo = null;
  filters.alojamento = false;
}

function resetFilters() {
  filters.semana = semanaDoMes(now.getDate());
  filters.ano = now.getFullYear();
  filters.mes = now.getMonth() + 1;
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  filters.gerencia = "Todos";
  filters.alojamento = false;
  resetViz();
}

function toggleProcesso(code: string) {
  viz.processo = viz.processo === code ? null : code;
  filters.alojamento = viz.processo === "ALOJAMENTO";
}

type EcClick = {
  componentType?: string;
  dataIndex?: number;
  seriesIndex?: number;
  name?: string;
};

function onObsClick(p: EcClick) {
  if (p.componentType !== "series") return;
  // Na lupa com várias linhas, cada linha tem suas séries (2 por linha): converte para o índice global
  const idxGlobal = (p.dataIndex ?? -1) + Math.floor((p.seriesIndex ?? 0) / 2) * porLinhaObs.value;
  const row = observerRows.value[idxGlobal];
  if (!row) return;
  const mat = row.matricula;
  if (viz.matricula === mat) {
    viz.matricula = null;
    viz.observadorNome = null;
    return;
  }
  viz.matricula = mat;
  viz.observadorNome = row.short;
}

function onBaseClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  viz.base = viz.base === p.name ? null : p.name;
}

function onProcessoClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const code = processoKeys.value[p.dataIndex ?? -1];
  if (!code) return;
  toggleProcesso(code);
}

function onWeekClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  let n = 0;
  const fromName = p.name?.match(/(\d)/);
  if (fromName) n = Number(fromName[1]);
  else if (typeof p.dataIndex === "number") n = p.dataIndex + 1;
  if (n >= 1 && n <= 4) filters.semana = n;
}

const semanaLabel = computed(() => semanas.find(s => s.value === filters.semana)?.label ?? "");
const mesLabel = computed(() => meses.find(m => m.value === filters.mes)?.label ?? "");
const hasActiveFilters = computed(() =>
  filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.gerencia !== "Todos"
  || !!viz.matricula
  || !!viz.base
  || !!viz.processo
);

// ─── Dados do banco ───────────────────────────────────────────────────────────
const {
  loading,
  load,
  submissions,
  responses,
  employees,
  gerentesOpts: gerentes,
  coordenadoresOpts: coordenadores,
} = useChecklistData();

async function recarregar() {
  await load(
    { ano: filters.ano, mes: filters.mes, contarMeta: true },
    false,
    false,
  );
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);

// Todos os subs do mês após filtros de gerência/gerente (sem filtro de semana)
const barraGerencia = computed(() =>
  filterByCoordenador(
    filterByGerente(
      filterByGerencia(submissions.value, employees.value, filters.gerencia),
      employees.value,
      filters.gerente,
    ),
    employees.value,
    filters.coordenador,
  ),
);

function applySlice(
  source: typeof submissions.value,
  omit: { week?: boolean; base?: boolean; processo?: boolean; mat?: boolean } = {},
) {
  let s = source;
  if (!omit.week) s = s.filter((sub) => semanaDaData(sub.data) === filters.semana);
  if (!omit.base && viz.base) s = s.filter((sub) => sub.base === viz.base);
  if (!omit.processo && viz.processo) s = s.filter((sub) => auditagemKey(sub) === viz.processo);
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

const allMonthSubs = computed(() => applySlice(barraGerencia.value, { week: true }));
const filteredSubs = computed(() => applySlice(barraGerencia.value));
const subsWeekNoObs = computed(() => applySlice(barraGerencia.value, { mat: true }));
const subsWeekNoBase = computed(() => applySlice(barraGerencia.value, { base: true }));
const subsWeekNoProc = computed(() => applySlice(barraGerencia.value, { processo: true }));

const totalSubmissions = computed(() => filteredSubs.value.length);
const basesCovertas = computed(() => new Set(filteredSubs.value.map(s => s.base)).size);

const byBase = computed(() => {
  const m: Record<string, number> = {};
  for (const s of subsWeekNoBase.value) m[s.base] = (m[s.base] ?? 0) + 1;
  return m;
});

const bySemana = computed(() => {
  const m: Record<number, number> = {};
  for (const s of allMonthSubs.value) {
    const sem = semanaDaData(s.data);
    m[sem] = (m[sem] ?? 0) + 1;
  }
  return m;
});

const observerRoster = computed(() =>
  filterObserverRoster(employees.value, {
    gerencia: filters.gerencia,
    gerente: filters.gerente,
    coordenador: filters.coordenador,
  }),
);

const observerRows = computed(() => {
  let roster = observerRoster.value;
  const idx = indexEmployees(employees.value);
  const slice = subsWeekNoObs.value;
  if (viz.base) {
    const fromSlice = new Set<string>();
    for (const s of slice) {
      const emp = matchSubmissionToEmployee(s, idx);
      fromSlice.add(normMatricula(emp?.matricula ?? s.matricula));
    }
    roster = roster.filter((e) => fromSlice.has(normMatricula(e.matricula)));
  }
  if (viz.processo) {
    const fromSlice = new Set<string>();
    for (const s of slice) {
      const emp = matchSubmissionToEmployee(s, idx);
      fromSlice.add(normMatricula(emp?.matricula ?? s.matricula));
    }
    roster = roster.filter((e) => fromSlice.has(normMatricula(e.matricula)));
  }
  const { counts, extras } = tallyObserverRecords(roster, employees.value, slice);
  const list = extras.length ? [...roster, ...extras] : roster;
  const shorts = uniqueChartLabels(
    list.map((e) => e.nome || e.nome_completo.split(/\s+/)[0] || e.matricula),
  );
  return list.map((emp, i) => {
    const g = goalForColaborador(
      emp.matricula, emp.gerencia, filters.ano, filters.mes, filters.semana, emp.funcao,
    );
    const key = normMatricula(emp.matricula);
    return {
      matricula: key,
      nome: emp.nome_completo || emp.nome,
      short: shorts[i]!,
      realizado: counts.get(key) ?? 0,
      meta: g.semanal,
      funcao: emp.funcao || "—",
    };
  });
});

const conformidadePorObservador = computed(() => {
  const filteredIds = new Set(filteredSubs.value.map(s => s.id));
  const filteredResps = responses.value.filter(r => filteredIds.has(r.submission_id));
  const map: Record<string, { nome: string; total: number; conformes: number }> = {};
  for (const s of filteredSubs.value) {
    if (!map[s.matricula]) map[s.matricula] = { nome: s.observador, total: 0, conformes: 0 };
  }
  for (const r of filteredResps) {
    const sub = filteredSubs.value.find(s => s.id === r.submission_id);
    if (!sub) continue;
    if (!map[sub.matricula]) map[sub.matricula] = { nome: sub.observador, total: 0, conformes: 0 };
    map[sub.matricula].total++;
    if (r.resposta === "conforme") map[sub.matricula].conformes++;
  }
  return Object.entries(map)
    .map(([matricula, d]) => ({
      matricula, nome: d.nome,
      totalObs: filteredSubs.value.filter(s => s.matricula === matricula).length,
      total: d.total, conformes: d.conformes,
    }))
    .sort((a, b) => b.totalObs - a.totalObs);
});

// ─── Meta ────────────────────────────────────────────────────────────────────

const metaTotal = computed(() => {
  const rows = viz.matricula
    ? observerRows.value.filter((x) => x.matricula === viz.matricula)
    : observerRows.value;
  return rows.reduce((total, r) => total + r.meta, 0);
});

const obsNoMeta = computed(() => {
  const rows = viz.matricula
    ? observerRows.value.filter((x) => x.matricula === viz.matricula)
    : observerRows.value;
  return rows.filter((r) => r.realizado >= r.meta).length;
});

const numObservadores = computed(() =>
  viz.matricula ? (observerRows.value.some((x) => x.matricula === viz.matricula) ? 1 : 0) : observerRows.value.length,
);

const atingimento = computed(() => {
  if (numObservadores.value === 0) return "—";
  return `${Math.round((obsNoMeta.value / numObservadores.value) * 100)}%`;
});

// ─── KPI ────────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: "Total de Observações", value: loading.value ? "…" : fmtN(totalSubmissions.value), icon: "mdi-eye-check", color: "primary" },
  { label: "Meta da Semana", value: loading.value ? "…" : String(metaTotal.value), icon: "mdi-bullseye-arrow", color: "teal" },
  { label: "Bases Cobertas", value: loading.value ? "…" : String(basesCovertas.value), icon: "mdi-map-marker-radius", color: "orange" },
  { label: "Atingimento", value: loading.value ? "…" : atingimento.value, icon: "mdi-check-circle", color: "positive" }
]);

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

function numVal(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "value" in (v as object)) return Number((v as { value: number }).value) || 0;
  return Number(v) || 0;
}

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
    axisLine: { lineStyle: { color: chartInk.split } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisPointer: { show: false },
    axisLabel: { color: chartInk.axis, fontSize: 11, ...extra }
  };
}

// ─── Observações Realizadas na Semana ─────────────────────────────────────────
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
  verTodosObs.value ? Math.max(380, linhasObs.value * ALTURA_LINHA_OBS + 24) : 300,
);

let roObs: ResizeObserver | null = null;
onMounted(() => {
  if (!obsWrap.value) return;
  larguraObs.value = obsWrap.value.clientWidth || larguraObs.value;
  roObs = new ResizeObserver(() => { larguraObs.value = obsWrap.value?.clientWidth || larguraObs.value; });
  roObs.observe(obsWrap.value);
});
onBeforeUnmount(() => roObs?.disconnect());

const barObservadores = computed(() => {
  const rows = observerRows.value;
  const maxY = Math.max(2, ...rows.map(r => Math.max(r.realizado, r.meta)), 0) + 1.8;
  const okColor = chartInk.ok;
  const missColor = chartInk.miss;
  const metaTick = chartInk.metaTick;
  const todos = verTodosObs.value;
  const porLinha = porLinhaObs.value;
  const multi = todos && rows.length > porLinha;
  const visible = todos ? rows.length : Math.min(18, Math.max(8, rows.length));
  const labelHalo = {
    textBorderColor: chartInk.halo,
    textBorderWidth: 3,
  };

  // Quando o realizado fica logo abaixo da meta, o número da barra bateria no tracinho da meta:
  // nesse caso o número sobe acima do tracinho (e o número da meta sobe junto).
  const alturaPlot = multi ? ALTURA_LINHA_OBS - 104 : alturaObs.value - 40 - (todos ? 62 : 78);
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
      data: bl.rows.map(r => ({
        value: r.realizado,
        itemStyle: {
          color: r.realizado >= r.meta
            ? grad(chartInk.okHi, okColor)
            : grad(chartInk.missHi, chartInk.missBar),
          borderRadius: [6, 6, 0, 0],
          opacity: !viz.matricula || r.matricula === viz.matricula ? 1 : 0.22,
          shadowColor: r.realizado >= r.meta ? "rgba(74,222,128,.28)" : "rgba(244,63,94,.35)",
          shadowBlur: 6,
          shadowOffsetY: 3,
        },
        label: {
          color: r.realizado >= r.meta ? okColor : missColor,
          offset: colide(r) ? [0, -13] : [0, 0],
        },
      })),
      barMaxWidth: 22,
      cursor: "pointer",
      label: {
        show: true,
        position: "top" as const,
        distance: 2,
        fontSize: 11,
        fontWeight: "bold" as const,
        formatter: (p: { value: number }) => String(p.value),
        ...labelHalo,
      },
    },
    {
      name: "Meta",
      type: "scatter" as const,
      xAxisIndex: i,
      yAxisIndex: i,
      data: bl.rows.map(r => ({
        value: [r.short, r.meta],
        itemStyle: { opacity: !viz.matricula || r.matricula === viz.matricula ? 1 : 0.22 },
        label: { distance: colide(r) ? 22 : 8 },
      })),
      symbol: "rect",
      symbolSize: [20, 5],
      cursor: "pointer",
      itemStyle: {
        color: metaTick,
        borderColor: chartInk.halo,
        borderWidth: 1,
        shadowColor: "rgba(254,205,211,.45)",
        shadowBlur: 6,
      },
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
          return String(p.value[1]);
        },
      },
      emphasis: { scale: false },
    },
  ]);

  return {
    tooltip: {
      ...tooltipSkin("axis"),
      formatter: (params: { seriesName: string; seriesIndex: number; dataIndex: number }[]) => {
        const first = params[0];
        if (!first) return "";
        const r = rows[Math.floor(first.seriesIndex / 2) * (multi ? porLinha : rows.length) + first.dataIndex];
        if (!r) return "";
        const ok = r.realizado >= r.meta;
        const falta = Math.max(0, r.meta - r.realizado);
        return tipHtml(r.nome, [
          { label: "Função", value: r.funcao },
          { label: "Realizado", value: String(r.realizado), color: ok ? okColor : missColor },
          { label: "Meta da semana", value: String(r.meta), color: metaTick },
          { label: "Situação", value: ok ? "Meta atingida" : `Faltam ${falta}`, color: ok ? okColor : missColor },
        ], "Clique para filtrar este observador");
      },
    },
    grid: multi
      ? blocos.map((_, i) => ({ left: 8, right: 8, top: i * ALTURA_LINHA_OBS + 34, height: ALTURA_LINHA_OBS - 104 }))
      : { left: 8, right: 8, top: 40, bottom: todos ? 62 : 78 },
    // Com a lupa ligada não há rolagem: o gráfico inteiro cabe na tela.
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
        },
        moveHandleSize: 6,
      },
    ],
    xAxis: blocos.map((bl, i) => ({
      ...cleanXAxis(bl.rows.map(r => r.short), { fontSize: 10, interval: 0, rotate: 28 }),
      gridIndex: i,
    })),
    yAxis: blocos.map((_, i) => ({ ...silentYAxis, min: 0, max: maxY, gridIndex: i })),
    series,
  };
});

// ─── Evolução Semanal ────────────────────────────────────────────────────────
const lineWeekly = computed(() => {
  const weekData = [1, 2, 3, 4].map(s => bySemana.value[s] ?? 0);
  const weekAvg = Math.round(weekData.reduce((a, b) => a + b, 0) / Math.max(weekData.filter(Boolean).length, 1));
  return {
    tooltip: {
      ...tooltipSkin("axis"),
      formatter: (p: { name: string; value: unknown }[]) => {
        const v = numVal(p[0]?.value);
        const total = weekData.reduce((a, b) => a + b, 0);
        const pct = total ? Math.round((v / total) * 1000) / 10 : 0;
        return tipHtml(p[0]?.name ?? "Semana", [
          { label: "Observações", value: String(v), color: chartInk.miss },
          { label: "Do mês", value: `${pct}%`.replace(".", ",") },
        ], "Clique para abrir esta semana");
      },
    },
    grid: { left: 12, right: 20, top: 44, bottom: 32 },
    xAxis: { ...cleanXAxis(["1ª Semana","2ª Semana","3ª Semana","4ª Semana"]), axisLine: { show: false } },
    yAxis: { ...silentYAxis, min: 0 },
    series: [{
      type: "line" as const,
      data: weekData.map((v, i) => ({
        value: v,
        itemStyle: { opacity: filters.semana === i + 1 ? 1 : 0.35 },
      })),
      smooth: 0.3,
      symbol: "circle",
      symbolSize: 14,
      cursor: "pointer",
      lineStyle: { color: C.p, width: 3, shadowColor: "rgba(139,28,43,.35)", shadowBlur: 10 },
      itemStyle: { color: C.p, borderColor: "#fff", borderWidth: 3, shadowColor: "rgba(139,28,43,.45)", shadowBlur: 10 },
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
        label: { position: "end" as const, fontSize: 10, color: C.l1, formatter: `Média: ${weekAvg}` },
        data: [{ type: "average" as const }]
      }
    }]
  };
});

// ─── Observações por Base ────────────────────────────────────────────────────
const baseColorPalette: [string, string][] = [
  [C.p, C.l1], [C.d2, C.m], [C.m, C.l2], [C.d1, C.p], [C.l1, C.l3]
];

const barBase = computed(() => {
  const entries = Object.entries(byBase.value).sort((a, b) => b[1] - a[1]);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: unknown }) => {
        const v = numVal(p.value);
        const total = entries.reduce((a, [, n]) => a + n, 0);
        const pct = total ? Math.round((v / total) * 1000) / 10 : 0;
        return tipHtml(nomeBase(p.name), [
          { label: "Observações", value: String(v), color: chartInk.miss },
          { label: "Desta semana", value: `${String(pct).replace(".", ",")}%` },
        ], "Clique para ver só esta base");
      },
    },
    grid: { left: 12, right: 12, top: 44, bottom: 40 },
    xAxis: cleanXAxis(entries.map(([nome]) => nome), { interval: 0, hideOverlap: false }),
    yAxis: { show: false },
    series: [{
      type: "bar" as const,
      data: entries.map(([nome, v]) => ({
        value: v,
        itemStyle: { opacity: !viz.base || viz.base === nome ? 1 : 0.22 },
      })),
      barMaxWidth: 56,
      cursor: "pointer",
      itemStyle: {
        borderRadius: [10, 10, 0, 0],
        color: (params: { dataIndex: number }) => grad(...baseColorPalette[params.dataIndex % 5]),
        shadowColor: "rgba(139,28,43,.2)",
        shadowBlur: 8,
        shadowOffsetY: 4
      },
      emphasis: { itemStyle: { shadowBlur: 18, shadowColor: "rgba(139,28,43,.4)" } },
      label: { show: true, position: "top" as const, fontSize: 13, fontWeight: "bold" as const, color: C.p, distance: 6 }
    }]
  };
});

// ─── Observações por Processo (auditagem type) ────────────────────────────────
const byProcesso = computed(() => {
  const m: Record<string, number> = {};
  for (const s of subsWeekNoProc.value) {
    const tipo = auditagemKey(s);
    m[tipo] = (m[tipo] ?? 0) + 1;
  }
  return m;
});

const processoKeys = computed(() =>
  Object.entries(byProcesso.value).sort((a, b) => b[1] - a[1]).map(([k]) => k),
);

const barProcesso = computed(() => {
  const keys = processoKeys.value;
  const processoColors: [string, string][] = [[C.p, C.l1], [C.l1, C.l3], [C.d2, C.m], [C.m, C.l2]];
  const labels = keys.map(labelProcesso);
  const data = keys.map(l => byProcesso.value[l] ?? 0);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: unknown; dataIndex: number }) => {
        const v = numVal(p.value);
        const total = data.reduce((a, b) => a + b, 0);
        const pct = total ? Math.round((v / total) * 1000) / 10 : 0;
        return tipHtml(p.name, [
          { label: "Observações", value: String(v), color: chartInk.miss },
          { label: "Desta semana", value: `${String(pct).replace(".", ",")}%` },
        ], "Clique para ver só este processo");
      },
    },
    grid: { left: 12, right: 12, top: 52, bottom: 40 },
    xAxis: cleanXAxis(labels, { interval: 0, hideOverlap: false, width: 88, overflow: "break" }),
    yAxis: silentYAxis,
    series: [{
      type: "bar" as const,
      data: keys.map((code, i) => ({
        value: data[i],
        itemStyle: { opacity: !viz.processo || viz.processo === code ? 1 : 0.22 },
      })),
      barMaxWidth: 80,
      barMinHeight: 4,
      cursor: "pointer",
      itemStyle: {
        borderRadius: [10, 10, 0, 0],
        color: (params: { dataIndex: number }) => grad(...processoColors[params.dataIndex % processoColors.length]!),
        shadowColor: "rgba(139,28,43,.25)",
        shadowBlur: 10,
        shadowOffsetY: 4
      },
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: "rgba(139,28,43,.45)" } },
      label: { show: true, position: "top" as const, fontSize: 14, fontWeight: "bold" as const, color: C.p, distance: 8 }
    }]
  };
});

// ─── Distribuição por Semana ──────────────────────────────────────────────────
const donutWeekly = computed(() => {
  const semColors = [C.p, C.m, C.l1, C.d1];
  const donutData = [1, 2, 3, 4].map((s, i) => ({
    value: bySemana.value[s] ?? 0,
    name: `${s}ª Semana`,
    itemStyle: {
      color: semColors[i],
      opacity: filters.semana === s ? 1 : 0.35,
    },
  }));
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: unknown; percent: number }) => {
        const v = numVal(p.value);
        return tipHtml(p.name, [
          { label: "Observações", value: String(v), color: chartInk.miss },
          { label: "Do mês", value: `${(p.percent ?? 0).toFixed(1).replace(".", ",")}%` },
        ], "Clique para abrir esta semana");
      },
    },
    legend: {
      bottom: 4, left: "center",
      itemWidth: 10, itemHeight: 10, itemGap: 14,
      textStyle: { color: chartInk.muted, fontSize: 11 }
    },
    title: {
      text: String(donutTotal),
      subtext: "observações",
      left: "49.5%",
      top: "33%",
      textAlign: "center",
      textStyle: { fontSize: 28, fontWeight: "bold" as const, color: C.p, lineHeight: 32 },
      subtextStyle: { fontSize: 11, color: chartInk.faint, lineHeight: 20 }
    },
    series: [{
      type: "pie" as const,
      radius: ["50%", "74%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: false,
      cursor: "pointer",
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
});
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

.chart-hit {
  cursor: pointer;
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
