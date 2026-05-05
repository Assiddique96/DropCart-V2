import imagekit from "@/configs/imageKit";
import authSeller from "@/middlewares/authSeller";
import prisma from "src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { sanitizeProductInput, sanitizeString } from "@/lib/sanitize";
import { defaultLimiter } from "@/lib/rateLimit";

// ─── Shared image upload helper ─────────────────────────────────────────────
async function uploadImages(imageFiles) {
  const results = await Promise.all(
    imageFiles.map(async (image) => {
      try {
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name || `product-${Date.now()}`,
          folder: "products",
        });
        return imagekit.url({
          path: response.filePath,
          transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1024" }],
        });
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

// ─── POST — Add new product ──────────────────────────────────────────────────
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData();

    const { data: sanitized, errors } = sanitizeProductInput({
      name:        formData.get("name"),
      description: formData.get("description"),
      mrp:         formData.get("mrp"),
      price:       formData.get("price"),
      category:    formData.get("category"),
      sku:         formData.get("sku"),
      tags:        formData.get("tags"),
      scheduledAt: formData.get("scheduledAt"),
      origin:         formData.get("origin"),
      acceptCod:      formData.get("acceptCod"),
      madeIn:         formData.get("madeIn"),
      manufacturer:   formData.get("manufacturer"),
      material:       formData.get("material"),
      guaranteePeriod: formData.get("guaranteePeriod"),
    });

    if (errors.length > 0) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

    const rawQuantity = formData.get("quantity");
    const quantity = rawQuantity ? Math.max(0, parseInt(rawQuantity, 10)) : 0;

    // Support up to 8 images (removed hardcoded 4 limit)
    const images = formData.getAll("images").filter(i => i instanceof File && i.size > 0);
    if (images.length === 0) return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });

    const imageUrls = await uploadImages(images);
    if (imageUrls.length === 0) return NextResponse.json({ error: "Image upload failed." }, { status: 500 });

    const product = await prisma.product.create({
      data: {
        ...sanitized,
        quantity,
        inStock: quantity > 0,
        images: imageUrls,
        storeId,
      },
    });

    return NextResponse.json({ message: "Product added successfully!", productId: product.id });
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json({ error: error.message || "Failed to add product" }, { status: 500 });
  }
}

// ─── GET — Fetch seller's products ──────────────────────────────────────────
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      where: { storeId },
      include: {
        variantGroups: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalizedProducts = products.map((product) => ({
      ...product,
      // Backward-compatible flattened variant list for legacy UI consumers.
      variants: product.variantGroups.flatMap((group) => group.options),
    }));

    return NextResponse.json({ products: normalizedProducts });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ─── PATCH — Edit existing product ──────────────────────────────────────────
export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData();
    const productId = formData.get("productId");
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const existing = await prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const acceptCodSource = formData.has("acceptCod") ? formData.get("acceptCod") : existing.acceptCod;

    const { data: sanitized, errors } = sanitizeProductInput({
      name:        formData.get("name")        ?? existing.name,
      description: formData.get("description") ?? existing.description,
      mrp:         formData.get("mrp")         ?? existing.mrp,
      price:       formData.get("price")       ?? existing.price,
      category:    formData.get("category")    ?? existing.category,
      sku:         formData.get("sku")         ?? existing.sku,
      tags:        formData.get("tags")        ?? existing.tags.join(","),
      scheduledAt: formData.get("scheduledAt") ?? existing.scheduledAt,
      origin:      formData.get("origin")      ?? existing.origin,
      acceptCod:       acceptCodSource,
      madeIn:          formData.get("madeIn")       ?? existing.madeIn,
      manufacturer:    formData.get("manufacturer") ?? existing.manufacturer,
      material:        formData.get("material")     ?? existing.material,
      guaranteePeriod: formData.get("guaranteePeriod") ?? existing.guaranteePeriod,
    });

    if (errors.length > 0) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

    const rawQuantity = formData.get("quantity");
    const quantity = rawQuantity !== null ? Math.max(0, parseInt(rawQuantity, 10)) : existing.quantity;

    const newImageFiles = formData.getAll("images").filter((i) => i instanceof File && i.size > 0);

    let images;
    const existingImagesJson = formData.get("existingImages");
    if (typeof existingImagesJson === "string" && existingImagesJson.trim()) {
      try {
        const kept = JSON.parse(existingImagesJson);
        if (!Array.isArray(kept)) {
          return NextResponse.json({ error: "existingImages must be a JSON array." }, { status: 400 });
        }
        const allowed = new Set(existing.images);
        const filtered = kept.filter((u) => typeof u === "string" && allowed.has(u));
        let merged = filtered;
        if (newImageFiles.length > 0) {
          const uploaded = await uploadImages(newImageFiles);
          merged = [...filtered, ...uploaded];
        }
        images = merged.slice(0, 8);
      } catch {
        return NextResponse.json({ error: "Invalid existingImages JSON." }, { status: 400 });
      }
    } else {
      images = existing.images;
      if (newImageFiles.length > 0) {
        const uploaded = await uploadImages(newImageFiles);
        if (uploaded.length > 0) images = uploaded;
      }
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "At least one product image is required." }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { ...sanitized, quantity, inStock: quantity > 0, images },
    });

    return NextResponse.json({ message: "Product updated successfully!", product: updated });
  } catch (error) {
    console.error("Edit product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

// ─── DELETE — Remove product ─────────────────────────────────────────────────
export async function DELETE(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const existing = await prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const activeOrders = await prisma.orderItem.findFirst({
      where: { productId, order: { status: { notIn: ["DELIVERED", "CANCELLED"] } } },
    });
    if (activeOrders) {
      return NextResponse.json(
        { error: "Cannot delete a product with active orders." },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
