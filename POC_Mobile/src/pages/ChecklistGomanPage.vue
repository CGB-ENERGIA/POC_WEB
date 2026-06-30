<template>
  <q-page class="mobile-page checklist-page">
    <!-- Cabeçalho fixo com progresso -->
    <div class="checklist-header q-pa-md">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2 text-weight-bold text-grey-9">Checklist GOMAN</div>
        <q-badge color="primary" :label="`${respondidas}/${totalPerguntas}`" />
      </div>
      <q-linear-progress
        :value="progresso"
        color="primary"
        track-color="grey-3"
        rounded
        style="height: 8px"
      />
      <div class="text-caption text-grey-6 q-mt-xs">
        {{ naoConformes }} não conforme{{ naoConformes !== 1 ? "s" : "" }}
      </div>
    </div>

    <q-form class="q-pa-md q-pt-none" @submit.prevent="onSubmit">
      <!-- Local -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label">Local da auditagem</div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-select
              v-model="base"
              :options="basesOperacionais"
              outlined
              dense
              label="Base"
              :rules="[required]"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="equipe"
              outlined
              dense
              label="Equipe / Prefixo"
              placeholder="Ex: ALOJ74"
              :rules="[required]"
            />
          </div>
        </div>
      </q-card>

      <!-- Categorias -->
      <q-list class="checklist-categories q-gutter-y-sm">
        <q-expansion-item
          v-for="cat in gomanChecklist"
          :key="cat.id"
          expand-separator
          class="mobile-card checklist-category"
          header-class="q-pa-md"
          :default-opened="cat.id === gomanChecklist[0]?.id"
        >
          <template #header>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ cat.label }}</q-item-label>
              <q-item-label caption>
                {{ progressoCategoria(cat.id) }}/{{ cat.perguntas.length }} respondidas
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-circular-progress
                :value="progressoCategoria(cat.id) / cat.perguntas.length"
                size="36px"
                :thickness="0.22"
                color="primary"
                track-color="grey-3"
                show-value
                class="text-caption"
              >
                {{ progressoCategoria(cat.id) }}
              </q-circular-progress>
            </q-item-section>
          </template>

          <div class="q-pa-md q-pt-none column q-gutter-md">
            <div
              v-for="(pergunta, idx) in cat.perguntas"
              :key="pergunta.id"
              class="pergunta-card q-pa-md"
              :class="{ 'pergunta-card--answered': respostas[pergunta.id] }"
            >
              <div class="row items-start no-wrap q-mb-sm">
                <q-badge outline color="grey-6" class="q-mr-sm">{{ idx + 1 }}</q-badge>
                <div class="col">
                  <div class="text-body2 text-grey-9">{{ pergunta.texto }}</div>
                  <div class="row q-gutter-xs q-mt-xs">
                    <q-badge
                      :color="gravidadeColor(pergunta.gravidade)"
                      :label="pergunta.gravidade"
                    />
                    <q-badge outline color="grey-5" :label="`Peso ${pergunta.peso}`" />
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-btn
                    class="full-width resposta-btn"
                    no-caps
                    unelevated
                    icon="mdi-check-circle"
                    label="Conforme"
                    :color="respostas[pergunta.id] === 'conforme' ? 'positive' : 'grey-3'"
                    :text-color="respostas[pergunta.id] === 'conforme' ? 'white' : 'grey-8'"
                    @click="setConforme(pergunta.id)"
                  />
                </div>
                <div class="col-6">
                  <q-btn
                    class="full-width resposta-btn"
                    no-caps
                    unelevated
                    icon="mdi-close-circle"
                    label="Não conforme"
                    :color="respostas[pergunta.id] === 'nao_conforme' ? 'negative' : 'grey-3'"
                    :text-color="respostas[pergunta.id] === 'nao_conforme' ? 'white' : 'grey-8'"
                    @click="abrirModalNaoConforme(pergunta)"
                  />
                </div>
              </div>

              <div
                v-if="respostas[pergunta.id] === 'nao_conforme' && detalhesMap[pergunta.id]"
                class="nc-resumo q-mt-sm q-pa-sm row items-center no-wrap"
                @click="abrirModalNaoConforme(pergunta)"
              >
                <img
                  :src="detalhesMap[pergunta.id].foto"
                  alt="Evidência"
                  class="nc-resumo__foto q-mr-sm"
                />
                <div class="col">
                  <div class="text-caption text-weight-bold text-negative">Registrado</div>
                  <div class="text-caption text-grey-8 nc-resumo__texto">
                    {{ detalhesMap[pergunta.id].observacao }}
                  </div>
                </div>
                <q-icon name="mdi-pencil" size="18px" color="grey-6" />
              </div>
            </div>
          </div>
        </q-expansion-item>
      </q-list>

      <q-btn
        type="submit"
        class="full-width q-mt-lg q-mb-md"
        color="primary"
        size="lg"
        unelevated
        no-caps
        rounded
        label="Finalizar checklist"
        icon="mdi-content-save"
        :loading="saving"
        :disable="respondidas < totalPerguntas"
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
          <div v-if="modalPerguntaTexto" class="text-body2 text-grey-8 q-mb-md">
            {{ modalPerguntaTexto }}
          </div>

          <div class="field-label q-mb-sm">Foto da evidência</div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden-input"
            @change="onFotoSelecionada"
          />

          <div
            v-if="modalFotoPreview"
            class="nc-foto-preview q-mb-md"
            @click="selecionarFoto"
          >
            <img :src="modalFotoPreview" alt="Preview" />
            <div class="nc-foto-preview__overlay">
              <q-icon name="mdi-camera-retake" size="28px" color="white" />
              <span>Trocar foto</span>
            </div>
          </div>
          <q-btn
            v-else
            class="full-width q-mb-md"
            outline
            color="primary"
            no-caps
            icon="mdi-camera"
            label="Tirar ou escolher foto"
            :loading="carregandoFoto"
            @click="selecionarFoto"
          />

          <q-input
            v-model="modalObservacao"
            type="textarea"
            outlined
            autogrow
            rows="3"
            label="Observação *"
            placeholder="Descreva a inconformidade encontrada..."
            :error="modalTouched && !modalObservacao.trim()"
            error-message="Informe a observação"
          />
        </q-card-section>

        <q-card-actions class="q-pa-md q-pt-none">
          <q-btn
            class="col"
            flat
            no-caps
            color="grey-7"
            label="Cancelar"
            @click="cancelarModal"
          />
          <q-btn
            class="col"
            unelevated
            no-caps
            color="negative"
            label="Confirmar"
            icon="mdi-check"
            :loading="carregandoFoto"
            @click="confirmarNaoConforme"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import { basesOperacionais } from "@/data/checklist";
import {
  gomanChecklist,
  totalPerguntasGoman,
  type Gravidade,
  type PerguntaGoman,
  type RespostaChecklist,
} from "@/data/goman-checklist";
import type { RespostaSalva } from "@/types/checklist";
import { compressImage } from "@/utils/image";

interface NaoConformeDetalhe {
  observacao: string;
  foto: string;
}

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

const base = ref(session.employee?.base ?? "");
const equipe = ref("");
const saving = ref(false);

const respostas = reactive<Record<string, Exclude<RespostaChecklist, null>>>({});
const detalhesMap = reactive<Record<string, NaoConformeDetalhe>>({});

const modalAberto = ref(false);
const modalPerguntaId = ref<string | null>(null);
const modalPerguntaTexto = ref("");
const modalObservacao = ref("");
const modalFotoPreview = ref<string | null>(null);
const modalTouched = ref(false);
const carregandoFoto = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const modalEraNaoConforme = ref(false);

const totalPerguntas = totalPerguntasGoman;

const respondidas = computed(
  () => Object.keys(respostas).filter((k) => respostas[k]).length
);

const naoConformes = computed(
  () => Object.values(respostas).filter((r) => r === "nao_conforme").length
);

const progresso = computed(() =>
  totalPerguntas ? respondidas.value / totalPerguntas : 0
);

function progressoCategoria(catId: string) {
  const cat = gomanChecklist.find((c) => c.id === catId);
  if (!cat) return 0;
  return cat.perguntas.filter((p) => respostas[p.id]).length;
}

function setConforme(id: string) {
  respostas[id] = "conforme";
  delete detalhesMap[id];
}

function abrirModalNaoConforme(pergunta: PerguntaGoman) {
  modalPerguntaId.value = pergunta.id;
  modalPerguntaTexto.value = pergunta.texto;
  modalEraNaoConforme.value = respostas[pergunta.id] === "nao_conforme";

  const existente = detalhesMap[pergunta.id];
  modalObservacao.value = existente?.observacao ?? "";
  modalFotoPreview.value = existente?.foto ?? null;
  modalTouched.value = false;
  modalAberto.value = true;
}

function selecionarFoto() {
  fileInputRef.value?.click();
}

async function onFotoSelecionada(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    $q.notify({ type: "negative", message: "Selecione um arquivo de imagem", position: "top" });
    return;
  }

  carregandoFoto.value = true;
  try {
    modalFotoPreview.value = await compressImage(file);
  } catch {
    $q.notify({ type: "negative", message: "Não foi possível processar a foto", position: "top" });
  } finally {
    carregandoFoto.value = false;
  }
}

function cancelarModal() {
  modalAberto.value = false;
  if (!modalEraNaoConforme.value && modalPerguntaId.value) {
    if (!detalhesMap[modalPerguntaId.value]) {
      delete respostas[modalPerguntaId.value];
    }
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

  detalhesMap[modalPerguntaId.value] = {
    observacao: modalObservacao.value.trim(),
    foto: modalFotoPreview.value,
  };
  respostas[modalPerguntaId.value] = "nao_conforme";
  modalAberto.value = false;
  modalPerguntaId.value = null;
}

function gravidadeColor(g: Gravidade) {
  if (g === "Grave") return "negative";
  if (g === "Médio") return "warning";
  return "grey-6";
}

const required = (v: string) => !!v?.trim() || "Campo obrigatório";

async function onSubmit() {
  if (!session.employee || respondidas.value < totalPerguntas) return;

  saving.value = true;

  const respostasSalvas: RespostaSalva[] = [];

  for (const cat of gomanChecklist) {
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
      });
    }
  }

  observacoes.addChecklist({
    matricula: session.employee.matricula,
    observador: session.employee.nome,
    base: base.value,
    equipe: equipe.value.trim(),
    respostas: respostasSalvas,
  });

  $q.notify({
    type: "positive",
    message: "Checklist GOMAN registrado com sucesso!",
    icon: "mdi-check-circle",
    position: "top",
  });

  await router.replace({ name: "home" });
  saving.value = false;
}
</script>

<style scoped>
.checklist-page {
  padding-bottom: 24px;
}

.checklist-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.checklist-category {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.pergunta-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fafafa;
}

.pergunta-card--answered {
  border-color: rgba(139, 28, 43, 0.25);
  background: #fff;
}

.resposta-btn {
  border-radius: 10px;
  min-height: 44px;
}

.nc-resumo {
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: #fef2f2;
  cursor: pointer;
}

.nc-resumo__foto {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.nc-resumo__texto {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nc-modal {
  width: 100%;
  max-width: 480px;
  border-radius: 16px 16px 0 0;
}

.hidden-input {
  display: none;
}

.nc-foto-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  max-height: 220px;
  cursor: pointer;
}

.nc-foto-preview img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
}

.nc-foto-preview__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.nc-foto-preview:hover .nc-foto-preview__overlay,
.nc-foto-preview:active .nc-foto-preview__overlay {
  opacity: 1;
}
</style>
