<template>
  <q-page class="mobile-page checklist-page">
    <!-- Cabeçalho fixo com progresso -->
    <div class="checklist-header q-pa-md">
      <div class="mobile-card mobile-card--flat q-pa-md">
        <div class="row items-center justify-between q-mb-sm">
          <div>
            <div class="section-title">Checklist GOMAN</div>
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
        <q-linear-progress
          :value="progresso"
          color="primary"
          track-color="grey-3"
          rounded
          style="height: 8px"
        />
        <div class="row q-gutter-sm q-mt-sm">
          <q-badge color="positive" outline :label="`${respondidas - naoConformes} conformes`" />
          <q-badge color="negative" outline :label="`${naoConformes} não conformes`" />
        </div>
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
            <div class="row items-start no-wrap" style="gap: 6px">
              <q-input
                v-model="equipe"
                class="col"
                outlined
                dense
                label="Equipe / Prefixo"
                placeholder="Ex: ALOJ74"
                :rules="[required]"
              />
              <q-btn
                flat
                round
                size="md"
                class="foto-local-btn q-mt-xs"
                @click="abrirModalFotosLocal"
              >
                <q-icon name="mdi-camera-outline" size="22px" :color="fotosLocal.length ? 'primary' : 'grey-5'" />
                <q-badge
                  v-if="fotosLocal.length"
                  floating
                  color="primary"
                  style="font-size: 10px"
                >
                  {{ fotosLocal.length }}
                </q-badge>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Membros da equipe -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label q-mb-md">Membros da equipe</div>
        <div class="column q-gutter-sm">
          <div
            v-for="(membro, idx) in membros"
            :key="idx"
            class="membro-card"
          >
            <div class="row items-center no-wrap q-mb-sm">
              <div class="membro-num">{{ idx + 1 }}</div>
              <span class="text-caption text-weight-medium membro-card__label q-ml-sm">
                Membro {{ idx + 1 }}
              </span>
              <q-space />
              <q-btn
                flat round dense
                icon="mdi-close"
                size="sm"
                color="grey-6"
                :disable="membros.length === 1"
                @click="removerMembro(idx)"
              />
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-input
                  v-model="membro.nome"
                  outlined dense
                  label="Nome"
                  placeholder="Nome do colaborador"
                />
              </div>
              <div class="col-5">
                <q-input
                  v-model="membro.matricula"
                  outlined dense
                  label="Matrícula"
                  placeholder="Ex: 12512"
                />
              </div>
            </div>
          </div>
        </div>

        <q-btn
          flat no-caps dense
          icon="mdi-plus-circle-outline"
          label="Adicionar membro"
          color="primary"
          class="q-mt-md full-width adicionar-btn"
          @click="adicionarMembro"
        />
      </q-card>

      <!-- Categorias -->
      <q-list class="checklist-categories q-gutter-y-sm">
        <q-expansion-item
          v-for="cat in gomanChecklist"
          :key="cat.id"
          v-model="expandedCategories[cat.id]"
          expand-separator
          class="mobile-card checklist-category"
          header-class="q-pa-md"
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
              :id="`pergunta-${pergunta.id}`"
              class="pergunta-card q-pa-md"
              :class="{
                'pergunta-card--answered': respostas[pergunta.id],
                'pergunta-card--focus': proximaPerguntaId === pergunta.id,
              }"
            >
              <div class="row items-start no-wrap q-mb-sm">
                <q-badge outline color="grey-6" class="q-mr-sm">{{ idx + 1 }}</q-badge>
                <div class="col">
                  <div class="text-body2 pergunta-texto">{{ pergunta.texto }}</div>
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
                    :class="{ 'resposta-btn--idle': respostas[pergunta.id] !== 'conforme' }"
                    no-caps
                    unelevated
                    icon="mdi-check-circle"
                    label="Conforme"
                    :color="respostas[pergunta.id] === 'conforme' ? 'positive' : undefined"
                    :text-color="respostas[pergunta.id] === 'conforme' ? 'white' : undefined"
                    @click="setConforme(pergunta.id)"
                  />
                </div>
                <div class="col-6">
                  <q-btn
                    class="full-width resposta-btn"
                    :class="{ 'resposta-btn--idle': respostas[pergunta.id] !== 'nao_conforme' }"
                    no-caps
                    unelevated
                    icon="mdi-close-circle"
                    label="Não conforme"
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
        id="checklist-finalizar"
        type="submit"
        class="full-width btn-primary-lg q-mt-lg q-mb-md"
        color="primary"
        size="lg"
        unelevated
        no-caps
        label="Finalizar"
        icon="mdi-content-save"
        :loading="saving"
        :disable="respondidas < totalPerguntas"
      />
    </q-form>

    <!-- Modal fotos do local -->
    <q-dialog v-model="modalFotosAberto" position="bottom">
      <q-card class="fotos-local-modal">
        <q-card-section class="row items-center q-pb-sm">
          <div>
            <div class="text-subtitle1 text-weight-bold">📸 Fotos do local</div>
            <div class="text-caption text-grey-6">Salvas automaticamente como rascunho</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="fotos-local-grid">
            <div
              v-for="(foto, i) in fotosLocal"
              :key="i"
              class="foto-thumb"
            >
              <img :src="foto" alt="Foto do local" />
              <q-btn
                round dense flat
                icon="mdi-close"
                size="xs"
                color="white"
                class="foto-thumb__del"
                @click="removerFotoLocal(i)"
              />
            </div>

            <div class="foto-add" :class="{ 'foto-add--loading': carregandoFotoLocal }" @click="!carregandoFotoLocal && abrirCameraLocal()">
              <q-spinner v-if="carregandoFotoLocal" color="primary" size="28px" />
              <template v-else>
                <q-icon name="mdi-camera-plus-outline" size="28px" color="grey-5" />
                <div class="text-caption text-grey-5 q-mt-xs">Adicionar</div>
              </template>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

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

          <div
            v-if="modalFotoPreview"
            class="nc-foto-preview q-mb-md"
            @click="abrirCameraNc"
          >
            <img :src="modalFotoPreview" alt="Visualização da foto" />
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
            label="Tirar foto"
            @click="abrirCameraNc"
          />

          <div v-if="fotosLocal.length" class="q-mb-md">
            <div class="field-label q-mb-xs">Fotos do local da auditagem</div>
            <div class="fotos-local-picker">
              <div
                v-for="(foto, i) in fotosLocal"
                :key="i"
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
            @click="confirmarNaoConforme"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <CameraModal v-model="cameraLocalAberta" @captured="onFotoLocalCapturada" />
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
import {
  gomanChecklist,
  totalPerguntasGoman,
  type Gravidade,
  type PerguntaGoman,
  type RespostaChecklist,
} from "@/data/goman-checklist";
import type { RespostaSalva } from "@/types/checklist";
import { compressBase64 } from "@/utils/image";
import { getTrustedTime, ServerTimeError } from "@/utils/server-time";
import { stampAuditPhoto } from "@/utils/photo-stamp";
import { useChecklistDraft } from "@/composables/useChecklistDraft";
import CameraModal from "@/components/CameraModal.vue";

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

// ── Fotos do local com timestamp de servidor ──────────────────────────────────
const draftKey = `cgb-fotos-local-${session.employee?.matricula ?? "anon"}`
const fotosLocal = ref<string[]>([])
const modalFotosAberto = ref(false)
const cameraLocalAberta = ref(false)
const carregandoFotoLocal = ref(false)

onMounted(() => {
  const saved = LocalStorage.getItem<string[]>(draftKey)
  if (saved?.length) fotosLocal.value = saved
})

watch(fotosLocal, (val) => {
  if (val.length) LocalStorage.set(draftKey, val)
  else LocalStorage.remove(draftKey)
}, { deep: true })

function abrirModalFotosLocal() {
  modalFotosAberto.value = true;
}

function abrirCameraLocal() {
  cameraLocalAberta.value = true;
}

// ── Membros ───────────────────────────────────────────────────────────────────
const membros = ref<{ nome: string; matricula: string }[]>(
  Array.from({ length: 6 }, () => ({ nome: "", matricula: "" }))
);
const saving = ref(false);

function adicionarMembro() {
  membros.value.push({ nome: "", matricula: "" });
}

function removerMembro(idx: number) {
  if (membros.value.length > 1) membros.value.splice(idx, 1);
}

const respostas = reactive<Record<string, Exclude<RespostaChecklist, null>>>({});
const detalhesMap = reactive<Record<string, NaoConformeDetalhe>>({});

const modalAberto = ref(false);
const modalPerguntaId = ref<string | null>(null);
const modalPerguntaTexto = ref("");
const modalObservacao = ref("");
const modalFotoPreview = ref<string | null>(null);
const modalTouched = ref(false);
const cameraNcAberta = ref(false);
const modalEraNaoConforme = ref(false);
const proximaPerguntaId = ref<string | null>(null);

const todasPerguntasIds = gomanChecklist.flatMap((cat) =>
  cat.perguntas.map((p) => p.id)
);

const expandedCategories = reactive<Record<string, boolean>>(
  Object.fromEntries(gomanChecklist.map((cat, index) => [cat.id, index === 0]))
);

const { clearDraft: clearChecklistDraft } = useChecklistDraft(
  "GOMAN",
  session.employee?.matricula ?? "anon",
  {
    base,
    equipe,
    membros,
    respostas,
    detalhesMap,
    expandedCategories,
  }
);

const totalPerguntas = totalPerguntasGoman;

async function onFotoLocalCapturada(base64: string) {
  carregandoFotoLocal.value = true;
  try {
    const { date } = await getTrustedTime();
    const compressed = await compressBase64(base64);
    const carimbrada = await stampAuditPhoto(compressed, {
      time: date,
      observer: session.employee?.nomeCompleto ?? session.employee?.nome ?? "—",
      equipe: equipe.value.trim(),
    });
    fotosLocal.value.push(carimbrada);
  } catch (err) {
    const message =
      err instanceof ServerTimeError
        ? err.message
        : "Erro ao processar foto";
    $q.notify({ type: "warning", message, position: "top", timeout: 4500 });
  } finally {
    carregandoFotoLocal.value = false;
  }
}

function removerFotoLocal(idx: number) {
  fotosLocal.value.splice(idx, 1);
}

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
  if (respostas[id] === "conforme") return;
  respostas[id] = "conforme";
  delete detalhesMap[id];
  irParaProximaPergunta(id);
}

function irParaProximaPergunta(fromPerguntaId: string) {
  const fromIndex = todasPerguntasIds.indexOf(fromPerguntaId);
  const nextId = todasPerguntasIds.slice(fromIndex + 1).find((id) => !respostas[id]);

  proximaPerguntaId.value = nextId ?? null;

  if (!nextId) {
    scrollToElement("checklist-finalizar");
    return;
  }

  const categoria = gomanChecklist.find((cat) =>
    cat.perguntas.some((p) => p.id === nextId)
  );
  if (categoria) expandedCategories[categoria.id] = true;

  nextTick(() => {
    window.setTimeout(() => scrollToElement(`pergunta-${nextId}`), 280);
  });
}

function scrollToElement(elementId: string) {
  const el = document.getElementById(elementId);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
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

function abrirCameraNc() {
  cameraNcAberta.value = true;
}

function usarFotoLocal(foto: string) {
  modalFotoPreview.value = foto;
}

async function onFotoNcCapturada(base64: string) {
  try {
    modalFotoPreview.value = await compressBase64(base64);
  } catch {
    $q.notify({ type: "negative", message: "Não foi possível processar a foto", position: "top" });
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
  const answeredId = modalPerguntaId.value;
  modalAberto.value = false;
  modalPerguntaId.value = null;
  irParaProximaPergunta(answeredId);
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

  let dataRegistro: string;
  try {
    const { date } = await getTrustedTime();
    dataRegistro = date.toISOString();
  } catch (err) {
    saving.value = false;
    const message =
      err instanceof ServerTimeError
        ? err.message
        : "Não foi possível obter o horário do servidor.";
    $q.notify({ type: "warning", message, position: "top", timeout: 4500 });
    return;
  }

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
    auditagem: "GOMAN",
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

.nc-modal {
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
}

.hidden-input {
  display: none;
}

.nc-foto-preview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  max-height: 220px;
  cursor: pointer;
  border: 1px dashed rgba(122, 18, 37, 0.25);
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

.foto-local-btn {
  min-width: 36px;
  min-height: 36px;
  flex-shrink: 0;
}

.fotos-local-modal {
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
}

.fotos-local-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.foto-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.foto-thumb__del {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.45) !important;
}

.foto-add:active {
  border-color: var(--q-primary);
}

.foto-add--loading {
  border-color: var(--q-primary);
  opacity: 0.7;
  cursor: wait;
}
</style>
