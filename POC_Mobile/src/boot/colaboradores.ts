import { defineBoot } from "#q-app";
import { refreshColaboradoresGeral } from "@/services/colaboradores";
import { refreshEquipesPwa } from "@/services/equipes";

export default defineBoot(() => {
  if (typeof window === "undefined") return;
  void refreshColaboradoresGeral();
  void refreshEquipesPwa();
  window.addEventListener("online", () => {
    void refreshColaboradoresGeral();
    void refreshEquipesPwa();
  });
});
