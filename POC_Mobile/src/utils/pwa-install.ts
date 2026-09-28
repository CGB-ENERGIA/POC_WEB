import { LocalStorage } from "quasar";
import { shallowRef } from "vue";

export const PWA_INSTALL_DISMISS_KEY = "cgb-pwa-install-dismissed";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const deferredInstallPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  const macTouch =
    /Macintosh|Mac OS X/i.test(ua) &&
    navigator.maxTouchPoints > 1 &&
    "ontouchend" in window;
  return macTouch;
}

/** Safari próprio do iOS (não Chrome, Firefox nem WebView de outro app). */
export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent || "";
  const outroApp = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|MicroMessenger/i.test(ua);
  return /Safari/i.test(ua) && !outroApp;
}


export function wasInstallDismissed(): boolean {
  return LocalStorage.getItem(PWA_INSTALL_DISMISS_KEY) === true;
}

export function dismissInstallPrompt(): void {
  LocalStorage.set(PWA_INSTALL_DISMISS_KEY, true);
  deferredInstallPrompt.value = null;
}

export function shouldOfferPwaInstall(): boolean {
  if (isStandaloneDisplay()) return false;
  if (wasInstallDismissed()) return false;
  return true;
}

export function captureBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  deferredInstallPrompt.value = event as BeforeInstallPromptEvent;
}

export function clearDeferredInstallPrompt(): void {
  deferredInstallPrompt.value = null;
}
