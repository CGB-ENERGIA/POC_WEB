<template>
  <q-page class="hist-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- ═══════════════════════════════════════════════════════════
         HEADER BAR
    ═══════════════════════════════════════════════════════════ -->
    <div class="hist-header">

      <!-- Left: title · date · filtrar por -->
      <div class="hist-header__left">
        <div class="hist-title">HISTÓRICO — ICIT</div>
        <div class="hist-date">
          <span>{{ dataAtual }}</span>
          <span class="date-muted"> · Última Atualização</span>
        </div>
        <div class="filtrar-por">
          <span class="filtrar-label">Filtrar por</span>
          <button
            v-for="f in filtroTipos" :key="f.value"
            :class="['filtro-btn', `filtro-btn--${f.color}`, filters.tipo === f.value && 'filtro-btn--on']"
            @click="filters.tipo = f.value">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Right: filter pills -->
      <div class="hist-header__right">
        <div class="frow">

          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in [2024,2025,2026]" :key="a"
                :class="['pill', filters.ano === a && 'pill--active']"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in bases" :key="b"
                :class="['pill', filters.base === b && 'pill--active']"
                @click="filters.base = (filters.base === b ? '' : b)">{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerente</span>
            <div class="pill-group">
              <button v-for="g in gerentesOpts" :key="g"
                :class="['pill pill--sm', filters.gerente === g && 'pill--active']"
                @click="filters.gerente = (filters.gerente === g ? '' : g)">{{ g }}</button>
            </div>
          </div>

          <div class="fgroup">
            <span class="fgroup__label">Coordenador</span>
            <div class="pill-group">
              <button v-for="g in coordenadoresOpts" :key="g"
                :class="['pill pill--sm', filters.coordenador === g && 'pill--active']"
                @click="filters.coordenador = (filters.coordenador === g ? '' : g)">{{ g }}</button>
            </div>
          </div>

        </div>
        <div class="frow">

          <div class="fgroup">
            <span class="fgroup__label">Mês</span>
            <div class="pill-group">
              <button v-for="m in meses" :key="m.v"
                :class="['pill', filters.mes === m.v && 'pill--active']"
                @click="filters.mes = m.v">{{ m.l }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--prefixo">
            <span class="fgroup__label">Prefixo</span>
            <q-select v-model="filters.prefixo" :options="prefixoDisplayOpts"
              dense outlined hide-bottom-space use-input input-debounce="0"
              class="prefixo-select" popup-content-class="prefixo-popup"
              @filter="filterPrefixo" />
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerência</span>
            <div class="pill-group">
              <button v-for="g in gerencias" :key="g"
                :class="['pill', filters.gerencia === g && 'pill--active']"
                @click="filters.gerencia = (filters.gerencia === g ? '' : g)">{{ g }}</button>
            </div>
          </div>

        </div>
      </div>

      <!-- Back button -->
      <q-btn flat round icon="mdi-arrow-left" color="grey-7" size="md"
        class="back-btn" @click="$router.push('/icit')" />
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         DATA TABLE
    ═══════════════════════════════════════════════════════════ -->
    <div class="table-wrap" v-if="filteredRows.length || loading">
      <table class="hist-table">
        <thead>
          <tr>
            <th class="th-prefix">Prefixo</th>
            <th v-for="(name, i) in monthNames" :key="name"
              :class="['th-month', i + 1 === filters.mes && 'th-month--current']">
              {{ name }}
            </th>
            <th class="th-total">Total <q-icon name="mdi-menu-down" size="14px" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !filteredRows.length">
            <td :colspan="14" class="td-loading">Carregando dados…</td>
          </tr>
          <tr v-for="row in filteredRows" :key="row.prefixo" class="table-row">
            <td class="td-prefix">{{ row.prefixo }}</td>
            <td v-for="(cell, mi) in row.months" :key="mi"
              :class="['td-cell',
                mi + 1 === filters.mes && 'td-cell--current',
                cell ? `td-icit--${icitClass(cell.pct)}` : 'td-empty']">
              <template v-if="cell">
                <div v-if="cell.reinc" class="cell-inner">
                  <span class="cell-reinc">Reincidência: {{ cell.reinc }}</span>
                  <span class="cell-pct">{{ fmtPct(cell.pct) }}</span>
                </div>
                <div v-else class="cell-inner cell-inner--single">{{ fmtPct(cell.pct) }}</div>
              </template>
            </td>
            <td class="td-total">
              <div class="cell-inner">
                <span class="total-reinc">Reincidência: {{ row.total.reinc }}</span>
                <span class="total-pct" :class="`total-pct--${icitClass(row.total.pct)}`">
                  {{ fmtPct(row.total.pct) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading" class="empty-state">
      <q-icon name="mdi-table-off" size="56px" color="grey-5" />
      <div class="empty-label">Nenhuma equipe encontrada para os filtros selecionados</div>
      <div class="empty-hint">Verifique se há dados carregados para {{ filters.ano }}</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted } from "vue";
import { useChecklistData } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, uniqueHierarchyOpts, filterByCoordenador } from "@/lib/dashboard";

const { loading, submissions, responses, employees, load } = useChecklistData();

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell { reinc?: number; pct: number }
interface Row  { prefixo: string; months: (Cell | null)[]; total: { reinc: number; pct: number } }

// ─── Filter options ───────────────────────────────────────────────────────────
const now = new Date();
const dataAtual = now.toLocaleString("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

const bases     = ["BCB","BDC","ITM","PDS","PDT","STI"];
const gerencias = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
const meses     = [
  { v: 1, l: "jan" }, { v: 2, l: "fev" },
  { v: 3, l: "mar" }, { v: 4, l: "abr" },
  { v: 5, l: "mai" }, { v: 6, l: "jun" },
  { v: 7, l: "jul" }, { v: 8, l: "ago" },
  { v: 9, l: "set" }, { v: 10, l: "out" },
  { v: 11, l: "nov"}, { v: 12, l: "dez" },
];
const filtroTipos = [
  { value: "<80%",      label: "<80% ICIT",  color: "orange" },
  { value: ">80%",      label: ">80% ICIT",  color: "green"  },
  { value: "Acidentes", label: "Acidentes",  color: "red"    },
  { value: "Geral",     label: "Geral",      color: "dark"   },
];
const monthNames = [
  "janeiro","fevereiro","março","abril",
  "maio","junho","julho","agosto",
  "setembro","outubro","novembro","dezembro",
];

const gerentesOpts      = computed(() => uniqueHierarchyOpts(employees.value, "gerente",      false));
const coordenadoresOpts = computed(() => uniqueHierarchyOpts(employees.value, "coordenador",  false));

// ─── Filter state ─────────────────────────────────────────────────────────────
const filters = reactive({
  ano:        now.getFullYear(),
  mes:        now.getMonth() + 1,
  base:       "",
  prefixo:    "Todos",
  gerente:    "",
  coordenador:"",
  gerencia:   "",
  tipo:       "Geral",
});

// ─── Data loading ─────────────────────────────────────────────────────────────
async function recarregar() {
  await load({
    ano:  filters.ano,
    base: filters.base || undefined,
  });
}
onMounted(recarregar);
watch(() => [filters.ano, filters.base], recarregar);

// ─── Prefixo options from real submissions ────────────────────────────────────
const allEquipes = computed<string[]>(() =>
  [...new Set(submissions.value.map(s => s.equipe).filter(Boolean) as string[])].sort()
);
const prefixoDisplayOpts = ref<string[]>(["Todos"]);
watch(allEquipes, equipes => {
  prefixoDisplayOpts.value = ["Todos", ...equipes];
}, { immediate: true });

function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    prefixoDisplayOpts.value = ["Todos",
      ...allEquipes.value.filter(p => p.toLowerCase().includes(needle))];
  });
}

// ─── ICIT per equipe per month (submission-level: checklists sem NC / total) ──
const rawRows = computed<Row[]>(() => {
  let subs = filterByGerente(submissions.value,  employees.value, filters.gerente    || "Todos");
  subs     = filterByCoordenador(subs,            employees.value, filters.coordenador || "Todos");
  subs     = filterByGerencia(subs,               employees.value, filters.gerencia   || "Todos");

  if (!subs.length) return [];

  // Build set of submission IDs that have at least one NC response
  const subIdSet = new Set(subs.map(s => s.id));
  const ncSubIds = new Set<string>();
  for (const r of responses.value) {
    if (subIdSet.has(r.submission_id) && r.resposta === "nao_conforme") {
      ncSubIds.add(r.submission_id);
    }
  }

  // Group submissions by equipe × month
  type MonthStats = { total: number; semNc: number };
  const equipeData: Record<string, Record<number, MonthStats>> = {};

  for (const s of subs) {
    const eq = s.equipe || "Sem equipe";
    const d  = new Date(s.data ?? s.created_at ?? "");
    if (isNaN(d.getTime())) continue;
    const month = d.getMonth() + 1;
    if (!equipeData[eq]) equipeData[eq] = {};
    if (!equipeData[eq][month]) equipeData[eq][month] = { total: 0, semNc: 0 };
    equipeData[eq][month].total++;
    if (!ncSubIds.has(s.id)) equipeData[eq][month].semNc++;
  }

  // Build rows
  return Object.entries(equipeData).map(([prefixo, mStats]) => {
    const months: (Cell | null)[] = [];
    let totalSubs  = 0;
    let totalSemNc = 0;
    for (let mi = 1; mi <= 12; mi++) {
      const st = mStats[mi];
      if (!st) { months.push(null); continue; }
      const pct = Math.round((st.semNc / st.total) * 10000) / 100;
      months.push({ pct });
      totalSubs  += st.total;
      totalSemNc += st.semNc;
    }
    const avgPct = totalSubs > 0 ? Math.round((totalSemNc / totalSubs) * 10000) / 100 : 0;
    return { prefixo, months, total: { reinc: 0, pct: avgPct } };
  });
});

// ─── Filtered + sorted rows ───────────────────────────────────────────────────
const filteredRows = computed<Row[]>(() => {
  let rows = rawRows.value;

  if (filters.prefixo && filters.prefixo !== "Todos")
    rows = rows.filter(r => r.prefixo === filters.prefixo);

  if (filters.base)
    rows = rows.filter(r => r.prefixo.split("-")[1] === filters.base);

  if      (filters.tipo === ">80%")      rows = rows.filter(r => r.total.pct >= 80);
  else if (filters.tipo === "<80%")      rows = rows.filter(r => r.total.pct < 80);
  else if (filters.tipo === "Acidentes") rows = [];

  return [...rows].sort((a, b) => {
    if (b.total.reinc !== a.total.reinc) return b.total.reinc - a.total.reinc;
    return a.total.pct - b.total.pct;
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPct(v: number) {
  return v.toFixed(2).replace(".", ",") + "%";
}

function icitClass(pct: number): "green" | "yellow" | "red" {
  if (pct >= 90) return "green";
  if (pct >= 80) return "yellow";
  return "red";
}
</script>

<style scoped lang="scss">
$brand:       #8B1C2B;
$border:      #e2e8f0;
$label-color: #94a3b8;
$inactive-bg: #f1f5f9;
$inactive-txt:#475569;

// ─── ICIT colours ─────────────────────────────────────────────────────────────
$icit-green:  #16a34a;
$icit-yellow: #d97706;
$icit-red:    #dc2626;

.hist-page {
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.hist-header {
  background: #fff;
  border-bottom: 1px solid $border;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 10px 16px 8px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
}

.hist-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}
.hist-title {
  font-size: 18px;
  font-weight: 800;
  color: $brand;
  letter-spacing: .5px;
  line-height: 1.1;
}
.hist-date  { font-size: 10px; color: #64748b; }
.date-muted { color: #94a3b8; }

/* Filtrar por */
.filtrar-por {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.filtrar-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
  white-space: nowrap;
}
.filtro-btn {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  opacity: .55;
  transition: opacity .18s, transform .1s;
  &:hover  { opacity: .85; }
  &:active { transform: scale(.96); }
  &--on    { opacity: 1; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
  &--orange { background: #d97706; color: #fff; }
  &--green  { background: $icit-green; color: #fff; }
  &--red    { background: $brand; color: #fff; }
  &--dark   { background: #1e293b; color: #fff; }
}

/* ─── Filter pills ───────────────────────────────────────────────────────── */
.hist-header__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.frow  { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.fgroup { display: flex; flex-direction: column; gap: 3px; }
.fgroup__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
  line-height: 1;
}
.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border: 1.5px solid $border;
  border-radius: 999px;
  background: $inactive-bg;
  color: $inactive-txt;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s, transform .1s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &:active { transform: scale(.96); }
  &--active { background: $brand; color: #fff; border-color: $brand; box-shadow: 0 2px 6px rgba($brand,.3); font-weight: 600; }
  &--sm { height: 26px; padding: 0 8px; font-size: 10px; }
}
.filter-divider { width: 1px; height: 34px; background: $border; flex-shrink: 0; align-self: flex-end; }

.fgroup--prefixo { min-width: 180px; }
.prefixo-select {
  height: 28px;
  :deep(.q-field__control) {
    height: 28px; min-height: 28px; border-radius: 8px;
    border-color: $border; background: $inactive-bg; padding: 0 8px;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) { border-color: $brand; }
  :deep(.q-field__native) { font-size: 11px; color: $inactive-txt; min-height: unset; line-height: 28px; }
  :deep(.q-field__append) { height: 28px; }
}
:global(.prefixo-popup .q-item) { font-size: 11px; min-height: 28px; padding: 2px 10px; }
:global(.prefixo-popup .q-item--active) { color: $brand !important; font-weight: 600; }

.back-btn { align-self: center; margin-left: auto; flex-shrink: 0; }

/* ─── Table wrapper ──────────────────────────────────────────────────────── */
.table-wrap {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  padding: 12px 16px;
}

/* ─── Table ──────────────────────────────────────────────────────────────── */
.hist-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 2px;
  font-size: 11px;

  // ── Header row
  thead tr th {
    background: #334155;
    color: #e2e8f0;
    font-weight: 700;
    text-align: center;
    padding: 8px 6px;
    font-size: 11px;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .th-prefix {
    background: #1e293b;
    text-align: left;
    padding-left: 12px;
    min-width: 140px;
    position: sticky;
    left: 0;
    z-index: 3;
  }
  .th-month--current {
    background: rgba($brand, .7) !important;
    color: #fff;
  }
  .th-total {
    background: #0f172a;
    min-width: 110px;
    position: sticky;
    right: 0;
    z-index: 3;
  }

  // ── Body rows
  .table-row {
    &:hover .td-prefix { background: #dde3ed; }
    &:hover .td-cell   { filter: brightness(.92); }
    &:hover .td-empty  { background: #eef2f7; }
  }

  .td-prefix {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    padding: 6px 10px;
    white-space: nowrap;
    border-right: 2px solid #e2e8f0;
    font-size: 11px;
    position: sticky;
    left: 0;
    z-index: 1;
    transition: background .15s;
  }

  .td-cell {
    padding: 4px 6px;
    text-align: center;
    vertical-align: middle;
    min-width: 90px;
    transition: filter .15s;
  }
  .td-cell--current { outline: 2px solid rgba($brand,.5); outline-offset: -2px; }

  .td-empty {
    background: #f8fafc;
    min-width: 90px;
  }

  // ICIT colour classes
  .td-icit--green  { background: $icit-green; color: #fff; }
  .td-icit--yellow { background: $icit-yellow; color: #fff; }
  .td-icit--red    { background: $icit-red; color: #fff; }

  .td-total {
    background: #1e293b;
    color: #e2e8f0;
    text-align: center;
    vertical-align: middle;
    padding: 4px 10px;
    position: sticky;
    right: 0;
    z-index: 1;
  }

  .td-loading {
    text-align: center;
    padding: 24px;
    color: $label-color;
    font-size: 13px;
  }
}

/* ─── Cell content ───────────────────────────────────────────────────────── */
.cell-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1.3;
  &--single {
    flex-direction: row;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
  }
}
.cell-reinc { font-size: 9px; font-weight: 600; opacity: .9; white-space: nowrap; }
.cell-pct   { font-size: 12px; font-weight: 700; }
.total-reinc { font-size: 9px; color: #94a3b8; font-weight: 600; white-space: nowrap; }
.total-pct {
  font-size: 14px; font-weight: 800;
  &--green  { color: #4ade80; }
  &--yellow { color: #fbbf24; }
  &--red    { color: #f87171; }
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  color: #94a3b8;
}
.empty-label { font-size: 15px; font-weight: 600; color: #64748b; }
.empty-hint  { font-size: 12px; }

/* ─── Dark mode ──────────────────────────────────────────────────────────── */
.body--dark {
  .hist-page    { background: #0f172a; }
  .hist-header  { background: #1e293b; border-bottom-color: #334155; box-shadow: 0 2px 12px rgba(0,0,0,.3); }
  .hist-title   { color: #fca5a5; }
  .hist-date    { color: #475569; }
  .date-muted   { color: #334155; }
  .filtrar-label { color: #475569; }
  .filtro-btn--dark { background: #334155; }

  .fgroup__label  { color: #475569; }
  .filter-divider { background: #334155; }

  .pill {
    background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .prefixo-select {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native)  { color: #94a3b8; }
  }

  .hist-table {
    .td-prefix {
      background: #1e293b;
      color: #e2e8f0;
      border-right-color: #334155;
    }
    .table-row {
      &:hover .td-prefix { background: #273549; }
      &:hover .td-empty  { background: #162032; }
    }
    .td-empty { background: #0f172a; }
    .td-loading { color: #475569; }
  }

  .empty-label { color: #64748b; }
  .empty-hint  { color: #475569; }
}
</style>
