<template>
  <div class="rp-root">
    <div class="rp-stripe" aria-hidden="true" />
    <div class="rp-watermark" aria-hidden="true">CGB</div>
    <div class="rp-grid" aria-hidden="true" />

    <header class="rp-header">
      <div class="rp-brand">
        <span class="rp-brand__name">CGB Engenharia</span>
        <span class="rp-brand__sep" />
        <span class="rp-brand__product">Programa de Observação Comportamental</span>
      </div>
      <div class="rp-brand__system">Sistema de Auditagem · v2.0</div>
    </header>

    <main class="rp-main">
      <div class="rp-card">

        <!-- Ícone -->
        <div class="rp-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <!-- Sucesso -->
        <template v-if="done">
          <div class="rp-done-icon">✓</div>
          <p class="rp-title">Senha atualizada</p>
          <p class="rp-sub">Sua senha foi redefinida com sucesso. Use-a no próximo acesso.</p>
          <button class="rp-btn" @click="router.replace('/login')">Ir para o login</button>
        </template>

        <!-- Sessão expirada / sem token -->
        <template v-else-if="!hasSession">
          <p class="rp-title">Link expirado</p>
          <p class="rp-sub">Este link de recuperação não é mais válido. Solicite um novo.</p>
          <button class="rp-btn" @click="router.replace('/login')">Voltar ao login</button>
        </template>

        <!-- Formulário de nova senha -->
        <template v-else>
          <p class="rp-title">Nova senha</p>
          <p class="rp-sub">Escolha uma senha segura para a sua conta.</p>

          <div class="rp-field">
            <label class="rp-lbl" for="rp-pw1">NOVA SENHA</label>
            <div class="rp-input-wrap">
              <input
                id="rp-pw1"
                ref="pw1Ref"
                v-model="pw1"
                :type="show1 ? 'text' : 'password'"
                class="rp-input"
                placeholder="Mínimo 8 caracteres"
                :disabled="loading"
                autocomplete="new-password"
                @keyup.enter="pw2Ref?.focus()"
              />
              <button type="button" class="rp-eye" :aria-label="show1 ? 'Ocultar' : 'Mostrar'" @click="show1 = !show1">
                <EyeIcon :crossed="show1" />
              </button>
            </div>
            <div v-if="pw1" class="rp-strength">
              <div class="rp-strength__bar" :style="{ width: strength.pct + '%', background: strength.color }" />
              <span class="rp-strength__label" :style="{ color: strength.color }">{{ strength.label }}</span>
            </div>
          </div>

          <div class="rp-field">
            <label class="rp-lbl" for="rp-pw2">CONFIRMAR SENHA</label>
            <div class="rp-input-wrap">
              <input
                id="rp-pw2"
                ref="pw2Ref"
                v-model="pw2"
                :type="show2 ? 'text' : 'password'"
                class="rp-input"
                placeholder="Repita a senha"
                :disabled="loading"
                autocomplete="new-password"
                @keyup.enter="submit"
              />
              <button type="button" class="rp-eye" :aria-label="show2 ? 'Ocultar' : 'Mostrar'" @click="show2 = !show2">
                <EyeIcon :crossed="show2" />
              </button>
            </div>
            <Transition name="fade">
              <p v-if="pw2 && pw1 !== pw2" class="rp-mismatch">As senhas não coincidem</p>
            </Transition>
          </div>

          <Transition name="fade"><p v-if="erro" class="rp-err">{{ erro }}</p></Transition>

          <button
            class="rp-btn"
            :disabled="!canSubmit || loading"
            @click="submit"
          >
            <template v-if="!loading">Salvar nova senha</template>
            <span v-else class="rp-spin" />
          </button>
        </template>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();

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

const pw1    = ref("");
const pw2    = ref("");
const show1  = ref(false);
const show2  = ref(false);
const loading   = ref(false);
const erro      = ref<string | null>(null);
const done      = ref(false);
const hasSession = ref(false);
const pw1Ref = ref<HTMLInputElement | null>(null);
const pw2Ref = ref<HTMLInputElement | null>(null);

const strength = computed(() => {
  const p = pw1.value;
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { pct: 20,  color: "#E06070", label: "Fraca"   };
  if (score <= 2) return { pct: 45,  color: "#D9A441", label: "Razoável" };
  if (score <= 3) return { pct: 70,  color: "#5BA85F", label: "Boa"      };
  return               { pct: 100, color: "#2ECC71", label: "Forte"    };
});

const canSubmit = computed(() =>
  pw1.value.length >= 8 && pw1.value === pw2.value
);

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  hasSession.value = !!data.session;
  if (hasSession.value) nextTick(() => pw1Ref.value?.focus());
});

async function submit() {
  if (!canSubmit.value || loading.value) return;
  loading.value = true;
  erro.value    = null;

  const { error } = await supabase.auth.updateUser({ password: pw1.value });

  loading.value = false;
  if (error) {
    erro.value = error.message.includes("same password")
      ? "A nova senha não pode ser igual à anterior."
      : "Erro ao atualizar senha. Tente novamente.";
    return;
  }

  await supabase.auth.signOut();
  done.value = true;
}
</script>

<style scoped lang="scss">
.rp-root {
  position: relative; min-height: 100vh;
  background: #060C15; color: #E4EAF3;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: grid; grid-template-rows: auto 1fr;
}
.rp-stripe {
  position: fixed; top: 0; left: 0;
  width: 3px; height: 100%; background: #8B1C2B; z-index: 10;
}
.rp-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
  background-size: 52px 52px;
  pointer-events: none; z-index: 0;
}
.rp-watermark {
  position: fixed; right: -0.08em; bottom: -0.18em;
  font-size: clamp(200px, 28vw, 360px); font-weight: 900;
  letter-spacing: -0.04em; color: rgba(255,255,255,0.038);
  line-height: 1; user-select: none; pointer-events: none; z-index: 0;
}
.rp-header {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 52px 0;
}
.rp-brand { display: flex; align-items: center; gap: 12px; }
.rp-brand__name    { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #fff; }
.rp-brand__sep     { display: block; width: 1px; height: 12px; background: rgba(255,255,255,.2); }
.rp-brand__product { font-size: 10px; letter-spacing: .06em; color: rgba(255,255,255,.32); }
.rp-brand__system  { font-size: 10px; letter-spacing: .12em; color: rgba(255,255,255,.2); text-transform: uppercase; }

.rp-main {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.rp-card {
  width: 100%; max-width: 340px;
  display: flex; flex-direction: column; gap: 0;
}

.rp-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(139,28,43,.1); border: 1.5px solid rgba(139,28,43,.35);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.55); margin-bottom: 24px;
}
.rp-done-icon {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(46,204,113,.12); border: 1.5px solid #2ECC71;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #2ECC71; margin-bottom: 20px;
}
.rp-title { font-size: 22px; font-weight: 800; letter-spacing: -.02em; margin: 0 0 8px; }
.rp-sub   { font-size: 12.5px; color: rgba(255,255,255,.38); line-height: 1.6; margin: 0 0 28px; }

.rp-field { margin-bottom: 24px; }
.rp-lbl {
  display: block; font-size: 8.5px; font-weight: 700;
  letter-spacing: .2em; color: rgba(255,255,255,.25); margin-bottom: 10px;
}
.rp-input-wrap { position: relative; display: flex; align-items: center; }
.rp-input {
  display: block; width: 100%; box-sizing: border-box;
  background: transparent; border: none;
  border-bottom: 1.5px solid rgba(255,255,255,.14);
  padding: 10px 32px 10px 0; font-size: 14px; font-family: inherit;
  color: #E4EAF3; outline: none; transition: border-color .2s;
  &::placeholder { color: rgba(255,255,255,.18); }
  &:focus { border-bottom-color: #8B1C2B; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}
.rp-eye {
  position: absolute; right: 0; background: none; border: none;
  padding: 6px; cursor: pointer;
  display: flex; align-items: center; transition: opacity .18s;
  color: #8B1C2B; opacity: .7;
  &:hover { opacity: 1; }
}
.rp-mismatch { font-size: 10.5px; color: #E06070; margin: 6px 0 0; }

.rp-strength {
  margin-top: 8px; display: flex; align-items: center; gap: 10px;
}
.rp-strength__bar {
  flex: 1; height: 2px; border-radius: 2px;
  background: #8B1C2B; transition: width .3s, background .3s;
}
.rp-strength__label { font-size: 9.5px; letter-spacing: .08em; white-space: nowrap; }

.rp-err { font-size: 11.5px; color: #E06070; margin: 0 0 16px; line-height: 1.4; }

.rp-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 44px; margin-top: 4px;
  background: #8B1C2B; color: #fff;
  font-size: 12.5px; font-weight: 700; letter-spacing: .08em;
  border: none; border-radius: 2px; cursor: pointer;
  transition: background .18s, opacity .18s, transform .1s;
  font-family: inherit;
  &:hover:not(:disabled)  { background: #A0202F; }
  &:active:not(:disabled) { transform: scale(.98); }
  &:disabled { opacity: .35; cursor: not-allowed; }
}
.rp-spin {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.25); border-top-color: #fff;
  border-radius: 50%; animation: spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

:global(.fade-enter-active), :global(.fade-leave-active) { transition: opacity .18s; }
:global(.fade-enter-from),   :global(.fade-leave-to)     { opacity: 0; }

@media (max-width: 500px) {
  .rp-header { padding: 20px 24px 0; }
  .rp-brand__product, .rp-brand__system { display: none; }
}
</style>
