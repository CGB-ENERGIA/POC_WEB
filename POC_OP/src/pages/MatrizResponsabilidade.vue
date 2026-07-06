<template>
  <q-page class="matriz-page">

    <!-- ═══════════════════════════ FILTER BAR ═══════════════════════════ -->
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

        <!-- Row 1: Mês · Ano · Gerência -->
        <div class="filter-row">
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

        <!-- Row 2: Base · Gerente -->
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
            <span class="fgroup__label">Gerente</span>
            <div class="pill-group">
              <button v-for="g in gerentesOpts" :key="g"
                :class="['pill', filters.gerente === g && 'pill--active']"
                @click="filters.gerente = g">{{ g }}</button>
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>

    <!-- ═══════════════════════════ CONTENT ═══════════════════════════ -->
    <div class="q-pa-md">

      <!-- KPI row -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#dc2626" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(220,38,38,.1)">
                <q-icon name="mdi-clock-alert-outline" size="24px" style="color:#dc2626" />
              </div>
              <div class="kpi-stat-value" style="color:#dc2626">{{ naoResolvidos }}</div>
              <div class="kpi-stat-label">Não Resolvidos</div>
              <div class="kpi-stat-sub">pendentes no período</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="kpi-card kpi-stat-card">
            <div class="kpi-stat-accent" style="background:#16a34a" />
            <q-card-section class="q-pa-md kpi-stat-section">
              <div class="kpi-stat-icon-wrap" style="background:rgba(22,163,74,.1)">
                <q-icon name="mdi-check-circle-outline" size="24px" style="color:#16a34a" />
              </div>
              <div class="kpi-stat-value" style="color:#16a34a">{{ resolvidos }}</div>
              <div class="kpi-stat-label">Resolvidos</div>
              <div class="kpi-stat-sub">concluídos no período</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered class="kpi-card kpi-progress-card">
            <q-card-section class="q-pa-md">
              <div class="kpi-prog-label">Taxa de Resolução</div>
              <div class="kpi-prog-value">{{ taxaResolucao }}%</div>
              <q-linear-progress
                :value="taxaResolucao / 100"
                color="positive" track-color="red-2"
                rounded style="height:10px;border-radius:8px" class="q-mt-sm"
              />
              <div class="kpi-prog-sub">{{ resolvidos }} de {{ totalInc }} inconformidades resolvidas</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Table card -->
      <q-card flat bordered class="matriz-card">
        <q-card-section class="q-pa-sm q-pb-xs">
          <div class="row items-center">
            <div class="col">
              <div class="matriz-card-title">Matriz de Responsabilidade</div>
            </div>
            <div class="col-auto">
              <q-input v-model="search" dense outlined placeholder="Buscar..."
                class="search-input" style="min-width:220px">
                <template #prepend>
                  <q-icon name="mdi-magnify" size="18px" color="grey-6" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-pa-sm q-pt-xs">
          <div class="matriz-table-wrap">
            <table class="matriz-table">
              <thead>
                <tr>
                  <th class="col-data">Data</th>
                  <th class="col-base">Base</th>
                  <th class="col-obs">Observador</th>
                  <th class="col-equipe">Equipe</th>
                  <th class="col-cat">Categoria</th>
                  <th class="col-inc">Inconformidade da categoria</th>
                  <th class="col-ev">Evidência</th>
                  <th class="col-res">Resolvido</th>
                  <th class="col-dres">Data de resolução</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in filteredData" :key="i"
                  class="tr-clickable"
                  :class="{ 'tr-resolved': row.resolvido === 'Sim' }"
                  @click="abrirDetalhe(row)">
                  <td class="col-data td-mono">{{ row.data }}</td>
                  <td class="col-base">
                    <span class="base-badge">{{ row.base }}</span>
                  </td>
                  <td class="col-obs">{{ row.observador }}</td>
                  <td class="col-equipe td-mono">{{ row.equipe }}</td>
                  <td class="col-cat">
                    <span class="cat-badge" :class="catClass(row.categoria)">{{ row.categoria }}</span>
                  </td>
                  <td class="col-inc">{{ row.inconformidade }}</td>
                  <td class="col-ev">
                    <span v-if="row.fotoUrl" class="ev-badge ev-com-foto" title="Tem foto">
                      <q-icon name="mdi-camera" size="14px" />
                    </span>
                    <span v-else class="ev-badge ev-sem-foto" title="Sem foto">
                      <q-icon name="mdi-camera-off" size="14px" />
                    </span>
                  </td>
                  <td class="col-res">
                    <span class="res-badge" :class="row.resolvido === 'Sim' ? 'res-sim' : 'res-nao'">
                      {{ row.resolvido }}
                    </span>
                  </td>
                  <td class="col-dres td-mono">{{ row.dataResolucao || '—' }}</td>
                </tr>
                <tr v-if="filteredData.length === 0">
                  <td colspan="9" class="td-empty">Nenhum registro encontrado.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="q-mt-xs q-px-xs row items-center">
            <span class="table-count">{{ filteredData.length }} registro{{ filteredData.length !== 1 ? 's' : '' }}</span>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- ═══════════════════════════ DETAIL DIALOG ═══════════════════════════ -->
    <q-dialog v-model="dialogOpen" max-width="560px">
      <q-card v-if="detalhe" style="min-width:320px;max-width:560px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold" style="color:#8B1C2B">Detalhe da Não Conformidade</div>
            <div class="text-caption text-grey-6">{{ detalhe.data }} · {{ detalhe.base }} · {{ detalhe.equipe }}</div>
          </div>
          <q-btn flat round dense icon="mdi-close" v-close-popup />
        </q-card-section>

        <q-separator class="q-mt-sm" />

        <q-card-section class="q-pt-sm q-pb-xs">
          <div class="row items-center q-gutter-xs q-mb-sm">
            <span class="cat-badge" :class="catClass(detalhe.categoria)">{{ detalhe.categoria }}</span>
            <span class="res-badge" :class="detalhe.resolvido === 'Sim' ? 'res-sim' : 'res-nao'">{{ detalhe.resolvido }}</span>
          </div>

          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Pergunta do checklist</div>
          <div class="text-body2 text-weight-medium q-mb-md" style="color:#334155">{{ detalhe.pergunta }}</div>

          <template v-if="detalhe.observacao">
            <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Observação do auditor</div>
            <div class="obs-box q-mb-md">{{ detalhe.observacao }}</div>
          </template>

          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Observador · Equipe</div>
          <div class="text-body2 q-mb-md" style="color:#334155">{{ detalhe.observador }} · {{ detalhe.equipe }}</div>
        </q-card-section>

        <!-- Foto -->
        <q-card-section v-if="detalhe.fotoUrl" class="q-pt-none">
          <div class="text-caption text-grey-6 text-uppercase q-mb-xs" style="letter-spacing:.5px">Evidência fotográfica</div>
          <img :src="detalhe.fotoUrl" class="foto-evidencia" alt="Evidência" />
        </q-card-section>
        <q-card-section v-else class="q-pt-none">
          <div class="sem-foto">
            <q-icon name="mdi-camera-off" size="28px" color="grey-4" />
            <span class="text-caption text-grey-5 q-ml-sm">Sem foto de evidência</span>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fechar" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useChecklistData } from "@/composables/useChecklistData";

// ─── Filters ──────────────────────────────────────────────────────────────────
const showFilters = ref(false);
const search = ref("");

const mesesOpts     = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const anosOpts      = ["2024","2025","2026"];
const gerenciasOpts = ["Todos","ADM","GERE","GOMAN","GSTC","LOGÍSTICA","OFICINA","SESMT","SPOT"];
const basesOpts     = ["Todos","BCB","BDC","ITM","PDS","PDT","STI"];
const gerentesOpts  = ["Todos","Afonso","Jackson","Jamerson","Julio C.","Marcos","Paulo","Pryscilla","Rafaela","Ricardo"];

const MONTH_MAP: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const filters = reactive({
  mes: mesesOpts[new Date().getMonth()],
  ano: String(new Date().getFullYear()),
  gerencia: "Todos", base: "Todos", gerente: "Todos",
});

// ─── Dados reais ──────────────────────────────────────────────────────────────
const { loading, load, submissions, responses } = useChecklistData();

async function recarregar() {
  const mes = MONTH_MAP[filters.mes];
  const ano = Number(filters.ano);
  await load({ ano, mes, base: filters.base !== "Todos" ? filters.base : undefined });
}

onMounted(recarregar);
watch(filters, recarregar, { deep: true });

// ─── Photo URL helper ─────────────────────────────────────────────────────────
// foto_r2_key pode ser: URL completa (Supabase Storage) ou chave R2 relativa.
const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined ?? "").replace(/\/$/, "");
function fotoUrl(key: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("https://") || key.startsWith("http://")) return key;
  if (!R2_BASE) return null;
  return `${R2_BASE}/${key}`;
}

// ─── Data ────────────────────────────────────────────────────────────────────
type Row = {
  data: string; base: string; observador: string; equipe: string;
  categoria: string; pergunta: string; inconformidade: string;
  observacao: string | null; fotoUrl: string | null;
  resolvido: "Sim" | "Não"; dataResolucao: string;
};

const allData = computed<Row[]>(() => {
  const rows: Row[] = [];
  for (const r of responses.value) {
    if (r.resposta !== "nao_conforme") continue;
    const sub = submissions.value.find(s => s.id === r.submission_id);
    if (!sub) continue;
    const dt = new Date(sub.data);
    const fmt = `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR")}`;
    rows.push({
      data: fmt,
      base: sub.base,
      observador: sub.observador,
      equipe: sub.equipe,
      categoria: r.categoria,
      pergunta: r.pergunta,
      inconformidade: r.observacao ?? r.pergunta,
      observacao: r.observacao,
      fotoUrl: fotoUrl(r.foto_r2_key),
      resolvido: "Não",
      dataResolucao: "",
    });
  }
  return rows.sort((a, b) => b.data.localeCompare(a.data));
});

// ─── Dialog de detalhe ────────────────────────────────────────────────────────
const dialogOpen = ref(false);
const detalhe = ref<Row | null>(null);

function abrirDetalhe(row: Row) {
  detalhe.value = row;
  dialogOpen.value = true;
}

// legacy static rows kept for reference
const _staticRows: Row[] = [
  {
    data: "02/06/2026 15:11:36", base: "STI", observador: "Jorden C.", equipe: "ALOJ74",
    categoria: "Repúblicas",
    inconformidade: "BOTIJÃO ESTA DENTRO DA COZINHA.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "02/06/2026 15:43:30", base: "STI", observador: "Madson F.", equipe: "ALOJ32",
    categoria: "Repúblicas",
    inconformidade: "FORTE VAZAMENTO DE ÁGUA NO REGISTRO DO CHUVEIRO NO BANHEIRO",
    resolvido: "Sim", dataResolucao: "10/06/2026",
  },
  {
    data: "03/06/2026 15:16:21", base: "BCB", observador: "Normam", equipe: "ALOJ04",
    categoria: "Repúblicas",
    inconformidade: "NÃO ESTÁ LIMPA, E DUAS LÂMPADAS COM DEFEITOS",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "03/06/2026 16:31:05", base: "PDS", observador: "Josielington", equipe: "MA-PDS-V001M",
    categoria: "Procedimentos",
    inconformidade: "ENCARREGADO SUBSTITUTO NÃO POSSUI ABRAÇADEIRA DE GUARDIÃO E TAMBÉM NÃO APRESENTOU CARTA DE AUTORIZAÇÃO PARA A ATIVIDADE QUE EXERCIA. FEITO FEEDBACK E SOLICITADO ADEQUAÇÃO.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "03/06/2026 16:40:19", base: "PDS", observador: "Josielington", equipe: "MA-PDS-F004M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "ESCADA SINGELA COM FISSURA NO MONTANTE. FEITO FEEDBACK E SOLICITADO SUBSTITUIÇÃO.",
    resolvido: "Sim", dataResolucao: "15/06/2026",
  },
  {
    data: "03/06/2026 16:49:58", base: "PDS", observador: "Everton S.", equipe: "MA-PDS-E002M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "VEÍCULO COM A LUZ DO FREIO COM PROBLEMAS, PAINEL DO VEÍCULO MOSTRANDO ERRO, EPC BOLSA DA VARA DE MANOBRA DANIFICADO.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "03/06/2026 17:21:45", base: "PDT", observador: "Veronica", equipe: "ALOJ27",
    categoria: "Repúblicas",
    inconformidade: "PINTURA. AGUARDANDO PEDREIRO DA EMPRESA PARA RESOLVER.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "03/06/2026 17:48:39", base: "STI", observador: "Madson F.", equipe: "MA-STI-C001M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "ESCADA EXTENSIVA DANIFICADA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "04/06/2026 09:14:43", base: "BCB", observador: "Leandro", equipe: "ALOJ02",
    categoria: "Repúblicas",
    inconformidade: 'PONTO DE ATENÇÃO: O USO DE ADAPTADORES DO TIPO "T" (BENJAMIM) É PROIBIDO, POIS PODE PROVOCAR SOBRECARGA ELÉTRICA, AUMENTANDO SIGNIFICATIVAMENTE O RISCO DE CURTO-CIRCUITO, SUPERAQUECIMENTO E INCÊNDIO. UTILIZE APENAS DISPOSITIVOS E EXTENSÕES ADEQUADOS À CAPACIDADE DA INSTALAÇÃO ELÉTRICA, GARANTINDO A SEGURANÇA DAS PESSOAS E DO PATRIMÔNIO.',
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "04/06/2026 09:52:24", base: "BCB", observador: "Leandro", equipe: "MA-BCB-D001M",
    categoria: "Procedimentos",
    inconformidade: "FOI CONSTATADO O NÃO CUMPRIMENTO DO PROCEDIMENTO POP.00245.EQTL – EXECUÇÃO DO CORTE EM UNIDADE CONSUMIDORA DO GRUPO B, ESPECIFICAMENTE NO PASSO 04, QUE DETERMINA O DESLIGAMENTO DO DISJUNTOR, QUANDO ACESSÍVEL, DURANTE A EXECUÇÃO DO CORTE. DURANTE A ATIVIDADE OBSERVADA, O DISJUNTOR NÃO FOI DESLIGADO, APESAR DE ESTAR ACESSÍVEL. ADICIONALMENTE, O PADRINHO DE SEGURANÇA NÃO REALIZOU A ORIENTAÇÃO NECESSÁRIA QUANTO AO CUMPRIMENTO DO PROCEDIMENTO E AO TRATAMENTO DO DESVIO IDENTIFICADO. OS COLABORADORES FORAM ORIENTADOS NO MOMENTO DA OBSERVAÇÃO SOBRE A CORRETA EXECUÇÃO DA ATIVIDADE, REFORÇANDO A IMPORTÂNCIA DO CUMPRIMENTO INTEGRAL DO PROCEDIMENTO OPERACIONAL E DA ATUAÇÃO PREVENTIVA DO PADRINHO DE SEGURANÇA. ITEM DO POC SOBRE O RISCO DE CHOQUE E ARCO ELÉTRICO, FOI ANALISADO SE EXISTE O RISCO DE CURTO-CIRCUITO E/OU ARCO ELÉTRICO? SE EXISTIR, FORAM ADOTADAS AS MEDIDAS DE CONTROLE?",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "04/06/2026 18:01:10", base: "ITM", observador: "Lucilene", equipe: "ALOJ46",
    categoria: "Procedimentos",
    inconformidade: "A GELADEIRA DA REPÚBLICA ESTÁ EM MANUTENÇÃO",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "05/06/2026 12:49:08", base: "BDC", observador: "Nilo", equipe: "MA-BDC-O004M",
    categoria: "Veículos e Equipamentos",
    inconformidade: "PLACA DO VEÍCULO ESTÁ QUEBRADA. PRECISA SER SUBSTITUÍDA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "06/06/2026 13:18:52", base: "STI", observador: "Madson F.", equipe: "ALOJ32",
    categoria: "Repúblicas",
    inconformidade: "REGISTRO DO BANHEIRO VAZANDO ÁGUA E FECHADURA DO PORTÃO DANIFICADA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "07/06/2026 08:33:31", base: "PDS", observador: "Everton S.", equipe: "MA-PLR-E001M",
    categoria: "Procedimentos",
    inconformidade: "EQUIPES DESCUMPRIU POP 0110, 0111",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "08/06/2026 17:33:21", base: "STI", observador: "Joise", equipe: "ALOJ39",
    categoria: "Repúblicas",
    inconformidade: "DESCARGA DO SANITÁRIO DO BANHEIRO SOCIAL NÃO ESTÁ FUNCIONANDO. PIA DO BANHEIRO QUEBRADA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "09/06/2026 09:10:33", base: "BDC", observador: "Nilo", equipe: "MA-BDC-F002M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "ESCADA SINGELA COM O DEGRAU DANIFICADO, SOLICITAMOS A SUBSTITUIÇÃO",
    resolvido: "Sim", dataResolucao: "16/06/2026",
  },
  {
    data: "09/06/2026 11:11:24", base: "BCB", observador: "Gleyson", equipe: "MA-BCB-E002M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "ESCADA EXTENSIVA RACHADA, EQUIPE VOLTOU A BASE PARA SUBSTITUIR.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "09/06/2026 14:56:12", base: "BCB", observador: "Everton S.", equipe: "MA-SMT-E001M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "MANTAS ISOLANTES PENDENTES DE SUBSTITUIÇÃO",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "10/06/2026 17:05:46", base: "STI", observador: "Weyderson", equipe: "ALOJ32",
    categoria: "Repúblicas",
    inconformidade: "QUINTAL COM MATO ALTO",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "11/06/2026 17:15:36", base: "STI", observador: "Gercilene", equipe: "ALOJ73",
    categoria: "Repúblicas",
    inconformidade: "BOTIJÃO NA ÁREA INTERNA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "12/06/2026 05:36:21", base: "PDS", observador: "Heloyse", equipe: "ALOJ54",
    categoria: "Repúblicas",
    inconformidade: "PRECISAR TROCAR LÂMPADA DO CORREDOR, ANDAR DE CIMA, MAIS PROVIDENCIANDO A SUBSTITUIÇÃO DA MESMA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "12/06/2026 08:20:25", base: "STI", observador: "Weyderson", equipe: "ALOJ39",
    categoria: "Repúblicas",
    inconformidade: "NAO POSSUI CHUVEIRO ELETRICO",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "15/06/2026 20:32:08", base: "ITM", observador: "Leandro", equipe: "MA-MRA-E001M",
    categoria: "Veículos e Equipamentos",
    inconformidade: "ITENS OBSERVADOS:\n• DOCUMENTAÇÃO DO VEÍCULO COM EXERCÍCIO/LICENCIAMENTO REFERENTE AO ANO DE 2025;\n• ESCADA SINGELA SEM FITA (FITA EUREKA);\n• VEÍCULO ESTACIONADO \"CALÇO, SÓ COM UM DOS LADOS\".\n\nPROCEDIMENTOS:\n1. TRABALHO EM ALTURA\nREALIZAR RECICLAGEM NO PROCEDIMENTO POP.00111.EQTL - ATIVIDADES PRELIMINARES DE SEGURANÇA PARA TRABALHO EM ALTURA EM POSTE DE REDE DE DISTRIBUIÇÃO (RD), REFORÇANDO:\n• INSPEÇÃO E PREPARAÇÃO DOS EQUIPAMENTOS ANTES DO USO;\n• PROCEDIMENTO CORRETO DE AMARRAÇÃO DA ESCADA A PARTIR DO SOLO;\n• POSICIONAMENTO ADEQUADO DO TRAVA-QUEDAS DURANTE A SUBIDA E DESCIDA NA ESCADA.\n\n2. ATIVIDADES PRELIMINARES DE SEGURANÇA\nREALIZAR TREINAMENTO DE REFORÇO NO POP.00110.EQTL - ATIVIDADES PRELIMINARES DE SEGURANÇA, ABORDANDO:\n• AVALIAÇÃO PRÉVIA DO LOCAL DE TRABALHO, ASSEGURANDO CONDIÇÕES ADEQUADAS PARA EXECUÇÃO DAS ATIVIDADES COM SEGURANÇA E SAÍDA DE EMERGÊNCIA EM LOCAL SEGURO, SEM DESNÍVEL E OBSTÁCULOS.",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "15/06/2026 20:43:32", base: "BCB", observador: "Jackson", equipe: "ADM001",
    categoria: "Estruturas e Instalações Prediais",
    inconformidade: "ALMOXARIFADO PRECISANDO DE REFORMA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "15/06/2026 20:47:05", base: "BCB", observador: "Jackson", equipe: "LOG001",
    categoria: "Procedimentos",
    inconformidade: "FALTA EQUIPE REORGANIZAR MATERIAIS EM CONTATO COM SOLO",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "16/06/2026 13:19:28", base: "BCB", observador: "M. Protasio", equipe: "MA-BCB-P002M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "TROCA CALÇA MOTOSSERRISTA",
    resolvido: "Não", dataResolucao: "",
  },
  {
    data: "16/06/2026 16:21:58", base: "PDS", observador: "Josielington", equipe: "MA-LDP-C001M",
    categoria: "EPI, EPC e Ferramentas",
    inconformidade: "EQUIPE NÃO POSSUI TODOS OS CONES DE SINALIZAÇÃO E DELIMITAÇÃO CONFORME POP110, FALTA 1 CONE PARA A EQUIPE. FEITO FEEDBACK E SOLICITADO ADEQUAÇÃO.",
    resolvido: "Não", dataResolucao: "",
  },
];
void _staticRows;

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredData = computed(() => {
  const q = search.value.toLowerCase();
  return allData.value.filter(r => {
    if (q && !Object.values(r).join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
});

void loading;

const naoResolvidos = computed(() => filteredData.value.filter(r => r.resolvido === "Não").length);
const resolvidos    = computed(() => filteredData.value.filter(r => r.resolvido === "Sim").length);
const totalInc      = computed(() => filteredData.value.length);
const taxaResolucao = computed(() => totalInc.value === 0 ? 0 : Math.round((resolvidos.value / totalInc.value) * 100));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function catClass(cat: string): string {
  const m: Record<string, string> = {
    "Repúblicas":           "cat-rep",
    "Procedimentos":        "cat-proc",
    "EPI, EPC e Ferramentas": "cat-epi",
    "APR":                  "cat-apr",
    "Regras de Ouro":       "cat-regra",
    "Trabalho em Altura":   "cat-altura",
    "Veículos e Equipamentos": "cat-veic",
    "Padrinho de Segurança":             "cat-pad",
    "Estruturas e Instalações Prediais": "cat-struct",
  };
  return m[cat] ?? "";
}
</script>

<style scoped lang="scss">
$brand:        #8B1C2B;
$brand-text:   #fff;
$border:       #e2e8f0;
$label-color:  #94a3b8;
$inactive-bg:  #f1f5f9;
$inactive-text:#475569;
$header-bg:    #fce4e8;

.matriz-page { background: #f8fafc; min-height: 100vh; }

// ── Filter bar ────────────────────────────────────────────────────────────────
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

// ── KPI cards ─────────────────────────────────────────────────────────────────
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

.kpi-progress-card { border-radius: 12px; }
.kpi-prog-label {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #64748b; margin-bottom: 4px;
}
.kpi-prog-value { font-size: 36px; font-weight: 800; color: $brand; line-height: 1; }
.kpi-prog-sub { font-size: 11px; color: #94a3b8; margin-top: 6px; }

// ── Table card ────────────────────────────────────────────────────────────────
.matriz-card { border-radius: 12px; }
.matriz-card-title {
  font-size: 13px; font-weight: 700; color: $brand;
  text-transform: uppercase; letter-spacing: .6px; padding: 6px 8px 4px;
}
.search-input {
  :deep(.q-field__control) {
    height: 32px; min-height: 32px; border-radius: 8px;
    border-color: $border;
  }
  :deep(.q-field__native) { font-size: 12px; }
  :deep(.q-field__prepend) { height: 32px; }
}
.matriz-table-wrap {
  overflow: auto; max-height: 560px;
  border: 1px solid $border; border-radius: 8px;
}
.table-count { font-size: 11px; color: #94a3b8; padding: 2px 4px; }

// ── Matrix table ──────────────────────────────────────────────────────────────
.matriz-table {
  width: 100%; border-collapse: collapse; font-size: 12px;

  thead th {
    background: $header-bg; color: $brand;
    padding: 8px 10px; font-size: 11px; font-weight: 800;
    text-align: center; white-space: nowrap;
    position: sticky; top: 0; z-index: 1;
    border-bottom: 2px solid rgba($brand,.2);
    &:first-child, &.col-inc { text-align: left; }
  }

  tbody {
    tr {
      border-bottom: 1px solid $border;
      transition: background .15s;
      &:nth-child(even) { background: #f8fafc; }
      &:hover { background: rgba($brand,.04); }
    }
    .tr-clickable { cursor: pointer; }
    .tr-resolved {
      background: #f0fdf4 !important;
      &:hover { background: rgba(22,163,74,.08) !important; }
    }
  }

  td {
    padding: 7px 10px; vertical-align: top; text-align: center;
  }
  .col-data    { min-width: 150px; font-size: 11px; text-align: left; }
  .col-base    { min-width: 60px; }
  .col-obs     { min-width: 110px; font-weight: 600; color: #1e293b; text-align: left; }
  .col-equipe  { min-width: 120px; font-size: 11px; }
  .col-cat     { min-width: 130px; }
  .col-inc     { min-width: 300px; max-width: 420px; text-align: left; font-size: 11.5px; color: #334155; line-height: 1.5; white-space: pre-line; }
  .col-ev      { min-width: 70px; }
  .col-res     { min-width: 90px; }
  .col-dres    { min-width: 120px; font-size: 11px; }
  .td-mono     { font-variant-numeric: tabular-nums; color: #475569; }
  .td-empty    { text-align: center; padding: 32px; color: #94a3b8; font-style: italic; }
}

// ── Badges ────────────────────────────────────────────────────────────────────
.base-badge {
  display: inline-block;
  padding: 2px 8px; border-radius: 6px;
  background: rgba($brand,.1); color: $brand;
  font-size: 11px; font-weight: 700; letter-spacing: .5px;
}

.cat-badge {
  display: inline-block;
  padding: 2px 8px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.cat-rep    { background: #e0f2fe; color: #0369a1; }
.cat-proc   { background: #fef9c3; color: #854d0e; }
.cat-epi    { background: #fce7f3; color: #9d174d; }
.cat-apr    { background: #ede9fe; color: #6d28d9; }
.cat-regra  { background: #fef3c7; color: #92400e; }
.cat-altura { background: #fef2f2; color: #991b1b; }
.cat-veic   { background: #f0fdf4; color: #14532d; }
.cat-pad    { background: #fff7ed; color: #9a3412; }
.cat-struct { background: #f0f9ff; color: #0c4a6e; }

.res-badge {
  display: inline-block;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
}
.res-sim { background: #dcfce7; color: #15803d; }
.res-nao { background: #fee2e2; color: #991b1b; }

// ── Evidência badge ───────────────────────────────────────────────────────────
.ev-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
}
.ev-com-foto { background: rgba(37,99,235,.12); color: #2563eb; }
.ev-sem-foto { background: rgba(148,163,184,.12); color: #94a3b8; }

// ── Dialog ────────────────────────────────────────────────────────────────────
.obs-box {
  background: #f8fafc; border-left: 3px solid #dc2626;
  border-radius: 0 6px 6px 0; padding: 8px 12px;
  font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;
}
.foto-evidencia {
  width: 100%; max-height: 340px;
  object-fit: contain; border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.sem-foto {
  display: flex; align-items: center; justify-content: center;
  padding: 20px; border: 1px dashed #e2e8f0; border-radius: 8px;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .matriz-page { background: #0f172a; }
  .filter-bar { background: #1e293b; border-bottom-color: #334155; }
  .pill {
    background: #1e293b; border-color: #334155; color: #94a3b8;
    &:hover:not(.pill--active) { border-color: $brand; color: #fca5a5; background: rgba($brand,.1); }
    &--active { background: $brand; color: #fff; border-color: $brand; }
  }
  .filter-divider { background: #334155; }
  .fgroup__label { color: #64748b; }
  .matriz-card { background: #1e293b; }
  .kpi-progress-card { background: #1e293b; }
  .kpi-prog-label { color: #94a3b8; }
  .kpi-prog-sub { color: #64748b; }
  .matriz-table {
    thead th { background: #4a1525; color: #fca5a5; border-bottom-color: #7f1d2e; }
    tbody {
      tr { border-bottom-color: #334155; &:nth-child(even) { background: #162032; } }
      .tr-resolved { background: rgba(22,163,74,.08) !important; }
      td { color: #cbd5e1; }
      .col-obs { color: #f1f5f9; }
      .col-inc { color: #94a3b8; }
    }
    .matriz-table-wrap { border-color: #334155; }
  }
}
</style>
