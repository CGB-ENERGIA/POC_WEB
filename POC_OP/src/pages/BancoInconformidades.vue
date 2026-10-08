<template>
  <q-page class="banco-nc">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────────── -->
    <div class="banco-header">
      <div class="banco-header__info">
        <div class="banco-header__title">BANCO DE DADOS - INCONFORMIDADES</div>
        <div class="banco-header__datetime">{{ dataHora }} &nbsp;·&nbsp; Última Atualização</div>
      </div>
      <div class="banco-header__counter">
        <span class="banco-header__num">{{ listaFiltrada.length }}</span>
        <span class="banco-header__label">Inconformidade{{ listaFiltrada.length !== 1 ? 's' : '' }}</span>
      </div>
      <q-btn flat round dense icon="mdi-magnify" color="grey-7" class="banco-header__search" />
    </div>

    <!-- ── Filtros ────────────────────────────────────────────────────────────── -->
    <div class="banco-filters">

      <button class="filters-toggle" @click="filtrosAbertos = !filtrosAbertos">
        <q-icon name="mdi-filter-variant" size="18px" />
        <span>Filtros</span>
        <span v-if="!filtrosAbertos && filtrosAtivosCount" class="filters-toggle__badge">{{ filtrosAtivosCount }}</span>
        <q-icon :name="filtrosAbertos ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20px" class="filters-toggle__chevron" />
      </button>

      <q-slide-transition>
        <div v-show="filtrosAbertos">

          <!-- Semana + Mês + Gerência -->
          <div class="filter-row">
            <div class="fgroup">
              <span class="flabel">Semana</span>
              <div class="fchips">
                <button
                  v-for="s in semanas" :key="s.value"
                  :class="['fchip', filters.semana === s.value && 'fchip--on']"
                  @click="toggleSemana(s.value)"
                >{{ s.label }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--mes">
              <span class="flabel">Mês</span>
              <div class="fchips">
                <button
                  v-for="m in meses" :key="m.value"
                  :class="['fchip', filters.mes === m.value && 'fchip--on']"
                  @click="toggleMes(m.value)"
                >{{ m.label }}</button>
              </div>
            </div>

            <div class="fgroup">
              <span class="flabel">Gerência</span>
              <div class="fchips">
                <button
                  v-for="g in gerencias" :key="g"
                  :class="['fchip', filters.gerencia === g && 'fchip--on']"
                  @click="toggleGerencia(g)"
                >{{ g }}</button>
              </div>
            </div>
          </div>

          <!-- Base + Ano + Gerente -->
          <div class="filter-row">
            <div class="fgroup">
              <span class="flabel">Base</span>
              <div class="fchips">
                <button
                  v-for="b in bases" :key="b"
                  :class="['fchip', filters.base === b && 'fchip--on']"
                  @click="toggleBase(b)"
                >{{ b }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--ano">
              <span class="flabel">Ano</span>
              <div class="ano-box">{{ filters.ano }}</div>
            </div>

            <div class="fgroup fgroup--gerente">
              <span class="flabel">Gerente</span>
              <div class="fchips">
                <button
                  v-for="g in gerentes" :key="g"
                  :class="['fchip', filters.gerente === g && 'fchip--on']"
                  @click="toggleGerente(g)"
                >{{ g }}</button>
              </div>
            </div>
            <div class="fgroup fgroup--gerente">
              <span class="flabel">Coordenador</span>
              <div class="fchips">
                <button
                  v-for="g in coordenadores" :key="g"
                  :class="['fchip', filters.coordenador === g && 'fchip--on']"
                  @click="toggleCoordenador(g)"
                >{{ g }}</button>
              </div>
            </div>
          </div>

          <!-- Observador + Equipe -->
          <div class="filter-row filter-row--selects">
            <q-select
              v-model="filters.observador"
              :options="observadoresOpts"
              label="Observador"
              outlined dense clearable
              style="min-width: 180px"
              popup-content-class="banco-popup"
            />
            <q-select
              v-model="filters.equipe"
              :options="equipesOpts"
              label="Equipe"
              outlined dense clearable
              style="min-width: 180px"
              popup-content-class="banco-popup"
            />
          </div>

        </div>
      </q-slide-transition>
    </div>

    <!-- ── Tabela ──────────────────────────────────────────────────────────────── -->
    <div class="banco-table-wrap">
      <q-table
        :rows="listaFiltrada"
        :columns="colunas"
        row-key="key"
        flat
        :loading="loading"
        :rows-per-page-options="[25, 50, 100, 0]"
        rows-per-page-label="Por página"
        no-data-label="Nenhuma inconformidade encontrada"
        class="banco-table"
      >
        <template #body-cell-num="props">
          <q-td :props="props" class="num-cell">{{ props.rowIndex + 1 }}</q-td>
        </template>

        <template #body-cell-inconformidade="props">
          <q-td :props="props" class="inconformidade-cell">
            <div class="nc-cell-inner">
              <img
                v-if="props.row.fotoSrc"
                :src="props.row.fotoSrc"
                class="nc-foto-thumb"
                alt=""
                @click.stop="fotoViewer = props.row.fotoSrc"
              />
              <div class="nc-cell-text">
                <span>{{ props.value }}</span>
                <div v-if="props.row.itens && props.row.itens.length" class="nc-subitems">
                  <span
                    v-for="it in props.row.itens"
                    :key="it.nome"
                    :class="['nc-chip', it.conforme ? 'nc-chip--ok' : 'nc-chip--nc']"
                  >
                    <q-icon :name="it.conforme ? 'mdi-check' : 'mdi-close'" size="11px" />
                    {{ it.nome }}
                  </span>
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props" class="status-cell">
            <span class="status-badge status-badge--nc">Não Conforme</span>
            <div v-if="props.row.atribuido" class="atribuido-label">
              <q-icon name="mdi-account" size="12px" />
              {{ props.row.atribuido }}
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- ── Viewer de foto ──────────────────────────────────────────────────────── -->
    <q-dialog v-model="fotoViewerOpen" maximized>
      <div class="foto-viewer" @click="fotoViewer = null">
        <img :src="fotoViewer ?? ''" class="foto-viewer__img" alt="" @click.stop />
        <q-btn flat round icon="mdi-close" color="white" class="foto-viewer__close" @click="fotoViewer = null" />
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useChecklistData, type SubmissionRow, type ResponseRow, type EmployeeRow } from "@/composables/useChecklistData";
import { filterByGerente, semanaDaData, uniqueHierarchyOpts, filterByCoordenador } from "@/lib/dashboard";
import { rotuloSemana } from "@/lib/semanas";

const R2_PUBLIC_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string ?? "").replace(/\/$/, "");
function fotoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (!R2_PUBLIC_BASE) return null;
  return `${R2_PUBLIC_BASE}/${key}`;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const semanas = computed(() =>
  [1, 2, 3, 4].map((v) => ({ value: v, label: rotuloSemana(filters.ano, filters.mes ?? new Date().getMonth() + 1, v) })),
);

const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];

const bases    = ["BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const gerencias = ["ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT", "SPOT"];

const mesesAbrev = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

// ─── Data/hora ao vivo ────────────────────────────────────────────────────────

const dataHora = ref("");
function atualizarRelogio() {
  const now = new Date();
  dataHora.value = now.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
atualizarRelogio();
const clockInterval = setInterval(atualizarRelogio, 1000);
import { onUnmounted } from "vue";
onUnmounted(() => clearInterval(clockInterval));

// ─── Estado de filtros ────────────────────────────────────────────────────────

const now = new Date();
const filters = reactive({
  ano:        now.getFullYear(),
  mes:        null as number | null,
  semana:     null as number | null,
  base:       null as string | null,
  gerencia:   null as string | null,
  gerente:    null as string | null, coordenador: null as string | null,
  observador: null as string | null,
  equipe:     null as string | null,
});

const filtrosAbertos = ref(true);
const filtrosAtivosCount = computed(() =>
  [filters.semana, filters.base, filters.gerencia, filters.gerente, filters.coordenador, filters.observador, filters.equipe]
    .filter(v => v !== null).length
);

function toggleSemana (v: number)  { filters.semana   = filters.semana   === v    ? null : v; }
function toggleMes    (v: number)  { filters.mes       = filters.mes      === v    ? null : v; }
function toggleBase   (v: string)  { filters.base      = filters.base     === v    ? null : v; }
function toggleGerencia(v: string) { filters.gerencia  = filters.gerencia === v    ? null : v; }
function toggleGerente (v: string) { filters.gerente   = filters.gerente  === v    ? null : v; }
function toggleCoordenador(v: string) { filters.coordenador = filters.coordenador === v ? null : v; }

// ─── Dados ───────────────────────────────────────────────────────────────────

const { loading, load, submissions, responses, employees } = useChecklistData();
const gerentes = computed(() => uniqueHierarchyOpts(employees.value, "gerente", false));
const coordenadores = computed(() => uniqueHierarchyOpts(employees.value, "coordenador", false));

async function recarregar() {
  await load(
    { ano: filters.ano, mes: filters.mes ?? undefined, contarMeta: true },
    false,
    false
  );
}

onMounted(recarregar);
watch(() => [filters.ano, filters.mes], recarregar);

// ─── Mapa submission → employee ───────────────────────────────────────────────

const empMap = computed(() => {
  const m: Record<string, EmployeeRow> = {};
  for (const e of employees.value) m[e.matricula] = e;
  return m;
});

// ─── Montar linhas da tabela ──────────────────────────────────────────────────

interface NcRow {
  key: string;
  mes: string;
  data: string;
  observador: string;
  equipe: string;
  gerencia: string;
  gerenciaEmp: string;
  categoria: string;
  inconformidade: string;
  gravidade: string;
  resolvido: boolean | null;
  itens: { nome: string; conforme: boolean }[] | null;
  fotoSrc: string | null;
  atribuido: string | null;
}

const subMap = computed(() => {
  const m: Record<string, SubmissionRow> = {};
  for (const s of submissions.value) m[s.id] = s;
  return m;
});

const todasNcs = computed<NcRow[]>(() => {
  return responses.value
    .filter((r: ResponseRow) => r.resposta === "nao_conforme" && r.foto_r2_key !== null)
    .map((r: ResponseRow) => {
      const sub = subMap.value[r.submission_id];
      if (!sub) return null;
      const emp = empMap.value[sub.matricula];
      const d   = new Date(sub.data);
      const atrib = r.atribuido_nome
        ? (r.atribuido_tipo === "equipe" ? `Equipe · ${r.atribuido_nome}` : r.atribuido_nome)
        : null;
      return {
        key:            `${r.submission_id}_${r.pergunta_id}`,
        mes:            mesesAbrev[d.getMonth()] ?? "",
        data:           sub.data,
        observador:     sub.observador,
        equipe:         sub.equipe,
        gerencia:       sub.auditagem,
        gerenciaEmp:    emp?.gerencia ?? sub.auditagem,
        categoria:      r.categoria,
        inconformidade: r.pergunta,
        gravidade:      r.gravidade,
        resolvido:      r.resolvido ?? null,
        itens:          r.itens ?? null,
        fotoSrc:        fotoUrl(r.foto_r2_key),
        atribuido:      atrib,
      } satisfies NcRow;
    })
    .filter(Boolean) as NcRow[];
});

// ─── Filtros client-side ──────────────────────────────────────────────────────

const listaFiltrada = computed<NcRow[]>(() => {
  let rows = todasNcs.value;

  if (filters.semana) {
    rows = rows.filter(r => semanaDaData(r.data) === filters.semana);
  }

  if (filters.base) {
    const subsBase = new Set(
      submissions.value.filter(s => s.base === filters.base).map(s => s.id)
    );
    rows = rows.filter(r => {
      const sub = subMap.value[r.key.split("_")[0]];
      return sub ? subsBase.has(sub.id) : false;
    });
  }

  if (filters.gerencia) {
    rows = rows.filter(r => r.gerenciaEmp === filters.gerencia);
  }

  if (filters.gerente) {
    const subIds = new Set(
      filterByGerente(submissions.value, employees.value, filters.gerente).map(s => s.id),
    );
    rows = rows.filter(r => subIds.has(r.key.split("_")[0]!));
  }

  if (filters.coordenador) {
    const idsCoord = new Set(
      filterByCoordenador(submissions.value, employees.value, filters.coordenador).map(s => s.id),
    );
    rows = rows.filter(r => idsCoord.has(r.key.split("_")[0]!));
  }

  if (filters.observador) {
    rows = rows.filter(r => r.observador === filters.observador);
  }

  if (filters.equipe) {
    rows = rows.filter(r => r.equipe === filters.equipe);
  }

  return rows;
});

// ─── Foto viewer ─────────────────────────────────────────────────────────────
const fotoViewer = ref<string | null>(null);
const fotoViewerOpen = computed({
  get: () => fotoViewer.value !== null,
  set: (v) => { if (!v) fotoViewer.value = null; },
});

// ─── Opções dinâmicas dos selects ────────────────────────────────────────────

const observadoresOpts = computed(() =>
  ["Todos", ...new Set(todasNcs.value.map(r => r.observador))].sort()
);

const equipesOpts = computed(() =>
  ["Todos", ...new Set(todasNcs.value.map(r => r.equipe))].sort()
);

// ─── Colunas da tabela ───────────────────────────────────────────────────────

const colunas = [
  { name: "num",           label: "#",              field: "num",           align: "center" as const, sortable: false },
  { name: "mes",           label: "Mês",           field: "mes",           align: "center" as const, sortable: true  },
  { name: "observador",    label: "Observador",     field: "observador",    align: "center" as const, sortable: true  },
  { name: "equipe",        label: "Equipe",         field: "equipe",        align: "center" as const, sortable: true  },
  { name: "gerencia",      label: "Gerência",       field: "gerencia",      align: "center" as const, sortable: true  },
  { name: "categoria",     label: "Categoria",      field: "categoria",     align: "center" as const, sortable: true  },
  { name: "inconformidade",label: "Inconformidade", field: "inconformidade",align: "center" as const, sortable: false },
  { name: "status",        label: "Status",         field: "resolvido",     align: "center" as const, sortable: true  },
];
</script>

<style scoped lang="scss">
$brand: #8B1C2E;

.banco-nc {
  background: var(--q-color-grey-1, #f5f5f5);
  min-height: 100vh;
}

// ── Cabeçalho ─────────────────────────────────────────────────────────────────
.banco-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  padding: 16px 24px;
  border-bottom: 2px solid #eee;

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 1.15rem;
    font-weight: 700;
    color: $brand;
    letter-spacing: .03em;
  }

  &__datetime {
    font-size: .72rem;
    color: #888;
    margin-top: 2px;
  }

  &__counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
  }

  &__num {
    font-size: 2.6rem;
    font-weight: 900;
    color: $brand;
    line-height: 1;
  }

  &__label {
    font-size: .72rem;
    color: #888;
    white-space: nowrap;
  }

  &__search { margin-left: auto; }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
.banco-filters {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filters-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 4px;
  font-size: .82rem;
  font-weight: 700;
  color: $brand;
  text-transform: uppercase;
  letter-spacing: .04em;

  &:hover { opacity: .8; }

  &__badge {
    background: $brand;
    color: #fff;
    font-size: .68rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 7px;
    text-transform: none;
    letter-spacing: normal;
  }

  &__chevron { margin-left: 2px; }
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  margin-top: 10px;

  &--selects {
    gap: 12px;
  }
}

.fgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--mes { flex: 1; }
  &--ano { min-width: 90px; }
  &--gerente { flex: 1; }
}

.flabel {
  font-size: .72rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.fchips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.fchip {
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  font-size: .78rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;

  &:hover { border-color: $brand; color: $brand; }

  &--on {
    background: $brand;
    border-color: $brand;
    color: #fff;
  }
}

.ano-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 14px;
  background: #222;
  color: #fff;
  font-size: .9rem;
  font-weight: 700;
  border-radius: 4px;
  min-width: 72px;
  text-align: center;
}

// ── Tabela ─────────────────────────────────────────────────────────────────────
.banco-table-wrap {
  padding: 16px 24px;
}

.banco-table {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;

  :deep(th) {
    font-weight: 700;
    color: #333;
    background: #f9f9f9;
    border-bottom: 2px solid #ddd;
  }

  :deep(td) { color: #333; }

  :deep(tr:nth-child(even) td) { background: #fafafa; }
}

.inconformidade-cell {
  max-width: 460px;
  white-space: normal;
  line-height: 1.35;
  font-size: .82rem;
}

.nc-cell-inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.nc-foto-thumb {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  cursor: zoom-in;
  transition: opacity .15s;
  &:hover { opacity: .85; }
}

.nc-cell-text { flex: 1; min-width: 0; }

.status-cell { min-width: 130px; }

.atribuido-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: .72rem;
  font-weight: 600;
  white-space: nowrap;
}

.foto-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.88);
  width: 100%;
  height: 100%;
  position: relative;

  &__img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 4px;
  }

  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
  }
}

.nc-subitems {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.nc-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: .72rem;
  font-weight: 600;
  white-space: nowrap;

  &--ok {
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }

  &--nc {
    background: #fde8e8;
    color: #c62828;
    border: 1px solid #f5b6b6;
  }
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: .76rem;
  font-weight: 600;
  white-space: nowrap;

  &--nc {
    background: #fde8e8;
    color: #c62828;
    border: 1px solid #f5b6b6;
  }
}

:global(.banco-popup .q-item) { font-size: .85rem; }
:global(.banco-popup .q-item--active) { color: $brand !important; }

// ── Dark mode ──────────────────────────────────────────────────────────────────
.body--dark {
  .banco-nc { background: #0f172a; }

  .banco-header {
    background: #1e293b;
    border-bottom-color: #334155;
    &__datetime, &__label { color: #94a3b8; }
  }

  .banco-filters { background: #1e293b; border-bottom-color: #334155; }
  .flabel { color: #94a3b8; }

  .fchip {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
    &--on { background: $brand; border-color: $brand; color: #fff; }
  }

  .banco-table-wrap { }

  .banco-table {
    background: #1e293b;
    border-color: #334155;

    :deep(th) { background: #0f172a; color: #e2e8f0; border-bottom-color: #334155; }
    :deep(td) { color: #e2e8f0; }
    :deep(tr:nth-child(even) td) { background: #24334a; }
    :deep(tr td) { border-bottom-color: #334155; }
  }

  .nc-foto-thumb { border-color: #334155; }

  .atribuido-label {
    background: #1e3a5f;
    border-color: #1d4ed8;
    color: #93c5fd;
  }
}
</style>
