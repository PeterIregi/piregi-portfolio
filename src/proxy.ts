import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The auth pages have to be reachable without a session, since reaching
// one is the point. Anything else under /admin redirects here. UX only:
// requireAdmin() in each action/handler is the boundary (design.md §4).
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

export async function proxy(req: NextRequest) {
  const session = await auth();
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !PUBLIC_ADMIN_PATHS.has(req.nextUrl.pathname)) {
    if (!session?.user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};