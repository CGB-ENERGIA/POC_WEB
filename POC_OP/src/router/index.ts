import { defineRouter } from "#q-app";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from "vue-router";

import routes from "./routes";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";

// Páginas de gráficos/visões liberadas para o papel "member" (somente
// leitura). Qualquer outra rota autenticada é bloqueada para esse papel.
const MEMBER_ALLOWED_PATHS = new Set([
  "",
  "acompanhamento-semanal",
  "acompanhamento-mensal",
  "indice-conformidade",
  "icit",
  "historico-icit",
  "relatorio-equipes",
  "tolerancia-zero",
  "indicadores-categoria",
  "observadores",
  "mapa-calor-base",
  "mapa-calor-mensal",
  "matriz-responsabilidade",
  "banco-inconformidades",
]);

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  });

  const ADMIN_EMAIL = "italo.fontes@cgbengenharia.com.br";

  Router.beforeEach(async (to) => {
    if (to.meta.public) return true;
    const { data } = await supabase.auth.getSession();
    if (!data.session) return "/login";
    const email = data.session.user.email;
    if (to.meta.requiresAdmin && email !== ADMIN_EMAIL) return "/";

    if (email !== ADMIN_EMAIL) {
      const role = await getRole(data.session.user.id);
      if (role === "member") {
        const relPath = to.path.replace(/^\/+/, "");
        if (!MEMBER_ALLOWED_PATHS.has(relPath)) return "/";
      }
    }

    return true;
  });

  // Redireciona para /reset-password quando o usuário clica no link do e-mail de recuperação
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      Router.replace("/reset-password");
    }
  });

  return Router;
});
