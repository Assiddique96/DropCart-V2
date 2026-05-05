/**
 * sanitize.js
 * Lightweight input sanitization helpers for API routes.
 * Strips dangerous characters and enforces length limits.
 */

/**
 * Sanitize a plain string field.
 * - Trims whitespace
 * - Strips HTML tags
 * - Enforces max length (default 1000 chars)
 */
export function sanitizeString(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .slice(0, maxLength);
}

/**
 * Sanitize simple rich text content for the product description.
 * Allows only a small set of safe tags and removes any tag attributes.
 */
export function sanitizeRichText(value, maxLength = 5000) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, maxLength);
  const allowedTags = ["b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "br"];
  return trimmed.replace(/<\s*\/\s*([a-zA-Z0-9]+)\s*>|<\s*([a-zA-Z0-9]+)(?:\s+[^>]*?)?\s*>/g, (match, closeTag, openTag) => {
    const tag = (closeTag || openTag || "").toLowerCase();
    if (!allowedTags.includes(tag)) return "";
    return closeTag ? `</${tag}>` : `<${tag}>`;
  });
}

/**
 * Sanitize a numeric field. Returns NaN if invalid.
 */
export function sanitizeNumber(value) {
  const num = Number(value);
  return isNaN(num) ? NaN : num;
}

/**
 * Sanitize an email address.
 */
export function sanitizeEmail(value) {
  const str = sanitizeString(value, 254);
  // Basic email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str) ? str : null;
}

/**
 * Sanitize a phone number — digits, spaces, +, -, () only.
 */
export function sanitizePhone(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d\s+\-()]/g, "").trim().slice(0, 20);
}

/**
 * Sanitize a URL slug / username.
 * Allows only lowercase alphanumeric characters and hyphens.
 */
export function sanitizeSlug(value) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

/**
 * Sanitize a product/store object coming from a form or API body.
 * Returns a cleaned object and an array of validation errors.
 */
export function sanitizeProductInput({ name, description, mrp, price, category, sku, tags, scheduledAt, origin, acceptCod, madeIn, manufacturer, material, guaranteePeriod }) {
  const errors = [];

  const cleanName = sanitizeString(name, 200);
  if (!cleanName) errors.push("Product name is required.");

  const cleanDescription = sanitizeRichText(description, 5000);
  if (!cleanDescription) errors.push("Description is required.");

  const cleanMrp = sanitizeNumber(mrp);
  if (isNaN(cleanMrp) || cleanMrp <= 0) errors.push("MRP must be a positive number.");

  const cleanPrice = sanitizeNumber(price);
  if (isNaN(cleanPrice) || cleanPrice <= 0) errors.push("Price must be a positive number.");
  if (!isNaN(cleanPrice) && !isNaN(cleanMrp) && cleanPrice > cleanMrp)
    errors.push("Price cannot be greater than MRP.");

  const cleanCategory = sanitizeString(category, 100);
  if (!cleanCategory) errors.push("Category is required.");

  // Optional fields
  const cleanSku = sku ? sanitizeString(sku, 100) : null;

  // Tags: accept array or comma-separated string
  let cleanTags = [];
  if (Array.isArray(tags)) {
    cleanTags = tags.map(t => sanitizeString(t, 50)).filter(Boolean).slice(0, 10);
  } else if (typeof tags === 'string' && tags.trim()) {
    cleanTags = tags.split(',').map(t => sanitizeString(t.trim(), 50)).filter(Boolean).slice(0, 10);
  }

  // Scheduled publish date
  let cleanScheduledAt = null;
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    cleanScheduledAt = isNaN(d.getTime()) ? null : d;
  }

  // Origin: LOCAL or ABROAD
  const cleanOrigin = origin === 'ABROAD' ? 'ABROAD' : 'LOCAL';
  const cleanMadeIn = madeIn ? sanitizeString(madeIn, 80) : null;
  const cleanManufacturer = manufacturer ? sanitizeString(manufacturer, 100) : null;
  const cleanMaterial = material ? sanitizeString(material, 100) : null;
  const cleanGuaranteePeriod = guaranteePeriod ? sanitizeString(guaranteePeriod, 80) : null;

  const codOptOut = ['false', '0', 'no', 'off'].includes(String(acceptCod ?? 'true').trim().toLowerCase());
  const cleanAcceptCod = cleanOrigin === 'LOCAL' ? !codOptOut : false;

  return {
    data: {
      name: cleanName,
      description: cleanDescription,
      mrp: cleanMrp,
      price: cleanPrice,
      category: cleanCategory,
      sku: cleanSku,
      tags: cleanTags,
      scheduledAt: cleanScheduledAt,
      origin: cleanOrigin,
      madeIn: cleanMadeIn,
      manufacturer: cleanManufacturer,
      material: cleanMaterial,
      guaranteePeriod: cleanGuaranteePeriod,
      acceptCod: cleanAcceptCod,
    },
    errors,
  };
}

/**
 * Sanitize store creation input.
 */
export function sanitizeStoreInput({ name, username, description, email, contact, address }) {
  const errors = [];

  const cleanName = sanitizeString(name, 100);
  if (!cleanName) errors.push("Store name is required.");

  const cleanUsername = sanitizeSlug(username);
  if (!cleanUsername) errors.push("Username is required and must contain only letters, numbers, or hyphens.");

  const cleanDescription = sanitizeString(description, 2000);
  if (!cleanDescription) errors.push("Description is required.");

  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) errors.push("A valid email address is required.");

  const cleanContact = sanitizePhone(contact);
  if (!cleanContact) errors.push("A valid contact number is required.");

  const cleanAddress = sanitizeString(address, 500);
  if (!cleanAddress) errors.push("Address is required.");

  return {
    data: {
      name: cleanName,
      username: cleanUsername,
      description: cleanDescription,
      email: cleanEmail,
      contact: cleanContact,
      address: cleanAddress,
    },
    errors,
  };
}
