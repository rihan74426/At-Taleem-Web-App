import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/api/orders/ssl-success",
  "/api/orders/ssl-fail",
  "/api/orders/ssl-cancel",
  "/api/orders/ssl-ipn",
];

// Protect specific routes (e.g., dashboard, API routes)
const isProtectedRoute = createRouteMatcher([""]);

export default clerkMiddleware((auth, req) => {
  const { userId, redirectToSignIn } = auth();
  const path = req.nextUrl.pathname;

  // Allow public routes to bypass authentication
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return;
  }

  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
