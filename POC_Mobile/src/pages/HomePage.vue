<template>
  <q-page class="hp-page mobile-page">

    <!-- ═══════════════════════════════════════════
         BANNER
    ════════════════════════════════════════════ -->
    <div class="hp-banner">
      <div class="hp-banner__top">
        <span class="hp-badge">
          <q-icon name="mdi-shield-check" size="12px" />
          {{ session.auditagemLabel }}
        </span>
        <span v-if="isOffline" class="hp-offline-badge">
          <q-icon name="mdi-wifi-off" size="12px" />
          Sem conexão
        </span>
      </div>

      <div class="hp-banner__body">
        <div class="hp-banner__left">
          <div class="hp-banner__name">{{ saudacao }}, {{ nomeExibicao }}!</div>
          <div class="hp-banner__sub">
            Meta: <strong>{{ metaAtual }}</strong> {{ periodoLabel === 'semana' ? 'obs/sem' : 'obs/mês' }}
          </div>
          <div class="hp-period">
            <button
              class="hp-period__btn"
              :class="{ 'hp-period__btn--on': periodo === 'semana' }"
              @click="periodo = 'semana'"
            >Semana</button>
            <button
              class="hp-period__btn"
              :class="{ 'hp-period__btn--on': periodo === 'mes' }"
              @click="periodo = 'mes'"
            >Mês</button>
          </div>
        </div>

        <div class="hp-banner__right">
          <q-circular-progress
            :value="metaProgress"
            size="64px"
            :thickness="0.14"
            color="white"
            track-color="rgba(255,255,255,.22)"
            show-value
          >
            <span class="hp-ring-pct">{{ metaProgress }}%</span>
          </q-circular-progress>
          <div class="hp-ring-label">
            <div class="hp-ring-count">
              {{ totalPeriodo }} {{ periodo === 'semana' ? 'esta sem.' : 'este mês' }}
              <span v-if="syncLoading" class="hp-sync-dot" aria-hidden="true" />
            </div>
            <div class="hp-ring-total">{{ totalGeral }} no total</div>
          </div>
        </div>
      </div>
    </div>

    <div class="hp-grid">

      <!-- ── ACESSO RÁPIDO ──────────────────────── -->
      <button class="hp-quick" @click="$router.push({ name: acaoRapida.route })">
        <div class="hp-quick__icon">
          <q-icon :name="acaoRapida.icon" size="22px" color="white" />
        </div>
        <div class="hp-quick__body">
          <div class="hp-quick__title">{{ acaoRapida.label }}</div>
          <div class="hp-quick__sub">{{ acaoRapida.sub }}</div>
        </div>
        <span v-if="acaoRapida.hasDraft" class="hp-quick__chip">em andamento</span>
        <q-icon name="mdi-arrow-right" size="20px" color="grey-5" />
      </button>

      <!-- ── OPERACIONAL ────────────────────────── -->
      <div class="hp-group" :class="{ 'hp-group--open': operacionalAberto }">
        <button class="hp-group__head" @click="operacionalAberto = !operacionalAberto">
          <div class="hp-group__icon">
            <q-icon name="mdi-clipboard-list-outline" size="24px" color="white" />
          </div>
          <div class="hp-group__info">
            <div class="hp-group__title">Operacional</div>
            <div class="hp-group__sub">GOMAN · GSTC/GERE</div>
          </div>
          <q-icon
            name="mdi-chevron-down"
            size="20px"
            class="hp-chevron"
            :class="{ 'hp-chevron--open': operacionalAberto }"
          />
        </button>

        <q-slide-transition>
          <div v-if="operacionalAberto" class="hp-items">

            <button class="hp-item" @click="$router.push({ name: 'checklist-goman' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-wrench-outline" size="15px" class="q-mr-xs" />
                  Checklist GOMAN
                  <span v-if="draftGoman" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">{{ totalPerguntasGoman }} perguntas · Conforme / Não conforme</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

            <div class="hp-item-sep" />

            <button class="hp-item" @click="$router.push({ name: 'checklist-gstc' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-crane" size="15px" class="q-mr-xs" />
                  Checklist GSTC/GERE
                  <span v-if="draftGstc" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">{{ totalPerguntasGstc }} perguntas · Conforme / Não conforme</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

          </div>
        </q-slide-transition>
      </div>

      <!-- ── ADMINISTRATIVO ─────────────────────── -->
      <div class="hp-group" :class="{ 'hp-group--open': administrativoAberto }">
        <button class="hp-group__head" @click="administrativoAberto = !administrativoAberto">
          <div class="hp-group__icon hp-group__icon--adm">
            <q-icon name="mdi-office-building-outline" size="24px" color="white" />
          </div>
          <div class="hp-group__info">
            <div class="hp-group__title">Administrativo</div>
            <div class="hp-group__sub">Escritório · Alojamento · Logística · Oficina</div>
          </div>
          <q-icon
            name="mdi-chevron-down"
            size="20px"
            class="hp-chevron"
            :class="{ 'hp-chevron--open': administrativoAberto }"
          />
        </button>

        <q-slide-transition>
          <div v-if="administrativoAberto" class="hp-items">

            <button class="hp-item" @click="$router.push({ name: 'checklist-administrativo' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-domain" size="15px" class="q-mr-xs" />
                  Administrativo
                  <span v-if="draftAdministrativo" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">EPI · Procedimento · Instalações prediais</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

            <div class="hp-item-sep" />

            <button class="hp-item" @click="$router.push({ name: 'checklist-alojamento' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-home-outline" size="15px" class="q-mr-xs" />
                  Alojamento
                  <span v-if="draftAlojamento" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">Repúblicas · Higiene · Estrutura</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

            <div class="hp-item-sep" />

            <button class="hp-item" @click="$router.push({ name: 'checklist-logistica' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-truck-outline" size="15px" class="q-mr-xs" />
                  Logística
                  <span v-if="draftLogistica" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">APR · EPI · Veículos e equipamentos</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

            <div class="hp-item-sep" />

            <button class="hp-item" @click="$router.push({ name: 'checklist-oficina' })">
              <div class="hp-item__body">
                <div class="hp-item__label">
                  <q-icon name="mdi-car-wrench" size="15px" class="q-mr-xs" />
                  Oficina
                  <span v-if="draftOficina" class="hp-draft-chip">em andamento</span>
                </div>
                <div class="hp-item__cap">EPI · Procedimento · Segurança veicular</div>
              </div>
              <q-icon name="mdi-chevron-right" size="18px" color="grey-5" />
            </button>

          </div>
        </q-slide-transition>
      </div>

      <!-- ── CÂMERA ─────────────────────────────── -->
      <button class="hp-cam" @click="cameraAberta = true">
        <div class="hp-cam__icon">
          <q-icon name="mdi-camera-plus" size="22px" color="primary" />
        </div>
        <div class="hp-cam__body">
          <div class="hp-cam__title">Câmera</div>
          <div class="hp-cam__sub">Registrar com data e hora</div>
        </div>
        <q-icon name="mdi-chevron-right" size="20px" color="grey-5" />
      </button>

      <!-- ── GALERIA ─────────────────────────────── -->
      <button class="hp-gal" @click="$router.push({ name: 'galeria' })">
        <div class="hp-gal__icon">
          <q-icon name="mdi-image-multiple-outline" size="22px" color="primary" />
        </div>
        <div class="hp-gal__body">
          <div class="hp-gal__title">Galeria</div>
          <div class="hp-gal__sub">Fotos registradas</div>
        </div>
        <div v-if="galeriaTotal > 0" class="hp-gal__count">{{ galeriaTotal }}</div>
        <q-icon name="mdi-chevron-right" size="20px" color="grey-5" />
      </button>

      <!-- ── MINHAS OBSERVAÇÕES ─────────────────── -->
      <button
        class="hp-solo"
        @click="$router.push({ name: 'minhas-observacoes' })"
      >
        <div class="hp-solo__icon">
          <q-icon name="mdi-format-list-checks" size="22px" color="primary" />
        </div>
        <div class="hp-solo__body">
          <div class="hp-solo__title">Minhas Observações</div>
          <div class="hp-solo__sub">Histórico e não conformidades</div>
        </div>
        <div class="hp-solo__count">{{ totalGeral }}</div>
        <q-icon name="mdi-chevron-right" size="20px" color="grey-5" />
      </button>

    </div>

    <!-- espaço de segurança para scroll na home -->
    <div class="hp-spacer" />

    <!-- ── CÂMERA MODAL ─────────────────────────────── -->
    <CameraCapture
      v-model="cameraAberta"
      :matricula="session.matricula"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { LocalStorage, Notify } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore, isChecklist } from "@/stores/observacoes";
import { useGaleriaStore } from "@/stores/galeria";
import { totalPerguntasGoman } from "@/data/goman-checklist";
import { totalPerguntasGstc } from "@/data/gstc-checklist";
import { PERIODO_VISAO_STORAGE_KEY } from "@/constants/theme";
import { hasChecklistDraft } from "@/utils/checklist-draft";
import { useGoals } from "@/composables/useGoals";
import CameraCapture from "@/components/CameraCapture.vue";

type PeriodoVisao = "semana" | "mes";

function loadPeriodoSalvo(): PeriodoVisao {
  const saved = LocalStorage.getItem<string | null>(PERIODO_VISAO_STORAGE_KEY);
  return saved === "semana" || saved === "mes" ? saved : "mes";
}

const session      = useSessionStore();
const observacoes  = useObservacoesStore();
const galeriaStore = useGaleriaStore();
const periodo      = ref<PeriodoVisao>(loadPeriodoSalvo());
const operacionalAberto    = ref(false);
const administrativoAberto = ref(false);
const cameraAberta = ref(false);
const syncLoading  = ref(false);
const isOffline    = ref(!navigator.onLine);
const { getGoal, ensureLoaded } = useGoals();

function updateOnlineStatus() { isOffline.value = !navigator.onLine; }

const galeriaTotal = computed(() => galeriaStore.total);

const matriculaAtual = computed(() => session.employee?.matricula ?? "");

function temEmAndamento(auditagem: string) {
  return observacoes.items.some(
    o => isChecklist(o) && o.auditagem === auditagem && o.matricula === matriculaAtual.value && o.status === "em_andamento"
  );
}

const draftGoman          = computed(() => hasChecklistDraft("GOMAN",          matriculaAtual.value) || temEmAndamento("GOMAN"));
const draftGstc           = computed(() => hasChecklistDraft("GSTC",           matriculaAtual.value) || temEmAndamento("GSTC"));
const draftAdministrativo = computed(() => hasChecklistDraft("ADMINISTRATIVO", matriculaAtual.value) || temEmAndamento("ADMINISTRATIVO"));
const draftAlojamento     = computed(() => hasChecklistDraft("ALOJAMENTO",     matriculaAtual.value) || temEmAndamento("ALOJAMENTO"));
const draftLogistica      = computed(() => hasChecklistDraft("LOGISTICA",      matriculaAtual.value) || temEmAndamento("LOGISTICA"));
const draftOficina        = computed(() => hasChecklistDraft("OFICINA",        matriculaAtual.value) || temEmAndamento("OFICINA"));

const acaoRapida = computed(() => {
  if (draftGoman.value)
    return { route: "checklist-goman" as const, label: "Continuar GOMAN", sub: "Rascunho em andamento", icon: "mdi-wrench-outline", hasDraft: true };
  if (draftGstc.value)
    return { route: "checklist-gstc" as const, label: "Continuar GSTC/GERE", sub: "Rascunho em andamento", icon: "mdi-crane", hasDraft: true };
  if (draftAdministrativo.value)
    return { route: "checklist-administrativo" as const, label: "Continuar Administrativo", sub: "Rascunho em andamento", icon: "mdi-domain", hasDraft: true };
  if (draftAlojamento.value)
    return { route: "checklist-alojamento" as const, label: "Continuar Alojamento", sub: "Rascunho em andamento", icon: "mdi-home-outline", hasDraft: true };
  if (draftLogistica.value)
    return { route: "checklist-logistica" as const, label: "Continuar Logística", sub: "Rascunho em andamento", icon: "mdi-truck-outline", hasDraft: true };
  if (draftOficina.value)
    return { route: "checklist-oficina" as const, label: "Continuar Oficina", sub: "Rascunho em andamento", icon: "mdi-car-wrench", hasDraft: true };
  return { route: "checklist-goman" as const, label: "Iniciar GOMAN", sub: "Checklist operacional principal", icon: "mdi-wrench-outline", hasDraft: false };
});

watch(periodo, (val) => LocalStorage.set(PERIODO_VISAO_STORAGE_KEY, val));

onMounted(() => {
  window.addEventListener("online",  updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  void ensureLoaded();

  if (session.matricula) {
    syncLoading.value = true;
    void observacoes.fetchSynced(session.matricula)
      .catch(() => {
        Notify.create({
          type: "warning",
          icon: "mdi-wifi-off",
          message: "Não foi possível atualizar as observações. Verifique a conexão.",
          position: "top",
          timeout: 5000,
        });
      })
      .finally(() => { syncLoading.value = false; });
  }

  void galeriaStore.carregar();

  if (draftGoman.value || draftGstc.value)                                                                      operacionalAberto.value    = true;
  if (draftAdministrativo.value || draftAlojamento.value || draftLogistica.value || draftOficina.value)         administrativoAberto.value = true;
});

onUnmounted(() => {
  window.removeEventListener("online",  updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});

const matricula = computed(() => session.matricula);

const metaSemanal = computed(() => {
  const now = new Date();
  return getGoal(session.employee?.gerencia, now.getFullYear(), now.getMonth() + 1).semanal;
});
const metaMensal = computed(() => {
  const now = new Date();
  return getGoal(session.employee?.gerencia, now.getFullYear(), now.getMonth() + 1).mensal;
});
const metaAtual    = computed(() => periodo.value === "semana" ? metaSemanal.value : metaMensal.value);
const periodoLabel = computed(() => periodo.value === "semana" ? "semana" : "mês");

const saudacao = computed(() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
});

const nomeExibicao = computed(() => {
  const partes = (session.employee?.nomeCompleto ?? session.displayName ?? "").trim().split(/\s+/);
  return partes.slice(0, 2).join(" ");
});

const minhasObs  = computed(() => observacoes.byMatricula(matricula.value));
const totalGeral = computed(() => minhasObs.value.length);

function semanaDoMes(d: Date) { const n = d.getDate(); return n <= 8 ? 1 : n <= 15 ? 2 : n <= 22 ? 3 : 4; }
function isMesmoMes(d: Date, r: Date) { return d.getMonth() === r.getMonth() && d.getFullYear() === r.getFullYear(); }
function isMesmaSemana(d: Date, r: Date) { return isMesmoMes(d, r) && semanaDoMes(d) === semanaDoMes(r); }

const totalMes    = computed(() => { const n = new Date(); return minhasObs.value.filter(o => isMesmoMes(new Date(o.data), n)).length; });
const totalSemana = computed(() => { const n = new Date(); return minhasObs.value.filter(o => isMesmaSemana(new Date(o.data), n)).length; });
const totalPeriodo = computed(() => periodo.value === "semana" ? totalSemana.value : totalMes.value);
const metaProgress = computed(() => {
  if (!metaAtual.value) return 0;
  return Math.min(100, Math.round((totalPeriodo.value / metaAtual.value) * 100));
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════ */
.hp-page {
  padding: 16px 16px 0;
}
.hp-spacer { height: 24px; }

/* ═══════════════════════════════════════════════════════════
   BANNER
════════════════════════════════════════════════════════════ */
.hp-banner {
  border-radius: 20px;
  padding: 18px 18px 16px;
  margin-bottom: 16px;
  /* !important garante que nenhum CSS do Quasar ou layout sobreponha o gradiente */
  background: linear-gradient(135deg, #8b1b30 0%, #7a1225 45%, #5c0e1c 100%) !important;
  color: #fff !important;
  box-shadow: 0 10px 32px rgba(122, 18, 37, .28);
}

.hp-banner__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.hp-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 99px;
  padding: 3px 10px;
}

.hp-offline-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 99px;
  padding: 3px 10px;
  color: rgba(255,255,255,.85);
}

.hp-banner__body {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hp-banner__left  { flex: 1; min-width: 0; }
.hp-banner__right { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }

.hp-banner__name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -.025em;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hp-banner__sub {
  font-size: 12px;
  opacity: .8;
  margin-top: 3px;
}

/* Period toggle */
.hp-period {
  display: inline-flex;
  margin-top: 12px;
  padding: 3px;
  border-radius: 99px;
  background: rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.1);
  gap: 2px;
}
.hp-period__btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.75);
  font-size: 12px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 99px;
  cursor: pointer;
  transition: background .18s, color .18s, box-shadow .18s;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.hp-period__btn--on {
  background: #fff;
  color: #7a1225 !important; /* hardcode: herança de color:#fff do banner ocultava o texto */
  box-shadow: 0 2px 8px rgba(0,0,0,.18);
}

/* Ring */
.hp-ring-pct { font-size: 12px; font-weight: 800; }
.hp-ring-label { text-align: center; }
.hp-ring-count {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.hp-ring-total { font-size: 10px; opacity: .7; }

/* Sync indicator dot */
.hp-sync-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,.65);
  animation: hp-pulse 1.4s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes hp-pulse {
  0%, 100% { opacity: .3; transform: scale(.8); }
  50%       { opacity: 1;  transform: scale(1); }
}

/* ═══════════════════════════════════════════════════════════
   GRID (mobile: 1 col, tablet: 2 col para grupos)
════════════════════════════════════════════════════════════ */
.hp-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ═══════════════════════════════════════════════════════════
   ACESSO RÁPIDO
════════════════════════════════════════════════════════════ */
.hp-quick {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 2px solid rgba(var(--brand-rgb),.18);
  box-shadow: 0 2px 16px rgba(var(--brand-rgb),.1);
  cursor: pointer;
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow .18s;
}
.hp-quick:active { box-shadow: none; opacity: .85; }

.hp-quick__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-warm), var(--brand));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--brand-rgb),.22);
}
.hp-quick__body { flex: 1; min-width: 0; }
.hp-quick__title { font-size: 15px; font-weight: 700; color: #0f172a; }
.hp-quick__sub   { font-size: 11.5px; color: #64748b; margin-top: 2px; }

.hp-quick__chip {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  background: rgba(var(--brand-rgb),.1);
  color: var(--brand);
  border-radius: 99px;
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════
   GROUP CARD
════════════════════════════════════════════════════════════ */
.hp-group {
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15,23,42,.07);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15,23,42,.05);
  transition: box-shadow .18s;
}
.hp-group--open {
  box-shadow: 0 4px 20px rgba(var(--brand-rgb),.1);
  border-color: rgba(var(--brand-rgb),.15);
}

.hp-group__head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.hp-group__head:active { background: rgba(0,0,0,.03); }

.hp-group__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-warm), var(--brand));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--brand-rgb),.22);
}
.hp-group__icon--adm {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  box-shadow: 0 4px 12px rgba(29,78,216,.22);
}

.hp-group__info { flex: 1; min-width: 0; }
.hp-group__title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}
.hp-group__sub {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hp-chevron {
  color: #cbd5e1;
  transition: transform .22s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
}
.hp-chevron--open { transform: rotate(180deg); color: var(--brand); }

/* ── Items dentro do grupo ── */
.hp-items { padding: 0 16px 12px; }

.hp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 0;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.hp-item:active { opacity: .7; }

.hp-item__body { flex: 1; min-width: 0; }
.hp-item__label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}
.hp-item__cap {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hp-draft-chip {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  background: rgba(var(--brand-rgb),.1);
  color: var(--brand);
  border-radius: 99px;
  padding: 1px 7px;
}

.hp-item-sep {
  height: 1px;
  background: rgba(15,23,42,.055);
  margin: 0 2px;
}

/* ═══════════════════════════════════════════════════════════
   CÂMERA + GALERIA (par de cards)
════════════════════════════════════════════════════════════ */
.hp-cam,
.hp-gal {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15,23,42,.07);
  box-shadow: 0 2px 12px rgba(15,23,42,.05);
  cursor: pointer;
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow .18s;
}
.hp-cam:active,
.hp-gal:active { box-shadow: none; opacity: .85; }

.hp-cam__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(var(--brand-rgb),.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hp-gal__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(var(--brand-rgb),.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.hp-cam__body,
.hp-gal__body { flex: 1; min-width: 0; }

.hp-cam__title { font-size: 15px; font-weight: 700; color: #0f172a; }
.hp-cam__sub   { font-size: 11.5px; color: #64748b; margin-top: 2px; }

.hp-gal__title { font-size: 15px; font-weight: 700; color: #0f172a; }
.hp-gal__sub   { font-size: 11.5px; color: #64748b; margin-top: 2px; }

.hp-gal__count {
  font-size: 18px;
  font-weight: 800;
  color: var(--brand);
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════
   SOLO CARD (Minhas Observações)
════════════════════════════════════════════════════════════ */
.hp-solo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15,23,42,.07);
  box-shadow: 0 2px 12px rgba(15,23,42,.05);
  cursor: pointer;
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow .18s;
}
.hp-solo:active { box-shadow: none; opacity: .85; }

.hp-solo__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(var(--brand-rgb),.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hp-solo__body { flex: 1; min-width: 0; }
.hp-solo__title { font-size: 15px; font-weight: 700; color: #0f172a; }
.hp-solo__sub   { font-size: 11.5px; color: #64748b; margin-top: 2px; }

.hp-solo__count {
  font-size: 18px;
  font-weight: 800;
  color: var(--brand);
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════
   TELAS PEQUENAS (≤ 360px)
════════════════════════════════════════════════════════════ */
@media (max-width: 360px) {
  .hp-banner        { padding: 14px 14px 12px; }
  .hp-banner__name  { font-size: 18px; }
  .hp-group__head,
  .hp-solo          { padding: 12px 14px; }
  .hp-group__icon,
  .hp-solo__icon    { width: 40px; height: 40px; }
}

/* ═══════════════════════════════════════════════════════════
   TABLET (≥ 768px) — grid 2 colunas para grupos
════════════════════════════════════════════════════════════ */
@media (min-width: 768px) {
  .hp-page {
    padding: 24px 32px 0;
    max-width: 860px;
  }

  .hp-banner {
    padding: 24px 28px 20px;
    border-radius: 24px;
  }
  .hp-banner__name { font-size: 26px; }

  .hp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 14px;
  }

  /* Acesso rápido ocupa as 2 colunas */
  .hp-quick { grid-column: 1 / -1; }

  /* Grupos lado a lado */
  .hp-group { grid-column: auto; }

  /* Câmera e Galeria lado a lado */
  .hp-cam { grid-column: 1; }
  .hp-gal { grid-column: 2; }

  /* Minhas Obs ocupa as 2 colunas */
  .hp-solo { grid-column: 1 / -1; }

  .hp-group__head { padding: 18px 20px; }
  .hp-solo        { padding: 18px 20px; }
  .hp-group__title,
  .hp-solo__title  { font-size: 16px; }
  .hp-items { padding: 0 20px 14px; }
}

/* ═══════════════════════════════════════════════════════════
   DARK MODE
════════════════════════════════════════════════════════════ */
:global(body.body--dark) {
  .hp-group,
  .hp-solo,
  .hp-gal,
  .hp-cam {
    background: #1e293b;
    border-color: rgba(148,163,184,.1);
    box-shadow: 0 2px 12px rgba(0,0,0,.22);
  }
  .hp-quick {
    background: #1e293b;
    border-color: rgba(var(--brand-rgb),.35);
    box-shadow: 0 2px 16px rgba(0,0,0,.22);
  }
  .hp-group--open {
    border-color: rgba(var(--brand-accent-rgb),.28);
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
  }
  .hp-group__title,
  .hp-solo__title,
  .hp-gal__title,
  .hp-cam__title,
  .hp-quick__title { color: #f1f5f9; }
  .hp-item__label  { color: #e2e8f0; }
  .hp-item-sep     { background: rgba(148,163,184,.12); }
  .hp-solo__icon,
  .hp-gal__icon,
  .hp-cam__icon    { background: rgba(var(--brand-rgb),.2); }
  .hp-chevron      { color: #475569; }
  .hp-group__sub,
  .hp-solo__sub,
  .hp-gal__sub,
  .hp-cam__sub,
  .hp-quick__sub,
  .hp-item__cap    { color: #94a3b8; }
  .hp-group__icon--adm { background: linear-gradient(135deg, #1d4ed8, #1e40af); }

  /* Ícones de ação (Câmera / Galeria / Minhas Obs) — gradiente + ícone branco */
  .hp-cam__icon,
  .hp-gal__icon,
  .hp-solo__icon {
    background: linear-gradient(135deg, var(--brand-warm), var(--brand));
    box-shadow: 0 4px 12px rgba(var(--brand-rgb),.22);
  }
  .hp-cam__icon .q-icon,
  .hp-gal__icon .q-icon,
  .hp-solo__icon .q-icon { color: #fff; }

  /* Chips "em andamento" — texto claro sobre fundo escuro */
  .hp-quick__chip,
  .hp-draft-chip {
    background: rgba(var(--brand-accent-rgb),.2);
    color: #fca5a5;
  }

  /* Contadores numéricos (Galeria / Minhas Obs) */
  .hp-gal__count,
  .hp-solo__count { color: #fca5a5; }
}
</style>
