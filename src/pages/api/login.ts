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
