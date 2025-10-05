import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Token is validated by withAuth - if we reach here, user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // User must have a valid token to access protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

// CRITICAL: Protect all routes in the (main) group
// /vault, /dashboard, /generator must be protected
export const config = {
  matcher: [
    "/vault/:path*",      // CRITICAL: Now protected
    "/dashboard/:path*",
    "/generator/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
