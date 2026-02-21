import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-data";
import { createSessionCookie, getSessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

function normalizePassword(s: string): string {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function getPasswordFromRequest(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return request.formData().then((form) => {
      const p = form.get("password");
      return typeof p === "string" ? normalizePassword(p) : "";
    });
  }
  return request.json().then((body: { password?: string }) =>
    typeof body?.password === "string" ? normalizePassword(body.password) : ""
  );
}

function checkAuthSecret(): string | null {
  const s = (process.env.AUTH_SECRET ?? "").trim();
  if (s.length >= 16) return null;
  return "AUTH_SECRET";
}

export async function POST(request: Request) {
  try {
    const secretError = checkAuthSecret();
    if (secretError) {
      return NextResponse.redirect(
        new URL("/login?error=server&msg=auth_secret_required", request.url),
        302
      );
    }
    const password = await getPasswordFromRequest(request);
    if (!password) {
      return NextResponse.redirect(new URL("/login?error=empty", request.url), 302);
    }
    const session = verifyPassword(password);
    if (!session) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[login] Contraseña no coincide con superUsuario ni con ninguna escuela en auth-data.json");
      }
      return NextResponse.redirect(new URL("/login?error=invalid", request.url), 302);
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[login] OK tipo:", session.tipo, session.cct ?? "");
    }
    const value = await createSessionCookie(session);
    const url =
      session.tipo === "escuela" && session.cct
        ? new URL(`/escuela/${session.cct}`, request.url)
        : new URL("/", request.url);
    const res = NextResponse.redirect(url, 302);
    res.cookies.set(getSessionCookieName(), value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    console.error("Login error:", e);
    const isAuthSecret = message.includes("AUTH_SECRET");
    const msg =
      process.env.NODE_ENV === "development"
        ? message
        : isAuthSecret
          ? "auth_secret_required"
          : "error";
    return NextResponse.redirect(
      new URL(`/login?error=server&msg=${encodeURIComponent(msg)}`, request.url),
      302
    );
  }
}
