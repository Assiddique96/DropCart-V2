import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString, sanitizeNumber } from "@/lib/sanitize";

/**
 * POST /api/store/product/bulk-import
 * Body: multipart/form-data with a single "csv" File field.
 *
 * Expected CSV columns (header row required):
 *   name, description, mrp, price, category, quantity, sku, tags, image_url
 *
 * - All rows are validated before any DB writes.
 * - image_url must be a valid https:// URL (no upload — seller provides CDN/hosted URLs).
 * - Returns { imported, skipped, errors[] }.
 * - Max 200 rows per import.
 */

const REQUIRED_COLS  = ["name", "description", "mrp", "price", "category"];
const OPTIONAL_COLS  = ["quantity", "sku", "tags", "image_url", "origin", "accept_cod", "manufacturer"];
const MAX_ROWS       = 200;

const VALID_CATEGORIES = [
  "Electronics", "Clothing", "Home & Garden", "Beauty & Health",
  "Toys & Games", "Sports & Outdoors", "Books & Media", "Food & Beverage",
  "Hobbies & Crafts", "Automotive", "Baby & Kids", "Pet Supplies",
  "Office Supplies", "Industrial & Scientific", "Others",
];

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line, i) => {
    // Handle quoted fields with commas
    const cols = [];
    let cur = "", inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);

    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx]?.trim() ?? ""; });
    row.__line = i + 2; // 1-indexed, skip header
    return row;
  });
}

export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData();
    const csvFile = formData.get("csv");
    if (!csvFile || !(csvFile instanceof File)) {
      return NextResponse.json({ error: "A CSV file is required." }, { status: 400 });
    }

    const text = await csvFile.text();
    const rows = parseCSV(text);

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Max ${MAX_ROWS} rows per import. Your file has ${rows.length}.` }, { status: 400 });
    }

    // Validate all rows first
    const validRows = [];
    const errors = [];

    for (const row of rows) {
      const line = row.__line;
      const rowErrors = [];

      const name = sanitizeString(row.name, 200);
      if (!name) rowErrors.push("name is required");

      const description = sanitizeString(row.description, 5000);
      if (!description) rowErrors.push("description is required");

      const mrp = sanitizeNumber(row.mrp);
      if (isNaN(mrp) || mrp <= 0) rowErrors.push("mrp must be a positive number");

      const price = sanitizeNumber(row.price);
      if (isNaN(price) || price <= 0) rowErrors.push("price must be a positive number");
      if (!isNaN(price) && !isNaN(mrp) && price > mrp) rowErrors.push("price cannot exceed mrp");

      const category = sanitizeString(row.category, 100);
      if (!category) rowErrors.push("category is required");
      if (category && !VALID_CATEGORIES.includes(category)) {
        rowErrors.push(`category "${category}" is not valid. Use one of: ${VALID_CATEGORIES.join(", ")}`);
      }

      const quantity = row.quantity ? Math.max(0, parseInt(row.quantity, 10)) : 0;
      const sku = row.sku ? sanitizeString(row.sku, 100) : null;
      const origin = row.origin?.toUpperCase() === 'ABROAD' ? 'ABROAD' : 'LOCAL';
      const codRaw = row.accept_cod?.trim().toLowerCase();
      const acceptCod =
        origin === 'LOCAL' ? !['false', '0', 'no', 'off'].includes(codRaw || 'true') : false;

      const tags = row.tags
        ? row.tags.split("|").map(t => sanitizeString(t.trim(), 50)).filter(Boolean).slice(0, 10)
        : [];

      // image_url: must be https if provided
      let images = [];
      if (row.image_url) {
        const urls = row.image_url.split("|").map(u => u.trim()).filter(u => u.startsWith("https://"));
        if (urls.length === 0) rowErrors.push("image_url must start with https://");
        else images = urls.slice(0, 8);
      }

      if (rowErrors.length > 0) {
        errors.push({ line, errors: rowErrors });
      } else {
        validRows.push({
          name,
          description,
          mrp,
          price,
          category,
          quantity,
          sku,
          tags,
          images,
          origin,
          acceptCod,
          inStock: quantity > 0,
          storeId,
        });
      }
    }

    // If any rows have errors, return them all without importing anything
    if (errors.length > 0) {
      return NextResponse.json({
        imported: 0,
        skipped: errors.length,
        errors,
        message: `Validation failed. Fix the errors and re-import.`,
      }, { status: 400 });
    }

    // Bulk create all valid rows
    await prisma.product.createMany({ data: validRows });

    return NextResponse.json({
      imported: validRows.length,
      skipped: 0,
      errors: [],
      message: `${validRows.length} product${validRows.length !== 1 ? "s" : ""} imported successfully.`,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
