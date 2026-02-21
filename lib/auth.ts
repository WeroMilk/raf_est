const COOKIE_NAME = "raf_session";
const EXPIRES_DAYS = 30;

export type Session = { tipo: "super" | "escuela"; cct?: string };

function getSecret(): string {
  const s = (process.env.AUTH_SECRET ?? "").trim();
  if (s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "raf-dev-secret-min-16-chars";
  }
  throw new Error("Configura AUTH_SECRET (mínimo 16 caracteres) en Variables de entorno de Vercel.");
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const sigBin = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBin,
    new TextEncoder().encode(message)
  );
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export async function createSessionCookie(session: Session): Promise<string> {
  const exp = Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({
    t: session.tipo,
    cct: session.cct ?? null,
    exp,
  });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  const sig = await hmacSign(encoded, getSecret());
  return `${encoded}.${sig}`;
}

export async function getSessionFromCookie(cookieHeader: string | null): Promise<Session | null> {
  if (!cookieHeader) return null;
  try {
    const secret = getSecret();
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const value = match?.[1]?.trim();
    if (!value) return null;
    const [encoded, sig] = value.split(".");
    if (!encoded || !sig) return null;
    if (!(await hmacVerify(encoded, sig, secret))) return null;
    const payload = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(payload) as { t: string; cct: string | null; exp: number };
    if (data.exp < Date.now()) return null;
    if (data.t !== "super" && data.t !== "escuela") return null;
    return {
      tipo: data.t,
      cct: data.cct ?? undefined,
    };
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1]?.trim() ?? null;
}

export async function getSession(cookieHeaderOrValue: string | null): Promise<Session | null> {
  if (!cookieHeaderOrValue) return null;
  const isFullHeader = cookieHeaderOrValue.includes("=") && !cookieHeaderOrValue.startsWith(".");
  const header = isFullHeader ? cookieHeaderOrValue : `${COOKIE_NAME}=${cookieHeaderOrValue}`;
  return getSessionFromCookie(header);
}
