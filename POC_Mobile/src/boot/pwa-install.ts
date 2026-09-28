import { defineBoot } from "#q-app";
import {
  captureBeforeInstallPrompt,
  clearDeferredInstallPrompt,
  dismissInstallPrompt,
} from "@/utils/pwa-install";

export default defineBoot(() => {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", captureBeforeInstallPrompt);

  window.addEventListener("appinstalled", () => {
    clearDeferredInstallPrompt();
    dismissInstallPrompt();
  });
});
