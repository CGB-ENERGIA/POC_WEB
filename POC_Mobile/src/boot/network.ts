import { defineBoot } from "#q-app";
import { Notify } from "quasar";

import { refreshServerTimeSync } from "@/utils/server-time";
import { useObservacoesStore } from "@/stores/observacoes";

export default defineBoot(() => {
  if (typeof window === "undefined") return;

  window.addEventListener("offline", () => {
    Notify.create({
      type: "info",
      icon: "mdi-cloud-off-outline",
      message: "Modo offline — pode continuar preenchendo.",
      caption: "Tudo fica salvo no aparelho e é enviado sozinho quando a internet voltar.",
      position: "top",
      timeout: 4500,
    });
  });

  window.addEventListener("online", () => {
    void refreshServerTimeSync();

    const pendentes = useObservacoesStore().pendingCount;
    Notify.create({
      type: "positive",
      icon: "mdi-wifi",
      message: "Conexão restabelecida.",
      ...(pendentes > 0
        ? { caption: `Enviando ${pendentes} checklist${pendentes > 1 ? "s" : ""} salvo${pendentes > 1 ? "s" : ""} no aparelho…` }
        : {}),
      position: "top",
      timeout: 3000,
    });
  });
});
