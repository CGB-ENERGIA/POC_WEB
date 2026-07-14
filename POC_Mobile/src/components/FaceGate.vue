<!--
  FaceGate — reconhecimento e cadastro facial do PWA, vinculado à MATRÍCULA.
  mode="scan":   reconhece o rosto e emite `matched` com a matrícula encontrada.
  mode="enroll": captura guiada em 3 poses, envia para mobile_face_pending
                 (aprovação do admin no dashboard) e emite `enrolled`.
  Mesma pipeline do dashboard (tiny detector + landmarks + descritor 128d).
-->
<template>
  <div class="fg-root">
    <!-- Carregando modelos -->
    <div v-if="status === 'loading'" class="fg-center">
      <q-spinner-dots size="42px" color="primary" />
      <p class="fg-hint">Carregando modelos de IA...</p>
    </div>

    <!-- Câmera -->
    <div v-else-if="status === 'camera'" class="fg-cam-area">
      <div
        class="fg-frame"
        :class="{ 'fg-frame--ok': faceDetected, 'fg-frame--matched': matched }"
      >
        <video ref="videoRef" autoplay playsinline muted class="fg-video" />
        <span class="fg-corner fg-corner--tl" />
        <span class="fg-corner fg-corner--tr" />
        <span class="fg-corner fg-corner--bl" />
        <span class="fg-corner fg-corner--br" />
      </div>

      <p class="fg-status">{{ statusText }}</p>

      <q-linear-progress
        v-if="progress > 0"
        :value="progress / 100"
        color="primary"
        rounded
        size="6px"
        class="q-mb-md"
      />

      <!-- Passos das poses (enroll) -->
      <div v-if="mode === 'enroll' && capturing" class="fg-poses">
        <span
          v-for="(p, i) in POSES"
          :key="i"
          class="fg-pose-dot"
          :class="{
            'fg-pose-dot--done': i < poseIndex,
            'fg-pose-dot--active': i === poseIndex,
          }"
        />
      </div>

      <q-btn
        v-if="mode === 'enroll' && !capturing && !submitting"
        class="full-width btn-primary-lg"
        color="primary"
        unelevated
        no-caps
        size="lg"
        label="Iniciar captura"
        icon="mdi-face-recognition"
        :disable="!faceDetected"
        @click="startGuidedCapture"
      />

      <q-btn
        class="full-width q-mt-sm"
        flat
        no-caps
        color="grey-7"
        label="Cancelar"
        :disable="submitting"
        @click="cancel"
      />
    </div>

    <!-- Erro -->
    <div v-else-if="status === 'error'" class="fg-center">
      <q-icon name="mdi-alert-circle-outline" size="46px" color="negative" />
      <p class="fg-hint fg-hint--err">{{ errorMsg }}</p>
      <q-btn
        class="q-mt-sm"
        color="primary"
        unelevated
        no-caps
        label="Tentar novamente"
        @click="start"
      />
      <q-btn flat no-caps color="grey-7" label="Cancelar" class="q-mt-xs" @click="cancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import * as faceapi from "@vladmandic/face-api";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

const props = defineProps<{
  mode: "scan" | "enroll";
  matricula?: string;
  nome?: string;
}>();

const emit = defineEmits<{
  matched: [matricula: string, nome: string];
  enrolled: [];
  cancel: [];
}>();

const MODEL_URL      = "models";
const STABLE_NEEDED  = 8;
const COLLECT_FRAMES = 15;
const FRAMES_PER_POSE = 8;

const POSES = [
  { instrucao: "Olhe diretamente para a câmera" },
  { instrucao: "Vire levemente o rosto para um lado" },
  { instrucao: "Agora vire para o lado oposto" },
] as const;

type Status = "loading" | "camera" | "error";
const status       = ref<Status>("loading");
const faceDetected = ref(false);
const matched      = ref(false);
const progress     = ref(0);
const errorMsg     = ref("");
const capturing    = ref(false);
const submitting   = ref(false);
const poseIndex    = ref(0);
const poseFrames   = ref(0);
const videoRef     = ref<HTMLVideoElement | null>(null);

let stream: MediaStream | null = null;
let rafId: number | null = null;
let running = false;
let modelsLoaded = false;
let stableFrames = 0;
let scanAttempts = 0;
let scanBuffer: Float32Array[] = [];
let poseBuffer: Float32Array[] = [];
let poseDescriptors: number[][] = [];
let poseSideSign = 0;
let photoBase64 = "";

const statusText = computed(() => {
  if (submitting.value) return "Enviando solicitação...";
  if (matched.value)    return "Rosto reconhecido!";
  if (props.mode === "enroll") {
    if (!capturing.value) {
      return faceDetected.value
        ? "Rosto detectado — pronto para iniciar"
        : "Posicione seu rosto no quadro";
    }
    if (!faceDetected.value) return "Rosto perdido — reposicione no quadro";
    return POSES[poseIndex.value]?.instrucao ?? "";
  }
  return faceDetected.value ? "Analisando..." : "Posicione seu rosto no quadro";
});

const DETECT_OPTS = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

async function ensureModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

async function detectOnce(video: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(video, DETECT_OPTS)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
}

type DetectResult = NonNullable<Awaited<ReturnType<typeof detectOnce>>>;

function averageDescriptors(buf: Float32Array[]): Float32Array {
  const len = buf[0]!.length;
  const avg = new Float32Array(len);
  for (const d of buf) for (let i = 0; i < len; i++) avg[i] = (avg[i] ?? 0) + (d[i] ?? 0);
  for (let i = 0; i < len; i++) avg[i] = (avg[i] ?? 0) / buf.length;
  return avg;
}

async function start() {
  errorMsg.value     = "";
  faceDetected.value = false;
  matched.value      = false;
  progress.value     = 0;
  capturing.value    = false;
  submitting.value   = false;
  stableFrames = 0;
  scanBuffer = [];
  scanAttempts = 0;
  status.value = "loading";

  try {
    await ensureModels();
    status.value = "camera";
    await nextTick();
    if (!videoRef.value) throw new Error("Elemento de vídeo não encontrado");

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    });
    videoRef.value.srcObject = stream;
    await new Promise<void>((res) => { videoRef.value!.onloadedmetadata = () => res(); });

    running = true;
    detectLoop();
  } catch (e: unknown) {
    status.value = "error";
    const msg = (e as Error).message ?? String(e);
    if (msg.includes("Permission") || msg.includes("NotAllowed")) {
      errorMsg.value = "Permissão de câmera negada. Habilite nas configurações do navegador.";
    } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
      errorMsg.value = "Nenhuma câmera encontrada neste dispositivo.";
    } else {
      errorMsg.value = msg || "Não foi possível iniciar a câmera.";
    }
  }
}

function detectLoop() {
  if (!running || !videoRef.value) return;

  detectOnce(videoRef.value).then(async (result) => {
    if (!running) return;

    if (props.mode === "scan") {
      await handleScanFrame(result);
    } else {
      handleEnrollFrame(result);
    }

    if (running) rafId = requestAnimationFrame(detectLoop);
  });
}

// ── Modo SCAN (login por Face ID) ────────────────────────────────────────────
async function handleScanFrame(result: Awaited<ReturnType<typeof detectOnce>>) {
  if (result) {
    faceDetected.value = true;
    stableFrames++;

    if (stableFrames >= STABLE_NEEDED) {
      scanBuffer.push(result.descriptor);
      progress.value = Math.round((scanBuffer.length / COLLECT_FRAMES) * 100);

      if (scanBuffer.length >= COLLECT_FRAMES) {
        const averaged = averageDescriptors(scanBuffer);
        scanBuffer = [];
        stableFrames = 0;
        await tryMatch(averaged);
      }
    }
  } else {
    faceDetected.value = false;
    stableFrames = 0;
    scanBuffer = [];
    progress.value = 0;
  }
}

async function tryMatch(descriptor: Float32Array) {
  const { data, error } = await supabase.rpc("mobile_face_match", {
    p_descriptor: Array.from(descriptor),
  });

  if (error || !data || data.error || !data.matricula) {
    progress.value = 0;
    scanAttempts++;
    if (scanAttempts >= 3) {
      running = false;
      stopStream();
      status.value   = "error";
      errorMsg.value = "Rosto não reconhecido. Aproxime-se da câmera e tente novamente.";
      scanAttempts = 0;
    }
    return;
  }

  running = false;
  matched.value = true;
  stopStream();
  setTimeout(() => emit("matched", data.matricula as string, (data.nome as string) ?? ""), 600);
}

// ── Modo ENROLL (cadastro guiado em 3 poses) ─────────────────────────────────
function yawRatio(result: DetectResult): number | null {
  const pts  = result.landmarks.positions;
  const nose = pts[30];
  const le   = result.landmarks.getLeftEye();
  const re   = result.landmarks.getRightEye();
  if (!nose || !le.length || !re.length) return null;
  const leX = le.reduce((s, p) => s + p.x, 0) / le.length;
  const reX = re.reduce((s, p) => s + p.x, 0) / re.length;
  const dl = nose.x - leX;
  const dr = reX - nose.x;
  if (dl <= 0 || dr <= 0) return null;
  return dl / dr;
}

function capturePhoto(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width  = video.videoWidth  || 320;
  canvas.height = video.videoHeight || 240;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function startGuidedCapture() {
  poseBuffer = [];
  poseDescriptors = [];
  poseSideSign = 0;
  photoBase64 = "";
  poseIndex.value = 0;
  poseFrames.value = 0;
  capturing.value = true;
}

function handleEnrollFrame(result: Awaited<ReturnType<typeof detectOnce>>) {
  faceDetected.value = !!result;
  if (!result || !capturing.value || submitting.value) return;

  const video = videoRef.value!;
  if (result.detection.score < 0.55) return;
  if (result.detection.box.width < video.videoWidth * 0.22) return;

  const ratio = yawRatio(result);
  if (ratio === null) return;

  const idx = poseIndex.value;
  let poseOk = false;

  if (idx === 0) {
    poseOk = ratio >= 0.7 && ratio <= 1.42;
  } else if (idx === 1) {
    if (ratio >= 1.55)       { poseOk = true; poseSideSign = +1; }
    else if (ratio <= 0.645) { poseOk = true; poseSideSign = -1; }
  } else if (idx === 2) {
    poseOk = poseSideSign > 0 ? ratio <= 0.645 : ratio >= 1.55;
  }
  if (!poseOk) return;

  poseBuffer.push(result.descriptor);
  poseFrames.value = poseBuffer.length;
  progress.value = Math.round((poseBuffer.length / FRAMES_PER_POSE) * 100);

  if (poseBuffer.length >= FRAMES_PER_POSE) {
    poseDescriptors.push(Array.from(averageDescriptors(poseBuffer)));
    if (idx === 0) photoBase64 = capturePhoto(video);
    poseBuffer = [];
    poseFrames.value = 0;
    progress.value = 0;
    poseIndex.value++;

    if (poseIndex.value >= POSES.length) {
      capturing.value = false;
      void submitEnrollment();
    }
  }
}

async function submitEnrollment() {
  submitting.value = true;
  try {
    const { error } = await supabase.from("mobile_face_pending").insert({
      matricula: props.matricula,
      nome: props.nome,
      descriptors: poseDescriptors,
      photo_base64: photoBase64,
    });
    if (error) throw new Error(error.message);

    running = false;
    stopStream();
    emit("enrolled");
  } catch (e: unknown) {
    status.value   = "error";
    running = false;
    stopStream();
    errorMsg.value = "Erro ao enviar cadastro: " + (e as Error).message;
    poseDescriptors = [];
    poseIndex.value = 0;
  } finally {
    submitting.value = false;
  }
}

// ── Ciclo de vida ────────────────────────────────────────────────────────────
function stopStream() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

function cancel() {
  running = false;
  stopStream();
  emit("cancel");
}

onMounted(start);
onUnmounted(() => { running = false; stopStream(); });
</script>

<style scoped>
.fg-root { width: 100%; }

.fg-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  text-align: center;
}

.fg-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.fg-hint--err { color: #c0392b; }

.fg-cam-area { width: 100%; }

.fg-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: #0b0f17;
  border: 2px solid rgba(100, 116, 139, 0.25);
  transition: border-color 0.25s;
  margin-bottom: 12px;
}
.fg-frame--ok      { border-color: #d9a441; }
.fg-frame--matched { border-color: #2ecc71; }

.fg-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.fg-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.85);
  pointer-events: none;
}
.fg-corner--tl { top: 10px;    left: 10px;   border-right: none; border-bottom: none; border-top-left-radius: 6px; }
.fg-corner--tr { top: 10px;    right: 10px;  border-left: none;  border-bottom: none; border-top-right-radius: 6px; }
.fg-corner--bl { bottom: 10px; left: 10px;   border-right: none; border-top: none;    border-bottom-left-radius: 6px; }
.fg-corner--br { bottom: 10px; right: 10px;  border-left: none;  border-top: none;    border-bottom-right-radius: 6px; }

.fg-status {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 10px;
  min-height: 18px;
}

.fg-poses {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
}
.fg-pose-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.25);
  transition: background 0.25s, transform 0.25s;
}
.fg-pose-dot--active { background: #d9a441; transform: scale(1.25); }
.fg-pose-dot--done   { background: #2ecc71; }
</style>
