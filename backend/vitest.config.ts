import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ["default"],
    globals: false,
  },
  // Self-contained: never inherit a PostCSS/Tailwind config from a parent
  // directory when this repo is nested inside another project.
  css: { postcss: { plugins: [] } },
});
