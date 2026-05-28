import type { APIRoute } from "astro";
import { verifySession, isAdminEmail } from "@/lib/auth";
import { validateTitle, validateSummary, validateDate } from "@/lib/validation";
import { putEpisode, getEpisode } from "@/lib/episodes";

function requireAdmin(token: string | undefined): boolean {
  if (!token) return false;
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) return false;
  const payload = verifySession(token, secret);
  return isAdminEmail(payload?.email, import.meta.env.ADMIN_EMAILS);
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
  if (!requireAdmin(token)) {
    return new Response(JSON.stringify({ error: "Sólo admins" }), { status: 403 });
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
