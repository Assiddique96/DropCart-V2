import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getSubdomainFromHost,
  isStoreSubdomain,
  isMainDomainOnlyPath,
  buildRootDomainUrl,
} from "@/lib/subdomain";

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

function withSecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomainFromHost(host);
  const { pathname, search } = request.nextUrl;

  if (isStoreSubdomain(subdomain)) {
    // Cart, checkout, orders, auth, and dashboards always live on the main
    // domain — a buyer's cart can span multiple sellers, so it can't be
    // scoped to one store's subdomain. Redirect out to the root domain.
    if (isMainDomainOnlyPath(pathname)) {
      return NextResponse.redirect(buildRootDomainUrl(pathname, search), 307);
    }

    // Root of a store subdomain -> that store's existing storefront page.
    // (Everything else — /product/:id, /about, /faq, etc. — is rendered
    // as-is; it's identical content regardless of which host served it.)
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/shop/${subdomain}`;
      return withSecurityHeaders(NextResponse.rewrite(url));
    }
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Attach security headers to every response
  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static asset files
    "/((?!_next|[^?]*\\.[\\w]+).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};