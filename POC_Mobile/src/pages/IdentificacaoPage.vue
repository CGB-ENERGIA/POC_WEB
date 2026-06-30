<template>
  <q-page class="mobile-page flex flex-center q-pa-md">
    <div class="full-width" style="max-width: 420px">
      <!-- Logo / Header -->
      <div class="text-center q-mb-xl">
        <div
          class="inline-flex items-center justify-center q-mb-md"
          style="
            width: 72px;
            height: 72px;
            border-radius: 20px;
            background: linear-gradient(135deg, #8B1C2B, #b91c3c);
          "
        >
          <q-icon name="mdi-clipboard-check-outline" size="36px" color="white" />
        </div>
        <div class="text-h5 text-weight-bold text-grey-9">CGB Checklist</div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          Observações de Segurança
        </div>
      </div>

      <!-- Card -->
      <q-card flat bordered class="mobile-card q-pa-lg">
        <div class="field-label">Matrícula do colaborador</div>
        <q-select
          v-model="matricula"
          :options="filteredOptions"
          option-label="matricula"
          option-value="matricula"
          emit-value
          map-options
          use-input
          input-debounce="150"
          outlined
          dense
          hide-selected
          fill-input
          placeholder="Digite ou selecione a matrícula"
          :error="touched && !employee && matricula.length > 0"
          error-message="Matrícula não encontrada"
          @filter="filterMatricula"
          @update:model-value="onMatriculaChange"
          @blur="touched = true"
        >
          <template #prepend>
            <q-icon name="mdi-badge-account-outline" color="primary" />
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.matricula }}</q-item-label>
                <q-item-label caption>{{ scope.opt.nomeCompleto }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="grey-4" text-color="grey-8">{{ scope.opt.base }}</q-badge>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey-6">
                Nenhuma matrícula encontrada
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Nome auto-preenchido -->
        <transition name="fade">
          <div v-if="employee" class="employee-chip q-pa-md q-mt-lg">
            <div class="row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="48px" class="q-mr-md">
                <q-icon name="mdi-account" />
              </q-avatar>
              <div class="col">
                <div class="text-caption text-grey-6">Colaborador identificado</div>
                <div class="text-subtitle1 text-weight-bold text-grey-9">
                  {{ employee.nomeCompleto }}
                </div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ employee.funcao }} · {{ employee.base }} · {{ employee.gerencia }}
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Categoria de auditagem -->
        <transition name="fade">
          <div v-if="employee" class="q-mt-lg">
            <div class="field-label">Categoria de auditagem</div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="cat in categoriasAuditagem"
                :key="cat.value"
                class="col-6"
              >
                <q-btn
                  :outline="auditagem !== cat.value"
                  :unelevated="auditagem === cat.value"
                  :color="auditagem === cat.value ? 'primary' : 'grey-4'"
                  :text-color="auditagem === cat.value ? 'white' : 'grey-8'"
                  class="full-width auditagem-btn"
                  no-caps
                  @click="auditagem = cat.value"
                >
                  <div class="column items-center q-py-xs">
                    <q-icon :name="cat.icon" size="22px" />
                    <div class="text-subtitle2 text-weight-bold q-mt-xs">
                      {{ cat.label }}
                    </div>
                    <div
                      class="text-caption q-mt-xs"
                      :class="auditagem === cat.value ? 'text-white' : 'text-grey-6'"
                      style="line-height: 1.2"
                    >
                      {{ cat.descricao }}
                    </div>
                  </div>
                </q-btn>
              </div>
            </div>
          </div>
        </transition>

        <q-btn
          class="full-width q-mt-xl"
          color="primary"
          size="lg"
          unelevated
          no-caps
          rounded
          label="Continuar"
          icon-right="mdi-arrow-right"
          :disable="!canContinue"
          :loading="loading"
          @click="onContinue"
        />
      </q-card>

      <div class="text-center text-caption text-grey-5 q-mt-lg">
        Uso exclusivo para celulares e tablets
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import {
  employees,
  findByMatricula,
  type Employee,
} from "@/data/employees";
import {
  categoriasAuditagem,
  type AuditagemCategoria,
} from "@/data/auditagem";

const router = useRouter();
const session = useSessionStore();

const matricula = ref("");
const employee = ref<Employee | null>(null);
const auditagem = ref<AuditagemCategoria | null>(null);
const filteredOptions = ref<Employee[]>([...employees]);
const touched = ref(false);
const loading = ref(false);

const canContinue = computed(() => employee.value !== null && auditagem.value !== null);

function resolveEmployee(value: string | null) {
  employee.value = value ? findByMatricula(value) ?? null : null;
  if (!employee.value) auditagem.value = null;
}

function onMatriculaChange(value: string | null) {
  resolveEmployee(value);
}

function filterMatricula(val: string, update: (fn: () => void) => void) {
  const needle = val.trim().toLowerCase();
  update(() => {
    if (!needle) {
      filteredOptions.value = [...employees];
      return;
    }
    filteredOptions.value = employees.filter(
      (e) =>
        e.matricula.toLowerCase().includes(needle) ||
        e.nomeCompleto.toLowerCase().includes(needle) ||
        e.nome.toLowerCase().includes(needle)
    );
  });
}

watch(matricula, (val) => {
  if (typeof val === "string") resolveEmployee(val);
});

async function onContinue() {
  if (!employee.value || !auditagem.value) return;
  loading.value = true;
  session.login(employee.value, auditagem.value);
  await router.replace({ name: "home" });
  loading.value = false;
}
</script>

<style scoped>
.auditagem-btn {
  border-radius: 12px;
  min-height: 96px;
}
</style>
