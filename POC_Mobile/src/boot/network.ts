import { defineBoot } from "#q-app";
import { Notify } from "quasar";

import { refreshServerTimeSync } from "@/utils/server-time";
import { useObservacoesStore } from "@/stores/observacoes";
import { useSessionStore } from "@/stores/session";
import { isRemoteSyncEnabled } from "@/lib/config";

export default defineBoot(() => {
  if (typeof window === "undefined") return;

  window.addEventListener("offline", () => {
    Notify.create({
      type: "info",
      message: "Modo offline — você pode continuar preenchendo. Os dados ficam neste aparelho.",
      position: "top",
      timeout: 4000,
    });
  });

  window.addEventListener("online", () => {
    void refreshServerTimeSync();

    if (isRemoteSyncEnabled()) {
      const session = useSessionStore();
      if (session.employee) {
        useObservacoesStore().retryFailedSyncs(session.employee);
      }
    }

    Notify.create({
      type: "positive",
      message: "Conexão restabelecida.",
      position: "top",
      timeout: 2500,
    });
  });
});
