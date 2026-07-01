import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/layouts/MobileLayout.vue"),
    children: [
      {
        path: "",
        name: "identificacao",
        component: () => import("@/pages/IdentificacaoPage.vue"),
        meta: { guest: true },
      },
      {
        path: "home",
        name: "home",
        component: () => import("@/pages/HomePage.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "nova-observacao",
        name: "nova-observacao",
        component: () => import("@/pages/NovaObservacaoPage.vue"),
        meta: { requiresAuth: true, auditagem: "GSTC" },
      },
      {
        path: "checklist-goman",
        name: "checklist-goman",
        component: () => import("@/pages/ChecklistGomanPage.vue"),
        meta: { requiresAuth: true, auditagem: "GOMAN" },
      },
      {
        path: "checklist-gstc",
        name: "checklist-gstc",
        component: () => import("@/pages/ChecklistGstcPage.vue"),
        meta: { requiresAuth: true, auditagem: "GSTC" },
      },
      {
        path: "minhas-observacoes",
        name: "minhas-observacoes",
        component: () => import("@/pages/MinhasObservacoesPage.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("@/pages/ErrorNotFound.vue"),
  },
];

export default routes;
