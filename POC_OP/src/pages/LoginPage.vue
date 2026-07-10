<template>
  <div class="l-root">

    <!-- Elementos decorativos fixos -->
    <div class="l-stripe" aria-hidden="true" />
    <div class="l-watermark" aria-hidden="true">CGB</div>
    <div class="l-grid" aria-hidden="true" />

    <!-- Cabeçalho da marca -->
    <header class="l-header">
      <div class="l-brand-mark">
        <span class="l-brand-mark__name">CGB Engenharia</span>
        <span class="l-brand-mark__sep" />
        <span class="l-brand-mark__product">Programa de Observação Comportamental</span>
      </div>
      <div class="l-brand-mark__system">Sistema de Auditagem · v2.0</div>
    </header>

    <!-- Área principal -->
    <main class="l-main">

      <!-- Coluna da composição tipográfica -->
      <div class="l-title-col" aria-hidden="true">
        <p class="l-eyebrow">Área restrita</p>
        <h1 class="l-display">
          <span class="l-display__line l-display__line--em">Acesse</span>
          <span class="l-display__line">o sistema.</span>
        </h1>
        <div class="l-sep">
          <span class="l-sep__line" />
          <span class="l-sep__label">Autenticação em dois passos</span>
        </div>
      </div>

      <!-- Coluna do formulário -->
      <div class="l-form-col">

        <!-- Stepper -->
        <div class="l-stepper" role="progressbar" :aria-valuenow="step === 'email' ? 1 : 2" aria-valuemin="1" aria-valuemax="2">
          <span class="l-step-pill" :class="{ 'l-step-pill--active': step === 'email', 'l-step-pill--done': step === 'otp' }">1</span>
          <span class="l-step-track">
            <span class="l-step-fill" :class="{ 'l-step-fill--on': step === 'otp' }" />
          </span>
          <span class="l-step-pill" :class="{ 'l-step-pill--active': step === 'otp' }">2</span>
        </div>

        <Transition name="step" mode="out-in">

          <!-- ── E-mail ── -->
          <div v-if="step === 'email'" key="email" class="l-pane">
            <p class="l-pane__label">IDENTIFICAÇÃO</p>
            <p class="l-pane__hint">Informe seu e-mail para receber o código de acesso.</p>

            <div class="l-field">
              <label class="l-field__lbl" for="l-email">E-MAIL CORPORATIVO</label>
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

          <!-- ── OTP ── -->
          <div v-else key="otp" class="l-pane">
            <p class="l-pane__label">VERIFICAÇÃO</p>
            <p class="l-pane__hint">
              Código enviado para<br>
              <strong class="l-email-em">{{ email }}</strong>
            </p>

            <div class="l-otp-wrap">
              <div class="l-otp" @paste.prevent="onPaste">
                <input
                  v-for="n in 6"
                  :key="n"
                  :ref="(el) => { if (el) digitInputs[n - 1] = el as HTMLInputElement }"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="l-otp__d"
                  :class="{
                    'l-otp__d--filled': digits[n - 1],
                    'l-otp__d--shake': shaking,
                  }"
                  :value="digits[n - 1]"
                  @input="onDigitInput(n - 1, $event as InputEvent)"
                  @keydown="onDigitKeydown(n - 1, $event as KeyboardEvent)"
                />
              </div>
              <span class="l-otp__note">Auto-submete ao completar</span>
            </div>

            <Transition name="fade">
              <p v-if="erro" class="l-err">{{ erro }}</p>
            </Transition>

            <button
              class="l-btn"
              :class="{ 'l-btn--dimmed': token.length < 6 }"
              :disabled="token.length < 6 || verifying"
              @click="verificarOtp"
            >
              <template v-if="!verifying">Entrar no sistema</template>
              <span v-else class="l-spin" />
            </button>

            <button class="l-back" @click="resetEmail">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Usar outro e-mail
            </button>
          </div>

        </Transition>
      </div>
    </main>

    <!-- Rodapé -->
    <footer class="l-footer">
      <span>BCB · BDC · ITM · PDS · PDT · STI</span>
      <span class="l-footer__sep">·</span>
      <span>GOMAN · GSTC</span>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();

const step     = ref<"email" | "otp">("email");
const email    = ref("");
const sending  = ref(false);
const verifying = ref(false);
const erro     = ref<string | null>(null);
const shaking  = ref(false);

const digits      = ref<string[]>(["", "", "", "", "", ""]);
const digitInputs = ref<HTMLInputElement[]>([]);
const token       = computed(() => digits.value.join(""));

function shake() {
  shaking.value = true;
  setTimeout(() => { shaking.value = false; }, 520);
}

function resetEmail() {
  step.value   = "email";
  digits.value = ["", "", "", "", "", ""];
  erro.value   = null;
}

function onDigitInput(i: number, e: InputEvent) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(-1);
  digits.value[i] = val;
  (e.target as HTMLInputElement).value = val;
  if (val && i < 5) digitInputs.value[i + 1]?.focus();
  if (token.value.length === 6) verificarOtp();
}

function onDigitKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    if (digits.value[i]) { digits.value[i] = ""; }
    else if (i > 0) { digits.value[i - 1] = ""; digitInputs.value[i - 1]?.focus(); }
    e.preventDefault();
  }
  if (e.key === "ArrowLeft"  && i > 0) digitInputs.value[i - 1]?.focus();
  if (e.key === "ArrowRight" && i < 5) digitInputs.value[i + 1]?.focus();
}

function onPaste(e: ClipboardEvent) {
  const text = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, 6);
  text.split("").forEach((ch, i) => { digits.value[i] = ch; });
  if (text.length === 6) verificarOtp();
  else if (text.length > 0) digitInputs.value[Math.min(text.length, 5)]?.focus();
}

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
  setTimeout(() => digitInputs.value[0]?.focus(), 120);
}

async function verificarOtp() {
  if (token.value.length < 6 || verifying.value) return;
  verifying.value = true;
  erro.value      = null;
  const { error } = await supabase.auth.verifyOtp({
    email: email.value.trim(),
    token: token.value,
    type:  "email",
  });
  verifying.value = false;
  if (error) {
    erro.value   = "Código inválido ou expirado.";
    digits.value = ["", "", "", "", "", ""];
    shake();
    setTimeout(() => digitInputs.value[0]?.focus(), 60);
    return;
  }
  await router.replace("/");
}
</script>

<style scoped lang="scss">
// ─── Ground ──────────────────────────────────────────────────────────────────
.l-root {
  position: relative;
  min-height: 100vh;
  background: #060C15;
  color: #E4EAF3;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  overflow: hidden;
}

// ─── Fixed decorative elements ───────────────────────────────────────────────

// Faixa crimson — borda esquerda
.l-stripe {
  position: fixed;
  top: 0; left: 0;
  width: 3px;
  height: 100%;
  background: #8B1C2B;
  z-index: 10;
}

// Grade de engenharia
.l-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
  background-size: 52px 52px;
  pointer-events: none;
  z-index: 0;
}

// Marca-d'água "CGB"
.l-watermark {
  position: fixed;
  right: -0.08em;
  bottom: -0.18em;
  font-size: clamp(200px, 28vw, 360px);
  font-weight: 900;
  letter-spacing: -0.04em;
  color: rgba(255,255,255,0.038);
  line-height: 1;
  user-select: none;
  pointer-events: none;
  z-index: 0;
}

// ─── Header ──────────────────────────────────────────────────────────────────
.l-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 52px 0;
}

.l-brand-mark {
  display: flex;
  align-items: center;
  gap: 12px;
}
.l-brand-mark__name {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
}
.l-brand-mark__sep {
  display: block;
  width: 1px;
  height: 12px;
  background: rgba(255,255,255,0.2);
}
.l-brand-mark__product {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.32);
}
.l-brand-mark__system {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
}

// ─── Main layout ─────────────────────────────────────────────────────────────
.l-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: clamp(40px, 8vw, 120px);
  padding: 0 52px;
  min-height: 0;
}

// ─── Title column ────────────────────────────────────────────────────────────
.l-title-col {
  flex: 1;
  max-width: 480px;
  padding-bottom: 8px;
}

.l-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #8B1C2B;
  margin: 0 0 20px;
}

.l-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0 0 36px;
  line-height: 1;
}
.l-display__line {
  display: block;
  font-size: clamp(52px, 7.5vw, 92px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #E4EAF3;
  white-space: nowrap;

  &--em {
    color: #fff;
  }
}

.l-sep {
  display: flex;
  align-items: center;
  gap: 16px;
}
.l-sep__line {
  display: block;
  width: 40px;
  height: 2px;
  background: #8B1C2B;
  flex-shrink: 0;
}
.l-sep__label {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  font-weight: 500;
}

// ─── Form column ─────────────────────────────────────────────────────────────
.l-form-col {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
}

// Stepper
.l-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 32px;
}
.l-step-pill {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
  border: 1.5px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.25);
  transition: all 0.3s ease;
  flex-shrink: 0;

  &--active {
    border-color: #8B1C2B;
    background: #8B1C2B;
    color: #fff;
  }
  &--done {
    border-color: rgba(139,28,43,0.5);
    background: transparent;
    color: rgba(139,28,43,0.7);
  }
}
.l-step-track {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 0 8px;
  overflow: hidden;
}
.l-step-fill {
  display: block;
  height: 100%;
  width: 0%;
  background: #8B1C2B;
  transition: width 0.45s ease;
  &--on { width: 100%; }
}

// Pane
.l-pane__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.2);
  margin: 0 0 8px;
}
.l-pane__hint {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.45);
  margin: 0 0 28px;
}
.l-email-em {
  color: #E4EAF3;
  font-weight: 600;
  word-break: break-all;
}

// Field
.l-field {
  margin-bottom: 24px;
}
.l-field__lbl {
  display: block;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.25);
  margin-bottom: 10px;
}
.l-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid rgba(255,255,255,0.14);
  padding: 10px 0;
  font-size: 14px;
  font-family: inherit;
  color: #E4EAF3;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder { color: rgba(255,255,255,0.2); }

  &:focus {
    border-bottom-color: #8B1C2B;
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// OTP
.l-otp-wrap {
  margin-bottom: 24px;
}
.l-otp {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.l-otp__d {
  flex: 1;
  height: 48px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  color: #E4EAF3;
  outline: none;
  caret-color: #8B1C2B;
  -webkit-appearance: none;
  appearance: none;
  transition: border-color 0.2s, background 0.2s;

  &:focus {
    border-color: #8B1C2B;
    background: rgba(139,28,43,0.08);
  }
  &--filled {
    border-color: rgba(139,28,43,0.45);
  }
  &--shake { animation: shake 0.48s ease; }
}
.l-otp__note {
  display: block;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.15);
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  15%      { transform: translateX(-5px); }
  30%      { transform: translateX(5px); }
  45%      { transform: translateX(-4px); }
  60%      { transform: translateX(4px); }
  78%      { transform: translateX(-2px); }
  90%      { transform: translateX(2px); }
}

// Error
.l-err {
  font-size: 11.5px;
  color: #E06070;
  margin: 0 0 16px;
  line-height: 1.4;
}

// Button
.l-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  background: #8B1C2B;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.18s, opacity 0.18s, transform 0.1s;
  outline: none;
  font-family: inherit;
  margin-bottom: 12px;

  &:hover:not(:disabled) { background: #A0202F; }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:focus-visible { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #8B1C2B; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &--dimmed { opacity: 0.5; }
}

.l-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  font-size: 11.5px;
  font-weight: 500;
  color: rgba(255,255,255,0.25);
  cursor: pointer;
  transition: color 0.18s;
  font-family: inherit;
  letter-spacing: 0.04em;

  &:hover { color: rgba(255,255,255,0.6); }
}

// Spinner
.l-spin {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ─── Footer ──────────────────────────────────────────────────────────────────
.l-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 52px 28px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.15);
}
.l-footer__sep { opacity: 0.4; }

// ─── Transitions ─────────────────────────────────────────────────────────────
.step-enter-active,
.step-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.step-enter-from   { opacity: 0; transform: translateY(10px); }
.step-leave-to     { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

// ─── Mobile ──────────────────────────────────────────────────────────────────
@media (max-width: 700px) {
  .l-header { padding: 20px 28px 0; }
  .l-brand-mark__product,
  .l-brand-mark__system { display: none; }

  .l-main {
    flex-direction: column;
    align-items: flex-start;
    padding: 36px 28px 0;
    gap: 32px;
  }

  .l-title-col { max-width: 100%; }
  .l-display__line { font-size: clamp(40px, 11vw, 60px); }

  .l-form-col { flex: none; width: 100%; }

  .l-footer { padding: 20px 28px 24px; }
  .l-watermark { font-size: 38vw; }
}
</style>
