<template>
  <q-page class="banco-nc">

    <!-- ── Faixa fixa: cabeçalho + filtros (só a lista rola) ───────────────────── -->
    <div class="banco-sticky">

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

          <!-- Grade de 12 colunas: rótulo sempre em cima, cada grupo no seu lugar (colunas pela largura do painel) -->
          <div class="filter-grid">

            <div class="fgroup fgroup--ano">
              <span class="flabel">Ano</span>
              <div class="ano-box">{{ filters.ano }}</div>
            </div>

            <div class="fgroup fgroup--mes">
              <span class="flabel">Mês</span>
              <div class="fchips">
                <button
                  v-for="m in meses" :key="m.value"
                  :class="['fchip', marcado(filters.mes, String(m.value)) && 'fchip--on']"
                  @click="toggleMes(m.value, $event)"
                >{{ m.label }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--semana">
              <span class="flabel">Semana</span>
              <div class="fchips">
                <button
                  v-for="s in semanas" :key="s.value"
                  :class="['fchip', marcado(filters.semana, String(s.value)) && 'fchip--on']"
                  @click="toggleSemana(s.value, $event)"
                >{{ s.label }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--base">
              <span class="flabel">Base</span>
              <div class="fchips">
                <button
                  v-for="b in bases" :key="b"
                  :class="['fchip', marcado(filters.base, b) && 'fchip--on']"
                  @click="toggleBase(b, $event)"
                >{{ b }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--gerencia">
              <span class="flabel">Gerência</span>
              <div class="fchips">
                <button
                  v-for="g in gerencias" :key="g"
                  :class="['fchip', marcado(filters.gerencia, g) && 'fchip--on']"
                  @click="toggleGerencia(g, $event)"
                >{{ g }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--gerente">
              <span class="flabel">Gerente</span>
              <div class="fchips">
                <button
                  v-for="g in gerentes" :key="g"
                  :class="['fchip', marcado(filters.gerente, g) && 'fchip--on']"
                  @click="toggleGerente(g, $event)"
                >{{ g }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--coord">
              <span class="flabel">Coordenador</span>
              <div class="fchips">
                <button
                  v-for="g in coordenadores" :key="g"
                  :class="['fchip', marcado(filters.coordenador, g) && 'fchip--on']"
                  @click="toggleCoordenador(g, $event)"
                >{{ g }}</button>
              </div>
            </div>

            <div class="fgroup fgroup--obs">
              <span class="flabel">Observador</span>
              <q-select
                multiple :model-value="valores(filters.observador)" @update:model-value="(v: string[]) => filters.observador = juntar(v)" :display-value="rotulo(filters.observador)"
                :options="semTodos(observadoresOpts)"
                menu-anchor="bottom left" menu-self="top left" :menu-offset="[0, 4]"
              outlined dense clearable class="filtro-select"
              popup-content-class="banco-popup" :popup-content-style="{ maxHeight: '260px' }"
            ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
            </div>

            <div class="fgroup fgroup--equipe">
              <span class="flabel">Equipe</span>
              <q-select
                multiple :model-value="valores(filters.equipe)" @update:model-value="(v: string[]) => filters.equipe = juntar(v)" :display-value="rotulo(filters.equipe)"
                :options="semTodos(equipesOpts)"
                menu-anchor="bottom left" menu-self="top left" :menu-offset="[0, 4]"
              outlined dense clearable class="filtro-select"
              popup-content-class="banco-popup" :popup-content-style="{ maxHeight: '260px' }"
            ><template #option="{ itemProps, opt, selected, toggleOption }"><q-item v-bind="itemProps"><q-item-section side><q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" /></q-item-section><q-item-section>{{ opt }}</q-item-section></q-item></template></q-select>
            </div>

          </div>
        </div>
      </q-slide-transition>
    </div>

    </div><!-- /banco-sticky -->

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

        <template #body-cell-dataFoto="props">
          <q-td :props="props" :title="`Enviado em ${props.row.enviadoEm}`">{{ props.value }}</q-td>
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
                <span v-if="props.row.historico" class="nc-historico" title="Checklist da base histórica: não tem foto de evidência">
                  <q-icon name="mdi-image-off-outline" size="11px" /> sem foto · base histórica
                </span>
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
import { valores, juntar, marcado, alternar, alternarMinimo, rotulo, semTodos, casa, igualCI, ativo, type CliqueEv } from "@/lib/multi-filtro";
import { ref, reactive, computed, onMounted, watch } from "vue";
import { persistirFiltros } from "@/lib/filtros-persistentes";
import { useChecklistData, type SubmissionRow, type ResponseRow, type EmployeeRow } from "@/composables/useChecklistData";
import { semanaDaSub, uniqueHierarchyOpts, dataReferencia, dataDaFoto } from "@/lib/dashboard";
import { partesLocais, formatarDataHora } from "@/lib/semanas";
import { useHierarquiaEquipe } from "@/composables/useHierarquiaEquipe";
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
  [1, 2, 3, 4].map((v) => ({ value: v, label: rotuloSemana(filters.ano, Number(valores(filters.mes)[0] ?? new Date().getMonth() + 1), v) })),
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
  // "Todos" = sem filtro; vários marcados ficam juntos (ver multi-filtro)
  mes:        "Todos",
  semana:     "Todos",
  base:       "Todos",
  gerencia:   "Todos",
  gerente:    "Todos", coordenador: "Todos",
  observador: "Todos",
  equipe:     "Todos",
});
persistirFiltros("banco", filters);

const filtrosAbertos = ref(false);
const filtrosAtivosCount = computed(() =>
  [filters.semana, filters.base, filters.gerencia, filters.gerente, filters.coordenador, filters.observador, filters.equipe]
    .filter(v => ativo(v)).length
);

// Clique escolhe só aquele valor; Ctrl+clique soma ou tira (ver multi-filtro)
function toggleSemana (v: number, ev?: CliqueEv)  { filters.semana   = alternar(filters.semana, String(v), ev); }
function toggleMes    (v: number, ev?: CliqueEv)  { filters.mes      = alternar(filters.mes, String(v), ev); }
function toggleBase   (v: string, ev?: CliqueEv)  { filters.base     = alternar(filters.base, v, ev); }
function toggleGerencia(v: string, ev?: CliqueEv) { filters.gerencia = alternar(filters.gerencia, v, ev); }
function toggleGerente (v: string, ev?: CliqueEv) { filters.gerente  = alternar(filters.gerente, v, ev); }
function toggleCoordenador(v: string, ev?: CliqueEv) { filters.coordenador = alternar(filters.coordenador, v, ev); }

// ─── Dados ───────────────────────────────────────────────────────────────────

const { loading, load, submissions, responses, employees } = useChecklistData();
const gerentes = computed(() => uniqueHierarchyOpts(employees.value, "gerente", false));
// Coordenador e gerente: as equipes vinculadas a eles (não os observadores), como nas demais páginas.
const { coordenadoresOpts, passaCoordenadorGerente } = useHierarquiaEquipe(employees);
const coordenadores = computed(() => coordenadoresOpts.value.filter((c) => c !== "Todos"));

async function recarregar() {
  const nums = valores(filters.mes).map(Number).filter(Boolean).sort((a, b) => a - b);
  await load(
    nums.length === 0
      ? { ano: filters.ano, contarMeta: true }
      : nums.length === 1
        ? { ano: filters.ano, mes: nums[0]!, contarMeta: true }
        : { ano: filters.ano, meses: nums, contarMeta: true },
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
  /** Data da foto (ou a do envio, sem foto registrada) e quando foi enviado, já formatadas. */
  dataFoto: string;
  dataFotoIso: string;
  enviadoEm: string;
  semana: number;
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
  /** Checklist da base histórica (meses anteriores a outubro/2026): a não conformidade existe, mas não tem foto. */
  historico: boolean;
}

const subMap = computed(() => {
  const m: Record<string, SubmissionRow> = {};
  for (const s of submissions.value) m[s.id] = s;
  return m;
});

function ehHistorico(sub: SubmissionRow | undefined): boolean {
  return !!(sub?.resumo as { legado?: unknown } | null | undefined)?.legado;
}

const todasNcs = computed<NcRow[]>(() => {
  return responses.value
    // Com foto (envios pelo app) ou da base histórica, que nunca teve foto
    .filter((r: ResponseRow) => r.resposta === "nao_conforme"
      && (r.foto_r2_key !== null || ehHistorico(subMap.value[r.submission_id])))
    .map((r: ResponseRow) => {
      const sub = subMap.value[r.submission_id];
      if (!sub) return null;
      const emp = empMap.value[sub.matricula];
      const atrib = r.atribuido_nome
        ? (r.atribuido_tipo === "equipe" ? `Equipe · ${r.atribuido_nome}` : r.atribuido_nome)
        : null;
      return {
        key:            `${r.submission_id}_${r.pergunta_id}`,
        mes:            mesesAbrev[partesLocais(sub.data).mes - 1] ?? "",
        data:           dataReferencia(sub),
        dataFoto:       formatarDataHora(dataDaFoto(sub)),
        dataFotoIso:    dataDaFoto(sub),
        enviadoEm:      formatarDataHora(sub.data),
        semana:         semanaDaSub(sub),
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
        historico:      r.foto_r2_key === null,
      } satisfies NcRow;
    })
    .filter(Boolean) as NcRow[];
});

// ─── Filtros client-side ──────────────────────────────────────────────────────

const listaFiltrada = computed<NcRow[]>(() => {
  let rows = todasNcs.value;

  if (ativo(filters.semana)) {
    rows = rows.filter(r => casa(filters.semana, String(r.semana)));
  }

  if (ativo(filters.base)) {
    const subsBase = new Set(
      submissions.value.filter(s => casa(filters.base, s.base)).map(s => s.id)
    );
    rows = rows.filter(r => {
      const sub = subMap.value[r.key.split("_")[0]!];
      return sub ? subsBase.has(sub.id) : false;
    });
  }

  if (ativo(filters.gerencia)) {
    rows = rows.filter(r => casa(filters.gerencia, r.gerenciaEmp));
  }

  if (ativo(filters.gerente) || ativo(filters.coordenador)) {
    rows = rows.filter(r => {
      const sub = subMap.value[r.key.split("_")[0]!];
      return sub ? passaCoordenadorGerente(sub, filters.coordenador, filters.gerente) : false;
    });
  }

  if (ativo(filters.observador)) {
    rows = rows.filter(r => casa(filters.observador, r.observador));
  }

  if (ativo(filters.equipe)) {
    rows = rows.filter(r => casa(filters.equipe, r.equipe));
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
  { name: "dataFoto",      label: "Data da foto",   field: "dataFoto",      align: "center" as const, sortable: true,
    sort: (_a: string, _b: string, ra: { dataFotoIso: string }, rb: { dataFotoIso: string }) => ra.dataFotoIso.localeCompare(rb.dataFotoIso) },
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

// ── Faixa fixa (cabeçalho + filtros) ──────────────────────────────────────────
.banco-sticky {
  position: sticky;
  top: var(--app-header-h);
  z-index: 95;
  box-shadow: 0 8px 14px -10px rgba(15, 23, 42, 0.35);
}

// ── Cabeçalho ─────────────────────────────────────────────────────────────────
.banco-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  padding: 8px 24px;
  border-bottom: 2px solid #eee;

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: .95rem;
    font-weight: 700;
    color: $brand;
    letter-spacing: .03em;
  }

  &__datetime {
    font-size: .68rem;
    color: var(--poc-muted);
    margin-top: 0;
  }

  &__counter {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
  }

  &__num {
    font-size: 1.7rem;
    font-weight: 900;
    color: $brand;
    line-height: 1;
  }

  &__label {
    font-size: .72rem;
    color: var(--poc-muted);
    white-space: nowrap;
  }

  &__search { margin-left: auto; }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
.banco-filters {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 4px 24px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  // Aberto, o painel nunca passa da altura da tela: rola por dentro
  max-height: calc(100vh - var(--app-header-h) - 70px);
  overflow-y: auto;
  // as colunas da grade de filtros seguem a largura do painel (com ou sem o menu lateral aberto)
  container: banco / inline-size;
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

// ── Grade de filtros ─────────────────────────────────────────────────────────
.filter-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px 24px;
  align-items: start;
  margin-top: 10px;
  padding-bottom: 6px;
}

// estreito: um grupo por linha
.fgroup {
  grid-column: 1 / -1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

// médio: pares lado a lado
@container banco (min-width: 640px) {
  // Ano + Semana na mesma linha e o Mês (largo) logo abaixo; o resto segue a ordem normal
  .fgroup--ano     { grid-column: span 3; order: 1; }
  .fgroup--semana  { grid-column: span 9; order: 2; }
  .fgroup--mes     { order: 3; }
  .fgroup--base,
  .fgroup--gerencia,
  .fgroup--gerente,
  .fgroup--coord,
  .fgroup--obs,
  .fgroup--equipe  { order: 4; }
  .fgroup--base,
  .fgroup--gerencia,
  .fgroup--obs,
  .fgroup--equipe  { grid-column: span 6; }
}

// largo: período numa linha, escopo na seguinte, hierarquia e buscas na última
@container banco (min-width: 1000px) {
  .fgroup { order: 0; }
  .fgroup--ano     { grid-column: span 2; }
  .fgroup--mes     { grid-column: span 6; }
  .fgroup--semana  { grid-column: span 4; }
  .fgroup--base    { grid-column: span 4; }
  .fgroup--gerencia{ grid-column: span 4; }
  .fgroup--gerente { grid-column: span 4; }
  .fgroup--coord   { grid-column: span 8; }
  .fgroup--obs     { grid-column: span 2; }
  .fgroup--equipe  { grid-column: span 2; }
}

// Seletores no mesmo porte das pílulas (28px), como no Histórico ICIT
.filtro-select {
  width: 100%;
  :deep(.q-field__control) {
    height: 28px; min-height: 28px; border-radius: 999px; padding: 0 10px; background: #f1f5f9;
  }
  :deep(.q-field__control::before) { border: 1.5px solid #e2e8f0; border-radius: 999px; }
  :deep(.q-field__control:hover::before) { border-color: $brand; }
  :deep(.q-field--focused .q-field__control::after) { border-color: $brand; border-radius: 999px; }
  :deep(.q-field__control-container) { padding-top: 0 !important; }
  :deep(.q-field__native) {
    font-size: 11px; font-weight: 500; color: #475569;
    min-height: unset; height: 28px; line-height: 28px; padding: 0; align-self: center;
  }
  :deep(.q-field__append) { height: 28px; align-self: center; }
  :deep(.q-field__append .q-icon) { font-size: 16px; color: var(--poc-muted); }
}

.flabel {
  font-size: 10px;
  font-weight: 700;
  color: var(--poc-muted);
  text-transform: uppercase;
  letter-spacing: .8px;
  line-height: 1;
}

.fchips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// Mesmo visual das pílulas de filtro do Histórico ICIT
.fchip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px solid #e2e8f0;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  outline: none;
  transition: background .15s, color .15s, border-color .15s, transform .1s;
  white-space: nowrap;

  &:hover:not(.fchip--on) { border-color: $brand; color: $brand; background: rgba($brand, .05); }
  &:active { transform: scale(.96); }
  &:focus-visible { outline: 2px solid $brand; outline-offset: 1px; }

  &--on {
    background: $brand;
    border-color: $brand;
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba($brand, .3);
  }
}

.ano-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 14px;
  background: #1e293b;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border: 1.5px solid #334155;
  border-radius: 999px;
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

.nc-historico {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: .7rem;
  font-weight: 600;
  opacity: .6;
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

:global(.banco-popup .q-item) { font-size: 12px; min-height: 30px; padding: 2px 12px; }
:global(.banco-popup .q-item__section--side) { padding-right: 10px; }
:global(.banco-popup .q-item--active) { color: $brand !important; }

// ── Dark mode ──────────────────────────────────────────────────────────────────
.body--dark {
  .banco-nc { background: #0f172a; }

  .banco-header {
    background: #1e293b;
    border-bottom-color: #334155;
    &__datetime, &__label { color: var(--poc-muted); }
  }

  .banco-filters { background: #1e293b; border-bottom-color: #334155; }
  .flabel { color: var(--poc-muted); }

  .fchip {
    background: #1e293b;
    border-color: #334155;
    color: var(--poc-muted);
    &:hover:not(.fchip--on) { border-color: $brand; color: #fca5a5; background: rgba($brand, .1); }
    &--on { background: $brand; border-color: $brand; color: #fff; }
  }

  .filtro-select {
    :deep(.q-field__control) { background: #1e293b; }
    :deep(.q-field__control::before) { border-color: #334155; }
    :deep(.q-field__control:hover::before) { border-color: $brand; }
    :deep(.q-field--focused .q-field__control::after) { border-color: $brand; }
    :deep(.q-field__native) { color: var(--poc-muted); }
    :deep(.q-field__append .q-icon) { color: #475569; }
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
