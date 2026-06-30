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
          @click="$router.back()"
        />
        <q-toolbar-title class="text-weight-bold">
          {{ title }}
        </q-toolbar-title>
        <q-btn
          v-if="session.isAuthenticated && $route.name !== 'identificacao'"
          flat
          round
          dense
          icon="mdi-logout"
          aria-label="Sair"
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
import { useQuasar } from "quasar";
import { useSessionStore } from "@/stores/session";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const titles: Record<string, string> = {
  identificacao: "Identificação",
  home: "CGB Checklist",
  "nova-observacao": "Nova Observação",
  "checklist-goman": "Checklist GOMAN",
  "minhas-observacoes": "Minhas Observações",
};

const title = computed(() => titles[String(route.name)] ?? "CGB Checklist");
const showBack = computed(
  () => route.name !== "home" && route.name !== "identificacao"
);

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

<style scoped>
.mobile-layout {
  background: #f1f5f9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
