import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Primera barrera de acceso; cada página del panel vuelve a validar el rol en el servidor.
export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  const needsStaff = pathname.startsWith("/admin");
  if (!session || (needsStaff && session.role === "CUSTOMER")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/cuenta/:path*", "/vender/panel/:path*", "/vender/alta"] };
