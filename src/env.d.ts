/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly SESSION_SECRET: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly ALLOWED_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
