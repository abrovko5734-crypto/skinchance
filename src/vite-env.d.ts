/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_STEAM_IDS?: string
  readonly VITE_CATALOG_URL?: string
  readonly VITE_PRICES_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
