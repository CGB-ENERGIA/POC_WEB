<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="pend">
      <q-card-section class="pend__topo">
        <div>
          <div class="text-subtitle1 text-weight-bold">Reprovações sem aviso</div>
          <div class="text-caption text-grey-7">Um aviso por coordenador, com todas as reprovações da equipe dele.</div>
        </div>
        <q-btn flat round dense icon="mdi-close" aria-label="Fechar" v-close-popup />
      </q-card-section>

      <q-list separator class="pend__lista">
        <q-item v-for="g in grupos" :key="g.coordenador || '_sem'" class="pend__linha">
          <q-item-section avatar>
            <q-avatar size="38px" :color="g.coordenador ? 'primary' : 'grey-5'" text-color="white" class="text-weight-bold">
              {{ g.coordenador ? iniciais(g.coordenador) : "?" }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ g.coordenador || "Coordenador não identificado" }}</q-item-label>
            <q-item-label caption>
              {{ g.itens.length }} {{ g.itens.length === 1 ? "reprovação" : "reprovações" }} · {{ observadores(g) }}
            </q-item-label>
            <q-item-label v-if="g.coordenador && !g.temTelefone" caption class="text-warning-dark">Sem telefone cadastrado</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              unelevated no-caps dense class="pend__btn" icon="mdi-whatsapp"
              :label="g.coordenador ? 'Avisar' : 'Escolher'" @click="emit('avisar', g.coordenador)"
            />
          </q-item-section>
        </q-item>
        <q-item v-if="!grupos.length">
          <q-item-section class="text-grey-6 text-center q-py-md">Todas as reprovações já têm aviso.</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { iniciais, type ItemAviso } from "@/lib/aviso-coordenador";

export interface GrupoAviso {
  coordenador: string;
  itens: ItemAviso[];
  temTelefone: boolean;
}

defineProps<{ modelValue: boolean; grupos: GrupoAviso[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "avisar", coordenador: string): void;
}>();

function observadores(g: GrupoAviso): string {
  const nomes = [...new Set(g.itens.map((i) => i.item.observador))];
  return nomes.length <= 2 ? nomes.join(" e ") : `${nomes.slice(0, 2).join(", ")} e +${nomes.length - 2}`;
}
</script>

<style scoped lang="scss">
.pend {
  width: 520px;
  max-width: 96vw;
}
.pend__topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pend__lista {
  max-height: 60vh;
  overflow: auto;
  padding-bottom: 8px;
}
.pend__btn {
  background: #128c4a;
  color: #fff;
  padding: 2px 12px;
  &:hover { background: #0f7a40; }
}
</style>
