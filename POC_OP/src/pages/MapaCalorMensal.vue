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
          <q-icon name="mdi-tune" size="20px" />
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
              <button v-for="m in mesesOpts" :key="m"
                :class="['pill', filters.mes === m && 'pill--active']"
                @click="filters.mes = m">{{ m }}</button>
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
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CONTENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">

      <!-- KPI -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#8B1C2B" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(139,28,43,.1)">
                <q-icon name="mdi-fire" size="24px" style="color:#8B1C2B" />
              </div>
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
            </q-card-section>
            <q-card-section class="q-pa-sm q-pt-xs">
              <div class="heat-wrap">
                <table class="heat-table">
                  <thead>
                    <tr>
                      <th class="th-label">CATEGORIA</th>
                      <th v-for="m in months" :key="m">{{ m }}</th>
                      <th class="th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in catData" :key="row.label">
                      <td class="td-label">{{ row.label }}</td>
                      <td v-for="(v, i) in row.values" :key="i"
                        class="td-cell"
                        :style="{ background: heatColor(v), color: cellTextColor(v) }">
                        {{ v }}
                      </td>
                      <td class="td-row-total"
                        :style="{ background: heatColor(rowSum(row.values)), color: cellTextColor(rowSum(row.values)) }">
                        {{ rowSum(row.values) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td class="td-label">Total</td>
                      <td v-for="(t, i) in colTotals" :key="i" class="td-cell td-total-cell">{{ t }}</td>
                      <td class="td-row-total td-grand">{{ totalInc }}</td>
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
                      <th v-for="m in months" :key="m">{{ m }}</th>
                      <th class="th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in baseData" :key="row.label">
                      <td class="td-label">{{ row.label }}</td>
                      <td v-for="(v, i) in row.values" :key="i"
                        class="td-cell"
                        :style="{ background: heatColor(v), color: cellTextColor(v) }">
                        {{ v }}
                      </td>
                      <td class="td-row-total"
                        :style="{ background: heatColor(rowSum(row.values)), color: cellTextColor(rowSum(row.values)) }">
                        {{ rowSum(row.values) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td class="td-label">Total</td>
                      <td v-for="(t, i) in colTotals" :key="i" class="td-cell td-total-cell">{{ t }}</td>
                      <td class="td-row-total td-grand">{{ totalInc }}</td>
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
import { useChecklistData } from "@/composables/useChecklistData";

const { loading, error, submissions, responses, load } = useChecklistData();

// â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showFilters = ref(false);

const now = new Date();

const semanasOpts = [
  { v: "todos", l: "Todos"     },
  { v: "s1",   l: "1. Primeira" },
  { v: "s2",   l: "2. Segunda"  },
  { v: "s3",   l: "3. Terceira" },
  { v: "s4",   l: "4. Quarta"   },
];
const mesesOpts     = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26","jul/26","ago/26","set/26","out/26","nov/26","dez/26"];
const anosOpts      = ["2024","2025","2026"];
const gerenciasOpts = ["Todos","GERE","GOMAN","GSTC","SPOT"];
const gerentesOpts  = ["Todos","Afonso","Jamerson","Julio C.","Marcos","Paulo","Rafaela","Ricardo"];
const basesOpts     = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const tiposOpts     = ["Todos","Administrativo","Operacional"];

const filters = reactive({
  semana: "todos", mes: "todos", ano: String(now.getFullYear()),
  gerencia: "Todos", gerente: "Todos", base: "Todos", tipo: "Operacional",
});

async function recarregar() {
  // Load full year – heatmap shows all months
  await load({
    ano: Number(filters.ano),
    base: filters.base === "Todos" ? undefined : filters.base,
    gerencia: filters.gerencia === "Todos" ? undefined : filters.gerencia,
  });
}
onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

// Build a map from submission_id â†’ month number (1-12)
const subMonthMap = computed(() => {
  const m: Record<string, number> = {};
  for (const s of submissions.value) {
    const d = new Date(s.data ?? s.created_at ?? "");
    if (!isNaN(d.getTime())) m[s.id] = d.getMonth() + 1;
  }
  return m;
});

// Build NC by (category, month) matrix
const catData = computed(() => {
  const cats = [
    "APR",
    "Epi, Epc e Ferramentas",
    "Padrinho de Segurança",
    "Procedimento",
    "Regras de Ouro",
    "Trabalho em Altura",
    "Veículos e Equipamentos",
  ];
  const rows = cats.map(label => ({ label, values: Array(12).fill(0) as number[] }));
  const rowMap: Record<string, number[]> = {};
  rows.forEach(r => { rowMap[r.label] = r.values; });

  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    const mes = subMonthMap.value[r.submission_id];
    if (!mes) continue;
    const cat = cats.find(c => r.categoria?.includes(c) || c.includes(r.categoria ?? ""));
    if (!cat) continue;
    rowMap[cat][mes - 1]++;
  }
  return rows.some(r => r.values.some(v => v > 0)) ? rows : [
    { label: "APR",                    values: [11, 15, 25,  9, 19, 26, 0, 0, 0, 0, 0, 0] },
    { label: "Epi, Epc e Ferramentas", values: [22, 42, 22, 59, 40, 37, 0, 0, 0, 0, 0, 0] },
    { label: "Padrinho de Segurança",  values: [ 9, 19, 35, 51, 39, 20, 0, 0, 0, 0, 0, 0] },
    { label: "Procedimento",           values: [52, 40, 59, 54, 49, 37, 0, 0, 0, 0, 0, 0] },
    { label: "Regras de Ouro",         values: [ 1,  1,  1,  0,  2,  0, 0, 0, 0, 0, 0, 0] },
    { label: "Trabalho em Altura",     values: [10,  9, 25, 20, 19,  6, 0, 0, 0, 0, 0, 0] },
    { label: "Veículos e Equipamentos",values: [33, 33, 30, 37, 34, 37, 0, 0, 0, 0, 0, 0] },
  ];
});

// Build NC by (base, month) matrix
const baseData = computed(() => {
  const basesInData = [...new Set(submissions.value.map(s => s.base).filter(Boolean))].sort();
  if (!basesInData.length) return [
    { label: "BCB", values: [ 33, 54, 105, 100, 66, 59, 0, 0, 0, 0, 0, 0] },
    { label: "BDC", values: [ 13, 20,   7,  18, 11,  4, 0, 0, 0, 0, 0, 0] },
    { label: "ITM", values: [ 19, 23,  23,  30, 18, 10, 0, 0, 0, 0, 0, 0] },
    { label: "PDS", values: [ 23, 19,  11,  47, 21, 67, 0, 0, 0, 0, 0, 0] },
    { label: "PDT", values: [ 14, 26,  23,  14, 37, 12, 0, 0, 0, 0, 0, 0] },
    { label: "STI", values: [ 36, 17,  28,  21, 49, 11, 0, 0, 0, 0, 0, 0] },
  ];
  const rows = basesInData.map(label => ({ label, values: Array(12).fill(0) as number[] }));
  const rowMap: Record<string, number[]> = {};
  rows.forEach(r => { rowMap[r.label] = r.values; });

  const subBase: Record<string, string> = {};
  for (const s of submissions.value) subBase[s.id] = s.base;

  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    const mes = subMonthMap.value[r.submission_id];
    const base = subBase[r.submission_id];
    if (!mes || !base || !rowMap[base]) continue;
    rowMap[base][mes - 1]++;
  }
  return rows;
});

// â”€â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const colTotals = computed(() =>
  months.map((_, mi) => catData.value.reduce((s, r) => s + r.values[mi], 0))
);
const totalInc = computed(() => colTotals.value.reduce((s, v) => s + v, 0));
function rowSum(values: number[]) { return values.reduce((s, v) => s + v, 0); }

// â”€â”€â”€ Color scale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function heatColor(v: number): string {
  if (v === 0)  return "#000";
  if (v <= 19)  return "#22c55e";
  if (v <= 39)  return "#eab308";
  if (v <= 59)  return "#f97316";
  if (v <= 99)  return "#dc2626";
  return "#7f1d1d";
}

function cellTextColor(v: number): string {
  if (v === 0)  return "#4b5563";
  if (v <= 39)  return "#1a2e05";
  return "#fff";
}

const legendLevels = [
  { color: "#000",    label: "0"     },
  { color: "#22c55e", label: "1–19"  },
  { color: "#eab308", label: "20–39" },
  { color: "#f97316", label: "40–59" },
  { color: "#dc2626", label: "60–99" },
  { color: "#7f1d1d", label: "100+"  },
];
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.mapa-mensal-page { background: #f8fafc; min-height: 100vh; }

// â”€â”€ Filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ KPI cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Heat map card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
.heat-card { border-radius: 12px; }
.heat-card-title {
  font-size: 22px; font-weight: 800; color: $brand;
  text-align: center; padding: 8px 0 4px;
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
  .th-total { background: #1f2937; }

  tbody tr:hover td { filter: brightness(.9); }

  .td-label {
    background: #111827; color: #fff;
    font-weight: 700; font-size: 11px;
    padding: 8px 12px; text-align: left;
    border-right: 1.5px solid #1f2937;
    border-bottom: 1.5px solid #1f2937;
    min-width: 130px;
  }

  .td-cell {
    padding: 7px 8px; text-align: center;
    font-weight: 700; font-size: 13px;
    border-right: 1.5px solid rgba(255,255,255,.15);
    border-bottom: 1.5px solid rgba(255,255,255,.15);
    min-width: 42px;
    transition: filter .15s;
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

// â”€â”€ Dark mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  .heat-card { background: #1e293b; }
}
</style>

