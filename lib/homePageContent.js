/**
 * Home page hero slides — stored as JSON in PlatformConfig.home_page_content
 */

import { sanitizeString } from "@/lib/sanitize";

export const HOME_PAGE_CONFIG_KEY = "home_page_content";
export const MAX_SLIDES_PER_SECTION = 8;

/** @param {unknown} url */
export function validateHttpsImageUrl(url) {
  if (typeof url !== "string") return null;
  const t = url.trim();
  if (!t.startsWith("https://") || t.length > 2000) return null;
  return t;
}

function sanitizeHref(h) {
  const s = sanitizeString(h || "", 500);
  if (!s) return "/shop";
  if (s.startsWith("/")) return s.split("?")[0].slice(0, 500) || "/shop";
  if (s.startsWith("https://")) return s.slice(0, 2000);
  return "/shop";
}

/**
 * @param {unknown} raw
 * @returns {{ featured: object[], promo1: object[], promo2: object[] }}
 */
export function parseStoredHomePageContent(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { featured: [], promo1: [], promo2: [] };
  }
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return { featured: [], promo1: [], promo2: [] };
    return {
      featured: Array.isArray(o.featured) ? o.featured : [],
      promo1: Array.isArray(o.promo1) ? o.promo1 : [],
      promo2: Array.isArray(o.promo2) ? o.promo2 : [],
    };
  } catch {
    return { featured: [], promo1: [], promo2: [] };
  }
}

function normalizeFeaturedSlide(s) {
  if (!s || typeof s !== "object") return null;
  const image = validateHttpsImageUrl(s.image);
  if (!image) return null;
  return {
    image,
    badgeLabel: sanitizeString(s.badgeLabel ?? "", 80),
    badgeText: sanitizeString(s.badgeText ?? "", 300),
    title: sanitizeString(s.title ?? "", 200),
    line1: sanitizeString(s.line1 ?? "", 300),
    line2: sanitizeString(s.line2 ?? "", 300),
    priceLabel: sanitizeString(s.priceLabel ?? "", 80),
    price: sanitizeString(s.price ?? "", 80),
    cta: sanitizeString(s.cta ?? "", 80),
    href: sanitizeHref(s.href),
  };
}

function normalizePromoSlide(s) {
  if (!s || typeof s !== "object") return null;
  const image = validateHttpsImageUrl(s.image);
  if (!image) return null;
  const variantRaw = sanitizeString(s.variant ?? "", 20).toLowerCase();
  const variant = ["light", "medium", "dark"].includes(variantRaw) ? variantRaw : "light";
  return {
    image,
    title: sanitizeString(s.title ?? "", 120),
    subtitle: sanitizeString(s.subtitle ?? "", 120),
    href: sanitizeHref(s.href),
    variant,
  };
}

/**
 * Validate admin PUT body; returns normalized payload or { error: string }.
 * @param {unknown} body
 */
export function normalizeHomePagePutBody(body) {
  if (!body || typeof body !== "object") {
    return { error: "Invalid body" };
  }

  const featuredIn = Array.isArray(body.featured) ? body.featured : [];
  const promo1In = Array.isArray(body.promo1) ? body.promo1 : [];
  const promo2In = Array.isArray(body.promo2) ? body.promo2 : [];

  if (
    featuredIn.length > MAX_SLIDES_PER_SECTION ||
    promo1In.length > MAX_SLIDES_PER_SECTION ||
    promo2In.length > MAX_SLIDES_PER_SECTION
  ) {
    return { error: `At most ${MAX_SLIDES_PER_SECTION} slides per section.` };
  }

  const featured = [];
  for (const s of featuredIn) {
    const n = normalizeFeaturedSlide(s);
    if (n) featured.push(n);
    else if (s && typeof s === "object" && s.image) {
      return { error: "Each featured slide needs a valid https:// image URL." };
    }
  }

  const promo1 = [];
  for (const s of promo1In) {
    const n = normalizePromoSlide(s);
    if (n) promo1.push(n);
    else if (s && typeof s === "object" && s.image) {
      return { error: "Each promo slide needs a valid https:// image URL." };
    }
  }

  const promo2 = [];
  for (const s of promo2In) {
    const n = normalizePromoSlide(s);
    if (n) promo2.push(n);
    else if (s && typeof s === "object" && s.image) {
      return { error: "Each promo slide needs a valid https:// image URL." };
    }
  }

  return {
    payload: {
      featured,
      promo1,
      promo2,
    },
    json: JSON.stringify({ featured, promo1, promo2 }),
  };
}
