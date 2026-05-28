import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STATE_COOKIE = "pto_oauth_state";

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type TokenInfo = {
  email?: string;
  email_verified?: string | boolean;
  aud?: string;
  error?: string;
};

function htmlError(msg: string, status: number): Response {
  const body = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Error</title></head><body style="font-family:system-ui;padding:2rem"><h1>No se pudo iniciar sesión</h1><p>${msg}</p><p><a href="/admin">Volver</a></p></body></html>`;
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
  const allowed = import.meta.env.ALLOWED_EMAIL;
  const sessionSecret = import.meta.env.SESSION_SECRET;
  if (!clientId || !clientSecret || !allowed || !sessionSecret) {
    return htmlError("Servidor mal configurado (faltan variables de entorno).", 500);
  }

  const code = url.searchParams.get("code");
  const stateFromUrl = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return htmlError(`Google devolvió un error: ${oauthError}`, 400);
  if (!code || !stateFromUrl) return htmlError("Faltan parámetros en el callback.", 400);

  const stateCookie = cookies.get(STATE_COOKIE)?.value;
  cookies.delete(STATE_COOKIE, { path: "/" });
  if (!stateCookie || stateCookie !== stateFromUrl) {
    return htmlError("El parámetro state no coincide. Vuelve a intentarlo.", 400);
  }

  // Exchange code for tokens.
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await tokenResp.json().catch(() => ({}))) as TokenResponse;
  if (!tokenResp.ok || !tokens.id_token) {
    return htmlError(`No se pudo canjear el código (${tokens.error ?? "sin detalle"}).`, 502);
  }

  // Verify the ID token by hitting Google's tokeninfo endpoint (cheap + sufficient for our use).
  const infoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  const info = (await infoResp.json().catch(() => ({}))) as TokenInfo;
  if (!infoResp.ok || info.error) {
    return htmlError("No se pudo verificar el token de Google.", 502);
  }
  if (info.aud !== clientId) {
    return htmlError("El token no pertenece a esta aplicación.", 400);
  }
  if (info.email_verified !== "true" && info.email_verified !== true) {
    return htmlError("Tu email no está verificado en Google.", 403);
  }
  if (!info.email || info.email.toLowerCase() !== allowed.toLowerCase()) {
    return htmlError(`Acceso denegado para ${info.email ?? "ese email"}.`, 403);
  }

  // All checks passed — issue our session cookie.
  const sessionToken = signSession({ exp: Date.now() + SESSION_TTL_MS }, sessionSecret);
  cookies.set("pto_session", sessionToken, {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return redirect("/admin", 302);
};
