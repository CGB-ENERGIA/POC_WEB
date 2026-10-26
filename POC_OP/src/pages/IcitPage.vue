<template>
  <q-page class="icit-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FILTER BAR
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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
                :class="['pill', { 'pill--active': s.value ? marcado(filters.semana, String(s.value)) : !ativo(filters.semana) }]"
                @click="filters.semana = s.value ? alternar(filters.semana, String(s.value), $event) : 'Todos'">{{ s.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Gerente</span>
            <q-select multiple :model-value="valores(filters.gerente)" @update:model-value="(v: string[]) => filters.gerente = juntar(v)" :display-value="rotulo(filters.gerente)"
              :clearable="filters.gerente !== 'Todos'" @clear="filters.gerente = 'Todos'" :options="semTodos(gerentes)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Coordenador</span>
            <q-select multiple :model-value="valores(filters.coordenador)" @update:model-value="(v: string[]) => filters.coordenador = juntar(v)" :display-value="rotulo(filters.coordenador)"
              :clearable="filters.coordenador !== 'Todos'" @clear="filters.coordenador = 'Todos'" :options="semTodos(coordenadores)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>

        </div>

        <!-- Row 2: Mês · Gerência -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button v-for="m in meses" :key="m.value"
                :class="['pill', { 'pill--active': marcado(filters.mes, String(m.value)) }]"
                :title="marcado(filters.mes, String(m.value)) ? 'Ctrl+clique para tirar este mês' : 'Ctrl+clique para somar este mês'"
                @click="filters.mes = alternarMinimo(filters.mes, String(m.value), $event)">{{ m.label }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerencias" :key="g"
                :class="['pill', { 'pill--active': marcado(filters.gerencia, g) }]"
                @click="filters.gerencia = alternar(filters.gerencia, g, $event)">{{ g }}</button>
            </div>
          </div>

        </div>

        <!-- Row 3: Base · Segurança · Tipo de POC -->
        <div class="filter-row">

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in bases" :key="b"
                :class="['pill', { 'pill--active': marcado(filters.base, b) }]"
                @click="filters.base = alternar(filters.base, b, $event)">{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Segurança</span>
            <div class="pill-group">
              <button v-for="s in segurancas" :key="s"
                :class="['pill', { 'pill--active': marcado(filters.seguranca, s) }]"
                @click="filters.seguranca = alternar(filters.seguranca, s, $event)">{{ s }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposPoc" :key="t"
                :class="['pill', { 'pill--active': marcado(filters.tipoPoc, t) }]"
                @click="filters.tipoPoc = alternar(filters.tipoPoc, t, $event)">{{ t }}</button>
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
          <span v-if="filters.tipoPoc !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.tipoPoc = 'Todos'">{{ rotulo(filters.tipoPoc) }}</span>
          <span v-if="filters.seguranca !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.seguranca = 'Todos'">{{ rotulo(filters.seguranca) }}</span>
          <span v-if="viz.equipe" class="filter-chip filter-chip--hit" @click="viz.equipe = null">{{ viz.equipe }}</span>
          <span v-if="viz.categoria" class="filter-chip filter-chip--hit" @click="viz.categoria = null">{{ viz.categoria }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         KPI + CHARTS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">

      <!-- KPI Row -->
      <div class="kpi-sticky">
      <div class="row q-col-gutter-sm q-mb-none items-stretch">
        <div class="col-6 col-md-2" v-for="kpi in kpis" :key="kpi.label">
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
        <!-- Histórico button -->
        <div class="col-6 col-md-4">
          <q-card flat bordered class="kpi-card historico-card cursor-pointer"
            @click="$router.push('/historico-icit')">
            <q-card-section class="q-pa-md full-height">
              <div class="row items-center justify-between no-wrap full-height">
                <div>
                  <div class="text-caption text-grey-6">Visualizar</div>
                  <div class="text-subtitle1 text-weight-bold" style="color:#8B1C2B">Histórico ICIT</div>
                  <div class="text-caption text-grey-5">Clique aqui para seguir</div>
                </div>
                <q-icon name="mdi-chart-timeline-variant" size="48px" color="deep-orange-8" style="opacity:.7" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      </div>

      <!-- Charts main grid: LEFT 9 cols + RIGHT 3 cols (equipe) -->
      <div class="row q-col-gutter-md">

        <!-- LEFT: 3Ã—2 grid -->
        <div class="col-12 col-md-9">

          <!-- Row 1: Mês (linha) · Gerência -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-7">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Mês</div>
                  <div class="text-caption text-grey-6">ICIT no ano · clique no mês para abrir</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartMes" autoresize style="height:260px" @click="onMesClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-5">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Gerência</div>
                  <div class="text-caption text-grey-6">Clique para filtrar a gerência</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartGerencia" autoresize style="height:260px" @click="onGerenciaClick" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Row 2: Base · Não conformidades por Categoria · Tolerância Zero -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Índice de Conformidade por Base</div>
                  <div class="text-caption text-grey-6">Clique para ver só esta base</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartBase" autoresize style="height:260px" @click="onBaseClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Não Conformidades por Categoria</div>
                  <div class="text-caption text-grey-6">Clique na categoria para filtrar</div>
                </q-card-section>
                <q-card-section>
                  <v-chart class="chart-hit" :option="chartCategoria" autoresize style="height:260px" @click="onCategoriaClick" />
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-bold">Não Conformidades de Tolerância Zero</div>
                  <div class="text-caption text-grey-6">Itens de maior gravidade · role para ver mais</div>
                </q-card-section>
                <q-card-section>
                  <v-chart :option="chartTolerancia" autoresize style="height:260px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

        </div>

        <!-- RIGHT: Equipe (full height) -->
        <div class="col-12 col-md-3 equipe-col">
          <q-card flat bordered class="equipe-card chart-card chart-card--vertical">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-bold">Índice de conformidade por Equipe</div>
              <div class="text-caption text-grey-6">Clique na equipe · role para ver mais</div>
            </q-card-section>
            <q-card-section class="equipe-body">
              <div class="equipe-scroll">
                <v-chart class="chart-hit" :option="chartEquipe" autoresize :style="{ height: alturaEquipe + 'px' }" @click="onEquipeClick" />
              </div>
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { valores, juntar, marcado, alternar, alternarMinimo, rotulo, semTodos, casa, igualCI, ativo, eventoDe } from "@/lib/multi-filtro";
import { reactive, ref, shallowRef, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtPct, fmtN } from "@/composables/useChecklistData";
import { ocorrenciasTz } from "@/lib/tolerancia-zero";
import { rotuloSemana } from "@/lib/semanas";
import {
  semanaDaSub, indexEmployees, matchSubmissionToEmployee, fetchSubmissions, fetchResponses, type ResponseRow, type SubmissionRow,
  foldName, fetchHierarquiaEquipes, hierarquiaDaEquipe, type EquipeHier,
} from "@/lib/dashboard";
import { lerTipoPoc, salvarTipoPoc } from "@/lib/tipo-poc";
import { lerFiltros, salvarFiltros } from "@/lib/filtros-salvos";
import { metaRoleFrom } from "@/composables/useGoals";

use([
  CanvasRenderer, BarChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent
]);

const {
  loading,
  submissions, responses, employees, mapaTz,
  load,
  gerentesOpts: gerentes,
  coordenadoresOpts: coordenadores,
} = useChecklistData();

// â"€â"€â"€ Paleta â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const P = {
  conf:    "#16a34a",
  confLt:  "#22c55e",
  inconf:  "#8B1C2B",
  inconfLt:"#C4364E",
  abaixo:  "#d97706", // ICIT abaixo da meta (mesma cor do filtro "<80% ICIT" no Histórico)
};

// â"€â"€â"€ Filter options â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const now = new Date();
const anos     = [2024, 2025, 2026];
const semanas = computed(() => [
  { value: 0, label: "Todas" },
  ...[1, 2, 3, 4].map((v) => ({ value: v, label: rotuloSemana(filters.ano, Number(valores(filters.mes)[0] ?? 1), v) })),
]);
const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];
const gerencias  = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];
const bases      = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const segurancas = ["Todos", "Segurança"];
const tiposPoc   = ["Todos", "Administrativo", "Operacional"];
// â"€â"€â"€ Filter state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
// Sem escolha salva, tudo começa em "Todos" (e no mês atual); o que o usuário escolher é lembrado ao recarregar.
const FILTROS_CHAVE = "icit";
const filtrosPadrao = {
  ano:       now.getFullYear(),
  semana:    "Todos",
  mes:       String(now.getMonth() + 1),
  gerencia:  "Todos",
  base:      "Todos",
  seguranca: "Todos",
  gerente:   "Todos",
  coordenador: "Todos",
};
const opcoesValidas: Record<string, (v: string | number) => boolean> = {
  ano: (v) => anos.includes(Number(v)),
  semana: (v) => valores(String(v)).every((x) => ["1", "2", "3", "4"].includes(x)),
  mes: (v) => valores(String(v)).length > 0 && valores(String(v)).every((x) => Number(x) >= 1 && Number(x) <= 12),
  gerencia: (v) => valores(String(v)).every((x) => gerencias.includes(x)),
  base: (v) => valores(String(v)).every((x) => bases.includes(x)),
  seguranca: (v) => segurancas.includes(String(v)),
};
const filters = reactive({
  ...lerFiltros(FILTROS_CHAVE, filtrosPadrao, (campo, v) => opcoesValidas[campo]?.(v) ?? true),
  tipoPoc: lerTipoPoc(tiposPoc),
});
watch(() => filters.tipoPoc, salvarTipoPoc);
watch(
  () => ({
    ano: filters.ano, semana: filters.semana, mes: filters.mes, gerencia: filters.gerencia, base: filters.base,
    seguranca: filters.seguranca, gerente: filters.gerente, coordenador: filters.coordenador,
  }),
  (v) => salvarFiltros(FILTROS_CHAVE, v),
);

async function recarregarMes() {
  // Só checklists aprovados (como o BI): os pendentes ainda não entram no índice.
  const nums = valores(filters.mes).map(Number).filter(Boolean).sort((a, b) => a - b);
  if (!nums.length) nums.push(now.getMonth() + 1);
  await load(nums.length === 1
    ? { ano: filters.ano, mes: nums[0]! }
    : { ano: filters.ano, meses: nums });
}

const yearSubs = shallowRef<SubmissionRow[]>([]);
const yearResps = shallowRef<ResponseRow[]>([]);

async function recarregarAno() {
  const subs = await fetchSubmissions({ ano: filters.ano });
  yearSubs.value = subs;
  yearResps.value = await fetchResponses(subs.map((s) => s.id), { soNc: true });
}

async function recarregar() {
  await Promise.all([recarregarMes(), recarregarAno()]);
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregarMes);
watch(() => filters.ano, recarregarAno);

const viz = reactive({
  equipe: null as string | null,
  categoria: null as string | null,
});

const BASE_NOME: Record<string, string> = {
  BCB: "Bacabal",
  BDC: "Barra do Corda",
  ITM: "Imperatriz",
  PDS: "Pedreiras",
  PDT: "Presidente Dutra",
  STI: "Santa Inês",
};

const TIPO_AUDITAGEM: Record<string, string[]> = {
  Administrativo: ["ADMINISTRATIVO", "ALOJAMENTO", "LOGISTICA", "OFICINA", "ADM"],
  Operacional: ["GOMAN", "GSTC"],
};

function nomeBase(code: string) {
  return BASE_NOME[code] ? `${BASE_NOME[code]} (${code})` : code;
}

function matchTipoPoc(auditagem: string | undefined) {
  const sel = valores(filters.tipoPoc);
  if (!sel.length) return true;
  const allowed = sel.flatMap((t) => TIPO_AUDITAGEM[t] ?? []);
  if (!allowed.length) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function isSegurancaSub(sub: SubmissionRow, idx: ReturnType<typeof indexEmployees>) {
  const emp = matchSubmissionToEmployee(sub, idx);
  return metaRoleFrom(emp?.gerencia ?? sub.auditagem, emp?.funcao) === "tecnico";
}

function resetSlice() {
  filters.semana = "Todos";
  filters.gerencia = "Todos";
  filters.base = "Todos";
  filters.tipoPoc = "Todos";
  filters.seguranca = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  viz.equipe = null;
  viz.categoria = null;
}

type EcClick = {
  componentType?: string;
  dataIndex?: number;
  name?: string; event?: { event?: unknown } };

function onMesClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  const mes = mesesDoAno.value[p.dataIndex ?? -1]?.mes ?? 0;
  if (mes < 1 || mes > 12) return;
  filters.mes = alternarMinimo(filters.mes, String(mes), eventoDe(p));
}

function onBaseClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.base = alternar(filters.base, p.name, eventoDe(p));
}

function onGerenciaClick(p: EcClick) {
  if (p.componentType !== "series" || !p.name) return;
  filters.gerencia = alternar(filters.gerencia, p.name, eventoDe(p));
}

function onEquipeClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = equipeRows.value[p.dataIndex ?? -1];
  if (!row) return;
  viz.equipe = viz.equipe === row.equipe ? null : row.equipe;
}

function onCategoriaClick(p: EcClick) {
  if (p.componentType !== "series") return;
  const row = categoriaRows.value[p.dataIndex ?? -1];
  if (!row) return;
  viz.categoria = viz.categoria === row.cat ? null : row.cat;
}

const mesLabel = computed(() => valores(filters.mes).map((v) => meses.find((m) => String(m.value) === v)?.label ?? v).join(", "));
const semanaLabel = computed(() => valores(filters.semana).map((v) => semanas.value.find((s) => String(s.value) === v)?.label ?? v).join(", "));
const hasActiveFilters = computed(() =>
  ativo(filters.semana)
  || filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.tipoPoc !== "Todos"
  || filters.seguranca !== "Todos"
  || !!viz.equipe
  || !!viz.categoria,
);

// ─── Hierarquia da EQUIPE (coordenador, gerente, gerência, base) ──────────────
// Gerência, base, coordenador e gerente olham a equipe do checklist (como o BI), não o cadastro do observador.
const hierEquipes = shallowRef(new Map<string, EquipeHier>());
fetchHierarquiaEquipes().then((m) => { hierEquipes.value = m; });

/** Gerente de cada coordenador (o mais comum no cadastro), para equipes sem gerente informado. */
const gerenteDoCoordenador = computed(() => {
  const cont = new Map<string, Map<string, number>>();
  for (const e of employees.value) {
    const c = foldName(e.coordenador ?? "");
    const g = (e.gerente ?? "").trim();
    if (!c || !g) continue;
    const m = cont.get(c) ?? new Map<string, number>();
    m.set(g, (m.get(g) ?? 0) + 1);
    cont.set(c, m);
  }
  const out = new Map<string, string>();
  for (const [c, m] of cont) out.set(c, [...m.entries()].sort((a, b) => b[1] - a[1])[0]![0]);
  return out;
});

function gerenciaDaSub(sub: SubmissionRow): string {
  return (hierarquiaDaEquipe(hierEquipes.value, sub.equipe)?.gerencia || sub.auditagem || "").toUpperCase();
}

function baseDaSub(sub: SubmissionRow): string {
  return (hierarquiaDaEquipe(hierEquipes.value, sub.equipe)?.base || sub.base || "").toUpperCase();
}

function passaCoordenadorGerente(sub: SubmissionRow): boolean {
  const coords = valores(filters.coordenador);
  const gerentes = valores(filters.gerente);
  if (!coords.length && !gerentes.length) return true;
  const h = hierarquiaDaEquipe(hierEquipes.value, sub.equipe);
  const coordDaEquipe = foldName(h?.coordenador ?? "");
  if (coords.length && !coords.some((c) => foldName(c) === coordDaEquipe)) return false;
  if (gerentes.length) {
    const g = foldName(h?.gerente || gerenteDoCoordenador.value.get(coordDaEquipe) || "");
    if (!gerentes.some((x) => foldName(x) === g)) return false;
  }
  return true;
}

function applySlice(
  source: SubmissionRow[],
  omit: { week?: boolean; base?: boolean; gerencia?: boolean; tipo?: boolean; seguranca?: boolean; equipe?: boolean } = {},
) {
  const idx = indexEmployees(employees.value);
  let s = source;
  if (filters.coordenador !== "Todos" || filters.gerente !== "Todos") s = s.filter(passaCoordenadorGerente);
  if (!omit.gerencia && ativo(filters.gerencia)) {
    const alvo = valores(filters.gerencia).map((x) => x.toUpperCase());
    s = s.filter((sub) => alvo.includes(gerenciaDaSub(sub)));
  }
  if (!omit.week && ativo(filters.semana)) {
    s = s.filter((sub) => casa(filters.semana, String(semanaDaSub(sub))));
  }
  if (!omit.base && ativo(filters.base)) {
    const alvo = valores(filters.base).map((x) => x.toUpperCase());
    s = s.filter((sub) => alvo.includes(baseDaSub(sub)));
  }
  if (!omit.tipo && ativo(filters.tipoPoc)) {
    s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  }
  if (!omit.seguranca && filters.seguranca === "Segurança") {
    s = s.filter((sub) => isSegurancaSub(sub, idx));
  }
  if (!omit.equipe && viz.equipe) {
    s = s.filter((sub) => (sub.equipe ?? "Sem equipe") === viz.equipe);
  }
  return s;
}

function ncIdSet(resps: ResponseRow[]) {
  const ids = new Set<string>();
  for (const r of resps) {
    if (r.resposta === "nao_conforme") ids.add(r.submission_id);
  }
  return ids;
}

// Respostas indexadas por checklist (uma vez por carga): evita varrer todas as respostas a cada gráfico.
const respsIndexCache = new WeakMap<ResponseRow[], Map<string, ResponseRow[]>>();
function indexarRespostas(all: ResponseRow[]): Map<string, ResponseRow[]> {
  let m = respsIndexCache.get(all);
  if (!m) {
    m = new Map();
    for (const r of all) {
      const lista = m.get(r.submission_id);
      if (lista) lista.push(r); else m.set(r.submission_id, [r]);
    }
    respsIndexCache.set(all, m);
  }
  return m;
}

/** Chave da categoria sem diferenciar maiúsculas (o banco tem "PROCEDIMENTO" e "Procedimento" para a mesma categoria). */
function catKey(c: string | null | undefined): string {
  return (c ?? "Sem categoria").trim().toLowerCase();
}

function respsOf(subs: SubmissionRow[], allResps: ResponseRow[], omitCat = false) {
  const idx = indexarRespostas(allResps);
  let r: ResponseRow[] = [];
  for (const s of subs) {
    const lista = idx.get(s.id);
    if (lista) for (const x of lista) r.push(x);
  }
  if (!omitCat && viz.categoria) {
    const alvo = catKey(viz.categoria);
    r = r.filter((resp) => catKey(resp.categoria) === alvo);
  }
  return r;
}

const slicedSubs = computed(() => applySlice(submissions.value));
const filteredSubs = slicedSubs;
const filteredResps = computed(() => respsOf(filteredSubs.value, responses.value));

const subsNoBase = computed(() => applySlice(submissions.value, { base: true }));
const subsNoGerencia = computed(() => applySlice(submissions.value, { gerencia: true }));
const subsNoEquipe = computed(() => applySlice(submissions.value, { equipe: true }));

const totalConformes    = computed(() => filteredResps.value.filter(r => r.resposta === "conforme").length);
const totalNaoConformes = computed(() => filteredResps.value.filter(r => r.resposta === "nao_conforme").length);
const conformidadeIndex = computed(() => {
  const t = filteredResps.value.length;
  return t ? totalConformes.value / t : 0;
});
const equipesAuditadas = computed(() => new Set(filteredSubs.value.map(s => s.equipe).filter(Boolean)).size);

const checklistIndex = computed(() => {
  const t = filteredSubs.value.length;
  const ncIds = ncIdSet(filteredResps.value);
  const sem = filteredSubs.value.filter((s) => !ncIds.has(s.id)).length;
  return t ? sem / t : 0;
});

const kpiNcIds = computed(() => ncIdSet(filteredResps.value));
const kpiSemNc = computed(() => filteredSubs.value.filter((s) => !kpiNcIds.value.has(s.id)).length);
const kpiComNc = computed(() => filteredSubs.value.filter((s) => kpiNcIds.value.has(s.id)).length);

const kpis = computed(() => [
  { label: "Conformidade",     value: fmtN(kpiSemNc.value),            icon: "mdi-check-circle",  color: "positive", hex: "#16a34a" },
  { label: "Inconformidade",   value: fmtN(kpiComNc.value),            icon: "mdi-alert-circle",  color: "negative", hex: "#dc2626" },
  { label: "Índice Geral",     value: fmtPct(checklistIndex.value),    icon: "mdi-gauge",         color: "teal",     hex: "#0d9488" },
  { label: "Equipes Auditadas",value: fmtN(equipesAuditadas.value),    icon: "mdi-account-group", color: "primary",  hex: "#0284c7" },
]);

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

function mesDaData(data: string) {
  const m = /^(\d{4})-(\d{2})/.exec(data);
  return m ? Number(m[2]) : 0;
}

/** Meta de ICIT: a partir dela a barra/célula é verde. */
const ICIT_META = 80;

function icitPct(subs: SubmissionRow[], resps: ResponseRow[]) {
  if (!subs.length) return 0;
  const nc = ncIdSet(resps);
  const sem = subs.filter((s) => !nc.has(s.id)).length;
  const pct = Math.round((sem / subs.length) * 100);
  return sem < subs.length ? Math.min(pct, 99) : pct;
}

/**
 * ICIT por grupo (gerência, base, equipe…): % de checklists sem nenhuma não conformidade, o mesmo critério do
 * gráfico por mês e dos cartões. Só mostra 100% quando nenhum checklist do grupo tem não conformidade.
 */
function indicePorGrupo(subs: SubmissionRow[], resps: ResponseRow[], chave: (s: SubmissionRow) => string): Map<string, number> {
  const nc = ncIdSet(resps);
  const acc = new Map<string, { sem: number; total: number }>();
  for (const s of subs) {
    const g = chave(s);
    let a = acc.get(g);
    if (!a) { a = { sem: 0, total: 0 }; acc.set(g, a); }
    a.total++;
    if (!nc.has(s.id)) a.sem++;
  }
  const out = new Map<string, number>();
  for (const [g, a] of acc) {
    const pct = Math.round((a.sem / a.total) * 100);
    out.set(g, a.sem < a.total ? Math.min(pct, 99) : pct);
  }
  return out;
}

function hBar(
  rows: { name: string; value: number }[],
  selected: string | null,
  color = P.conf,
  suffix = "%",
  maxVal = 100,
  foot = "Clique para filtrar as outras visões",
) {
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: suffix === "%" ? "ICIT" : "Ocorrências", value: `${p.value}${suffix}`, color },
        ], foot),
    },
    grid: { left: 12, right: 44, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, max: maxVal, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: rows.map((r) => r.name),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 11 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: rows.map((r) => ({
        value: r.value,
        itemStyle: {
          color: suffix === "%" && r.value < ICIT_META ? P.abaixo : color,
          opacity: !ativo(selected) || marcado(selected, r.name) ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
          shadowColor: "rgba(0,0,0,.06)",
          shadowBlur: 4,
        },
      })),
      barMaxWidth: 28,
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const,
        color,
        formatter: (p: { value: number }) => `${p.value}${suffix}`,
      },
    }],
  };
}

const yearSliced = computed(() => applySlice(yearSubs.value));

/** Meses do ano com checklists (ICIT = checklists sem não conformidade / total do mês). */
const mesesDoAno = computed(() => {
  const groups: SubmissionRow[][] = Array.from({ length: 12 }, () => []);
  for (const s of yearSliced.value) {
    const m = mesDaData(s.data);
    if (m >= 1 && m <= 12) groups[m - 1]!.push(s);
  }
  return meses
    .map((m, i) => ({
      mes: m.value,
      label: `${m.label}/${String(filters.ano).slice(2)}`,
      n: groups[i]!.length,
      value: icitPct(groups[i]!, respsOf(groups[i]!, yearResps.value)),
    }))
    .filter((r) => r.n > 0);
});

const chartMes = computed(() => {
  const rows = mesesDoAno.value;
  const vals = rows.map((r) => r.value);
  const minV = Math.min(...vals, 100);
  const maxV = Math.max(...vals, 0);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number }) => {
        const r = rows[p.dataIndex];
        if (!r) return "";
        return tipHtml(r.label, [
          { label: "ICIT", value: `${r.value}%`, color: P.conf },
          { label: "Checklists", value: fmtN(r.n) },
        ], "Clique para abrir o recorte daquele mês");
      },
    },
    grid: { left: 28, right: 28, top: 40, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: rows.map((r) => r.label),
      boundaryGap: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.inconf, fontWeight: "bold" as const, fontSize: 11, interval: 0 },
    },
    yAxis: { type: "value" as const, show: false, splitLine: { show: false }, min: Math.max(0, minV - 14), max: Math.min(110, maxV + 12) },
    series: [{
      type: "line" as const,
      cursor: "pointer",
      symbol: "circle",
      lineStyle: { color: chartInk.muted, width: 3 },
      data: rows.map((r, i) => {
        const ant = i > 0 ? rows[i - 1]!.value : null;
        const prox = i < rows.length - 1 ? rows[i + 1]!.value : null;
        // Vale (abaixo do mês anterior e não acima do próximo) leva o rótulo embaixo, como no BI.
        const vale = ant !== null && r.value < ant && (prox === null || r.value <= prox);
        const sel = marcado(filters.mes, String(r.mes));
        return {
          value: r.value,
          symbolSize: sel ? 15 : 11,
          itemStyle: {
            color: r.value < ICIT_META ? (sel ? "#b45309" : P.abaixo) : sel ? "#166534" : "#35b00f",
            borderColor: chartInk.halo, borderWidth: 2,
          },
          label: { position: vale ? ("bottom" as const) : ("top" as const) },
        };
      }),
      label: {
        show: true,
        fontSize: 11, fontWeight: "bold" as const, color: chartInk.axis,
        backgroundColor: "rgba(148,163,184,.22)", borderRadius: 4, padding: [2, 6],
        distance: 10,
        formatter: (p: { value: number }) => `${p.value}%`,
      },
      emphasis: { scale: true },
    }],
  };
});

const chartGerencia = computed(() => {
  const resps = respsOf(subsNoGerencia.value, responses.value);
  const rows = [...indicePorGrupo(subsNoGerencia.value, resps, (s) => gerenciaDaSub(s) || "Outro").entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.value - b.value);
  return hBar(rows, filters.gerencia !== "Todos" ? filters.gerencia : null, P.conf, "%", 100, "Clique para filtrar a gerência");
});

const chartBase = computed(() => {
  const resps = respsOf(subsNoBase.value, responses.value);
  const rows = [...indicePorGrupo(subsNoBase.value, resps, (s) => baseDaSub(s) || "Outra").entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const selected = filters.base !== "Todos" ? filters.base : null;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(nomeBase(p.name), [{ label: "ICIT", value: `${p.value}%`, color: P.conf }], "Clique para ver só esta base"),
    },
    grid: { left: 8, right: 8, top: 36, bottom: 28 },
    xAxis: {
      type: "category" as const,
      data: rows.map((r) => r.name),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.inconf, fontWeight: "bold" as const, fontSize: 11 },
    },
    yAxis: { type: "value" as const, show: false, splitLine: { show: false }, min: 0, max: 100 },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      barMaxWidth: 40,
      data: rows.map((r) => ({
        value: r.value,
        itemStyle: {
          color: r.value >= ICIT_META ? P.conf : P.abaixo,
          opacity: !ativo(selected) || marcado(selected, r.name) ? 1 : 0.22,
          borderRadius: [6, 6, 0, 0],
        },
      })),
      emphasis: { itemStyle: { opacity: 0.85 } },
      label: {
        show: true, position: "top" as const,
        fontSize: 11, fontWeight: "bold" as const, color: chartInk.axis,
        backgroundColor: "rgba(148,163,184,.22)", borderRadius: 4, padding: [2, 6],
        formatter: (p: { value: number }) => `${p.value}%`,
      },
    }],
  };
});

const categoriaRows = computed(() => {
  // Agrupa sem diferenciar maiúsculas; o rótulo é a grafia mais usada no banco.
  const grupos = new Map<string, { nc: number; grafias: Map<string, number> }>();
  for (const r of respsOf(filteredSubs.value, responses.value, true)) {
    if (r.resposta !== "nao_conforme") continue;
    const cat = r.categoria ?? "Sem categoria";
    const k = catKey(cat);
    const g = grupos.get(k) ?? { nc: 0, grafias: new Map<string, number>() };
    g.nc++;
    g.grafias.set(cat, (g.grafias.get(cat) ?? 0) + 1);
    grupos.set(k, g);
  }
  return [...grupos.values()]
    .map((g) => ({ cat: [...g.grafias.entries()].sort((a, b) => b[1] - a[1])[0]![0], nc: g.nc }))
    .sort((a, b) => a.nc - b.nc);
});

const chartCategoria = computed(() => {
  const rows = categoriaRows.value;
  const maxV = Math.max(...rows.map((e) => e.nc), 1);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number; value: number }) => {
        const o = rows[p.dataIndex];
        if (!o) return "";
        return tipHtml(o.cat, [
          { label: "Não conformes", value: String(p.value), color: P.inconf },
        ], "Clique para filtrar esta categoria");
      },
    },
    grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: rows.map((e) => e.cat),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 11 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: rows.map((e) => ({
        value: e.nc,
        itemStyle: {
          color: e.nc <= 2 ? P.inconfLt : `rgba(139,28,43,${0.6 + (e.nc / maxV) * 0.4})`,
          opacity: !viz.categoria || catKey(viz.categoria) === catKey(e.cat) ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 28,
      emphasis: { itemStyle: { opacity: 0.8 } },
      label: {
        opacity: 1, // o número não esmaece com a barra (ficaria cinza no fundo branco)
        show: true, position: "right" as const,
        fontSize: 12, fontWeight: "bold" as const,
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

/** Tolerância Zero: não conformidade das perguntas da lista oficial (a mesma da página Tolerância Zero). */
const toleranciaRows = computed(() => {
  const m: Record<string, number> = {};
  for (const r of ocorrenciasTz(respsOf(filteredSubs.value, responses.value, true), mapaTz.value)) {
    const q = r.pergunta ?? "Sem descrição";
    m[q] = (m[q] ?? 0) + 1;
  }
  return Object.entries(m)
    .map(([pergunta, nc]) => ({ pergunta, nc }))
    .sort((a, b) => a.nc - b.nc);
});

const chartTolerancia = computed(() => {
  const rows = toleranciaRows.value;
  const visiveis = 10;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { dataIndex: number; value: number }) => {
        const o = rows[p.dataIndex];
        if (!o) return "";
        return tipHtml(o.pergunta, [{ label: "Não conformes", value: String(p.value), color: P.inconf }]);
      },
    },
    grid: { left: 12, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const, data: rows.map((r) => r.pergunta),
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 10, width: 170, overflow: "truncate" as const },
    },
    dataZoom: [{
      type: "inside" as const,
      orient: "vertical" as const,
      startValue: Math.max(0, rows.length - visiveis),
      endValue: Math.max(0, rows.length - 1),
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true,
    }],
    series: [{
      type: "bar" as const,
      data: rows.map((r) => ({ value: r.nc, itemStyle: { color: P.inconf, borderRadius: [0, 6, 6, 0] } })),
      barMaxWidth: 22,
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const, color: chartInk.axis,
        backgroundColor: "rgba(148,163,184,.22)", borderRadius: 4, padding: [2, 6],
        formatter: (p: { value: number }) => `${p.value}`,
      },
    }],
  };
});

const equipeRows = computed(() => {
  const resps = respsOf(subsNoEquipe.value, responses.value);
  return [...indicePorGrupo(subsNoEquipe.value, resps, (s) => s.equipe ?? "Sem equipe").entries()]
    .map(([equipe, value]) => ({ equipe, value }))
    .sort((a, b) => a.value - b.value);
});

/** Cada equipe ocupa uma linha de altura fixa; a lista rola dentro do cartão (barra de rolagem, roda do mouse ou toque). */
const ALTURA_LINHA_EQUIPE = 28;
const alturaEquipe = computed(() => Math.max(equipeRows.value.length, 1) * ALTURA_LINHA_EQUIPE + 8);

const chartEquipe = computed(() => {
  const data = equipeRows.value.length ? equipeRows.value : [{ equipe: "Sem dados", value: 0 }];
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "ICIT", value: `${p.value}%`, color: p.value >= ICIT_META ? P.conf : P.abaixo },
        ], "Clique para filtrar esta equipe"),
    },
    grid: { left: 12, right: 52, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value" as const, max: 100, show: false, splitLine: { show: false } },
    yAxis: {
      type: "category" as const,
      data: data.map((e) => e.equipe),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { color: chartInk.axis, fontSize: 10 },
    },
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: data.map((e) => ({
        value: e.value,
        itemStyle: {
          color: e.value >= ICIT_META ? P.conf : P.abaixo,
          opacity: !viz.equipe || viz.equipe === e.equipe ? 1 : 0.22,
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barMaxWidth: 18,
      emphasis: { itemStyle: { opacity: 0.8 } },
      label: {
        opacity: 1, // o número não esmaece com a barra (ficaria cinza no fundo branco)
        show: true, position: "right" as const,
        fontSize: 10, fontWeight: "bold" as const,
        formatter: (p: { value: number }) => `${p.value}%`,
      },
    }],
  };
});

</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$border:       #e2e8f0;
$label-color:  #94a3b8;

.icit-page {
  background: #f8fafc;
  min-height: 100vh;
}

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

.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  height: 30px; padding: 0 12px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;

  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand, .05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35); font-weight: 600;
  }
}

.fgroup--gerente { min-width: 180px; }
.gerente-select {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg; padding: 0 10px 0 4px;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) { border-color: $brand; box-shadow: 0 0 0 2px rgba($brand,.15); }
  :deep(.q-field__native) { font-size: 12px; font-weight: 500; color: $inactive-text; padding: 0; min-height: unset; line-height: 30px; }
  :deep(.q-field__append) { height: 30px; .q-icon { font-size: 16px; color: $label-color; } }
  :deep(.q-field__prepend) { height: 30px; padding-right: 4px; }
}
.gerente-icon { color: $label-color; }
:global(.gerente-popup .q-item) { font-size: 12px; min-height: 32px; padding: 4px 12px; }
:global(.gerente-popup .q-item--active) { color: $brand !important; font-weight: 600; }

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

  &:hover {
    color: $brand;
    border-color: $brand;
  }
}

.chart-hit { cursor: pointer; }

.kpi-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.historico-card {
  border: 1.5px solid rgba(139,28,43,.2);
  background: linear-gradient(135deg, #fff9f9 0%, #fff 100%);
  &:hover {
    box-shadow: 0 4px 20px rgba(139,28,43,.2);
    border-color: rgba(139,28,43,.4);
  }
}
.body--dark .historico-card {
  background: linear-gradient(135deg, rgba(139,28,43,.15) 0%, rgba(30,41,59,.8) 100%);
  border-color: rgba(139,28,43,.4);
  &:hover {
    box-shadow: 0 4px 20px rgba(139,28,43,.3);
    border-color: rgba(139,28,43,.6);
  }
}

.equipe-col { display: flex; flex-direction: column; }
.equipe-card { height: 100%; display: flex; flex-direction: column; }
.equipe-body { flex: 1; min-height: 420px; position: relative; padding-bottom: 12px; }
.equipe-scroll {
  position: absolute; inset: 0 8px 12px 16px;
  overflow-y: auto; overflow-x: hidden;
}

.body--dark {
  .icit-page   { background: #0f172a; }
  .filter-bar  { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label  { color: #64748b; }
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

