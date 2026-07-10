<template>
  <div class="l-root">

    <!-- ═══ BRAND PANEL (sempre escuro) ══════════════════════ -->
    <aside class="l-brand" aria-hidden="true">
      <div class="l-grid" />
      <div class="l-glow l-glow--a" />
      <div class="l-glow l-glow--b" />

      <div class="l-brand__inner">
        <div class="l-wordmark">
          <span class="l-wordmark__cgb">CGB</span>
          <div class="l-wordmark__sub">
            <span class="l-wordmark__rule" />
            <span class="l-wordmark__eng">Engenharia</span>
          </div>
        </div>

        <p class="l-tagline">Programa de<br>Observação<br>Comportamental</p>

        <div class="l-readout">
          <div class="l-readout__row">
            <span class="l-readout__k">SISTEMA</span>
            <span class="l-readout__v">Auditagem · v2.0</span>
          </div>
          <div class="l-readout__row">
            <span class="l-readout__k">BASES</span>
            <span class="l-readout__v">BCB · BDC · ITM · PDS · PDT · STI</span>
          </div>
          <div class="l-readout__row">
            <span class="l-readout__k">CHECKLISTS</span>
            <span class="l-readout__v">GOMAN · GSTC</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ═══ FORM PANEL ════════════════════════════════════════ -->
    <main class="l-form">
      <div class="l-form__inner">

        <!-- Mini logo -->
        <div class="l-mini-logo">
          <span class="l-mini-logo__mark">CGB</span>
          <div class="l-mini-logo__divider" />
          <span class="l-mini-logo__label">Engenharia</span>
        </div>

        <!-- Stepper -->
        <div class="l-stepper">
          <span class="l-dot" :class="step === 'otp' ? 'l-dot--done' : 'l-dot--active'" />
          <span class="l-track">
            <span class="l-track__fill" :class="{ 'l-track__fill--on': step === 'otp' }" />
          </span>
          <span class="l-dot" :class="step === 'otp' ? 'l-dot--active' : ''" />
        </div>

        <!-- Steps -->
        <Transition name="step" mode="out-in">

          <!-- ── STEP 1: Email ── -->
          <div v-if="step === 'email'" key="email" class="l-pane">
            <div class="l-pane__head">
              <p class="l-eyebrow">Passo 1 de 2</p>
              <h1 class="l-h1">Acesso ao<br>Sistema</h1>
              <p class="l-desc">Informe seu e-mail corporativo para receber o código de acesso.</p>
            </div>

            <div class="l-field">
              <label class="l-label" for="l-email">E-MAIL</label>
              <input
                id="l-email"
                v-model="email"
                type="email"
                class="l-input"
                placeholder="nome@cgbengenharia.com.br"
                autocomplete="email"
                :disabled="sending"
                @keyup.enter="enviarOtp"
              />
            </div>

            <Transition name="fade">
              <p v-if="erro" class="l-err">{{ erro }}</p>
            </Transition>

            <button class="l-btn" :disabled="!email.trim() || sending" @click="enviarOtp">
              <template v-if="!sending">Enviar código</template>
              <span v-else class="l-spin" />
            </button>
          </div>

          <!-- ── STEP 2: OTP ── -->
          <div v-else key="otp" class="l-pane">
            <div class="l-pane__head">
              <p class="l-eyebrow">Passo 2 de 2</p>
              <h1 class="l-h1">Código<br>enviado</h1>
              <p class="l-desc">
                Insira os 6 dígitos enviados para<br>
                <strong class="l-email-hl">{{ email }}</strong>
              </p>
            </div>

            <div class="l-otp" @paste.prevent="onPaste">
              <input
                v-for="n in 6"
                :key="n"
                :ref="el => { if (el) digitInputs[n - 1] = el as HTMLInputElement }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="l-otp__box"
                :class="{
                  'l-otp__box--filled': digits[n - 1],
                  'l-otp__box--shake': shaking,
                }"
                :value="digits[n - 1]"
                @input="onDigitInput(n - 1, $event as InputEvent)"
                @keydown="onDigitKeydown(n - 1, $event as KeyboardEvent)"
              />
            </div>

            <Transition name="fade">
              <p v-if="erro" class="l-err">{{ erro }}</p>
            </Transition>

            <button
              class="l-btn"
              :class="{ 'l-btn--loading': verifying }"
              :disabled="token.length < 6 || verifying"
              @click="verificarOtp"
            >
              <template v-if="!verifying">Entrar</template>
              <span v-else class="l-spin" />
            </button>

            <button class="l-ghost" @click="resetEmail">
              ← Usar outro e-mail
            </button>
          </div>

        </Transition>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();

// ── State ─────────────────────────────────────────────
const step    = ref<"email" | "otp">("email");
const email   = ref("");
const sending  = ref(false);
const verifying = ref(false);
const erro    = ref<string | null>(null);
const shaking = ref(false);

const digits      = ref<string[]>(["", "", "", "", "", ""]);
const digitInputs = ref<HTMLInputElement[]>([]);
const token       = computed(() => digits.value.join(""));

// ── Helpers ───────────────────────────────────────────
function shake() {
  shaking.value = true;
  setTimeout(() => { shaking.value = false; }, 500);
}

function resetEmail() {
  step.value  = "email";
  digits.value = ["", "", "", "", "", ""];
  erro.value  = null;
}

// ── OTP digit controls ────────────────────────────────
function onDigitInput(i: number, e: InputEvent) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(-1);
  digits.value[i] = val;
  (e.target as HTMLInputElement).value = val;
  if (val && i < 5) digitInputs.value[i + 1]?.focus();
  if (token.value.length === 6) verificarOtp();
}

function onDigitKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    if (digits.value[i]) {
      digits.value[i] = "";
    } else if (i > 0) {
      digits.value[i - 1] = "";
      digitInputs.value[i - 1]?.focus();
    }
    e.preventDefault();
  }
  if (e.key === "ArrowLeft" && i > 0) digitInputs.value[i - 1]?.focus();
  if (e.key === "ArrowRight" && i < 5) digitInputs.value[i + 1]?.focus();
}

function onPaste(e: ClipboardEvent) {
  const text = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, 6);
  text.split("").forEach((ch, i) => { digits.value[i] = ch; });
  if (text.length === 6) verificarOtp();
  else if (text.length > 0) digitInputs.value[text.length]?.focus();
}

// ── Auth ──────────────────────────────────────────────
async function enviarOtp() {
  if (!email.value.trim() || sending.value) return;
  sending.value = true;
  erro.value    = null;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { shouldCreateUser: true },
  });
  sending.value = false;
  if (error) { erro.value = error.message; return; }
  step.value = "otp";
  setTimeout(() => digitInputs.value[0]?.focus(), 100);
}

async function verificarOtp() {
  if (token.value.length < 6 || verifying.value) return;
  verifying.value = true;
  erro.value      = null;
  const { error } = await supabase.auth.verifyOtp({
    email: email.value.trim(),
    token: token.value,
    type: "email",
  });
  verifying.value = false;
  if (error) {
    erro.value     = "Código inválido ou expirado. Tente novamente.";
    digits.value   = ["", "", "", "", "", ""];
    shake();
    setTimeout(() => digitInputs.value[0]?.focus(), 50);
    return;
  }
  await router.replace("/");
}
</script>

<style scoped lang="scss">
// ─── Tokens ──────────────────────────────────────────────────────────────────
:root {
  --form-bg:        #F3F6FB;
  --form-surface:   #FFFFFF;
  --form-border:    #D8DFE9;
  --form-text:      #0F1B2D;
  --form-muted:     #5E738A;
  --form-input-bg:  #FFFFFF;
}

@media (prefers-color-scheme: dark) {
  :root {
    --form-bg:       #0B1525;
    --form-surface:  #0D1929;
    --form-border:   #1B2C42;
    --form-text:     #E4EAF3;
    --form-muted:    #5E7590;
    --form-input-bg: #0F1D30;
  }
}
:root[data-theme="dark"] {
  --form-bg:       #0B1525;
  --form-surface:  #0D1929;
  --form-border:   #1B2C42;
  --form-text:     #E4EAF3;
  --form-muted:    #5E7590;
  --form-input-bg: #0F1D30;
}
:root[data-theme="light"] {
  --form-bg:       #F3F6FB;
  --form-surface:  #FFFFFF;
  --form-border:   #D8DFE9;
  --form-text:     #0F1B2D;
  --form-muted:    #5E738A;
  --form-input-bg: #FFFFFF;
}

// ─── Root split ──────────────────────────────────────────────────────────────
.l-root {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}

// ─── Brand panel ─────────────────────────────────────────────────────────────
.l-brand {
  position: relative;
  flex: 0 0 52%;
  background: #060C15;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

// Dot grid
.l-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
}

// Atmospheric colour blobs
.l-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.l-glow--a {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(139,28,43,0.32), transparent 70%);
  top: -80px; left: -60px;
}
.l-glow--b {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(184,115,51,0.18), transparent 70%);
  bottom: 40px; right: -60px;
}

.l-brand__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 52px 44px 44px;
  width: 100%;
}

// Wordmark
.l-wordmark {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.l-wordmark__cgb {
  display: block;
  font-size: clamp(88px, 10vw, 136px);
  font-weight: 900;
  letter-spacing: 0.03em;
  color: #FFFFFF;
  line-height: 0.9;
  font-variant-numeric: tabular-nums;
  user-select: none;
}
.l-wordmark__sub {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.l-wordmark__rule {
  display: block;
  width: 32px;
  height: 2px;
  background: #8B1C2B;
  flex-shrink: 0;
}
.l-wordmark__eng {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(232,237,244,0.55);
}

// Tagline
.l-tagline {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.55;
  color: rgba(232,237,244,0.4);
  letter-spacing: 0.01em;
  margin: 0;
}

// Readout / instrument panel
.l-readout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255,255,255,0.07);
  padding-top: 20px;
}
.l-readout__row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.l-readout__k {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(232,237,244,0.25);
  flex-shrink: 0;
  min-width: 86px;
}
.l-readout__v {
  font-size: 11px;
  font-weight: 500;
  color: rgba(232,237,244,0.45);
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}

// ─── Form panel ──────────────────────────────────────────────────────────────
.l-form {
  flex: 1;
  background: var(--form-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  transition: background 0.3s;
}

.l-form__inner {
  width: 100%;
  max-width: 360px;
}

// Mini logo
.l-mini-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
}
.l-mini-logo__mark {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #8B1C2B;
}
.l-mini-logo__divider {
  width: 1px;
  height: 14px;
  background: var(--form-border);
}
.l-mini-logo__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--form-muted);
}

// Stepper
.l-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 36px;
}
.l-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--form-border);
  transition: background 0.3s, transform 0.3s;
  flex-shrink: 0;

  &--active {
    background: #8B1C2B;
    transform: scale(1.25);
  }
  &--done {
    background: #8B1C2B;
  }
}
.l-track {
  flex: 1;
  height: 2px;
  background: var(--form-border);
  margin: 0 8px;
  border-radius: 1px;
  overflow: hidden;
}
.l-track__fill {
  display: block;
  height: 100%;
  width: 0%;
  background: #8B1C2B;
  transition: width 0.4s ease;
  &--on { width: 100%; }
}

// Pane content
.l-pane__head {
  margin-bottom: 32px;
}

.l-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #8B1C2B;
  margin: 0 0 10px;
}

.l-h1 {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--form-text);
  line-height: 1.1;
  margin: 0 0 14px;
  text-wrap: balance;
}

.l-desc {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--form-muted);
  margin: 0;
}

.l-email-hl {
  color: var(--form-text);
  font-weight: 600;
  word-break: break-all;
}

// Field
.l-field {
  margin-bottom: 20px;
}
.l-label {
  display: block;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--form-muted);
  margin-bottom: 8px;
}
.l-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: var(--form-input-bg);
  border: 1.5px solid var(--form-border);
  border-radius: 4px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--form-text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;

  &::placeholder { color: var(--form-muted); opacity: .5; }

  &:focus {
    border-color: #8B1C2B;
    box-shadow: 0 0 0 3px rgba(139,28,43,0.12);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// OTP boxes
.l-otp {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.l-otp__box {
  flex: 1;
  height: 52px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--form-input-bg);
  border: 1.5px solid var(--form-border);
  border-radius: 4px;
  color: var(--form-text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  cursor: text;
  caret-color: #8B1C2B;
  -webkit-appearance: none;
  appearance: none;

  &:focus {
    border-color: #8B1C2B;
    box-shadow: 0 0 0 3px rgba(139,28,43,0.12);
  }
  &--filled {
    border-color: rgba(139,28,43,0.5);
    background: var(--form-input-bg);
  }
  &--shake {
    animation: shake 0.45s ease;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-5px); }
  30%       { transform: translateX(5px); }
  45%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  75%       { transform: translateX(-2px); }
  90%       { transform: translateX(2px); }
}

// Error
.l-err {
  font-size: 12px;
  color: #C0392B;
  margin: 0 0 16px;
  line-height: 1.4;
}

// Button
.l-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  background: #8B1C2B;
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.18s, opacity 0.18s, transform 0.1s;
  outline: none;
  font-family: inherit;
  margin-bottom: 12px;

  &:hover:not(:disabled) { background: #A12233; }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:focus-visible { box-shadow: 0 0 0 3px rgba(139,28,43,0.4); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.l-ghost {
  display: block;
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--form-muted);
  cursor: pointer;
  text-align: center;
  transition: color 0.18s;
  font-family: inherit;

  &:hover { color: var(--form-text); }
}

// Spinner
.l-spin {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ─── Transitions ─────────────────────────────────────────────────────────────
.step-enter-active,
.step-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.step-enter-from   { opacity: 0; transform: translateX(18px); }
.step-leave-to     { opacity: 0; transform: translateX(-18px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

// ─── Mobile ──────────────────────────────────────────────────────────────────
@media (max-width: 680px) {
  .l-root { flex-direction: column; }

  .l-brand {
    flex: none;
    padding: 0;
  }
  .l-brand__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    gap: 16px;
  }
  .l-wordmark__cgb { font-size: 42px; }
  .l-wordmark__sub { margin-top: 4px; }
  .l-tagline,
  .l-readout { display: none; }
  .l-glow--a { width: 200px; height: 200px; top: -60px; left: -40px; }
  .l-glow--b { display: none; }

  .l-form {
    flex: 1;
    padding: 36px 24px;
  }
  .l-form__inner { max-width: none; }
}
</style>
