import { defineBoot } from "#q-app";
import { useSessionStore } from "@/stores/session";

export default defineBoot(({ router }) => {
  router.beforeEach((to) => {
    const session = useSessionStore();

    if (to.meta.requiresAuth && !session.isAuthenticated) {
      return { name: "identificacao" };
    }

    if (to.meta.guest && session.isAuthenticated && to.name === "identificacao") {
      return { name: "home" };
    }

    const auditagemMeta = to.meta.auditagem as string | undefined;
    if (auditagemMeta && session.auditagem !== auditagemMeta) {
      return { name: "home" };
    }

    return true;
  });
});
