/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Self-contained Vite config for the AegisVPN web control plane.
// - Dev proxy forwards /api to the local AegisVPN backend (default port 8080).
//   '/agent' is deliberately NOT proxied: it is a machine-to-machine endpoint
//   for VPN server agents (Bearer AGENT_TOKEN) and is never called from a browser.
// - css.postcss is pinned to an empty plugin list so the SPA build never
//   inherits parent/postcss config files from surrounding monorepo folders.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: { plugins: [] },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/__tests__/setupTests.ts",
    css: false,
  },
});
