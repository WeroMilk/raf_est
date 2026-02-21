import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const LOGIN = "/login";

export async function middleware(request: NextRequest) {
  const cookieValue = request.cookies.get("raf_session")?.value ?? request.headers.get("cookie");
  let session = null;
  try {
    session = await getSession(cookieValue);
  } catch {
    session = null;
  }

  if (!session) {
    if (request.nextUrl.pathname === LOGIN) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session.tipo === "escuela" && session.cct) {
    const path = request.nextUrl.pathname;
    const match = path.match(/^\/escuela\/([^/]+)/);
    if (match && match[1] !== session.cct) {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
    if (path === "/" || path === "/escuelas") {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
  }

  if (request.nextUrl.pathname === LOGIN) {
    if (session.tipo === "escuela" && session.cct) {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|manifest|api|Logtipo_EscudoColor|data/).*)"],
};
