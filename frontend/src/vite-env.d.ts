/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_ADMIN_LOGIN_EMAIL?: string;
  readonly VITE_ADMIN_LOGIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
