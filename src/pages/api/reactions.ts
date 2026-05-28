import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { validateDate } from "@/lib/validation";
import { getReactions, toggleReaction, ALLOWED_EMOJI } from "@/lib/reactions";

function user(token: string | undefined): string | null {
  if (!token) return null;
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) return null;
  const payload = verifySession(token, secret);
  return payload?.email ?? null;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const email = user(cookies.get("pto_session")?.value);
  if (!email) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }
  const date = url.searchParams.get("date") ?? "";
  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  const reactions = await getReactions(date);
  return new Response(JSON.stringify({ reactions, me: email }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const email = user(cookies.get("pto_session")?.value);
  if (!email) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { date?: string; emoji?: string };
  const dateCheck = validateDate(body.date ?? "");
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  if (!body.emoji || !ALLOWED_EMOJI.includes(body.emoji as (typeof ALLOWED_EMOJI)[number])) {
    return new Response(JSON.stringify({ error: "Emoji no permitido" }), { status: 400 });
  }
  try {
    const reactions = await toggleReaction(body.date!, body.emoji, email);
    return new Response(JSON.stringify({ reactions, me: email }), { status: 200 });
  } catch (err) {
    console.error("toggleReaction failed:", err);
    return new Response(JSON.stringify({ error: "No se pudo guardar" }), { status: 500 });
  }
};
