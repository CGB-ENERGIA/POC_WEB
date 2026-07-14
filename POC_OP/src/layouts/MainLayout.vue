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

        <span v-if="user" class="text-white text-caption gt-sm q-mx-sm" style="opacity:.7">{{ user.email }}</span>
        <q-btn flat dense round icon="mdi-logout" color="white" @click.stop="logout">
          <q-tooltip>Sair</q-tooltip>
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

        <template v-if="isAdmin">
          <q-separator class="q-my-md" />
          <q-item-label header class="sidebar-section-label">
            Administração
          </q-item-label>
          <EssentialLink
            label="Aprovações de Acesso"
            icon="mdi-shield-account"
            link="/aprovacoes"
          />
        </template>
      </q-list>

      <div class="sidebar-credit">
        <a
          href="https://www.instagram.com/italofontes__?utm_source=qr&igsh=NmUwbnVwZWE2ems2"
          target="_blank"
          rel="noopener noreferrer"
          class="sidebar-credit__link"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>Desenvolvido por <strong>Italo Fontes</strong></span>
        </a>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import BrandLogo from "@/components/BrandLogo.vue";
import { BRAND } from "@/constants/brand";
import EssentialLink, {
  type EssentialLinkProps
} from "@/components/EssentialLink.vue";
import { useAuth } from "@/composables/useAuth";

const ADMIN_EMAIL = "italo.fontes@cgbengenharia.com.br";

const $q = useQuasar();
const router = useRouter();
const { user, signOut } = useAuth();
const isAdmin = computed(() => user.value?.email === ADMIN_EMAIL);

async function logout() {
  await signOut();
  await router.push("/login");
}

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
    label: "Análise de NCs",
    icon: "mdi-clipboard-check",
    link: "/analise-nc"
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

.sidebar-credit {
  padding: 16px 16px 20px;
  border-top: 1px solid rgba(0,0,0,.07);
  margin-top: 8px;
}
.sidebar-credit__link {
  display: flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  color: rgba(100,116,139,.6);
  font-size: 10.5px;
  transition: color .2s;
  svg { opacity: .7; flex-shrink: 0; }
  strong { font-weight: 700; color: rgba(100,116,139,.85); }
  &:hover { color: rgba(100,116,139,1); svg { opacity: 1; } }
}
</style>
