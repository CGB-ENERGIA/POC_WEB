<template>
  <div class="tl">
    <div class="tl-bloco">
      <div class="tl-bloco__head">
        <q-checkbox
          :model-value="todasEq ? true : (equipesMarcadas.size ? null : false)" dense
          :label="`Equipes (${equipesMarcadas.size} de ${equipes.length})`" @update:model-value="alternarTodasEq"
        />
      </div>
      <div class="tl-bloco__itens">
        <div v-if="!equipes.length" class="tl-vazio">Nenhuma equipe.</div>
        <q-checkbox v-for="eq in equipes" :key="eq.id" dense :model-value="equipesMarcadas.has(eq.id)" @update:model-value="alternarEq(eq.id)">
          <span class="tl-forte">{{ eq.prefixo }}</span>
          <span class="tl-meta">{{ eq.base }} · {{ eq.gerencia }}</span>
        </q-checkbox>
      </div>
    </div>

    <div class="tl-bloco">
      <div class="tl-bloco__head">
        <q-checkbox
          :model-value="todosOb ? true : (observadoresMarcados.size ? null : false)" dense
          :label="`Observadores (${observadoresMarcados.size} de ${observadores.length})`" @update:model-value="alternarTodosOb"
        />
        <q-input v-if="observadores.length > 8" v-model="busca" dense borderless placeholder="Buscar…" class="tl-busca">
          <template #prepend><q-icon name="mdi-magnify" size="16px" /></template>
        </q-input>
      </div>
      <div class="tl-bloco__itens">
        <div v-if="!observadores.length" class="tl-vazio">Nenhum observador.</div>
        <q-checkbox
          v-for="o in observadoresVisiveis" :key="o.matricula" dense
          :model-value="observadoresMarcados.has(o.matricula)" @update:model-value="alternarOb(o.matricula)"
        >
          <span class="tl-forte">{{ o.nome_completo || o.nome }}</span>
          <span class="tl-meta">{{ o.funcao }} · {{ o.gerencia }} {{ o.base }}</span>
          <span v-if="o.ativo === false" class="tl-inativo">inativo</span>
        </q-checkbox>
        <div v-if="observadores.length && !observadoresVisiveis.length" class="tl-vazio">Ninguém com esse nome.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

export interface EquipeLinha {
  id: string;
  prefixo: string;
  base: string;
  gerencia: string;
  coordenador?: string | undefined;
  gerente?: string | undefined;
}
export interface ObservadorLinha {
  matricula: string;
  nome?: string | undefined;
  nome_completo?: string | undefined;
  funcao?: string | undefined;
  gerencia?: string | undefined;
  base?: string | undefined;
  ativo?: boolean | undefined;
  coordenador?: string | null | undefined;
}

const props = defineProps<{ equipes: EquipeLinha[]; observadores: ObservadorLinha[] }>();
const equipesMarcadas = defineModel<Set<string>>("equipesMarcadas", { required: true });
const observadoresMarcados = defineModel<Set<string>>("observadoresMarcados", { required: true });

const busca = ref("");
const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const observadoresVisiveis = computed(() => {
  const q = semAcento(busca.value.trim());
  if (!q) return props.observadores;
  return props.observadores.filter((o) => semAcento(`${o.nome_completo ?? ""} ${o.nome ?? ""} ${o.matricula}`).includes(q));
});

const todasEq = computed(() => props.equipes.length > 0 && equipesMarcadas.value.size === props.equipes.length);
const todosOb = computed(() => props.observadores.length > 0 && observadoresMarcados.value.size === props.observadores.length);

function alternar(conjunto: Set<string>, id: string): Set<string> {
  const n = new Set(conjunto);
  if (n.has(id)) n.delete(id); else n.add(id);
  return n;
}
const alternarEq = (id: string) => { equipesMarcadas.value = alternar(equipesMarcadas.value, id); };
const alternarOb = (id: string) => { observadoresMarcados.value = alternar(observadoresMarcados.value, id); };
const alternarTodasEq = () => { equipesMarcadas.value = todasEq.value ? new Set() : new Set(props.equipes.map((e) => e.id)); };
const alternarTodosOb = () => { observadoresMarcados.value = todosOb.value ? new Set() : new Set(props.observadores.map((o) => o.matricula)); };
</script>

<style scoped>
.tl { display: flex; flex-direction: column; gap: 10px; }
.tl-bloco { border: 1px solid rgba(128,128,128,.3); border-radius: 8px; }
.tl-bloco__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 10px; border-bottom: 1px solid rgba(128,128,128,.25); min-height: 36px; }
.tl-bloco__itens { display: flex; flex-direction: column; gap: 3px; padding: 6px 10px; max-height: 170px; overflow-y: auto; }
.tl-forte { font-weight: 700; font-size: 12.5px; margin-right: 8px; }
.tl-meta { font-size: 12px; opacity: .7; }
.tl-inativo { margin-left: 8px; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #b91c1c; }
.tl-vazio { font-size: 12.5px; opacity: .6; padding: 2px 0; }
.tl-busca { max-width: 150px; }
</style>
