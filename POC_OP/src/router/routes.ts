import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    component: () => import("@/pages/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("@/pages/DashboardPage.vue") },
      { path: "acompanhamento-semanal", component: () => import("@/pages/AcompanhamentoSemanal.vue") },
      { path: "acompanhamento-mensal", component: () => import("@/pages/AcompanhamentoMensal.vue") },
      { path: "indice-conformidade",  component: () => import("@/pages/IndiceConformidade.vue")   },
      { path: "icit",                 component: () => import("@/pages/IcitPage.vue")              },
      { path: "historico-icit",       component: () => import("@/pages/HistoricoIcit.vue")         },
      { path: "relatorio-equipes",    component: () => import("@/pages/RelatorioEquipes.vue")      },
      { path: "tolerancia-zero",        component: () => import("@/pages/ToleranciaZero.vue")            },
      { path: "indicadores-categoria", component: () => import("@/pages/IndicadoresCategoria.vue")      },
      { path: "observadores",          component: () => import("@/pages/ObservadoresPage.vue")          },
      { path: "mapa-calor-base",       component: () => import("@/pages/MapaCalorBase.vue")             },
      { path: "mapa-calor-mensal",     component: () => import("@/pages/MapaCalorMensal.vue")           },
      { path: "matriz-responsabilidade", component: () => import("@/pages/MatrizResponsabilidade.vue")  },
      { path: "analise-nc",              component: () => import("@/pages/AnalisePage.vue")               },
      { path: "config-metas",           component: () => import("@/pages/ConfigMetas.vue")             },
      { path: "aprovacoes",             component: () => import("@/pages/AprovacoesPage.vue"), meta: { requiresAdmin: true } },
      { path: "second", component: () => import("@/pages/SecondPage.vue") }
    ]
  },

  {
    path: "/:catchAll(.*)*",
    component: () => import("@/pages/ErrorNotFound.vue")
  }
];

export default routes;
