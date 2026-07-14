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

        <!-- ══ Passo 1: identificação por matrícula ══ -->
        <template v-if="step === 'ident'">
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

          <transition name="fade">
            <q-banner v-if="identNotice" rounded class="ident-banner q-mb-md">
              <template #avatar>
                <q-icon name="mdi-clock-outline" color="warning" />
              </template>
              {{ identNotice }}
            </q-banner>
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
        </template>

        <!-- ══ Passo 2a: cadastro facial obrigatório (primeiro acesso) ══ -->
        <template v-else-if="step === 'enroll-intro'">
          <div class="text-center q-mb-md">
            <div class="face-badge q-mx-auto q-mb-md">
              <q-icon name="mdi-face-recognition" size="26px" color="primary" />
            </div>
            <div class="section-title q-mb-xs">Cadastro facial obrigatório</div>
            <div class="section-subtitle">
              Por segurança, a entrada no checklist é feita por reconhecimento
              facial. Cadastre seu rosto para continuar — após a aprovação do
              administrador, você entrará apenas com o Face ID.
            </div>
          </div>

          <q-btn
            class="full-width btn-primary-lg q-mt-md"
            color="primary"
            size="lg"
            unelevated
            no-caps
            label="Configurar Face ID"
            icon="mdi-face-recognition"
            @click="step = 'enroll'"
          />
          <q-btn
            class="full-width q-mt-sm"
            flat
            no-caps
            color="grey-7"
            label="Voltar"
            @click="voltarIdent"
          />
        </template>

        <!-- ══ Passo 2b: captura guiada ══ -->
        <template v-else-if="step === 'enroll'">
          <div class="section-title q-mb-xs">Cadastro facial</div>
          <div class="section-subtitle q-mb-md">
            {{ employee?.nomeCompleto }} · {{ employee?.matricula }}
          </div>
          <FaceGate
            mode="enroll"
            :matricula="employee?.matricula"
            :nome="employee?.nomeCompleto"
            @enrolled="onEnrolled"
            @cancel="voltarIdent"
          />
        </template>

        <!-- ══ Passo 2c: cadastro enviado ══ -->
        <template v-else-if="step === 'enroll-done'">
          <div class="text-center">
            <div class="face-badge face-badge--ok q-mx-auto q-mb-md">
              <q-icon name="mdi-check" size="28px" color="positive" />
            </div>
            <div class="section-title q-mb-xs">Cadastro enviado</div>
            <div class="section-subtitle q-mb-lg">
              Seu cadastro facial foi enviado para aprovação do administrador.
              Após a aprovação, entre usando o <b>Face ID</b>.
            </div>
            <q-btn
              class="full-width btn-primary-lg"
              color="primary"
              size="lg"
              unelevated
              no-caps
              label="Entendi"
              @click="voltarIdent"
            />
          </div>
        </template>

        <!-- ══ Passo 3: entrada por Face ID ══ -->
        <template v-else-if="step === 'scan'">
          <div class="section-title q-mb-xs">Face ID</div>
          <div class="section-subtitle q-mb-md">
            {{ employee?.nomeCompleto }} · posicione seu rosto para entrar
          </div>
          <transition name="fade">
            <q-banner v-if="scanErro" rounded class="ident-banner ident-banner--err q-mb-md">
              <template #avatar>
                <q-icon name="mdi-alert-circle-outline" color="negative" />
              </template>
              {{ scanErro }}
            </q-banner>
          </transition>
          <FaceGate
            :key="scanKey"
            mode="scan"
            @matched="onFaceMatched"
            @cancel="voltarIdent"
          />
        </template>

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
import { getSupabase } from "@/lib/supabase";
import BrandLogo from "@/components/BrandLogo.vue";
import FaceGate from "@/components/FaceGate.vue";
import { BRAND } from "@/constants/brand";
import {
  employees,
  findByMatricula,
  type Employee,
} from "@/data/employees";

const router = useRouter();
const session = useSessionStore();
const supabase = getSupabase();

type Step = "ident" | "enroll-intro" | "enroll" | "enroll-done" | "scan";
const step = ref<Step>("ident");

const matricula = ref("");
const employee = ref<Employee | null>(null);
const filteredOptions = ref<Employee[]>([...employees]);
const touched = ref(false);
const loading = ref(false);
const identNotice = ref<string | null>(null);
const scanErro = ref<string | null>(null);
const scanKey = ref(0);

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
  identNotice.value = null;
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
  identNotice.value = null;

  // Decide o fluxo pelo status do cadastro facial da matrícula
  const { data, error } = await supabase.rpc("mobile_face_status", {
    p_matricula: employee.value.matricula,
  });
  loading.value = false;

  if (error) {
    // Sem conexão com o Supabase: mantém o fluxo antigo para não travar o campo
    entrarNoSistema();
    return;
  }

  if (data === "approved") {
    scanErro.value = null;
    step.value = "scan";
  } else if (data === "pending") {
    identNotice.value =
      "Seu cadastro facial está aguardando aprovação do administrador.";
  } else {
    step.value = "enroll-intro";
  }
}

function entrarNoSistema() {
  if (!employee.value) return;
  session.login(
    employee.value,
    employee.value.gerencia === "SESMT" ? "GSTC" : "GOMAN"
  );
  void router.replace({ name: "home" });
}

function onFaceMatched(matchedMatricula: string) {
  if (matchedMatricula !== employee.value?.matricula) {
    scanErro.value =
      "O rosto reconhecido não corresponde à matrícula informada.";
    scanKey.value++; // reinicia o scanner
    return;
  }
  entrarNoSistema();
}

function onEnrolled() {
  step.value = "enroll-done";
}

function voltarIdent() {
  step.value = "ident";
  scanErro.value = null;
}
</script>

<style scoped>
.login-shell {
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
}

.face-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(139, 28, 43, 0.08);
  border: 1.5px solid rgba(139, 28, 43, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.face-badge--ok {
  background: rgba(46, 204, 113, 0.1);
  border-color: rgba(46, 204, 113, 0.5);
}

.ident-banner {
  background: rgba(217, 164, 65, 0.12);
  font-size: 12.5px;
  line-height: 1.45;
}
.ident-banner--err {
  background: rgba(224, 96, 112, 0.12);
}
</style>
