/**
 * Next.js proxy handler – protects dashboard and API routes.
 * Unauthenticated requests are redirected to /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = Boolean(token);
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnApi = req.nextUrl.pathname.startsWith("/api") &&
    !req.nextUrl.pathname.startsWith("/api/auth") &&
    !req.nextUrl.pathname.startsWith("/api/register");

  if ((isOnDashboard || isOnApi) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create/:path*",
    "/upload/:path*",
    "/settings/:path*",
    "/api/projects/:path*",
    "/api/dashboard/:path*",
    "/api/entities/:path*",
    "/api/metrics/:path*",
    "/api/insights/:path*",
    "/api/upload-csv/:path*",
    "/api/layout/:path*",
  ],
};