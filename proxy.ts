import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Route matchers for public endpoints
 */
const isPublicRoute = createRouteMatcher([
  // Marketing & Public Pages
  "/",
  "/about(.*)",
  "/app(.*)",
  "/cart(.*)",
  "/contact(.*)",
  "/cookies(.*)",
  "/faq(.*)",
  "/loading(.*)",
  "/pricing(.*)",
  "/privacy(.*)",
  "/product(.*)",
  "/shop(.*)",
  "/terms(.*)",
  "/track(.*)",
  "/wholesale(.*)",
  "/wishlist(.*)",

  // Auth Pages
  "/sign-in(.*)",
  "/sign-up(.*)",

  // Public API Routes
  "/api/brands(.*)",
  "/api/categories(.*)",
  "/api/config(.*)",
  "/api/contact(.*)",
  "/api/coupon(.*)",
  "/api/home(.*)",
  "/api/inngest(.*)",
  "/api/platform/categories(.*)",
  "/api/products(.*)",
  "/api/rating(.*)",
  "/api/recommendations(.*)",
  "/api/search-by-image(.*)",
  "/api/search(.*)",
  "/api/store/data(.*)",
  "/api/store/products(.*)",
  "/api/track(.*)",
  "/api/trpc(.*)",
  "/api/verified-stores(.*)",

  // Payment APIs & Webhooks
  "/api/flutterwave(.*)",
  "/api/lemonsqueezy(.*)",
  "/api/paystack(.*)",
  "/api/stripe(.*)",
]);

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default clerkMiddleware(async (auth, request) => {
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Attach security headers to every response
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static asset files
    "/((?!_next|[^?]*\\.[\\w]+).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};