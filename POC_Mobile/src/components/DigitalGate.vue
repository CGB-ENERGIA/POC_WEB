<!--
  DigitalGate — autenticação por digital/biometria do dispositivo (WebAuthn).
  mode="enroll": registra uma credencial de plataforma (Touch ID, impressão digital).
                 Emite `enrolled(credentialId: string)`.
  mode="scan":   verifica a credencial existente.
                 Emite `matched(matricula: string)`.
  Emite `cancel` se o usuário cancelar.
-->
<template>
  <div class="dgw-root">

    <!-- Não suportado -->
    <div v-if="!supported" class="dgw-center">
      <q-icon name="mdi-alert-circle-outline" size="46px" color="warning" />
      <p class="dgw-sub">Seu dispositivo não suporta autenticação biométrica pelo navegador.</p>
      <q-btn flat no-caps color="grey-7" label="Cancelar" @click="emit('cancel')" />
    </div>

    <!-- Pronto para agir -->
    <div v-else-if="status === 'idle'" class="dgw-center">
      <div class="dgw-icon">
        <q-icon name="mdi-fingerprint" size="48px" color="primary" />
      </div>
      <p class="dgw-title">
        {{ mode === 'enroll' ? 'Cadastrar digital' : 'Entrar com digital' }}
      </p>
      <p class="dgw-sub">
        {{ mode === 'enroll'
            ? 'Toque no botão abaixo — o celular pedirá sua digital ou biometria facial.'
            : 'Verifique sua biometria para entrar.' }}
      </p>

      <q-btn
        class="full-width btn-primary-lg q-mt-lg"
        color="primary"
        size="lg"
        unelevated
        no-caps
        :label="mode === 'enroll' ? 'Cadastrar digital' : 'Verificar digital'"
        icon="mdi-fingerprint"
        :loading="working"
        @click="execute"
      />
      <q-btn flat no-caps color="grey-7" label="Cancelar" class="q-mt-sm" @click="emit('cancel')" />
    </div>

    <!-- Sucesso -->
    <div v-else-if="status === 'done'" class="dgw-center">
      <div class="dgw-ok">
        <q-icon name="mdi-check" size="32px" color="positive" />
      </div>
      <p class="dgw-title">{{ mode === 'enroll' ? 'Digital cadastrada!' : 'Verificado!' }}</p>
    </div>

    <!-- Erro -->
    <div v-else-if="status === 'error'" class="dgw-center">
      <q-icon name="mdi-alert-circle-outline" size="46px" color="negative" />
      <p class="dgw-sub dgw-sub--err">{{ errorMsg }}</p>
      <q-btn color="primary" unelevated no-caps label="Tentar novamente" @click="status = 'idle'" />
      <q-btn flat no-caps color="grey-7" label="Cancelar" class="q-mt-xs" @click="emit('cancel')" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getSupabase } from "@/lib/supabase";

const props = defineProps<{
  mode: "enroll" | "scan";
  matricula?: string;
  nome?: string;
  credentialIds?: string[];
}>();

const emit = defineEmits<{
  enrolled: [credentialId: string];
  matched: [matricula: string];
  cancel: [];
}>();

const supabase = getSupabase();

type Status = "idle" | "done" | "error";
const supported = ref(true);
const status    = ref<Status>("idle");
const working   = ref(false);
const errorMsg  = ref("");

// ── Helpers base64url ────────────────────────────────────────────────────────
function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlToBuf(b64: string): ArrayBuffer {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return buf.buffer;
}

function randomChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// ── Verificação de suporte ───────────────────────────────────────────────────
onMounted(async () => {
  try {
    if (!window.PublicKeyCredential) { supported.value = false; return; }
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!ok) supported.value = false;
  } catch {
    supported.value = false;
  }
});

// ── Execução ─────────────────────────────────────────────────────────────────
async function execute() {
  if (props.mode === "enroll") {
    await enroll();
  } else {
    await scan();
  }
}

async function enroll() {
  if (!props.matricula || !props.nome) return;
  working.value = true;
  errorMsg.value = "";

  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "CGB POC", id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(props.matricula),
          name: props.matricula,
          displayName: props.nome,
        },
        pubKeyCredParams: [
          { alg: -7,   type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!cred) throw new Error("Credencial não criada.");

    const credId = bufToB64url(cred.rawId);

    const { error } = await supabase.from("mobile_device_credentials").insert({
      matricula: props.matricula,
      nome: props.nome,
      credential_id: credId,
    });
    if (error) throw new Error("Erro ao salvar: " + error.message);

    status.value = "done";
    setTimeout(() => emit("enrolled", credId), 600);
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("NotAllowedError") || msg.includes("cancelled") || msg.includes("cancel")) {
      emit("cancel");
      return;
    }
    status.value = "error";
    errorMsg.value = "Não foi possível cadastrar a biometria. Tente novamente.";
  } finally {
    working.value = false;
  }
}

async function scan() {
  working.value = true;
  errorMsg.value = "";

  try {
    const allowCredentials: PublicKeyCredentialDescriptor[] =
      (props.credentialIds ?? []).map((id) => ({
        id: b64urlToBuf(id),
        type: "public-key" as const,
      }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: allowCredentials.length ? allowCredentials : undefined,
        userVerification: "required",
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) throw new Error("Verificação cancelada.");

    // Verifica que o credential_id retornado pertence à matrícula esperada
    const returnedId = bufToB64url(assertion.rawId);
    const known = (props.credentialIds ?? []).includes(returnedId);
    if (!known) throw new Error("Credencial não reconhecida para esta matrícula.");

    status.value = "done";
    setTimeout(() => emit("matched", props.matricula ?? ""), 600);
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("NotAllowedError") || msg.includes("cancelled") || msg.includes("cancel")) {
      emit("cancel");
      return;
    }
    if (msg.includes("não reconhecida")) {
      status.value = "error";
      errorMsg.value = "A biometria registrada não corresponde a esta matrícula.";
      return;
    }
    status.value = "error";
    errorMsg.value = "Não foi possível verificar a biometria. Tente novamente.";
  } finally {
    working.value = false;
  }
}
</script>

<style scoped>
.dgw-root { width: 100%; }

.dgw-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0 8px;
  text-align: center;
}

.dgw-icon {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(139, 28, 43, 0.07);
  border: 1.5px solid rgba(139, 28, 43, 0.25);
  display: flex; align-items: center; justify-content: center;
}

.dgw-ok {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(46, 204, 113, 0.1);
  border: 1.5px solid rgba(46, 204, 113, 0.5);
  display: flex; align-items: center; justify-content: center;
}

.dgw-title { font-size: 17px; font-weight: 700; margin: 0; letter-spacing: -.01em; }
.dgw-sub   { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; max-width: 280px; }
.dgw-sub--err { color: #c0392b; }
</style>
