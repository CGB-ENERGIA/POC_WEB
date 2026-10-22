<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @hide="aoFechar">
    <q-card class="aviso">
      <q-card-section class="aviso__topo">
        <div class="aviso__titulo">
          <q-icon name="mdi-bell-ring-outline" size="22px" color="primary" />
          <div>
            <div class="text-subtitle1 text-weight-bold">Avisar coordenador</div>
            <div class="text-caption text-grey-7">{{ subtitulo }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="mdi-close" aria-label="Fechar" v-close-popup />
      </q-card-section>

      <q-card-section class="aviso__corpo">
        <!-- Coordenador -->
        <div v-if="nome" class="aviso__coord">
          <q-avatar size="40px" color="primary" text-color="white" class="text-weight-bold">{{ iniciais(nome) }}</q-avatar>
          <div class="aviso__coord-info">
            <div class="text-weight-bold">{{ nome }}</div>
            <div v-if="contato?.telefone" class="text-caption text-grey-7 aviso__tel">
              <q-icon name="mdi-whatsapp" size="14px" /> {{ formatarTelefone(contato.telefone) }}
            </div>
            <div v-else class="text-caption text-warning-dark">Sem telefone cadastrado</div>
          </div>
        </div>
        <template v-else>
          <div class="text-body2 q-mb-sm">
            Este observador não tem coordenador cadastrado. Escolha quem deve receber o aviso:
          </div>
          <q-select
            v-model="escolhido" :options="opcoes" dense outlined emit-value map-options
            label="Coordenador" options-dense
          />
        </template>

        <!-- Telefone que falta -->
        <div v-if="nome && !contato?.telefone" class="aviso__tel-form">
          <q-input
            v-model="telefoneNovo" dense outlined inputmode="tel" mask="(##) #####-####"
            label="WhatsApp com DDD" unmasked-value hint="Ex.: (99) 98469-8713"
            :error="!!erroTel" :error-message="erroTel" @keyup.enter="salvarNovoTelefone"
          />
          <q-btn
            unelevated color="primary" label="Salvar telefone" no-caps
            :loading="salvandoTel" :disable="telefoneNovo.length < 10" @click="salvarNovoTelefone"
          />
        </div>

        <!-- Mensagem -->
        <template v-if="nome">
          <div class="aviso__rotulo">Mensagem</div>
          <div class="aviso__chat">
            <q-input
              v-model="mensagem" type="textarea" autogrow borderless dense
              class="aviso__bolha" input-class="aviso__bolha-texto" aria-label="Mensagem do WhatsApp"
            />
          </div>
          <div v-if="parcial" class="text-caption text-grey-7 q-mt-xs">
            Esta mensagem leva {{ incluidos.length }} de {{ itens.length }} reprovações; as demais ficam para o próximo aviso.
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            Abre o WhatsApp com a mensagem pronta: é só enviar. O aviso fica registrado no checklist.
          </div>
        </template>
      </q-card-section>

      <q-card-actions class="aviso__acoes">
        <q-btn flat no-caps color="grey-8" label="Agora não" v-close-popup />
        <q-space />
        <q-btn outline no-caps color="grey-8" icon="mdi-content-copy" label="Copiar" :disable="!mensagem" @click="copiar" />
        <q-btn
          unelevated no-caps class="aviso__zap" icon="mdi-whatsapp" label="Abrir no WhatsApp"
          :loading="enviando" :disable="!podeEnviar" @click="abrirWhatsapp"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import {
  contatoDe, formatarTelefone, iniciais, linkWhatsapp, montarMensagem, montarResumo, normalizarTelefone,
  registrarAvisos, salvarTelefone,
  type AvisoCtx, type AvisoRow, type ContatoCoord, type ItemAviso,
} from "@/lib/aviso-coordenador";

const props = defineProps<{
  modelValue: boolean;
  /** Coordenador já identificado; null deixa o analista escolher. */
  coordenador: string | null;
  itens: ItemAviso[];
  ctx: AvisoCtx;
  enviadoPor: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "avisado", rows: AvisoRow[]): void;
  (e: "contato-salvo", c: ContatoCoord): void;
}>();

const $q = useQuasar();

const escolhido = ref<string | null>(null);
const telefoneNovo = ref("");
const erroTel = ref("");
const salvandoTel = ref(false);
const enviando = ref(false);
const mensagem = ref("");

const nome = computed(() => props.coordenador ?? escolhido.value);
const contato = computed(() => contatoDe(nome.value, props.ctx));
const opcoes = computed(() => props.ctx.contatos.filter((c) => c.telefone).map((c) => c.nome));

const resumo = computed(() => (props.itens.length > 1 ? montarResumo(nome.value, props.itens) : null));
const incluidos = computed(() => resumo.value?.incluidos ?? props.itens.map((i) => i.item.id));
const parcial = computed(() => incluidos.value.length < props.itens.length);

const subtitulo = computed(() => {
  const n = props.itens.length;
  if (n === 1) return `${props.itens[0]!.item.observador} · ${props.itens[0]!.item.equipe}`;
  return `${n} checklists reprovados`;
});

const podeEnviar = computed(() => !!contato.value?.telefone && !!mensagem.value.trim());

function gerarMensagem() {
  if (!nome.value || !props.itens.length) { mensagem.value = ""; return; }
  mensagem.value = resumo.value ? resumo.value.texto : montarMensagem(nome.value, props.itens[0]!);
}

watch(() => [props.modelValue, nome.value, props.itens], () => {
  if (props.modelValue) gerarMensagem();
}, { immediate: true });
watch(() => props.modelValue, (aberto) => {
  if (aberto) { escolhido.value = null; telefoneNovo.value = ""; erroTel.value = ""; }
});

function aoFechar() {
  enviando.value = false;
}

async function salvarNovoTelefone() {
  if (!nome.value) return;
  const tel = normalizarTelefone(telefoneNovo.value);
  if (!tel) { erroTel.value = "Número inválido: informe DDD + número."; return; }
  erroTel.value = "";
  salvandoTel.value = true;
  try {
    await salvarTelefone(nome.value, tel);
    emit("contato-salvo", { nome: nome.value, telefone: tel });
    telefoneNovo.value = "";
    $q.notify({ type: "positive", message: `Telefone de ${nome.value} salvo.`, position: "top", timeout: 2500 });
  } catch (e) {
    erroTel.value = `Não foi possível salvar: ${(e as Error).message}`;
  } finally {
    salvandoTel.value = false;
  }
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(mensagem.value);
    $q.notify({ type: "positive", message: "Mensagem copiada.", position: "top", timeout: 2000 });
  } catch {
    $q.notify({ type: "warning", message: "Não foi possível copiar: selecione o texto e copie manualmente.", position: "top" });
  }
}

async function abrirWhatsapp() {
  const tel = contato.value?.telefone;
  if (!tel || !nome.value) return;
  // abre antes de qualquer await para o navegador não bloquear a janela
  window.open(linkWhatsapp(tel, mensagem.value), "_blank", "noopener");
  enviando.value = true;
  try {
    const rows = await registrarAvisos(incluidos.value, nome.value, props.enviadoPor);
    emit("avisado", rows);
    $q.notify({
      type: "positive", position: "top", timeout: 3500,
      message: `Aviso a ${nome.value} registrado. Confirme o envio no WhatsApp.`,
    });
    emit("update:modelValue", false);
  } catch (e) {
    $q.notify({
      type: "warning", position: "top", timeout: 6000,
      message: `WhatsApp aberto, mas o registro do aviso falhou: ${(e as Error).message}`,
    });
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped lang="scss">
.aviso {
  width: 480px;
  max-width: 96vw;
}
.aviso__topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 4px;
}
.aviso__titulo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.aviso__corpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.aviso__coord {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.aviso__coord-info { min-width: 0; }
.aviso__tel { display: flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
.aviso__tel-form {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  .q-input { flex: 1; min-width: 0; }
  .q-btn { margin-top: 2px; }
}
.aviso__rotulo {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: -4px;
}
.aviso__chat {
  background: #efeae2;
  border-radius: 10px;
  padding: 14px;
  max-height: 46vh;
  overflow: auto;
}
.aviso__bolha {
  background: #d9fdd3;
  border-radius: 10px 10px 10px 2px;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(17, 27, 33, 0.18);
}
:deep(.aviso__bolha-texto) {
  color: #111b21;
  font-size: 14px;
  line-height: 1.45;
  padding: 0;
}
.aviso__acoes {
  padding: 8px 16px 16px;
  gap: 8px;
  flex-wrap: wrap;
}
.aviso__zap {
  background: #128c4a;
  color: #fff;
  &:hover { background: #0f7a40; }
}
</style>
