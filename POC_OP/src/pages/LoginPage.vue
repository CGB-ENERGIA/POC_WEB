<!--
  SQL MIGRATION — rode no Supabase SQL Editor antes de usar Face ID:

  CREATE TABLE IF NOT EXISTS public.face_descriptors (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email      text NOT NULL,
    descriptor float8[] NOT NULL,
    face_token text NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE public.face_descriptors ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon select desc only" ON public.face_descriptors
    FOR SELECT TO anon USING (true);
  CREATE POLICY "owner manage" ON public.face_descriptors
    FOR ALL TO authenticated USING (user_id = auth.uid());

  CREATE OR REPLACE FUNCTION public.face_authenticate(input_descriptor float8[])
  RETURNS json
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE
    rec       RECORD;
    dist      float8;
    best_dist float8 := 1.0;
    best_row  public.face_descriptors;
  BEGIN
    FOR rec IN SELECT * FROM public.face_descriptors LOOP
      SELECT sqrt(sum(pow(a.v - b.v, 2)))
      INTO dist
      FROM unnest(input_descriptor) WITH ORDINALITY AS a(v, i)
      JOIN unnest(rec.descriptor) WITH ORDINALITY AS b(v, i) ON a.i = b.i;

      IF dist < best_dist THEN
        best_dist := dist;
        best_row  := rec;
      END IF;
    END LOOP;

    IF best_dist < 0.55 THEN
      RETURN json_build_object('email', best_row.email, 'token', best_row.face_token);
    END IF;
    RETURN NULL;
  END;
  $$;
  GRANT EXECUTE ON FUNCTION public.face_authenticate TO anon;
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
            <p class="l-pane__label">IDENTIFICAÇÃO</p>

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
                />
                <button type="button" class="l-eye" :aria-label="showSenha ? 'Ocultar' : 'Mostrar'" @click="showSenha = !showSenha">
                  <EyeIcon :crossed="showSenha" />
                </button>
              </div>
            </div>

            <Transition name="fade"><p v-if="loginErro" class="l-err" role="alert">{{ loginErro }}</p></Transition>

            <button class="l-btn" :disabled="!email.trim() || !senha || loading" @click="entrar">
              <template v-if="!loading">Entrar no sistema</template>
              <span v-else class="l-spin" />
            </button>

            <div class="l-divider"><span>ou</span></div>

            <button class="l-btn l-btn--github" :disabled="loading" @click="loginGithub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px;flex-shrink:0"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
              Entrar com GitHub
            </button>
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
                <template v-else-if="faceDetected">Rosto identificado — aguardando...</template>
                <template v-else>Posicione seu rosto na câmera</template>
              </p>
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
                <div
                  class="l-cam-area"
                  :class="{ 'l-cam-area--sm': true }"
                >
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
import { ref, computed, watch, onUnmounted, nextTick, defineComponent, h } from "vue";
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
const senhaRef  = ref<HTMLInputElement | null>(null);

// face login
type FaceStatus = "idle" | "loading" | "scanning" | "matched" | "error";
const faceStatus   = ref<FaceStatus>("idle");
const faceDetected = ref(false);
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

async function loginGithub() {
  loading.value   = true;
  loginErro.value = null;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.origin + "/#/" },
  });
  if (error) {
    loginErro.value = error.message;
    loading.value   = false;
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

  &--github {
    background: #24292e;
    border: 1px solid rgba(255,255,255,.12);
    font-size: 12px; letter-spacing: .04em;
    &:hover:not(:disabled) { background: #2f363d; }
  }
}

.l-divider {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 12px;
  &::before, &::after {
    content: ""; flex: 1;
    height: 1px; background: rgba(255,255,255,.08);
  }
  span { font-size: 10px; color: rgba(255,255,255,.2); letter-spacing: .12em; text-transform: uppercase; }
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

