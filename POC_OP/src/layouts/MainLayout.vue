<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click.stop="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-weight-bold text-white">
          CGB Engenharia
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          color="white"
          @click.stop="toggleDarkMode"
        >
          <q-tooltip>{{ $q.dark.isActive ? 'Modo Claro' : 'Modo Escuro' }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer ref="drawerRef" v-model="leftDrawerOpen" show-if-above bordered>
      <div class="sidebar-header row items-center no-wrap q-gutter-sm">
        <img src="/favicon.ico" style="width: 40px; height: 40px;" alt="CGB" />
        <div>
          <div class="company-name">CGB Engenharia</div>
          <div class="company-subtitle">Gestão de Segurança</div>
        </div>
      </div>

      <q-list padding>
        <EssentialLink
          v-for="link in linksList"
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
  }
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
