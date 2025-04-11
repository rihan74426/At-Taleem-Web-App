// middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  const path = req.nextUrl.pathname;

  // 1) If this is one of our two SSLCommerz callbacks, skip Clerk entirely:
  if (path === "/api/orders/ssl-success" || path === "/api/orders/ssl-fail") {
    return;
  }

  // 2) Otherwise, if it's an /api route and the user isn't signed in, redirect:
  if (path.startsWith("/api/") && !userId) {
    return auth().redirectToSignIn();
  }

  // 3) All other routes fall through to Clerk's default behavior.
});

// Apply to all non-static and API paths
export const config = {
  matcher: [
    // everything except static files under _next, public, etc.
    "/((?!_next|_static|favicon.ico).*)",
  ],
};
