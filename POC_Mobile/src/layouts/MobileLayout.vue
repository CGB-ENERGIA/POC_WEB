<template>
  <q-layout view="hHh lpR fFf" class="mobile-layout">
    <q-header elevated class="mobile-header">
      <q-toolbar>
        <q-btn
          v-if="showBack"
          flat
          round
          dense
          icon="mdi-arrow-left"
          aria-label="Voltar"
          class="q-mr-xs"
          @click="$router.back()"
        />

        <q-toolbar-title class="text-weight-bold ellipsis toolbar-title">
          <BrandLogo
            v-if="!showBack"
            :size="26"
            header
            show-text
            :title="title"
            subtitle=""
            class="toolbar-title__brand"
          />
          <span v-else>{{ title }}</span>
        </q-toolbar-title>

        <q-space />

        <transition name="sync-pill" mode="out-in">
          <button
            v-if="syncPill"
            :key="syncPill.state"
            type="button"
            class="sync-pill"
            :class="`sync-pill--${syncPill.state}`"
            :aria-label="syncPill.aria"
            @click="onSyncPillClick"
          >
            <q-icon :name="syncPill.icon" size="16px" class="sync-pill__icon" />
            <span v-if="syncPill.count" class="sync-pill__count">{{ syncPill.count }}</span>
            <span class="sync-pill__label">{{ syncPill.label }}</span>
          </button>
        </transition>

        <div class="toolbar-actions">
          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            color="white"
            :aria-label="$q.dark.isActive ? 'Modo claro' : 'Modo escuro'"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{ $q.dark.isActive ? "Modo claro" : "Modo escuro" }}</q-tooltip>
          </q-btn>

          <q-btn
            v-if="session.isAuthenticated && route.name !== 'identificacao'"
            flat
            round
            dense
            icon="mdi-logout"
            color="white"
            aria-label="Sair"
            @click="onLogout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LocalStorage, useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import { useObservacoesStore } from "@/stores/observacoes";
import BrandLogo from "@/components/BrandLogo.vue";
import { applyThemeColor } from "@/utils/theme";
import { THEME_STORAGE_KEY } from "@/constants/theme";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const titles: Record<string, string> = {
  identificacao:             "CGB POC",
  home:                      "CGB POC",
  "nova-observacao":         "Nova Observação",
  "checklist-goman":         "Checklist GOMAN",
  "checklist-gstc":          "Checklist GSTC/GERE",
  "checklist-administrativo":"Checklist Administrativo",
  "checklist-alojamento":    "Checklist Alojamento",
  "checklist-logistica":     "Checklist Logística",
  "checklist-oficina":       "Checklist Oficina",
  "minhas-observacoes":      "Minhas Observações",
  galeria:                   "Galeria de Fotos",
};

const title = computed(() => titles[String(route.name)] ?? "POC - CGB");
const showBack = computed(
  () => route.name !== "home" && route.name !== "identificacao"
);

const observacoes = useObservacoesStore();
const isOnline = ref(navigator.onLine);
const justSynced = ref(false);
let justSyncedTimer: ReturnType<typeof setTimeout> | undefined;

function updateOnline() { isOnline.value = navigator.onLine; }
onMounted(() => {
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
});
onUnmounted(() => {
  window.removeEventListener("online", updateOnline);
  window.removeEventListener("offline", updateOnline);
  clearTimeout(justSyncedTimer);
});

watch(() => observacoes.lastSyncAt, () => {
  if (observacoes.pendingCount > 0) return;
  justSynced.value = true;
  clearTimeout(justSyncedTimer);
  justSyncedTimer = setTimeout(() => { justSynced.value = false; }, 3500);
});

type SyncPill = { state: string; icon: string; label: string; count: number; aria: string };

const syncPill = computed<SyncPill | null>(() => {
  const n = observacoes.pendingCount;
  const plural = n > 1 ? "s" : "";
  if (observacoes.syncing) {
    return { state: "syncing", icon: "mdi-cloud-sync-outline", label: "Enviando", count: n, aria: `Enviando ${n} checklist${plural}` };
  }
  if (!isOnline.value) {
    return n > 0
      ? { state: "offline", icon: "mdi-cloud-off-outline", label: "na fila", count: n, aria: `${n} checklist${plural} aguardando internet` }
      : { state: "offline", icon: "mdi-cloud-off-outline", label: "Offline", count: 0, aria: "Sem conexão" };
  }
  if (n > 0) {
    return { state: "pending", icon: "mdi-cloud-upload-outline", label: "pendente" + plural, count: n, aria: `${n} checklist${plural} pendente${plural}. Toque para enviar agora` };
  }
  if (justSynced.value) {
    return { state: "done", icon: "mdi-cloud-check-outline", label: "Enviado", count: 0, aria: "Tudo enviado" };
  }
  return null;
});

function onSyncPillClick() {
  const n = observacoes.pendingCount;
  if (!isOnline.value) {
    $q.notify({
      type: "info",
      icon: "mdi-cloud-off-outline",
      message: n > 0
        ? `${n} checklist${n > 1 ? "s" : ""} salvo${n > 1 ? "s" : ""} no aparelho.`
        : "Você está offline.",
      caption: "O envio é automático assim que a internet voltar — não precisa fazer nada.",
      position: "top",
      timeout: 4000,
    });
    return;
  }
  if (n > 0) void observacoes.autoSync({ force: true });
  if (session.isAuthenticated && route.name !== "minhas-observacoes") {
    void router.push({ name: "minhas-observacoes" });
  }
}

function toggleDarkMode() {
  $q.dark.toggle();
  LocalStorage.set(THEME_STORAGE_KEY, $q.dark.isActive);
  applyThemeColor($q.dark.isActive);
}

function onLogout() {
  $q.dialog({
    title: "Encerrar sessão",
    message: "Deseja sair e trocar de colaborador?",
    cancel: { label: "Cancelar", flat: true, color: "grey-7" },
    ok: { label: "Sair", color: "primary", unelevated: true },
  }).onOk(() => {
    session.logout();
    router.replace({ name: "identificacao" });
  });
}
</script>
