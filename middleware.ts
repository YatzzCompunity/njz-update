import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

/**
 * CSRF guard for cookie-authenticated API mutations.
 * Browsers always send an Origin header on cross-site POST/PATCH/DELETE;
 * same-origin requests (our frontend) pass. Requests without an Origin
 * header (Vercel Cron, server-to-server, curl) are allowed through —
 * sensitive ones carry their own secret (e.g. CRON_SECRET).
 */
function csrfCheck(req: NextRequest): NextResponse | null {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null;
  }
  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const rawHost =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const reqHost = rawHost.split(",")[0].trim().toLowerCase();
    if (!reqHost || originHost !== reqHost) {
      return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }
  return null;
}

export default withAuth(
  function middleware(req: NextRequest) {
    // Runs after the `authorized` check below.
    const csrf = csrfCheck(req);
    if (csrf) return csrf;
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // API routes enforce their own server-side authorization per endpoint;
        // the middleware only applies the CSRF check there.
        if (path.startsWith("/api/")) return true;
        // Admin area: ADMIN or MODERATOR only (role comes from JWT callback)
        if (path.startsWith("/admin")) {
          const role = (token as unknown as { role?: string } | null)?.role;
          return role === "ADMIN" || role === "MODERATOR";
        }
        // Everything else matched here just needs a signed-in user
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/bookmarks/:path*",
    "/notifications/:path*",
    "/api/:path*",
  ],
};
