import { defineConfig } from 'vitest/config';

// Tests only exercise pure modules (state machine, conf builder, command
// builders, key generation). None of them import `electron`, so they run in a
// plain Node environment without an Electron runtime.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default']
  },
  // Self-contained: never inherit PostCSS config from parent directories.
  css: { postcss: { plugins: [] } }
});
