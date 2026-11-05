<template>
  <q-dialog v-model="aberto" maximized-on-mobile>
    <q-card class="af">
      <q-card-section class="af__topo">
        <div>
          <div class="af__titulo">Auditoria de fotos repetidas</div>
          <div class="af__sub">Procura a mesma imagem usada como evidência em checklists diferentes.</div>
        </div>
        <q-btn flat round dense icon="mdi-close" v-close-popup aria-label="Fechar" />
      </q-card-section>

      <q-card-section class="af__controles">
        <q-select
          v-model="dias" :options="opcoesDias" emit-value map-options dense outlined
          style="width:170px" aria-label="Período" :disable="carregando || calculando"
        />
        <q-btn
          unelevated color="primary" no-caps icon="mdi-image-search-outline" label="Procurar"
          :loading="carregando" :disable="calculando" @click="procurar"
        />
        <q-toggle v-model="mostrarReenvios" dense label="Mostrar reenvios (mesma equipe e dia)" />
      </q-card-section>

      <q-card-section v-if="erro" class="af__erro">{{ erro }}</q-card-section>

      <q-card-section v-if="resumo" class="af__resumo">
        <strong>{{ resumo.fotos }}</strong> fotos analisadas ·
        <strong>{{ gruposVisiveis.length }}</strong>
        {{ gruposVisiveis.length === 1 ? "imagem repetida" : "imagens repetidas" }}
        <template v-if="ocultos > 0"> ({{ ocultos }} {{ ocultos === 1 ? "reenvio oculto" : "reenvios ocultos" }})</template>
      </q-card-section>

      <q-card-section v-if="resumo && resumo.semMarcador > 0" class="af__calculo">
        <div>
          <strong>{{ resumo.semMarcador }}</strong> fotos antigas ainda não foram analisadas. O cálculo é feito aqui no seu
          navegador (baixa cada foto); pode levar alguns minutos e pode ser interrompido.
        </div>
        <q-btn
          v-if="!calculando" outline color="primary" no-caps icon="mdi-calculator-variant-outline" label="Calcular fotos antigas"
          @click="calcularAntigas"
        />
        <q-btn v-else outline color="negative" no-caps icon="mdi-stop" label="Parar" @click="parar = true" />
        <q-linear-progress
          v-if="calculando || feitas > 0" :value="resumo.semMarcador ? feitas / totalParaCalcular : 1" class="af__barra" rounded
        />
        <div v-if="calculando || feitas > 0" class="af__prog">{{ feitas }} de {{ totalParaCalcular }}{{ falhas ? ` · ${falhas} sem leitura` : "" }}</div>
      </q-card-section>

      <q-card-section v-if="resumo && !gruposVisiveis.length && !carregando" class="af__vazio">
        Nenhuma foto repetida encontrada neste período.
      </q-card-section>

      <q-card-section class="af__lista">
        <div v-for="(g, gi) in gruposVisiveis" :key="gi" class="af__grupo">
          <div class="af__grupo-topo">
            <span class="af__chip" :class="g.reenvio ? 'af__chip--neutro' : 'af__chip--alerta'">
              {{ g.reenvio ? "Reenvio?" : "Reaproveitada" }}
            </span>
            <span class="af__chip af__chip--info">{{ g.checklists }} checklists</span>
            <span v-if="g.temParecida" class="af__chip af__chip--info">parecida</span>
          </div>
          <div class="af__fotos">
            <div v-for="f in g.fotos" :key="f.id" class="af__item">
              <img v-if="urlDe(f.r2Key)" :src="urlDe(f.r2Key)!" class="af__img" loading="lazy" alt="Foto repetida" @click="$emit('abrir', urlDe(f.r2Key)!)" />
              <div class="af__dados">
                <strong>{{ f.equipe }}</strong><br />
                {{ f.observador }}<br />
                {{ formatarDataHora(f.data) }} · foto {{ f.sortOrder + 1 }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  agruparRepeticoes, calcularEGravarMarcador, fetchFotosParaAuditoria,
  type FotoAuditoria, type GrupoRepetido,
} from "@/lib/foto-repetida";
import { formatarDataHora } from "@/lib/semanas";

const props = defineProps<{ urlDe: (chave: string) => string | null }>();
const emit = defineEmits<{ (e: "abrir", url: string): void; (e: "calculadas"): void }>();
const aberto = defineModel<boolean>({ default: false });

const opcoesDias = [
  { label: "Últimos 30 dias", value: 30 },
  { label: "Últimos 90 dias", value: 90 },
  { label: "Últimos 180 dias", value: 180 },
  { label: "Último ano", value: 365 },
];
const dias = ref(90);
const mostrarReenvios = ref(false);
const carregando = ref(false);
const erro = ref<string | null>(null);
const todas = ref<FotoAuditoria[]>([]);
const grupos = ref<GrupoRepetido[]>([]);
const resumo = ref<{ fotos: number; semMarcador: number } | null>(null);

const gruposVisiveis = computed(() => (mostrarReenvios.value ? grupos.value : grupos.value.filter((g) => !g.reenvio)));
const ocultos = computed(() => (mostrarReenvios.value ? 0 : grupos.value.filter((g) => g.reenvio).length));

function desdeISO(): string {
  const d = new Date(Date.now() - dias.value * 86_400_000 - 3 * 3_600_000);
  return d.toISOString().slice(0, 10);
}

async function procurar() {
  carregando.value = true;
  erro.value = null;
  try {
    const { fotos, semMarcador } = await fetchFotosParaAuditoria(desdeISO());
    todas.value = fotos;
    grupos.value = agruparRepeticoes(fotos);
    resumo.value = { fotos: fotos.length, semMarcador };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    erro.value = /sha256|dhash/i.test(msg)
      ? "O banco ainda não recebeu a atualização das fotos repetidas (migração 20261106000000). Peça para aplicá-la e tente de novo."
      : `Não foi possível carregar as fotos: ${msg}`;
  } finally {
    carregando.value = false;
  }
}

// ── Cálculo das fotos antigas ─────────────────────────────────────────────────
const calculando = ref(false);
const parar = ref(false);
const feitas = ref(0);
const falhas = ref(0);
const totalParaCalcular = ref(0);

async function calcularAntigas() {
  const fila = todas.value.filter((f) => !f.sha256 && props.urlDe(f.r2Key));
  if (!fila.length) return;
  calculando.value = true;
  parar.value = false;
  feitas.value = 0;
  falhas.value = 0;
  totalParaCalcular.value = fila.length;
  let i = 0;
  async function trabalhador() {
    while (!parar.value) {
      const f = fila[i++];
      if (!f) return;
      try {
        const ok = await calcularEGravarMarcador({ id: f.id, url: props.urlDe(f.r2Key)! });
        if (!ok) falhas.value++;
      } catch {
        falhas.value++;
      }
      feitas.value++;
    }
  }
  await Promise.all(Array.from({ length: 4 }, trabalhador));
  calculando.value = false;
  emit("calculadas");
  await procurar(); // refaz a busca já com as fotos calculadas
}
</script>

<style scoped>
.af { width: min(1040px, 96vw); max-width: 96vw; max-height: 92vh; display: flex; flex-direction: column; }
.af__topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.af__titulo { font-size: 17px; font-weight: 700; }
.af__sub { font-size: 13px; opacity: .75; margin-top: 2px; }
.af__controles { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding-top: 0; }
.af__erro { color: #b91c1c; font-size: 13px; }
.af__resumo { font-size: 13px; padding-block: 0 8px; }
.af__calculo { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; font-size: 12.5px; background: rgba(100,116,139,.1); margin: 0 16px 8px; border-radius: 8px; }
.af__calculo > div:first-child { flex: 1 1 320px; min-width: 0; }
.af__barra { flex: 1 1 100%; }
.af__prog { flex: 1 1 100%; font-size: 12px; opacity: .75; }
.af__vazio { font-size: 13px; opacity: .7; }
.af__lista { overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.af__grupo { border: 1px solid rgba(128,128,128,.3); border-radius: 10px; padding: 10px; }
.af__grupo-topo { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.af__chip { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.af__chip--alerta { background: rgba(234,88,12,.15); color: #c2410c; }
.af__chip--neutro { background: rgba(100,116,139,.16); color: #475569; }
.af__chip--info { background: rgba(100,116,139,.12); }
.af__fotos { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.af__item { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.af__img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 8px; background: rgba(128,128,128,.14); cursor: zoom-in; }
.af__dados { font-size: 11.5px; line-height: 1.4; }
</style>
