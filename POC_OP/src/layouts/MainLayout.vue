<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header elevated class="app-header">
      <q-toolbar class="app-header__toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          color="white"
          @click.stop="toggleLeftDrawer"
        />

        <BrandLogo
          compact
          inverse
          :size="36"
          :title="BRAND.name"
          :subtitle="BRAND.product"
          class="q-ml-xs gt-xs"
        />

        <q-toolbar-title class="text-weight-bold text-white lt-sm">
          {{ BRAND.name }}
        </q-toolbar-title>

        <q-space class="gt-xs" />

        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          color="white"
          @click.stop="toggleDarkMode"
        >
          <q-tooltip>{{ $q.dark.isActive ? "Modo claro" : "Modo escuro" }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer ref="drawerRef" v-model="leftDrawerOpen" show-if-above bordered class="app-drawer">
      <div class="sidebar-brand">
        <BrandLogo stacked :size="72" :title="BRAND.name" :subtitle="BRAND.tagline" />
      </div>

      <q-list padding class="sidebar-nav">
        <EssentialLink
          v-for="link in linksList"
          :key="link.label"
          v-bind="link"
        />

        <q-separator class="q-my-md" />

        <q-item-label header class="sidebar-section-label">
          Acesso em Campo
        </q-item-label>

        <EssentialLink
          v-for="link in fieldLinks"
          :key="link.label"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import BrandLogo from "@/components/BrandLogo.vue";
import { BRAND } from "@/constants/brand";
import EssentialLink, {
  type EssentialLinkProps
} from "@/components/EssentialLink.vue";

const $q = useQuasar();

const linksList: EssentialLinkProps[] = [
  {
    label: "Dashboard",
    icon: "mdi-view-dashboard",
    link: "/"
  },
  {
    label: "Acompanhamento Semanal",
    icon: "mdi-calendar-week",
    link: "/acompanhamento-semanal"
  },
  {
    label: "Acompanhamento Mensal",
    icon: "mdi-calendar-month",
    link: "/acompanhamento-mensal"
  },
  {
    label: "Índice de Conformidade",
    icon: "mdi-gauge",
    link: "/indice-conformidade"
  },
  {
    label: "ICIT",
    icon: "mdi-chart-bar-stacked",
    link: "/icit"
  },
  {
    label: "Relatório de Equipes",
    icon: "mdi-account-group",
    link: "/relatorio-equipes"
  },
  {
    label: "Tolerância Zero",
    icon: "mdi-cancel",
    link: "/tolerancia-zero"
  },
  {
    label: "Indicadores por Categoria",
    icon: "mdi-chart-multiple",
    link: "/indicadores-categoria"
  },
  {
    label: "Observadores",
    icon: "mdi-eye-check",
    link: "/observadores"
  },
  {
    label: "Mapa de Calor por Base",
    icon: "mdi-map-marker-radius",
    link: "/mapa-calor-base"
  },
  {
    label: "Mapa de Calor Acompanhamento Mensal",
    icon: "mdi-grid",
    link: "/mapa-calor-mensal"
  },
  {
    label: "Matriz de Responsabilidade",
    icon: "mdi-clipboard-list",
    link: "/matriz-responsabilidade"
  },
  {
    label: "Configurar Metas",
    icon: "mdi-bullseye-arrow",
    link: "/config-metas"
  }
];

const fieldLinks: EssentialLinkProps[] = [
  {
    label: "Checklist Mobile",
    caption: "Auditagem GOMAN / GSTC",
    icon: "mdi-clipboard-check-outline",
    link: "/mobile/",
    external: true,
  },
];

const drawerRef = ref<{ $el: HTMLElement } | null>(null);
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleDarkMode() {
  $q.dark.toggle();
  localStorage.setItem("darkMode", String($q.dark.isActive));
}

function handleOutsideClick(event: MouseEvent) {
  if (!leftDrawerOpen.value) return;
  const drawerEl = drawerRef.value?.$el;
  if (drawerEl && !drawerEl.contains(event.target as Node)) {
    leftDrawerOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) {
    $q.dark.set(saved === "true");
  }
});
onUnmounted(() => document.removeEventListener("click", handleOutsideClick));
</script>

<style scoped>
.sidebar-section-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  padding-left: 16px;
  font-weight: 700;
}
</style>
