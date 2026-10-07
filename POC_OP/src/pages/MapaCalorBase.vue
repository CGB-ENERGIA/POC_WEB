<template>
  <q-page class="mapa-page">
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

        <!-- Row 1: Semana · Mês · Ano · Gerência -->
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
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerenciasOpts" :key="g"
                :class="['pill', filters.gerencia === g && 'pill--active']"
                @click="filters.gerencia = g">{{ g }}</button>
            </div>
          </div>
        </div>

        <!-- Row 2: Gerente · Base -->
        <div class="filter-row">
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
          <div class="filter-divider" />
          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in basesOpts" :key="b"
                :class="['pill', filters.base === b && 'pill--active']"
                @click="filters.base = b">{{ b }}</button>
            </div>
          </div>
        </div>

      </div>
      </div>
      <transition name="chip-bar">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ filters.mes }}</span>
          <span v-if="filters.semana !== 0" class="filter-chip filter-chip--hit" @click="filters.semana = 0">{{ semanaLabel }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerente !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerente = 'Todos'">{{ filters.gerente }}</span>
          <span v-if="filters.coordenador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.coordenador = 'Todos'">{{ filters.coordenador }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ filters.base }}</span>
          <span v-if="viz.base && viz.base !== filters.base" class="filter-chip filter-chip--hit" @click="viz.base = null">{{ viz.base }}</span>
          <span v-if="viz.cat" class="filter-chip filter-chip--hit" @click="viz.cat = null">{{ viz.cat }}</span>
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
        <div class="col-12 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <KpiFlame />
              <div class="kpi-stat-value" style="color:#8B1C2B">
                {{ totalInc.toLocaleString('pt-BR') }}
              </div>
              <div class="kpi-stat-label">Inconformidades</div>
              <div class="kpi-stat-sub">acumulado no Período</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#dc2626" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(220,38,38,.1)">
                <q-icon name="mdi-alert" size="24px" style="color:#dc2626" />
              </div>
              <div class="kpi-stat-value" style="color:#dc2626">
                {{ maxCell.value }}
              </div>
              <div class="kpi-stat-label">Pior Célula</div>
              <div class="kpi-stat-sub">{{ maxCell.base }} · {{ maxCell.cat }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
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

      <!-- Heat map table -->
      <q-card flat bordered class="heatmap-card">
        <q-card-section class="q-pa-md q-pb-sm">
          <div class="heatmap-card-title">Matriz</div>
          <div class="heatmap-card-sub">Clique na base, na categoria ou na célula para filtrar</div>
        </q-card-section>
        <q-card-section class="q-pa-md q-pt-none">
          <div class="heatmap-wrap">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th class="th-base">
                    <span>Base</span>
                    <q-icon name="mdi-triangle" size="10px" class="th-sort-icon" />
                  </th>
                  <th
                    v-for="cat in categories" :key="cat"
                    class="th-cat"
                    :class="{ 'th--on': viz.cat === cat }"
                    @click="toggleCat(cat)"
                  >{{ cat }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!matrixData.length">
                  <td :colspan="categories.length + 1" class="td-empty">
                    <q-icon name="mdi-check-circle-outline" size="28px" color="positive" />
                    Sem inconformidades no período
                  </td>
                </tr>
                <tr v-for="row in matrixData" :key="row.base">
                  <td
                    class="td-base"
                    :class="{ 'td-base--on': selectedBase === row.base }"
                    @click="toggleBase(row.base)"
                  >{{ row.base }}</td>
                  <td
                    v-for="(val, i) in row.values" :key="i"
                    class="td-cell"
                    :class="{
                      'td-cell--dim': isDim(row.base, categories[i]),
                      'td-cell--on': selectedBase === row.base && viz.cat === categories[i],
                    }"
                    :style="{ background: heatColor(val), color: cellTextColor(val) }"
                    @click="onCell(row.base, categories[i])"
                  >
                    {{ val }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td class="td-base td-total">Total</td>
                  <td v-for="(t, i) in colTotals" :key="i" class="td-cell td-total">
                    {{ t }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </q-card-section>
      </q-card>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useChecklistData } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, semanaDaData, GERENTES, COORDENADORES, filterByCoordenador } from "@/lib/dashboard";
import KpiFlame from "@/components/KpiFlame.vue";

const { loading, error, submissions, responses, employees, load } = useChecklistData();

// â"€â"€â"€ Filters â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const now = new Date();
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
  "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
};

const semanasOpts = [
  { v: 0, l: "Todos" },
  { v: 1, l: "1ª Semana" },
  { v: 2, l: "2ª Semana" },
  { v: 3, l: "3ª Semana" },
  { v: 4, l: "4ª Semana" },
];
const mesesOpts    = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26","jul/26","ago/26","set/26","out/26","nov/26","dez/26"];
const anosOpts     = ["2024","2025","2026"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
const gerentesOpts = [...GERENTES];
const coordenadoresOpts = [...COORDENADORES];
const basesOpts    = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];

const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  semana: 0, mes: curMesLabel, ano: String(now.getFullYear()),
  gerencia: "Todos", gerente: "Todos", coordenador: "Todos", base: "Todos",
});

const viz = reactive({
  base: null as string | null,
  cat: null as string | null,
});

const selectedBase = computed(() =>
  viz.base ?? (filters.base !== "Todos" ? filters.base : null),
);
const semanaLabel = computed(() => semanasOpts.find((s) => s.v === filters.semana)?.l ?? "");

function toggleCat(cat: string) {
  viz.cat = viz.cat === cat ? null : cat;
}
function toggleBase(base: string) {
  viz.base = viz.base === base ? null : base;
}
function onCell(base: string, cat: string) {
  if (viz.base === base && viz.cat === cat) {
    viz.base = null;
    viz.cat = null;
    return;
  }
  viz.base = base;
  viz.cat = cat;
}
function resetSlice() {
  filters.semana = 0;
  filters.gerencia = "Todos";
  filters.gerente = "Todos";
  filters.coordenador = "Todos";
  filters.base = "Todos";
  viz.base = null;
  viz.cat = null;
}
const hasActiveFilters = computed(() =>
  filters.semana !== 0
  || filters.gerencia !== "Todos"
  || filters.gerente !== "Todos"
  || filters.coordenador !== "Todos"
  || filters.base !== "Todos"
  || !!viz.base
  || !!viz.cat,
);

function isDim(base: string, cat: string) {
  const b = selectedBase.value;
  if (b && base !== b) return true;
  if (viz.cat && cat !== viz.cat) return true;
  return false;
}

async function recarregar() {
  const mesNum = MONTH_MAP[filters.mes.slice(0, 3)] ?? (now.getMonth() + 1);
  await load({
    ano: Number(filters.ano),
    mes: mesNum,
    base: undefined,
  });
}
onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);
watch(() => filters.base, () => { viz.base = null; });

function applySlice(omit: { base?: boolean } = {}) {
  let s = filterByGerente(submissions.value, employees.value, filters.gerente);
  s = filterByCoordenador(s, employees.value, filters.coordenador);
  s = filterByGerencia(s, employees.value, filters.gerencia);
  if (filters.semana) {
    s = s.filter((sub) => semanaDaData(sub.data) === filters.semana);
  }
  const base = selectedBase.value;
  if (!omit.base && base) s = s.filter((sub) => sub.base === base);
  return s;
}

const filteredSubs = computed(() => applySlice());
const matrixSubs = computed(() => applySlice({ base: true }));

// â"€â"€â"€ Categories â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const CAT_DEFS = [
  { label: "APR", match: "APR" },
  { label: "Epi, Epc e Ferramentas", match: "EPI" },
  { label: "Padrinho de Segurança", match: "Padrinho" },
  { label: "Procedimento", match: "Procedimento" },
  { label: "Regras de Ouro", match: "Regras de Ouro" },
  { label: "Trabalho em Altura", match: "Altura" },
  { label: "Veículos e Equipamentos", match: "Veículo" },
];
const categories = CAT_DEFS.map((c) => c.label);

function catIndex(categoria: string | undefined) {
  if (!categoria) return -1;
  const cat = categoria.toLowerCase();
  return CAT_DEFS.findIndex((c) => cat.includes(c.match.toLowerCase()) || cat === c.match.toLowerCase());
}

// â"€â"€â"€ NC Matrix base Ã— category from real data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const subById = computed(() => {
  const m: Record<string, { base: string }> = {};
  for (const s of matrixSubs.value) m[s.id] = { base: s.base };
  return m;
});

const matrixData = computed(() => {
  const basesInData = [...new Set(matrixSubs.value.map((s) => s.base).filter(Boolean))].sort();
  const rows = basesInData.map((base) => ({ base, values: categories.map(() => 0) }));
  const rowMap: Record<string, number[]> = {};
  rows.forEach((r) => { rowMap[r.base] = r.values; });

  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    const sub = subById.value[r.submission_id];
    if (!sub?.base) continue;
    const ci = catIndex(r.categoria);
    if (ci < 0) continue;
    if (!rowMap[sub.base]) {
      rowMap[sub.base] = categories.map(() => 0);
      rows.push({ base: sub.base, values: rowMap[sub.base] });
    }
    rowMap[sub.base][ci]++;
  }
  return rows;
});

// â"€â"€â"€ Computed â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const colTotals = computed(() =>
  categories.map((_, ci) => matrixData.value.reduce((s, r) => s + r.values[ci], 0))
);

const totalInc = computed(() => {
  const ids = new Set(filteredSubs.value.map((s) => s.id));
  let n = 0;
  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    if (!ids.has(r.submission_id)) continue;
    if (viz.cat && catIndex(r.categoria) !== categories.indexOf(viz.cat)) continue;
    n++;
  }
  return n;
});

const maxCell = computed(() => {
  let max = { value: 0, base: "", cat: "" };
  matrixData.value.forEach((row) => {
    row.values.forEach((v, ci) => {
      if (isDim(row.base, categories[ci])) return;
      if (v > max.value) max = { value: v, base: row.base, cat: categories[ci] };
    });
  });
  return max;
});

const heatMax = computed(() => {
  let m = 1;
  matrixData.value.forEach((row) => {
    row.values.forEach((v) => { if (v > m) m = v; });
  });
  return m;
});

// â"€â"€â"€ Color scale â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function heatColor(v: number): string {
  if (v === 0) return "#22c55e";
  const t = v / heatMax.value;
  if (t <= 0.2) return "#4ade80";
  if (t <= 0.4) return "#86efac";
  if (t <= 0.55) return "#eab308";
  if (t <= 0.7) return "#f97316";
  if (t <= 0.85) return "#ef4444";
  return "#991b1b";
}

function cellTextColor(v: number): string {
  if (v === 0) return "#166534";
  return v / heatMax.value <= 0.4 ? "#166534" : "#fff";
}

const legendLevels = computed(() => {
  const max = heatMax.value;
  return [
    { color: "#22c55e", label: "0" },
    { color: "#4ade80", label: "Baixo" },
    { color: "#86efac", label: "" },
    { color: "#eab308", label: "Médio" },
    { color: "#f97316", label: "" },
    { color: "#ef4444", label: "Alto" },
    { color: "#991b1b", label: `${max}` },
  ].filter((lv) => lv.label !== "");
});
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.mapa-page { background: #f8fafc; min-height: 100vh; }

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

// â"€â"€ Legend card â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.kpi-legend-card {
  border-radius: 12px; height: 100%;
}
.legend-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-bottom: 12px;
}
.legend-row {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
}
.legend-item {
  display: flex; align-items: center; gap: 6px;
}
.legend-swatch {
  width: 28px; height: 20px; border-radius: 4px;
  border: 1px solid rgba(0,0,0,.08);
}
.legend-label {
  font-size: 11px; font-weight: 600; color: #475569;
}

// â"€â"€ Heat map card & table â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.heatmap-card { border-radius: 12px; }
.heatmap-card-title {
  font-size: 22px; font-weight: 800; color: $brand;
  text-align: center; letter-spacing: .5px;
}
.heatmap-card-sub {
  font-size: 12px; color: #94a3b8; text-align: center; margin-top: 4px;
}
.heatmap-wrap { overflow-x: auto; }

.heatmap-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-size: 13px;

  thead tr th {
    background: #1e293b; color: #fff;
    padding: 12px 16px; font-size: 12px; font-weight: 700;
    text-align: center; white-space: nowrap;
    border-right: 2px solid #334155;
    &:last-child { border-right: none; }
  }
  .th-base {
    text-align: left; min-width: 80px;
    display: flex; align-items: center; gap: 6px;
  }
  .th-sort-icon { opacity: .5; }

  .th-cat {
    cursor: pointer;
    &.th--on { background: $brand; }
  }

  tbody tr {
    &:hover td { filter: brightness(.95); }
  }

  .td-base {
    background: #1e293b; color: #fff;
    font-weight: 700; font-size: 13px;
    padding: 12px 18px; text-align: center;
    border-right: 2px solid #334155;
    border-bottom: 2px solid #334155;
    letter-spacing: .5px;
    cursor: pointer;
    &.td-base--on { background: $brand; }
  }

  .td-empty {
    padding: 48px 16px; text-align: center;
    color: #94a3b8; font-size: 14px; font-weight: 500;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .td-cell {
    padding: 12px 16px; text-align: center;
    font-weight: 700; font-size: 15px;
    border-right: 2px solid rgba(255,255,255,.25);
    border-bottom: 2px solid rgba(255,255,255,.25);
    min-width: 90px;
    cursor: pointer;
    &--dim { opacity: .28; }
    &--on { outline: 2px solid #0f172a; outline-offset: -2px; }
    &:last-child { border-right: 2px solid $border; }
  }

  tfoot .total-row {
    .td-base.td-total {
      background: #0f172a; border-bottom: none;
    }
    .td-cell.td-total {
      background: #0f172a; color: #fff;
      border-right: 2px solid #1e293b;
      border-bottom: none;
      font-size: 14px;
    }
  }
}

// â"€â"€ Dark mode â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.body--dark {
  .mapa-page { background: #0f172a; }
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

