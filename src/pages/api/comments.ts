import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { validateDate } from "@/lib/validation";
import { listComments, addComment, deleteComment } from "@/lib/comments";

function user(token: string | undefined): string | null {
  if (!token) return null;
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) return null;
  const payload = verifySession(token, secret);
  return payload?.email ?? null;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const email = user(cookies.get("pto_session")?.value);
  if (!email) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  const date = url.searchParams.get("date") ?? "";
  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  const comments = await listComments(date);
  return new Response(JSON.stringify({ comments, me: email }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const email = user(cookies.get("pto_session")?.value);
  if (!email) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { date?: string; text?: string };
  const dateCheck = validateDate(body.date ?? "");
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  if (!body.text?.trim()) return new Response(JSON.stringify({ error: "Comentario vacío" }), { status: 400 });
  try {
    const comments = await addComment(body.date!, email, body.text);
    return new Response(JSON.stringify({ comments, me: email }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "No se pudo guardar";
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ url, cookies }) => {
  const email = user(cookies.get("pto_session")?.value);
  if (!email) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  const date = url.searchParams.get("date") ?? "";
  const id = url.searchParams.get("id") ?? "";
  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return new Response(JSON.stringify(dateCheck), { status: 400 });
  if (!id) return new Response(JSON.stringify({ error: "Falta id" }), { status: 400 });
  try {
    const comments = await deleteComment(date, id, email);
    return new Response(JSON.stringify({ comments, me: email }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "No se pudo borrar";
    return new Response(JSON.stringify({ error: msg }), { status: 403 });
  }
};
