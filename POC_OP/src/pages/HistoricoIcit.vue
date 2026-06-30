<template>
  <q-page class="hist-page">

    <!-- ══════════════════════════════════════════════════════
         HEADER BAR
    ══════════════════════════════════════════════════════ -->
    <div class="hist-header">

      <!-- Left: title, date, filtrar por -->
      <div class="hist-header__left">
        <div class="hist-title">HISTÓRICO - ICIT</div>
        <div class="hist-date">
          <span>22/06/2026 13:54:55</span>
          <span class="text-grey-5"> · Última Atualização</span>
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
              <button v-for="g in gerentes" :key="g"
                :class="['pill pill--sm', filters.gerente === g && 'pill--active']"
                @click="filters.gerente = (filters.gerente === g ? '' : g)">{{ g }}</button>
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
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
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

    <!-- ══════════════════════════════════════════════════════
         DATA TABLE
    ══════════════════════════════════════════════════════ -->
    <div class="table-wrap">
      <table class="hist-table">
        <thead>
          <tr>
            <th class="th-prefix">Prefixo</th>
            <th v-for="m in monthNames" :key="m" class="th-month">{{ m }}</th>
            <th class="th-total">Total <q-icon name="mdi-menu-down" size="14px" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.prefixo">
            <td class="td-prefix">{{ row.prefixo }}</td>
            <td v-for="(cell, mi) in row.months" :key="mi"
              :class="cell ? 'td-data' : 'td-empty'"
              :style="cell ? cellBg(cell) : {}">
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
                <span class="total-pct" :style="{ color: totalColor(row.total.pct) }">{{ fmtPct(row.total.pct) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell { reinc?: number; pct: number }
interface Row  { prefixo: string; months: (Cell | null)[]; total: { reinc: number; pct: number } }

// ─── Filter state ─────────────────────────────────────────────────────────────
const bases     = ["BCB","BDC","ITM","PDS","PDT","STI"];
const gerentes  = ["Afonso","Jackson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];
const gerencias = ["GERE","GOMAN","GSTC"];
const meses     = [
  { v: 1, l: "jan" }, { v: 2, l: "fev" },
  { v: 3, l: "mar" }, { v: 4, l: "abr" },
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

const filters = reactive({
  ano:      2026,
  mes:      4,
  base:     "",
  prefixo:  "Todos",
  gerente:  "",
  gerencia: "",
  tipo:     "Geral",
});

// ─── Full prefix list (191 entries) ──────────────────────────────────────────
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

// ─── Deterministic data generator ─────────────────────────────────────────────
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

// Percentage lookup tables for non-reinc months
const pctTable = [100, 100, 100, 100, 100, 100, 100, 85.71, 90, 92.86, 87.5, 80];
// Percentage lookup tables for reinc months
const reincPctTable = [50, 60, 66.67, 71.43, 75, 77.78, 50, 62.5, 66.67, 72.73, 75, 69.23];
// Max reinc distribution: most rows have 0, fewer have more
const maxReincDist = [0,0,0,0,0,0,0,1,1,1,2,3];

function generateRow(prefixo: string): Row {
  const h0 = hash(prefixo);
  const maxReinc = maxReincDist[h0 % maxReincDist.length];

  const months: (Cell | null)[] = [];
  let reincUsed = 0;
  let sumPct = 0;

  for (let mi = 0; mi < 12; mi++) {
    if (mi >= 6) { months.push(null); continue; }

    const mh = hash(prefixo + mi);
    // Decide if this month gets a reincidência
    const doReinc = reincUsed < maxReinc && (mh % 3 === 0);

    let pct: number;
    let reinc: number | undefined;

    if (doReinc) {
      reincUsed++;
      reinc = 1;
      pct = reincPctTable[mh % reincPctTable.length];
    } else {
      pct = pctTable[mh % pctTable.length];
    }

    sumPct += pct;
    months.push(reinc !== undefined ? { reinc, pct } : { pct });
  }

  const avgPct = Math.round((sumPct / 6) * 100) / 100;
  return { prefixo, months, total: { reinc: reincUsed, pct: avgPct } };
}

// Build rows once
const rawRows: Row[] = allPrefixes.map(generateRow);

// ─── Prefixo search filter ────────────────────────────────────────────────────
const prefixoOpts = ref<string[]>(["Todos", ...allPrefixes]);

function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    prefixoOpts.value = ["Todos", ...allPrefixes.filter(p => p.toLowerCase().includes(needle))];
  });
}

// ─── Computed filtered + sorted rows ─────────────────────────────────────────
const filteredRows = computed<Row[]>(() => {
  let rows = rawRows;

  // Prefixo filter
  if (filters.prefixo && filters.prefixo !== "Todos")
    rows = rows.filter(r => r.prefixo === filters.prefixo);

  // Base filter (from prefix code, e.g. MA-BCB-* → BCB)
  if (filters.base)
    rows = rows.filter(r => r.prefixo.split("-")[1] === filters.base);

  // Tipo filter
  if (filters.tipo === ">80%")      rows = rows.filter(r => r.total.pct >= 80);
  else if (filters.tipo === "<80%") rows = rows.filter(r => r.total.pct < 80);

  // Sort: most reincidências first, then worst % first
  return [...rows].sort((a, b) => {
    if (b.total.reinc !== a.total.reinc) return b.total.reinc - a.total.reinc;
    return a.total.pct - b.total.pct;
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPct(v: number) {
  return v.toFixed(2).replace(".", ",") + "%";
}

function cellBg(cell: Cell): Record<string, string> {
  if (cell.reinc && cell.reinc > 0) return { background: "#f59e0b", color: "#fff" };
  if (cell.pct >= 80)               return { background: "#16a34a", color: "#fff" };
  return { background: "#ef4444", color: "#fff" };
}

function totalColor(pct: number): string {
  if (pct >= 90) return "#4ade80";
  if (pct >= 80) return "#86efac";
  return "#fbbf24";
}
</script>

<style scoped lang="scss">
$brand:       #8B1C2B;
$border:      #e2e8f0;
$label-color: #94a3b8;
$inactive-bg: #f1f5f9;
$inactive-txt:#475569;

.hist-page {
  background: #f8fafc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── Header ─────────────────────────────────────────────────────── */
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
.hist-date { font-size: 10px; color: #94a3b8; }

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
  opacity: .65;
  transition: opacity .18s, transform .1s;
  &:hover  { opacity: .9; }
  &:active { transform: scale(.96); }
  &--on    { opacity: 1; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
  &--orange { background: #f59e0b; color: #fff; }
  &--green  { background: #16a34a; color: #fff; }
  &--red    { background: $brand;  color: #fff; }
  &--dark   { background: #1e293b; color: #fff; }
}

/* ─── Filter pills ───────────────────────────────────────────────── */
.hist-header__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.frow { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
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
  }
  :deep(.q-field__native) { font-size: 11px; color: $inactive-txt; min-height: unset; line-height: 28px; }
  :deep(.q-field__append) { height: 28px; }
}
:global(.prefixo-popup .q-item) { font-size: 11px; min-height: 28px; padding: 2px 10px; }

.back-btn { align-self: center; margin-left: auto; flex-shrink: 0; }

/* ─── Table ──────────────────────────────────────────────────────── */
.table-wrap {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  padding: 12px 16px;
}

.hist-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 2px;
  font-size: 11px;

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
  .th-total {
    background: #0f172a;
    min-width: 110px;
  }

  tbody tr {
    &:hover .td-prefix { background: #e2e8f0; }
    &:hover td.td-data { filter: brightness(.92); }
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
  }
  .td-data {
    padding: 4px 6px;
    text-align: center;
    vertical-align: middle;
    min-width: 90px;
  }
  .td-empty {
    background: #f8fafc;
    min-width: 90px;
  }
  .td-total {
    background: #1e293b;
    text-align: center;
    vertical-align: middle;
    padding: 4px 8px;
    position: sticky;
    right: 0;
    z-index: 1;
  }
}

/* ─── Cell content ───────────────────────────────────────────────── */
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
.total-pct   { font-size: 13px; font-weight: 800; }

/* ─── Dark mode ─────────────────────────────────────────────────── */
.body--dark {
  .hist-page    { background: #0f172a; }
  .hist-header  { background: #1e293b; border-bottom-color: #334155; }
  .hist-title   { color: #fca5a5; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .hist-table {
    .td-prefix { background: #1e293b; color: #e2e8f0; }
    .td-empty  { background: #0f172a; }
  }
}
</style>
