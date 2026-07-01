/*
 * Service worker — app offline-first em /mobile/
 */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

void self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

if (import.meta.env.QUASAR_PROD) {
  registerRoute(
    new NavigationRoute(
      createHandlerBoundToURL(import.meta.env.QUASAR_PWA_FALLBACK_HTML),
      {
        denylist: [
          new RegExp(import.meta.env.QUASAR_PWA_SERVICE_WORKER_REGEX),
          /workbox-(.)*\.js$/,
        ],
      }
    )
  );
}

registerRoute(
  ({ request, url }) =>
    request.destination === "image" && url.origin === self.location.origin,
  new CacheFirst({
    cacheName: "cgb-mobile-images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  ({ request, url }) =>
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font") &&
    url.origin === self.location.origin,
  new CacheFirst({
    cacheName: "cgb-mobile-static",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/mobile/"),
  new NetworkFirst({
    cacheName: "cgb-mobile-pages",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
);
