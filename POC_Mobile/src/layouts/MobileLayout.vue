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

        <BrandLogo
          v-if="!showBack || route.name === 'home'"
          :size="32"
          class="q-mr-sm"
        />

        <q-toolbar-title class="text-weight-bold ellipsis">
          {{ title }}
        </q-toolbar-title>

        <q-space />

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
          aria-label="Sair"
          class="q-ml-xs"
          @click="onLogout"
        />
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LocalStorage, useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";
import BrandLogo from "@/components/BrandLogo.vue";
import { applyThemeColor } from "@/utils/theme";
import { THEME_STORAGE_KEY } from "@/constants/theme";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const titles: Record<string, string> = {
  identificacao: "Identificação",
  home: "Início",
  "nova-observacao": "Nova Observação",
  "checklist-goman": "Checklist GOMAN",
  "checklist-gstc": "Checklist GSTC",
  "minhas-observacoes": "Minhas Observações",
};

const title = computed(() => titles[String(route.name)] ?? "CGB Checklist");
const showBack = computed(
  () => route.name !== "home" && route.name !== "identificacao"
);

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
