/**
 * subdomain.js
 *
 * Centralized helpers for Shpinx's store-subdomain feature
 * (e.g. `adaelectronics.dropcart.ng`).
 *
 * Design notes:
 * - Subdomains are a BRANDING/BROWSING layer only — one Next.js deployment,
 *   one database, one session. A seller's `Store.username` doubles as their
 *   subdomain label; there is no separate column to keep in sync.
 * - Cart, checkout, orders, auth, and the seller/admin dashboards always
 *   resolve on the main (root) domain. This keeps a single shared cart that
 *   can hold items from multiple sellers, and avoids duplicating
 *   auth/session concerns per-subdomain.
 * - Product pages, static/info pages, and the store's own storefront page
 *   are allowed to render directly on the subdomain.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dropcart.ng";

/** The bare apex domain, e.g. "dropcart.ng" (derived from NEXT_PUBLIC_APP_URL). */
export const ROOT_DOMAIN = (() => {
  try {
    return new URL(APP_URL).hostname.replace(/^www\./, "");
  } catch {
    return "dropcart.ng";
  }
})();

/**
 * Subdomain labels that must NEVER be treated as a store storefront —
 * either because they're used for platform infrastructure, or because
 * they'd be confusing/spoofable if a seller claimed them.
 * Keep this in sync with the reserved-username check in lib/sanitize.js.
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "store", "stores", "seller", "sellers",
  "mail", "smtp", "ftp", "cdn", "static", "assets", "img", "images",
  "dashboard", "support", "help", "docs", "blog", "status", "dev",
  "staging", "test", "shop", "checkout", "cart", "pay", "payments",
  "webhook", "webhooks", "clerk", "auth", "accounts", "account",
  "track", "wishlist", "orders", "sign-in", "sign-up", "create-store",
]);

/**
 * Extract the subdomain label from a request Host header.
 * Returns null for the root/apex domain, unrecognized domains
 * (e.g. Vercel preview URLs), or multi-level subdomains.
 */
export function getSubdomainFromHost(host) {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();

  // Local dev convenience: "storename.localhost:3000"
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return sub && sub !== "localhost" ? sub : null;
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const sub = hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!sub || sub.includes(".")) return null; // only single-level subdomains
  return sub;
}

/** Whether a subdomain label could be a legitimate store storefront. */
export function isStoreSubdomain(subdomain) {
  return Boolean(subdomain) && !RESERVED_SUBDOMAINS.has(subdomain);
}

/**
 * Path prefixes that must always resolve on the ROOT domain, even when the
 * visitor arrived via a store subdomain. Matched against the pathname only.
 */
export const MAIN_DOMAIN_ONLY_PREFIXES = [
  "/cart",
  "/wishlist",
  "/orders",
  "/track",
  "/store",       // seller dashboard
  "/admin",       // admin dashboard
  "/sign-in",
  "/sign-up",
  "/create-store",
  "/shop",        // cross-store browsing/search/filtering
];

export function isMainDomainOnlyPath(pathname) {
  return MAIN_DOMAIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Build an absolute https URL on the root domain for the given path. */
export function buildRootDomainUrl(pathname = "/", search = "") {
  const cleanSearch = search && !search.startsWith("?") ? `?${search}` : search;
  return `https://${ROOT_DOMAIN}${pathname}${cleanSearch || ""}`;
}

/**
 * Client-side helper for components (e.g. Navbar) that link to
 * cart/checkout/auth/dashboard routes. Returns the path unchanged when
 * already on the main domain (including during SSR), or an absolute
 * root-domain URL when the current page is a store subdomain.
 */
export function rootHref(path) {
  if (typeof window === "undefined") return path;
  const sub = getSubdomainFromHost(window.location.host);
  if (!isStoreSubdomain(sub)) return path;
  return buildRootDomainUrl(path);
}
