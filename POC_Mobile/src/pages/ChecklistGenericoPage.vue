<template>
  <q-page class="mobile-page checklist-page">
    <div class="checklist-header q-pa-md">
      <div class="mobile-card mobile-card--flat q-pa-md">
        <div class="row items-center justify-between q-mb-sm">
          <div>
            <div class="section-title">{{ titulo }}</div>
            <div class="section-subtitle">{{ respondidas }} de {{ totalPerguntas }} respondidas</div>
          </div>
          <q-circular-progress
            :value="progresso"
            size="52px"
            :thickness="0.2"
            color="primary"
            track-color="grey-3"
            show-value
            class="text-weight-bold"
          >
            {{ Math.round(progresso * 100) }}%
          </q-circular-progress>
        </div>
        <q-linear-progress :value="progresso" color="primary" track-color="grey-3" rounded style="height: 8px" />
        <div class="row q-gutter-sm q-mt-sm">
          <q-badge color="positive" outline :label="`${respondidas - naoConformes} conformes`" />
          <q-badge color="negative" outline :label="`${naoConformes} não conformes`" />
        </div>
      </div>
    </div>

    <q-form class="q-pa-md q-pt-none" @submit.prevent="onSubmit">
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label">Local da auditagem</div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-select
              v-model="base"
              :options="basesOperacionais"
              option-value="value" option-label="label" emit-value map-options
              outlined dense label="Base" :rules="[required]"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="equipe"
              :options="equipesFiltered"
              outlined dense
              label="Equipe / Prefixo"
              use-input input-debounce="0"
              hide-selected fill-input
              :rules="[required]"
              @filter="filterEquipes"
            />
          </div>
        </div>

        <EvidenciasObrigatorias
          v-model="evidencias"
          :equipe="equipe"
          :observador="session.employee?.nomeCompleto ?? session.employee?.nome ?? ''"
        />
      </q-card>

      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label q-mb-md">Membros da equipe</div>
        <div class="column q-gutter-sm">
          <div v-for="(membro, idx) in membros" :key="idx" class="membro-card">
            <div class="row items-center no-wrap q-mb-sm">
              <div class="membro-num">{{ idx + 1 }}</div>
              <span class="text-caption text-weight-medium membro-card__label q-ml-sm">Membro {{ idx + 1 }}</span>
              <q-space />
              <q-btn flat round dense icon="mdi-close" size="sm" color="grey-6" :disable="membros.length === 1" @click="removerMembro(idx)" />
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-select
                  v-model="membro.nome"
                  :options="membroSugestoes"
                  outlined dense label="Nome" placeholder="Nome do colaborador"
                  use-input fill-input hide-selected input-debounce="0"
                  @filter="filtrarColaborador"
                  @input-value="(val) => (membro.nome = val)"
                  @update:model-value="(val) => aplicarColaboradorSelecionado(idx, val)"
                />
              </div>
              <div class="col-5">
                <q-select
                  v-model="membro.matricula"
                  :options="membroSugestoes"
                  outlined dense label="Matrícula" placeholder="Ex: 12512"
                  use-input fill-input hide-selected input-debounce="0"
                  @filter="filtrarColaborador"
                  @input-value="(val) => (membro.matricula = val)"
                  @update:model-value="(val) => aplicarColaboradorSelecionado(idx, val)"
                />
              </div>
            </div>
          </div>
        </div>
        <q-btn flat no-caps dense icon="mdi-plus-circle-outline" label="Adicionar membro" color="primary" class="q-mt-md full-width adicionar-btn" @click="adicionarMembro" />
      </q-card>

      <q-list class="checklist-categories q-gutter-y-sm">
        <q-expansion-item
          v-for="cat in checklist"
          :key="cat.id"
          v-model="expandedCategories[cat.id]"
          expand-separator
          class="mobile-card checklist-category"
          header-class="q-pa-md"
        >
          <template #header>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ cat.label }}</q-item-label>
              <q-item-label caption>{{ progressoCategoria(cat.id) }}/{{ cat.perguntas.length }} respondidas</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-circular-progress
                :value="progressoCategoria(cat.id) / cat.perguntas.length"
                size="36px" :thickness="0.22"
                color="primary" track-color="grey-3"
                show-value class="text-caption"
              >
                {{ progressoCategoria(cat.id) }}
              </q-circular-progress>
            </q-item-section>
          </template>

          <div class="q-pa-md q-pt-none column q-gutter-md">
            <div
              v-for="(pergunta, idx) in cat.perguntas"
              :key="pergunta.id"
              :id="`pergunta-${pergunta.id}`"
              class="pergunta-card q-pa-md"
              :class="{ 'pergunta-card--answered': respostas[pergunta.id], 'pergunta-card--focus': proximaPerguntaId === pergunta.id }"
            >
              <div class="row items-start no-wrap q-mb-sm">
                <q-badge outline color="grey-6" class="q-mr-sm">{{ idx + 1 }}</q-badge>
                <div class="col">
                  <div class="text-body2 pergunta-texto">{{ pergunta.texto }}</div>
                  <div class="row q-gutter-xs q-mt-xs">
                    <q-badge :color="gravidadeColor(pergunta.gravidade)" :label="pergunta.gravidade" />
                    <q-badge outline color="grey-5" :label="`Peso ${pergunta.peso}`" />
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-btn
                    class="full-width resposta-btn"
                    :class="{ 'resposta-btn--idle': respostas[pergunta.id] !== 'conforme' }"
                    no-caps unelevated icon="mdi-check-circle" label="Conforme"
                    :color="respostas[pergunta.id] === 'conforme' ? 'positive' : undefined"
                    :text-color="respostas[pergunta.id] === 'conforme' ? 'white' : undefined"
                    @click="setConforme(pergunta.id)"
                  />
                </div>
                <div class="col-6">
                  <q-btn
                    class="full-width resposta-btn"
                    :class="{ 'resposta-btn--idle': respostas[pergunta.id] !== 'nao_conforme' }"
                    no-caps unelevated icon="mdi-close-circle" label="Não conforme"
                    :color="respostas[pergunta.id] === 'nao_conforme' ? 'negative' : undefined"
                    :text-color="respostas[pergunta.id] === 'nao_conforme' ? 'white' : undefined"
                    @click="abrirModalNaoConforme(pergunta)"
                  />
                </div>
              </div>

              <div
                v-if="respostas[pergunta.id] === 'nao_conforme' && detalhesMap[pergunta.id]"
                class="nc-resumo q-mt-sm q-pa-sm row items-center no-wrap"
                @click="abrirModalNaoConforme(pergunta)"
              >
                <img :src="detalhesMap[pergunta.id].foto" alt="Evidência" class="nc-resumo__foto q-mr-sm" />
                <div class="col">
                  <div class="text-caption text-weight-bold text-negative">Registrado</div>
                  <div class="text-caption text-grey-8 nc-resumo__texto">{{ detalhesMap[pergunta.id].observacao }}</div>
                  <div v-if="detalhesMap[pergunta.id].itens" class="text-caption text-negative">
                    {{ detalhesMap[pergunta.id].itens!.filter(i => !i.conforme).length }} de {{ detalhesMap[pergunta.id].itens!.length }} itens não conformes
                  </div>
                </div>
                <q-icon name="mdi-pencil" size="18px" color="grey-6" />
              </div>
            </div>
          </div>
        </q-expansion-item>
      </q-list>

      <q-btn
        id="checklist-finalizar"
        type="submit"
        class="full-width btn-primary-lg q-mt-lg q-mb-md"
        color="primary" size="lg" unelevated no-caps
        label="Finalizar" icon="mdi-content-save"
        :loading="saving"
        :disable="!isTestUser && (respondidas < totalPerguntas || !evidenciasCompletas)"
      />
    </q-form>

    <!-- Modal não conforme -->
    <q-dialog v-model="modalAberto" persistent position="bottom">
      <q-card class="nc-modal">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold text-negative">Não conforme</div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="mdi-close" @click="cancelarModal" />
        </q-card-section>
        <q-card-section>
          <div v-if="modalPerguntaTexto" class="text-body2 text-grey-8 q-mb-md">{{ modalPerguntaTexto }}</div>

          <template v-if="modalItens">
            <div class="field-label q-mb-sm">Itens verificados *</div>
            <q-list bordered separator class="rounded-borders q-mb-sm item-check-list">
              <q-item v-for="item in modalItens" :key="item">
                <q-item-section>{{ item }}</q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs no-wrap items-center">
                    <q-btn
                      round dense flat size="sm" icon="mdi-check-circle"
                      :color="modalItensStatus[item] === true ? 'positive' : 'grey-5'"
                      @click="modalItensStatus[item] = true"
                    />
                    <q-btn
                      round dense flat size="sm" icon="mdi-close-circle"
                      :color="modalItensStatus[item] === false ? 'negative' : 'grey-5'"
                      @click="modalItensStatus[item] = false"
                    />
                    <q-btn
                      v-if="modalItensManuais.has(item)"
                      round dense flat size="sm" icon="mdi-delete-outline" color="grey-6"
                      @click="removerItemManual(item)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row q-gutter-sm q-mb-sm items-center">
              <q-input
                v-model="modalNovoItem"
                dense outlined class="col"
                placeholder="Adicionar outro item..."
                @keyup.enter="adicionarItemManual"
              />
              <q-btn round dense unelevated color="primary" icon="mdi-plus" @click="adicionarItemManual" />
            </div>
            <div
              v-if="modalTouched && modalItens.some((i) => modalItensStatus[i] === null || modalItensStatus[i] === undefined)"
              class="text-caption text-negative q-mb-md"
            >
              Marque a condição de todos os itens
            </div>
          </template>

          <div class="field-label q-mb-sm">Foto da evidência</div>
          <div v-if="modalFotoPreview" class="nc-foto-preview q-mb-md" @click="abrirCameraNc">
            <img :src="modalFotoPreview" alt="Visualização da foto" />
            <div class="nc-foto-preview__overlay">
              <q-icon name="mdi-camera-retake" size="28px" color="white" />
              <span>Trocar foto</span>
            </div>
          </div>
          <q-btn v-else class="full-width q-mb-md" outline color="primary" no-caps icon="mdi-camera" label="Tirar foto" @click="abrirCameraNc" />
          <div v-if="fotosLocal.length" class="q-mb-md">
            <div class="field-label q-mb-xs">Fotos do local da auditagem</div>
            <div class="fotos-local-picker">
              <div
                v-for="(foto, i) in fotosLocal" :key="i"
                class="foto-local-thumb"
                :class="{ 'foto-local-thumb--ativa': modalFotoPreview === foto }"
                @click="usarFotoLocal(foto)"
              >
                <img :src="foto" alt="" />
                <div v-if="modalFotoPreview === foto" class="foto-local-thumb__check">
                  <q-icon name="mdi-check-circle" size="20px" />
                </div>
              </div>
            </div>
          </div>
          <q-input
            v-model="modalObservacao"
            type="textarea" outlined autogrow rows="3"
            label="Observação *"
            placeholder="Descreva a inconformidade encontrada..."
            :error="modalTouched && !modalObservacao.trim()"
            error-message="Informe a observação"
          />

          <div class="field-label q-mt-md q-mb-sm">Resolvido no momento da auditoria? *</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-btn
                class="full-width resposta-btn"
                :class="{ 'resposta-btn--idle': modalResolvido !== true }"
                no-caps unelevated icon="mdi-check-circle" label="Sim"
                :color="modalResolvido === true ? 'positive' : undefined"
                :text-color="modalResolvido === true ? 'white' : undefined"
                @click="modalResolvido = true"
              />
            </div>
            <div class="col-6">
              <q-btn
                class="full-width resposta-btn"
                :class="{ 'resposta-btn--idle': modalResolvido !== false }"
                no-caps unelevated icon="mdi-close-circle" label="Não"
                :color="modalResolvido === false ? 'negative' : undefined"
                :text-color="modalResolvido === false ? 'white' : undefined"
                @click="modalResolvido = false"
              />
            </div>
          </div>
          <div v-if="modalTouched && modalResolvido === null" class="text-caption text-negative q-mt-xs">
            Informe se a não conformidade foi resolvida
          </div>
        </q-card-section>
        <q-card-actions class="q-pa-md q-pt-none">
          <q-btn class="col" flat no-caps color="grey-7" label="Cancelar" @click="cancelarModal" />
          <q-btn class="col" unelevated no-caps color="negative" label="Confirmar" icon="mdi-check" @click="confirmarNaoConforme" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <CameraModal v-model="cameraNcAberta" @captured="onFotoNcCapturada" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { LocalStorage, useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import { basesOperacionais } from "@/data/checklist";
import { equipesPorBase } from "@/data/equipes";
import { employees } from "@/data/employees";
import type { CategoriaGoman, PerguntaGoman, Gravidade, ItemVerificado } from "@/data/goman-checklist";
import type { AuditagemCategoria } from "@/data/auditagem";
import type { RespostaSalva } from "@/types/checklist";
import { compressBase64 } from "@/utils/image";
import { getTrustedTime, ServerTimeError } from "@/utils/server-time";
import { stampAuditPhoto } from "@/utils/photo-stamp";
import { extrairItensPergunta } from "@/utils/pergunta-itens";
import { useChecklistDraft } from "@/composables/useChecklistDraft";
import CameraModal from "@/components/CameraModal.vue";
import EvidenciasObrigatorias from "@/components/EvidenciasObrigatorias.vue";

interface NaoConformeDetalhe {
  observacao: string;
  foto: string;
  resolvido: boolean;
  itens?: ItemVerificado[];
}

const props = defineProps<{
  titulo: string;
  auditagem: AuditagemCategoria;
  checklist: CategoriaGoman[];
  totalPerguntas: number;
}>();

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

const base = ref(session.employee?.base ?? "");
const equipe = ref("");

const equipesOptions = computed(() => equipesPorBase(base.value));
const equipesFiltered = ref<string[]>([]);

watch(equipesOptions, (opts) => { equipesFiltered.value = opts; }, { immediate: true });
watch(base, () => {
  if (!equipesOptions.value.includes(equipe.value)) equipe.value = "";
});

function filterEquipes(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    equipesFiltered.value = needle
      ? equipesOptions.value.filter((e) => e.toLowerCase().includes(needle))
      : equipesOptions.value;
  });
}

const draftKey = `cgb-fotos-local-${props.auditagem.toLowerCase()}-${session.employee?.matricula ?? "anon"}`;
const evidencias = ref<(string | null)[]>([null, null, null]);
const fotosLocal = computed(() => evidencias.value.filter((f): f is string => !!f));
const evidenciasCompletas = computed(() => evidencias.value.every(Boolean));

onMounted(() => {
  const saved = LocalStorage.getItem<(string | null)[]>(draftKey);
  if (saved?.length) evidencias.value = [0, 1, 2].map(i => saved[i] ?? null);
});

watch(evidencias, (val) => {
  if (val.some(Boolean)) LocalStorage.set(draftKey, val);
  else LocalStorage.remove(draftKey);
}, { deep: true });

const membros = ref<{ nome: string; matricula: string }[]>(
  Array.from({ length: 6 }, () => ({ nome: "", matricula: "" }))
);
const saving = ref(false);

function adicionarMembro() { membros.value.push({ nome: "", matricula: "" }); }
function removerMembro(idx: number) { if (membros.value.length > 1) membros.value.splice(idx, 1); }

const membroSugestoes = ref<string[]>([]);

function filtrarColaborador(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.trim();
    const needleLower = needle.toLowerCase();
    membroSugestoes.value = needle
      ? employees
          .filter((e) =>
            e.nomeCompleto.toLowerCase().includes(needleLower) ||
            e.nome.toLowerCase().includes(needleLower) ||
            e.matricula.includes(needle)
          )
          .slice(0, 8)
          .map((e) => `${e.nomeCompleto} — ${e.matricula}`)
      : [];
  });
}

function aplicarColaboradorSelecionado(idx: number, valorSelecionado: string | null) {
  if (!valorSelecionado) return;
  const match = valorSelecionado.match(/^(.*) — (\d+)$/);
  if (!match) return;
  membros.value[idx].nome = match[1];
  membros.value[idx].matricula = match[2];
}

const respostas = reactive<Record<string, Exclude<import("@/data/goman-checklist").RespostaChecklist, null>>>({});
const detalhesMap = reactive<Record<string, NaoConformeDetalhe>>({});

const modalAberto = ref(false);
const modalPerguntaId = ref<string | null>(null);
const modalPerguntaTexto = ref("");
const modalObservacao = ref("");
const modalFotoPreview = ref<string | null>(null);
const modalResolvido = ref<boolean | null>(null);
const modalItens = ref<string[] | null>(null);
const modalItensStatus = reactive<Record<string, boolean | null>>({});
const modalItensManuais = ref<Set<string>>(new Set());
const modalNovoItem = ref("");
const modalTouched = ref(false);
const cameraNcAberta = ref(false);
const modalEraNaoConforme = ref(false);
const proximaPerguntaId = ref<string | null>(null);

const todasPerguntasIds = computed(() =>
  props.checklist.flatMap((cat) => cat.perguntas.map((p) => p.id))
);

const expandedCategories = reactive<Record<string, boolean>>(
  Object.fromEntries(props.checklist.map((cat, i) => [cat.id, i === 0]))
);

const { clearDraft: clearChecklistDraft } = useChecklistDraft(
  props.auditagem,
  session.employee?.matricula ?? "anon",
  { base, equipe, membros, respostas, detalhesMap, expandedCategories }
);

const respondidas = computed(
  () => Object.keys(respostas).filter((k) => respostas[k]).length
);
const naoConformes = computed(
  () => Object.values(respostas).filter((r) => r === "nao_conforme").length
);
const progresso = computed(() =>
  props.totalPerguntas ? respondidas.value / props.totalPerguntas : 0
);

function progressoCategoria(catId: string) {
  const cat = props.checklist.find((c) => c.id === catId);
  if (!cat) return 0;
  return cat.perguntas.filter((p) => respostas[p.id]).length;
}

function setConforme(id: string) {
  if (respostas[id] === "conforme") return;
  respostas[id] = "conforme";
  delete detalhesMap[id];
  irParaProximaPergunta(id);
}

function irParaProximaPergunta(fromPerguntaId: string) {
  const fromIndex = todasPerguntasIds.value.indexOf(fromPerguntaId);
  const nextId = todasPerguntasIds.value.slice(fromIndex + 1).find((id) => !respostas[id]);
  proximaPerguntaId.value = nextId ?? null;

  if (!nextId) { scrollToElement("checklist-finalizar"); return; }

  const categoria = props.checklist.find((cat) => cat.perguntas.some((p) => p.id === nextId));
  if (categoria) expandedCategories[categoria.id] = true;

  nextTick(() => { window.setTimeout(() => scrollToElement(`pergunta-${nextId}`), 280); });
}

function scrollToElement(elementId: string) {
  document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function abrirModalNaoConforme(pergunta: PerguntaGoman) {
  modalPerguntaId.value = pergunta.id;
  modalPerguntaTexto.value = pergunta.texto;
  modalEraNaoConforme.value = respostas[pergunta.id] === "nao_conforme";
  const existente = detalhesMap[pergunta.id];
  modalObservacao.value = existente?.observacao ?? "";
  modalFotoPreview.value = existente?.foto ?? null;
  modalResolvido.value = existente?.resolvido ?? null;

  modalItens.value = extrairItensPergunta(pergunta.texto);
  for (const key of Object.keys(modalItensStatus)) delete modalItensStatus[key];
  modalItensManuais.value = new Set();
  modalNovoItem.value = "";
  if (modalItens.value) {
    const nomesDetectados = new Set(modalItens.value);
    for (const item of modalItens.value) {
      const existenteItem = existente?.itens?.find((i) => i.nome === item);
      modalItensStatus[item] = existenteItem ? existenteItem.conforme : null;
    }
    // Restaura itens adicionados manualmente em uma edição anterior
    for (const salvo of existente?.itens ?? []) {
      if (!nomesDetectados.has(salvo.nome)) {
        modalItens.value.push(salvo.nome);
        modalItensStatus[salvo.nome] = salvo.conforme;
        modalItensManuais.value.add(salvo.nome);
      }
    }
  }

  modalTouched.value = false;
  modalAberto.value = true;
}

function adicionarItemManual() {
  const nome = modalNovoItem.value.trim();
  if (!nome) return;
  if (!modalItens.value) modalItens.value = [];
  if (modalItens.value.some((i) => i.toLowerCase() === nome.toLowerCase())) {
    modalNovoItem.value = "";
    return;
  }
  modalItens.value.push(nome);
  modalItensStatus[nome] = null;
  modalItensManuais.value.add(nome);
  modalNovoItem.value = "";
}

function removerItemManual(item: string) {
  if (!modalItens.value) return;
  modalItens.value = modalItens.value.filter((i) => i !== item);
  delete modalItensStatus[item];
  modalItensManuais.value.delete(item);
}

function abrirCameraNc() {
  if (!equipe.value.trim()) {
    $q.notify({ type: "warning", message: "Informe o nome da equipe antes de tirar a foto", position: "top" });
    return;
  }
  cameraNcAberta.value = true;
}

function usarFotoLocal(foto: string) { modalFotoPreview.value = foto; }

async function onFotoNcCapturada(base64: string) {
  try {
    const { date } = await getTrustedTime();
    const compressed = await compressBase64(base64);
    modalFotoPreview.value = await stampAuditPhoto(compressed, {
      time: date,
      observer: session.employee?.nomeCompleto ?? session.employee?.nome ?? "—",
      equipe: equipe.value.trim(),
    });
  } catch (err) {
    const message =
      err instanceof ServerTimeError ? err.message : "Não foi possível processar a foto";
    $q.notify({ type: "negative", message, position: "top" });
  }
}

function cancelarModal() {
  modalAberto.value = false;
  if (!modalEraNaoConforme.value && modalPerguntaId.value) {
    if (!detalhesMap[modalPerguntaId.value]) delete respostas[modalPerguntaId.value];
  }
  modalPerguntaId.value = null;
}

function confirmarNaoConforme() {
  modalTouched.value = true;
  if (!modalPerguntaId.value) return;
  if (!modalObservacao.value.trim()) {
    $q.notify({ type: "warning", message: "Informe a observação", position: "top" });
    return;
  }
  if (!modalFotoPreview.value) {
    $q.notify({ type: "warning", message: "Adicione uma foto da evidência", position: "top" });
    return;
  }
  if (modalResolvido.value === null) {
    $q.notify({ type: "warning", message: "Informe se a não conformidade foi resolvida", position: "top" });
    return;
  }
  let itensSalvos: ItemVerificado[] | undefined;
  if (modalItens.value) {
    const faltando = modalItens.value.some((item) => modalItensStatus[item] === null || modalItensStatus[item] === undefined);
    if (faltando) {
      $q.notify({ type: "warning", message: "Marque a condição de todos os itens", position: "top" });
      return;
    }
    itensSalvos = modalItens.value.map((item) => ({ nome: item, conforme: modalItensStatus[item] as boolean }));
  }
  detalhesMap[modalPerguntaId.value] = {
    observacao: modalObservacao.value.trim(),
    foto: modalFotoPreview.value,
    resolvido: modalResolvido.value,
    ...(itensSalvos ? { itens: itensSalvos } : {}),
  };
  respostas[modalPerguntaId.value] = "nao_conforme";
  const answeredId = modalPerguntaId.value;
  const resolvidoNoAto = modalResolvido.value;
  modalAberto.value = false;
  modalPerguntaId.value = null;

  if (resolvidoNoAto === false) {
    $q.notify({
      type: "info",
      message: "Não conformidade pendente registrada. Será encaminhada para a Matriz de Responsabilidade.",
      icon: "mdi-clipboard-alert-outline",
      position: "top",
      timeout: 3500,
    });
  }

  irParaProximaPergunta(answeredId);
}

function gravidadeColor(g: Gravidade) {
  if (g === "Grave") return "negative";
  if (g === "Médio") return "warning";
  return "grey-6";
}

const isTestUser = computed(() => session.employee?.matricula === "12690");
const required = (v: string) => isTestUser.value || !!v?.trim() || "Campo obrigatório";

async function onSubmit() {
  if (!session.employee || (!isTestUser.value && (respondidas.value < props.totalPerguntas || !evidenciasCompletas.value))) return;

  saving.value = true;

  let dataRegistro: string;
  try {
    const { date } = await getTrustedTime();
    dataRegistro = date.toISOString();
  } catch (err) {
    saving.value = false;
    const message = err instanceof ServerTimeError ? err.message : "Não foi possível obter o horário do servidor.";
    $q.notify({ type: "warning", message, position: "top", timeout: 4500 });
    return;
  }

  const respostasSalvas: RespostaSalva[] = [];
  for (const cat of props.checklist) {
    for (const p of cat.perguntas) {
      const resposta = respostas[p.id];
      if (!resposta) continue;
      const detalhe = detalhesMap[p.id];
      respostasSalvas.push({
        perguntaId: p.id,
        categoria: cat.label,
        pergunta: p.texto,
        gravidade: p.gravidade,
        peso: p.peso,
        resposta,
        ...(detalhe?.observacao ? { observacao: detalhe.observacao } : {}),
        ...(detalhe?.foto ? { foto: detalhe.foto } : {}),
        ...(detalhe?.resolvido !== undefined ? { resolvido: detalhe.resolvido } : {}),
        ...(detalhe?.itens ? { itens: detalhe.itens } : {}),
      });
    }
  }

  observacoes.addChecklist({
    auditagem: props.auditagem,
    matricula: session.employee.matricula,
    observador: session.employee.nome,
    base: base.value,
    equipe: equipe.value.trim(),
    membros: membros.value.filter((m) => m.nome.trim() || m.matricula.trim()).map((m) => ({
      nome: m.nome.trim(),
      matricula: m.matricula.trim(),
    })),
    fotosLocal: [...fotosLocal.value],
    respostas: respostasSalvas,
    data: dataRegistro,
    employee: session.employee,
  });

  LocalStorage.remove(draftKey);
  clearChecklistDraft();

  $q.notify({
    type: "positive",
    message: `${props.titulo} registrado com sucesso!`,
    icon: "mdi-check-circle",
    position: "top",
  });

  await router.replace({ name: "home" });
  saving.value = false;
}
</script>

<style scoped>
.checklist-page { padding-bottom: 24px; }
.nc-modal { width: 100%; max-width: 480px; border-radius: 20px 20px 0 0; }
.nc-foto-preview {
  position: relative; border-radius: 16px; overflow: hidden;
  max-height: 220px; cursor: pointer; border: 1px dashed rgba(122, 18, 37, 0.25);
}
.nc-foto-preview img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
.nc-foto-preview__overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; background: rgba(0,0,0,0.35); color: #fff; font-size: 12px;
  opacity: 0; transition: opacity 0.15s ease;
}
.nc-foto-preview:hover .nc-foto-preview__overlay,
.nc-foto-preview:active .nc-foto-preview__overlay { opacity: 1; }
.fotos-local-picker { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.foto-local-thumb {
  position: relative; width: 68px; height: 68px; border-radius: 8px;
  overflow: hidden; flex-shrink: 0; cursor: pointer;
  border: 2.5px solid transparent; transition: border-color 0.15s;
}
.foto-local-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.foto-local-thumb--ativa { border-color: var(--q-primary); }
.foto-local-thumb__check {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(122, 18, 37, 0.38); color: #fff;
}
</style>
