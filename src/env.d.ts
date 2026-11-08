/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** İstemci derleme sürümü (vite.config.ts `define`; E-00-02 sürüm etiketi). */
  readonly VITE_APP_VERSION: string
}
