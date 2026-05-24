import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define ONLY the pages that any random guest visitor can see
const isPublicRoute = createRouteMatcher([
  '/',                     // Main landing page
  '/about(.*)',            // About page
  '/cart(.*)',             // Shopping cart (accessible to guests)
  '/wishlist(.*)',         // Wishlist page (accessible to guests)
  '/contact(.*)',          // Contact page
  '/cookies(.*)',          // Cookies policy
  '/faq(.*)',              // FAQ page
  '/pricing(.*)',          // Pricing page
  '/privacy(.*)',          // Privacy policy
  '/product(.*)',          // Viewing products
  '/shop(.*)',             // Browsing the shop marketplace
  '/terms(.*)',            // Terms of service
  '/track(.*)',            // Order tracking page
  '/api/paystack/webhook', // Paystack payment processor webhook
  '/api/store/data(.*)',   // Store profile dynamic data API
  '/api/store/products(.*)', // Store products API
  '/api/inngest(.*)',          // Inngest API routes (for event handling, etc.)
  '/api/trpc(.*)',            // tRPC API routes (for client-server communication)
]);

export default clerkMiddleware(async (auth, request) => {
  // Accessing /create-store or /orders will still force a login/signup
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static asset files
    '/((?!_next|[^?]*\\.[\\w]+).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};