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
  '/app(.*)',              // Main app page (will show login/signup for guests)
  '/api/products(.*)',     // Public products API used by home/product pages
  '/api/categories(.*)',   // Public categories API used by home/product pages
  '/api/brands(.*)',       // Public brands API used by home/product pages
  '/api/home/content(.*)', // Hero / home page content
  '/api/contact(.*)',      // Public contact form submission
  '/api/track(.*)',        // Public order tracking API
  '/api/search-by-image(.*)', // Public image search API used by navbar
  '/api/config(.*)',       // Public checkout / cart configuration
  '/api/coupon(.*)',       // Public coupon validation API
  '/api/paystack(.*)',     // Public Paystack payment API + webhooks
  '/api/flutterwave(.*)',  // Public Flutterwave payment API + verification
  '/api/stripe(.*)',       // Public Stripe payment API + webhooks
  '/api/lemonsqueezy(.*)', // Public LemonSqueezy payment API + webhooks
  '/api/store/data(.*)',   // Store profile dynamic data API
  '/api/store/products(.*)', // Store products API
  '/api/inngest(.*)',          // Inngest API routes (for event handling, etc.)
  '/api/trpc(.*)',            // tRPC API routes (for client-server communication)
  '/api/flutterwave/webhook(.*)', // Flutterwave payment processor webhook
  '/product/(.*)',          // Product listing and details pages

  

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