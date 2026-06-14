import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "eventhub-dev-jwt-secret-change-in-production";

function verifyTokenEdge(token: string): { userId: string; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!payload.userId || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Admin routes: require valid token with ADMIN or ORGANIZER role
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const payload = verifyTokenEdge(token);
    if (!payload || (payload.role !== "ADMIN" && payload.role !== "ORGANIZER")) {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.set("token", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  // Protected user pages: require valid token
  if (pathname.startsWith("/orders") || pathname.startsWith("/tickets")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const payload = verifyTokenEdge(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.set("token", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/orders/:path*", "/tickets/:path*"],
};
