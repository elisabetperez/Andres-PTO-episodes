/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly SESSION_SECRET: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly ALLOWED_EMAIL: string;        // dominio (terrahq.com) o email completo
  readonly ADMIN_EMAILS?: string;        // emails separados por coma con acceso a /admin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
