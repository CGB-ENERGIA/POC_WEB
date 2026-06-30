<template>
  <q-page class="mobile-page q-pa-md">
    <q-form @submit.prevent="onSubmit">
      <!-- Base e Equipe -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label">Local</div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-select
              v-model="form.base"
              :options="basesOperacionais"
              outlined
              dense
              label="Base"
              :rules="[required]"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="form.equipe"
              outlined
              dense
              label="Equipe / Prefixo"
              placeholder="Ex: ALOJ74"
              :rules="[required]"
            />
          </div>
        </div>
      </q-card>

      <!-- Categoria -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label">Categoria</div>
        <div class="row q-col-gutter-sm q-mb-md">
          <div
            v-for="cat in categorias"
            :key="cat.id"
            class="col-6"
          >
            <q-btn
              :outline="form.categoriaId !== cat.id"
              :unelevated="form.categoriaId === cat.id"
              :color="form.categoriaId === cat.id ? 'primary' : 'grey-4'"
              :text-color="form.categoriaId === cat.id ? 'white' : 'grey-8'"
              class="full-width"
              no-caps
              style="border-radius: 12px; min-height: 56px"
              @click="selectCategoria(cat.id)"
            >
              <div class="column items-center">
                <q-icon :name="cat.icon" size="20px" />
                <div class="text-caption q-mt-xs">{{ cat.label }}</div>
              </div>
            </q-btn>
          </div>
        </div>

        <q-select
          v-if="categoriaSelecionada"
          v-model="form.item"
          :options="categoriaSelecionada.items"
          outlined
          dense
          label="Item verificado"
          :rules="[required]"
        />
      </q-card>

      <!-- Tipo e Severidade -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-md">
        <div class="field-label">Classificação</div>
        <div class="row q-col-gutter-xs q-mb-md">
          <div v-for="tipo in tiposObservacao" :key="tipo.value" class="col-4">
            <q-btn
              :outline="form.tipo !== tipo.value"
              :unelevated="form.tipo === tipo.value"
              :color="form.tipo === tipo.value ? tipo.color : 'grey-4'"
              :text-color="form.tipo === tipo.value ? 'white' : 'grey-8'"
              class="full-width"
              no-caps
              style="border-radius: 10px"
              @click="form.tipo = tipo.value as typeof form.tipo"
            >
              <q-icon :name="tipo.icon" size="18px" class="q-mr-xs" />
              {{ tipo.label }}
            </q-btn>
          </div>
        </div>

        <q-select
          v-if="form.tipo === 'inconforme'"
          v-model="form.severidade"
          :options="severidades"
          outlined
          dense
          label="Severidade"
          :rules="[required]"
        />
      </q-card>

      <!-- Descrição -->
      <q-card flat bordered class="mobile-card q-pa-md q-mb-lg">
        <div class="field-label">Descrição da observação</div>
        <q-input
          v-model="form.descricao"
          type="textarea"
          outlined
          autogrow
          rows="4"
          placeholder="Descreva o que foi observado..."
          :rules="[required, minLen]"
        />
      </q-card>

      <q-btn
        type="submit"
        class="full-width"
        color="primary"
        size="lg"
        unelevated
        no-caps
        rounded
        label="Salvar observação"
        icon="mdi-content-save"
        :loading="saving"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import {
  basesOperacionais,
  categorias,
  severidades,
  tiposObservacao,
} from "@/data/checklist";

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();
const observacoes = useObservacoesStore();

const saving = ref(false);

const form = reactive({
  base: session.employee?.base ?? "",
  equipe: "",
  categoriaId: "",
  item: "",
  tipo: "inconforme" as "conforme" | "inconforme" | "feedback",
  severidade: "Média",
  descricao: "",
});

const categoriaSelecionada = computed(() =>
  categorias.find((c) => c.id === form.categoriaId)
);

function selectCategoria(id: string) {
  form.categoriaId = id;
  form.item = "";
}

const required = (v: string) => !!v?.trim() || "Campo obrigatório";
const minLen = (v: string) =>
  v.trim().length >= 10 || "Mínimo de 10 caracteres";

async function onSubmit() {
  if (!session.employee || !categoriaSelecionada.value) return;

  saving.value = true;
  observacoes.add({
    matricula: session.employee.matricula,
    observador: session.employee.nome,
    auditagem: session.auditagem!,
    base: form.base,
    equipe: form.equipe.trim(),
    categoria: categoriaSelecionada.value.label,
    item: form.item,
    tipo: form.tipo,
    severidade: form.tipo === "inconforme" ? form.severidade : "—",
    descricao: form.descricao.trim(),
    resolvido: form.tipo === "conforme",
  });

  $q.notify({
    type: "positive",
    message: "Observação registrada com sucesso!",
    icon: "mdi-check-circle",
    position: "top",
  });

  await router.replace({ name: "home" });
  saving.value = false;
}
</script>
