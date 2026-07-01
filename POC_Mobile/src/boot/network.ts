import { defineBoot } from "#q-app";
import { Notify } from "quasar";

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
    Notify.create({
      type: "positive",
      message: "Conexão restabelecida.",
      position: "top",
      timeout: 2500,
    });
  });
});
