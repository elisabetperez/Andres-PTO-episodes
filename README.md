# El PTO de Andrés

Sitio Astro + Netlify que muestra el PTO de Andrés como capítulos de Friends.

## Desarrollo local

Requisito: Netlify CLI (`npm i -g netlify-cli`) para que Blobs funcione localmente.

```bash
cp .env.example .env
# Edita .env y pon ADMIN_PASSWORD y SESSION_SECRET reales
npm install
netlify dev   # arranca Astro + Blobs locales en el mismo proceso
```

## Tests

```bash
npm run test
```

## Despliegue

1. Conectar el repo a Netlify (web UI).
2. En Site settings → Environment variables, añadir:
   - `ADMIN_PASSWORD` — la contraseña del admin.
   - `SESSION_SECRET` — 32 bytes random en base64 (`openssl rand -base64 32`).
3. Cada push a `main` reconstruye y despliega.

## Estructura

- `src/config/seasons.ts` — rangos de fechas y temporadas.
- `src/lib/` — lógica pura (validación, auth HMAC, numeración, wrapper Blobs).
- `src/components/` — componentes Astro.
- `src/pages/` — rutas (home, episode detail, admin, API).
- `tests/` — unit tests Vitest.

## Añadir un episodio

1. Abrir `/admin`.
2. Introducir contraseña.
3. Elegir fecha del desplegable, escribir título (con emoji) y resumen (≤15 palabras).
4. Guardar.
