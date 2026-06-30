import { defineConfig } from "#q-app";

export default defineConfig(() => {
  return {
    boot: ["pinia", "auth", "lang"],

    css: ["app.scss"],

    extras: [
      "roboto-font",
      "material-icons",
      "mdi-v7",
    ],

    build: {
      typescript: { strict: true, vueShim: true },
      publicPath: "/mobile/",
      vueRouterBase: "/mobile/",
      vueRouterMode: "hash",
    },

    devServer: {
      open: true,
      port: 9100,
      vueRouterBase: "/mobile/",
    },

    framework: {
      config: {
        dark: false,
      },
      lang: "pt-BR",
      plugins: ["Notify", "Dialog", "LocalStorage"],
    },

    animations: [],

    pwa: {
      workboxMode: "GenerateSW",
      extendPWAManifestJson(json) {
        Object.assign(json, {
          name: "CGB Checklist",
          short_name: "CGB Obs",
          description: "Checklist de Observações de Segurança — CGB Engenharia",
          theme_color: "#7a1225",
          background_color: "#eef2f7",
          display: "standalone",
          orientation: "portrait",
          start_url: "/mobile/",
          scope: "/mobile/",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        });
      },
    },
  };
});
