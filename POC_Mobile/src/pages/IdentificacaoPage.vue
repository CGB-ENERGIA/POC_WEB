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

        <!-- ══ 1. Matrícula ══ -->
        <template v-if="step === 'ident'">
          <div class="section-title q-mb-xs">Entrar no POC</div>
          <div class="section-subtitle q-mb-lg">Informe sua matrícula para iniciar a auditagem</div>

          <div class="field-label">Matrícula do colaborador</div>
          <q-select
            v-model="matricula"
            class="input-shell q-mb-md"
            :options="filteredOptions"
            option-label="matricula"
            option-value="matricula"
            emit-value map-options use-input input-debounce="150"
            outlined hide-selected fill-input
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
                  <q-item-label class="text-weight-medium">{{ scope.opt.matricula }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.nomeCompleto }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="grey-2" text-color="grey-8">{{ scope.opt.base }}</q-badge>
                </q-item-section>
              </q-item>
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey-6">Nenhuma matrícula encontrada</q-item-section>
              </q-item>
            </template>
          </q-select>

          <transition name="fade">
            <div v-if="employee" class="employee-chip q-pa-md q-mb-lg">
              <div class="row items-center no-wrap">
                <q-avatar color="primary" text-color="white" size="52px" class="q-mr-md" font-size="18px">
                  {{ initials }}
                </q-avatar>
                <div class="col">
                  <div class="text-caption employee-chip__label">Colaborador identificado</div>
                  <div class="text-subtitle1 text-weight-bold employee-chip__name">{{ employee.nomeCompleto }}</div>
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
            color="primary" size="lg" unelevated no-caps
            label="Continuar" icon-right="mdi-arrow-right"
            :disable="!canContinue" :loading="loading"
            @click="onContinue"
          />
        </template>

        <!-- ══ 2. Escolha de biometria ══ -->
        <template v-else-if="step === 'choice'">
          <div class="text-center q-mb-lg">
            <div class="section-title q-mb-xs">Como deseja entrar?</div>
            <div class="section-subtitle">{{ employee?.nomeCompleto }}</div>
          </div>

          <!-- Face ID (principal) -->
          <q-btn
            v-if="hasFace"
            class="full-width biometric-btn q-mb-sm"
            unelevated no-caps size="lg"
            color="primary"
            @click="step = 'scan-face'"
          >
            <div class="biometric-btn__inner">
              <q-icon name="mdi-face-recognition" size="28px" />
              <div class="biometric-btn__text">
                <span class="biometric-btn__label">Face ID</span>
                <span class="biometric-btn__sub">Reconhecimento facial</span>
              </div>
              <q-icon name="mdi-chevron-right" size="20px" opacity=".6" />
            </div>
          </q-btn>

          <!-- Digital -->
          <q-btn
            v-if="hasDigital"
            class="full-width biometric-btn biometric-btn--alt q-mb-md"
            unelevated no-caps size="lg"
            :color="hasFace ? 'grey-8' : 'primary'"
            @click="step = 'scan-digital'"
          >
            <div class="biometric-btn__inner">
              <q-icon name="mdi-fingerprint" size="28px" />
              <div class="biometric-btn__text">
                <span class="biometric-btn__label">Digital</span>
                <span class="biometric-btn__sub">Biometria do dispositivo</span>
              </div>
              <q-icon name="mdi-chevron-right" size="20px" opacity=".6" />
            </div>
          </q-btn>

          <q-separator class="q-my-md" />

          <q-btn
            flat no-caps color="grey-6"
            label="Entrar pela matrícula"
            icon="mdi-badge-account-outline"
            class="full-width"
            @click="entrarNoSistema()"
          />
          <q-btn flat no-caps color="grey-6" label="Voltar" class="full-width q-mt-xs" @click="voltarIdent" />
        </template>

        <!-- ══ 3a. Scan Face ID ══ -->
        <template v-else-if="step === 'scan-face'">
          <div class="section-title q-mb-xs">Face ID</div>
          <div class="section-subtitle q-mb-md">{{ employee?.nomeCompleto }}</div>
          <transition name="fade">
            <q-banner v-if="scanErro" rounded class="ident-banner ident-banner--err q-mb-md">
              <template #avatar><q-icon name="mdi-alert-circle-outline" color="negative" /></template>
              {{ scanErro }}
            </q-banner>
          </transition>
          <FaceGate
            :key="'face-' + scanKey"
            mode="scan"
            @matched="onFaceMatched"
            @cancel="voltarChoice"
          />
          <transition name="fade">
            <q-btn
              v-if="scanErro"
              flat no-caps color="grey-6"
              label="Entrar pela matrícula"
              icon="mdi-badge-account-outline"
              class="full-width q-mt-sm"
              @click="entrarNoSistema()"
            />
          </transition>
        </template>

        <!-- ══ 3b. Scan Digital ══ -->
        <template v-else-if="step === 'scan-digital'">
          <div class="section-title q-mb-xs">Digital</div>
          <div class="section-subtitle q-mb-md">{{ employee?.nomeCompleto }}</div>
          <DigitalGate
            :key="'dig-' + scanKey"
            mode="scan"
            :matricula="employee?.matricula"
            :credential-ids="credentialIds"
            @matched="onDigitalMatched"
            @cancel="voltarChoice"
          />
        </template>

        <!-- ══ 4. Sugestão de cadastro biométrico (primeiro acesso) ══ -->
        <template v-else-if="step === 'enroll-choice'">
          <div class="text-center q-mb-lg">
            <div class="face-badge q-mx-auto q-mb-md">
              <q-icon name="mdi-shield-check" size="26px" color="primary" />
            </div>
            <div class="section-title q-mb-xs">Ative a biometria</div>
            <div class="section-subtitle">
              Escolha como quer entrar nas próximas vezes. Você pode cadastrar
              agora ou entrar apenas com a matrícula.
            </div>
          </div>

          <q-btn
            class="full-width biometric-btn q-mb-sm"
            unelevated no-caps size="lg" color="primary"
            @click="step = 'enroll-face'"
          >
            <div class="biometric-btn__inner">
              <q-icon name="mdi-face-recognition" size="28px" />
              <div class="biometric-btn__text">
                <span class="biometric-btn__label">Face ID</span>
                <span class="biometric-btn__sub">Exige aprovação do admin</span>
              </div>
            </div>
          </q-btn>

          <q-btn
            class="full-width biometric-btn biometric-btn--alt q-mb-md"
            unelevated no-caps size="lg" color="grey-8"
            @click="step = 'enroll-digital'"
          >
            <div class="biometric-btn__inner">
              <q-icon name="mdi-fingerprint" size="28px" />
              <div class="biometric-btn__text">
                <span class="biometric-btn__label">Digital</span>
                <span class="biometric-btn__sub">Pronto para usar imediatamente</span>
              </div>
            </div>
          </q-btn>

          <q-separator class="q-my-md" />
          <q-btn flat no-caps color="grey-6" label="Entrar sem biometria" class="full-width" @click="entrarNoSistema()" />
        </template>

        <!-- ══ 5a. Cadastro Face ID ══ -->
        <template v-else-if="step === 'enroll-face'">
          <div class="section-title q-mb-xs">Cadastro facial</div>
          <div class="section-subtitle q-mb-md">{{ employee?.nomeCompleto }} · {{ employee?.matricula }}</div>
          <FaceGate
            mode="enroll"
            :matricula="employee?.matricula"
            :nome="employee?.nomeCompleto"
            @enrolled="onFaceEnrolled"
            @cancel="step = 'enroll-choice'"
          />
        </template>

        <!-- ══ 5b. Cadastro Digital ══ -->
        <template v-else-if="step === 'enroll-digital'">
          <div class="section-title q-mb-xs">Cadastrar digital</div>
          <div class="section-subtitle q-mb-md">{{ employee?.nomeCompleto }} · {{ employee?.matricula }}</div>
          <DigitalGate
            mode="enroll"
            :matricula="employee?.matricula"
            :nome="employee?.nomeCompleto"
            @enrolled="onDigitalEnrolled"
            @cancel="step = 'enroll-choice'"
          />
        </template>

        <!-- ══ 6a. Face cadastrada (aguarda aprovação) ══ -->
        <template v-else-if="step === 'enroll-face-done'">
          <div class="text-center">
            <div class="face-badge q-mx-auto q-mb-md" style="border-color:rgba(217,164,65,.5);background:rgba(217,164,65,.08)">
              <q-icon name="mdi-clock-outline" size="26px" color="warning" />
            </div>
            <div class="section-title q-mb-xs">Face ID enviado!</div>
            <div class="section-subtitle q-mb-lg">
              Seu cadastro facial foi enviado para aprovação do administrador.
              Enquanto isso, você já pode entrar pela matrícula ou cadastrar também a digital.
            </div>
            <q-btn class="full-width btn-primary-lg q-mb-sm" color="primary" size="lg" unelevated no-caps label="Entrar agora" @click="entrarNoSistema()" />
            <q-btn class="full-width" flat no-caps color="grey-6" label="Cadastrar digital também" icon="mdi-fingerprint" @click="step = 'enroll-digital'" />
          </div>
        </template>

        <!-- ══ 6b. Digital cadastrada (pode entrar já) ══ -->
        <template v-else-if="step === 'enroll-digital-done'">
          <div class="text-center">
            <div class="face-badge face-badge--ok q-mx-auto q-mb-md">
              <q-icon name="mdi-check" size="28px" color="positive" />
            </div>
            <div class="section-title q-mb-xs">Digital cadastrada!</div>
            <div class="section-subtitle q-mb-lg">
              Agora você pode entrar com sua digital. Nas próximas vezes,
              escolha <b>Digital</b> na tela de biometria.
            </div>
            <q-btn class="full-width btn-primary-lg" color="primary" size="lg" unelevated no-caps label="Entrar no sistema" icon-right="mdi-arrow-right" @click="entrarNoSistema()" />
          </div>
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
import DigitalGate from "@/components/DigitalGate.vue";
import { BRAND } from "@/constants/brand";
import { employees, findByMatricula, type Employee } from "@/data/employees";

const router   = useRouter();
const session  = useSessionStore();
const supabase = getSupabase();

type Step =
  | "ident"
  | "choice"
  | "scan-face" | "scan-digital"
  | "enroll-choice" | "enroll-face" | "enroll-digital"
  | "enroll-face-done" | "enroll-digital-done";

const step         = ref<Step>("ident");
const matricula    = ref("");
const employee     = ref<Employee | null>(null);
const filteredOptions = ref<Employee[]>([...employees]);
const touched      = ref(false);
const loading      = ref(false);
const scanErro     = ref<string | null>(null);
const scanKey      = ref(0);
const hasFace      = ref(false);
const hasDigital   = ref(false);
const credentialIds = ref<string[]>([]);

const canContinue = computed(() => employee.value !== null);
const initials    = computed(() => {
  if (!employee.value) return "";
  return employee.value.nome.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
});

function resolveEmployee(value: string | null) {
  employee.value = value ? findByMatricula(value) ?? null : null;
}

function onMatriculaChange(value: string | null) { resolveEmployee(value); }

function filterMatricula(val: string, update: (fn: () => void) => void) {
  const needle = val.trim().toLowerCase();
  update(() => {
    filteredOptions.value = !needle
      ? [...employees]
      : employees.filter((e) =>
          e.matricula.toLowerCase().includes(needle) ||
          e.nomeCompleto.toLowerCase().includes(needle) ||
          e.nome.toLowerCase().includes(needle)
        );
  });
}

watch(matricula, (val) => { if (typeof val === "string") resolveEmployee(val); });

async function onContinue() {
  if (!employee.value) return;
  loading.value = true;

  try {
    const mat = employee.value.matricula;

    const [faceRes, digRes] = await Promise.all([
      supabase.rpc("mobile_face_status",    { p_matricula: mat }),
      supabase.rpc("mobile_digital_status", { p_matricula: mat }),
    ]);

    hasFace.value    = faceRes.data    === "approved";
    hasDigital.value = digRes.data     === "registered";

    const facePending = faceRes.data === "pending";

    // Carrega os credential IDs para o WebAuthn
    if (hasDigital.value) {
      const { data: creds } = await supabase.rpc("mobile_digital_credentials", { p_matricula: mat });
      credentialIds.value = (creds ?? []).map((r: { credential_id: string }) => r.credential_id);
    }

    if (hasFace.value || hasDigital.value) {
      // Tem pelo menos uma biometria pronta → tela de escolha
      step.value = "choice";
    } else if (facePending) {
      // Face pendente, sem digital → entra pela matrícula com aviso
      entrarNoSistema("Seu cadastro de Face ID está em análise. Após aprovação, use biometria para entrar.");
    } else {
      // Sem biometria → sugere cadastrar
      step.value = "enroll-choice";
    }
  } catch {
    // Sem conexão — entra normalmente
    entrarNoSistema();
  } finally {
    loading.value = false;
  }
}

function entrarNoSistema(aviso?: string) {
  if (!employee.value) return;
  session.login(employee.value, employee.value.gerencia === "SESMT" ? "GSTC" : "GOMAN");
  if (aviso) {
    try { sessionStorage.setItem("cgb:home-notice", aviso); } catch { /* ok */ }
  }
  void router.replace({ name: "home" });
}

function onFaceMatched(matchedMatricula: string) {
  if (matchedMatricula !== employee.value?.matricula) {
    scanErro.value = "O rosto reconhecido não corresponde à matrícula informada.";
    scanKey.value++;
    return;
  }
  entrarNoSistema();
}

function onDigitalMatched() { entrarNoSistema(); }

function onFaceEnrolled()    { step.value = "enroll-face-done"; }
function onDigitalEnrolled() {
  hasDigital.value = true;
  step.value = "enroll-digital-done";
}

function voltarIdent()  { step.value = "ident"; scanErro.value = null; }
function voltarChoice() { step.value = hasFace.value || hasDigital.value ? "choice" : "ident"; scanErro.value = null; }
</script>

<style scoped>
.login-shell { max-width: 440px; margin: 0 auto; width: 100%; }

.face-badge {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(139,28,43,.08); border: 1.5px solid rgba(139,28,43,.3);
  display: flex; align-items: center; justify-content: center;
}
.face-badge--ok { background: rgba(46,204,113,.1); border-color: rgba(46,204,113,.5); }

.ident-banner { background: rgba(217,164,65,.12); font-size: 12.5px; line-height: 1.45; }
.ident-banner--err { background: rgba(224,96,112,.12); }

/* Botões biométricos */
.biometric-btn { border-radius: 12px !important; padding: 0 !important; height: auto !important; }
.biometric-btn--alt { opacity: .88; }

.biometric-btn__inner {
  display: flex; align-items: center; gap: 14px;
  width: 100%; padding: 14px 16px; text-align: left;
}
.biometric-btn__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.biometric-btn__label { font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
.biometric-btn__sub   { font-size: 11px; opacity: .65; font-weight: 400; }
</style>
