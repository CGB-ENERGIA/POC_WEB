<template>
  <q-page class="mapa-mensal-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILTER BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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

        <!-- Row 1: Semana · Mês · Gerência -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Semana</span>
            <div class="pill-group">
              <button v-for="s in semanasOpts" :key="s.v"
                :class="['pill', filters.semana === s.v && 'pill--active']"
                @click="filters.semana = s.v">{{ s.l }}</button>
            </div>
          </div>
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button v-for="m in mesesOpts" :key="m.v"
                :class="['pill', filters.mes === m.v && 'pill--active']"
                @click="filters.mes = m.v">{{ m.l }}</button>
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

        <!-- Row 2: Ano · Gerente -->
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
            <span class="fgroup__label">Gerente</span>
            <div class="pill-group">
              <button v-for="g in gerentesOpts" :key="g"
                :class="['pill', filters.gerente === g && 'pill--active']"
                @click="filters.gerente = g">{{ g }}</button>
            </div>
          </div>
          <div class="fgroup">
            <span class="fgroup__label">Coordenador</span>
            <div class="pill-group">
              <button v-for="g in coordenadoresOpts" :key="g"
                :class="['pill', filters.coordenador === g && 'pill--active']"
                @click="filters.coordenador = g">{{ g }}</button>
            </div>
          </div>
        </div>

        <!-- Row 3: Base · Tipo de POC -->
        <div class="filter-row">
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
            <span class="fgroup__label">Tipo de POC</span>
            <div class="pill-group">
              <button v-for="t in tiposOpts" :key="t"
                :class="['pill', filters.tipo === t && 'pill--active']"
                @click="filters.tipo = t">{{ t }}</button>
            </div>
          </div>
        </div>

      </div>
      </div>
      <transition name="chip-bar">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span v-if="filters.mes !== 0" class="filter-chip filter-chip--hit" @click="filters.mes = 0">{{ mesLabel }}</span>
          <span v-if="filters.semana !== 0" class="filter-chip filter-chip--hit" @click="filters.semana = 0">{{ semanaLabel }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ filters.gerente }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.coordenador = 'Todos'">{{ filters.coordenador }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ filters.base }}</span>
          <span v-if="filters.tipo !== 'Operacional'" class="filter-chip filter-chip--hit" @click="filters.tipo = 'Operacional'">{{ filters.tipo }}</span>
          <span v-if="viz.base && viz.base !== filters.base" class="filter-chip filter-chip--hit" @click="viz.base = null">{{ viz.base }}</span>
          <span v-if="viz.cat" class="filter-chip filter-chip--hit" @click="viz.cat = null">{{ viz.cat }}</span>
          <span v-if="viz.mes && viz.mes !== filters.mes" class="filter-chip filter-chip--hit" @click="viz.mes = null">{{ months[viz.mes - 1] }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CONTENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">

      <!-- KPI -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <KpiFlame />
              <div class="kpi-stat-value" style="color:#8B1C2B">
                {{ totalInc.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Total de Inconformidade</div>
              <div class="kpi-stat-sub">acumulado no Período</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-9">
          <q-card flat bordered class="kpi-legend-card">
            <q-card-section class="q-pa-md">
              <div class="legend-title">Escala de Intensidade</div>
              <div class="legend-row">
                <div v-for="lv in legendLevels" :key="lv.label" class="legend-item">
                  <div class="legend-swatch" :style="{ background: lv.color }" />
                  <span class="legend-label">{{ lv.label }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Two heat maps side-by-side -->
      <div class="row q-col-gutter-md">

        <!-- Categoria -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="heat-card">
            <q-card-section class="q-pa-sm q-pb-none">
              <div class="heat-card-title">Categoria</div>
              <div class="heat-card-sub">Clique na categoria, no mês ou na célula</div>
            </q-card-section>
            <q-card-section class="q-pa-sm q-pt-xs">
              <div class="heat-wrap">
                <table class="heat-table">
                  <thead>
                    <tr>
                      <th class="th-label">CATEGORIA</th>
                      <th
                        v-for="(m, mi) in months" :key="m"
                        class="th-mes"
                        :class="{ 'th--on': selectedMes === mi + 1 }"
                        @click="toggleMes(mi + 1)"
                      >{{ m }}</th>
                      <th class="th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in catData" :key="row.label">
                      <td
                        class="td-label"
                        :class="{ 'td-label--on': viz.cat === row.label }"
                        @click="toggleCat(row.label)"
                      >{{ row.label }}</td>
                      <td
                        v-for="(v, i) in row.values" :key="i"
                        class="td-cell"
                        :class="{
                          'td-cell--dim': isCatDim(row.label, i + 1),
                          'td-cell--on': viz.cat === row.label && selectedMes === i + 1,
                        }"
                        :style="{ background: heatColor(v), color: cellTextColor(v) }"
                        @click="onCatCell(row.label, i + 1)"
                      >
                        {{ v }}
                      </td>
                      <td
                        class="td-row-total"
                        :class="{ 'td-cell--dim': viz.cat && viz.cat !== row.label }"
                        :style="{ background: heatColor(rowSum(row.values)), color: cellTextColor(rowSum(row.values)) }"
                      >
                        {{ rowSum(row.values) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td class="td-label">Total</td>
                      <td v-for="(t, i) in colTotals" :key="i" class="td-cell td-total-cell">{{ t }}</td>
                      <td class="td-row-total td-grand">{{ catGrand }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Base -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="heat-card">
            <q-card-section class="q-pa-sm q-pb-none">
              <div class="heat-card-title">Base</div>
              <div class="heat-card-sub">Clique na base, no mês ou na célula</div>
            </q-card-section>
            <q-card-section class="q-pa-sm q-pt-xs">
              <div class="heat-wrap">
                <table class="heat-table">
                  <thead>
                    <tr>
                      <th class="th-label">
                        <span>Base</span>
                        <q-icon name="mdi-triangle" size="9px" style="opacity:.5;margin-left:4px" />
                      </th>
                      <th
                        v-for="(m, mi) in months" :key="m"
                        class="th-mes"
                        :class="{ 'th--on': selectedMes === mi + 1 }"
                        @click="toggleMes(mi + 1)"
                      >{{ m }}</th>
                      <th class="th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!baseData.length">
                      <td :colspan="months.length + 2" class="td-empty">
                        <q-icon name="mdi-check-circle-outline" size="24px" color="positive" />
                        Sem checklists no período
                      </td>
                    </tr>
                    <tr v-for="row in baseData" :key="row.label">
                      <td
                        class="td-label"
                        :class="{ 'td-label--on': selectedBase === row.label }"
                        @click="toggleBase(row.label)"
                      >{{ row.label }}</td>
                      <td
                        v-for="(v, i) in row.values" :key="i"
                        class="td-cell"
                        :class="{
                          'td-cell--dim': isBaseDim(row.label, i + 1),
                          'td-cell--on': selectedBase === row.label && selectedMes === i + 1,
                        }"
                        :style="{ background: heatColor(v), color: cellTextColor(v) }"
                        @click="onBaseCell(row.label, i + 1)"
                      >
                        {{ v }}
                      </td>
                      <td
                        class="td-row-total"
                        :class="{ 'td-cell--dim': selectedBase && selectedBase !== row.label }"
                        :style="{ background: heatColor(rowSum(row.values)), color: cellTextColor(rowSum(row.values)) }"
                      >
                        {{ rowSum(row.values) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td class="td-label">Total</td>
                      <td v-for="(t, i) in baseColTotals" :key="i" class="td-cell td-total-cell">{{ t }}</td>
                      <td class="td-row-total td-grand">{{ baseTotalInc }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import {
  fetchSubmissions, fetchEmployees, fetchNcLight,
  filterByGerencia, filterByGerente, semanaDaData, uniqueHierarchyOpts, filterByCoordenador,
  type SubmissionRow, type EmployeeRow, type NcLightRow,
} from "@/lib/dashboard";
import KpiFlame from "@/components/KpiFlame.vue";

const loading = ref(false);
const submissions = ref<SubmissionRow[]>([]);
const employees  = ref<EmployeeRow[]>([]);
const ncLight    = ref<NcLightRow[]>([]);

const showFilters = ref(false);
const now = new Date();

const semanasOpts = [
  { v: 0, l: "Todos" },
  { v: 1, l: "1ª Semana" },
  { v: 2, l: "2ª Semana" },
  { v: 3, l: "3ª Semana" },
  { v: 4, l: "4ª Semana" },
];
const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const mesesOpts = [{ v: 0, l: "Todos" }, ...months.map((l, i) => ({ v: i + 1, l }))];
const anosOpts      = ["2024","2025","2026"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
const gerentesOpts = computed(() => uniqueHierarchyOpts(employees.value, "gerente"));
const coordenadoresOpts = computed(() => uniqueHierarchyOpts(employees.value, "coordenador"));
const basesOpts     = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const tiposOpts     = ["Operacional","Administrativo","Alojamento","Todos"];

const TIPO_AUDITAGEM: Record<string, string[]> = {
  Operacional: ["GOMAN", "GSTC"],
  Administrativo: ["ADMINISTRATIVO", "LOGISTICA", "OFICINA", "ADM"],
  Alojamento: ["ALOJAMENTO"],
};

const CAT_DEFS = [
  { label: "APR", match: "APR" },
  { label: "Epi, Epc e Ferramentas", match: "EPI" },
  { label: "Padrinho de Segurança", match: "Padrinho" },
  { label: "Procedimento", match: "Procedimento" },
  { label: "Regras de Ouro", match: "Regras de Ouro" },
  { label: "Trabalho em Altura", match: "Altura" },
  { label: "Veículos e Equipamentos", match: "Veículo" },
];

const filters = reactive({
  semana: 0, mes: 0, ano: String(now.getFullYear()),
  gerencia: "Todos", gerente: "Todos", coordenador: "Todos", base: "Todos", tipo: "Operacional",
});

const viz = reactive({
  cat: null as string | null,
  base: null as string | null,
  mes: null as number | null,
});

const selectedBase = computed(() =>
  viz.base ?? (filters.base !== "Todos" ? filters.base : null),
);
const selectedMes = computed(() => viz.mes ?? (filters.mes || null));
const semanaLabel = computed(() => semanasOpts.find((s) => s.v === filters.semana)?.l ?? "");
const mesLabel = computed(() => mesesOpts.find((s) => s.v === filters.mes)?.l ?? "");

function toggleCat(cat: string) {
  viz.cat = viz.cat === cat ? null : cat;
}
function toggleBase(base: string) {
  viz.base = viz.base === base ? null : base;
}
function toggleMes(mes: number) {
  viz.mes = viz.mes === mes ? null : mes;
}
function onCatCell(cat: string, mes: number) {
  if (viz.cat === cat && viz.mes === mes) {
    viz.cat = null;
    viz.mes = null;
    return;
  }
  viz.cat = cat;
  viz.mes = mes;
}
function onBaseCell(base: string, mes: number) {
  if (viz.base === base && viz.mes === mes) {
    viz.base = null;
    viz.mes = null;
    return;
  }
  viz.base = base;
  viz.mes = mes;
}
function resetSlice() {
  filters.semana = 0;
  filters.mes = 0;
  filters.gerencia = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  filters.base = "Todos";
  filters.tipo = "Operacional";
  viz.cat = null;
  viz.base = null;
  viz.mes = null;
}
const hasActiveFilters = computed(() =>
  filters.semana !== 0
  || filters.mes !== 0
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.base !== "Todos"
  || filters.tipo !== "Operacional"
  || !!viz.cat
  || !!viz.base
  || !!viz.mes,
);

function isCatDim(cat: string, mes: number) {
  if (viz.cat && cat !== viz.cat) return true;
  const m = selectedMes.value;
  if (m && mes !== m) return true;
  return false;
}
function isBaseDim(base: string, mes: number) {
  const b = selectedBase.value;
  if (b && base !== b) return true;
  const m = selectedMes.value;
  if (m && mes !== m) return true;
  return false;
}

async function recarregar() {
  loading.value = true;
  try {
    const [subs, emps] = await Promise.all([
      fetchSubmissions({ ano: Number(filters.ano) }),
      employees.value.length ? Promise.resolve(employees.value) : fetchEmployees(),
    ]);
    submissions.value = subs;
    employees.value   = emps;
    ncLight.value     = await fetchNcLight(subs.map((s) => s.id));
  } finally {
    loading.value = false;
  }
}
onMounted(recarregar);
watch(() => filters.ano, recarregar);
watch(() => filters.base, () => { viz.base = null; });
watch(() => filters.mes, () => { viz.mes = null; });

function matchTipoPoc(auditagem: string | undefined) {
  if (filters.tipo === "Todos") return true;
  const allowed = TIPO_AUDITAGEM[filters.tipo];
  if (!allowed) return true;
  return allowed.includes((auditagem ?? "").toUpperCase());
}

function mesDaData(data: string): number {
  const m = /^(\d{4})-(\d{2})/.exec(data);
  if (m) return Number(m[2]);
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? 0 : d.getMonth() + 1;
}

function catIndex(categoria: string | undefined) {
  if (!categoria) return -1;
  const cat = categoria.toLowerCase();
  return CAT_DEFS.findIndex((c) => cat.includes(c.match.toLowerCase()) || cat === c.match.toLowerCase());
}

function applySlice(omit: { base?: boolean; mes?: boolean } = {}) {
  let s = filterByGerente(submissions.value, employees.value, filters.gerente);
  s = filterByCoordenador(s, employees.value, filters.coordenador);
  s = filterByGerencia(s, employees.value, filters.gerencia);
  s = s.filter((sub) => matchTipoPoc(sub.auditagem));
  if (filters.semana) {
    s = s.filter((sub) => semanaDaData(sub.data) === filters.semana);
  }
  const base = selectedBase.value;
  if (!omit.base && base) s = s.filter((sub) => sub.base === base);
  const mes = selectedMes.value;
  if (!omit.mes && mes) s = s.filter((sub) => mesDaData(sub.data) === mes);
  return s;
}

const filteredSubs = computed(() => applySlice());
const catChartSubs = computed(() => applySlice({ mes: true }));
const baseChartSubs = computed(() => applySlice({ base: true, mes: true }));

const catMonthMap = computed(() => {
  const m: Record<string, number> = {};
  for (const s of catChartSubs.value) {
    const mes = mesDaData(s.data);
    if (mes) m[s.id] = mes;
  }
  return m;
});
const baseMonthMap = computed(() => {
  const m: Record<string, number> = {};
  for (const s of baseChartSubs.value) {
    const mes = mesDaData(s.data);
    if (mes) m[s.id] = mes;
  }
  return m;
});

const catData = computed(() => {
  const rows = CAT_DEFS.map((c) => ({ label: c.label, values: Array(12).fill(0) as number[] }));
  const rowMap: Record<string, number[]> = {};
  rows.forEach((r) => { rowMap[r.label] = r.values; });
  for (const r of ncLight.value) {
    const mes = catMonthMap.value[r.submission_id];
    if (!mes) continue;
    const ci = catIndex(r.categoria);
    if (ci < 0) continue;
    rowMap[rows[ci].label][mes - 1]++;
  }
  return rows;
});

const baseData = computed(() => {
  const basesInData = [...new Set(baseChartSubs.value.map((s) => s.base).filter(Boolean))].sort();
  const rows = basesInData.map((label) => ({ label, values: Array(12).fill(0) as number[] }));
  const rowMap: Record<string, number[]> = {};
  rows.forEach((r) => { rowMap[r.label] = r.values; });
  const subBase: Record<string, string> = {};
  for (const s of baseChartSubs.value) subBase[s.id] = s.base;
  const catCi = viz.cat ? CAT_DEFS.findIndex((c) => c.label === viz.cat) : -1;
  for (const r of ncLight.value) {
    const mes = baseMonthMap.value[r.submission_id];
    const base = subBase[r.submission_id];
    if (!mes || !base || !rowMap[base]) continue;
    if (catCi >= 0 && catIndex(r.categoria) !== catCi) continue;
    rowMap[base][mes - 1]++;
  }
  return rows;
});

const colTotals = computed(() =>
  months.map((_, mi) => catData.value.reduce((s, r) => s + r.values[mi], 0)),
);
const catGrand = computed(() => colTotals.value.reduce((s, v) => s + v, 0));
const baseColTotals = computed(() =>
  months.map((_, mi) => baseData.value.reduce((s, r) => s + r.values[mi], 0)),
);
const baseTotalInc = computed(() => baseColTotals.value.reduce((s, v) => s + v, 0));
function rowSum(values: number[]) { return values.reduce((s, v) => s + v, 0); }

const totalInc = computed(() => {
  const ids = new Set(filteredSubs.value.map((s) => s.id));
  const catCi = viz.cat ? CAT_DEFS.findIndex((c) => c.label === viz.cat) : -1;
  let n = 0;
  for (const r of ncLight.value) {
    if (!ids.has(r.submission_id)) continue;
    if (catCi >= 0 && catIndex(r.categoria) !== catCi) continue;
    n++;
  }
  return n;
});

const heatMax = computed(() => {
  let m = 1;
  for (const row of catData.value) for (const v of row.values) if (v > m) m = v;
  for (const row of baseData.value) for (const v of row.values) if (v > m) m = v;
  return m;
});

function heatColor(v: number): string {
  if (v === 0) return "#22c55e";
  const t = v / heatMax.value;
  if (t <= 0.2) return "#4ade80";
  if (t <= 0.4) return "#86efac";
  if (t <= 0.55) return "#eab308";
  if (t <= 0.7) return "#f97316";
  if (t <= 0.85) return "#ef4444";
  return "#7f1d1d";
}

function cellTextColor(v: number): string {
  if (v === 0) return "#166534";
  return v / heatMax.value <= 0.4 ? "#166534" : "#fff";
}

const legendLevels = computed(() => [
  { color: "#22c55e", label: "0" },
  { color: "#4ade80", label: "Baixo" },
  { color: "#eab308", label: "Médio" },
  { color: "#ef4444", label: "Alto" },
  { color: "#7f1d1d", label: `${heatMax.value}` },
]);

</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.mapa-mensal-page { background: #f8fafc; min-height: 100vh; }

// â"€â"€ Filter bar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

// â"€â"€ KPI cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
.kpi-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.kpi-legend-card { border-radius: 12px; height: 100%; }
.legend-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-bottom: 12px;
}
.legend-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-swatch {
  width: 32px; height: 22px; border-radius: 4px;
  border: 1px solid rgba(0,0,0,.12);
}
.legend-label { font-size: 12px; font-weight: 600; color: #475569; }

// â"€â"€ Heat map card â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.heat-card { border-radius: 12px; }
.heat-card-title {
  font-size: 22px; font-weight: 800; color: $brand;
  text-align: center; padding: 8px 0 4px;
}
.heat-card-sub {
  font-size: 11px; color: #94a3b8; text-align: center; margin-top: -2px;
}
.heat-wrap { overflow-x: auto; }

.heat-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-size: 12px; white-space: nowrap;

  thead tr th {
    background: #111827; color: #fff;
    padding: 8px 10px; font-size: 11px; font-weight: 700;
    text-align: center;
    border-right: 1.5px solid #1f2937;
    &:last-child { border-right: none; }
  }
  .th-label { text-align: left; min-width: 130px; font-size: 11px; }
  .th-mes { cursor: pointer; }
  .th--on { background: $brand !important; }
  .th-total { background: #1f2937; }

  tbody tr:hover td { filter: brightness(.9); }

  .td-empty {
    padding: 40px 16px; text-align: center;
    color: #6b7280; font-size: 13px; font-weight: 500;
    background: #111827;
    .q-icon { vertical-align: middle; margin-right: 6px; }
  }
  .td-label {
    background: #111827; color: #fff;
    font-weight: 700; font-size: 11px;
    padding: 8px 12px; text-align: left;
    border-right: 1.5px solid #1f2937;
    border-bottom: 1.5px solid #1f2937;
    min-width: 130px;
    cursor: pointer;
    &.td-label--on { background: $brand; }
  }

  .td-cell {
    padding: 7px 8px; text-align: center;
    font-weight: 700; font-size: 13px;
    border-right: 1.5px solid rgba(255,255,255,.15);
    border-bottom: 1.5px solid rgba(255,255,255,.15);
    min-width: 42px;
    cursor: pointer;
    transition: filter .15s, opacity .15s;
    &--dim { opacity: .28; }
    &--on { outline: 2px solid #fff; outline-offset: -2px; }
  }

  .td-row-total {
    padding: 7px 10px; text-align: center;
    font-weight: 800; font-size: 13px;
    border-bottom: 1.5px solid rgba(0,0,0,.1);
    min-width: 54px;
  }

  tfoot .total-row {
    .td-label {
      background: #0f172a; border-bottom: none;
      font-size: 12px;
    }
    .td-total-cell {
      background: #0f172a; color: #fff;
      padding: 8px 8px; text-align: center;
      font-weight: 700; font-size: 13px;
      border-right: 1.5px solid #1f2937;
      border-bottom: none;
    }
    .td-grand {
      background: #0f172a; color: #fff;
      padding: 8px 10px; text-align: center;
      font-weight: 800; font-size: 14px;
      border-bottom: none;
    }
  }
}

// â"€â"€ Dark mode â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.body--dark {
  .mapa-mensal-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill {
    background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .kpi-legend-card { background: #1e293b; }
  .legend-title { color: #94a3b8; }
  .legend-label { color: #cbd5e1; }
  .filter-chip { background: rgba($brand, .2); }
}
</style>

