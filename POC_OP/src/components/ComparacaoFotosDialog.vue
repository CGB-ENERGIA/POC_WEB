<template>
  <q-dialog v-model="aberto" maximized-on-mobile>
    <q-card class="cf">
      <q-card-section class="cf__topo">
        <div>
          <div class="cf__titulo">Comparar fotos</div>
          <div class="cf__sub">
            A foto de {{ atual.rotulo }} aparece também em {{ matches.length === 1 ? "outro checklist" : `${matches.length} outros checklists` }}.
          </div>
        </div>
        <q-btn flat round dense icon="mdi-close" v-close-popup aria-label="Fechar" />
      </q-card-section>

      <q-card-section v-if="par" class="cf__faixa">
        <span class="cf__selo" :class="par.tipo === 'identica' ? 'cf__selo--forte' : 'cf__selo--media'">
          <q-icon :name="par.tipo === 'identica' ? 'mdi-content-duplicate' : 'mdi-image-multiple-outline'" size="14px" />
          {{ par.tipo === "identica" ? "Mesma foto (arquivo idêntico)" : `Muito parecida (diferença ${par.distancia}/64)` }}
        </span>
        <span class="cf__selo" :class="reenvio ? 'cf__selo--neutro' : 'cf__selo--alerta'">
          <q-icon :name="reenvio ? 'mdi-send-clock-outline' : 'mdi-alert-outline'" size="14px" />
          {{ reenvio ? "Mesma equipe, mesmo dia: provável reenvio" : "Outra data ou equipe: possível reaproveitamento" }}
        </span>
        <div v-if="matches.length > 1" class="cf__nav">
          <q-btn flat round dense icon="mdi-chevron-left" :disable="indice === 0" aria-label="Anterior" @click="indice--" />
          <span>{{ indice + 1 }} de {{ matches.length }}</span>
          <q-btn flat round dense icon="mdi-chevron-right" :disable="indice === matches.length - 1" aria-label="Próxima" @click="indice++" />
        </div>
      </q-card-section>

      <q-card-section v-if="par" class="cf__lado-a-lado">
        <figure class="cf__fig">
          <figcaption class="cf__legenda cf__legenda--atual">Este checklist</figcaption>
          <img v-if="atual.url" :src="atual.url" class="cf__img" alt="Foto deste checklist" @click="$emit('abrir', atual.url!)" />
          <div class="cf__dados">
            <strong>{{ atual.equipe }}</strong> · {{ atual.observador }}<br />
            <template v-if="atual.enviadoTexto">Enviado {{ atual.enviadoTexto }}<br />Checklist/foto de {{ atual.dataTexto }}</template>
            <template v-else>{{ atual.dataTexto }}</template><span v-if="atual.codigo" class="cf__codigo">#{{ atual.codigo }}</span>
          </div>
        </figure>
        <figure class="cf__fig">
          <figcaption class="cf__legenda">Já enviada antes</figcaption>
          <img v-if="urlDoPar" :src="urlDoPar" class="cf__img" alt="Foto enviada antes" @click="$emit('abrir', urlDoPar!)" />
          <div class="cf__dados">
            <strong>{{ par.equipe }}</strong> · {{ par.observador }}<br />
            <template v-if="envioDoPar">Enviado {{ envioDoPar }}<br />Checklist/foto de {{ dataDoPar }}</template>
            <template v-else>{{ dataDoPar }}</template><span v-if="par.sha256" class="cf__codigo">#{{ par.sha256.slice(0, 6).toUpperCase() }}</span>
          </div>
        </figure>
      </q-card-section>

      <q-card-section class="cf__dica">
        Confira se o cenário (local, pessoas, viatura) é de fato o mesmo antes de reprovar: duas fotos tiradas do mesmo
        ponto podem parecer iguais.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { FotoRepetida } from "@/lib/foto-repetida";
import { provavelReenvio } from "@/lib/foto-repetida";
import { formatarDataHora, diaLocalISO } from "@/lib/semanas";

export interface FotoAtual {
  rotulo: string;
  url: string | null;
  equipe: string;
  observador: string;
  data: string;
  dataTexto: string;
  /** Horário real de envio, quando difere do dia do checklist. */
  enviadoTexto?: string | null;
  codigo: string | null;
}

const props = defineProps<{
  atual: FotoAtual;
  matches: FotoRepetida[];
  urlDe: (chave: string) => string | null;
}>();
defineEmits<{ (e: "abrir", url: string): void }>();
const aberto = defineModel<boolean>({ default: false });

const indice = ref(0);
watch(() => props.matches, () => { indice.value = 0; });

const par = computed(() => props.matches[indice.value] ?? null);
const urlDoPar = computed(() => (par.value ? props.urlDe(par.value.r2Key) : null));
const dataDoPar = computed(() => (par.value ? formatarDataHora(par.value.data) : ""));
const envioDoPar = computed(() => {
  const p = par.value;
  if (!p?.enviadoEm || diaLocalISO(p.enviadoEm) === diaLocalISO(p.data)) return "";
  return formatarDataHora(p.enviadoEm);
});
const reenvio = computed(() => !!par.value && provavelReenvio(props.atual, par.value));
</script>

<style scoped>
.cf { width: min(960px, 96vw); max-width: 96vw; }
.cf__topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.cf__titulo { font-size: 17px; font-weight: 700; }
.cf__sub { font-size: 13px; opacity: .75; margin-top: 2px; }
.cf__faixa { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 0; }
.cf__selo { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
.cf__selo--forte { background: rgba(220, 38, 38, .12); color: #b91c1c; }
.cf__selo--media { background: rgba(217, 119, 6, .14); color: #b45309; }
.cf__selo--alerta { background: rgba(217, 119, 6, .14); color: #b45309; }
.cf__selo--neutro { background: rgba(100, 116, 139, .16); color: #475569; }
.cf__nav { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; }
.cf__lado-a-lado { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cf__fig { margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.cf__legenda { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; opacity: .65; }
.cf__legenda--atual { color: #8B1C2B; opacity: 1; }
.cf__img { width: 100%; max-height: 52vh; object-fit: contain; border-radius: 8px; background: rgba(128, 128, 128, .14); cursor: zoom-in; }
.cf__dados { font-size: 12.5px; line-height: 1.5; }
.cf__codigo { margin-left: 8px; font-family: ui-monospace, monospace; font-weight: 700; font-size: 11.5px; opacity: .8; }
.cf__dica { font-size: 12px; opacity: .7; padding-top: 0; }
@media (max-width: 640px) { .cf__lado-a-lado { grid-template-columns: 1fr; } }
</style>
