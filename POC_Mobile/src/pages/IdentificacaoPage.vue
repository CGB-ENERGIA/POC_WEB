<template>
  <q-page
    class="hero-surface ip-page"
    :class="{ 'ip--compact': isCompact, 'ip--tablet': isTablet }"
  >

    <!-- ══ BRANDING (só aparece em tablet, coluna esquerda) ══════════════════ -->
    <aside class="ip-brand">
      <div class="ip-brand__inner">
        <BrandLogo
          :size="120"
          show-text
          stacked
          :title="BRAND.product"
          :subtitle="BRAND.tagline"
          class="ip-brand__logo"
        />
        <p class="ip-brand__desc">
          Sistema de monitoramento comportamental<br>em campo para equipes CGB.
        </p>
        <div class="ip-brand__orbs" aria-hidden="true">
          <span class="ip-orb ip-orb--1" />
          <span class="ip-orb ip-orb--2" />
          <span class="ip-orb ip-orb--3" />
        </div>
      </div>
    </aside>

    <!-- ══ FORM SHELL ════════════════════════════════════════════════════════ -->
    <div class="ip-shell">

      <!-- Logo (mobile only) -->
      <div class="ip-logo-mobile text-center q-mb-md">
        <BrandLogo
          :size="logoSize"
          show-text
          stacked
          :title="BRAND.product"
          :subtitle="BRAND.tagline"
        />
      </div>

      <q-card flat class="mobile-card ip-card relative-position" style="z-index: 1">

        <!-- ══ 1. Matrícula ══ -->
        <template v-if="step === 'ident'">
          <div class="section-title q-mb-xs">Entrar no POC</div>
          <div class="section-subtitle q-mb-md">Informe sua matrícula para iniciar a auditagem</div>

          <div class="field-label">Matrícula do colaborador</div>
          <q-select
            v-model="matricula"
            class="input-shell q-mb-sm"
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
            <div v-if="employee" class="employee-chip ip-employee-chip q-mb-md">
              <div class="row items-center no-wrap">
                <q-avatar color="primary" text-color="white" :size="isCompact ? '42px' : '52px'" class="q-mr-md" font-size="16px">
                  {{ initials }}
                </q-avatar>
                <div class="col">
                  <div class="text-caption employee-chip__label">Colaborador identificado</div>
                  <div class="text-subtitle1 text-weight-bold employee-chip__name ip-emp-name">{{ employee.nomeCompleto }}</div>
                  <div class="text-caption employee-chip__meta q-mt-xs">
                    {{ employee.funcao }} · {{ employee.base }} · {{ employee.gerencia }}
                  </div>
                </div>
                <q-icon name="mdi-check-circle" color="positive" size="22px" />
              </div>
            </div>
          </transition>

          <q-btn
            class="full-width btn-primary-lg"
            color="primary" size="lg" unelevated no-caps
            label="Continuar" icon-right="mdi-arrow-right"
            :disable="!canContinue" :loading="loading"
            @click="onContinue"
          />
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
          <q-btn
            v-if="hasDigital"
            flat no-caps color="grey-6"
            label="Usar digital"
            icon="mdi-fingerprint"
            class="full-width q-mt-sm"
            @click="step = 'scan-digital'"
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
            @enroll-here="enrollDigitalAqui"
          />
          <q-btn
            v-if="hasFace"
            flat no-caps color="grey-6"
            label="Usar Face ID"
            icon="mdi-face-recognition"
            class="full-width q-mt-sm"
            @click="step = 'scan-face'"
          />
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
            @cancel="step = 'ident'"
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
            @cancel="step = enrollDigitalFrom"
          />
        </template>

        <!-- ══ 6a. Face cadastrada ══ -->
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

        <!-- ══ 6b. Digital cadastrada ══ -->
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

      <!-- Footer -->
      <div class="ip-footer text-caption">
        <q-icon name="mdi-cellphone-link" size="14px" class="q-mr-xs" />
        Otimizado para celulares e tablets
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
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

// ── Viewport reactivo ─────────────────────────────────────────────────────────
const viewW = ref(window.innerWidth);
const viewH = ref(window.innerHeight);
function onResize() { viewW.value = window.innerWidth; viewH.value = window.innerHeight; }
onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));

const isTablet  = computed(() => viewW.value >= 768);
const isCompact = computed(() => viewH.value < 660 && !isTablet.value);
const logoSize  = computed(() => {
  if (viewH.value < 580) return 52;
  if (viewH.value < 680) return 66;
  return 88;
});

// ── Steps ─────────────────────────────────────────────────────────────────────
type Step =
  | "ident"
  | "scan-face" | "scan-digital"
  | "enroll-face" | "enroll-digital"
  | "enroll-face-done" | "enroll-digital-done";

const step         = ref<Step>("ident");
const matricula    = ref("");
const employee     = ref<Employee | null>(null);
const filteredOptions = ref<Employee[]>([...employees]);
const touched      = ref(false);
const loading      = ref(false);
const scanErro     = ref<string | null>(null);
const scanKey      = ref(0);
const hasFace           = ref(false);
const hasDigital        = ref(false);
const credentialIds     = ref<string[]>([]);
const enrollDigitalFrom = ref<Step>("ident");

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

    hasFace.value    = faceRes.data === "approved";
    hasDigital.value = digRes.data  === "registered";

    if (hasDigital.value) {
      const { data: creds } = await supabase.rpc("mobile_digital_credentials", { p_matricula: mat });
      credentialIds.value = (creds ?? []).map((r: { credential_id: string }) => r.credential_id);
      step.value = "scan-digital";
    } else if (hasFace.value) {
      step.value = "scan-face";
    } else {
      enrollDigitalFrom.value = "ident";
      step.value = "enroll-digital";
    }
  } catch {
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

function enrollDigitalAqui() {
  enrollDigitalFrom.value = "ident";
  step.value = "enroll-digital";
}

function onFaceEnrolled()    { step.value = "enroll-face-done"; }
function onDigitalEnrolled() {
  hasDigital.value = true;
  step.value = "enroll-digital-done";
}

function voltarIdent()  { step.value = "ident"; scanErro.value = null; }
function voltarChoice() { step.value = "ident"; scanErro.value = null; }
</script>

<style scoped>
/* ── Layout base ─────────────────────────────────────────────────────────────*/
.ip-page {
  min-height: 100dvh;       /* dvh: height excluding mobile browser chrome */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  max-width: 100%;          /* override mobile-page max-width on this page */
}

/* ── Branding aside (hidden on mobile) ───────────────────────────────────────*/
.ip-brand {
  display: none;
}

/* ── Mobile form shell ───────────────────────────────────────────────────────*/
.ip-shell {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ip-logo-mobile {
  display: block;
  margin-bottom: 16px;
}

/* ── Card padding adaptive ────────────────────────────────────────────────────*/
.ip-card {
  padding: 24px;
}
.ip--compact .ip-card {
  padding: 18px 16px;
}

/* ── Employee name truncation ─────────────────────────────────────────────────*/
.ip-emp-name {
  font-size: 14px;
  line-height: 1.3;
}
.ip-employee-chip {
  padding: 12px 14px;
}
.ip--compact .ip-employee-chip {
  padding: 10px 12px;
}

/* ── Footer ──────────────────────────────────────────────────────────────────*/
.ip-footer {
  text-align: center;
  color: rgba(100, 116, 139, 0.6);
  margin-top: 14px;
  font-size: 11px;
}
.ip--compact .ip-footer {
  margin-top: 8px;
}

/* ── Compact mode: shrink gaps ───────────────────────────────────────────────*/
.ip--compact .ip-logo-mobile {
  margin-bottom: 10px;
}

/* ── Very small phones (≤ 360px width) ───────────────────────────────────────*/
@media (max-width: 360px) {
  .ip-page     { padding: 14px 12px; }
  .ip-card     { padding: 16px 14px; }
}

/* ── Large phones (≥ 430px) slight breathing room ────────────────────────────*/
@media (min-width: 430px) and (max-width: 767px) {
  .ip-shell    { max-width: 460px; }
  .ip-card     { padding: 28px; }
}

/* ═════════════════════════════════════════════════════════════════════════════
   TABLET LAYOUT (≥ 768px) — coluna esquerda branding + coluna direita form
   ═════════════════════════════════════════════════════════════════════════════*/
@media (min-width: 768px) {
  .ip-page {
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    padding: 0;
    gap: 0;
  }

  /* Left: branding */
  .ip-brand {
    display: flex;
    flex: 1 1 45%;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(196,33,58,.35) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 80%, rgba(92,14,28,.5) 0%, transparent 50%),
      linear-gradient(145deg, #7a1225 0%, #5c0e1c 50%, #3d0912 100%);
    position: relative;
    overflow: hidden;
    padding: 48px 40px;
    flex-direction: column;
  }

  .ip-brand__inner {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0;
  }

  /* Force white text inside brand panel */
  .ip-brand :deep(*) { color: #fff !important; }
  .ip-brand :deep(.brand-logo__sub) { opacity: .75; }

  .ip-brand__desc {
    margin: 24px 0 0;
    font-size: 13.5px;
    line-height: 1.65;
    color: rgba(255,255,255,.65) !important;
    max-width: 280px;
  }

  /* Decorative orbs */
  .ip-brand__orbs { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
  .ip-orb {
    position: absolute;
    border-radius: 50%;
    opacity: .12;
    background: #fff;
  }
  .ip-orb--1 { width: 320px; height: 320px; top: -80px; left: -80px; }
  .ip-orb--2 { width: 200px; height: 200px; bottom: -60px; right: -60px; opacity: .08; }
  .ip-orb--3 { width: 100px; height: 100px; top: 50%; left: 55%; transform: translate(-50%,-50%); opacity: .06; }

  /* Right: form */
  .ip-shell {
    flex: 1 1 55%;
    max-width: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px 48px;
    overflow-y: auto;
  }

  /* Hide mobile logo — branding is on the left panel */
  .ip-logo-mobile {
    display: none;
  }

  .ip-card {
    width: 100%;
    max-width: 440px;
    padding: 32px;
  }

  .ip-footer {
    width: 100%;
    max-width: 440px;
  }
}

/* ── Tablet large (≥ 1024px) ─────────────────────────────────────────────────*/
@media (min-width: 1024px) {
  .ip-brand   { flex: 0 0 42%; }
  .ip-shell   { padding: 48px 64px; }
  .ip-card    { max-width: 460px; padding: 36px; }
}

/* ══ Reused from old scoped (mantidos) ══════════════════════════════════════ */
.face-badge {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(139,28,43,.08); border: 1.5px solid rgba(139,28,43,.3);
  display: flex; align-items: center; justify-content: center;
}
.face-badge--ok { background: rgba(46,204,113,.1); border-color: rgba(46,204,113,.5); }

.ident-banner { background: rgba(217,164,65,.12); font-size: 12.5px; line-height: 1.45; }
.ident-banner--err { background: rgba(224,96,112,.12); }

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
