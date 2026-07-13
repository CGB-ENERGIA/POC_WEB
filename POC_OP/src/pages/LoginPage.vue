<!--
  Login: senha (Supabase Auth), Face ID (Edge Function face-login → RPC face_match,
  nunca altera a senha do usuário) e cadastro facial guiado em 3 poses.
  Schema e funções: supabase/migrations/.
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
        <p class="l-eyebrow">{{ title.eyebrow }}</p>
        <h1 class="l-display">
          <span class="l-display__line l-display__line--em">{{ title.line1 }}</span>
          <span class="l-display__line">{{ title.line2 }}</span>
        </h1>
        <div class="l-sep">
          <span class="l-sep__line" />
          <span class="l-sep__label">{{ title.sub }}</span>
        </div>
      </div>

      <!-- Coluna do formulário -->
      <div class="l-form-col">

        <!-- Abas de modo -->
        <div class="l-tabs" role="tablist">
          <button
            v-for="t in TABS" :key="t.id"
            role="tab"
            :aria-selected="mode === t.id"
            class="l-tab"
            :class="{ 'l-tab--active': mode === t.id }"
            @click="switchMode(t.id)"
          >{{ t.label }}</button>
        </div>

        <!-- ══ LOGIN ══ -->
        <div v-if="mode === 'login'" class="l-pane">
          <template v-if="!showFacePrompt">
            <!-- Sub-modo: Esqueci minha senha -->
            <template v-if="loginSub === 'forgot'">
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

              <button class="l-back" @click="loginSub = 'none'; forgotEmail = ''; forgotErro = null; forgotSent = false">
                <BackArrow /> Voltar ao login
              </button>
            </template>

            <!-- Sub-modo: Login normal -->
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
          </template>

          <!-- Prompt de cadastro facial (primeiro acesso) -->
          <div v-else class="l-face-prompt">
            <div class="l-face-prompt__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 5"/><circle cx="12" cy="12" r="10"/>
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              </svg>
            </div>
            <p class="l-face-prompt__title">Ativar Face ID?</p>
            <p class="l-face-prompt__sub">Entre mais rápido na próxima vez sem precisar digitar senha.</p>
            <button class="l-btn" @click="cadastrarAgora">Configurar Face ID</button>
            <button class="l-link-btn" @click="router.replace('/')">Agora não</button>
          </div>
          </div>

        <!-- ══ FACE LOGIN ══ -->
        <div v-else-if="mode === 'face'" class="l-pane">
            <p class="l-pane__label">RECONHECIMENTO FACIAL</p>

            <!-- Carregando modelos -->
            <div v-if="faceStatus === 'loading'" class="l-face-loading">
              <span class="l-spin l-spin--lg" />
              <p class="l-face-hint">Carregando modelos de IA...</p>
            </div>

            <!-- Câmera / scan -->
            <div v-else-if="faceStatus === 'scanning' || faceStatus === 'matched'" class="l-cam-area">
              <div
                class="l-cam-frame"
                :class="{
                  'l-cam-frame--detected': faceDetected && faceStatus === 'scanning',
                  'l-cam-frame--matched': faceStatus === 'matched',
                }"
              >
                <video ref="faceVideoRef" autoplay playsinline muted class="l-cam" />
                <!-- Cantos decorativos -->
                <span class="l-corner l-corner--tl" />
                <span class="l-corner l-corner--tr" />
                <span class="l-corner l-corner--bl" />
                <span class="l-corner l-corner--br" />
              </div>
              <p class="l-cam-status">
                <template v-if="faceStatus === 'matched'">
                  <span class="l-cam-status__icon">✓</span> Acesso liberado
                </template>
                <template v-else-if="faceDetected && scanProgress > 0">Analisando — mantenha-se parado</template>
                <template v-else-if="faceDetected">Rosto identificado...</template>
                <template v-else>Posicione seu rosto na câmera</template>
              </p>
              <div v-if="faceStatus === 'scanning' && scanProgress > 0" class="l-pose-bar">
                <div class="l-pose-bar__fill" :style="{ width: scanProgress + '%' }" />
              </div>
              <Transition name="fade"><p v-if="faceErro" class="l-err">{{ faceErro }}</p></Transition>
              <button v-if="faceNotFound" class="l-link-btn" @click="switchMode('cadastro')">
                Ainda sem cadastro? Registrar rosto →
              </button>
            </div>

            <!-- Erro de câmera / permissão -->
            <div v-else-if="faceStatus === 'error'" class="l-face-err-block">
              <p class="l-err">{{ faceErro }}</p>
              <button class="l-btn l-btn--ghost" @click="startFaceScan">Tentar novamente</button>
            </div>
          </div>

        <!-- ══ CADASTRO ══ -->
        <div v-else class="l-pane">
            <p class="l-pane__label">NOVO ACESSO</p>

            <!-- Passo 1: dados -->
            <div v-if="cadStep === 'form'">
                <div class="l-field">
                  <label class="l-field__lbl" for="cad-nome">NOME COMPLETO</label>
                  <input
                    id="cad-nome"
                    v-model="cadName"
                    type="text"
                    class="l-input"
                    placeholder="Nome Sobrenome"
                    :disabled="cadLoading"
                    @keyup.enter="cadEmailRef?.focus()"
                  />
                </div>

                <div class="l-field">
                  <label class="l-field__lbl" for="cad-email">E-MAIL CORPORATIVO</label>
                  <input
                    id="cad-email"
                    ref="cadEmailRef"
                    v-model="cadEmail"
                    type="email"
                    class="l-input"
                    placeholder="nome@cgbengenharia.com.br"
                    :disabled="cadLoading"
                    @keyup.enter="avancarParaCamera"
                  />
                </div>

                <Transition name="fade"><p v-if="cadErro" class="l-err">{{ cadErro }}</p></Transition>

                <button class="l-btn" :disabled="!cadName.trim() || !cadEmail.trim() || cadLoading" @click="avancarParaCamera">
                  Próximo: capturar rosto
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:8px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>

            <!-- Passo 2: câmera (captura guiada em 3 poses) -->
            <div v-else-if="cadStep === 'camera'">
                <p v-if="cadExistingUser" class="l-existing-email">{{ cadEmail }}</p>
                <div class="l-cam-area">
                  <div
                    class="l-cam-frame"
                    :class="{ 'l-cam-frame--detected': cadFaceDetected }"
                  >
                    <video ref="cadVideoRef" autoplay playsinline muted class="l-cam" />
                    <span class="l-corner l-corner--tl" />
                    <span class="l-corner l-corner--tr" />
                    <span class="l-corner l-corner--bl" />
                    <span class="l-corner l-corner--br" />
                  </div>

                  <!-- Etapas da captura -->
                  <div class="l-pose-steps">
                    <span
                      v-for="(p, i) in POSES" :key="i"
                      class="l-pose-dot"
                      :class="{
                        'l-pose-dot--done':   i < cadPoseIndex,
                        'l-pose-dot--active': i === cadPoseIndex && cadCapturing,
                      }"
                    >{{ i < cadPoseIndex ? "✓" : i + 1 }}</span>
                  </div>

                  <p class="l-cam-status">{{ cadInstruction }}</p>

                  <div v-if="cadCapturing" class="l-pose-bar">
                    <div class="l-pose-bar__fill" :style="{ width: cadPoseProgress + '%' }" />
                  </div>
                </div>

                <Transition name="fade"><p v-if="cadErro" class="l-err">{{ cadErro }}</p></Transition>

                <button
                  v-if="!cadCapturing && !cadLoading"
                  class="l-btn"
                  :disabled="!cadFaceDetected"
                  @click="iniciarCapturaGuiada"
                >
                  Iniciar captura guiada
                </button>
                <button v-else class="l-btn" disabled>
                  <template v-if="cadLoading"><span class="l-spin" /></template>
                  <template v-else>Capturando {{ cadPoseIndex + 1 }} de {{ POSES.length }}...</template>
                </button>

                <button class="l-back" @click="cancelarCaptura">
                  <BackArrow /> Voltar
                </button>
              </div>

            <!-- Passo 3: concluído -->
            <div v-else-if="cadStep === 'done'" class="l-done">
              <div class="l-done__icon">✓</div>
              <p class="l-done__msg">Solicitação enviada!<br>Aguarde a aprovação do administrador.</p>
              <button class="l-link-btn" @click="switchMode('login')">Voltar ao login</button>
            </div>
          </div>
      </div>
    </main>

    <footer class="l-footer">
      <span>BCB · BDC · ITM · PDS · PDT · STI</span>
      <span class="l-footer__sep">·</span>
      <span>GOMAN · GSTC</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import * as faceapi from "@vladmandic/face-api";

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

// ─── Constantes ───────────────────────────────────────────────────────────────
const MODEL_URL      = "/models";
const STABLE_NEEDED  = 8;  // frames com rosto antes de começar a coletar
const COLLECT_FRAMES = 15; // frames para calcular a média do descritor

const TABS = [
  { id: "login",    label: "Entrar" },
  { id: "face",     label: "Face ID" },
  { id: "cadastro", label: "Cadastrar" },
] as const;

type Mode = typeof TABS[number]["id"];

// ─── State ────────────────────────────────────────────────────────────────────
const router = useRouter();
const mode   = ref<Mode>("login");

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
type LoginSub = "none" | "forgot";
const loginSub        = ref<LoginSub>("none");
const forgotEmail     = ref("");
const forgotLoading   = ref(false);
const forgotErro      = ref<string | null>(null);
const forgotSent      = ref(false);
const forgotEmailRef  = ref<HTMLInputElement | null>(null);

const LAST_EMAIL_KEY = "cgb:last-email";

function checkCaps(e: KeyboardEvent) {
  capsOn.value = e.getModifierState?.("CapsLock") ?? false;
}

function abrirEsqueceu() {
  forgotEmail.value = email.value.trim();
  forgotErro.value  = null;
  forgotSent.value  = false;
  loginSub.value    = "forgot";
  nextTick(() => forgotEmailRef.value?.focus());
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

// face login
type FaceStatus = "idle" | "loading" | "scanning" | "matched" | "error";
const faceStatus   = ref<FaceStatus>("idle");
const faceDetected = ref(false);
const scanProgress = ref(0);
const faceErro     = ref<string | null>(null);
const faceNotFound = ref(false);
const faceVideoRef = ref<HTMLVideoElement | null>(null);

// prompt pós-login
const showFacePrompt = ref(false);

// cadastro
type CadStep = "form" | "camera" | "done";
const cadStep         = ref<CadStep>("form");
const cadName         = ref("");
const cadEmail        = ref("");
const cadLoading      = ref(false);
const cadErro         = ref<string | null>(null);
const cadFaceDetected = ref(false);
const cadVideoRef     = ref<HTMLVideoElement | null>(null);
const cadEmailRef     = ref<HTMLInputElement | null>(null);
const cadExistingUser = ref(false);

// captura guiada em poses
const POSES = [
  { instrucao: "Olhe diretamente para a câmera" },
  { instrucao: "Vire levemente o rosto para um lado" },
  { instrucao: "Agora vire para o lado oposto" },
] as const;
const FRAMES_PER_POSE = 8;
const cadCapturing   = ref(false);
const cadPoseIndex   = ref(0);
const cadPoseFrames  = ref(0);
let poseBuffer: Float32Array[]  = [];
let poseDescriptors: number[][] = [];
let poseSideSign = 0;   // lado escolhido na pose 2 (para exigir o oposto na 3)
let cadPhoto     = "";  // foto frontal para revisão do admin

const cadPoseProgress = computed(() =>
  Math.round((cadPoseFrames.value / FRAMES_PER_POSE) * 100)
);

const cadInstruction = computed(() => {
  if (cadLoading.value)    return "Enviando solicitação...";
  if (!cadCapturing.value) {
    return cadFaceDetected.value
      ? "Rosto detectado — pronto para iniciar"
      : "Posicione seu rosto no quadro";
  }
  if (!cadFaceDetected.value) return "Rosto perdido — reposicione no quadro";
  return POSES[cadPoseIndex.value]?.instrucao ?? "";
});

// câmera / modelos
let faceStream: MediaStream | null = null;
let cadStream:  MediaStream | null = null;
let rafId: number | null = null;
let cadRafId: number | null = null;
let modelsLoaded = false;
let stableFrames = 0;
let isScanning   = false;
let isCadCam     = false;
let descriptorBuffer: Float32Array[] = [];
let loginAttempts = 0;

// ─── Computed title ───────────────────────────────────────────────────────────
const title = computed(() => {
  if (mode.value === "face")     return { eyebrow: "Biometria facial",   line1: "Face",     line2: "ID.",         sub: "Reconhecimento automático"  };
  if (mode.value === "cadastro") return { eyebrow: "Novo usuário",        line1: "Cadastre", line2: "seu acesso.", sub: "Registro com face"           };
  return                                { eyebrow: "Área restrita",        line1: "Acesse",   line2: "o sistema.",  sub: "Credenciais corporativas"    };
});

// ─── Helpers face-api ─────────────────────────────────────────────────────────
async function ensureModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

const DETECT_OPTS = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

async function detectOnce(video: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(video, DETECT_OPTS)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
}

// ─── Câmera ───────────────────────────────────────────────────────────────────
async function openCamera(videoEl: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  });
  videoEl.srcObject = stream;
  await new Promise<void>((res) => { videoEl.onloadedmetadata = () => res(); });
  return stream;
}

function stopStream(s: MediaStream | null) {
  s?.getTracks().forEach((t) => t.stop());
}

// ─── Face LOGIN ──────────────────────────────────────────────────────────────
async function startFaceScan() {
  faceErro.value   = null;
  faceDetected.value = false;
  faceStatus.value   = "loading";
  isScanning         = true;
  stableFrames       = 0;

  try {
    await ensureModels();
    faceStatus.value = "scanning";
    await nextTick();

    if (!faceVideoRef.value) throw new Error("Elemento de vídeo não encontrado");
    faceStream = await openCamera(faceVideoRef.value);
    faceDetectLoop();
  } catch (e: unknown) {
    faceStatus.value = "error";
    const msg = (e as Error).message ?? String(e);
    if (msg.includes("Permission") || msg.includes("NotAllowed")) {
      faceErro.value = "Permissão de câmera negada. Habilite nas configurações do navegador.";
    } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
      faceErro.value = "Nenhuma câmera encontrada neste dispositivo.";
    } else {
      faceErro.value = msg || "Não foi possível iniciar a câmera.";
    }
    isScanning = false;
  }
}

function averageDescriptors(buf: Float32Array[]): Float32Array {
  const len = buf[0].length;
  const avg = new Float32Array(len);
  for (const d of buf) for (let i = 0; i < len; i++) avg[i] += d[i];
  for (let i = 0; i < len; i++) avg[i] /= buf.length;
  return avg;
}

function faceDetectLoop() {
  if (!isScanning || !faceVideoRef.value) return;

  detectOnce(faceVideoRef.value).then(async (result) => {
    if (!isScanning) return;

    if (result) {
      faceDetected.value = true;
      stableFrames++;

      if (stableFrames >= STABLE_NEEDED) {
        descriptorBuffer.push(result.descriptor);
        scanProgress.value = Math.round((descriptorBuffer.length / COLLECT_FRAMES) * 100);

        if (descriptorBuffer.length >= COLLECT_FRAMES) {
          const averaged = averageDescriptors(descriptorBuffer);
          descriptorBuffer = [];
          stableFrames     = 0;
          await tryFaceLogin(averaged);
        }
      }
    } else {
      faceDetected.value = false;
      stableFrames       = 0;
      descriptorBuffer   = [];
      scanProgress.value = 0;
    }

    if (isScanning) {
      rafId = requestAnimationFrame(faceDetectLoop);
    }
  });
}

async function tryFaceLogin(descriptor: Float32Array) {
  // Edge Function valida o rosto e retorna um magic link token —
  // a senha do usuário nunca é alterada.
  const { data, error } = await supabase.functions.invoke("face-login", {
    body: { descriptor: Array.from(descriptor) },
  });

  if (error || !data?.token_hash) {
    scanProgress.value = 0;
    loginAttempts++;
    if (loginAttempts >= 3) {
      faceErro.value     = "Rosto não reconhecido. Tente novamente.";
      faceNotFound.value = true;
      loginAttempts      = 0;
    }
    return;
  }

  loginAttempts = 0;

  faceNotFound.value = false;
  isScanning         = false;
  faceStatus.value = "matched";
  stopStream(faceStream);

  const { error: authErr } = await supabase.auth.verifyOtp({
    type:       "magiclink",
    token_hash: data.token_hash,
  });

  if (authErr) {
    faceStatus.value = "error";
    faceErro.value   = "Falha na autenticação. Contate o administrador.";
    return;
  }

  setTimeout(() => router.replace("/"), 800);
}

// ─── Cadastro ─────────────────────────────────────────────────────────────────
function avancarParaCamera() {
  cadErro.value = null;
  if (!cadName.value.trim())  { cadErro.value = "Informe o nome completo."; return; }
  if (!cadEmail.value.trim()) { cadErro.value = "Informe o e-mail."; return; }
  cadStep.value = "camera";
}

function capturePhotoBase64(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth  || 320;
  canvas.height = video.videoHeight || 240;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function startCadCam() {
  isCadCam           = true;
  cadFaceDetected.value = false;

  try {
    await ensureModels();
    await nextTick();
    if (!cadVideoRef.value) return;
    cadStream = await openCamera(cadVideoRef.value);
    cadDetectLoop();
  } catch {
    cadErro.value = "Não foi possível acessar a câmera.";
  }
}

function cadDetectLoop() {
  if (!isCadCam || !cadVideoRef.value) return;

  detectOnce(cadVideoRef.value).then((result) => {
    if (!isCadCam) return;
    cadFaceDetected.value = !!result;
    if (result && cadCapturing.value && !cadLoading.value) {
      processPoseFrame(result);
    }
    cadRafId = requestAnimationFrame(cadDetectLoop);
  });
}

// Razão nariz↔olhos para estimar rotação do rosto (yaw).
// ~1.0 = de frente; >1 ou <1 = rosto virado para um dos lados.
type DetectResult = NonNullable<Awaited<ReturnType<typeof detectOnce>>>;
function yawRatio(result: DetectResult): number | null {
  const pts = result.landmarks.positions;
  const nose = pts[30];                                       // ponta do nariz
  const le   = result.landmarks.getLeftEye();
  const re   = result.landmarks.getRightEye();
  if (!nose || !le.length || !re.length) return null;
  const leX = le.reduce((s, p) => s + p.x, 0) / le.length;
  const reX = re.reduce((s, p) => s + p.x, 0) / re.length;
  const dl = nose.x - leX;
  const dr = reX - nose.x;
  if (dl <= 0 || dr <= 0) return null;                        // rotação extrema
  return dl / dr;
}

function processPoseFrame(result: DetectResult) {
  const video = cadVideoRef.value!;

  // Gates de qualidade: confiança e tamanho mínimo do rosto no quadro
  if (result.detection.score < 0.55) return;
  if (result.detection.box.width < video.videoWidth * 0.22) return;

  const ratio = yawRatio(result);
  if (ratio === null) return;

  const idx = cadPoseIndex.value;
  let poseOk = false;

  if (idx === 0) {
    poseOk = ratio >= 0.7 && ratio <= 1.42;                   // de frente
  } else if (idx === 1) {
    if (ratio >= 1.55)      { poseOk = true; poseSideSign = +1; }
    else if (ratio <= 0.645){ poseOk = true; poseSideSign = -1; }
  } else if (idx === 2) {
    poseOk = poseSideSign > 0 ? ratio <= 0.645 : ratio >= 1.55; // lado oposto
  }
  if (!poseOk) return;

  poseBuffer.push(result.descriptor);
  cadPoseFrames.value = poseBuffer.length;

  if (poseBuffer.length >= FRAMES_PER_POSE) {
    poseDescriptors.push(Array.from(averageDescriptors(poseBuffer)));
    if (idx === 0) cadPhoto = capturePhotoBase64(video);      // foto frontal
    poseBuffer          = [];
    cadPoseFrames.value = 0;
    cadPoseIndex.value++;

    if (cadPoseIndex.value >= POSES.length) {
      cadCapturing.value = false;
      void submeterCadastro();
    }
  }
}

function iniciarCapturaGuiada() {
  cadErro.value       = null;
  poseBuffer          = [];
  poseDescriptors     = [];
  poseSideSign        = 0;
  cadPhoto            = "";
  cadPoseIndex.value  = 0;
  cadPoseFrames.value = 0;
  cadCapturing.value  = true;
}

function cancelarCaptura() {
  cadCapturing.value = false;
  poseBuffer         = [];
  poseDescriptors    = [];
  cadStep.value      = "form";
}

async function submeterCadastro() {
  cadLoading.value = true;
  cadErro.value    = null;

  try {
    if (poseDescriptors.length < POSES.length) {
      throw new Error("Captura incompleta. Tente novamente.");
    }

    const emailVal = cadEmail.value.trim();
    const nameVal  = cadName.value.trim();

    // Sempre associa o user_id se o usuário estiver logado
    const { data: sd } = await supabase.auth.getSession();
    const userId: string | null = sd.session?.user?.id ?? null;

    // Submete para aprovação do administrador:
    // descriptor  = pose frontal (compatibilidade com o fluxo antigo)
    // descriptors = as 3 poses (frente, lado A, lado B)
    const { error: dbErr } = await supabase.from("pending_face_registrations").insert({
      name:         nameVal,
      email:        emailVal,
      user_id:      userId,
      descriptor:   poseDescriptors[0],
      descriptors:  poseDescriptors,
      photo_base64: cadPhoto,
    });

    if (dbErr) throw new Error("Erro ao enviar solicitação: " + dbErr.message);

    isCadCam  = false;
    stopStream(cadStream);
    cadExistingUser.value = false;
    cadStep.value = "done";
  } catch (e: unknown) {
    cadErro.value = (e as Error).message;
    // Permite tentar de novo sem sair da câmera
    cadPoseIndex.value  = 0;
    cadPoseFrames.value = 0;
    poseDescriptors     = [];
  } finally {
    cadLoading.value = false;
  }
}

// ─── Login normal ─────────────────────────────────────────────────────────────
async function entrar() {
  if (!email.value.trim() || !senha.value || loading.value) return;
  loading.value   = true;
  loginErro.value = null;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email:    email.value.trim(),
    password: senha.value,
  });

  loading.value = false;
  if (error) { loginErro.value = "E-mail ou senha incorretos."; return; }

  // Lembra o e-mail para o próximo acesso
  try { localStorage.setItem(LAST_EMAIL_KEY, email.value.trim()); } catch { /* storage indisponível */ }

  // Admin não precisa de Face ID — vai direto para o dashboard
  const ADMIN_EMAIL = "italo.fontes@cgbengenharia.com.br";
  if (authData.user!.email === ADMIN_EMAIL) {
    await router.replace("/");
    return;
  }

  // Para outros usuários: sugere cadastrar Face ID se ainda não tem
  const { data: faceRows } = await supabase
    .from("face_descriptors")
    .select("id")
    .eq("user_id", authData.user!.id)
    .limit(1);

  if (!faceRows || faceRows.length === 0) {
    showFacePrompt.value = true;
  } else {
    await router.replace("/");
  }
}

function cadastrarAgora() {
  cadEmail.value = email.value.trim();
  switchMode("cadastro");
  cadExistingUser.value = true;
}

// ─── Troca de modo ───────────────────────────────────────────────────────────
function stopAll() {
  isScanning       = false;
  isCadCam         = false;
  descriptorBuffer = [];
  loginAttempts    = 0;
  stableFrames     = 0;
  if (rafId)    { cancelAnimationFrame(rafId);    rafId    = null; }
  if (cadRafId) { cancelAnimationFrame(cadRafId); cadRafId = null; }
  stopStream(faceStream); faceStream = null;
  stopStream(cadStream);  cadStream  = null;
}

function switchMode(m: Mode) {
  stopAll();
  faceStatus.value      = "idle";
  faceDetected.value    = false;
  scanProgress.value    = 0;
  loginSub.value        = "none";
  forgotEmail.value     = "";
  forgotErro.value      = null;
  forgotSent.value      = false;
  faceErro.value        = null;
  faceNotFound.value    = false;
  showFacePrompt.value  = false;
  cadExistingUser.value = false;
  cadStep.value         = "form";
  cadName.value         = "";
  cadFaceDetected.value = false;
  cadErro.value         = null;
  cadCapturing.value    = false;
  cadPoseIndex.value    = 0;
  cadPoseFrames.value   = 0;
  poseBuffer            = [];
  poseDescriptors       = [];
  poseSideSign          = 0;
  cadPhoto              = "";
  loginErro.value       = null;
  mode.value            = m;
}

// Auto-inicia câmeras ao entrar nos modos
watch(mode, (m) => {
  if (m === "face") {
    nextTick(() => startFaceScan());
  }
  if (m === "cadastro" && cadExistingUser.value) {
    nextTick(() => { cadStep.value = "camera"; });
  }
});

watch(cadStep, (s) => {
  if (s === "camera") {
    nextTick(() => startCadCam());
  }
});

onMounted(() => {
  // Pré-preenche o último e-mail usado e foca o campo certo
  try {
    const saved = localStorage.getItem(LAST_EMAIL_KEY);
    if (saved) email.value = saved;
  } catch { /* storage indisponível */ }
  nextTick(() => (email.value ? senhaRef.value : emailRef.value)?.focus());
});

onUnmounted(stopAll);
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

// ─── Abas ────────────────────────────────────────────────────────────────────
.l-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
  margin-bottom: 28px;
}
.l-tab {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255,255,255,.28);
  cursor: pointer;
  transition: color .2s, border-color .2s;
  font-family: inherit;

  &:hover { color: rgba(255,255,255,.55); }
  &--active {
    color: #fff;
    border-bottom-color: #8B1C2B;
  }
}

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

// ─── Câmera ──────────────────────────────────────────────────────────────────
.l-cam-area {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; margin-bottom: 20px;
}

.l-cam-frame {
  position: relative;
  width: 220px; height: 220px;
  border-radius: 2px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,.1);
  transition: border-color .3s;

  &--detected { border-color: rgba(139,28,43,.7); }
  &--matched  {
    border-color: #2ECC71;
    box-shadow: 0 0 24px rgba(46,204,113,.3);
  }
}

.l-cam {
  width: 100%; height: 100%;
  object-fit: cover;
  transform: scaleX(-1); // espelho
  display: block;
}

// Cantos estilo HUD
.l-corner {
  position: absolute;
  width: 14px; height: 14px;
  border-color: #8B1C2B;
  border-style: solid;
  pointer-events: none;
  transition: border-color .3s;

  .l-cam-frame--detected & { border-color: #C0263A; }
  .l-cam-frame--matched  & { border-color: #2ECC71; }

  &--tl { top: 8px; left: 8px;   border-width: 2px 0 0 2px; }
  &--tr { top: 8px; right: 8px;  border-width: 2px 2px 0 0; }
  &--bl { bottom: 8px; left: 8px;  border-width: 0 0 2px 2px; }
  &--br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }
}

.l-cam-status {
  font-size: 11px; letter-spacing: .06em;
  color: rgba(255,255,255,.4); text-align: center;
}

// ─── Captura guiada (poses) ──────────────────────────────────────────────────
.l-pose-steps {
  display: flex; gap: 10px; justify-content: center;
}
.l-pose-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  border: 1.5px solid rgba(255,255,255,.15);
  color: rgba(255,255,255,.3);
  transition: all .25s;

  &--active {
    border-color: #8B1C2B;
    color: #fff;
    box-shadow: 0 0 10px rgba(139,28,43,.5);
  }
  &--done {
    border-color: #2ECC71;
    background: rgba(46,204,113,.12);
    color: #2ECC71;
  }
}
.l-pose-bar {
  width: 220px; height: 3px;
  background: rgba(255,255,255,.08);
  border-radius: 2px; overflow: hidden;
}
.l-pose-bar__fill {
  height: 100%;
  background: #8B1C2B;
  transition: width .15s ease-out;
}
.l-cam-status__icon {
  color: #2ECC71;
  font-weight: 700;
  margin-right: 4px;
}

// ─── Face loading ─────────────────────────────────────────────────────────────
.l-face-loading {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 32px 0;
}
.l-face-hint { font-size: 12px; color: rgba(255,255,255,.35); letter-spacing: .06em; }
.l-face-err-block { display: flex; flex-direction: column; gap: 16px; }

// ─── Concluído ────────────────────────────────────────────────────────────────
.l-done {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 32px 0;
}
.l-done__icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: rgba(46,204,113,.15);
  border: 1.5px solid #2ECC71;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #2ECC71;
}
.l-done__msg {
  text-align: center; font-size: 13px; line-height: 1.7;
  color: rgba(255,255,255,.55);
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

  &--ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,.15);
    color: rgba(255,255,255,.55);
    &:hover:not(:disabled) { background: rgba(255,255,255,.05); }
  }
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

  &--lg { width: 28px; height: 28px; }
}
@keyframes spin { to { transform: rotate(360deg); } }

// ─── Face prompt (pós-login) ──────────────────────────────────────────────────
.l-face-prompt {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 16px 0; text-align: center;
}
.l-face-prompt__icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 1.5px solid rgba(139,28,43,.45);
  background: rgba(139,28,43,.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.55);
}
.l-face-prompt__title {
  font-size: 15px; font-weight: 700; color: #E4EAF3; margin: 0;
  letter-spacing: -.01em;
}
.l-face-prompt__sub {
  font-size: 11.5px; color: rgba(255,255,255,.32); margin: 0;
  line-height: 1.6; max-width: 240px;
}

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

// ─── Email label cadastro existente ──────────────────────────────────────────
.l-existing-email {
  font-size: 11px; color: rgba(255,255,255,.3); text-align: center;
  margin: 0 0 12px; letter-spacing: .06em;
}

// ─── Footer ──────────────────────────────────────────────────────────────────
.l-footer {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 10px;
  padding: 20px 52px 28px;
  font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase;
  color: rgba(255,255,255,.15);
}
.l-footer__sep { opacity: .4; }

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

// fade: transição de opacidade para mensagens inline (global: scoped não afeta classes Vue Transition)
:global(.fade-enter-active), :global(.fade-leave-active) { transition: opacity .18s; }
:global(.fade-enter-from),   :global(.fade-leave-to)     { opacity: 0; }
</style>

