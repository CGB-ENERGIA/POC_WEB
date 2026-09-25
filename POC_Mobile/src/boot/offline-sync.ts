import { defineBoot } from "#q-app";

import { useObservacoesStore } from "@/stores/observacoes";
import { requestPersistentStorage } from "@/utils/offline-db";

const INTERVALO_MS = 30_000;
// Rede recém-voltada (5G/Wi-Fi reconectando) costuma oscilar nos primeiros segundos.
const ESPERA_POS_ONLINE_MS = 2_000;

export default defineBoot(async () => {
  if (typeof window === "undefined") return;

  requestPersistentStorage();

  const store = useObservacoesStore();
  await store.hydrate();

  const disparar = (force: boolean) => {
    if (navigator.onLine) void store.autoSync({ force });
  };

  // No iOS o evento "online" muitas vezes não chega com o PWA em segundo plano,
  // por isso também tentamos ao voltar para o app e periodicamente.
  window.addEventListener("online", () => setTimeout(() => disparar(true), ESPERA_POS_ONLINE_MS));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") disparar(false);
  });

  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) disparar(false);
  });

  setInterval(() => {
    if (store.pendingCount > 0) disparar(false);
  }, INTERVALO_MS);

  setTimeout(() => disparar(true), ESPERA_POS_ONLINE_MS);
});
