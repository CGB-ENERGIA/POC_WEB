<!--
  Login: apenas e-mail e senha (Supabase Auth).
  Face ID exclusivo no PWA mobile.
-->
<template>
  <div class="l-root">

    <div class="l-stripe" aria-hidden="true" />
    <div class="l-watermark" aria-hidden="true">CGB</div>
    <div class="l-grid" aria-hidden="true" />

    <header class="l-header">
      <div class="l-brand-mark">
        <span class="l-brand-mark__name">CGB Engenharia</span>
        <span class="l-brand-mark__sep" />
        <span class="l-brand-mark__product">Programa de Observação Comportamental</span>
      </div>
      <div class="l-brand-mark__system">Sistema de Auditagem · v2.0</div>
    </header>

    <main class="l-main">

      <!-- Coluna tipográfica -->
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

        <!-- ══ ESQUECI MINHA SENHA ══ -->
        <template v-if="sub === 'forgot'">
          <p class="l-pane__label">RECUPERAR ACESSO</p>
          <p class="l-forgot-desc">Informe seu e-mail corporativo e enviaremos um link para redefinir a senha.</p>

          <div class="l-field">
            <label class="l-field__lbl" for="l-forgot-email">E-MAIL</label>
            <input
              id="l-forgot-email"
              ref="forgotEmailRef"
              v-model="forgotEmail"
              type="email"
              class="l-input"
              placeholder="nome@cgbengenharia.com.br"
              autocomplete="email"
              :disabled="forgotLoading || forgotSent"
              @keyup.enter="enviarRecuperacao"
            />
          </div>

          <Transition name="fade">
            <p v-if="forgotErro" class="l-err" role="alert">{{ forgotErro }}</p>
          </Transition>
          <Transition name="fade">
            <div v-if="forgotSent" class="l-forgot-ok">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              E-mail enviado. Verifique sua caixa de entrada.
            </div>
          </Transition>

          <button
            v-if="!forgotSent"
            class="l-btn"
            :disabled="!forgotEmail.trim() || forgotLoading"
            @click="enviarRecuperacao"
          >
            <template v-if="!forgotLoading">Enviar link de recuperação</template>
            <span v-else class="l-spin" />
          </button>

          <button class="l-back" @click="voltarLogin">
            <BackArrow /> Voltar ao login
          </button>
        </template>

        <!-- ══ LOGIN ══ -->
        <template v-else>
          <p class="l-pane__label">IDENTIFICAÇÃO</p>

          <div class="l-field">
            <label class="l-field__lbl" for="l-email">E-MAIL</label>
            <input
              id="l-email"
              ref="emailRef"
              v-model="email"
              type="email"
              class="l-input"
              placeholder="nome@cgbengenharia.com.br"
              autocomplete="email"
              :disabled="loading"
              @keyup.enter="senhaRef?.focus()"
            />
          </div>

          <div class="l-field">
            <label class="l-field__lbl" for="l-senha">SENHA</label>
            <div class="l-input-wrap">
              <input
                id="l-senha"
                ref="senhaRef"
                v-model="senha"
                :type="showSenha ? 'text' : 'password'"
                class="l-input l-input--pw"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
                @keyup.enter="entrar"
                @keydown="checkCaps"
                @keyup="checkCaps"
              />
              <button type="button" class="l-eye" :aria-label="showSenha ? 'Ocultar' : 'Mostrar'" @click="showSenha = !showSenha">
                <EyeIcon :crossed="showSenha" />
              </button>
            </div>
            <Transition name="fade"><p v-if="capsOn" class="l-caps">Caps Lock ativado</p></Transition>
          </div>

          <Transition name="fade"><p v-if="loginErro" class="l-err" role="alert">{{ loginErro }}</p></Transition>

          <button class="l-btn" :disabled="!email.trim() || !senha || loading" @click="entrar">
            <template v-if="!loading">Entrar no sistema</template>
            <span v-else class="l-spin" />
          </button>

          <button class="l-link-btn l-link-btn--forgot" @click="abrirEsqueceu">
            Esqueci minha senha
          </button>
        </template>

      </div>
    </main>

    <footer class="l-footer">
      <div class="l-footer__units">
        <span>BCB · BDC · ITM · PDS · PDT · STI</span>
        <span class="l-footer__sep">·</span>
        <span>GOMAN · GSTC</span>
      </div>
      <a
        href="https://www.instagram.com/italofontes__?utm_source=qr&igsh=NmUwbnVwZWE2ems2"
        target="_blank"
        rel="noopener noreferrer"
        class="l-footer__credit"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        Italo Fontes
      </a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

// ─── Ícones inline ────────────────────────────────────────────────────────────
const EyeIcon = defineComponent({
  props: { crossed: Boolean },
  setup(p) {
    return () => p.crossed
      ? h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }, [
          h("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }),
          h("line", { x1: 1, y1: 1, x2: 23, y2: 23 }),
        ])
      : h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }, [
          h("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
          h("circle", { cx: 12, cy: 12, r: 3 }),
        ]);
  },
});

const BackArrow = defineComponent({
  setup: () => () =>
    h("svg", { width: 12, height: 12, viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" },
      [h("path", { d: "M7.5 2L3.5 6L7.5 10" })]),
});

// ─── State ────────────────────────────────────────────────────────────────────
const router = useRouter();

type Sub = "none" | "forgot";
const sub     = ref<Sub>("none");

// login
const email     = ref("");
const senha     = ref("");
const loading   = ref(false);
const loginErro = ref<string | null>(null);
const showSenha = ref(false);
const capsOn    = ref(false);
const senhaRef  = ref<HTMLInputElement | null>(null);
const emailRef  = ref<HTMLInputElement | null>(null);

// esqueci minha senha
const forgotEmail    = ref("");
const forgotLoading  = ref(false);
const forgotErro     = ref<string | null>(null);
const forgotSent     = ref(false);
const forgotEmailRef = ref<HTMLInputElement | null>(null);

const LAST_EMAIL_KEY = "cgb:last-email";

function checkCaps(e: KeyboardEvent) {
  capsOn.value = e.getModifierState?.("CapsLock") ?? false;
}

function abrirEsqueceu() {
  forgotEmail.value = email.value.trim();
  forgotErro.value  = null;
  forgotSent.value  = false;
  sub.value         = "forgot";
  nextTick(() => forgotEmailRef.value?.focus());
}

function voltarLogin() {
  sub.value        = "none";
  forgotEmail.value = "";
  forgotErro.value  = null;
  forgotSent.value  = false;
}

async function enviarRecuperacao() {
  if (!forgotEmail.value.trim() || forgotLoading.value) return;
  forgotLoading.value = true;
  forgotErro.value    = null;

  const { error } = await supabase.auth.resetPasswordForEmail(
    forgotEmail.value.trim(),
    { redirectTo: window.location.origin },
  );

  forgotLoading.value = false;
  if (error) {
    forgotErro.value = "Não foi possível enviar o e-mail. Tente novamente.";
    return;
  }
  forgotSent.value = true;
}

async function entrar() {
  if (!email.value.trim() || !senha.value || loading.value) return;
  loading.value   = true;
  loginErro.value = null;

  const { error } = await supabase.auth.signInWithPassword({
    email:    email.value.trim(),
    password: senha.value,
  });

  loading.value = false;
  if (error) { loginErro.value = "E-mail ou senha incorretos."; return; }

  try { localStorage.setItem(LAST_EMAIL_KEY, email.value.trim()); } catch { /* ok */ }

  await router.replace("/");
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(LAST_EMAIL_KEY);
    if (saved) email.value = saved;
  } catch { /* ok */ }
  nextTick(() => (email.value ? senhaRef.value : emailRef.value)?.focus());
});
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

// ─── Decorativos ─────────────────────────────────────────────────────────────
.l-stripe {
  position: fixed;
  top: 0; left: 0;
  width: 3px; height: 100%;
  background: #8B1C2B;
  z-index: 10;
}
.l-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
  background-size: 52px 52px;
  pointer-events: none; z-index: 0;
}
.l-watermark {
  position: fixed;
  right: -0.08em; bottom: -0.18em;
  font-size: clamp(200px, 28vw, 360px);
  font-weight: 900;
  letter-spacing: -0.04em;
  color: rgba(255,255,255,0.038);
  line-height: 1;
  user-select: none; pointer-events: none; z-index: 0;
}

// ─── Header ──────────────────────────────────────────────────────────────────
.l-header {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 52px 0;
}
.l-brand-mark { display: flex; align-items: center; gap: 12px; }
.l-brand-mark__name { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #fff; }
.l-brand-mark__sep  { display: block; width: 1px; height: 12px; background: rgba(255,255,255,.2); }
.l-brand-mark__product { font-size: 10px; letter-spacing: .06em; color: rgba(255,255,255,.32); }
.l-brand-mark__system  { font-size: 10px; letter-spacing: .12em; color: rgba(255,255,255,.2); text-transform: uppercase; }

// ─── Main ────────────────────────────────────────────────────────────────────
.l-main {
  position: relative; z-index: 1;
  display: flex; align-items: center;
  gap: clamp(40px, 8vw, 120px);
  padding: 0 52px; min-height: 0;
}

// ─── Title col ───────────────────────────────────────────────────────────────
.l-title-col { flex: 1; max-width: 480px; padding-bottom: 8px; }
.l-eyebrow {
  font-size: 10px; font-weight: 700; letter-spacing: .22em;
  text-transform: uppercase; color: #8B1C2B; margin: 0 0 20px;
}
.l-display {
  display: flex; flex-direction: column; gap: 2px;
  margin: 0 0 36px; line-height: 1;
}
.l-display__line {
  display: block;
  font-size: clamp(52px, 7.5vw, 92px);
  font-weight: 800; letter-spacing: -0.04em;
  color: #E4EAF3; white-space: nowrap;
  &--em { color: #fff; }
}
.l-sep { display: flex; align-items: center; gap: 16px; }
.l-sep__line  { display: block; width: 40px; height: 2px; background: #8B1C2B; flex-shrink: 0; }
.l-sep__label { font-size: 10.5px; letter-spacing: .1em; color: rgba(255,255,255,.25); text-transform: uppercase; font-weight: 500; }

// ─── Form col ────────────────────────────────────────────────────────────────
.l-form-col { flex: 0 0 320px; }

// ─── Pane ────────────────────────────────────────────────────────────────────
.l-pane__label {
  font-size: 9px; font-weight: 700; letter-spacing: .22em;
  color: rgba(255,255,255,.2); margin: 0 0 24px;
}

// ─── Campos ──────────────────────────────────────────────────────────────────
.l-field { margin-bottom: 28px; }
.l-field__lbl {
  display: block; font-size: 8.5px; font-weight: 700;
  letter-spacing: .2em; color: rgba(255,255,255,.25); margin-bottom: 10px;
}
.l-input-wrap { position: relative; display: flex; align-items: center; }
.l-input {
  display: block; width: 100%; box-sizing: border-box;
  background: transparent; border: none;
  border-bottom: 1.5px solid rgba(255,255,255,.14);
  padding: 10px 0; font-size: 14px; font-family: inherit;
  color: #E4EAF3; outline: none; transition: border-color .2s;

  &::placeholder { color: rgba(255,255,255,.18); }
  &:focus        { border-bottom-color: #8B1C2B; }
  &:disabled     { opacity: .4; cursor: not-allowed; }
  &--pw          { padding-right: 32px; }
}
.l-eye {
  position: absolute; right: 0; background: none; border: none;
  padding: 6px; cursor: pointer;
  display: flex; align-items: center; transition: opacity .18s;
  color: #8B1C2B; opacity: .7;
  &:hover { opacity: 1; }
}

// ─── Erro ────────────────────────────────────────────────────────────────────
.l-err {
  font-size: 11.5px; color: #E06070; margin: 0 0 16px; line-height: 1.4;
}

// ─── Aviso Caps Lock ─────────────────────────────────────────────────────────
.l-caps {
  font-size: 10px; letter-spacing: .06em;
  color: #D9A441; margin: 8px 0 0;
}

// ─── Botões ──────────────────────────────────────────────────────────────────
.l-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 44px;
  background: #8B1C2B; color: #fff;
  font-size: 12.5px; font-weight: 700; letter-spacing: .08em;
  border: none; border-radius: 2px; cursor: pointer;
  transition: background .18s, opacity .18s, transform .1s;
  outline: none; font-family: inherit; margin-bottom: 12px;

  &:hover:not(:disabled)  { background: #A0202F; }
  &:active:not(:disabled) { transform: scale(.98); }
  &:focus-visible         { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #8B1C2B; }
  &:disabled              { opacity: .35; cursor: not-allowed; }
}

.l-back {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 8px; background: none; border: none;
  font-size: 11.5px; font-weight: 500;
  color: rgba(255,255,255,.25); cursor: pointer;
  transition: color .18s; font-family: inherit; letter-spacing: .04em;
  &:hover { color: rgba(255,255,255,.6); }
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
.l-spin {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ─── Link button ──────────────────────────────────────────────────────────────
.l-link-btn {
  background: none; border: none; padding: 6px 0;
  font-size: 11px; color: rgba(255,255,255,.3);
  cursor: pointer; font-family: inherit; letter-spacing: .04em;
  text-decoration: underline; text-underline-offset: 3px;
  transition: color .18s;
  &:hover { color: rgba(255,255,255,.6); }
  &--forgot {
    display: block; width: 100%; text-align: center;
    margin-top: 4px;
  }
}

// ─── Recuperação de senha ─────────────────────────────────────────────────────
.l-forgot-desc {
  font-size: 12px; color: rgba(255,255,255,.35); line-height: 1.6;
  margin: 0 0 24px;
}
.l-forgot-ok {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #2ECC71; margin: 0 0 16px;
  line-height: 1.4;
}

// ─── Footer ──────────────────────────────────────────────────────────────────
.l-footer {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 52px 28px;
  font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase;
  color: rgba(255,255,255,.15);
}
.l-footer__units { display: flex; align-items: center; gap: 10px; }
.l-footer__sep { opacity: .4; }
.l-footer__credit {
  display: flex; align-items: center; gap: 6px;
  color: rgba(255,255,255,.22); text-decoration: none;
  font-size: 9px; letter-spacing: .1em;
  transition: color .2s;
  svg { opacity: .7; flex-shrink: 0; }
  &:hover { color: rgba(255,255,255,.6); svg { opacity: 1; } }
}

// ─── Mobile ──────────────────────────────────────────────────────────────────
@media (max-width: 700px) {
  .l-header { padding: 20px 28px 0; flex-wrap: wrap; gap: 4px; }
  .l-brand-mark__product,
  .l-brand-mark__system { display: none; }

  .l-main {
    flex-direction: column; align-items: flex-start;
    padding: 32px 28px 0; gap: 28px;
  }
  .l-title-col { max-width: 100%; }
  .l-display__line { font-size: clamp(38px, 11vw, 56px); }
  .l-form-col  { flex: none; width: 100%; }
  .l-footer    { padding: 20px 28px 24px; }
  .l-watermark { font-size: 38vw; }
}

:global(.fade-enter-active), :global(.fade-leave-active) { transition: opacity .18s; }
:global(.fade-enter-from),   :global(.fade-leave-to)     { opacity: 0; }
</style>
