<template>
  <q-dialog v-model="aberto" persistent :maximized="$q.screen.lt.sm">
    <q-card class="tc-card">
      <q-card-section class="tc-head">
        <div>
          <div class="tc-title">Trocar coordenação</div>
          <div class="tc-sub">Tudo que era de um coordenador (equipes e observadores) passa para o outro. Vale para todo o histórico dos relatórios.</div>
        </div>
        <q-btn flat round dense icon="mdi-close" :disable="salvando" @click="aberto = false" />
      </q-card-section>

      <q-card-section class="tc-body">
        <q-btn-toggle
          v-model="modo" no-caps unelevated spread toggle-color="primary" color="grey-3" text-color="grey-8"
          :options="[
            { label: 'Passar tudo para outro', value: 'passar' },
            { label: 'Trocar entre dois', value: 'trocar' },
          ]"
        />

        <!-- Passar equipes de um coordenador para outro -->
        <template v-if="modo === 'passar'">
          <q-select
            v-model="de" :options="opcoesDe" label="Coordenador atual" dense outlined emit-value map-options
          />
          <div v-if="de" class="tc-lista">
            <div class="tc-lista__head">
              <q-checkbox
                :model-value="todasMarcadas ? true : (marcadas.size ? null : false)" dense
                :label="`Equipes (${marcadas.size} de ${equipesDe.length})`" @update:model-value="alternarTodas"
              />
            </div>
            <div class="tc-lista__itens">
              <q-checkbox
                v-for="eq in equipesDe" :key="eq.id" dense
                :model-value="marcadas.has(eq.id)" @update:model-value="alternar(eq.id)"
              >
                <span class="tc-prefixo">{{ eq.prefixo }}</span>
                <span class="tc-meta">{{ eq.base }} · {{ eq.gerencia }}</span>
              </q-checkbox>
            </div>
          </div>
          <q-select
            v-model="para" :options="opcoesPara" label="Novo coordenador" dense outlined use-input input-debounce="0"
            new-value-mode="add-unique" hint="Escolha um da lista ou digite um nome novo" hide-bottom-space
            @filter="filtrarPara"
          />
          <q-checkbox
            v-if="de" v-model="levarObservadores" dense
            :label="`Passar também os observadores (${observadoresDe.length})`"
          />
          <div class="tc-extra">
            <div class="tc-extra__titulo">Também mudar (opcional, nas equipes marcadas)</div>
            <div class="tc-extra__linha">
              <q-select v-model="novaGerencia" :options="gerenciasOpts" label="Gerência" dense outlined clearable />
              <q-select v-model="novaBase" :options="basesOpts" label="Base" dense outlined clearable />
              <q-select v-model="novoGerente" :options="gerentesOpts" label="Gerente" dense outlined clearable use-input new-value-mode="add-unique" />
            </div>
          </div>
        </template>

        <!-- Trocar duas coordenações -->
        <template v-else>
          <q-select v-model="c1" :options="opcoesTodos" label="Coordenador 1" dense outlined emit-value map-options />
          <q-select v-model="c2" :options="opcoesTodos" label="Coordenador 2" dense outlined emit-value map-options />
          <div v-if="c1 && c1 === c2" class="tc-aviso">Escolha dois coordenadores diferentes.</div>
          <div v-else-if="c1 && c2" class="tc-dica">
            Tudo de {{ c1 }} (equipes: {{ equipesDoCoord(c1).length }}, observadores: {{ observadoresDoCoord(c1).length }}) passa para {{ c2 }},
            e tudo de {{ c2 }} (equipes: {{ equipesDoCoord(c2).length }}, observadores: {{ observadoresDoCoord(c2).length }}) passa para {{ c1 }}.
          </div>
          <q-checkbox v-if="c1 && c2 && c1 !== c2" v-model="levarObservadores" dense label="Trocar também os observadores" />
        </template>

        <!-- Prévia -->
        <div v-if="mudancas.length || mudancasObservadores.length" class="tc-previa">
          <div class="tc-previa__titulo">
            {{ mudancas.length }} equipe{{ mudancas.length !== 1 ? 's' : '' }}
            e {{ mudancasObservadores.length }} observador{{ mudancasObservadores.length !== 1 ? 'es' : '' }} vão mudar
          </div>
          <div v-if="resumoObservadores" class="tc-meta q-mb-xs">Observadores: {{ resumoObservadores }}</div>
          <div class="tc-previa__lista">
            <div v-for="m in mudancas" :key="m.eq.id" class="tc-previa__linha">
              <span class="tc-prefixo">{{ m.eq.prefixo }}</span>
              <span class="tc-meta">{{ m.eq.coordenador || '—' }} → <b>{{ m.coordenador }}</b></span>
              <span v-if="m.resumoExtra" class="tc-meta">· {{ m.resumoExtra }}</span>
            </div>
          </div>
        </div>
        <div v-if="erro" class="tc-aviso">{{ erro }}</div>
      </q-card-section>

      <q-card-actions class="tc-foot">
        <q-btn flat no-caps label="Cancelar" :disable="salvando" @click="aberto = false" />
        <q-btn
          unelevated no-caps color="primary" icon="mdi-swap-horizontal"
          :label="totalMudancas ? `Aplicar (${mudancas.length} equipes, ${mudancasObservadores.length} observadores)` : 'Aplicar'"
          :disable="!totalMudancas" :loading="salvando" @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { supabase } from "@/lib/supabase";
import { foldName } from "@/lib/dashboard";

interface EquipeLinha {
  id: string;
  prefixo: string;
  base: string;
  gerencia: string;
  coordenador?: string | undefined;
  gerente?: string | undefined;
}

const props = defineProps<{
  modelValue: boolean;
  equipes: EquipeLinha[];
  gerentes: string[];
  /** Funcionários/observadores (employees): cada um tem o seu coordenador. */
  observadores: { matricula: string; coordenador?: string | null | undefined }[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "aplicada"): void;
}>();

const $q = useQuasar();
const aberto = computed({ get: () => props.modelValue, set: (v) => emit("update:modelValue", v) });

const modo = ref<"passar" | "trocar">("passar");
const de = ref<string | null>(null);
const para = ref<string | null>(null);
const marcadas = ref<Set<string>>(new Set());
const novaGerencia = ref<string | null>(null);
const novaBase = ref<string | null>(null);
const novoGerente = ref<string | null>(null);
const c1 = ref<string | null>(null);
const c2 = ref<string | null>(null);
const levarObservadores = ref(true);
const salvando = ref(false);
const erro = ref("");

const gerenciasOpts = ["ADM", "GERE", "GOMAN", "GSTC", "LOGISTICA", "OFICINA", "SESMT", "SPOT"];
const basesOpts = ["BCB", "BDC", "ITM", "PDS", "PDT", "STI"];
const gerentesOpts = computed(() => props.gerentes);

/** Coordenadores que têm equipe (um nome só por pessoa, sem diferença de maiúsculas e acentos). */
const coordenadores = computed(() => {
  const mapa = new Map<string, { nome: string; n: number }>();
  for (const eq of props.equipes) {
    const nome = (eq.coordenador ?? "").trim();
    if (!nome) continue;
    const k = foldName(nome);
    const atual = mapa.get(k);
    mapa.set(k, { nome: atual?.nome ?? nome, n: (atual?.n ?? 0) + 1 });
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
});
const opcoesDe = computed(() => coordenadores.value.map((c) => ({ label: `${c.nome} (${c.n} equipe${c.n !== 1 ? "s" : ""})`, value: c.nome })));
const opcoesTodos = opcoesDe;

const nomesPara = computed(() => coordenadores.value.map((c) => c.nome));
const opcoesPara = ref<string[]>([]);
watch(nomesPara, (v) => { opcoesPara.value = v; }, { immediate: true });
function filtrarPara(val: string, update: (fn: () => void) => void) {
  update(() => {
    const q = foldName(val);
    opcoesPara.value = q ? nomesPara.value.filter((n) => foldName(n).includes(q)) : nomesPara.value;
  });
}

function equipesDoCoord(nome: string | null): EquipeLinha[] {
  if (!nome) return [];
  const k = foldName(nome);
  return props.equipes.filter((e) => foldName(e.coordenador ?? "") === k).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
}
function observadoresDoCoord(nome: string | null): { matricula: string; coordenador?: string | null | undefined }[] {
  if (!nome) return [];
  const k = foldName(nome);
  return props.observadores.filter((o) => foldName(o.coordenador ?? "") === k);
}
const equipesDe = computed(() => equipesDoCoord(de.value));
const observadoresDe = computed(() => observadoresDoCoord(de.value));
const todasMarcadas = computed(() => equipesDe.value.length > 0 && marcadas.value.size === equipesDe.value.length);

// ao escolher o coordenador, todas as equipes dele já vêm marcadas
watch(de, () => { marcadas.value = new Set(equipesDe.value.map((e) => e.id)); });
function alternar(id: string) {
  const n = new Set(marcadas.value);
  if (n.has(id)) n.delete(id); else n.add(id);
  marcadas.value = n;
}
function alternarTodas() {
  marcadas.value = todasMarcadas.value ? new Set() : new Set(equipesDe.value.map((e) => e.id));
}

interface Mudanca {
  eq: EquipeLinha;
  coordenador: string;
  gerencia?: string;
  base?: string;
  gerente?: string;
  resumoExtra: string;
}

/** O que vai mudar, equipe a equipe (a prévia e o que é gravado saem desta mesma lista). */
const mudancas = computed<Mudanca[]>(() => {
  if (modo.value === "trocar") {
    if (!c1.value || !c2.value || foldName(c1.value) === foldName(c2.value)) return [];
    const a = c1.value, b = c2.value;
    return [
      ...equipesDoCoord(a).map((eq) => ({ eq, coordenador: b, resumoExtra: "" })),
      ...equipesDoCoord(b).map((eq) => ({ eq, coordenador: a, resumoExtra: "" })),
    ];
  }
  const novo = (para.value ?? "").trim();
  if (!de.value || !novo) return [];
  return equipesDe.value
    .filter((eq) => marcadas.value.has(eq.id))
    .map((eq) => {
      const extras: string[] = [];
      const m: Mudanca = { eq, coordenador: novo, resumoExtra: "" };
      if (novaGerencia.value && novaGerencia.value !== eq.gerencia) { m.gerencia = novaGerencia.value; extras.push(`gerência ${eq.gerencia} → ${novaGerencia.value}`); }
      if (novaBase.value && novaBase.value !== eq.base) { m.base = novaBase.value; extras.push(`base ${eq.base} → ${novaBase.value}`); }
      if (novoGerente.value && novoGerente.value !== (eq.gerente ?? "")) { m.gerente = novoGerente.value; extras.push(`gerente ${eq.gerente || "—"} → ${novoGerente.value}`); }
      m.resumoExtra = extras.join(" · ");
      return m;
    })
    // passar para o mesmo coordenador sem mudar mais nada não é mudança
    .filter((m) => foldName(m.eq.coordenador ?? "") !== foldName(m.coordenador) || m.gerencia || m.base || m.gerente);
});

interface MudancaObs { matricula: string; de: string; para: string }

/** Observadores que trocam de coordenador (a prévia e o que é gravado saem desta lista). */
const mudancasObservadores = computed<MudancaObs[]>(() => {
  if (!levarObservadores.value) return [];
  if (modo.value === "trocar") {
    if (!c1.value || !c2.value || foldName(c1.value) === foldName(c2.value)) return [];
    const a = c1.value, b = c2.value;
    return [
      ...observadoresDoCoord(a).map((o) => ({ matricula: o.matricula, de: a, para: b })),
      ...observadoresDoCoord(b).map((o) => ({ matricula: o.matricula, de: b, para: a })),
    ];
  }
  const novo = (para.value ?? "").trim();
  if (!de.value || !novo || foldName(novo) === foldName(de.value)) return [];
  return observadoresDe.value.map((o) => ({ matricula: o.matricula, de: de.value!, para: novo }));
});

const resumoObservadores = computed(() => {
  const cont = new Map<string, number>();
  for (const m of mudancasObservadores.value) cont.set(`${m.de} → ${m.para}`, (cont.get(`${m.de} → ${m.para}`) ?? 0) + 1);
  return [...cont.entries()].map(([k, n]) => `${k} (${n})`).join(" · ");
});

const totalMudancas = computed(() => mudancas.value.length + mudancasObservadores.value.length);

watch(modo, () => { erro.value = ""; });
watch(aberto, (v) => {
  if (!v) return;
  modo.value = "passar";
  de.value = null; para.value = null; c1.value = null; c2.value = null; levarObservadores.value = true;
  marcadas.value = new Set();
  novaGerencia.value = null; novaBase.value = null; novoGerente.value = null;
  erro.value = "";
});

async function confirmar() {
  const lista = mudancas.value;
  const listaObs = mudancasObservadores.value;
  if (!lista.length && !listaObs.length) return;
  salvando.value = true;
  erro.value = "";
  try {
    // em lotes, para não abrir centenas de conexões de uma vez
    for (let i = 0; i < lista.length; i += 15) {
      const lote = lista.slice(i, i + 15);
      const resultados = await Promise.all(lote.map((m) => {
        const campos: Record<string, string> = { coordenador: m.coordenador };
        if (m.gerencia) campos.gerencia = m.gerencia;
        if (m.base) campos.base = m.base;
        if (m.gerente) campos.gerente = m.gerente;
        return supabase.from("pwa_equipes").update(campos).eq("id", m.eq.id);
      }));
      const falha = resultados.find((r) => r.error);
      if (falha?.error) throw new Error(falha.error.message);
    }
    // observadores: agrupa por novo coordenador e grava em lotes
    const porNovo = new Map<string, string[]>();
    for (const m of listaObs) porNovo.set(m.para, [...(porNovo.get(m.para) ?? []), m.matricula]);
    for (const [novo, matriculas] of porNovo) {
      for (let i = 0; i < matriculas.length; i += 100) {
        const { error } = await supabase.from("employees").update({ coordenador: novo }).in("matricula", matriculas.slice(i, i + 100));
        if (error) throw new Error(error.message);
      }
    }
    $q.notify({
      type: "positive", position: "top",
      message: `Coordenação trocada: ${lista.length} equipe${lista.length !== 1 ? "s" : ""} e ${listaObs.length} observador${listaObs.length !== 1 ? "es" : ""}.`,
    });
    emit("aplicada");
    aberto.value = false;
  } catch (e) {
    erro.value = `Não foi possível concluir: ${(e as Error).message}. Confira a lista de equipes antes de repetir (parte pode ter sido gravada).`;
  } finally {
    salvando.value = false;
  }
}
</script>

<style scoped>
.tc-card { width: 560px; max-width: 100%; display: flex; flex-direction: column; }
.tc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 8px; }
.tc-title { font-size: 18px; font-weight: 800; }
.tc-sub { font-size: 12px; opacity: .7; margin-top: 2px; line-height: 1.35; }
.tc-body { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; max-height: calc(100vh - 190px); }
.tc-lista { border: 1px solid rgba(128,128,128,.3); border-radius: 8px; }
.tc-lista__head { padding: 6px 10px; border-bottom: 1px solid rgba(128,128,128,.25); }
.tc-lista__itens { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; max-height: 190px; overflow-y: auto; }
.tc-prefixo { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; margin-right: 8px; }
.tc-meta { font-size: 12px; opacity: .75; }
.tc-extra__titulo { font-size: 12px; font-weight: 700; margin-bottom: 6px; opacity: .8; }
.tc-extra__linha { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tc-previa { border: 1px solid rgba(153,27,27,.35); border-radius: 8px; padding: 10px 12px; }
.tc-previa__titulo { font-size: 13px; font-weight: 800; margin-bottom: 6px; }
.tc-previa__lista { display: flex; flex-direction: column; gap: 3px; max-height: 170px; overflow-y: auto; }
.tc-previa__linha { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 4px; }
.tc-aviso { font-size: 12.5px; color: #b91c1c; font-weight: 600; }
.tc-dica { font-size: 12.5px; opacity: .8; }
.tc-foot { padding: 10px 16px 14px; justify-content: flex-end; gap: 8px; }
@media (max-width: 599px) {
  .tc-body { max-height: none; flex: 1; }
  .tc-card { height: 100%; }
  .tc-extra__linha { grid-template-columns: 1fr; }
}
</style>
