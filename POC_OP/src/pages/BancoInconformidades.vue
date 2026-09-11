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
        <template #body-cell-inconformidade="props">
          <q-td :props="props" class="inconformidade-cell">
            {{ props.value }}
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <span class="status-badge status-badge--nc">Não Conforme</span>
          </q-td>
        </template>
      </q-table>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useChecklistData, type SubmissionRow, type ResponseRow, type EmployeeRow } from "@/composables/useChecklistData";
import { filterByGerencia } from "@/lib/dashboard";

// ─── Constantes ──────────────────────────────────────────────────────────────

const semanas  = [
  { value: 1, label: "1. Primeira" },
  { value: 2, label: "2. Segunda"  },
];

const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];

const bases    = ["BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const gerencias = ["ADM", "GERE", "GOMAN", "GSTC", "LOGISTICA"];
const gerentes  = ["Afonso", "Jamerson", "Julio C.", "Leandro", "Marcos", "Paulo", "Rafaela", "Ricardo", "Valvick", "Waldir"];

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
  mes:        now.getMonth() + 1,
  semana:     null as number | null,
  base:       null as string | null,
  gerencia:   null as string | null,
  gerente:    null as string | null,
  observador: null as string | null,
  equipe:     null as string | null,
});

function toggleSemana (v: number)  { filters.semana   = filters.semana   === v    ? null : v; }
function toggleMes    (v: number)  { filters.mes       = filters.mes      === v    ? null as unknown as number : v; }
function toggleBase   (v: string)  { filters.base      = filters.base     === v    ? null : v; }
function toggleGerencia(v: string) { filters.gerencia  = filters.gerencia === v    ? null : v; }
function toggleGerente (v: string) { filters.gerente   = filters.gerente  === v    ? null : v; }

// ─── Dados ───────────────────────────────────────────────────────────────────

const { loading, load, submissions, responses, employees } = useChecklistData();

async function recarregar() {
  await load(
    { ano: filters.ano, mes: filters.mes ?? undefined },
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
}

const subMap = computed(() => {
  const m: Record<string, SubmissionRow> = {};
  for (const s of submissions.value) m[s.id] = s;
  return m;
});

const todasNcs = computed<NcRow[]>(() => {
  return responses.value
    .filter((r: ResponseRow) => r.resposta === "nao_conforme")
    .map((r: ResponseRow) => {
      const sub = subMap.value[r.submission_id];
      if (!sub) return null;
      const emp = empMap.value[sub.matricula];
      const d   = new Date(sub.data);
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
      } satisfies NcRow;
    })
    .filter(Boolean) as NcRow[];
});

// ─── Filtros client-side ──────────────────────────────────────────────────────

const listaFiltrada = computed<NcRow[]>(() => {
  let rows = todasNcs.value;

  if (filters.semana) {
    const diaInicio = (filters.semana - 1) * 7 + 1;
    const diaFim    = diaInicio + 7;
    rows = rows.filter(r => {
      const d = new Date(r.data).getDate();
      return d >= diaInicio && d < diaFim;
    });
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
    rows = rows.filter(r => r.observador.startsWith(filters.gerente!.split(" ")[0]!));
  }

  if (filters.observador) {
    rows = rows.filter(r => r.observador === filters.observador);
  }

  if (filters.equipe) {
    rows = rows.filter(r => r.equipe === filters.equipe);
  }

  return rows;
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
  { name: "mes",           label: "Mês",           field: "mes",           align: "left"   as const, sortable: true  },
  { name: "observador",    label: "Observador",     field: "observador",    align: "left"   as const, sortable: true  },
  { name: "equipe",        label: "Equipe",         field: "equipe",        align: "left"   as const, sortable: true  },
  { name: "gerencia",      label: "Gerência",       field: "gerencia",      align: "left"   as const, sortable: true  },
  { name: "categoria",     label: "Categoria",      field: "categoria",     align: "left"   as const, sortable: true  },
  { name: "inconformidade",label: "Inconformidade", field: "inconformidade",align: "left"   as const, sortable: false },
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

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;

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

  :deep(tr:nth-child(even) td) { background: #fafafa; }
}

.inconformidade-cell {
  max-width: 420px;
  white-space: normal;
  line-height: 1.35;
  font-size: .82rem;
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
</style>
