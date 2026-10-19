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

          <div class="fgroup fgroup--prefixo">
            <span class="fgroup__label">Prefixo</span>
            <q-select :model-value="filters.prefixo" :options="prefixoDisplayOpts"
              dense outlined hide-bottom-space use-input input-debounce="0"
              :clearable="filters.prefixo !== 'Todos'" clear-icon="mdi-close-circle"
              class="prefixo-select" popup-content-class="prefixo-popup"
              @update:model-value="(v: string | null) => (filters.prefixo = v ?? 'Todos')"
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
            <th v-for="name in monthNames" :key="name" class="th-month">
              {{ name }}
            </th>
            <th class="th-total th-total--menu" tabindex="0" role="button" aria-haspopup="true" title="Ordenar"
              @keydown.enter="($event.currentTarget as HTMLElement).click()">
              Total <q-icon name="mdi-menu-down" size="14px" />
              <q-menu anchor="bottom right" self="top right">
                <q-list dense style="min-width: 250px">
                  <q-item-label header>Ordenar linhas por</q-item-label>
                  <q-item
                    v-for="o in ordemOpts" :key="o.value"
                    clickable v-close-popup :active="ordem === o.value" @click="ordem = o.value">
                    <q-item-section avatar><q-icon :name="o.icon" size="18px" /></q-item-section>
                    <q-item-section>{{ o.label }}</q-item-section>
                    <q-item-section v-if="ordem === o.value" side><q-icon name="mdi-check" size="16px" /></q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </th>
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
                cell ? `${cellClass(cell)} td-cell--click` : 'td-empty']"
              :tabindex="cell ? 0 : undefined"
              :role="cell ? 'button' : undefined"
              :aria-label="cell ? `Ver detalhes de ${row.prefixo} em ${monthNames[mi]}` : undefined"
              @click="cell && abrirDetalhe(row.prefixo, mi + 1)"
              @keydown.enter="cell && abrirDetalhe(row.prefixo, mi + 1)">
              <template v-if="cell">
                <div v-if="cell.acid" class="cell-inner">
                  <span class="cell-reinc">Acidentes: {{ cell.acid }}</span>
                  <span v-if="cell.pct !== null" class="cell-pct">{{ fmtPct(cell.pct) }}</span>
                </div>
                <div v-else-if="cell.reinc && cell.pct !== null" class="cell-inner">
                  <span class="cell-reinc">Reincidência: {{ cell.reinc }}</span>
                  <span class="cell-pct">{{ fmtPct(cell.pct) }}</span>
                </div>
                <div v-else-if="cell.pct !== null" class="cell-inner cell-inner--single">{{ fmtPct(cell.pct) }}</div>
              </template>
            </td>
            <td class="td-total td-cell--click" tabindex="0" role="button"
              :aria-label="`Ver detalhes de ${row.prefixo} em ${filters.ano}`"
              @click="abrirDetalhe(row.prefixo, null)"
              @keydown.enter="abrirDetalhe(row.prefixo, null)">
              <div class="cell-inner">
                <span class="total-reinc">
                  {{ row.total.acid ? `Acidentes: ${row.total.acid}` : `Reincidência: ${row.total.reinc}` }}
                </span>
                <span class="total-pct" :class="row.total.acid ? 'total-pct--acid' : `total-pct--${icitClass(row.total.pct)}`">
                  {{ row.semVisitas ? "—" : fmtPct(row.total.pct) }}
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
      <template v-if="filters.tipo === 'Acidentes' && !acidentes.length">
        <div class="empty-label">Nenhum acidente cadastrado em {{ filters.ano }}</div>
        <div class="empty-hint">Os acidentes ainda não foram registrados no sistema; assim que forem, as equipes aparecem aqui.</div>
      </template>
      <template v-else>
        <div class="empty-label">Nenhuma equipe encontrada para os filtros selecionados</div>
        <div class="empty-hint">Verifique se há dados carregados para {{ filters.ano }}</div>
      </template>
    </div>

    <!-- Detalhes da célula (prefixo × mês) -->
    <q-dialog v-model="detalheAberto">
      <q-card class="icit-det">
        <div class="icit-det__head">
          <div>
            <div class="icit-det__prefixo">{{ detalhe?.prefixo }}</div>
            <div class="icit-det__periodo">{{ detalheTitulo }}</div>
          </div>
          <q-btn flat round dense icon="mdi-close" v-close-popup aria-label="Fechar" />
        </div>

        <div v-if="detalheDados" class="icit-det__body">
          <div class="icit-det__cards">
            <div class="icit-det__card icit-det__card--inc">
              <div class="icit-det__card-label">Inconformidade</div>
              <div class="icit-det__card-num">{{ detalheDados.inconformes }}</div>
            </div>
            <div class="icit-det__card icit-det__card--conf">
              <div class="icit-det__card-label">Conformidade</div>
              <div class="icit-det__card-num">{{ detalheDados.conformes }}</div>
            </div>
          </div>
          <div class="icit-det__icit">
            ICIT do período: <strong>{{ fmtPct(detalheDados.icit) }}</strong>
            · {{ detalheDados.visitas }} {{ detalheDados.visitas === 1 ? "visita" : "visitas" }}
          </div>

          <div class="icit-det__scroll">
            <table class="icit-det__table">
              <thead>
                <tr>
                  <th class="icit-det__th-obs">Observador</th>
                  <th class="num">Visitas</th>
                  <th>Gerência</th>
                  <th class="num">Conforme</th>
                  <th class="num">Inconforme</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in detalheDados.linhas" :key="l.matricula">
                  <td class="icit-det__th-obs">{{ l.observador }}</td>
                  <td class="num">{{ l.visitas }}</td>
                  <td>{{ l.gerencia }}</td>
                  <td class="num icit-det__conf">{{ l.conforme }}</td>
                  <td class="num icit-det__inc">{{ l.inconforme }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="icit-det__th-obs">Total de Visitas</td>
                  <td class="num">{{ detalheDados.visitas }}</td>
                  <td></td>
                  <td class="num">{{ detalheDados.conformes }}</td>
                  <td class="num">{{ detalheDados.inconformes }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="detalheDados.acidentes.length" class="icit-det__acid">
            <div class="icit-det__acid-titulo">Histórico de Acidentes</div>
            <div class="icit-det__scroll">
              <table class="icit-det__table">
                <thead>
                  <tr><th>Data</th><th>Colaborador</th><th>Característica</th><th>Gravidade</th><th>Lesão</th></tr>
                </thead>
                <tbody>
                  <tr v-for="a in detalheDados.acidentes" :key="a.id">
                    <td>{{ fmtDataAcid(a.data) }}</td>
                    <td class="icit-det__desc">{{ a.colaborador || "—" }}</td>
                    <td class="icit-det__desc">{{ a.caracteristica || a.descricao || "—" }}</td>
                    <td>{{ a.gravidade || "—" }}</td>
                    <td>{{ a.lesao || "—" }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr><td>Total</td><td colspan="4">{{ detalheDados.acidentes.length }}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, ref, shallowRef, watch, onMounted } from "vue";
import { useChecklistData } from "@/composables/useChecklistData";
import {
  uniqueHierarchyOpts, foldName, fetchHierarquiaEquipes, hierarquiaDaEquipe, type EquipeHier,
  fetchAcidentes, type AcidenteRow,
  indexEmployees, matchSubmissionToEmployee,
} from "@/lib/dashboard";

const { loading, submissions, responses, employees, load } = useChecklistData();

// ─── Types ────────────────────────────────────────────────────────────────────
/** Prefixo da equipe sem diferenciar maiúsculas ("Aloj69" e "ALOJ69" são a mesma equipe). */
function normPrefixo(equipe: string | null | undefined): string {
  return (equipe ?? "").trim().toUpperCase() || "Sem equipe";
}

/** Meta de ICIT (%): meses abaixo dela contam como reincidência. */
const ICIT_META = 80;

/** `pct` é null no mês em que houve acidente mas nenhuma visita. */
interface Cell { reinc?: number; acid?: number; pct: number | null }
interface Row  { prefixo: string; months: (Cell | null)[]; semVisitas: boolean; total: { reinc: number; acid: number; pct: number } }

// ─── Filter options ───────────────────────────────────────────────────────────
const now = new Date();
const dataAtual = now.toLocaleString("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

const bases     = ["BCB","BDC","ITM","PDS","PDT","STI"];
const gerencias = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];
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
  base:       "",
  prefixo:    "Todos",
  gerente:    "",
  coordenador:"",
  gerencia:   "",
  tipo:       "Geral",
});

// ─── Data loading ─────────────────────────────────────────────────────────────
const acidentes = ref<AcidenteRow[]>([]);

async function recarregar() {
  // A base é filtrada no cliente, pela base da EQUIPE (o BI faz assim); a base do checklist pode ser a do observador.
  fetchAcidentes(filters.ano).then((r) => { acidentes.value = r; }).catch(() => { acidentes.value = []; });
  await load({ ano: filters.ano }, false, false, "nc");
}
onMounted(recarregar);
watch(() => filters.ano, recarregar);

// ─── Prefixo options from real submissions ────────────────────────────────────
const allEquipes = computed<string[]>(() =>
  [...new Set(submissions.value.map(s => (s.equipe ?? "").trim().toUpperCase()).filter(Boolean))].sort()
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
// ─── Hierarquia da EQUIPE (coordenador, gerente, gerência) ────────────────────
// Os filtros olham a equipe do checklist (como o BI), não o cadastro do observador.
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

/** Filtros de coordenador, gerente, gerência e base, todos pela EQUIPE (valores já normalizados). */
const filtrosEquipe = computed(() => ({
  coord:    filters.coordenador ? foldName(filters.coordenador) : "",
  gerente:  filters.gerente ? foldName(filters.gerente) : "",
  gerencia: filters.gerencia && filters.gerencia !== "Todos" ? filters.gerencia.toUpperCase() : "",
  base:     filters.base.toUpperCase(),
}));

/** A equipe passa nos filtros? (`auditagem` e `baseChecklist` só entram quando a equipe não está no cadastro.) */
function passaFiltros(equipe: string | null | undefined, auditagem = "", baseChecklist = ""): boolean {
  const f = filtrosEquipe.value;
  if (!f.coord && !f.gerente && !f.gerencia && !f.base) return true;
  const h = hierarquiaDaEquipe(hierEquipes.value, equipe);
  if (f.base && (h?.base || baseChecklist || "").toUpperCase() !== f.base) return false;
  const coordDaEquipe = foldName(h?.coordenador ?? "");
  if (f.coord && coordDaEquipe !== f.coord) return false;
  if (f.gerente) {
    const g = h?.gerente || gerenteDoCoordenador.value.get(coordDaEquipe) || "";
    if (foldName(g) !== f.gerente) return false;
  }
  if (f.gerencia && (h?.gerencia || auditagem || "").toUpperCase() !== f.gerencia) return false;
  return true;
}

/** Checklists do ano depois dos filtros de gerente, coordenador, gerência e base (todos pela equipe). */
const subsFiltrados = computed(() => {
  const f = filtrosEquipe.value;
  if (!f.coord && !f.gerente && !f.gerencia && !f.base) return submissions.value;
  return submissions.value.filter((s) => passaFiltros(s.equipe, s.auditagem, s.base));
});

/** Acidentes do ano por equipe (prefixo em maiúsculas) e mês, respeitando os filtros da equipe. */
const acidentesFiltrados = computed(() => acidentes.value.filter((a) => passaFiltros(a.prefixo)));
const acidentesPorEquipeMes = computed(() => {
  const m = new Map<string, number[]>();
  for (const a of acidentesFiltrados.value) {
    const chave = normPrefixo(a.prefixo);
    const mes = Number(a.data.slice(5, 7));
    if (!(mes >= 1 && mes <= 12)) continue;
    const arr = m.get(chave) ?? new Array<number>(12).fill(0);
    arr[mes - 1] = (arr[mes - 1] ?? 0) + 1;
    m.set(chave, arr);
  }
  return m;
});

/** IDs dos checklists que têm pelo menos uma resposta não conforme. */
const ncIds = computed(() => {
  const subIdSet = new Set(subsFiltrados.value.map(s => s.id));
  const out = new Set<string>();
  for (const r of responses.value) {
    if (subIdSet.has(r.submission_id) && r.resposta === "nao_conforme") out.add(r.submission_id);
  }
  return out;
});

const rawRows = computed<Row[]>(() => {
  const subs = subsFiltrados.value;
  const acidPorEquipe = acidentesPorEquipeMes.value;
  if (!subs.length && !acidPorEquipe.size) return [];
  const ncSubIds = ncIds.value;

  // Group submissions by equipe × month
  type MonthStats = { total: number; semNc: number };
  const equipeData: Record<string, Record<number, MonthStats>> = {};

  for (const s of subs) {
    const eq = normPrefixo(s.equipe);
    const d  = new Date(s.data ?? s.created_at ?? "");
    if (isNaN(d.getTime())) continue;
    const month = d.getMonth() + 1;
    if (!equipeData[eq]) equipeData[eq] = {};
    if (!equipeData[eq][month]) equipeData[eq][month] = { total: 0, semNc: 0 };
    equipeData[eq][month].total++;
    if (!ncSubIds.has(s.id)) equipeData[eq][month].semNc++;
  }
  // Com o filtro "Acidentes", equipe com acidente no ano mas sem nenhuma visita também aparece (como no BI).
  if (filters.tipo === "Acidentes") {
    for (const eq of acidPorEquipe.keys()) if (!equipeData[eq]) equipeData[eq] = {};
  }

  // Build rows
  return Object.entries(equipeData).map(([prefixo, mStats]) => {
    const months: (Cell | null)[] = [];
    const acidMeses = acidPorEquipe.get(prefixo);
    let totalSubs  = 0;
    let totalSemNc = 0;
    let reincidencias = 0;
    let acidTotal = 0;
    for (let mi = 1; mi <= 12; mi++) {
      const st = mStats[mi];
      const acid = acidMeses?.[mi - 1] ?? 0;
      acidTotal += acid;
      if (!st) { months.push(acid ? { pct: null, acid } : null); continue; }
      const pct = Math.round((st.semNc / st.total) * 10000) / 100;
      // Reincidência = mês abaixo de 80% de ICIT; o total soma os meses nessa situação.
      const cell: Cell = { pct };
      if (pct < ICIT_META) { cell.reinc = 1; reincidencias++; }
      if (acid) cell.acid = acid;
      months.push(cell);
      totalSubs  += st.total;
      totalSemNc += st.semNc;
    }
    const avgPct = totalSubs > 0 ? Math.round((totalSemNc / totalSubs) * 10000) / 100 : 0;
    return { prefixo, months, semVisitas: totalSubs === 0, total: { reinc: reincidencias, acid: acidTotal, pct: avgPct } };
  });
});

// ─── Ordenação (menu do cabeçalho "Total") ────────────────────────────────────
type Ordem = "reincidencia" | "icit-menor" | "icit-maior" | "prefixo";
const ordem = ref<Ordem>("reincidencia");
const ordemOpts: { value: Ordem; label: string; icon: string }[] = [
  { value: "reincidencia", label: "Mais reincidências primeiro",  icon: "mdi-alert-circle-outline" },
  { value: "icit-menor",   label: "ICIT total: menor para maior", icon: "mdi-sort-ascending" },
  { value: "icit-maior",   label: "ICIT total: maior para menor", icon: "mdi-sort-descending" },
  { value: "prefixo",      label: "Prefixo: A a Z",               icon: "mdi-sort-alphabetical-ascending" },
];

// ─── Filtered + sorted rows ───────────────────────────────────────────────────
const filteredRows = computed<Row[]>(() => {
  let rows = rawRows.value;

  if (filters.prefixo && filters.prefixo !== "Todos")
    rows = rows.filter(r => r.prefixo === filters.prefixo);

  if      (filters.tipo === ">80%")      rows = rows.filter(r => r.total.pct >= 80);
  else if (filters.tipo === "<80%")      rows = rows.filter(r => r.total.pct < 80);
  else if (filters.tipo === "Acidentes") rows = rows.filter(r => r.total.acid > 0);

  const comparadores: Record<Ordem, (a: Row, b: Row) => number> = {
    reincidencia: (a, b) => b.total.reinc - a.total.reinc || a.total.pct - b.total.pct,
    "icit-menor": (a, b) => a.total.pct - b.total.pct || b.total.reinc - a.total.reinc,
    "icit-maior": (a, b) => b.total.pct - a.total.pct || a.total.reinc - b.total.reinc,
    prefixo:      (a, b) => a.prefixo.localeCompare(b.prefixo, "pt-BR"),
  };
  return [...rows].sort(comparadores[ordem.value]);
});

// ─── Detalhes da célula (prefixo × mês) ───────────────────────────────────────
const detalhe = ref<{ prefixo: string; mes: number | null } | null>(null);
const detalheAberto = computed({
  get: () => detalhe.value !== null,
  set: (v: boolean) => { if (!v) detalhe.value = null; },
});

function abrirDetalhe(prefixo: string, mes: number | null) {
  detalhe.value = { prefixo, mes };
}

const detalheTitulo = computed(() => {
  const d = detalhe.value;
  if (!d) return "";
  if (d.mes === null) return `Ano de ${filters.ano} (total)`;
  const nome = monthNames[d.mes - 1] ?? "";
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${filters.ano}`;
});

const detalheDados = computed(() => {
  const d = detalhe.value;
  if (!d) return null;
  const idx = indexEmployees(employees.value);
  const porObs = new Map<string, { matricula: string; observador: string; gerencia: string; visitas: number; conforme: number; inconforme: number }>();
  let conformes = 0;
  let inconformes = 0;

  for (const s of subsFiltrados.value) {
    if (normPrefixo(s.equipe) !== d.prefixo) continue;
    const dt = new Date(s.data ?? "");
    if (isNaN(dt.getTime())) continue;
    if (d.mes !== null && dt.getMonth() + 1 !== d.mes) continue;

    const comNc = ncIds.value.has(s.id);
    const emp = matchSubmissionToEmployee(s, idx);
    const linha = porObs.get(s.matricula) ?? {
      matricula: s.matricula, observador: s.observador, gerencia: emp?.gerencia ?? s.auditagem,
      visitas: 0, conforme: 0, inconforme: 0,
    };
    linha.visitas++;
    if (comNc) { linha.inconforme++; inconformes++; } else { linha.conforme++; conformes++; }
    porObs.set(s.matricula, linha);
  }

  const visitas = conformes + inconformes;
  const linhas = [...porObs.values()]
    .sort((a, b) => b.visitas - a.visitas || a.observador.localeCompare(b.observador, "pt-BR"));
  const acids = acidentesFiltrados.value
    .filter((a) => normPrefixo(a.prefixo) === d.prefixo && (d.mes === null || Number(a.data.slice(5, 7)) === d.mes))
    .sort((a, b) => a.data.localeCompare(b.data));
  return {
    linhas, conformes, inconformes, visitas, acidentes: acids,
    icit: visitas ? Math.round((conformes / visitas) * 10000) / 100 : 0,
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPct(v: number) {
  return v.toFixed(2).replace(".", ",") + "%";
}

function cellClass(cell: Cell): string {
  if (cell.acid || cell.pct === null) return "td-acid";
  return `td-icit--${icitClass(cell.pct)}`;
}

function fmtDataAcid(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Mesmo padrão dos filtros: a partir da meta (80%) é verde; abaixo, laranja. */
function icitClass(pct: number): "green" | "orange" {
  return pct >= ICIT_META ? "green" : "orange";
}
</script>

<style scoped lang="scss">
.td-cell--click {
  cursor: pointer;
  &:hover { filter: brightness(1.12); outline: 2px solid rgba(255, 255, 255, .55); outline-offset: -2px; }
  &:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
}

$brand:       #8B1C2B;
$border:      #e2e8f0;
$label-color: #94a3b8;
$inactive-bg: #f1f5f9;
$inactive-txt:#475569;

// ─── ICIT colours ─────────────────────────────────────────────────────────────
$icit-green:  #16a34a;
$icit-orange: #d97706;
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
    height: 28px; min-height: 28px; border-radius: 999px;
    background: $inactive-bg; padding: 0 10px;
    display: flex; align-items: center;
  }
  // Quasar outlined usa ::before para a borda
  :deep(.q-field__control::before) {
    border-color: $border;
    border-radius: 999px;
    transition: border-color .15s;
  }
  :deep(.q-field__control:hover::before) { border-color: $brand; }
  :deep(.q-field--focused .q-field__control::before) { border-color: $brand; }
  :deep(.q-field__control-container) { padding-top: 0 !important; }
  :deep(.q-field__native) {
    font-size: 11px; font-weight: 500; color: $inactive-txt;
    min-height: unset; height: 28px; line-height: 28px;
    padding: 0; margin: 0; align-self: center;
  }
  :deep(.q-field__append) { height: 28px; align-self: center; }
  :deep(.q-field__append .q-icon) { font-size: 16px; color: $label-color; }
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
  .th-total {
    background: #0f172a;
    min-width: 110px;
    position: sticky;
    right: 0;
    z-index: 3;
  }
  .th-total--menu {
    cursor: pointer;
    user-select: none;
    &:hover { filter: brightness(1.25); }
    &:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
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
  .td-empty {
    background: #f8fafc;
    min-width: 90px;
  }

  // ICIT colour classes
  .td-icit--green  { background: $icit-green; color: #fff; }
  .td-icit--orange { background: $icit-orange; color: #fff; }
  .td-acid         { background: $icit-red; color: #fff; }

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
  &--orange { color: #fb923c; }
  &--acid   { color: #fff; background: #dc2626; border-radius: 4px; padding: 0 6px; }
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
    :deep(.q-field__control)        { background: #1e293b; }
    :deep(.q-field__control::before){ border-color: #334155; }
    :deep(.q-field__control:hover::before) { border-color: $brand; }
    :deep(.q-field--focused .q-field__control::before) { border-color: $brand; }
    :deep(.q-field__native)         { color: #94a3b8; }
    :deep(.q-field__append .q-icon) { color: #475569; }
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

<style lang="scss">
// Popup de detalhes (o q-dialog é montado fora do componente, por isso o bloco não é scoped)
.icit-det {
  width: 760px; max-width: 94vw; max-height: 88vh;
  display: flex; flex-direction: column;
  border-radius: 14px; overflow: hidden;

  &__head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  }
  &__prefixo { font-size: 1.05rem; font-weight: 800; color: #1e293b; letter-spacing: .01em; }
  &__periodo { font-size: .8rem; color: #64748b; margin-top: 2px; }

  &__body { padding: 16px 20px 20px; overflow-y: auto; }

  &__cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  &__card {
    border-radius: 12px; overflow: hidden; text-align: center;
    background: #fff; border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
  }
  &__card-label { padding: 8px 6px; font-size: 1.05rem; font-weight: 700; color: #fff; }
  &__card-num { padding: 8px 6px 10px; font-size: 2.2rem; font-weight: 800; color: #1e293b; line-height: 1.1; }
  &__card--inc &__card-label { background: #b4143a; }
  &__card--conf &__card-label { background: #2f9e1f; }

  &__icit { margin: 12px 0 14px; font-size: .85rem; color: #475569; }

  &__scroll { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
  &__table {
    width: 100%; border-collapse: collapse; font-size: .85rem;
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eef2f6; white-space: nowrap; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; position: sticky; top: 0; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: none; background: #f8fafc; }
  }
  &__th-obs { min-width: 150px; }
  &__acid { margin-top: 16px; }
  &__acid-titulo { font-size: 1.05rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
  &__desc { white-space: normal !important; min-width: 220px; }
  &__conf { background: rgba(47, 158, 31, .18); color: #166534; font-weight: 700; }
  &__inc  { background: rgba(180, 20, 58, .14); color: #9f1239; font-weight: 700; }
}

.body--dark .icit-det {
  background: #1e293b;
  &__head { border-bottom-color: #334155; }
  &__prefixo { color: #e2e8f0; }
  &__periodo, &__icit { color: #94a3b8; }
  &__acid-titulo { color: #e2e8f0; }
  &__card { background: #0f172a; border-color: #334155; }
  &__card-num { color: #e2e8f0; }
  &__scroll { border-color: #334155; }
  &__table {
    th, td { border-bottom-color: #334155; color: #cbd5e1; }
    th { background: #0f172a; color: #e2e8f0; }
    tfoot td { background: #0f172a; border-top-color: #475569; color: #e2e8f0; }
  }
  &__conf { background: rgba(74, 222, 128, .16); color: #86efac; }
  &__inc  { background: rgba(251, 113, 133, .16); color: #fda4af; }
}
</style>
