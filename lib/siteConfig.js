import { sanitizeString } from "@/lib/sanitize";

export const SITE_CATEGORIES_CONFIG_KEY = "site_categories";
export const SITE_FAQ_CONFIG_KEY = "site_faq_items";
export const SITE_PRIVACY_CONFIG_KEY = "site_privacy_policy";
export const SITE_TERMS_CONFIG_KEY = "site_terms_of_use";
export const SITE_COOKIES_CONFIG_KEY = "site_cookies_policy";

export const DEFAULT_CATEGORIES = [
  { name: 'Electronics', subcategories: [] },
  { name: 'Clothing', subcategories: [] },
  { name: 'Home & Garden', subcategories: [] },
  { name: 'Beauty & Health', subcategories: [] },
  { name: 'Toys & Games', subcategories: [] },
  { name: 'Sports & Outdoors', subcategories: [] },
  { name: 'Books & Media', subcategories: [] },
  { name: 'Food & Beverage', subcategories: [] },
  { name: 'Hobbies & Crafts', subcategories: [] },
  { name: 'Automotive', subcategories: [] },
  { name: 'Baby & Kids', subcategories: [] },
  { name: 'Pet Supplies', subcategories: [] },
  { name: 'Office Supplies', subcategories: [] },
  { name: 'Industrial & Scientific', subcategories: [] },
  { name: 'Accessories', subcategories: [] },
  { name: 'Smartphones', subcategories: [] },
  { name: 'Laptops', subcategories: [] },
  { name: 'Solars', subcategories: [] },
  { name: 'Others', subcategories: [] },
];

export function parseStoredCategories(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_CATEGORIES;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;

    return parsed
      .slice(0, 50)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const name = sanitizeString(item.name || "", 100);
        if (!name) return null;
        const subcategories = Array.isArray(item.subcategories)
          ? item.subcategories
              .map((sub) => sanitizeString(sub || "", 80))
              .filter(Boolean)
              .slice(0, 50)
          : [];
        return { name, subcategories };
      })
      .filter(Boolean);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function parseStoredFaq(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 50)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const question = sanitizeString(item.question || item.q || "", 500);
        const answer = sanitizeString(item.answer || item.a || "", 5000);
        if (!question || !answer) return null;
        return { question, answer };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseStoredText(raw) {
  return typeof raw === "string" ? raw.trim() : "";
}

export function normalizeAdminContentBody(body) {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const categoriesIn = Array.isArray(body.categories) ? body.categories : null;
  const faqItemsIn = Array.isArray(body.faqItems) ? body.faqItems : null;
  const privacyPolicy = sanitizeString(body.privacyPolicy || "", 15000);
  const termsOfUse = sanitizeString(body.termsOfUse || "", 15000);
  const cookiesPolicy = sanitizeString(body.cookiesPolicy || "", 15000);

  const payload = {};

  if (categoriesIn !== null) {
    const categories = categoriesIn
      .slice(0, 50)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const name = sanitizeString(item.name || "", 100);
        if (!name) return null;
        const subcategories = Array.isArray(item.subcategories)
          ? item.subcategories
              .slice(0, 50)
              .map((sub) => sanitizeString(sub || "", 80))
              .filter(Boolean)
          : [];
        return { name, subcategories };
      })
      .filter(Boolean);

    payload.categoriesJson = JSON.stringify(categories);
  }

  if (faqItemsIn !== null) {
    const faqItems = faqItemsIn
      .slice(0, 50)
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const question = sanitizeString(item.question || item.q || "", 500);
        const answer = sanitizeString(item.answer || item.a || "", 5000);
        if (!question || !answer) return null;
        return { question, answer };
      })
      .filter(Boolean);

    payload.faqJson = JSON.stringify(faqItems);
  }

  if (Object.prototype.hasOwnProperty.call(body, "privacyPolicy")) {
    payload.privacyPolicy = privacyPolicy;
  }
  if (Object.prototype.hasOwnProperty.call(body, "termsOfUse")) {
    payload.termsOfUse = termsOfUse;
  }
  if (Object.prototype.hasOwnProperty.call(body, "cookiesPolicy")) {
    payload.cookiesPolicy = cookiesPolicy;
  }

  return payload;
}
