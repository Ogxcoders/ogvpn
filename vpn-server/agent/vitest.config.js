import { defineConfig } from "vitest/config";

// Self-contained config: node environment only, no shared plugins.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
