<template>
  <q-page class="mobile-page mobile-page--centered hero-surface q-pa-md">
    <div class="full-width login-shell">
      <div class="text-center q-mb-lg relative-position" style="z-index: 1">
        <BrandLogo
          :size="88"
          show-text
          stacked
          :title="BRAND.product"
          :subtitle="BRAND.tagline"
        />
      </div>

      <q-card flat class="mobile-card q-pa-lg relative-position" style="z-index: 1">
        <div class="section-title q-mb-xs">Entrar no POC</div>
        <div class="section-subtitle q-mb-lg">
          Informe sua matrícula para iniciar a auditagem
        </div>

        <div class="field-label">Matrícula do colaborador</div>
        <q-select
          v-model="matricula"
          class="input-shell q-mb-md"
          :options="filteredOptions"
          option-label="matricula"
          option-value="matricula"
          emit-value
          map-options
          use-input
          input-debounce="150"
          outlined
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
            <q-item v-bind="scope.itemProps" class="q-py-sm">
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ scope.opt.matricula }}
                </q-item-label>
                <q-item-label caption>{{ scope.opt.nomeCompleto }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="grey-2" text-color="grey-8">{{ scope.opt.base }}</q-badge>
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

        <transition name="fade">
          <div v-if="employee" class="employee-chip q-pa-md q-mb-lg">
            <div class="row items-center no-wrap">
              <q-avatar
                color="primary"
                text-color="white"
                size="52px"
                class="q-mr-md"
                font-size="18px"
              >
                {{ initials }}
              </q-avatar>
              <div class="col">
                <div class="text-caption employee-chip__label">Colaborador identificado</div>
                <div class="text-subtitle1 text-weight-bold employee-chip__name">
                  {{ employee.nomeCompleto }}
                </div>
                <div class="text-caption employee-chip__meta q-mt-xs">
                  {{ employee.funcao }} · {{ employee.base }} · {{ employee.gerencia }}
                </div>
              </div>
              <q-icon name="mdi-check-circle" color="positive" size="22px" />
            </div>
          </div>
        </transition>

        <q-btn
          class="full-width btn-primary-lg q-mt-md"
          color="primary"
          size="lg"
          unelevated
          no-caps
          label="Continuar"
          icon-right="mdi-arrow-right"
          :disable="!canContinue"
          :loading="loading"
          @click="onContinue"
        />
      </q-card>

      <div class="text-center text-caption text-grey-6 q-mt-lg relative-position" style="z-index: 1">
        <q-icon name="mdi-cellphone-link" size="14px" class="q-mr-xs" />
        Otimizado para celulares e tablets
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import BrandLogo from "@/components/BrandLogo.vue";
import { BRAND } from "@/constants/brand";
import {
  employees,
  findByMatricula,
  type Employee,
} from "@/data/employees";
const router = useRouter();
const session = useSessionStore();

const matricula = ref("");
const employee = ref<Employee | null>(null);
const filteredOptions = ref<Employee[]>([...employees]);
const touched = ref(false);
const loading = ref(false);

const canContinue = computed(() => employee.value !== null);

const initials = computed(() => {
  if (!employee.value) return "";
  return employee.value.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
});

function resolveEmployee(value: string | null) {
  employee.value = value ? findByMatricula(value) ?? null : null;
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
  if (!employee.value) return;
  loading.value = true;
  session.login(employee.value, employee.value.gerencia === "SESMT" ? "GSTC" : "GOMAN");
  await router.replace({ name: "home" });
  loading.value = false;
}
</script>

<style scoped>
.login-shell {
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
}
</style>
