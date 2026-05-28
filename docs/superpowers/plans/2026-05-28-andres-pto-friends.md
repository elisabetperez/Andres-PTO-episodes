# El PTO de Andrés — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Astro + Netlify site that lets Andrés' PTO be navigated as a Friends-style daily sitcom, with a password-protected admin to add entries.

**Architecture:** Astro 5 SSR on Netlify, Netlify Blobs as KV store, signed-cookie auth for the admin. SCSS framework copied from the existing portfolio project for typography/grid/foundation reuse. Visual polish is iterated live with the user after functional skeleton lands.

**Tech Stack:** Astro 5, `@astrojs/netlify` (SSR adapter), `@netlify/blobs`, SCSS, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-28-andres-pto-friends-design.md`

**Reference project:** `/Applications/XAMPP/xamppfiles/htdocs/portfolio` — SCSS framework (`src/assets/sass/framework/`) is copied wholesale in Task 4.

---

## Task 1: Scaffold Astro project + TypeScript + Netlify adapter

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `netlify.toml`
- Create: `src/env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "andres-pto-episodes",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/netlify": "^6.0.0",
    "@netlify/blobs": "^8.1.0",
    "astro": "^5.1.0",
    "sass": "^1.83.4"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",
  adapter: netlify(),
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "src/assets/sass/framework/_vars/vars.scss";
            @import "src/assets/sass/framework/_mixins/mixins.scss";
          `,
        },
      },
    },
  },
});
```

- [ ] **Step 4: Create `netlify.toml`**

```toml
[build]
  command = "npm run test && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 5: Create `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD: string;
  readonly SESSION_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: dependencies resolve, `node_modules/` and `package-lock.json` created.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json astro.config.mjs netlify.toml src/env.d.ts
git commit -m "chore: scaffold Astro 5 + Netlify SSR + Vitest setup"
```

---

## Task 2: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 2: Create empty `tests/.gitkeep`**

Empty file, just to keep the dir in git.

- [ ] **Step 3: Run vitest to confirm it starts**

Run: `npm run test`
Expected: vitest runs, reports "No test files found" or similar, exits 0 (or non-zero with clear "no tests" message — that's OK, we'll add one in next task).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/.gitkeep
git commit -m "chore: add Vitest config"
```

---

## Task 3: Implement `src/config/seasons.ts` with TDD

**Files:**
- Create: `src/config/seasons.ts`
- Create: `tests/seasons.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/seasons.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  SEASONS,
  getSeasonForDate,
  isInAnySeason,
  daysInSeason,
} from "@/config/seasons";

describe("SEASONS", () => {
  it("has Pilotos and Temporada 1 seasons", () => {
    expect(SEASONS).toHaveLength(2);
    expect(SEASONS[0].id).toBe("pilots");
    expect(SEASONS[1].id).toBe("s1");
  });
});

describe("getSeasonForDate", () => {
  it("returns Pilotos for 2026-05-25 (start) and 2026-05-29 (end)", () => {
    expect(getSeasonForDate("2026-05-25")?.id).toBe("pilots");
    expect(getSeasonForDate("2026-05-29")?.id).toBe("pilots");
  });

  it("returns Temporada 1 for 2026-06-15", () => {
    expect(getSeasonForDate("2026-06-15")?.id).toBe("s1");
  });

  it("returns null for 2026-05-30 (gap between seasons)", () => {
    expect(getSeasonForDate("2026-05-30")).toBeNull();
  });

  it("returns null for 2026-05-24 (before any season)", () => {
    expect(getSeasonForDate("2026-05-24")).toBeNull();
  });

  it("returns null for 2026-07-01 (after all seasons)", () => {
    expect(getSeasonForDate("2026-07-01")).toBeNull();
  });
});

describe("isInAnySeason", () => {
  it("returns true for in-range dates", () => {
    expect(isInAnySeason("2026-05-25")).toBe(true);
    expect(isInAnySeason("2026-06-30")).toBe(true);
  });

  it("returns false for out-of-range dates", () => {
    expect(isInAnySeason("2026-05-30")).toBe(false);
    expect(isInAnySeason("2025-01-01")).toBe(false);
  });
});

describe("daysInSeason", () => {
  it("returns 5 dates for Pilotos", () => {
    const dates = daysInSeason("pilots");
    expect(dates).toEqual([
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ]);
  });

  it("returns 30 dates for Temporada 1", () => {
    expect(daysInSeason("s1")).toHaveLength(30);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — module `@/config/seasons` not found.

- [ ] **Step 3: Implement `src/config/seasons.ts`**

```ts
export type SeasonId = "pilots" | "s1";

export type Season = {
  id: SeasonId;
  label: string;
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD inclusive
};

export const SEASONS: readonly Season[] = [
  { id: "pilots", label: "Pilotos",     start: "2026-05-25", end: "2026-05-29" },
  { id: "s1",     label: "Temporada 1", start: "2026-06-01", end: "2026-06-30" },
] as const;

export function getSeasonForDate(date: string): Season | null {
  for (const s of SEASONS) {
    if (date >= s.start && date <= s.end) return s;
  }
  return null;
}

export function isInAnySeason(date: string): boolean {
  return getSeasonForDate(date) !== null;
}

export function daysInSeason(id: SeasonId): string[] {
  const season = SEASONS.find((s) => s.id === id);
  if (!season) return [];
  const out: string[] = [];
  const cur = new Date(season.start + "T00:00:00Z");
  const end = new Date(season.end + "T00:00:00Z");
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/config/seasons.ts tests/seasons.test.ts
git commit -m "feat(seasons): season config with date lookup helpers"
```

---

## Task 4: Implement `src/lib/validation.ts` with TDD

**Files:**
- Create: `src/lib/validation.ts`
- Create: `tests/validation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  countWords,
  validateSummary,
  validateTitle,
  validateDate,
  MAX_SUMMARY_WORDS,
} from "@/lib/validation";

describe("countWords", () => {
  it("counts simple words", () => {
    expect(countWords("hola que tal")).toBe(3);
  });

  it("collapses multiple spaces and newlines", () => {
    expect(countWords("hola    que\n\ntal")).toBe(3);
  });

  it("trims leading and trailing whitespace", () => {
    expect(countWords("   hola que tal   ")).toBe(3);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("treats emojis attached to a word as part of that word", () => {
    expect(countWords("🏖️hola")).toBe(1);
    expect(countWords("🏖️ hola")).toBe(2);
  });
});

describe("validateSummary", () => {
  it("accepts a 15-word summary", () => {
    const fifteen = "a b c d e f g h i j k l m n o";
    expect(validateSummary(fifteen)).toEqual({ ok: true });
  });

  it("rejects a 16-word summary with word count in the error", () => {
    const sixteen = "a b c d e f g h i j k l m n o p";
    expect(validateSummary(sixteen)).toEqual({
      ok: false,
      error: `Máximo ${MAX_SUMMARY_WORDS} palabras (tienes 16)`,
    });
  });

  it("rejects empty summary", () => {
    expect(validateSummary("")).toEqual({
      ok: false,
      error: "Falta el resumen",
    });
    expect(validateSummary("   ")).toEqual({
      ok: false,
      error: "Falta el resumen",
    });
  });
});

describe("validateTitle", () => {
  it("accepts a non-empty title", () => {
    expect(validateTitle("🏖️ El que Andrés desaparece")).toEqual({ ok: true });
  });

  it("rejects empty title", () => {
    expect(validateTitle("")).toEqual({ ok: false, error: "Falta el título" });
    expect(validateTitle("   ")).toEqual({ ok: false, error: "Falta el título" });
  });
});

describe("validateDate", () => {
  it("accepts a YYYY-MM-DD date inside a season", () => {
    expect(validateDate("2026-05-25")).toEqual({ ok: true });
  });

  it("rejects a malformed date", () => {
    expect(validateDate("25-05-2026")).toEqual({
      ok: false,
      error: "Fecha mal formada (esperado YYYY-MM-DD)",
    });
    expect(validateDate("2026-5-25")).toEqual({
      ok: false,
      error: "Fecha mal formada (esperado YYYY-MM-DD)",
    });
  });

  it("rejects a date outside all seasons", () => {
    expect(validateDate("2026-05-30")).toEqual({
      ok: false,
      error: "Esa fecha no es del PTO de Andrés",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — module `@/lib/validation` not found.

- [ ] **Step 3: Implement `src/lib/validation.ts`**

```ts
import { isInAnySeason } from "@/config/seasons";

export const MAX_SUMMARY_WORDS = 15;

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function validateSummary(s: string): ValidationResult {
  if (!s.trim()) return { ok: false, error: "Falta el resumen" };
  const n = countWords(s);
  if (n > MAX_SUMMARY_WORDS) {
    return {
      ok: false,
      error: `Máximo ${MAX_SUMMARY_WORDS} palabras (tienes ${n})`,
    };
  }
  return { ok: true };
}

export function validateTitle(t: string): ValidationResult {
  if (!t.trim()) return { ok: false, error: "Falta el título" };
  return { ok: true };
}

export function validateDate(d: string): ValidationResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { ok: false, error: "Fecha mal formada (esperado YYYY-MM-DD)" };
  }
  if (!isInAnySeason(d)) {
    return { ok: false, error: "Esa fecha no es del PTO de Andrés" };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, all validation tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts tests/validation.test.ts
git commit -m "feat(validation): title/summary/date validators with 15-word limit"
```

---

## Task 5: Implement `src/lib/auth.ts` (HMAC cookie) with TDD

**Files:**
- Create: `src/lib/auth.ts`
- Create: `tests/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

describe("signSession + verifySession", () => {
  it("round-trips a valid session and returns its payload", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    expect(verifySession(cookie, SECRET)).not.toBeNull();
  });

  it("rejects a cookie signed with a different secret", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    expect(verifySession(cookie, "other-secret-aaaaaaaaaaaaaaaaaaaaa")).toBeNull();
  });

  it("rejects a tampered cookie", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    const [payload, sig] = cookie.split(".");
    const tampered = payload.replace(/.$/, "X") + "." + sig;
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  it("rejects an expired cookie", () => {
    const cookie = signSession({ exp: Date.now() - 1 }, SECRET);
    expect(verifySession(cookie, SECRET)).toBeNull();
  });

  it("rejects a malformed cookie", () => {
    expect(verifySession("not-a-cookie", SECRET)).toBeNull();
    expect(verifySession("", SECRET)).toBeNull();
    expect(verifySession("only.one.part.too.many", SECRET)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — module `@/lib/auth` not found.

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  exp: number; // epoch ms
};

function b64urlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string, secret: string): string {
  return b64urlEncode(createHmac("sha256", secret).update(payload).digest());
}

export function signSession(p: SessionPayload, secret: string): string {
  const payload = b64urlEncode(JSON.stringify(p));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(cookie: string, secret: string): SessionPayload | null {
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  let data: SessionPayload;
  try {
    data = JSON.parse(b64urlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
  return data;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, all auth tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts tests/auth.test.ts
git commit -m "feat(auth): HMAC-signed session cookie with expiry"
```

---

## Task 6: Implement `src/lib/numbering.ts` with TDD

**Files:**
- Create: `src/lib/numbering.ts`
- Create: `tests/numbering.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/numbering.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { episodeNumber, episodeLabel } from "@/lib/numbering";

describe("episodeNumber", () => {
  it("returns 1 for the only entry in a season", () => {
    expect(episodeNumber("2026-05-25", ["2026-05-25"])).toBe(1);
  });

  it("counts only entries within the same season as the target", () => {
    expect(
      episodeNumber("2026-06-03", ["2026-05-25", "2026-06-01", "2026-06-03"])
    ).toBe(2); // s1: 06-01 is 1, 06-03 is 2
  });

  it("counts in chronological order, regardless of input order", () => {
    expect(
      episodeNumber("2026-05-27", ["2026-05-29", "2026-05-25", "2026-05-27"])
    ).toBe(2);
  });

  it("returns null when target has no entry", () => {
    expect(episodeNumber("2026-05-26", ["2026-05-25"])).toBeNull();
  });

  it("returns null when target is outside all seasons", () => {
    expect(episodeNumber("2026-05-30", ["2026-05-30"])).toBeNull();
  });
});

describe("episodeLabel", () => {
  it("formats Pilotos as 'Pilotos · Ep 03'", () => {
    expect(
      episodeLabel("2026-05-27", ["2026-05-25", "2026-05-26", "2026-05-27"])
    ).toBe("Pilotos · Ep 03");
  });

  it("formats Temporada 1 as 'T1 · Ep 02'", () => {
    expect(episodeLabel("2026-06-03", ["2026-06-01", "2026-06-03"])).toBe(
      "T1 · Ep 02"
    );
  });

  it("returns null when there is no episode", () => {
    expect(episodeLabel("2026-05-26", [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — module `@/lib/numbering` not found.

- [ ] **Step 3: Implement `src/lib/numbering.ts`**

```ts
import { getSeasonForDate } from "@/config/seasons";

export function episodeNumber(
  date: string,
  allEntryDates: readonly string[]
): number | null {
  const season = getSeasonForDate(date);
  if (!season) return null;
  if (!allEntryDates.includes(date)) return null;
  const inSeason = allEntryDates
    .filter((d) => {
      const s = getSeasonForDate(d);
      return s && s.id === season.id;
    })
    .sort();
  const idx = inSeason.indexOf(date);
  return idx === -1 ? null : idx + 1;
}

export function episodeLabel(
  date: string,
  allEntryDates: readonly string[]
): string | null {
  const n = episodeNumber(date, allEntryDates);
  if (n === null) return null;
  const season = getSeasonForDate(date)!;
  const padded = String(n).padStart(2, "0");
  if (season.id === "pilots") return `Pilotos · Ep ${padded}`;
  return `T1 · Ep ${padded}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, all numbering tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/numbering.ts tests/numbering.test.ts
git commit -m "feat(numbering): season-scoped episode numbering"
```

---

## Task 7: Implement `src/lib/episodes.ts` (Netlify Blobs wrapper)

**Files:**
- Create: `src/lib/episodes.ts`

Note: this wraps `@netlify/blobs`. We don't unit-test the Blobs SDK itself; we exercise it via the API tests + manual verification. Real network calls would make tests fragile.

- [ ] **Step 1: Implement `src/lib/episodes.ts`**

```ts
import { getStore } from "@netlify/blobs";

export type Episode = {
  date: string;        // YYYY-MM-DD
  title: string;
  summary: string;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
};

const STORE_NAME = "episodes";

function store() {
  return getStore(STORE_NAME);
}

export async function getEpisode(date: string): Promise<Episode | null> {
  const raw = await store().get(date, { type: "json" });
  return (raw as Episode | null) ?? null;
}

export async function listEpisodes(): Promise<Episode[]> {
  const { blobs } = await store().list();
  const items = await Promise.all(
    blobs.map((b) => store().get(b.key, { type: "json" }) as Promise<Episode | null>)
  );
  return items.filter((x): x is Episode => x !== null).sort((a, b) => a.date.localeCompare(b.date));
}

export async function putEpisode(input: {
  date: string;
  title: string;
  summary: string;
}): Promise<Episode> {
  const now = new Date().toISOString();
  const existing = await getEpisode(input.date);
  const ep: Episode = {
    date: input.date,
    title: input.title.trim(),
    summary: input.summary.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store().setJSON(input.date, ep);
  return ep;
}
```

- [ ] **Step 2: Type-check by running build**

Run: `npx astro check 2>&1 | tail -20` (or just `npm run build` — expected to fail at runtime without env vars, but TS errors will surface).
Expected: no TS errors related to `src/lib/episodes.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/episodes.ts
git commit -m "feat(episodes): Netlify Blobs CRUD wrapper"
```

---

## Task 8: Copy SCSS framework from portfolio

**Files:**
- Create: `src/assets/sass/framework/...` (mirror of portfolio's `src/assets/sass/framework/`)
- Create: `src/assets/sass/style.scss`

- [ ] **Step 1: Copy the framework directory wholesale**

Run from the project root:

```bash
cp -R /Applications/XAMPP/xamppfiles/htdocs/portfolio/src/assets/sass/framework src/assets/sass/framework
```

- [ ] **Step 2: Create a slim `src/assets/sass/style.scss`**

Drop the portfolio-specific components we don't need (cursor, track, vstage, marquee, tile-grid, smiley, preloader, hero, quien, scroll-down, progress). Keep foundation, utilities, plus components we'll reuse (header, footer, noise, btn, hairline, section, block-text, link).

```scss
// Foundation (reset, grid, spacing, font, color, background)
@import "./framework/foundation/foundation";

// Utilities
@import "./framework/utilities/utilities";

// Components we keep from the portfolio
@import "./framework/components/section/c--section-a";
@import "./framework/components/hairline/c--hairline-a";
@import "./framework/components/btn/c--btn-a";
@import "./framework/components/link/c--link-a";
@import "./framework/components/block-text/c--bt-a";
@import "./framework/components/block-text/c--bt-b";
@import "./framework/components/header/c--header-a";
@import "./framework/components/footer/c--footer-a";
@import "./framework/components/noise/c--noise-a";

// PTO-specific components (added in later tasks)
// @import "./components/calendar/c--calendar-a";
// @import "./components/episode-card/c--episode-card-a";
// @import "./components/episode-hero/c--episode-hero-a";
// @import "./components/admin/c--admin-a";
```

- [ ] **Step 3: Verify SCSS compiles (no consumer page yet, but vite can parse)**

We'll exercise it in Task 9 when the Layout imports it. For now just commit.

- [ ] **Step 4: Commit**

```bash
git add src/assets/sass
git commit -m "chore(scss): import portfolio sass framework"
```

---

## Task 9: Base `Layout.astro`

**Files:**
- Create: `src/components/Layout.astro`

- [ ] **Step 1: Implement `src/components/Layout.astro`**

```astro
---
import "@/assets/sass/style.scss";

type Props = {
  title?: string;
  description?: string;
};

const {
  title = "El PTO de Andrés",
  description = "El PTO de Andrés como capítulos de Friends.",
} = Astro.props;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <main class="page">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 2: Add minimal favicon**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="26">🌴</text></svg>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.astro public/favicon.svg
git commit -m "feat(layout): base Astro layout with SCSS entrypoint"
```

---

## Task 10: Stub home page (`/`) that proves the stack works

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Implement a stub home**

```astro
---
import Layout from "@/components/Layout.astro";
import { SEASONS } from "@/config/seasons";
import { listEpisodes } from "@/lib/episodes";

let episodes: Awaited<ReturnType<typeof listEpisodes>> = [];
try {
  episodes = await listEpisodes();
} catch (err) {
  console.error("Could not list episodes (likely Blobs not configured locally):", err);
}
---

<Layout>
  <section class="o--section">
    <h1>El PTO de Andrés</h1>
    <p>Una sitcom diaria, en formato calendario.</p>

    <h2>Temporadas</h2>
    <ul>
      {SEASONS.map((s) => (
        <li>
          <strong>{s.label}</strong> — {s.start} a {s.end}
        </li>
      ))}
    </ul>

    <h2>Episodios registrados</h2>
    {episodes.length === 0 ? (
      <p>Sin episodios todavía.</p>
    ) : (
      <ul>
        {episodes.map((e) => (
          <li>
            <a href={`/e/${e.date}`}>{e.date} — {e.title}</a>
          </li>
        ))}
      </ul>
    )}
  </section>
</Layout>
```

- [ ] **Step 2: Run dev server, check `http://localhost:4321/`**

Run: `npm run dev`
Expected: page loads, shows season list and "Sin episodios todavía." (no Blobs in dev unless configured; the try/catch handles that).

Stop the server (`Ctrl+C`).

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): stub home page listing seasons and episodes"
```

---

## Task 11: `Calendar.astro` component

**Files:**
- Create: `src/components/Calendar.astro`
- Create: `src/assets/sass/components/calendar/_c--calendar-a.scss`
- Modify: `src/assets/sass/style.scss` (uncomment the calendar import)

- [ ] **Step 1: Implement `src/components/Calendar.astro`**

The calendar is server-rendered. It takes a list of months to display (derived from SEASONS) and a set of dates that have episodes. Each cell links to `/e/[date]` when in a season.

```astro
---
import { SEASONS, isInAnySeason } from "@/config/seasons";

type Props = {
  episodeDates: readonly string[];
  today: string; // YYYY-MM-DD
};

const { episodeDates, today } = Astro.props;
const hasEntry = new Set(episodeDates);

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DOW_ES = ["L", "M", "X", "J", "V", "S", "D"];

// Build month buckets from seasons (unique months across all seasons)
const monthsSet = new Set<string>();
for (const s of SEASONS) {
  const start = new Date(s.start + "T00:00:00Z");
  const end = new Date(s.end + "T00:00:00Z");
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cur <= end) {
    monthsSet.add(`${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
}
const months = [...monthsSet].sort();

function buildMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  // Monday-first week index: Mon=0..Sun=6
  const startOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<{ date: string | null; status: "outside-month" | "outside-season" | "empty" | "filled" | "today" }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, status: "outside-month" });
  for (let d = 1; d <= last.getUTCDate(); d++) {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let status: typeof cells[number]["status"];
    if (!isInAnySeason(iso)) status = "outside-season";
    else if (hasEntry.has(iso)) status = "filled";
    else status = "empty";
    if (iso === today) status = "today";
    cells.push({ date: iso, status });
  }
  return { name: `${MONTHS_ES[m - 1]} ${y}`, cells };
}
const monthData = months.map(buildMonth);
---

<div class="c--calendar-a">
  {monthData.map((mo) => (
    <div class="c--calendar-a__month">
      <h3 class="c--calendar-a__title">{mo.name}</h3>
      <div class="c--calendar-a__dow">
        {DOW_ES.map((d) => <span>{d}</span>)}
      </div>
      <div class="c--calendar-a__grid">
        {mo.cells.map((cell) => {
          if (!cell.date) return <span class="c--calendar-a__cell is-blank" />;
          const cls = `c--calendar-a__cell is-${cell.status}`;
          const day = Number(cell.date.slice(8));
          if (cell.status === "outside-season") {
            return <span class={cls}>{day}</span>;
          }
          return <a class={cls} href={`/e/${cell.date}`}>{day}</a>;
        })}
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 2: Create `src/assets/sass/components/calendar/_c--calendar-a.scss`**

Minimal functional styles — visuals are iterated with the user after the skeleton lands.

```scss
.c--calendar-a {
  display: grid;
  gap: 2rem;

  &__title {
    font-family: $type-a;
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
  }

  &__dow {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-family: $type-c;
    font-size: 0.75rem;
    color: $color-d;
    margin-bottom: 0.25rem;
    text-align: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: $color-c;
    border: 1px solid transparent;
    font-family: $type-b;
    font-size: 0.875rem;

    &.is-blank {
      visibility: hidden;
    }

    &.is-outside-season {
      color: $color-d;
      opacity: 0.4;
      pointer-events: none;
    }

    &.is-empty {
      background: rgba(0, 0, 0, 0.04);
    }

    &.is-filled {
      background: $color-b;
      font-weight: 600;
    }

    &.is-today {
      border-color: $color-c;
      font-weight: 700;
    }
  }
}
```

- [ ] **Step 3: Wire the SCSS partial into `src/assets/sass/style.scss`**

Change the commented line:

```scss
// @import "./components/calendar/c--calendar-a";
```

to:

```scss
@import "./components/calendar/c--calendar-a";
```

- [ ] **Step 4: Use the component in the home page**

Replace the contents of `src/pages/index.astro`:

```astro
---
import Layout from "@/components/Layout.astro";
import Calendar from "@/components/Calendar.astro";
import { listEpisodes } from "@/lib/episodes";

let episodes: Awaited<ReturnType<typeof listEpisodes>> = [];
try {
  episodes = await listEpisodes();
} catch (err) {
  console.error("Could not list episodes:", err);
}
const today = new Date().toISOString().slice(0, 10);
const episodeDates = episodes.map((e) => e.date);
---

<Layout>
  <section class="o--section">
    <header>
      <h1>El PTO de Andrés</h1>
      <p>Una sitcom diaria, en formato calendario.</p>
    </header>

    <Calendar episodeDates={episodeDates} today={today} />
  </section>
</Layout>
```

- [ ] **Step 5: Run dev server, click around the calendar**

Run: `npm run dev`
Expected: two months render (May 2026, Jun 2026). Days outside seasons are dim. Days inside seasons without entries are slightly tinted. "Today" has a border. Clicking a date navigates to `/e/<date>` (which 404s for now — that's Task 12).

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/components/Calendar.astro src/assets/sass/components src/assets/sass/style.scss src/pages/index.astro
git commit -m "feat(calendar): server-rendered season calendar"
```

---

## Task 12: Episode detail page `/e/[date]`

**Files:**
- Create: `src/pages/e/[date].astro`

- [ ] **Step 1: Implement the dynamic route**

```astro
---
import Layout from "@/components/Layout.astro";
import { isInAnySeason, getSeasonForDate } from "@/config/seasons";
import { getEpisode, listEpisodes } from "@/lib/episodes";
import { episodeLabel } from "@/lib/numbering";

const { date } = Astro.params;
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  return new Response("Not Found", { status: 404 });
}
if (!isInAnySeason(date)) {
  return new Response("Not Found", { status: 404 });
}

const season = getSeasonForDate(date)!;
let episode = null;
let allDates: string[] = [];
try {
  episode = await getEpisode(date);
  const all = await listEpisodes();
  allDates = all.map((e) => e.date);
} catch (err) {
  console.error("Could not fetch episode:", err);
}

const label = episodeLabel(date, allDates);
---

<Layout title={episode ? `${episode.title} · El PTO de Andrés` : `Sin episodio · ${date}`}>
  <section class="o--section">
    <p><a href="/">← Volver al calendario</a></p>
    <p>
      <small>{season.label} · {date}{label ? ` · ${label}` : ""}</small>
    </p>
    {episode ? (
      <article>
        <h1>{episode.title}</h1>
        <p>{episode.summary}</p>
      </article>
    ) : (
      <article>
        <h1>Sin episodio</h1>
        <p>Este día está en el rango del PTO pero todavía no hay entrada.</p>
      </article>
    )}
  </section>
</Layout>
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`
- Visit `/e/2026-05-25` → "Sin episodio".
- Visit `/e/2026-05-30` → 404 (gap day).
- Visit `/e/2025-01-01` → 404 (out of range).
- Visit `/e/abc` → 404 (malformed).

Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/e
git commit -m "feat(episode): dynamic episode detail page"
```

---

## Task 13: `POST /api/login` endpoint

**Files:**
- Create: `src/pages/api/login.ts`

- [ ] **Step 1: Implement the endpoint**

```ts
import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";
import { getStore } from "@netlify/blobs";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type RateRecord = { count: number; firstAt: number };

async function checkRateLimit(ip: string): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const store = getStore("rate-limit");
  const key = `login/${ip}`;
  const now = Date.now();
  const rec = ((await store.get(key, { type: "json" })) as RateRecord | null) ?? null;
  if (!rec || now - rec.firstAt > RATE_LIMIT_WINDOW_MS) {
    await store.setJSON(key, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (rec.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((rec.firstAt + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { ok: false, retryAfterSec };
  }
  await store.setJSON(key, { count: rec.count + 1, firstAt: rec.firstAt });
  return { ok: true };
}

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  const ip = clientAddress || "unknown";
  const rate = await checkRateLimit(ip);
  if (!rate.ok) {
    return new Response(
      JSON.stringify({ error: "Demasiados intentos, espera unos minutos" }),
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const expected = import.meta.env.ADMIN_PASSWORD;
  const secret = import.meta.env.SESSION_SECRET;
  if (!expected || !secret) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }
  if (body.password !== expected) {
    return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), { status: 401 });
  }

  const token = signSession({ exp: Date.now() + SESSION_TTL_MS }, secret);
  cookies.set("pto_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/login.ts
git commit -m "feat(api): login endpoint with HMAC session cookie + rate limit"
```

---

## Task 14: `POST /api/logout` endpoint

**Files:**
- Create: `src/pages/api/logout.ts`

- [ ] **Step 1: Implement**

```ts
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete("pto_session", { path: "/" });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/logout.ts
git commit -m "feat(api): logout endpoint"
```

---

## Task 15: `PUT /api/episode` endpoint

**Files:**
- Create: `src/pages/api/episode.ts`

- [ ] **Step 1: Implement**

```ts
import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { validateTitle, validateSummary, validateDate } from "@/lib/validation";
import { putEpisode, getEpisode } from "@/lib/episodes";

function requireAuth(token: string | undefined): boolean {
  if (!token) return false;
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) return false;
  return verifySession(token, secret) !== null;
}

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get("date");
  if (!date) return new Response(JSON.stringify({ error: "Missing date" }), { status: 400 });
  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  const ep = await getEpisode(date);
  return new Response(JSON.stringify({ episode: ep }), { status: 200 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("pto_session")?.value;
  if (!requireAuth(token)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    date?: string;
    title?: string;
    summary?: string;
  };

  const dateCheck = validateDate(body.date ?? "");
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });

  const titleCheck = validateTitle(body.title ?? "");
  if (!titleCheck.ok) return new Response(JSON.stringify(titleCheck), { status: 400 });

  const summaryCheck = validateSummary(body.summary ?? "");
  if (!summaryCheck.ok) return new Response(JSON.stringify(summaryCheck), { status: 400 });

  try {
    const ep = await putEpisode({
      date: body.date!,
      title: body.title!,
      summary: body.summary!,
    });
    return new Response(JSON.stringify({ ok: true, episode: ep }), { status: 200 });
  } catch (err) {
    console.error("putEpisode failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "No se pudo guardar, reintenta" }),
      { status: 500 }
    );
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/episode.ts
git commit -m "feat(api): GET/PUT episode endpoints with auth + validation"
```

---

## Task 16: `/admin` page (login + edit form)

**Files:**
- Create: `src/pages/admin/index.astro`

- [ ] **Step 1: Implement the admin page**

The page is rendered server-side. If no valid session cookie is present, it shows the login form. Otherwise it shows the edit form. Both forms post JSON via `fetch` from a small inline script and reload on success.

```astro
---
import Layout from "@/components/Layout.astro";
import { verifySession } from "@/lib/auth";
import { SEASONS, daysInSeason } from "@/config/seasons";

const token = Astro.cookies.get("pto_session")?.value;
const secret = import.meta.env.SESSION_SECRET;
const isAuthed = !!(token && secret && verifySession(token, secret));

const allDates = SEASONS.flatMap((s) => daysInSeason(s.id));
---

<Layout title="Admin · El PTO de Andrés">
  <section class="o--section">
    <h1>Admin</h1>

    {!isAuthed ? (
      <form id="login-form">
        <label>
          Contraseña
          <input type="password" name="password" required autofocus />
        </label>
        <button type="submit">Entrar</button>
        <p id="login-error" role="alert" style="color:#c00;"></p>
      </form>
    ) : (
      <>
        <form id="logout-form" style="margin-bottom:1.5rem;">
          <button type="submit">Cerrar sesión</button>
        </form>

        <form id="episode-form">
          <label>
            Fecha
            <select name="date" required>
              {allDates.map((d) => <option value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            Título
            <input type="text" name="title" required maxlength="200" placeholder="🏖️ El que..." />
          </label>
          <label>
            Resumen <small id="word-count">(0/15 palabras)</small>
            <textarea name="summary" required rows="3" maxlength="400"></textarea>
          </label>
          <button type="submit">Guardar</button>
          <p id="episode-status" role="status"></p>
        </form>

        <script>
          const form = document.getElementById("episode-form") as HTMLFormElement;
          const summary = form.querySelector('textarea[name="summary"]') as HTMLTextAreaElement;
          const count = document.getElementById("word-count")!;
          const status = document.getElementById("episode-status")!;
          const dateSel = form.querySelector('select[name="date"]') as HTMLSelectElement;
          const titleInput = form.querySelector('input[name="title"]') as HTMLInputElement;

          function wc(s: string): number {
            const t = s.trim();
            return t ? t.split(/\s+/).length : 0;
          }
          summary.addEventListener("input", () => {
            const n = wc(summary.value);
            count.textContent = `(${n}/15 palabras)`;
            count.style.color = n > 15 ? "#c00" : "";
          });

          // Prefill if there is already an episode for the selected date.
          async function loadExisting() {
            const r = await fetch(`/api/episode?date=${encodeURIComponent(dateSel.value)}`);
            if (!r.ok) return;
            const data = await r.json();
            if (data.episode) {
              titleInput.value = data.episode.title;
              summary.value = data.episode.summary;
              summary.dispatchEvent(new Event("input"));
            } else {
              titleInput.value = "";
              summary.value = "";
              count.textContent = "(0/15 palabras)";
            }
          }
          dateSel.addEventListener("change", loadExisting);
          loadExisting();

          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            status.textContent = "Guardando...";
            status.style.color = "";
            const body = {
              date: dateSel.value,
              title: titleInput.value,
              summary: summary.value,
            };
            const r = await fetch("/api/episode", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await r.json();
            if (r.ok) {
              status.textContent = "Guardado ✓";
              status.style.color = "green";
            } else {
              status.textContent = data.error ?? "Error";
              status.style.color = "#c00";
            }
          });

          const logout = document.getElementById("logout-form") as HTMLFormElement;
          logout.addEventListener("submit", async (e) => {
            e.preventDefault();
            await fetch("/api/logout", { method: "POST" });
            location.reload();
          });
        </script>
      </>
    )}

    {!isAuthed && (
      <script>
        const f = document.getElementById("login-form") as HTMLFormElement;
        const err = document.getElementById("login-error")!;
        f.addEventListener("submit", async (e) => {
          e.preventDefault();
          err.textContent = "";
          const pw = (f.elements.namedItem("password") as HTMLInputElement).value;
          const r = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pw }),
          });
          if (r.ok) {
            location.reload();
          } else {
            const data = await r.json().catch(() => ({}));
            err.textContent = data.error ?? "Error";
          }
        });
      </script>
    )}
  </section>
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin
git commit -m "feat(admin): login + edit form page"
```

---

## Task 17: Local dev environment + secrets

**Files:**
- Create: `.env.example`
- Modify: `.gitignore` (add `.env`)
- Create: `README.md`

- [ ] **Step 1: Create `.env.example`**

```bash
# Copy to .env for local dev (Netlify Blobs requires Netlify CLI for local dev)
ADMIN_PASSWORD=changeme
SESSION_SECRET=replace-with-32-random-bytes-in-base64
```

- [ ] **Step 2: Append `.env` to `.gitignore`**

Add `.env` on a new line in `.gitignore`.

- [ ] **Step 3: Create `README.md`**

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore README.md
git commit -m "docs: README, .env.example, ignore .env"
```

---

## Task 18: End-to-end manual verification

No code in this task — just exercise the running app and confirm the spec.

- [ ] **Step 1: Run `netlify dev` and visit `/`**

Expected: calendar renders. May 2026 and June 2026 visible. Days 25-29 May and all of June clickable, others muted.

- [ ] **Step 2: Visit `/admin`**

Expected: password form. Submit wrong password → "Contraseña incorrecta". Submit 6 times → 429.

- [ ] **Step 3: Submit correct password**

Expected: form switches to edit mode. Date dropdown lists exactly 35 dates (5 May + 30 June).

- [ ] **Step 4: Create the 4 pilots**

For each of:
- `2026-05-25` — "El de la web en 2 idiomas que nadie vio"
- `2026-05-26` — "El del caos en 15five y el org chart"
- `2026-05-27` — En el que \"no estamos mal sin Andrés\""
- `2026-05-28` — "En el que volvió Aurelia"

Use a placeholder summary like "Resumen pendiente." until the user provides real ones.

Expected after each save: status "Guardado ✓".

- [ ] **Step 5: Verify the home + episode pages**

- `/` → those 4 days appear highlighted on the calendar.
- `/e/2026-05-25` → shows the title and summary.
- `/e/2026-05-29` → "Sin episodio" placeholder.
- `/e/2026-05-30` → 404.

- [ ] **Step 6: Word-count enforcement**

In `/admin`, try saving a summary with 16+ words → "Máximo 15 palabras (tienes N)".

- [ ] **Step 7: Logout**

Click "Cerrar sesión" → page reloads to login form. Hit `/admin` directly → login form. Send `PUT /api/episode` from a tool with no cookie → 401.

- [ ] **Step 8: Run the full test suite**

Run: `npm run test`
Expected: all unit tests pass.

- [ ] **Step 9: Commit any incidental fixes**

```bash
git add -A
git commit -m "chore: manual verification pass" --allow-empty
```

---

## Task 19: Iterate visuals together with the user

This is intentionally open. After Task 18, the skeleton works end-to-end with minimal styling. The user explicitly wanted to work on styles together. Sit with the user and decide:

- Calendar visual treatment (cell shape, accent color for filled days, "today" treatment).
- Episode hero layout (`/e/[date]`): typography, spacing, season/episode kicker, prev/next nav.
- Friends-style theming intensity (we deferred this during brainstorming).
- Admin form polish (it's currently unstyled).

For each subsequent visual change: edit the relevant SCSS partial under `src/assets/sass/components/`, reload `netlify dev`, iterate. Commit small, focused changes.

- [ ] **Step 1: Open dev server side by side with the user**

```bash
netlify dev
```

- [ ] **Step 2: Iterate calendar style**

Edit `src/assets/sass/components/calendar/_c--calendar-a.scss` based on user feedback. Commit each accepted change.

- [ ] **Step 3: Iterate episode detail style**

Create `src/components/EpisodeHero.astro` + `src/assets/sass/components/episode-hero/_c--episode-hero-a.scss`. Refactor `/e/[date]` to use it. Commit.

- [ ] **Step 4: Iterate home hero (latest episode)**

Add a "último episodio" hero on top of the home, above the calendar. Commit.

- [ ] **Step 5: Final commit + push**

```bash
git push origin main
```

Then connect the Netlify site, set env vars, and verify the deployed version.

---

## Notes for the implementer

- **Don't reach for `@netlify/blobs` outside `src/lib/episodes.ts` and the rate-limit code in `login.ts`.** Keeping the storage call site small means changing the backend later is a one-file edit.
- **Don't add CSRF tokens or HTTPS-redirect middleware.** Netlify handles HTTPS, SameSite=Strict cookies cover CSRF for our solo-admin model.
- **Don't sanitize HTML in title/summary on input.** We render them as plain text via Astro's `{}` interpolation, which escapes by default.
- **Don't add an i18n layer.** The site is Spanish only; the portfolio's i18n was explicitly removed in the design.
- **If a test starts to feel like "testing the framework," delete it.** We only test logic we wrote (seasons, validation, auth, numbering).
