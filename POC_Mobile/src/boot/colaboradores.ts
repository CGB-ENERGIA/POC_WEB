import { defineBoot } from "#q-app";
import { refreshColaboradoresGeral } from "@/services/colaboradores";
import { refreshEquipesPwa } from "@/services/equipes";
import { refreshObservers } from "@/services/observers";

export default defineBoot(() => {
  if (typeof window === "undefined") return;
  void refreshColaboradoresGeral();
  void refreshEquipesPwa();
  void refreshObservers();
  window.addEventListener("online", () => {
    void refreshColaboradoresGeral();
    void refreshEquipesPwa();
    void refreshObservers();
  });
});
