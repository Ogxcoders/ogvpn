import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Renderer build. The Electron main process loads either the dev server
// (VITE_DEV_SERVER_URL) or the bundled output from dist/renderer/index.html.
export default defineConfig({
  plugins: [react()],
  base: './',
  css: { postcss: { plugins: [] } },
  server: {
    port: 5183,
    strictPort: true
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: false,
    target: 'chrome120'
  }
});
