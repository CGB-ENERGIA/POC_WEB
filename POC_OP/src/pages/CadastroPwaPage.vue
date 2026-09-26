<template>
  <q-page class="dbp-page">

    <!-- ══ HEADER ══════════════════════════════════════════════════════════════ -->
    <header class="dbp-header">
      <div class="dbp-header__left">
        <p class="dbp-eyebrow">Administração · PWA</p>
        <h1 class="dbp-title">Banco de Dados</h1>
        <div class="dbp-stats">
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ employees.length }}</span>
            <span class="dbp-stat__label">funcionários</span>
          </span>
          <span class="dbp-stat__div" />
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ equipes.length }}</span>
            <span class="dbp-stat__label">equipes</span>
          </span>
          <span class="dbp-stat__div" />
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ ALOJAMENTOS.length }}</span>
            <span class="dbp-stat__label">alojamentos</span>
          </span>
          <span class="dbp-stat__div" />
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ FUNCIONARIOS.length }}</span>
            <span class="dbp-stat__label">colaboradores</span>
          </span>
        </div>
      </div>
      <div class="dbp-header__right">
        <button class="dbp-hbtn dbp-hbtn--ghost" :class="{ 'is-loading': loading }" @click="fetchAll" title="Atualizar">
          <q-icon name="mdi-refresh" size="16px" :class="{ 'spin': loading }" />
        </button>
        <button class="dbp-hbtn dbp-hbtn--export" @click="exportExcel">
          <q-icon name="mdi-arrow-down-circle-outline" size="15px" />
          Exportar
        </button>
        <button class="dbp-hbtn dbp-hbtn--import" :class="{ 'is-loading': importing }" @click="triggerImport">
          <q-icon name="mdi-arrow-up-circle-outline" size="15px" />
          Importar
        </button>
        <input ref="importInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onImportFile" />
      </div>
    </header>

    <!-- ══ TABS ═════════════════════════════════════════════════════════════════ -->
    <div class="dbp-tabs-wrap">
      <div class="dbp-tabs">
        <button class="dbp-tab" :class="{ '--active': tab === 'funcionarios' }" @click="tab = 'funcionarios'">
          <q-icon name="mdi-account-group-outline" size="15px" />
          <span>Funcionários</span>
          <span class="dbp-tab__ct">{{ employees.length }}</span>
        </button>
        <button class="dbp-tab" :class="{ '--active': tab === 'equipes' }" @click="tab = 'equipes'">
          <q-icon name="mdi-bus-multiple" size="15px" />
          <span>Equipes</span>
          <span class="dbp-tab__ct">{{ equipes.length }}</span>
        </button>
        <button class="dbp-tab" :class="{ '--active': tab === 'alojamento' }" @click="tab = 'alojamento'">
          <q-icon name="mdi-home-city-outline" size="15px" />
          <span>Alojamento</span>
          <span class="dbp-tab__ct">{{ ALOJAMENTOS.length }}</span>
        </button>
        <button class="dbp-tab" :class="{ '--active': tab === 'geral' }" @click="tab = 'geral'">
          <q-icon name="mdi-account-hard-hat-outline" size="15px" />
          <span>Geral</span>
          <span class="dbp-tab__ct">{{ FUNCIONARIOS.length }}</span>
        </button>
      </div>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════════════════════════════ -->
    <div class="dbp-body">

      <!-- ── FUNCIONÁRIOS ─────────────────────────────────────────────────────── -->
      <template v-if="tab === 'funcionarios'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="17px" class="dbp-search-icon" />
            <input
              v-model="empSearch"
              class="dbp-search"
              placeholder="Buscar por nome ou matrícula…"
              autocomplete="off"
            />
            <button v-if="empSearch" class="dbp-search-x" @click="empSearch = ''">
              <q-icon name="mdi-close" size="13px" />
            </button>
          </div>

          <div class="dbp-pills">
            <button
              v-for="g in ['Todas', 'GOMAN', 'GSTC', 'GERE', 'SESMT']"
              :key="g"
              class="dbp-pill"
              :class="[{ '--active': empGerenciaFilter === g }, g !== 'Todas' ? `--${g.toLowerCase()}` : '']"
              @click="empGerenciaFilter = g"
            >{{ g }}</button>
          </div>

          <button class="dbp-add-btn" @click="openEmpDialog()">
            <q-icon name="mdi-plus" size="16px" />
            Adicionar
          </button>
        </div>

        <button class="dbp-collapse-row" @click="empListOpen = !empListOpen">
          <span class="dbp-count">
            <span v-if="empSearch || empGerenciaFilter !== 'Todas'">{{ filteredEmployees.length }} de </span>{{ employees.length }} registros
          </span>
          <q-icon
            name="mdi-chevron-down"
            size="18px"
            class="dbp-chevron"
            :class="{ '--open': empListOpen }"
          />
        </button>

        <q-slide-transition>
        <div v-show="empListOpen" class="dbp-records">
          <transition-group name="rec" appear>
            <div v-for="e in filteredEmployees" :key="e.matricula" class="dbp-record">
              <div class="dbp-record__av" :data-g="e.gerencia">{{ e.nome.charAt(0) }}</div>
              <div class="dbp-record__main">
                <span class="dbp-record__name">{{ e.nome_completo }}</span>
                <span class="dbp-record__sub">
                  <code class="dbp-mat">{{ e.matricula }}</code>
                  <span class="dbp-record__dot">·</span>
                  {{ e.funcao }}
                </span>
              </div>
              <div class="dbp-record__chips">
                <span class="dbp-chip" :data-g="e.gerencia">{{ e.gerencia }}</span>
                <span class="dbp-chip dbp-chip--base">{{ e.base }}</span>
                <span v-if="!e.ativo" class="dbp-chip dbp-chip--off">INATIVO</span>
              </div>
              <div class="dbp-record__acts">
                <button class="dbp-act" @click="openEmpDialog(e)" title="Editar">
                  <q-icon name="mdi-pencil-outline" size="14px" />
                </button>
                <button class="dbp-act dbp-act--del" @click="deleteEmployee(e)" title="Remover">
                  <q-icon name="mdi-delete-outline" size="14px" />
                </button>
              </div>
            </div>
          </transition-group>

          <div v-if="!filteredEmployees.length" class="dbp-empty">
            <q-icon name="mdi-account-search-outline" size="40px" />
            <p>Nenhum funcionário encontrado</p>
          </div>
        </div>
        </q-slide-transition>
      </template>

      <!-- ── EQUIPES ───────────────────────────────────────────────────────────── -->
      <template v-if="tab === 'equipes'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="17px" class="dbp-search-icon" />
            <input
              v-model="eqSearch"
              class="dbp-search"
              placeholder="Buscar por prefixo ou base…"
              autocomplete="off"
            />
            <button v-if="eqSearch" class="dbp-search-x" @click="eqSearch = ''">
              <q-icon name="mdi-close" size="13px" />
            </button>
          </div>

          <div class="dbp-pills">
            <button
              v-for="g in ['Todas', 'GOMAN', 'GSTC', 'GERE']"
              :key="g"
              class="dbp-pill"
              :class="[{ '--active': eqGerenciaFilter === g }, g !== 'Todas' ? `--${g.toLowerCase()}` : '']"
              @click="eqGerenciaFilter = g"
            >{{ g }}</button>
          </div>

          <button class="dbp-add-btn" @click="openEqDialog()">
            <q-icon name="mdi-plus" size="16px" />
            Adicionar
          </button>
        </div>

        <button class="dbp-collapse-row" @click="eqListOpen = !eqListOpen">
          <span class="dbp-count">
            <span v-if="eqSearch || eqGerenciaFilter !== 'Todas'">{{ filteredEquipes.length }} de </span>{{ equipes.length }} equipes
          </span>
          <q-icon
            name="mdi-chevron-down"
            size="18px"
            class="dbp-chevron"
            :class="{ '--open': eqListOpen }"
          />
        </button>

        <q-slide-transition>
        <div v-show="eqListOpen" class="dbp-records">
          <transition-group name="rec" appear>
            <div v-for="eq in filteredEquipes" :key="eq.id" class="dbp-record">
              <div class="dbp-record__av dbp-record__av--bus" :data-g="eq.gerencia">
                <q-icon name="mdi-bus" size="16px" />
              </div>
              <div class="dbp-record__main">
                <span class="dbp-record__name">{{ eq.prefixo }}</span>
                <span class="dbp-record__sub">Base {{ eq.base }}</span>
              </div>
              <div class="dbp-record__chips">
                <span class="dbp-chip" :data-g="eq.gerencia">{{ eq.gerencia }}</span>
              </div>
              <div class="dbp-record__acts">
                <button class="dbp-act" @click="openEqDialog(eq)" title="Editar">
                  <q-icon name="mdi-pencil-outline" size="14px" />
                </button>
                <button class="dbp-act dbp-act--del" @click="deleteEquipe(eq)" title="Remover">
                  <q-icon name="mdi-delete-outline" size="14px" />
                </button>
              </div>
            </div>
          </transition-group>

          <div v-if="!filteredEquipes.length" class="dbp-empty">
            <q-icon name="mdi-bus-alert" size="40px" />
            <p>Nenhuma equipe encontrada</p>
          </div>
        </div>
        </q-slide-transition>
      </template>
      <!-- ── ALOJAMENTO ──────────────────────────────────────────────────────────── -->
      <template v-if="tab === 'alojamento'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="17px" class="dbp-search-icon" />
            <input
              v-model="alojSearch"
              class="dbp-search"
              placeholder="Buscar por imóvel, locador ou localidade…"
              autocomplete="off"
            />
            <button v-if="alojSearch" class="dbp-search-x" @click="alojSearch = ''">
              <q-icon name="mdi-close" size="13px" />
            </button>
          </div>

          <div class="dbp-pills">
            <button
              v-for="b in ['Todas', 'BACABAL', 'BARRA DO CORDA', 'ITAPECURU', 'PEDREIRAS', 'PRESIDENTE DUTRA', 'SANTA INES']"
              :key="b"
              class="dbp-pill"
              :class="{ '--active': alojBaseFilter === b }"
              @click="alojBaseFilter = b"
            >{{ b === 'Todas' ? 'Todas' : b }}</button>
          </div>
        </div>

        <button class="dbp-collapse-row" @click="alojListOpen = !alojListOpen">
          <span class="dbp-count">
            <span v-if="alojSearch || alojBaseFilter !== 'Todas'">{{ filteredAlojamentos.length }} de </span>{{ ALOJAMENTOS.length }} alojamentos
          </span>
          <q-icon
            name="mdi-chevron-down"
            size="18px"
            class="dbp-chevron"
            :class="{ '--open': alojListOpen }"
          />
        </button>

        <q-slide-transition>
        <div v-show="alojListOpen" class="dbp-records">
          <transition-group name="rec" appear>
            <div v-for="(a, i) in filteredAlojamentos" :key="i" class="dbp-record">
              <div class="dbp-record__av dbp-record__av--home">
                <q-icon name="mdi-home-outline" size="16px" />
              </div>
              <div class="dbp-record__main">
                <span class="dbp-record__name">{{ a.imovel }}</span>
                <span class="dbp-record__sub">{{ a.locador }}</span>
                <span v-if="a.endereco" class="dbp-record__addr">{{ a.endereco }}</span>
              </div>
              <div class="dbp-record__chips">
                <span class="dbp-chip dbp-chip--base">{{ a.base }}</span>
                <span v-if="a.prefixo" class="dbp-chip dbp-chip--prefixo">{{ a.prefixo }}</span>
                <span class="dbp-chip dbp-chip--loc">{{ a.localidade }}</span>
                <span class="dbp-chip dbp-chip--ct">{{ a.contrato }}</span>
              </div>
            </div>
          </transition-group>

          <div v-if="!filteredAlojamentos.length" class="dbp-empty">
            <q-icon name="mdi-home-search-outline" size="40px" />
            <p>Nenhum alojamento encontrado</p>
          </div>
        </div>
        </q-slide-transition>
      </template>

      <!-- ── GERAL ──────────────────────────────────────────────────────────────── -->
      <template v-if="tab === 'geral'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="16px" class="dbp-search-shell__ico" />
            <input v-model="geralSearch" class="dbp-search" placeholder="Buscar por nome ou chapa..." />
          </div>
        </div>
        <div class="dbp-filter-bar">
          <button
            v-for="b in ['Todas', 'BCB', 'BDC', 'ITM', 'PDS', 'PDT', 'STI', 'ADM']" :key="b"
            class="dbp-filter-btn" :class="{ '--active': geralBaseFilter === b }"
            @click="geralBaseFilter = b"
          >{{ b }}</button>
        </div>

        <q-slide-transition>
        <div>
          <button class="dbp-collapse-row" @click="geralListOpen = !geralListOpen">
            <span class="dbp-count">
              <span v-if="geralSearch || geralBaseFilter !== 'Todas'">{{ filteredFuncionarios.length }} de </span>{{ FUNCIONARIOS.length }} colaboradores
            </span>
            <q-icon
              :name="geralListOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="18px" color="grey-6"
            />
          </button>

          <div v-show="geralListOpen" class="dbp-records">
            <transition-group name="rec" appear>
              <div v-for="(f, i) in filteredFuncionarios" :key="i" class="dbp-record">
                <div class="dbp-record__av dbp-record__av--geral">
                  <q-icon name="mdi-account-hard-hat-outline" size="16px" />
                </div>
                <div class="dbp-record__info">
                  <span class="dbp-record__name">{{ f.nome }}</span>
                  <span class="dbp-record__sub">{{ f.chapa }} · {{ f.funcao }}</span>
                </div>
                <div class="dbp-record__chips">
                  <span class="dbp-chip dbp-chip--base">{{ f.base }}</span>
                  <span class="dbp-chip dbp-chip--rateio">{{ f.rateio }}</span>
                </div>
              </div>
            </transition-group>

            <div v-if="!filteredFuncionarios.length" class="dbp-empty">
              <q-icon name="mdi-account-search-outline" size="40px" />
              <p>Nenhum colaborador encontrado</p>
            </div>
          </div>
        </div>
        </q-slide-transition>
      </template>
    </div>

    <!-- ══ DIALOG FUNCIONÁRIO ══════════════════════════════════════════════════ -->
    <q-dialog v-model="empDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card class="dbp-dlg">
        <div class="dbp-dlg__bar" :data-g="empForm.gerencia || 'GOMAN'" />
        <div class="dbp-dlg__head">
          <div>
            <p class="dbp-dlg__title">{{ empIsEditing ? 'Editar Funcionário' : 'Novo Funcionário' }}</p>
            <p class="dbp-dlg__sub">{{ empIsEditing ? `Mat. ${empForm.matricula}` : 'Preencha os dados do colaborador' }}</p>
          </div>
          <button class="dbp-dlg__x" v-close-popup><q-icon name="mdi-close" size="18px" /></button>
        </div>
        <div class="dbp-dlg__body">
          <q-input v-model="empForm.matricula" label="Matrícula *" dense outlined :disable="empIsEditing" />
          <q-input v-model="empForm.nome" label="Nome curto *" dense outlined />
          <q-input v-model="empForm.nome_completo" label="Nome completo *" dense outlined />
          <div class="row q-gutter-sm">
            <q-select v-model="empForm.gerencia" :options="['GOMAN','GSTC','GERE','SESMT']" label="Gerência *" dense outlined class="col" />
            <q-input v-model="empForm.base" label="Base *" dense outlined class="col" />
          </div>
          <div class="row q-gutter-sm items-center">
            <q-input v-model="empForm.funcao" label="Função *" dense outlined class="col" />
            <q-toggle v-model="empForm.ativo" label="Ativo" color="positive" />
          </div>
          <p v-if="empError" class="text-negative text-caption q-mb-none">{{ empError }}</p>
        </div>
        <div class="dbp-dlg__foot">
          <button class="dbp-dlg__cancel" v-close-popup>Cancelar</button>
          <button class="dbp-dlg__save" :disabled="saving" @click="saveEmployee">
            <q-spinner v-if="saving" size="13px" color="white" />
            {{ saving ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </q-card>
    </q-dialog>

    <!-- ══ DIALOG EQUIPE ════════════════════════════════════════════════════════ -->
    <q-dialog v-model="eqDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card class="dbp-dlg">
        <div class="dbp-dlg__bar" :data-g="eqForm.gerencia || 'GOMAN'" />
        <div class="dbp-dlg__head">
          <div>
            <p class="dbp-dlg__title">{{ eqForm.id ? 'Editar Equipe' : 'Nova Equipe' }}</p>
            <p class="dbp-dlg__sub">{{ eqForm.id ? eqForm.prefixo : 'Preencha os dados da equipe' }}</p>
          </div>
          <button class="dbp-dlg__x" v-close-popup><q-icon name="mdi-close" size="18px" /></button>
        </div>
        <div class="dbp-dlg__body">
          <q-input v-model="eqForm.base" label="Base *" dense outlined />
          <q-input v-model="eqForm.prefixo" label="Prefixo *" dense outlined />
          <q-select v-model="eqForm.gerencia" :options="['GOMAN','GSTC','GERE']" label="Gerência *" dense outlined />
          <p v-if="eqError" class="text-negative text-caption q-mb-none">{{ eqError }}</p>
        </div>
        <div class="dbp-dlg__foot">
          <button class="dbp-dlg__cancel" v-close-popup>Cancelar</button>
          <button class="dbp-dlg__save" :disabled="saving" @click="saveEquipe">
            <q-spinner v-if="saving" size="13px" color="white" />
            {{ saving ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { FUNCIONARIOS } from "@/data/funcionarios";

const $q      = useQuasar();
const loading     = ref(false);
const saving      = ref(false);
const tab         = ref("funcionarios");
const empListOpen = ref(true);
const eqListOpen  = ref(true);

// ─── Alojamento (dados estáticos) ─────────────────────────────────────────────

interface Alojamento {
  locador: string;
  endereco: string;
  contrato: string;
  base: string;
  prefixo: string;
  localidade: string;
  imovel: string;
}

const ALOJAMENTOS: Alojamento[] = [
  { locador: "ARIOSVALDO SANTOS MOUZINHO", endereco: "RUA GONÇALVES DIAS, 165 -N 2B CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ01", localidade: "ALTAMIRA", imovel: "REP. GSTC" },
  { locador: "FRANCIMARIA SANTOS DOS REIS DA COSTA", endereco: "RUA JOAQUIM TEIXEIRA, 1339 - TRIZIDELA", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ03", localidade: "COROATA", imovel: "REP. GSTC" },
  { locador: "WEDESON MESQUITA DE OLIVEIRA", endereco: "RUA PRINCIPAL, S/N- SÃO SEBASTIAO- CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ04", localidade: "SÃO LUIS GONZAGA", imovel: "REP. GSTC" },
  { locador: "ROGERIO ERICEIRA CARDOSO", endereco: "RUA SÃO FRANCISCO S/N- CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ05", localidade: "LAGO VERDE", imovel: "REP. GSTC" },
  { locador: "JOSE VERAS FELIX NETO", endereco: "AV RODOVIARIA, 180 A A- CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ06", localidade: "PERITORO", imovel: "REP. GSTC" },
  { locador: "RC PATRIMONIAL E EMPREENDIMENTOS LTDA", endereco: "RUA BELA VISTA, S/N- KT 11- VILA COELHO DIAS", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. JOAO ALEF" },
  { locador: "MILENE COSTA CHAVES", endereco: "RD BR 135, 45 A, SÃO MATEUS - MA", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ07", localidade: "SÃO MATEUS", imovel: "REP. GSTC" },
  { locador: "GERSON FERREIRA DA COSTA", endereco: "RUA PRES C BRANCO, 01 CENTRO- LOT ISADORA TORRES", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ08", localidade: "VITORINO FREIRE", imovel: "REP. GSTC" },
  { locador: "JOSE DE RIBAMAR CHAVES", endereco: "RUA - AV 1- C- 07B- RESIDENCIAL JOSE CHAVES- B- AREIA", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ10", localidade: "BACABAL", imovel: "REP. LINHA VIVA (CASA ROSA)" },
  { locador: "ADRIANA BEZERRA DE ARUAJO", endereco: "RUA FILOMENO PARGA, 202 COND. EVORA- BLOCO 2- BAIRRO - ESPERANÇA", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ11", localidade: "BACABAL", imovel: "APTO RUAM VALMIR" },
  { locador: "JOSE DE RIBAMAR CHAVES", endereco: "RUA - AV 1- C- 07B- RESIDENCIAL JOSE CHAVES- B- AREIA", contrato: "CT 127", base: "BACABAL", prefixo: "ALOJ64", localidade: "BACABAL", imovel: "REP. RUA 0 (CASA BRANCA GRANDE)" },
  { locador: "JOSE DE RIBAMAR CHAVES", endereco: "TV AV 01, Nº 3- RESIDENCIAL JOSE CHAVES- AREIA", contrato: "CT 169", base: "BACABAL", prefixo: "ALOJ75", localidade: "BACABAL", imovel: "REP. RUA 0 (CASA AZUL)" },
  { locador: "JOSE MARIA FERREIRA JUNIOR", endereco: "RUA AV 01, 04- AREIA", contrato: "CT 169", base: "BACABAL", prefixo: "ALOJ76", localidade: "BACABAL", imovel: "REP. GERAL CT 169" },
  { locador: "ROBERIO DE OLIVEIRA BRIGIDO", endereco: "RUA VP 28, 35, QD 46- COHAB III", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. WERBERTH" },
  { locador: "RN MENDES CARNEIRO COMERCIO-ME", endereco: "RUA TEIXEIRA DE FREITAS, 1905- CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. ANTONIO/EVERALDO" },
  { locador: "EDMAR GOMES LESSA FILHO", endereco: "AV JOAO ALBERTO, 262- RESID. JARDINS GOLD- AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. JULIO/VALDIR" },
  { locador: "PEREIRA ADMINISTRACOES LTDA", endereco: "RUA GOMES VIDAL, 07- APTO 401- CONDOMINIO RIO SOL- BAIRRO ESPERANCA", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. JACKSON- ALMOX" },
  { locador: "RN MENDES CARNEIRO COMERCIO-ME", endereco: "RUA TEIXEIRA DE FREITAS, 2001, APT 75- RAMAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. CIPO" },
  { locador: "EXATA MOVEIS (FABIOLA SUSANA)", endereco: "", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "SÃO LUIS", imovel: "TAXA DE COND. ESCRIT. SÃO LUIS" },
  { locador: "EXATA MOVEIS (FABIOLA SUSANA)", endereco: "", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "SÃO LUIS", imovel: "ESCRITORIO MATRIZ SÃO LUIS" },
  { locador: "RAYMARA GASPAR PEREIRA OTAVIANO", endereco: "RUA AV GOVERNADOR JOAO ALBERTO, 201, AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. MIKEIAS" },
  { locador: "CERAMICA PAIZAO LTDA", endereco: "RD BR 316, S/N, OLHO D'AGUA", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "TERRENO DOS POSTES" },
  { locador: "AMP CARNEIRO SILVA LTDA", endereco: "AV GOVERNADOR JOAO ALBERTO, S/N, COND. AV PARK RESIDENCE BLC V, APTO 201- AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "APTO. ANTONIO ALBERTO" },
  { locador: "ALESSON HALLYAN REGO FERREIRA", endereco: "AV GOVERNADOR JOAO ALBERTO, 301, BL 05- APTO 301 AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "APTO IGOR DIONISIO" },
  { locador: "JOSE DIOGO OLIVEIRA DE AGUIAR", endereco: "RUA JOSE MARTA MILHOMEM, 1, QD 3A- RESID. GREEN PARK- BAIRRO- AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. RICARDO MALTA" },
  { locador: "JOSEFAELEN RABELO FERNANDES DE ARAUJO", endereco: "AV GOV. JOAO ALBERTO, 202- BLOCO- 03- AP 202- BAIRRO AREAL", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "APTO. CAMILA CORREA" },
  { locador: "AMP CARNEIRO SILVA LTDA", endereco: "RUA NÃO CADASTRADA, 37, RUA JOAO FRANCISCO DE SOUSA FILHO- CENTRO", contrato: "CT 127", base: "BACABAL", prefixo: "", localidade: "BACABAL", imovel: "RESID. VALVICK" },
  { locador: "JARDSON FABIAN SOUZA RODRIGUES", endereco: "RUA JOSE MARIA MADEIRA, S/N- BAIRRO- CANADA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "RESID. MARCOS ANDRADE" },
  { locador: "MARIA JUCILENE BATISTA CARNEIRO DA SILVA", endereco: "RUA RIO ARAGUAIA, 197- BAIRRO- TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ13", localidade: "BARRA DO CORDA", imovel: "REP. SPOT (ARAGUAIA)" },
  { locador: "MARLICE OLIVEIRA MIRANDA", endereco: "RUA ADELIA FALCAO, 257- BAIRRO ALTAMIRA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ77", localidade: "BARRA DO CORDA", imovel: "REP. GERAL" },
  { locador: "ANTONIO ALMEIDA DOS REIS", endereco: "RUA LULU RODRIGUES, 1354- BAIRRO- ALTAMIRA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ78", localidade: "BARRA DO CORDA", imovel: "REP. GERAL II" },
  { locador: "JOAO CARLOS ALMEIDA SANTIAGO", endereco: "RUA 04, Nº 10- CENTRO-FERNANDO FALCAO", contrato: "CT 169", base: "BARRA DO CORDA", prefixo: "ALOJ15", localidade: "FERNANDO FALCAO", imovel: "REP. GSTC" },
  { locador: "DOMINGAS FERREIRA LIMA", endereco: "RUA RIO NEGRO, 77- BAIRRO TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ27", localidade: "BARRA DO CORDA", imovel: "REP. SPOT (RIO NEGRO)" },
  { locador: "ANGRA PEREIRA LIMA DA SILVA", endereco: "AV. 1, S/N- RESID. MARANATA- COHAB", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ58", localidade: "BARRA DO CORDA", imovel: "REP. GOMAN (CASA DE BAIXO)" },
  { locador: "ANGRA PEREIRA LIMA DA SILVA", endereco: "AV. 1, S/N- RESID. MARANATA- COHAB", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ62", localidade: "BARRA DO CORDA", imovel: "REP. GOMAN (CASA DE CIMA)" },
  { locador: "LAZARO DOS PASSOS DE FREITAS", endereco: "RUA TIRADENTES, S/N- CENTRO", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ66", localidade: "BARRA DO CORDA", imovel: "REP. SPOT (BEIRA RIO 2)" },
  { locador: "LAZARO DOS PASSOS DE FREITAS", endereco: "RUA TIRADENTES, S/N- CENTRO", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ67", localidade: "BARRA DO CORDA", imovel: "REP. SPOT (BEIRA RIO 1)" },
  { locador: "WCMW CORPORATION LTDA", endereco: "AV FERNANDO FALCAO, S/N- BAIRRO- CANADA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "ALOJ69", localidade: "BARRA DO CORDA", imovel: "REP. SPOT (INCRA)" },
  { locador: "WCMW CORPORATION LTDA", endereco: "AV ROSEANA SARNEY, S/N - BAIRRO TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "RESID. TEC. DE PLANEJAMENTO" },
  { locador: "ANTONIA TORRES MACIEL", endereco: "RUA TEFE, 755, B- TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "REP. IDIALDO" },
  { locador: "MOACIR ANTONIO DA SILVA GUIMARAES", endereco: "RD BR 226, S/N MORADA DO RIO CORDA QD 12 LT 31- NOVA TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "RESID. JOSIEL- LV" },
  { locador: "A. S. FRANCA MADEIRAS LTDA", endereco: "RUA ESTRADA SUJAPE E ESCONDIDO, S/N- BAIRRO- ALTAMIRA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "TERRENO- POSTES- ALMOX" },
  { locador: "WCMV CORPORATION LTDA", endereco: "RUA RIO TROMBETAS, S/N- TRIZIDELA", contrato: "CT 170", base: "BARRA DO CORDA", prefixo: "", localidade: "BARRA DO CORDA", imovel: "ESC. BARRA DO CORDA" },
  { locador: "MARIA BARBARA BOTELHO MARQUES", endereco: "TV URCA, S/N- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ40", localidade: "CANTANHEDE", imovel: "REP. GSTC" },
  { locador: "PAULO ALBERTO GOMES AZEVEDO", endereco: "RUA REGINO RODRIGUES DE PAULA, 10- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ41", localidade: "ANAJATUBA", imovel: "REP. GSTC" },
  { locador: "MARIA IVONETE COELHO MELO LISBOA", endereco: "RUA BENJAMIM PEREIRA, 475- BAIRRO- MIQUILINA", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ42", localidade: "ITAPECURU", imovel: "REP. GERAL" },
  { locador: "BENEDITO CARLOS BEZERRA CARDOSO", endereco: "RUA VELHA, S/N- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ43", localidade: "MIRANDA", imovel: "REP. GSTC" },
  { locador: "JOSE CARLOS IRINEU DE MESQUITA JUNIOR", endereco: "RUA GETULIO VARGAS, 418- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ45", localidade: "ITAPECURU", imovel: "REP. ROÇO" },
  { locador: "JOANA DE DEUS RODRIGUES AZEVEDO", endereco: "RUA URBANO SANTOS, 369- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ46", localidade: "ITAPECURU", imovel: "REP. LINHA VIVA" },
  { locador: "JACIELENE DE JESUS LICA OLIVEIRA", endereco: "RD BR 222, S/N- BAIRRO- COREIA", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ47", localidade: "ARARI", imovel: "REP. GSTC" },
  { locador: "JACKELINE DE JESUS JERONIMO FERREIRA", endereco: "RUA SEBASTIAO DE ABREU, S/N- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "ALOJ48", localidade: "VARGEM GRANDE", imovel: "REP. GSTC" },
  { locador: "ALINE MENDES MARTINS", endereco: "RUA JOSE GONCALVES, 56- CENTRO", contrato: "CT 127", base: "ITAPECURU", prefixo: "", localidade: "ITAPECURU", imovel: "RESID. CHRISTOPHE DANIEL" },
  { locador: "MARIA EDINE ARAUJO DE ABREU", endereco: "RUA COSTA E SILVA, S/N- CENTRO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ49", localidade: "ESPERANTINOPOLS", imovel: "REP. PLANTAO" },
  { locador: "LEILA ALVES SILVA", endereco: "RUA PRINCIPAL, RESIDENCIAL CARMELIA CESAR, 12- B- MULTIRAO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ50", localidade: "IGARAPE GRANDE", imovel: "REP. GSTC" },
  { locador: "WILCILA DE ARAUJO LEITE", endereco: "TV MANECO REGO, 531- CENTRO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ51", localidade: "PEDREIRAS", imovel: "REP. LINHA VIVA" },
  { locador: "RAIMUNDO SERAFIM REGO NETO", endereco: "RUA 3, 15 A, QD 3, PQ PALMEIRAS - PEDREIRAS", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ52", localidade: "PEDREIRAS", imovel: "REP. CONSTRUÇÃO" },
  { locador: "MARIA REGINA CARIOCA SOUSA", endereco: "RUA 05, S/N- BAIRRO CACAU", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ53", localidade: "LAGO DA PEDRA", imovel: "REP. PLANTAO" },
  { locador: "FRANCISCO SERGIO BEZERRA ALVES", endereco: "RUA LARANJEIRA, 1278- CENTRO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ54", localidade: "PEDREIRAS", imovel: "REP. GSTC" },
  { locador: "RAIMUNDO SERAFIM REGO NETO", endereco: "RUA 03, QDA 03- CASA 15- PQ DAS PALMEIRAS", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ56", localidade: "PEDREIRAS", imovel: "REP. PODA" },
  { locador: "ANTONIO SOARES DA SILVA", endereco: "RUA 13 DE MAIO, 16- CENTRO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "ALOJ57", localidade: "LAGOA GRANDE", imovel: "REP. CGB" },
  { locador: "NILZA MARIA MAIA FERNANDES", endereco: "RUA CORRENTE, 1248- BAIRRO DIOGO", contrato: "CT 169", base: "PEDREIRAS", prefixo: "", localidade: "PEDREIRAS", imovel: "TERRENO DOS POSTES" },
  { locador: "H TORRES CARVALHO", endereco: "AV OTON GONCALVES SA, Nº 100- CAMPOS DANTAS", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ14", localidade: "PRESID. DUTRA", imovel: "REP. GERAL (POUSADA II)" },
  { locador: "LUIS GONZAGA VIEIRA DE SOUSA", endereco: "RUA MACARIO OLIVEIRA, S/N, CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ16", localidade: "GOV. EUGENIO BARROS", imovel: "REP. PLANTAO" },
  { locador: "PEDRO VIEIRA SANTOS", endereco: "AV ROSEANA SARNEY, S/N CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ17", localidade: "JOSELANDIA", imovel: "REP. AREA COMERCIAL" },
  { locador: "ERLY ALVES FARIAS BARROS", endereco: "RUA MANGUEIRA, S/N- PAULO FALCAO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ19", localidade: "PRESID. DUTRA", imovel: "REP. INSPEÇÃO" },
  { locador: "VITORINO VITORIO GUIMARAES NETO", endereco: "RUA RAINHA DA PAZ, S/N- BAIRRO BOM SUCESSO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ20", localidade: "PRESID. DUTRA", imovel: "REP. LINHA VIVA" },
  { locador: "EDNEUZA ROCHA DA SILVA CAVALCANTE", endereco: "RUA HUMBERTO DE CAMPOS, 338, CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ21", localidade: "DOM PEDRO", imovel: "REP. GSTC" },
  { locador: "EVA SILVA DE ARAUJO", endereco: "RUA HUMBERTO DE CAMPOS, S/N - BAIRRO PENIEL", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ22", localidade: "SÃO DOMINGOS", imovel: "REP. GSTC" },
  { locador: "DILMA REIS SEVERINO DA SILVA", endereco: "AV OTON GOCALVES DE SÁ, 205- RESID. PORTINARI 2- BAIRRO- CAMPOS DANTAS", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ23", localidade: "PRESID. DUTRA", imovel: "REP. CONSTRUÇÃO" },
  { locador: "CARLOS ALBERTO CRUZ", endereco: "TV DOCA SERENO, S/N- CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ28", localidade: "PRESID. DUTRA", imovel: "REP. SPOT" },
  { locador: "JAILSON ALVES DA SILVA", endereco: "RUA PRESIDENTE MEDICE, 19- BAIRRO- CAMPOS DANTAS", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "ALOJ70", localidade: "PRESID. DUTRA", imovel: "REP. GERAL (POUSADA I)" },
  { locador: "LIDAYANA FIGUEIREDO SOARES CALADO", endereco: "RUA 11 S/N CT 11 QD 12 LOT 19, CS- 03 COLINA PARCK I", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. GABRIELA MELO" },
  { locador: "ERLY ALVES FARIAS BARROS", endereco: "RUA MANGUEIRA, 10 TV- 1 - B- PAULO FALCAO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. (GLEICY MARA E JACKELINE)" },
  { locador: "ENZO ALOJAMENTOS E SERVIÇOS LTDA", endereco: "TRAVESSA HONORATO GOMES- COND. ENZO- CASA- 11 CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. (ANDERSON E WALYSON)" },
  { locador: "CELIO ROBERTO MONTEIRO FERREIRA", endereco: "RUA 28 JUNHO SUL, BAIRRO- VILA MILITAR , S/N", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. (RAISSA)" },
  { locador: "ALYNE LAIS ARAUJO SANTANA", endereco: "RUA ADALTO CRUZ, S/N- CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. CESAR AUGUSTO" },
  { locador: "L GONZAGA BARBOSA LTDA", endereco: "RD BR 135, 2000- CAMPOS DANTAS", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "ESCRITORIO" },
  { locador: "LIDAYANA FIGUEIREDO SOARES CALADO", endereco: "RUA CT 07, S/N- QD 12 LT 04, BAIRRO COLINA PARCK", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. PAULO SILVA" },
  { locador: "ANA MARIA CRUZ DE SOUSA", endereco: "AVENIDA JOSE OLAVO SAMPAIO, 800- APTO 01- CENTRO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. ROSIMAR DERICK" },
  { locador: "GILVAN FERNANDES REGO", endereco: "RUA ADALBERTO MACEDO, S/N- BAIRRO - PAULO FALCAO", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. SR BATATA" },
  { locador: "WYLANE LOPES DOS SANTOS", endereco: "RUA CAJUEIRO, S/N- BAIRRO COHAB", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. RAFAELA" },
  { locador: "ENZO ALOJAMENTOS E SERVIÇOS LTDA", endereco: "TV HONORATO GOMES, 04 COND. ENZO-", contrato: "CT 169", base: "PRESIDENTE DUTRA", prefixo: "", localidade: "PRESID. DUTRA", imovel: "RESID. CESAR" },
  { locador: "JAKSON ALVES OLIVEIRA", endereco: "QD 10, 09- BAIRRO- MUTIRAO", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ30", localidade: "SANTA LUZIA DO TIDE", imovel: "REP. GSTC" },
  { locador: "JOAO BATISTA DE SÁ LOPES GONCALVES", endereco: "RUA DA JAQUEIRA, 15 - CIDADE NOVA", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ31", localidade: "MONÇÃO", imovel: "REP. GSTC" },
  { locador: "JOSE ALVES DOS SANTOS", endereco: "RUA VITORINO FREIRE, 390- CENTRO", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ32", localidade: "PIO XII", imovel: "REP. GSTC" },
  { locador: "GRACILENE LIMA DE OLVEIIRA", endereco: "TRAV SÃO JOSE, 30- MILITAR", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ33", localidade: "SANTA INES", imovel: "REP. GERAL" },
  { locador: "JACQUELINE JANSEN TATENO", endereco: "RUA BARAO DO RIO BRANCO, 111 B - VILA MILITAR", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ35", localidade: "SANTA INES", imovel: "REP. LINHA VIVA" },
  { locador: "RAIMUNDO DO NASCIMENTO SANTOS", endereco: "RUA DA ASSOCIAÇÃO, S/N- VILA ATEMIR", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ36", localidade: "ALTO AL. PINDARE", imovel: "REP. GSTC" },
  { locador: "NATALIA NILDE CARVALHO DO PATROCINIO", endereco: "RUA SÃO LUIS, 265- VL AMORIM", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ37", localidade: "ZE DOCA", imovel: "REP. GSTC I" },
  { locador: "EDILENE MAIA PEREIRA", endereco: "RUA PRESIDENTE MEDICE, 304- VILA MILITAR", contrato: "CT 170", base: "SANTA INES", prefixo: "ALOJ38", localidade: "SANTA INES", imovel: "REP. SPOT I" },
  { locador: "ADRIANA ESTHER NERES OLIVEIRA DE SOUZA", endereco: "AVENIDA MARECHAL CASTELO BRANCO, 4914 B- SÃO CRISTOVAO", contrato: "CT 170", base: "SANTA INES", prefixo: "ALOJ79", localidade: "SANTA INES", imovel: "REP. SPOT III" },
  { locador: "RAIMUNDO RALDERI DE FREITAS", endereco: "R. JOSE PATROCINIO, N° 151, JD TROPICA", contrato: "CT 170", base: "SANTA INES", prefixo: "ALOJ39", localidade: "SANTA INES", imovel: "REP. SPOT II" },
  { locador: "JOAO PAULO GOMES OLIVEIRA", endereco: "RUA LARANJEIRA, 387- BAIRRO LARANJEIRAS", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ61", localidade: "SANTA INES", imovel: "REP. CONSTRUCAO" },
  { locador: "MARCIA CRISTINA DE MORAIS BRITO", endereco: "RUA BENEDITO LEITE, S/N- VILA MUNIZ", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ63", localidade: "BOM JARDIM", imovel: "REP. GSTC" },
  { locador: "ANTONIO CLEILSON DA CRUZ DOS SANTOS", endereco: "TV BOM JARDIM, 177- SÃO CRISTOVAO", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ73", localidade: "SANTA INES", imovel: "REP. CONSTRUCAO (RESERVA)" },
  { locador: "FABRICIO SOUSA NUNES", endereco: "RUA HEITOR PESSOA DE SOUSA, 11- CENTRO", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ74", localidade: "ZE DOCA", imovel: "REP. GSTC II" },
  { locador: "ANTONIETA DE LIMA LEAL", endereco: "RUA FREI DAMIAO, 283- VL MILITAR", contrato: "CT 127", base: "SANTA INES", prefixo: "", localidade: "SANTA INES", imovel: "RESID. EDIVAN CARVALHO" },
  { locador: "ICONE- INCORPORADORA E CONSTRUTORA NORDESTE LTDA", endereco: "RUA SÃO BENEDITO, 18 CENTRO", contrato: "CT 127", base: "SANTA INES", prefixo: "", localidade: "SANTA INES", imovel: "RESID. JAMERSON MIRANDA" },
  { locador: "TOMAZ MARTINS REIS NETO", endereco: "RUA 2, N- 98 - CIA VALE DO RIO DOCA", contrato: "CT 127", base: "SANTA INES", prefixo: "", localidade: "SANTA INES", imovel: "RESID. CARLAO" },
  { locador: "MILTON LOPES DA MOTA", endereco: "RUA DO POSTO, S/N- BAIRRO- SOMRIZAL", contrato: "CT 127", base: "SANTA INES", prefixo: "ALOJ72", localidade: "SÃO JOAO DO CARU", imovel: "REP. GSTC" },
  { locador: "NIBER JUCA MARQUES JUNIOR", endereco: "RD BR 316, 2580- LOT SANTA CECILIA LT 26 QD 01 - SÃO CRISTOVAO", contrato: "CT 127", base: "SANTA INES", prefixo: "", localidade: "SANTA INES", imovel: "APTO. ANTONIO SESMT" },
  { locador: "R DE O ROSA TRANSPORTES LTDA", endereco: "ROD BR 222, Nº 2560- BAIRRO SANTA FILOMENA", contrato: "CT 127", base: "SANTA INES", prefixo: "", localidade: "SANTA INES", imovel: "ESCRITORIO" },
];

const alojSearch     = ref("");
const alojBaseFilter = ref("Todas");
const alojListOpen   = ref(true);

// ─── Geral (colaboradores do XLS) ─────────────────────────────────────────────

const geralSearch     = ref("");
const geralBaseFilter = ref("Todas");
const geralListOpen   = ref(true);

const filteredFuncionarios = computed(() => {
  const q = geralSearch.value.toLowerCase();
  const b = geralBaseFilter.value;
  return FUNCIONARIOS.filter((f) => {
    const matchSearch = !q
      || f.nome.toLowerCase().includes(q)
      || f.chapa.includes(q)
      || f.rateio.toLowerCase().includes(q);
    const matchBase = b === "Todas" || f.base === b;
    return matchSearch && matchBase;
  });
});

const filteredAlojamentos = computed(() => {
  const q  = alojSearch.value.toLowerCase();
  const b  = alojBaseFilter.value;
  return ALOJAMENTOS.filter((a) => {
    const matchSearch = !q
      || a.imovel.toLowerCase().includes(q)
      || a.locador.toLowerCase().includes(q)
      || a.localidade.toLowerCase().includes(q)
      || a.prefixo.toLowerCase().includes(q);
    const matchBase = b === "Todas" || a.base === b;
    return matchSearch && matchBase;
  });
});

// ─── Funcionários ─────────────────────────────────────────────────────────────

interface Employee {
  matricula: string;
  nome: string;
  nome_completo: string;
  gerencia: string;
  base: string;
  funcao: string;
  ativo: boolean;
}

const employees        = ref<Employee[]>([]);
const empSearch        = ref("");
const empGerenciaFilter = ref("Todas");
const empDialog        = ref(false);
const empError         = ref("");
const empIsEditing     = ref(false);
const empForm          = ref<Partial<Employee>>({});

const filteredEmployees = computed(() => {
  const q  = empSearch.value.toLowerCase();
  const gr = empGerenciaFilter.value;
  return employees.value.filter((e) => {
    const matchSearch   = !q || e.nome_completo.toLowerCase().includes(q) || e.matricula.includes(q) || e.nome.toLowerCase().includes(q);
    const matchGerencia = gr === "Todas" || e.gerencia === gr;
    return matchSearch && matchGerencia;
  });
});

function openEmpDialog(e?: Employee) {
  empError.value  = "";
  empIsEditing.value = !!e;
  empForm.value   = e ? { ...e } : { gerencia: "GOMAN", base: "BCB", ativo: true };
  empDialog.value = true;
}

async function saveEmployee() {
  const f = empForm.value;
  if (!f.matricula || !f.nome || !f.nome_completo || !f.gerencia || !f.base || !f.funcao) {
    empError.value = "Preencha todos os campos obrigatórios.";
    return;
  }
  saving.value  = true;
  empError.value = "";

  const payload = {
    matricula: f.matricula, nome: f.nome, nome_completo: f.nome_completo,
    gerencia: f.gerencia, base: f.base, funcao: f.funcao, ativo: f.ativo ?? true,
  };

  const { error } = empIsEditing.value
    ? await supabase.from("employees").update(payload).eq("matricula", f.matricula!)
    : await supabase.from("employees").insert(payload);

  saving.value = false;
  if (error) { empError.value = error.message; return; }

  $q.notify({ type: "positive", message: empIsEditing.value ? "Funcionário atualizado." : "Funcionário adicionado." });
  empDialog.value = false;
  await fetchEmployees();
}

async function deleteEmployee(e: Employee) {
  $q.dialog({
    title: "Remover funcionário",
    message: `Remover <b>${e.nome_completo}</b> (mat. ${e.matricula})?`,
    html: true,
    ok: { label: "Remover", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    const { error } = await supabase.from("employees").delete().eq("matricula", e.matricula);
    if (error) { $q.notify({ type: "negative", message: error.message }); return; }
    $q.notify({ type: "positive", message: "Funcionário removido." });
    await fetchEmployees();
  });
}

// ─── Equipes ──────────────────────────────────────────────────────────────────

interface Equipe {
  id: string;
  base: string;
  prefixo: string;
  gerencia: string;
}

const equipes          = ref<Equipe[]>([]);
const eqSearch         = ref("");
const eqGerenciaFilter  = ref("Todas");
const eqDialog         = ref(false);
const eqError          = ref("");
const eqForm           = ref<Partial<Equipe>>({});

const filteredEquipes = computed(() => {
  const q  = eqSearch.value.toLowerCase();
  const gr = eqGerenciaFilter.value;
  return equipes.value.filter((eq) => {
    const matchSearch   = !q || eq.prefixo.toLowerCase().includes(q) || eq.base.toLowerCase().includes(q);
    const matchGerencia = gr === "Todas" || eq.gerencia === gr;
    return matchSearch && matchGerencia;
  });
});

function openEqDialog(eq?: Equipe) {
  eqError.value  = "";
  eqForm.value   = eq ? { ...eq } : { base: "BCB", gerencia: "GOMAN" };
  eqDialog.value = true;
}

async function saveEquipe() {
  const f = eqForm.value;
  if (!f.base || !f.prefixo || !f.gerencia) {
    eqError.value = "Preencha todos os campos obrigatórios.";
    return;
  }
  saving.value = true;
  eqError.value = "";

  const payload = { base: f.base, prefixo: f.prefixo, gerencia: f.gerencia };

  const { error } = f.id
    ? await supabase.from("pwa_equipes").update(payload).eq("id", f.id)
    : await supabase.from("pwa_equipes").insert(payload);

  saving.value = false;
  if (error) { eqError.value = error.message; return; }

  $q.notify({ type: "positive", message: f.id ? "Equipe atualizada." : "Equipe adicionada." });
  eqDialog.value = false;
  await fetchEquipes();
}

async function deleteEquipe(eq: Equipe) {
  $q.dialog({
    title: "Remover equipe",
    message: `Remover a equipe <b>${eq.prefixo}</b>?`,
    html: true,
    ok: { label: "Remover", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    const { error } = await supabase.from("pwa_equipes").delete().eq("id", eq.id);
    if (error) { $q.notify({ type: "negative", message: error.message }); return; }
    $q.notify({ type: "positive", message: "Equipe removida." });
    await fetchEquipes();
  });
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchEmployees() {
  const { data } = await supabase
    .from("employees")
    .select("matricula, nome, nome_completo, gerencia, base, funcao, ativo")
    .order("nome_completo");
  if (data) employees.value = data as Employee[];
}

async function fetchEquipes() {
  const { data } = await supabase
    .from("pwa_equipes")
    .select("*")
    .order("base")
    .order("prefixo");
  if (data) equipes.value = data as Equipe[];
}

async function fetchAll() {
  loading.value = true;
  await Promise.all([fetchEmployees(), fetchEquipes()]);
  loading.value = false;
}

onMounted(fetchAll);

// ─── Export / Import ──────────────────────────────────────────────────────────

const importInput = ref<HTMLInputElement | null>(null);
const importing   = ref(false);

function exportExcel() {
  const wb = XLSX.utils.book_new();

  const empData = employees.value.map((e) => ({
    Matricula:     e.matricula,
    Nome:          e.nome,
    Nome_Completo: e.nome_completo,
    Gerencia:      e.gerencia,
    Base:          e.base,
    Funcao:        e.funcao,
    Ativo:         e.ativo ? "SIM" : "NÃO",
  }));
  const wsEmp = XLSX.utils.json_to_sheet(empData);
  wsEmp["!cols"] = [10, 22, 40, 8, 8, 22, 6].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsEmp, "Funcionarios");

  const eqData = equipes.value.map((eq) => ({
    ID:       eq.id,
    Base:     eq.base,
    Prefixo:  eq.prefixo,
    Gerencia: eq.gerencia,
  }));
  const wsEq = XLSX.utils.json_to_sheet(eqData);
  wsEq["!cols"] = [38, 8, 14, 8].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsEq, "Equipes");

  XLSX.writeFile(wb, "banco_pwa.xlsx");
  $q.notify({ type: "positive", message: "Arquivo exportado com sucesso." });
}

function triggerImport() {
  importInput.value?.click();
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file  = input.files?.[0];
  if (!file) return;
  input.value = "";

  importing.value = true;

  try {
    const buffer = await file.arrayBuffer();
    const wb     = XLSX.read(buffer, { type: "array" });

    let empUpdated = 0, eqUpdated = 0;

    const wsEmp = wb.Sheets["Funcionarios"];
    if (wsEmp) {
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsEmp);
      const REQUIRED = ["Matricula", "Nome", "Nome_Completo", "Gerencia", "Base", "Funcao"];
      const missing  = REQUIRED.filter((k) => !rows[0]?.[k]);
      if (missing.length) throw new Error(`Colunas ausentes na aba Funcionarios: ${missing.join(", ")}`);

      const payload = rows.map((r) => ({
        matricula:     String(r["Matricula"]).trim(),
        nome:          String(r["Nome"]).trim(),
        nome_completo: String(r["Nome_Completo"]).trim(),
        gerencia:      String(r["Gerencia"]).trim(),
        base:          String(r["Base"]).trim(),
        funcao:        String(r["Funcao"]).trim(),
        ativo:         String(r["Ativo"] ?? "SIM").trim().toUpperCase() !== "NÃO",
      })).filter((r) => r.matricula);

      for (let i = 0; i < payload.length; i += 50) {
        const batch = payload.slice(i, i + 50);
        const { error } = await supabase.from("employees").upsert(batch, { onConflict: "matricula" });
        if (error) throw new Error("Erro ao importar funcionários: " + error.message);
      }
      empUpdated = payload.length;
    }

    const wsEq = wb.Sheets["Equipes"];
    if (wsEq) {
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsEq);
      if (rows.length) {
        const REQUIRED = ["Base", "Prefixo", "Gerencia"];
        const missing  = REQUIRED.filter((k) => !rows[0]?.[k]);
        if (missing.length) throw new Error(`Colunas ausentes na aba Equipes: ${missing.join(", ")}`);

        const payload = rows.map((r) => {
          const obj: Record<string, string> = {
            base:     String(r["Base"]).trim(),
            prefixo:  String(r["Prefixo"]).trim(),
            gerencia: String(r["Gerencia"]).trim(),
          };
          if (r["ID"]) obj["id"] = String(r["ID"]).trim();
          return obj;
        }).filter((r) => r["base"] && r["prefixo"]);

        for (let i = 0; i < payload.length; i += 50) {
          const batch = payload.slice(i, i + 50);
          const { error } = await supabase.from("pwa_equipes").upsert(batch, { onConflict: "prefixo" });
          if (error) throw new Error("Erro ao importar equipes: " + error.message);
        }
        eqUpdated = payload.length;
      }
    }

    await fetchAll();
    $q.notify({
      type: "positive",
      message: `Importação concluída: ${empUpdated} funcionários · ${eqUpdated} equipes`,
      timeout: 5000,
    });
  } catch (e: unknown) {
    $q.notify({ type: "negative", message: (e as Error).message ?? "Erro ao importar." });
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

// ── Tokens ────────────────────────────────────────────────────────────────────
:root {
  --dbp-surface:  rgba(255,255,255,.035);
  --dbp-border:   rgba(255,255,255,.08);
  --dbp-border2:  rgba(255,255,255,.05);
  --dbp-txt:      rgba(255,255,255,.92);
  --dbp-muted:    rgba(255,255,255,.38);
  --dbp-accent:   #8B1C2B;
  --dbp-radius:   10px;
  // Gerência
  --c-goman:  #F59E0B;
  --c-gstc:   #3B82F6;
  --c-gere:   #10B981;
  --c-sesmt:  #A78BFA;
}

// ── Page ──────────────────────────────────────────────────────────────────────
.dbp-page {
  min-height: 100vh;
  padding: 0;
  background: transparent;
}

// ── Header ────────────────────────────────────────────────────────────────────
.dbp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 40px 48px 32px;
  border-bottom: 1px solid var(--dbp-border);
  flex-wrap: wrap;

  @media (max-width: 640px) { padding: 28px 20px 24px; }
}

.dbp-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--dbp-accent);
  margin: 0 0 8px;
  opacity: .9;
}

.dbp-title {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -.03em;
  margin: 0 0 14px;
  color: var(--dbp-txt);
  line-height: 1;
}

.dbp-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dbp-stat {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.dbp-stat__n {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--dbp-txt);
  line-height: 1;
}
.dbp-stat__label {
  font-size: 12px;
  color: var(--dbp-muted);
  font-weight: 500;
}
.dbp-stat__div {
  width: 1px;
  height: 20px;
  background: var(--dbp-border);
}

.dbp-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 2px;
  flex-shrink: 0;
}

.dbp-hbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .02em;
  border: 1px solid var(--dbp-border);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .18s ease;
  background: var(--dbp-surface);
  color: var(--dbp-txt);

  &:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.15); }

  &--ghost {
    padding: 7px;
    color: var(--dbp-muted);
    &:hover { color: var(--dbp-txt); }
    .spin { animation: spin .7s linear infinite; }
  }

  &--export {
    color: #60A5FA;
    border-color: rgba(96,165,250,.25);
    background: rgba(59,130,246,.08);
    &:hover { background: rgba(59,130,246,.16); border-color: rgba(96,165,250,.4); }
  }

  &--import {
    color: #34D399;
    border-color: rgba(52,211,153,.25);
    background: rgba(16,185,129,.08);
    &:hover { background: rgba(16,185,129,.16); border-color: rgba(52,211,153,.4); }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

// ── Tabs ──────────────────────────────────────────────────────────────────────
.dbp-tabs-wrap {
  padding: 0 48px;
  border-bottom: 1px solid var(--dbp-border);
  @media (max-width: 640px) { padding: 0 20px; }
}

.dbp-tabs {
  display: flex;
  gap: 0;
}

.dbp-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 16px 20px 14px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--dbp-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all .16s ease;
  position: relative;
  bottom: -1px;

  &:hover { color: var(--dbp-txt); }

  &.--active {
    color: var(--dbp-txt);
    border-bottom-color: var(--dbp-accent);
  }
}

.dbp-tab__ct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 20px;
  background: var(--dbp-surface);
  border: 1px solid var(--dbp-border);
  color: var(--dbp-muted);
  transition: all .16s;

  .dbp-tab.--active & {
    background: rgba(139,28,43,.18);
    border-color: rgba(139,28,43,.3);
    color: #F87171;
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────
.dbp-body {
  padding: 28px 48px 48px;
  @media (max-width: 640px) { padding: 20px 16px 40px; }
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
.dbp-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.dbp-search-shell {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--dbp-border);
  border-radius: var(--dbp-radius);
  background: var(--dbp-surface);
  padding: 0 10px;
  transition: border-color .16s;

  &:focus-within {
    border-color: rgba(255,255,255,.2);
    background: rgba(255,255,255,.05);
  }
}
.dbp-search-icon { color: var(--dbp-muted); flex-shrink: 0; }
.dbp-search {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--dbp-txt);
  font-size: 13px;
  padding: 9px 8px;
  &::placeholder { color: var(--dbp-muted); }
}
.dbp-search-x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dbp-muted);
  padding: 4px;
  border-radius: 4px;
  line-height: 1;
  &:hover { color: var(--dbp-txt); }
}

.dbp-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.dbp-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid var(--dbp-border);
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;

  &:hover { color: var(--dbp-txt); border-color: rgba(255,255,255,.15); }

  &.--active {
    color: var(--dbp-txt);
    background: var(--dbp-surface);
    border-color: rgba(255,255,255,.18);
  }

  &.--active.--goman { color: var(--c-goman); border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.08); }
  &.--active.--gstc  { color: var(--c-gstc);  border-color: rgba(59,130,246,.35);  background: rgba(59,130,246,.08);  }
  &.--active.--gere  { color: var(--c-gere);  border-color: rgba(16,185,129,.35);  background: rgba(16,185,129,.08);  }
  &.--active.--sesmt { color: var(--c-sesmt); border-color: rgba(167,139,250,.35); background: rgba(167,139,250,.08); }
}

.dbp-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .03em;
  padding: 8px 14px;
  border-radius: var(--dbp-radius);
  background: var(--dbp-accent);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity .15s, transform .12s;
  white-space: nowrap;

  &:hover { opacity: .88; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}

// ── Count + Collapse ──────────────────────────────────────────────────────────
.dbp-collapse-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0 10px;
  gap: 8px;
  border-radius: 6px;
  transition: opacity .14s;
  &:hover { opacity: .75; }
}

.dbp-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: var(--dbp-muted);
  letter-spacing: .04em;
  margin: 0;
}

.dbp-chevron {
  color: var(--dbp-muted);
  transition: transform .22s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
  &.--open { transform: rotate(180deg); }
}

// ── Records ───────────────────────────────────────────────────────────────────
.dbp-records {
  border: 1px solid var(--dbp-border);
  border-radius: var(--dbp-radius);
  overflow: hidden;
}

.dbp-record {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--dbp-border2);
  transition: background .12s;
  position: relative;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255,255,255,.03); }
  &:hover .dbp-record__acts { opacity: 1; }
}

.dbp-record__av {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: -.01em;

  &[data-g="GOMAN"] { background: rgba(245,158,11,.15); color: var(--c-goman); }
  &[data-g="GSTC"]  { background: rgba(59,130,246,.15);  color: var(--c-gstc);  }
  &[data-g="GERE"]  { background: rgba(16,185,129,.15);  color: var(--c-gere);  }
  &[data-g="SESMT"] { background: rgba(167,139,250,.15); color: var(--c-sesmt); }

  &--bus {
    font-size: 0;
    i { font-size: 16px !important; }
  }
}

.dbp-record__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dbp-record__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dbp-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -.01em;
}
.dbp-record__sub {
  font-size: 11.5px;
  color: var(--dbp-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.dbp-mat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.05);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--dbp-border);
  flex-shrink: 0;
}
.dbp-record__dot {
  opacity: .3;
  flex-shrink: 0;
}

.dbp-record__chips {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  @media (max-width: 600px) { display: none; }
}

.dbp-chip {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;

  &[data-g="GOMAN"] { color: var(--c-goman); background: rgba(245,158,11,.1);  border-color: rgba(245,158,11,.2);  }
  &[data-g="GSTC"]  { color: var(--c-gstc);  background: rgba(59,130,246,.1);  border-color: rgba(59,130,246,.2);  }
  &[data-g="GERE"]  { color: var(--c-gere);  background: rgba(16,185,129,.1);  border-color: rgba(16,185,129,.2);  }
  &[data-g="SESMT"] { color: var(--c-sesmt); background: rgba(167,139,250,.1); border-color: rgba(167,139,250,.2); }

  &--base {
    color: rgba(255,255,255,.5);
    background: rgba(255,255,255,.05);
    border-color: var(--dbp-border);
  }
  &--off {
    color: #F87171;
    background: rgba(248,113,113,.08);
    border-color: rgba(248,113,113,.2);
  }
  &--prefixo {
    color: #34d399;
    background: rgba(52,211,153,.1);
    border-color: rgba(52,211,153,.2);
    font-family: 'JetBrains Mono', monospace;
  }
  &--loc {
    color: rgba(255,255,255,.45);
    background: rgba(255,255,255,.04);
    border-color: var(--dbp-border2);
  }
  &--ct {
    color: rgba(255,255,255,.3);
    background: transparent;
    border-color: var(--dbp-border2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
  }
}

.dbp-record__addr {
  font-size: 10.5px;
  color: rgba(255,255,255,.28);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dbp-record__av--home {
  background: rgba(16,185,129,.12);
  color: #34d399;
  font-size: 0;
  i { font-size: 16px !important; }
}

.dbp-record__av--geral {
  background: rgba(251,146,60,.12);
  color: #fb923c;
  font-size: 0;
  i { font-size: 16px !important; }
}

.dbp-chip--rateio {
  background: rgba(99,102,241,.14);
  color: #818cf8;
  font-family: monospace;
  letter-spacing: .02em;
}

.dbp-record__acts {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity .14s;
  flex-shrink: 0;
}

.dbp-act {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;

  &:hover {
    background: rgba(255,255,255,.08);
    color: var(--dbp-txt);
  }
  &--del:hover {
    background: rgba(248,113,113,.12);
    color: #F87171;
  }
}

// ── Empty ─────────────────────────────────────────────────────────────────────
.dbp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 56px 20px;
  color: var(--dbp-muted);
  i { opacity: .4; }
  p { font-size: 13px; margin: 0; }
}

// ── Record entrance animation ─────────────────────────────────────────────────
.rec-enter-active {
  transition: opacity .22s ease, transform .22s ease;
}
.rec-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

// ── Dialog ────────────────────────────────────────────────────────────────────
.dbp-dlg {
  min-width: 380px;
  max-width: 460px;
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid var(--dbp-border) !important;
}

.dbp-dlg__bar {
  height: 3px;
  &[data-g="GOMAN"] { background: var(--c-goman); }
  &[data-g="GSTC"]  { background: var(--c-gstc);  }
  &[data-g="GERE"]  { background: var(--c-gere);  }
  &[data-g="SESMT"] { background: var(--c-sesmt); }
}

.dbp-dlg__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--dbp-border);
}
.dbp-dlg__title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 3px;
  letter-spacing: -.01em;
}
.dbp-dlg__sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--dbp-muted);
  margin: 0;
}
.dbp-dlg__x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dbp-muted);
  padding: 4px;
  border-radius: 6px;
  line-height: 1;
  margin-top: -2px;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,.06); color: var(--dbp-txt); }
}

.dbp-dlg__body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dbp-dlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 18px;
  border-top: 1px solid var(--dbp-border);
}
.dbp-dlg__cancel {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--dbp-border);
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;
  &:hover { background: rgba(255,255,255,.05); color: var(--dbp-txt); }
}
.dbp-dlg__save {
  font-size: 13px;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: var(--dbp-accent);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity .14s, transform .12s;
  &:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  &:disabled { opacity: .5; cursor: not-allowed; }
}

@media (max-width: 500px) {
  .dbp-dlg { min-width: calc(100vw - 32px); }
}
</style>
