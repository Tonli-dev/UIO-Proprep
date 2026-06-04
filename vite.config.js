import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "UIO ProPrep",
        short_name: "UIO Prep",
        description: "Offline priprema za stručni ispit UIO.",
        theme_color: "#1d4ed8",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/assets/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,json}"]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ]
});
