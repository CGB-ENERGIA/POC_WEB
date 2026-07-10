<template>
  <div class="login-root">
    <div class="login-card">
      <div class="login-brand">
        <BrandLogo stacked :size="64" :title="BRAND.name" :subtitle="BRAND.tagline" />
      </div>

      <!-- Etapa 1: digitar email -->
      <template v-if="step === 'email'">
        <div class="login-title">Acesso ao Painel</div>
        <div class="login-sub">Digite seu e-mail corporativo para receber o código de acesso</div>
        <q-input
          v-model="email"
          outlined dense label="E-mail"
          type="email"
          placeholder="seu@email.com"
          class="q-mt-md"
          :disable="sending"
          @keyup.enter="enviarOtp"
        />
        <div v-if="erro" class="login-erro">
          <q-icon name="mdi-alert-circle-outline" size="14px" class="q-mr-xs" />{{ erro }}
        </div>
        <q-btn
          unelevated color="primary" label="Enviar código"
          class="q-mt-md full-width"
          :loading="sending"
          :disable="!email.trim()"
          @click="enviarOtp"
        />
      </template>

      <!-- Etapa 2: digitar código OTP -->
      <template v-else>
        <div class="login-title">Verifique seu e-mail</div>
        <div class="login-sub">
          Enviamos um código de 6 dígitos para <strong>{{ email }}</strong>
        </div>
        <q-input
          v-model="token"
          outlined dense label="Código"
          inputmode="numeric"
          placeholder="123456"
          maxlength="6"
          class="q-mt-md"
          :disable="verifying"
          @keyup.enter="verificarOtp"
        />
        <div v-if="erro" class="login-erro">
          <q-icon name="mdi-alert-circle-outline" size="14px" class="q-mr-xs" />{{ erro }}
        </div>
        <q-btn
          unelevated color="primary" label="Entrar"
          class="q-mt-md full-width"
          :loading="verifying"
          :disable="token.length < 6"
          @click="verificarOtp"
        />
        <q-btn
          flat color="grey-6" label="Usar outro e-mail"
          class="q-mt-xs full-width"
          @click="step = 'email'; token = ''; erro = null"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import BrandLogo from "@/components/BrandLogo.vue";
import { BRAND } from "@/constants/brand";

const router = useRouter();
const step = ref<"email" | "otp">("email");
const email = ref("");
const token = ref("");
const sending = ref(false);
const verifying = ref(false);
const erro = ref<string | null>(null);

async function enviarOtp() {
  if (!email.value.trim()) return;
  sending.value = true;
  erro.value = null;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { shouldCreateUser: true },
  });
  sending.value = false;
  if (error) { erro.value = error.message; return; }
  step.value = "otp";
}

async function verificarOtp() {
  if (token.value.length < 6) return;
  verifying.value = true;
  erro.value = null;
  const { error } = await supabase.auth.verifyOtp({
    email: email.value.trim(),
    token: token.value.trim(),
    type: "email",
  });
  verifying.value = false;
  if (error) { erro.value = "Código inválido ou expirado."; return; }
  await router.replace("/");
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 24px;
}
.login-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 36px 32px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 24px 48px rgba(0,0,0,.4);
}
.login-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}
.login-title {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  text-align: center;
  margin-bottom: 6px;
}
.login-sub {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.5;
}
.login-erro {
  font-size: 12px;
  color: #f87171;
  margin-top: 8px;
  display: flex;
  align-items: center;
}
</style>
