import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // withAuth handles the redirect; this runs after authorization.
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
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
  matcher: ["/admin/:path*", "/profile/:path*", "/bookmarks/:path*", "/notifications/:path*"],
};
