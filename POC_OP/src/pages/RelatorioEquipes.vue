<template>
  <q-page class="relatorio-page">
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
          <div class="fgroup fgroup--gerente">
            <span class="fgroup__label">Coordenador</span>
            <q-select v-model="filters.coordenador" :options="coordenadoresOpts"
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
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ filters.mes }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ nomeBase(filters.base) }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip">{{ filters.gerente }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip">{{ filters.coordenador }}</span>
          <span v-if="filters.tipoPoc !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.tipoPoc = 'Todos'">{{ filters.tipoPoc }}</span>
          <span v-if="filters.funcao !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.funcao = 'Todos'">{{ filters.funcao }}</span>
          <span v-if="filters.categoria !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.categoria = 'Todos'">{{ filters.categoria }}</span>
          <span v-if="filters.prefixo !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.prefixo = 'Todos'">{{ filters.prefixo }}</span>
          <span v-if="filters.observador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.observador = 'Todos'">{{ filters.observador }}</span>
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
      <div class="kpi-sticky">
      <div class="row q-col-gutter-sm q-mb-none items-stretch">
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
              <div class="kpi-stat-value" style="color:#ea580c">{{ rosterPrefixes.length }}</div>
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
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-ring" :style="{ '--p': taxaContato + '%' }" />
              <div class="kpi-stat-value" style="color:#8B1C2B">{{ taxaContato }}%</div>
              <div class="kpi-stat-label">Taxa de Contato</div>
              <div class="kpi-stat-sub">{{ visitadasSorted.length }} de {{ rosterPrefixes.length }} equipes</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      </div>

      <!-- CHARTS GRID (4 cols) -->
      <div class="row q-col-gutter-md items-stretch rel-grid">

        <!-- Col 1: Equipes Visitadas -->
        <div class="col-12 col-md-3 rel-col">
          <q-card flat bordered class="chart-card chart-card--vertical">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Equipes Visitadas</div>
              <div class="text-h5 text-weight-bold" style="color:#16a34a">{{ visitadasSorted.length }}</div>
              <div class="text-caption text-grey-6">Clique no prefixo para filtrar</div>
            </q-card-section>
            <q-card-section class="q-pt-none rel-fill">
              <v-chart class="chart-hit rel-chart" :option="chartVisitadas" :update-options="{ notMerge: true }" autoresize @click="onPrefixoClick" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 2: Equipes Não Visitadas -->
        <div class="col-12 col-md-2 rel-col">
          <q-card flat bordered class="chart-card chart-card--vertical">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Equipes Não Visitadas</div>
              <div class="text-h5 text-weight-bold" style="color:#dc2626">{{ naoVisitadas.length }}</div>
              <div class="text-caption text-grey-6">Clique para ver só essa equipe</div>
            </q-card-section>
            <q-card-section class="q-pt-xs nv-list-wrap">
              <div
                v-for="eq in naoVisitadas" :key="eq"
                class="nv-row"
                :class="{ 'nv-row--on': filters.prefixo === eq }"
                @click="togglePrefixo(eq)"
              >
                <span class="nv-nome">{{ eq }}</span>
                <span class="nv-zero">0</span>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 3: Ranking NC Equipes + NC por Categoria -->
        <div class="col-12 col-md-3 rel-col rel-stack">
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Ranking de Equipes com Não Conformidades</div>
              <div class="text-caption text-grey-6">Clique · use a barra para ver todas</div>
            </q-card-section>
            <q-card-section class="q-pt-none rel-fill">
              <v-chart class="chart-hit rel-chart" :option="chartRankingNcEq" :update-options="{ notMerge: true }" autoresize @click="onPrefixoClick" />
            </q-card-section>
          </q-card>
          <q-card flat bordered class="chart-card">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Não Conformidades por Categoria</div>
              <div class="text-caption text-grey-6">Clique · use a barra para ver todas</div>
            </q-card-section>
            <q-card-section class="q-pt-none rel-fill">
              <v-chart class="chart-hit rel-chart" :option="chartNcCat" :update-options="{ notMerge: true }" autoresize @click="onCategoriaClick" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 4: Matriz ICIT por Equipe -->
        <div class="col-12 col-md-4 rel-col">
          <q-card flat bordered class="chart-card chart-card--vertical">
            <q-card-section class="q-pb-xs">
              <div class="text-subtitle1 text-weight-bold">Matriz ICIT por Equipe</div>
              <div class="text-caption text-grey-6">
                % de checklists sem NC · clique na linha para filtrar o prefixo
              </div>
            </q-card-section>
            <q-card-section class="q-pt-none rel-fill">
              <q-table
                :rows="icitTableRows"
                :columns="icitColumns"
                row-key="prefixo"
                flat
                dense
                :rows-per-page-options="[0]"
                hide-pagination
                class="icit-table"
                virtual-scroll
                :row-class="icitRowClass"
                @row-click="onIcitRow"
              >
                <template #body-cell-icitAnterior="props">
                  <q-td :props="props">
                    <span :class="['icit-badge', icitBadgeClass(props.value)]">
                      {{ props.value === null ? "—" : `${props.value.toFixed(2)}%` }}
                    </span>
                  </q-td>
                </template>
                <template #body-cell-icitAtual="props">
                  <q-td :props="props">
                    <span :class="['icit-badge', icitBadgeClass(props.value)]">
                      {{ props.value === null ? "—" : `${props.value.toFixed(2)}%` }}
                    </span>
                  </q-td>
                </template>
                <template #body-cell-icitAcumulado="props">
                  <q-td :props="props">
                    <span :class="['icit-badge', icitBadgeClass(props.value)]">
                      {{ props.value === null ? "—" : `${props.value.toFixed(2)}%` }}
                    </span>
                  </q-td>
                </template>
              </q-table>
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
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, fetchIcitPorPrefixo, indexEmployees, matchSubmissionToEmployee, type IcitPrefixo, filterByCoordenador } from "@/lib/dashboard";
import { lerTipoPoc, salvarTipoPoc } from "@/lib/tipo-poc";

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, DataZoomComponent]);

const {
  loading,
  responses, submissions, employees,
  load,
  gerentesOpts,
  coordenadoresOpts,
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
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
const funcaoOpts   = ["Todos","Eletricista","Motorista","Operador","Técnico"];
const tiposPoc     = ["Todos","Administrativo","Operacional","Alojamento"];

const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  mes: curMesLabel, ano: String(now.getFullYear()), categoria: "Todos",
  base: "Todos", prefixo: "Todos", gerencia: "Todos",
  gerente: "Todos", coordenador: "Todos", observador: "Todos", funcao: "Todos",
  tipoPoc: lerTipoPoc(tiposPoc),
});
watch(() => filters.tipoPoc, salvarTipoPoc);

// ─── ICIT (checklists sem NC) por prefixo: mês anterior + acumulado do ano ────
const icitMesAnterior = ref<Map<string, IcitPrefixo>>(new Map());
const icitAcumulado    = ref<Map<string, IcitPrefixo>>(new Map());

async function recarregar() {
  const mesNum = MONTH_MAP[filters.mes.slice(0, 3)] ?? (now.getMonth() + 1);
  const anoNum = Number(filters.ano);

  await load({ ano: anoNum, mes: mesNum, contarMeta: true });

  const anteriorMes = mesNum === 1 ? 12 : mesNum - 1;
  const anteriorAno = mesNum === 1 ? anoNum - 1 : anoNum;
  const anteriorStart = new Date(anteriorAno, anteriorMes - 1, 1).toISOString();
  const anteriorEnd   = new Date(anteriorAno, anteriorMes, 1).toISOString();

  const acumuladoStart = new Date(anoNum, 0, 1).toISOString();
  const acumuladoEnd   = new Date(anoNum, mesNum, 1).toISOString();

  [icitMesAnterior.value, icitAcumulado.value] = await Promise.all([
    fetchIcitPorPrefixo(anteriorStart, anteriorEnd),
    fetchIcitPorPrefixo(acumuladoStart, acumuladoEnd),
  ]);
}
onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);

const BASE_NOME: Record<string, string> = {
  BCB: "Bacabal", BDC: "Barra do Corda", ITM: "Imperatriz",
  PDS: "Pedreiras", PDT: "Presidente Dutra", STI: "Santa Inês",
};

const TIPO_AUDITAGEM: Record<string, string[]> = {
  Administrativo: ["ADMINISTRATIVO", "LOGISTICA", "OFICINA", "ADM"],
  Operacional: ["GOMAN", "GSTC"],
  Alojamento: ["ALOJAMENTO"],
};

function nomeBase(code: string) {
  return BASE_NOME[code] ? `${BASE_NOME[code]} (${code})` : code;
}

function prefixBase(code: string) {
  const m = /^MA-([A-Z]{3})-/.exec(code);
  return m?.[1] ?? "";
}

function matchTipoPoc(auditagem: string | undefined) {
  const allowed = TIPO_AUDITAGEM[filters.tipoPoc];
  if (!allowed) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function extractPrefixo(equipe: string | undefined): string {
  if (!equipe) return "";
  return equipe.split(" - ")[0].trim();
}

function togglePrefixo(code: string) {
  filters.prefixo = filters.prefixo === code ? "Todos" : code;
}

type EcClick = { componentType?: string; dataIndex?: number; name?: string };

function onPrefixoClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name?.trim() || p.name === "Sem dados") return;
  togglePrefixo(p.name);
}

function onCategoriaClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name?.trim()) return;
  filters.categoria = filters.categoria === p.name ? "Todos" : p.name;
}

function onIcitRow(_evt: unknown, row: { prefixo: string }) {
  togglePrefixo(row.prefixo);
}

function icitRowClass(row: { prefixo: string }) {
  return filters.prefixo === row.prefixo ? "icit-row--on" : "";
}

function resetSlice() {
  filters.base = "Todos";
  filters.gerencia = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  filters.tipoPoc = "Todos";
  filters.funcao = "Todos";
  filters.categoria = "Todos";
  filters.prefixo = "Todos";
  filters.observador = "Todos";
}

const hasActiveFilters = computed(() =>
  filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.tipoPoc !== "Todos"
  || filters.funcao !== "Todos"
  || filters.categoria !== "Todos"
  || filters.prefixo !== "Todos"
  || filters.observador !== "Todos",
);

function applySlice(
  source: typeof submissions.value,
  omit: { base?: boolean; gerencia?: boolean; prefixo?: boolean; tipo?: boolean; funcao?: boolean; observador?: boolean } = {},
) {
  const idx = indexEmployees(employees.value);
  let s = filterByGerente(source, employees.value, filters.gerente);
  s = filterByCoordenador(s, employees.value, filters.coordenador);
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.base && filters.base !== "Todos") s = s.filter((sub) => sub.base === filters.base);
  if (!omit.tipo) s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  if (!omit.funcao && filters.funcao !== "Todos") {
    s = s.filter((sub) => matchSubmissionToEmployee(sub, idx)?.funcao === filters.funcao);
  }
  if (!omit.observador && filters.observador !== "Todos") {
    s = s.filter((sub) => sub.observador === filters.observador);
  }
  if (!omit.prefixo && filters.prefixo !== "Todos") {
    s = s.filter((sub) => extractPrefixo(sub.equipe) === filters.prefixo);
  }
  return s;
}

const filteredSubs = computed(() => applySlice(submissions.value));
const subsNoPrefixo = computed(() => applySlice(submissions.value, { prefixo: true }));

const observadorOpts = computed(() => {
  const names = [...new Set(submissions.value.map((s) => s.observador).filter(Boolean))].sort();
  return ["Todos", ...names];
});

const filteredResps = computed(() => {
  const ids = new Set(filteredSubs.value.map(s => s.id));
  let r = responses.value.filter(resp => ids.has(resp.submission_id));
  if (filters.categoria !== "Todos") {
    r = r.filter(resp => resp.categoria === filters.categoria);
  }
  return r;
});

const respsNoCat = computed(() => {
  const ids = new Set(filteredSubs.value.map(s => s.id));
  return responses.value.filter(resp => ids.has(resp.submission_id));
});

const totalSubmissions = computed(() => filteredSubs.value.length);

// ─── Roster de alojamentos (prefixo → base) ──────────────────────────────────
const ALOJ_ROSTER: Array<{ prefixo: string; base: string }> = [
  { prefixo: "ALOJ01", base: "BCB" }, { prefixo: "ALOJ03", base: "BCB" },
  { prefixo: "ALOJ04", base: "BCB" }, { prefixo: "ALOJ05", base: "BCB" },
  { prefixo: "ALOJ06", base: "BCB" }, { prefixo: "ALOJ07", base: "BCB" },
  { prefixo: "ALOJ08", base: "BCB" }, { prefixo: "ALOJ10", base: "BCB" },
  { prefixo: "ALOJ11", base: "BCB" }, { prefixo: "ALOJ64", base: "BCB" },
  { prefixo: "ALOJ75", base: "BCB" }, { prefixo: "ALOJ76", base: "BCB" },
  { prefixo: "ALOJ13", base: "BDC" }, { prefixo: "ALOJ15", base: "BDC" },
  { prefixo: "ALOJ27", base: "BDC" }, { prefixo: "ALOJ58", base: "BDC" },
  { prefixo: "ALOJ62", base: "BDC" }, { prefixo: "ALOJ66", base: "BDC" },
  { prefixo: "ALOJ67", base: "BDC" }, { prefixo: "ALOJ69", base: "BDC" },
  { prefixo: "ALOJ77", base: "BDC" }, { prefixo: "ALOJ78", base: "BDC" },
  { prefixo: "ALOJ14", base: "PDT" }, { prefixo: "ALOJ16", base: "PDT" },
  { prefixo: "ALOJ17", base: "PDT" }, { prefixo: "ALOJ19", base: "PDT" },
  { prefixo: "ALOJ20", base: "PDT" }, { prefixo: "ALOJ21", base: "PDT" },
  { prefixo: "ALOJ22", base: "PDT" }, { prefixo: "ALOJ23", base: "PDT" },
  { prefixo: "ALOJ28", base: "PDT" }, { prefixo: "ALOJ70", base: "PDT" },
  { prefixo: "ALOJ30", base: "STI" }, { prefixo: "ALOJ31", base: "STI" },
  { prefixo: "ALOJ32", base: "STI" }, { prefixo: "ALOJ33", base: "STI" },
  { prefixo: "ALOJ35", base: "STI" }, { prefixo: "ALOJ36", base: "STI" },
  { prefixo: "ALOJ37", base: "STI" }, { prefixo: "ALOJ38", base: "STI" },
  { prefixo: "ALOJ39", base: "STI" }, { prefixo: "ALOJ61", base: "STI" },
  { prefixo: "ALOJ63", base: "STI" }, { prefixo: "ALOJ72", base: "STI" },
  { prefixo: "ALOJ73", base: "STI" }, { prefixo: "ALOJ74", base: "STI" },
  { prefixo: "ALOJ79", base: "STI" },
  { prefixo: "ALOJ40", base: "ITM" }, { prefixo: "ALOJ41", base: "ITM" },
  { prefixo: "ALOJ42", base: "ITM" }, { prefixo: "ALOJ43", base: "ITM" },
  { prefixo: "ALOJ45", base: "ITM" }, { prefixo: "ALOJ46", base: "ITM" },
  { prefixo: "ALOJ47", base: "ITM" }, { prefixo: "ALOJ48", base: "ITM" },
  { prefixo: "ALOJ49", base: "PDS" }, { prefixo: "ALOJ50", base: "PDS" },
  { prefixo: "ALOJ51", base: "PDS" }, { prefixo: "ALOJ52", base: "PDS" },
  { prefixo: "ALOJ53", base: "PDS" }, { prefixo: "ALOJ54", base: "PDS" },
  { prefixo: "ALOJ56", base: "PDS" }, { prefixo: "ALOJ57", base: "PDS" },
];

// ─── Full prefix list ─────────────────────────────────────────────────────────
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

const prefixoBaseList = computed(() =>
  filters.tipoPoc === "Alojamento"
    ? ALOJ_ROSTER.map(a => a.prefixo)
    : allPrefixes
);
const prefixoOpts = ref<string[]>(["Todos", ...allPrefixes]);
watch(() => filters.tipoPoc, () => {
  filters.prefixo = "Todos";
  prefixoOpts.value = ["Todos", ...prefixoBaseList.value];
});
function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    prefixoOpts.value = ["Todos", ...prefixoBaseList.value.filter(p => p.toLowerCase().includes(n))];
  });
}

const alojamentosDaBase = () =>
  ALOJ_ROSTER
    .filter(a => filters.base === "Todos" || a.base === filters.base)
    .map(a => a.prefixo);

const rosterListado = computed(() => {
  if (filters.tipoPoc === "Alojamento") return alojamentosDaBase();
  return filters.base === "Todos"
    ? allPrefixes
    : allPrefixes.filter((p) => prefixBase(p) === filters.base);
});

/** Equipes monitoradas: as da lista + qualquer equipe com visita que não esteja nela (assim visitadas + não visitadas = total). */
const rosterPrefixes = computed(() => {
  const lista = rosterListado.value;
  const conhecidas = new Set(lista);
  const extras = visitadasSorted.value.map(e => e.nome).filter(n => !conhecidas.has(n));
  return extras.length ? [...lista, ...extras] : lista;
});

// â"€â"€â"€ Visit count from real data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const visitadasSorted = computed(() => {
  const counts: Record<string, number> = {};
  for (const sub of subsNoPrefixo.value) {
    const pref = extractPrefixo(sub.equipe);
    if (!pref) continue;
    // Alojamentos só entram quando o tipo escolhido é Alojamento
    if (filters.tipoPoc !== "Alojamento" && /^ALOJ/i.test(pref)) continue;
    counts[pref] = (counts[pref] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([nome, v]) => ({ nome, v }))
    .sort((a, b) => b.v - a.v);
});

const naoVisitadas = computed(() => {
  const visited = new Set(visitadasSorted.value.map(e => e.nome));
  return rosterPrefixes.value.filter(p => !visited.has(p));
});

// ─── ICIT atual (mês/filtros selecionados) por prefixo, a partir dos dados já carregados ──
const icitAtualPorPrefixo = computed(() => {
  const ncPerSub = new Set<string>();
  for (const r of filteredResps.value) {
    if (r.resposta === "nao_conforme") ncPerSub.add(r.submission_id);
  }
  const map = new Map<string, IcitPrefixo>();
  for (const sub of filteredSubs.value) {
    const pref = extractPrefixo(sub.equipe);
    if (!pref) continue;
    if (!map.has(pref)) map.set(pref, { visitas: 0, semNc: 0 });
    const entry = map.get(pref)!;
    entry.visitas++;
    if (!ncPerSub.has(sub.id)) entry.semNc++;
  }
  return map;
});

function icitPct(entry: IcitPrefixo | undefined): number | null {
  if (!entry || !entry.visitas) return null;
  return Math.round((entry.semNc / entry.visitas) * 10000) / 100;
}

interface IcitRow {
  prefixo: string;
  visitas: number;
  icitAnterior: number | null;
  icitAtual: number | null;
  icitAcumulado: number | null;
}

const icitTableRows = computed<IcitRow[]>(() => {
  return visitadasSorted.value.map(({ nome, v }) => ({
    prefixo: nome,
    visitas: v,
    icitAnterior: icitPct(icitMesAnterior.value.get(nome)),
    icitAtual: icitPct(icitAtualPorPrefixo.value.get(nome)),
    icitAcumulado: icitPct(icitAcumulado.value.get(nome)),
  })).sort((a, b) => (a.icitAtual ?? -1) - (b.icitAtual ?? -1));
});

const icitColumns = [
  { name: "prefixo",      label: "Prefixo", field: "prefixo",      align: "left"   as const, sortable: true, style: "width:110px; min-width:90px" },
  { name: "visitas",      label: "Visitas", field: "visitas",      align: "center" as const, sortable: true, style: "width:52px;  min-width:44px" },
  { name: "icitAnterior", label: "Ant.",    field: "icitAnterior", align: "center" as const, sortable: true, style: "width:72px;  min-width:60px",
    headerStyle: "white-space:nowrap", headerTitle: "% ICIT Mês Anterior" },
  { name: "icitAtual",    label: "Atual",   field: "icitAtual",    align: "center" as const, sortable: true, style: "width:72px;  min-width:60px",
    headerStyle: "white-space:nowrap", headerTitle: "% ICIT Atual" },
  { name: "icitAcumulado",label: "Acum.",   field: "icitAcumulado",align: "center" as const, sortable: true, style: "width:72px;  min-width:60px",
    headerStyle: "white-space:nowrap", headerTitle: "% ICIT Acumulado (Ano)" },
];

function icitBadgeClass(pct: number | null): string {
  if (pct === null) return "icit-badge--none";
  if (pct >= 80) return "icit-badge--good";
  if (pct >= 40) return "icit-badge--warn";
  return "icit-badge--bad";
}

// â"€â"€â"€ Tooltip helper â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function tooltipSkin() {
  const bg = chartInk.tipBg;
  const fg = chartInk.tipText;
  const bd = chartInk.tipBorder;
  return {
    trigger: "item" as const,
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
      + "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.55);"
      + "max-width:min(280px, calc(100vw - 16px));white-space:normal;opacity:1;",
  };
}

function tipHtml(title: string, rows: { label: string; value: string; color?: string }[], foot?: string) {
  const t = chartInk.tipText;
  const m = chartInk.tipMuted;
  const body = rows
    .map((r) =>
      `<div style="display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-top:6px">`
      + `<span style="color:${m};font-size:11px;font-weight:600">${r.label}</span>`
      + `<span style="color:${r.color ?? t};font-size:13px;font-weight:800">${r.value}</span>`
      + `</div>`,
    )
    .join("");
  const hint = foot ? `<div style="color:${m};font-size:10px;margin-top:8px">${foot}</div>` : "";
  return `<div style="min-width:min(168px, calc(100vw - 32px));max-width:min(260px, calc(100vw - 24px));color:${t}"><div style="font-weight:800;font-size:14px;line-height:1.3;color:${t};white-space:normal;word-break:break-word">${title}</div>${body}${hint}</div>`;
}

// â"€â"€â"€ Gauge â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const taxaContato = computed(() =>
  rosterPrefixes.value.length
    ? Math.round((visitadasSorted.value.length / rosterPrefixes.value.length) * 100)
    : 0,
);


// â"€â"€â"€ Equipes Visitadas chart â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function hBarGrid() {
  return { left: 10, right: 36, top: 10, bottom: 24, containLabel: true };
}

function xPad(maxVal: number) {
  return {
    type: "value" as const,
    show: false,
    splitLine: { show: false },
    max: Math.max(1, maxVal) * 1.38,
  };
}

const AXIS_PAD = "\u00a0";
const padBar = {
  value: 0,
  silent: true,
  tooltip: { show: false },
  itemStyle: { opacity: 0, color: "transparent" },
  label: { show: false },
};

function wrapAxisName(text: string, maxChars = 13) {
  const raw = (text ?? "").trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;
  const words = raw.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && next.length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.join("\n");
}

function yCats(data: string[], inverse = false) {
  return {
    type: "category" as const,
    data,
    inverse,
    boundaryGap: true,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      color: chartInk.axis,
      fontSize: 10,
      lineHeight: 13,
      interval: 0,
      width: 124,
      overflow: "none" as const,
      formatter: (v: string) => wrapAxisName(v),
    },
  };
}

function vZoom(len: number, visible: number) {
  const vis = Math.min(Math.max(visible, 1), Math.max(len, 1));
  const start = Math.max(0, len - vis);
  const end = Math.max(0, len - 1);
  const showSlider = len > vis;
  return [
    {
      type: "inside" as const,
      orient: "vertical" as const,
      startValue: start,
      endValue: end,
      zoomOnMouseWheel: false,
      moveOnMouseWheel: true,
      preventDefaultMouseMove: true,
    },
    {
      type: "slider" as const,
      show: showSlider,
      orient: "vertical" as const,
      width: 8,
      right: 6,
      top: "16%",
      bottom: "16%",
      startValue: start,
      endValue: end,
      brushSelect: false,
      showDetail: false,
      showDataShadow: false,
      zoomLock: true,
      borderRadius: 8,
      borderColor: "transparent",
      backgroundColor: "rgba(148,163,184,.18)",
      fillerColor: "rgba(139,28,43,.45)",
      handleSize: "70%",
      handleStyle: {
        color: "#fff",
        borderColor: G.brand,
        borderWidth: 1,
      },
      moveHandleSize: 0,
    },
  ];
}

const chartVisitadas = computed(() => {
  const data = visitadasSorted.value;
  const cats = data.map(e => e.nome);
  const selected = filters.prefixo !== "Todos" ? filters.prefixo : null;

  return {
    tooltip: {
      ...tooltipSkin(),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Visitas", value: String(p.value), color: G.green },
        ], "Clique para filtrar esta equipe"),
    },
    grid: hBarGrid(),
    xAxis: xPad(Math.max(...data.map((e) => e.v), 1)),
    yAxis: yCats(cats, true),
    dataZoom: vZoom(data.length, 18),
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: data.map((e) => ({
        value: e.v,
        itemStyle: {
          color: G.green,
          opacity: !selected || selected === e.nome ? 1 : 0.22,
          borderRadius: [0, 5, 5, 0],
        },
      })),
      barMaxWidth: 18,
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
  const ids = new Set(subsNoPrefixo.value.map((s) => s.id));
  const ncPerSub: Record<string, number> = {};
  for (const r of responses.value) {
    if (!ids.has(r.submission_id) || r.resposta !== "nao_conforme") continue;
    if (filters.categoria !== "Todos" && r.categoria !== filters.categoria) continue;
    ncPerSub[r.submission_id] = (ncPerSub[r.submission_id] ?? 0) + 1;
  }
  const counts: Record<string, number> = {};
  for (const sub of subsNoPrefixo.value) {
    const nc = ncPerSub[sub.id] ?? 0;
    const pref = extractPrefixo(sub.equipe);
    if (nc === 0 || !pref) continue;
    counts[pref] = (counts[pref] ?? 0) + nc;
  }
  return Object.entries(counts)
    .map(([name, v]) => ({ name, v }))
    .sort((a, b) => a.v - b.v);
});

// â"€â"€â"€ Ranking NC Equipes â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const chartRankingNcEq = computed(() => {
  const data = ncPerEquipe.value;
  const selected = filters.prefixo !== "Todos" ? filters.prefixo : null;
  const names = [AXIS_PAD, ...data.map((e) => e.name)];
  return {
    tooltip: {
      ...tooltipSkin(),
      formatter: (p: { name: string; value: number }) => {
        if (!p.name?.trim()) return "";
        return tipHtml(p.name, [
          { label: "Não conformes", value: String(p.value), color: G.brand },
        ], "Clique para filtrar esta equipe");
      },
    },
    grid: hBarGrid(),
    xAxis: xPad(Math.max(...data.map((e) => e.v), 1)),
    yAxis: yCats(names),
    dataZoom: vZoom(names.length, 4),
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: [
        padBar,
        ...data.map((e) => ({
        value: e.v,
        itemStyle: {
          color: G.brand,
          opacity: !selected || selected === e.name ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      ],
      barMaxWidth: 18,
      barCategoryGap: "36%",
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
  const ncMap: Record<string, number> = {};
  for (const r of respsNoCat.value) {
    if (r.resposta !== "nao_conforme") continue;
    const cat = r.categoria ?? "Sem categoria";
    ncMap[cat] = (ncMap[cat] ?? 0) + 1;
  }
  const entries = Object.entries(ncMap)
    .map(([cat, nc]) => ({ cat, nc }))
    .filter(e => e.nc > 0)
    .sort((a, b) => a.nc - b.nc);
  const selected = filters.categoria !== "Todos" ? filters.categoria : null;
  const names = [AXIS_PAD, ...entries.map((e) => e.cat)];
  return {
    tooltip: {
      ...tooltipSkin(),
      formatter: (p: { name: string; value: number }) => {
        if (!p.name?.trim()) return "";
        return tipHtml(p.name, [
          { label: "Ocorrências", value: String(p.value), color: G.brand },
        ], "Clique para filtrar esta categoria");
      },
    },
    grid: hBarGrid(),
    xAxis: xPad(Math.max(...entries.map((e) => e.nc), 1)),
    yAxis: yCats(names),
    dataZoom: vZoom(names.length, 4),
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: [
        padBar,
        ...entries.map((e) => ({
        value: e.nc,
        itemStyle: {
          color: G.brand,
          opacity: !selected || selected === e.cat ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      ],
      barMaxWidth: 20,
      barCategoryGap: "36%",
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
.kpi-gauge-chart { width: 100%; height: 148px; }
.kpi-gauge-sub {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-top: 0;
  letter-spacing: .01em;
}

/* â"€â"€â"€ Equipes Não Visitadas list â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
.nv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 4px;
  border-bottom: 1px solid $border;
  cursor: pointer;
  border-radius: 6px;
  &:last-child { border-bottom: none; }
  &:hover { background: rgba($brand, .06); }
  &--on { background: rgba($brand, .12); }
}
.nv-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.nv-nome { font-size: 11px; font-weight: 600; color: #334155; }
.nv-zero {
  font-size: 12px; font-weight: 700; color: #dc2626;
  background: #fee2e2; border-radius: 6px;
  padding: 1px 8px; min-width: 28px; text-align: center;
}

/* ─── Matriz ICIT ────────────────────────────────────────────────────────── */
.icit-badge {
  display: inline-block;
  font-size: 11px; font-weight: 700;
  border-radius: 5px;
  padding: 2px 6px;
  min-width: 54px;
  text-align: center;
  white-space: nowrap;
}
.icit-badge--good { color: #15803d; background: #dcfce7; }
.icit-badge--warn { color: #b45309; background: #fef3c7; }
.icit-badge--bad  { color: #b91c1c; background: #fee2e2; }
.icit-badge--none { color: #94a3b8; background: #f1f5f9; }

.icit-table {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-x: hidden;

  :deep(table) { table-layout: fixed; width: 100%; }
  :deep(thead th) {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .3px; color: #64748b; background: #f8fafc;
    white-space: nowrap; padding: 6px 4px;
  }
  :deep(td) { padding: 4px 4px; }
  :deep(tbody td) { font-size: 12px; }
  :deep(tbody tr) { cursor: pointer; }
  :deep(.icit-row--on td) { background: rgba($brand, .1); }
}

.rel-grid {
  --rel-h: 400px;
}
.rel-col {
  display: flex;
  flex-direction: column;
}
.rel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rel-stack > .chart-card {
  flex: 1 1 0;
  min-height: 0;
  height: auto;
  overflow: hidden;
}
.rel-fill {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rel-chart {
  width: 100%;
  flex: 1 1 auto;
  min-height: 168px;
  overflow: hidden;
  padding-bottom: 6px;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .rel-col {
    height: var(--rel-h);
    max-height: var(--rel-h);
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .relatorio-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand, .1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .fgroup__label { color: #64748b; }
  .gerente-select {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: #94a3b8; }
  }
  .nv-row { border-bottom-color: #334155; }
  .nv-nome { color: #e2e8f0; }
  .kpi-stat-label { color: #94a3b8; }
  .kpi-stat-sub { color: #64748b; }
  .icit-table :deep(thead th) { background: #1e293b; color: #94a3b8; }
  .icit-badge--none { color: #64748b; background: #1e293b; }
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style lang="scss">
.echarts-tooltip {
  opacity: 1 !important;
  max-width: min(280px, calc(100vw - 16px)) !important;
}
.body--dark .echarts-tooltip {
  background: #0b1220 !important;
  color: #f8fafc !important;
  border-color: #334155 !important;
}
</style>

