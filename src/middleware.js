import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect specific routes (e.g., dashboard, API routes)
const isProtectedRoute = createRouteMatcher([""]);

export default clerkMiddleware((auth, req) => {
  const { userId, redirectToSignIn } = auth();

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
