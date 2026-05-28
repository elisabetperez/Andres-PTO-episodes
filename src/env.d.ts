/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD: string;
  readonly SESSION_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
