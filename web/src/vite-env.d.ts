/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override for the API origin. Empty string = same origin (default). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
