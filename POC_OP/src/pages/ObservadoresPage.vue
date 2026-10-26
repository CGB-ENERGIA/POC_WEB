<template>
  <q-page class="obs-page">

    <!-- ═══════════════════════════ FILTER BAR ═══════════════════════════ -->
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
                :class="['pill', marcado(filters.base, b) && 'pill--active']"
                @click="filters.base = alternar(filters.base, b, $event)">{{ b }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerenciasOpts" :key="g"
                :class="['pill', marcado(filters.gerencia, g) && 'pill--active']"
                @click="filters.gerencia = alternar(filters.gerencia, g, $event)">{{ g }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposOpts" :key="t"
                :class="['pill', marcado(filters.tipo, t) && 'pill--active']"
                @click="filters.tipo = alternar(filters.tipo, t, $event)">{{ t }}</button>
            </div>
          </div>
        </div>

        <!-- Row 2: Mês · Semana · Função · Gerente · Observador -->
        <div class="filter-row">
          <div class="fgroup fgroup--sel" style="min-width:110px">
            <span class="fgroup__label">Mês</span>
            <q-select multiple :model-value="valores(filters.mes)" @update:model-value="(v: string[]) => filters.mes = juntar(v)" :display-value="rotulo(filters.mes)" :options="semTodos(mesesOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel" style="min-width:130px">
            <span class="fgroup__label">Semana</span>
            <q-select multiple :model-value="valores(filters.semana)" @update:model-value="(v: string[]) => filters.semana = juntar(v)" :display-value="rotulo(filters.semana)"
              :clearable="filters.semana !== 'Todos'" @clear="filters.semana = 'Todos'" :options="semTodos(semanasOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel" style="min-width:150px">
            <span class="fgroup__label">Função</span>
            <q-select multiple :model-value="valores(filters.funcao)" @update:model-value="(v: string[]) => filters.funcao = juntar(v)" :display-value="rotulo(filters.funcao)"
              :clearable="filters.funcao !== 'Todos'" @clear="filters.funcao = 'Todos'" :options="semTodos(funcoesOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup" ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel">
            <span class="fgroup__label">Gerente</span>
            <q-select multiple :model-value="valores(filters.gerente)" @update:model-value="(v: string[]) => filters.gerente = juntar(v)" :display-value="rotulo(filters.gerente)"
              :clearable="filters.gerente !== 'Todos'" @clear="filters.gerente = 'Todos'" :options="semTodos(gerentesOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="fgroup fgroup--sel">
            <span class="fgroup__label">Coordenador</span>
            <q-select multiple :model-value="valores(filters.coordenador)" @update:model-value="(v: string[]) => filters.coordenador = juntar(v)" :display-value="rotulo(filters.coordenador)"
              :clearable="filters.coordenador !== 'Todos'" @clear="filters.coordenador = 'Todos'" :options="semTodos(coordenadoresOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              popup-content-class="gerente-popup">
              <template #prepend>
                <q-icon name="mdi-account" size="16px" class="gerente-icon" />
              </template>
            <template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
          <div class="filter-divider" />
          <div class="fgroup fgroup--sel" style="min-width:160px">
            <span class="fgroup__label">Observador</span>
            <q-select multiple :model-value="valores(filters.observador)" @update:model-value="(v: string[]) => filters.observador = juntar(v)" :display-value="rotulo(filters.observador)"
              :clearable="filters.observador !== 'Todos'" @clear="filters.observador = 'Todos'" :options="semTodos(observadoresOpts)"
              dense outlined hide-bottom-space class="gerente-select"
              use-input input-debounce="0" popup-content-class="gerente-popup"
              @filter="filterObservador" ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
          </div>
        </div>

      </div>
      </div>
      <transition name="chip-bar">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span v-if="filters.mes !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.mes = 'Todos'">{{ rotulo(filters.mes) }}</span>
          <span v-if="filters.semana !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.semana = 'Todos'">{{ rotulo(filters.semana) }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ rotulo(filters.base) }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ rotulo(filters.gerencia) }}</span>
          <span v-if="filters.tipo !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.tipo = 'Todos'">{{ rotulo(filters.tipo) }}</span>
          <span v-if="filters.funcao !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.funcao = 'Todos'">{{ rotulo(filters.funcao) }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ rotulo(filters.gerente) }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.coordenador = 'Todos'">{{ rotulo(filters.coordenador) }}</span>
          <span v-if="filters.observador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.observador = 'Todos'">{{ rotulo(filters.observador) }}</span>
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

      <!-- KPI Row (compacto) -->
      <div class="kpi-sticky">
      <div class="row q-col-gutter-sm q-mb-sm items-stretch">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-compact" style="--kc:#0284c7">
            <q-card-section class="row items-center no-wrap kpi-compact__body">
              <div class="kpi-compact__icon" style="background:rgba(2,132,199,.12)">
                <q-icon name="mdi-eye" size="22px" style="color:#0284c7" />
              </div>
              <div class="kpi-compact__txt">
                <div class="kpi-compact__label">Total de Obs</div>
                <div class="kpi-compact__line">
                  <span class="kpi-compact__value" style="color:#0284c7">{{ totalObs.toLocaleString('pt-BR') }}</span>
                  <span class="kpi-compact__sub">observações realizadas</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-compact" style="--kc:#16a34a">
            <q-card-section class="row items-center no-wrap kpi-compact__body">
              <div class="kpi-compact__icon" style="background:rgba(22,163,74,.12)">
                <q-icon name="mdi-check-all" size="22px" style="color:#16a34a" />
              </div>
              <div class="kpi-compact__txt">
                <div class="kpi-compact__label">Obs 100%</div>
                <div class="kpi-compact__line">
                  <span class="kpi-compact__value" style="color:#16a34a">{{ totalObs100.toLocaleString('pt-BR') }}</span>
                  <span class="kpi-compact__sub">sem nenhum desvio</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-compact" style="--kc:#8B1C2B">
            <q-card-section class="row items-center no-wrap kpi-compact__body">
              <div class="kpi-compact__icon" style="background:rgba(139,28,43,.12)">
                <q-icon name="mdi-alert-circle" size="22px" style="color:#8B1C2B" />
              </div>
              <div class="kpi-compact__txt">
                <div class="kpi-compact__label">Obs c/ Desvio</div>
                <div class="kpi-compact__line">
                  <span class="kpi-compact__value" style="color:#8B1C2B">{{ obsDesvio.toLocaleString('pt-BR') }}</span>
                  <span class="kpi-compact__sub">com não conformidade</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-compact" style="--kc:#16a34a">
            <q-card-section class="row items-center no-wrap kpi-compact__body">
              <div class="kpi-ring" :style="{ '--p': pctObs100 + '%' }" />
              <div class="kpi-compact__txt">
                <div class="kpi-compact__label">% Obs 100%</div>
                <div class="kpi-compact__line">
                  <span class="kpi-compact__value" style="color:#8B1C2B">{{ pctObs100 }}%</span>
                  <span class="kpi-compact__sub">{{ totalObs100.toLocaleString('pt-BR') }} de {{ totalObs.toLocaleString('pt-BR') }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
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
                      :class="{ 'obs-row--on': marcado(filters.observador, row.nome) }"
                      @click="toggleObservador(row.nome, $event)"
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
                  <v-chart class="chart-hit" :option="chartFuncao" autoresize :style="{ height: alturaGraficos }" @click="onFuncaoClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Obs 100% por Gerência</div>
                  <div class="chart-caption">Clique para filtrar</div>
                  <v-chart class="chart-hit" :option="chartGerencia" autoresize :style="{ height: alturaGraficos }" @click="onGerenciaClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Equipes Visitadas</div>
                  <div class="chart-caption">Clique para filtrar o prefixo</div>
                  <v-chart class="chart-hit" :option="chartEquipes" autoresize :style="{ height: alturaGraficos }" @click="onPrefixoClick" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-6">
              <q-card flat bordered class="chart-card">
                <q-card-section class="q-pa-xs">
                  <div class="chart-card-title">Inconformidades por Categoria</div>
                  <div class="chart-caption">Clique para filtrar</div>
                  <v-chart class="chart-hit" :option="chartIncCat" autoresize :style="{ height: alturaGraficos }" @click="onCategoriaClick" />
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
import { valores, juntar, marcado, alternar, rotulo, semTodos, casa, igualCI, ativo, eventoDe, type CliqueEv } from "@/lib/multi-filtro";
import { reactive, ref, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, semanaDaSub, indexEmployees, matchSubmissionToEmployee, filterByCoordenador, contagemItens } from "@/lib/dashboard";
import { lerTipoPoc, salvarTipoPoc } from "@/lib/tipo-poc";

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

const G = { green: "#16a34a", brand: "#8B1C2B" };

// ─── Filters ──────────────────────────────────────────────────────────────────
const showFilters = ref(false);

const anosOpts     = ["2024","2025","2026"];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
const tiposOpts     = ["Todos","Administrativo","Operacional"];
const TIPO_AUDITAGEM: Record<string, string[]> = {
  Administrativo: ["ADMINISTRATIVO", "ALOJAMENTO", "LOGISTICA", "OFICINA", "ADM"],
  Operacional: ["GOMAN", "GSTC"],
};
const mesesOpts     = ["Todos","jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const semanasOpts   = ["Todos","Semana 1","Semana 2","Semana 3","Semana 4"];
const funcoesOpts   = ["Todos","ENCARREGADO","SUPERVISOR","SESMT","FISCAL","COORDENADOR","GERENTE"];

const filters = reactive({
  ano: "2026", base: "Todos", gerencia: "Todos", tipo: lerTipoPoc(tiposOpts),
  mes: "Todos", semana: "Todos", funcao: "Todos",
  gerente: "Todos", coordenador: "Todos", observador: "Todos",
});
watch(() => filters.tipo, salvarTipoPoc);

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
  gerentesOpts,
  coordenadoresOpts,
} = useChecklistData();

const viz = reactive({
  prefixo: null as string | null,
  categoria: null as string | null,
});

type EcClick = { componentType?: string; dataIndex?: number; name?: string; event?: { event?: unknown } };

function toggleObservador(nome: string, ev?: CliqueEv) {
  filters.observador = alternar(filters.observador, nome, ev);
}

function onFuncaoClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name || p.name === "Sem dados") return;
  filters.funcao = alternar(filters.funcao, p.name, eventoDe(p));
}

function onGerenciaClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name || p.name === "Sem dados") return;
  filters.gerencia = alternar(filters.gerencia, p.name, eventoDe(p));
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
  filters.tipo = "Todos";
  filters.semana = "Todos";
  filters.funcao = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  filters.observador = "Todos";
  viz.prefixo = null;
  viz.categoria = null;
}

const hasActiveFilters = computed(() =>
  filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.tipo !== "Todos"
  || filters.mes !== "Todos"
  || filters.semana !== "Todos"
  || filters.funcao !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.observador !== "Todos"
  || !!viz.prefixo
  || !!viz.categoria,
);

function matchTipoPoc(auditagem: string | undefined) {
  const sel = valores(filters.tipo);
  if (!sel.length) return true;
  const allowed = sel.flatMap((t) => TIPO_AUDITAGEM[t] ?? []);
  if (!allowed.length) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function applySlice(
  source: typeof submissions.value,
  omit: { gerencia?: boolean; tipo?: boolean; funcao?: boolean; observador?: boolean; week?: boolean; prefixo?: boolean } = {},
) {
  const idx = indexEmployees(employees.value);
  // com vários marcados, vale quem está em qualquer um deles
  const emQualquer = (sel: string, fn: (v: string) => typeof source) => {
    const v = valores(sel);
    if (!v.length) return source;
    const ids = new Set(v.flatMap((x) => fn(x).map((y) => y.id)));
    return source.filter((y) => ids.has(y.id));
  };
  let s = emQualquer(filters.gerente, (v) => filterByGerente(source, employees.value, v));
  s = s.filter((x) => emQualquer(filters.coordenador, (v) => filterByCoordenador(source, employees.value, v)).some((y) => y.id === x.id));
  if (!omit.gerencia && ativo(filters.gerencia)) {
    const ids = new Set(valores(filters.gerencia).flatMap((v) => filterByGerencia(source, employees.value, v).map((y) => y.id)));
    s = s.filter((x) => ids.has(x.id));
  }
  if (ativo(filters.base)) s = s.filter((sub) => casa(filters.base, sub.base));
  if (!omit.tipo) s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  if (!omit.week && ativo(filters.semana)) {
    const semanas = valores(filters.semana).map((x) => Number(x.replace(/\D/g, "")) || 0).filter(Boolean);
    if (semanas.length) s = s.filter((sub) => semanas.includes(semanaDaSub(sub)));
  }
  if (!omit.funcao && ativo(filters.funcao)) {
    s = s.filter((sub) => casa(filters.funcao, matchSubmissionToEmployee(sub, idx)?.funcao));
  }
  if (!omit.observador && ativo(filters.observador)) {
    s = s.filter((sub) => casa(filters.observador, sub.observador));
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
  const nums = valores(filters.mes).map((m) => MONTH_MAP[m] ?? 0).filter(Boolean).sort((a, b) => a - b);
  // a base é filtrada na tela (pode ter mais de uma); mês: nenhum = ano inteiro, vários = só eles
  await load(nums.length === 0
    ? { ano: Number(filters.ano) }
    : nums.length === 1
      ? { ano: Number(filters.ano), mes: nums[0]! }
      : { ano: Number(filters.ano), meses: nums });
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);

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
  const subPorId = new Map(tableSubs.map((s) => [s.id, s]));
  for (const r of tableResps) {
    const sub = subPorId.get(r.submission_id);
    if (!sub || !byMat[sub.matricula]) continue;
    // Item a item nas perguntas de vários itens (Regras de Ouro), como no BI.
    const c = contagemItens(r);
    byMat[sub.matricula].conf += c.conf;
    byMat[sub.matricula].inc += c.nc;
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
const totaisItens = computed(() => {
  let conf = 0, nc = 0;
  for (const r of filteredResps.value) {
    const c = contagemItens(r);
    conf += c.conf; nc += c.nc;
  }
  return { conf, nc };
});
const totalConf   = computed(() => totaisItens.value.conf);
const totalInc    = computed(() => totaisItens.value.nc);
const totalObs100 = computed(() => filteredSubs.value.filter((s) => !ncSubIds.value.has(s.id)).length);
const obsDesvio   = computed(() => totalObs.value - totalObs100.value);
const globalPct   = computed(() => {
  const t = totalConf.value + totalInc.value;
  return t === 0 ? 100 : (totalConf.value / t) * 100;
});
const pctObs100   = computed(() => totalObs.value ? Math.round((totalObs100.value / totalObs.value) * 100) : 0);

// Gráficos laterais: acompanham a altura da tela para tabela e gráficos caberem sem rolar a página
const alturaGraficos = "clamp(150px, calc(50vh - 166px), 280px)";

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
    itemStyle: { opacity: !ativo(selected) || marcado(selected, e.name) ? 1 : 0.22 },
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
      label: { opacity: 1, show: true, position: "right" as const, fontSize: 10, fontWeight: "bold" as const, color: G.green },
    }],
  };
});

const ncDetalhesPorCat = computed(() => {
  const map: Record<string, Record<string, number>> = {};
  for (const r of respsNoCat.value) {
    if (r.resposta !== "nao_conforme") continue;
    const cat = r.categoria ?? "Sem categoria";
    const perg = (r.pergunta ?? "").trim() || "Sem descrição";
    if (!map[cat]) map[cat] = {};
    map[cat][perg] = (map[cat][perg] ?? 0) + 1;
  }
  const result: Record<string, { pergunta: string; count: number }[]> = {};
  for (const [cat, pergs] of Object.entries(map)) {
    result[cat] = Object.entries(pergs)
      .map(([pergunta, count]) => ({ pergunta, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
  return result;
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
  const detalheRef = ncDetalhesPorCat.value;
  return {
    tooltip: {
      ...tooltipSkin(),
      enterable: false,
      extraCssText:
        `background:${chartInk.tipBg} !important;color:${chartInk.tipText} !important;border:1px solid ${chartInk.tipBorder};`
        + "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.55);opacity:1;max-width:300px;",
      formatter: (p: { name: string; value: number }) => {
        const cat = p.name;
        const detalhe = detalheRef[cat] ?? [];
        let html = `<div style="font-weight:700;font-size:12px;margin-bottom:4px">${cat}</div>`;
        html += `<div>Inc: <b style="color:${G.brand}">${p.value}</b></div>`;
        if (detalhe.length) {
          html += `<div style="margin-top:8px;border-top:1px solid rgba(128,128,128,.3);padding-top:6px;font-size:10.5px">`;
          for (const d of detalhe) {
            const pct = p.value ? Math.round((d.count / p.value) * 100) : 0;
            html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px">`;
            html += `<div style="flex:1;white-space:normal;line-height:1.35;opacity:.9">${d.pergunta}</div>`;
            html += `<div style="flex-shrink:0;font-weight:700;color:${G.brand}">${d.count} <span style="font-weight:400;opacity:.6">(${pct}%)</span></div>`;
            html += `</div>`;
          }
          if (detalhe.length === 8) html += `<div style="opacity:.5;font-size:9.5px;margin-top:2px">e outros…</div>`;
          html += `</div>`;
        }
        html += `<div style="font-size:9.5px;margin-top:6px;opacity:.5">Clique para filtrar</div>`;
        return html;
      },
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
      label: { opacity: 1, show: true, position: "right" as const, fontSize: 10, fontWeight: "bold" as const, color: G.brand },
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
$label-color:  var(--poc-muted);
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

// ── KPI cards (compactos) ─────────────────────────────────────────────────────
.kpi-card {
  border-radius: 12px; height: 100%;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.kpi-compact {
  position: relative; overflow: hidden;
}
.kpi-compact__body { padding: 8px 14px !important; gap: 12px; }
.kpi-compact__icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.kpi-compact__txt { min-width: 0; }
.kpi-compact__label {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; line-height: 1.2;
}
.kpi-compact__line { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.kpi-compact__value { font-size: 24px; font-weight: 800; line-height: 1.15; letter-spacing: -.4px; }
.kpi-compact__sub { font-size: 11px; color: var(--poc-muted); font-weight: 500; }

// ── Table ─────────────────────────────────────────────────────────────────────
.obs-table-card { border-radius: 12px; }
.table-card-title {
  font-size: 13px; font-weight: 700; color: $brand;
  text-transform: uppercase; letter-spacing: .6px; padding: 6px 8px 4px;
}
.obs-table-wrap {
  max-height: max(320px, calc(100vh - 290px)); overflow-y: auto;
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
    background: #1e293b; border-color: #334155; color: var(--poc-muted);
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .gerente-select {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: var(--poc-muted); }
  }
  .kpi-compact__label { color: var(--poc-muted); }
  .kpi-compact__sub { color: #64748b; }
  .kpi-ring { background: conic-gradient(#16a34a var(--p), rgba(148,163,184,.22) 0); }
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
