import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes do not require user authentication
const isPublicRoute = createRouteMatcher([
  '/api/paystack/webhook',
  '/api/store/data(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  // If the incoming request is NOT a public route, protect it
  if (!isPublicRoute(request)) {
    // Pass the request object to protect() or await it natively
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

