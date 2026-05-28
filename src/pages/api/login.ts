import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";
import { getStore } from "@netlify/blobs";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type RateRecord = { count: number; firstAt: number };

function rateKey(ip: string): string {
  return `login/${ip}`;
}

function isMissingBlobsEnv(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("environment has not been configured to use Netlify Blobs");
}

async function checkRateLimit(ip: string): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    const store = getStore("rate-limit");
    const rec = (await store.get(rateKey(ip), { type: "json" })) as RateRecord | null;
    if (!rec) return { ok: true };
    const now = Date.now();
    if (now - rec.firstAt > RATE_LIMIT_WINDOW_MS) return { ok: true };
    if (rec.count >= RATE_LIMIT_MAX) {
      return { ok: false, retryAfterSec: Math.ceil((rec.firstAt + RATE_LIMIT_WINDOW_MS - now) / 1000) };
    }
    return { ok: true };
  } catch (err) {
    if (isMissingBlobsEnv(err)) return { ok: true }; // skip rate limit in local dev w/o Blobs
    throw err;
  }
}

async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    const store = getStore("rate-limit");
    const key = rateKey(ip);
    const rec = (await store.get(key, { type: "json" })) as RateRecord | null;
    const now = Date.now();
    if (!rec || now - rec.firstAt > RATE_LIMIT_WINDOW_MS) {
      await store.setJSON(key, { count: 1, firstAt: now });
    } else {
      await store.setJSON(key, { count: rec.count + 1, firstAt: rec.firstAt });
    }
  } catch (err) {
    if (isMissingBlobsEnv(err)) return; // no-op in local dev w/o Blobs
    throw err;
  }
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
    await recordFailedAttempt(ip);
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
