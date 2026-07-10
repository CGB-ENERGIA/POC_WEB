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
          <span class="l-sep__label">Credenciais corporativas</span>
        </div>
      </div>

      <!-- Coluna do formulário -->
      <div class="l-form-col">

        <div class="l-pane">
          <p class="l-pane__label">IDENTIFICAÇÃO</p>

          <!-- E-mail -->
          <div class="l-field">
            <label class="l-field__lbl" for="l-email">E-MAIL</label>
            <input
              id="l-email"
              v-model="email"
              type="email"
              class="l-input"
              placeholder="nome@cgbengenharia.com.br"
              autocomplete="email"
              :disabled="loading"
              @keyup.enter="focusSenha"
            />
          </div>

          <!-- Senha -->
          <div class="l-field">
            <label class="l-field__lbl" for="l-senha">SENHA</label>
            <div class="l-input-wrap">
              <input
                id="l-senha"
                ref="senhaRef"
                v-model="senha"
                :type="showSenha ? 'text' : 'password'"
                class="l-input l-input--senha"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
                @keyup.enter="entrar"
              />
              <button
                type="button"
                class="l-eye"
                :aria-label="showSenha ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showSenha = !showSenha"
              >
                <svg v-if="!showSenha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <Transition name="fade">
            <p v-if="erro" class="l-err" role="alert">{{ erro }}</p>
          </Transition>

          <button
            class="l-btn"
            :disabled="!email.trim() || !senha || loading"
            @click="entrar"
          >
            <template v-if="!loading">Entrar no sistema</template>
            <span v-else class="l-spin" />
          </button>
        </div>

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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router    = useRouter();
const email     = ref("");
const senha     = ref("");
const loading   = ref(false);
const erro      = ref<string | null>(null);
const showSenha = ref(false);
const senhaRef  = ref<HTMLInputElement | null>(null);

function focusSenha() {
  senhaRef.value?.focus();
}

async function entrar() {
  if (!email.value.trim() || !senha.value || loading.value) return;
  loading.value = true;
  erro.value    = null;

  const { error } = await supabase.auth.signInWithPassword({
    email:    email.value.trim(),
    password: senha.value,
  });

  loading.value = false;
  if (error) {
    erro.value = "E-mail ou senha incorretos.";
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
  overflow: hidden;
}

// ─── Fixed decorative elements ───────────────────────────────────────────────
.l-stripe {
  position: fixed;
  top: 0; left: 0;
  width: 3px;
  height: 100%;
  background: #8B1C2B;
  z-index: 10;
}

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

  &--em { color: #fff; }
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
}

.l-pane__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.2);
  margin: 0 0 24px;
}

// ─── Fields ──────────────────────────────────────────────────────────────────
.l-field {
  margin-bottom: 28px;
}
.l-field__lbl {
  display: block;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.25);
  margin-bottom: 10px;
}

.l-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
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

  &::placeholder { color: rgba(255,255,255,0.18); }
  &:focus        { border-bottom-color: #8B1C2B; }
  &:disabled     { opacity: 0.4; cursor: not-allowed; }

  &--senha { padding-right: 32px; }
}

.l-eye {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  padding: 4px;
  color: rgba(255,255,255,0.28);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.18s;

  &:hover { color: rgba(255,255,255,0.6); }
}

// ─── Error ───────────────────────────────────────────────────────────────────
.l-err {
  font-size: 11.5px;
  color: #E06070;
  margin: 0 0 16px;
  line-height: 1.4;
}

// ─── Button ──────────────────────────────────────────────────────────────────
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

  &:hover:not(:disabled)  { background: #A0202F; }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:focus-visible         { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #8B1C2B; }
  &:disabled              { opacity: 0.35; cursor: not-allowed; }
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

// ─── Mobile ──────────────────────────────────────────────────────────────────
@media (max-width: 700px) {
  .l-header {
    padding: 20px 28px 0;
    flex-wrap: wrap;
    gap: 4px;
  }
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
