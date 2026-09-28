import { defineBoot } from "#q-app";
import { refreshColaboradoresGeral } from "@/services/colaboradores";

export default defineBoot(() => {
  if (typeof window === "undefined") return;
  void refreshColaboradoresGeral();
  window.addEventListener("online", () => {
    void refreshColaboradoresGeral();
  });
});
