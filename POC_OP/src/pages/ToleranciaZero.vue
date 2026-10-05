<template>
  <q-page class="tz-page">
    <q-linear-progress v-if="loading" indeterminate color="negative" style="position:sticky;top:0;z-index:200" />

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         FILTER BAR
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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

        <!-- Row 1: Ano · Categoria · Gerente Final · Observador -->
        <div class="filter-row">
          <div class="fgroup">
            <span class="fgroup__label">Ano</span>
            <div class="pill-group">
              <button v-for="a in anos" :key="a"
                :class="['pill', filters.ano === a && 'pill--active']"
                @click="filters.ano = a">{{ a }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Categoria</span>
            <div class="pill-group">
              <button v-for="c in categorias" :key="c"
                :class="['pill', filters.categoria === c && 'pill--active']"
                @click="filters.categoria = c">{{ c }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Gerente Final</span>
            <div class="pill-group">
              <button v-for="g in gerentesFinal" :key="g"
                :class="['pill', filters.gerenteFinal === g && 'pill--active']"
                @click="filters.gerenteFinal = g">{{ g }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Observador</span>
            <q-select v-model="filters.observador" :options="observadorOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>
        </div>

        <!-- Row 2: Mês · Semana · Base · Gerência da Equipe · Prefixo -->
        <div class="filter-row">
          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Mês</span>
            <q-select v-model="filters.mes" :options="mesesOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="fgroup fgroup--select">
            <span class="fgroup__label">Semana</span>
            <q-select v-model="filters.semana" :options="semanasOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="filter-divider" />

          <div class="fgroup">
            <span class="fgroup__label">Base</span>
            <div class="pill-group">
              <button v-for="b in bases" :key="b"
                :class="['pill', filters.base === b && 'pill--active']"
                @click="filters.base = b">{{ b }}</button>
            </div>
          </div>

          <div class="filter-divider" />

          <div class="fgroup fgroup--select" style="min-width:160px">
            <span class="fgroup__label">Gerência da Equipe</span>
            <q-select v-model="filters.gerencia" :options="gerenciasOpts"
              dense outlined hide-bottom-space class="fselect"
              popup-content-class="fselect-popup" />
          </div>

          <div class="fgroup fgroup--select" style="min-width:170px">
            <span class="fgroup__label">Prefixo da Equipe</span>
            <q-select v-model="filters.prefixo" :options="prefixoOpts"
              dense outlined hide-bottom-space class="fselect"
              use-input input-debounce="0" popup-content-class="fselect-popup"
              @filter="filterPrefixo" />
          </div>
        </div>

      </div>
      </div>
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-summary">
          <span class="filter-summary__label">Filtros ativos:</span>
          <span class="filter-chip">{{ filters.ano }}</span>
          <span class="filter-chip">{{ filters.mes }}</span>
          <span v-if="filters.semana !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.semana = 'Todos'">{{ filters.semana }}</span>
          <span v-if="filters.base !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.base = 'Todos'">{{ filters.base }}</span>
          <span v-if="filters.gerencia !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerencia = 'Todos'">{{ filters.gerencia }}</span>
          <span v-if="filters.gerenteFinal !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.gerenteFinal = 'Todos'">{{ filters.gerenteFinal }}</span>
          <span v-if="filters.observador !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.observador = 'Todos'">{{ filters.observador }}</span>
          <span v-if="filters.categoria !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.categoria = 'Todos'">{{ filters.categoria }}</span>
          <span v-if="filters.prefixo !== 'Todos'" class="filter-chip filter-chip--hit" @click="filters.prefixo = 'Todos'">{{ filters.prefixo }}</span>
          <span v-if="viz.pergunta" class="filter-chip filter-chip--hit" @click="viz.pergunta = null">{{ perguntaChip }}</span>
          <button class="filter-clear" @click="resetSlice">
            <q-icon name="mdi-close-circle" size="14px" />
            Limpar
          </button>
        </div>
      </transition>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         CONTENT
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="q-pa-md">
      <div class="row q-col-gutter-md items-stretch">

        <!-- Col 1: Treemap -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Risco de Alto Potencial por Categoria</div>
              <div class="chart-caption">Clique na categoria para filtrar as outras visões</div>
            </q-card-section>
            <q-card-section class="q-pt-none" style="padding-bottom:0">
              <v-chart v-if="treemapData.length" class="chart-hit" :option="chartTreemap" autoresize style="height:460px" @click="onCategoriaClick" />
              <div v-else class="empty-chart" style="height:460px">
                <q-icon name="mdi-check-circle-outline" size="48px" color="positive" />
                <div class="empty-chart__title">Sem Não Conformidades</div>
                <div class="empty-chart__sub">Nenhum registro no período selecionado</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 2: Ranking table -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Ranking do Risco de Alto Potencial</div>
              <div class="chart-caption">Clique na linha para filtrar pelo item</div>
            </q-card-section>
            <q-card-section class="q-pa-none">
              <div class="rank-wrap">
                <table class="rank-table">
                  <thead>
                    <tr>
                      <th class="rh-q">Não conformidade</th>
                      <th class="rh-v">Qnt Não Conforme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(r, i) in rankingNc" :key="i"
                      :class="['rank-row', i % 2 === 0 && 'rank-row--alt', viz.pergunta === r.q && 'rank-row--on']"
                      @click="togglePergunta(r.q)"
                    >
                      <td class="rd-q">{{ r.q }}</td>
                      <td class="rd-v">{{ r.v }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="rank-total">
                      <td class="rd-q">Total</td>
                      <td class="rd-v">{{ totalNc }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Col 3: Bar chart ranking equipes -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="chart-card full-height">
            <q-card-section class="q-pb-xs">
              <div class="chart-title">Ranking de Equipes com Não conformidades</div>
              <div class="chart-caption">Clique na equipe para filtrar as outras visões</div>
            </q-card-section>
            <q-card-section class="q-pt-none" style="padding-bottom:0">
              <v-chart class="chart-hit" :option="chartRankingEq" autoresize style="height:460px" @click="onEquipeClick" />
            </q-card-section>
          </q-card>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, TreemapChart } from "echarts/charts";
import { TooltipComponent, GridComponent, DataZoomComponent } from "echarts/components";
import VChart from "vue-echarts";
import { chartInk } from "@/lib/chart-ink";
import { useChecklistData, fmtN } from "@/composables/useChecklistData";
import { filterByGerencia, filterByGerente, semanaDoMes } from "@/lib/dashboard";

use([CanvasRenderer, BarChart, TreemapChart, TooltipComponent, GridComponent, DataZoomComponent]);

const {
  loading, error,
  byCategoria, byGravidade, submissions, responses, employees,
  load,
} = useChecklistData();

// â"€â"€â"€ Filter options â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const showFilters = ref(false);

const anos         = ["2024", "2025", "2026"];
const categorias   = ["Todos", "APR", "Padrinho de Segurança", "Procedimento", "Regras de Ouro"];
const gerentesFinal = ["Todos","Afonso","Jamerson","João F.","Julio C.","Leandro","Marcos","Paulo","Pryscilla"];
const bases        = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const mesesOpts    = ["jan/26","fev/26","mar/26","abr/26","mai/26","jun/26","jul/26","ago/26","set/26","out/26","nov/26","dez/26"];
const semanasOpts  = ["Todos","1ª Semana","2ª Semana","3ª Semana","4ª Semana"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","OFICINA","SESMT","SPOT"];

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

const prefixoOpts = ref<string[]>(["Todos", ...allPrefixes]);
function filterPrefixo(val: string, update: (fn: () => void) => void) {
  update(() => {
    const n = val.toLowerCase();
    prefixoOpts.value = ["Todos", ...allPrefixes.filter(p => p.toLowerCase().includes(n))];
  });
}

const now = new Date();
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
  "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
};
const curMesLabel = mesesOpts[now.getMonth()] ?? "jan/26";

const filters = reactive({
  ano: String(now.getFullYear()), categoria: "Todos", gerenteFinal: "Todos",
  observador: "Todos", mes: curMesLabel, semana: "Todos",
  base: "Todos", gerencia: "Todos", prefixo: "Todos",
});

async function recarregar() {
  const mesNum = MONTH_MAP[filters.mes.slice(0, 3)] ?? (now.getMonth() + 1);
  await load({
    ano: Number(filters.ano),
    mes: mesNum,
    base: filters.base === "Todos" ? undefined : filters.base,
  });
}
onMounted(recarregar);
watch(() => [filters.ano, filters.mes, filters.base], recarregar);

const viz = reactive({ pergunta: null as string | null });

type EcClick = { componentType?: string; dataIndex?: number; name?: string };

function togglePergunta(q: string) {
  viz.pergunta = viz.pergunta === q ? null : q;
}

function onCategoriaClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name) return;
  filters.categoria = filters.categoria === p.name ? "Todos" : p.name;
}

function onEquipeClick(p: EcClick) {
  if (p.componentType && p.componentType !== "series") return;
  if (!p.name?.trim()) return;
  filters.prefixo = filters.prefixo === p.name ? "Todos" : p.name;
}

function resetSlice() {
  filters.categoria = "Todos";
  filters.gerenteFinal = "Todos";
  filters.observador = "Todos";
  filters.semana = "Todos";
  filters.gerencia = "Todos";
  filters.prefixo = "Todos";
  viz.pergunta = null;
}

const hasActiveFilters = computed(() =>
  filters.semana !== "Todos"
  || filters.base !== "Todos"
  || filters.gerencia !== "Todos"
  || filters.gerenteFinal !== "Todos"
  || filters.observador !== "Todos"
  || filters.categoria !== "Todos"
  || filters.prefixo !== "Todos"
  || !!viz.pergunta,
);

const perguntaChip = computed(() => {
  const q = viz.pergunta ?? "";
  return q.length > 42 ? `${q.slice(0, 40)}…` : q;
});

function isTz(r: { resposta: string; gravidade?: string | null; peso: number }) {
  return r.resposta === "nao_conforme" && (
    r.gravidade === "tolerancia_zero"
    || r.gravidade === "Tolerância Zero"
    || r.peso >= 5
  );
}

function applySlice(
  source: typeof submissions.value,
  omit: { gerencia?: boolean; prefixo?: boolean; observador?: boolean; week?: boolean } = {},
) {
  let s = filterByGerente(source, employees.value, filters.gerenteFinal);
  if (!omit.gerencia) s = filterByGerencia(s, employees.value, filters.gerencia);
  if (!omit.week && filters.semana !== "Todos") {
    const semNum = Number(filters.semana.replace(/\D/g, "")) || 0;
    if (semNum) s = s.filter(sub => semanaDoMes(new Date(sub.data).getDate()) === semNum);
  }
  if (!omit.observador && filters.observador !== "Todos") {
    s = s.filter(sub => sub.observador === filters.observador);
  }
  if (!omit.prefixo && filters.prefixo !== "Todos") {
    s = s.filter(sub => sub.equipe === filters.prefixo);
  }
  return s;
}

function tzResps(
  subs: typeof submissions.value,
  omit: { cat?: boolean; pergunta?: boolean } = {},
) {
  const ids = new Set(subs.map(s => s.id));
  let r = responses.value.filter(resp => ids.has(resp.submission_id) && isTz(resp));
  if (!omit.cat && filters.categoria !== "Todos") {
    r = r.filter(resp => resp.categoria === filters.categoria);
  }
  if (!omit.pergunta && viz.pergunta) {
    r = r.filter(resp => (resp.pergunta ?? "Sem descrição") === viz.pergunta);
  }
  return r;
}

const observadorOpts = computed(() => {
  const names = [...new Set(submissions.value.map(s => s.observador).filter(Boolean))].sort();
  return ["Todos", ...names];
});

const filteredSubs = computed(() => applySlice(submissions.value));
const filteredResps = computed(() => tzResps(filteredSubs.value));
const respsNoCat = computed(() => tzResps(filteredSubs.value, { cat: true }));
const respsNoPergunta = computed(() => tzResps(filteredSubs.value, { pergunta: true }));
const subsNoPrefixo = computed(() => applySlice(submissions.value, { prefixo: true }));
const respsNoPrefixo = computed(() => tzResps(subsNoPrefixo.value));

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
    padding: [12, 14] as [number, number],
    textStyle: { color: fg, fontSize: 12, fontWeight: 500 as const },
    extraCssText:
      `background:${bg} !important;color:${fg} !important;border:1px solid ${bd};`
      + "border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.55);"
      + "max-width:min(280px, calc(100vw - 16px));white-space:normal;opacity:1;",
  };
}

function tipHtml(title: string, rows: { label: string; value: string }[], foot?: string) {
  const t = chartInk.tipText;
  const m = chartInk.tipMuted;
  const body = rows
    .map((r) =>
      `<div style="display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-top:6px">`
      + `<span style="color:${m};font-size:11px;font-weight:600">${r.label}</span>`
      + `<span style="color:#8B1C2B;font-size:13px;font-weight:800">${r.value}</span>`
      + `</div>`,
    )
    .join("");
  const hint = foot ? `<div style="color:${m};font-size:10px;margin-top:8px">${foot}</div>` : "";
  return `<div style="min-width:168px;max-width:260px;color:${t}"><div style="font-weight:800;font-size:14px;line-height:1.3;color:${t};white-space:normal">${title}</div>${body}${hint}</div>`;
}

// â"€â"€â"€ Treemap â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const treemapData = computed(() => {
  const map: Record<string, number> = {};
  for (const r of respsNoCat.value) {
    const cat = r.categoria ?? "Sem categoria";
    map[cat] = (map[cat] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value);
});

const tmPalette = ["#6b1321","#8B1C2B","#a32636","#c43d52","#e8889a","#f9c5cb"];

const chartTreemap = computed(() => {
  const selected = filters.categoria !== "Todos" ? filters.categoria : null;
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Ocorrências", value: String(p.value) },
        ], "Clique para filtrar esta categoria"),
    },
    series: [{
      type: "treemap" as const,
      roam: false,
      nodeClick: false as const,
      breadcrumb: { show: false },
      label: {
        show: true,
        position: "insideTopLeft" as const,
        padding: [10, 10],
        formatter: (p: { name: string; value: number }) => `${p.name}\n\n${p.value}`,
        fontSize: 13,
        fontWeight: "bold" as const,
        color: "#fff",
        textBorderColor: "rgba(0,0,0,.2)",
        textBorderWidth: 1,
      },
      data: treemapData.value.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: {
          color: tmPalette[i] ?? "#f9c5cb",
          opacity: !selected || selected === d.name ? 1 : 0.28,
        },
      })),
      itemStyle: { borderWidth: 2, borderColor: "#fff" },
    }],
  };
});

// â"€â"€â"€ Ranking NC table â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const rankingNc = computed(() => {
  const counts: Record<string, number> = {};
  for (const r of respsNoPergunta.value) {
    const key = r.pergunta ?? "Sem descrição";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([q, v]) => ({ q, v }))
    .sort((a, b) => b.v - a.v);
});

const totalNc = computed(() => filteredResps.value.length);

// â"€â"€â"€ Ranking equipes bar chart â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const rankEquipes = computed(() => {
  const ncPerSub: Record<string, number> = {};
  for (const r of respsNoPrefixo.value) {
    ncPerSub[r.submission_id] = (ncPerSub[r.submission_id] ?? 0) + 1;
  }
  const counts: Record<string, number> = {};
  for (const sub of subsNoPrefixo.value) {
    const nc = ncPerSub[sub.id] ?? 0;
    if (nc === 0) continue;
    if (sub.equipe) counts[sub.equipe] = (counts[sub.equipe] ?? 0) + nc;
  }
  return Object.entries(counts)
    .map(([name, v]) => ({ name, v }))
    .sort((a, b) => a.v - b.v);
});

function barColor(v: number): string {
  if (v >= 6) return "#6b1321";
  if (v >= 4) return "#8B1C2B";
  if (v >= 2) return "#a32636";
  return "#c43d52";
}

const chartRankingEq = computed(() => {
  const data = rankEquipes.value;
  const selected = filters.prefixo !== "Todos" ? filters.prefixo : null;
  const vis = Math.min(12, Math.max(data.length, 1));
  const start = Math.max(0, data.length - vis);
  const end = Math.max(0, data.length - 1);
  return {
    tooltip: {
      ...tooltipSkin("item"),
      formatter: (p: { name: string; value: number }) =>
        tipHtml(p.name, [
          { label: "Não conformes", value: String(p.value) },
        ], "Clique para filtrar esta equipe"),
    },
    grid: { left: 8, right: 40, top: 8, bottom: 16, containLabel: true },
    xAxis: { type: "value" as const, show: false, splitLine: { show: false }, max: Math.max(...data.map(e => e.v), 1) * 1.32 },
    yAxis: {
      type: "category" as const,
      data: data.map(r => r.name),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: chartInk.axis, fontSize: 10 },
    },
    dataZoom: [
      {
        type: "inside" as const, orient: "vertical" as const,
        startValue: start, endValue: end,
        zoomOnMouseWheel: false, moveOnMouseWheel: true,
      },
      {
        type: "slider" as const,
        show: data.length > vis,
        orient: "vertical" as const,
        width: 8, right: 6, top: "12%", bottom: "12%",
        startValue: start, endValue: end,
        brushSelect: false, showDetail: false, showDataShadow: false, zoomLock: true,
        borderRadius: 8, borderColor: "transparent",
        backgroundColor: "rgba(148,163,184,.18)",
        fillerColor: "rgba(139,28,43,.45)",
        handleSize: "70%",
        handleStyle: { color: "#fff", borderColor: "#8B1C2B", borderWidth: 1 },
        moveHandleSize: 0,
      },
    ],
    series: [{
      type: "bar" as const,
      cursor: "pointer",
      data: data.map(r => ({
        value: r.v,
        itemStyle: {
          color: barColor(r.v),
          opacity: !selected || selected === r.name ? 1 : 0.22,
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 20,
      emphasis: { itemStyle: { opacity: .8 } },
      label: {
        show: true, position: "right" as const,
        fontSize: 11, fontWeight: "bold" as const, color: "#8B1C2B",
      },
    }],
  };
});
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;

.tz-page { background: #f8fafc; min-height: 100vh; }

// â"€â"€ Filter bar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.filter-bar {
  background: #fff;
  border-bottom: 1px solid $border;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  padding: 10px 20px 6px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.filter-bar__inner { display: flex; flex-direction: column; gap: 8px; }
.filter-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.fgroup { display: flex; flex-direction: column; gap: 4px; }
.fgroup__label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: $label-color; line-height: 1;
}

// â"€â"€ Pills â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.pill-group { display: flex; gap: 4px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  height: 30px; padding: 0 12px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .1s;

  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &:active { transform: scale(.96); }
  &--active {
    background: $brand; color: $brand-text; border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600;
  }
}

// â"€â"€ Select dropdowns â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.fgroup--select { min-width: 120px; }
.fselect {
  height: 30px;
  :deep(.q-field__control) {
    height: 30px; min-height: 30px; border-radius: 999px;
    border-color: $border; background: $inactive-bg;
    padding: 0 10px 0 10px;
    transition: border-color .18s;
    &:hover { border-color: $brand; }
  }
  :deep(.q-field--focused .q-field__control) {
    border-color: $brand;
    box-shadow: 0 0 0 2px rgba($brand,.15);
  }
  :deep(.q-field__native) {
    font-size: 12px; font-weight: 500; color: $inactive-text;
    padding: 0; min-height: unset; line-height: 30px;
  }
  :deep(.q-field__append) { height: 30px; .q-icon { font-size: 16px; color: $label-color; } }
}
:global(.fselect-popup .q-item) { font-size: 12px; min-height: 32px; padding: 4px 12px; }
:global(.fselect-popup .q-item--active) { color: $brand !important; font-weight: 600; }

// â"€â"€ Divider â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.filter-divider {
  width: 1px; height: 36px; background: $border;
  flex-shrink: 0; align-self: flex-end; margin: 0 4px;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  flex-wrap: wrap;
}
.filter-summary__label {
  font-size: 11px;
  color: $label-color;
  font-weight: 600;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  background: rgba($brand, .1);
  color: $brand;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &--hit { cursor: pointer; }
  &--hit:hover { filter: brightness(0.92); }
}
.filter-clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 10px;
  background: none;
  border: 1px solid $border;
  border-radius: 999px;
  font-size: 11px;
  color: $label-color;
  cursor: pointer;
  &:hover { color: $brand; border-color: $brand; }
}

// â"€â"€ Cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.chart-card {
  border-radius: 12px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
}
.chart-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
}
.chart-caption {
  font-size: 11px; color: $label-color; margin-top: 2px;
}
.chart-hit { cursor: pointer; }
.empty-chart {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  &__title { font-size: 15px; font-weight: 700; color: #334155; }
  &__sub   { font-size: 12px; color: #94a3b8; }
}

// â"€â"€ Ranking table â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.rank-wrap {
  max-height: 490px;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
}
.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  thead tr {
    background: $brand;
    th {
      color: #fff;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
      padding: 8px 12px;
      text-align: left;
      border: none;
    }
    th.rh-v { text-align: center; white-space: nowrap; }
  }

  .rank-row td {
    padding: 7px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
    line-height: 1.4;
  }
  .rank-row { cursor: pointer; }
  .rank-row--alt td { background: #f8fafc; }
  .rank-row--on td { background: rgba($brand, .12); }
  td.rd-v { text-align: center; font-weight: 700; color: $brand; white-space: nowrap; }

  tfoot .rank-total td {
    background: $brand;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    padding: 8px 12px;
    border: none;
  }
  tfoot .rank-total td.rd-v { color: #fff; }
}

// â"€â"€ Dark mode â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
.body--dark {
  .tz-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .fselect {
    :deep(.q-field__control) { background: #1e293b; border-color: #334155; }
    :deep(.q-field__native) { color: #94a3b8; }
  }
  .chart-title { color: #e2e8f0; }
  .chart-caption { color: #64748b; }
  .filter-chip { background: rgba($brand, .2); }
  .filter-clear { border-color: #334155; color: #64748b; }
  .rank-row td { color: #cbd5e1; border-bottom-color: #1e293b; }
  .rank-row--alt td { background: #0f172a; }
  .rank-row--on td { background: rgba($brand, .28); }
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

