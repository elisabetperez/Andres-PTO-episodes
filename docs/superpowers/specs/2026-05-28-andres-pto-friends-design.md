# El PTO de Andrés como capítulos de Friends — Diseño

**Fecha:** 2026-05-28
**Estado:** Aprobado (brainstorming)

## Resumen

Web en Netlify que muestra el PTO de Andrés como si fueran capítulos de una sitcom. Cada día tiene un título libre (con emojis) y un resumen de máximo 15 palabras. Un calendario permite navegar por fecha y ver qué se publicó cada día. Las entradas se añaden desde un mini-admin protegido por contraseña.

## Decisiones clave

| Tema | Decisión |
|------|----------|
| Stack | Astro 5 + SCSS (mismas vars/mixins que `/Applications/XAMPP/xamppfiles/htdocs/portfolio`) + adapter `@astrojs/netlify` (SSR) |
| Storage | Netlify Blobs (store `episodes`, key = fecha `YYYY-MM-DD`) |
| Autoría | Mini-admin protegido por contraseña en env var de Netlify |
| Idioma | Español (sin i18n) |
| Rango total | Pilotos: 2026-05-25 → 2026-05-29 (5 días). Temporada 1: 2026-06-01 → 2026-06-30 |
| Numeración | Por temporada, sólo cuenta días con entrada. Formato: `Pilotos · Ep 03` / `T1 · Ep 12` |
| Días vacíos | Aparecen en el calendario en gris con etiqueta "sin episodio" |
| Estilos | Se iteran juntos durante la implementación, no se preset eligen |

## Modelo de datos

```ts
// src/config/seasons.ts (estático)
export const SEASONS = [
  { id: "pilots", label: "Pilotos",     start: "2026-05-25", end: "2026-05-29" },
  { id: "s1",     label: "Temporada 1", start: "2026-06-01", end: "2026-06-30" },
] as const;

// Episodio en Netlify Blobs (store: "episodes", key: YYYY-MM-DD)
type Episode = {
  date: string;        // "2026-05-25" — ID natural
  title: string;       // libre, con emojis
  summary: string;     // máximo 15 palabras
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
};
```

Numeración calculada en runtime, no persistida.

## Rutas

```
src/pages/
├── index.astro          # Calendario + hero del episodio más reciente
├── e/[date].astro       # Detalle del episodio o "sin episodio"
├── admin/index.astro    # Login + form crear/editar
└── api/
    ├── login.ts         # POST { password } → cookie firmada (HMAC)
    ├── logout.ts        # POST → borra cookie
    └── episode.ts       # GET / PUT (PUT requiere cookie)
```

### Estados de cada día en el calendario

1. Fuera de cualquier temporada → muted, no clicable
2. Dentro pero sin entrada → gris, etiqueta "sin episodio", clicable
3. Con entrada → resaltado, título en hover
4. Hoy → borde especial, ortogonal a los demás

## Autenticación

- `ADMIN_PASSWORD` en env var de Netlify (texto plano, sólo lo conoce el owner).
- `SESSION_SECRET` (32 bytes random) para firmar cookie HMAC.
- Cookie: `pto_session=<HMAC>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`.
- Rate limit casero: 5 intentos por IP / 10 min en Blobs (`rate-limit/<ip>`).
- Sin registro, recuperación ni emails.

## Manejo de errores

| Caso | Respuesta |
|------|-----------|
| Password incorrecta | 401 |
| 5 intentos fallidos | 429 |
| Fecha fuera de temporadas (PUT) | 400 |
| Resumen > 15 palabras | 400 con número actual |
| Resumen / título vacíos | 400 |
| Cookie inválida (PUT) | 401, redirect a `/admin` |
| Blobs no responde | 500, log a consola |
| `/e/[date]` malformada o fuera de rango | 404 |
| `/e/[date]` válida sin entrada | 200 con placeholder |

No hacemos: CSRF tokens (SameSite=Strict basta), HTML en título/resumen (escapamos al renderizar).

## Testing

- **Vitest** sobre lógica pura:
  - `seasons.ts`: fecha → temporada, fecha → número de episodio
  - `validation.ts`: contador de palabras (≤15, emojis, espacios múltiples, saltos de línea)
  - `auth.ts`: firma y verificación HMAC
- Sin tests de UI / e2e. Verificación manual con `astro dev` + skill `verify` antes de push.
- `npm run test` en el build de Netlify (rompe deploy si falla).

## Reutilización del portfolio

**Sí:**
- `src/assets/sass/framework/_vars/vars.scss` y `_mixins/mixins.scss` (auto-importados en `astro.config.mjs`).
- `Header.astro`, `Footer.astro`, `Noise.astro` como bases — adaptados al tema PTO.

**No (al menos de inicio):** `Cursor.astro`, `Track.astro`, `Vstage.astro`, GSAP, Lenis, i18n.

## Seed inicial (títulos pilotos)

| Fecha | Título | Resumen |
|-------|--------|---------|
| 2026-05-25 (Lun) | El de la web en 2 idiomas que nadie vio | _pendiente_ |
| 2026-05-26 (Mar) | El del caos en 15five y el org chart | _pendiente_ |
| 2026-05-27 (Mié) | En el que "no estamos mal sin Andrés" | _pendiente_ |
| 2026-05-28 (Jue) | En el que volvió Aurelia | _pendiente_ |
| 2026-05-29 (Vie) | _pendiente_ | _pendiente_ |

Los resúmenes se rellenan vía `/admin` cuando esté el sitio en pie, no bloquean implementación.

## Estructura del repo

```
Andres-PTO-episodes/
├── astro.config.mjs
├── netlify.toml
├── package.json
├── tsconfig.json
├── src/
│   ├── assets/sass/         # framework portfolio + estilos PTO
│   ├── components/
│   │   ├── Calendar.astro
│   │   ├── EpisodeCard.astro
│   │   ├── EpisodeHero.astro
│   │   └── Layout.astro
│   ├── config/seasons.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── episodes.ts
│   │   └── validation.ts
│   ├── pages/
│   └── content/seed-pilots.json
└── tests/
    ├── seasons.test.ts
    ├── validation.test.ts
    └── auth.test.ts
```

## Out of scope

- Multiidioma
- Borrado de entradas (sólo crear / editar)
- Multi-usuario / registro
- Comentarios / reacciones
- RSS, sitemap (se pueden añadir luego)
- PWA / instalación
