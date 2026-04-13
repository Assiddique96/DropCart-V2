import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString, sanitizeNumber } from "@/lib/sanitize";

async function getSeller(userId) { return await authSeller(userId); }
async function ownProduct(productId, storeId) {
  return await prisma.product.findFirst({ where: { id: productId, storeId } });
}

/**
 * GET  /api/store/product/variants?productId=xxx
 * Returns all variant groups with their options for the product.
 */
export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await getSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    if (!await ownProduct(productId, storeId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const groups = await prisma.productVariantGroup.findMany({
      where: { productId },
      include: { options: { orderBy: { position: "asc" } } },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/store/product/variants
 * Body: { productId, groups: [{ label, type, required, options: [{ label, image?, priceModifier, quantity, sku? }] }] }
 *
 * Full replace — deletes all existing groups for this product and recreates from the payload.
 */
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await getSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, groups } = await request.json();

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    if (!Array.isArray(groups)) return NextResponse.json({ error: "groups array required" }, { status: 400 });

    if (!await ownProduct(productId, storeId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Full replace: delete all existing groups (cascades to options)
    await prisma.productVariantGroup.deleteMany({ where: { productId } });

    // Recreate
    const created = await Promise.all(
      groups.map((group, gIdx) => {
        const label = sanitizeString(group.label, 100);
        if (!label) return null;
        const type = group.type === "IMAGE" ? "IMAGE" : "TEXT";

        return prisma.productVariantGroup.create({
          data: {
            productId,
            label,
            type,
            required: group.required !== false,
            position: gIdx,
            options: {
              create: (group.options || []).map((opt, oIdx) => {
                const optLabel = sanitizeString(opt.label, 200);
                if (!optLabel) return null;
                const priceModifier = sanitizeNumber(opt.priceModifier ?? 0);
                return {
                  label: optLabel,
                  image: opt.image ? sanitizeString(opt.image, 2000) : null,
                  sku: opt.sku ? sanitizeString(opt.sku, 100) : null,
                  priceModifier: isNaN(priceModifier) ? 0 : priceModifier,
                  quantity: Math.max(0, parseInt(opt.quantity ?? 0, 10)),
                  inStock: (opt.quantity ?? 0) > 0,
                  position: oIdx,
                };
              }).filter(Boolean),
            },
          },
          include: { options: true },
        });
      })
    );

    return NextResponse.json({ message: "Variants saved.", groups: created.filter(Boolean) });
  } catch (error) {
    console.error("Variants POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/store/product/variants
 * Body: { optionId, priceModifier?, quantity?, inStock?, image?, label? }
 * Updates a single option without replacing all groups.
 */
export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await getSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { optionId, ...updates } = await request.json();
    if (!optionId) return NextResponse.json({ error: "optionId required" }, { status: 400 });

    // Verify ownership via group → product → store
    const option = await prisma.productVariantOption.findFirst({
      where: { id: optionId, group: { product: { storeId } } },
    });
    if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

    const data = {};
    if (updates.label !== undefined)         data.label         = sanitizeString(updates.label, 200);
    if (updates.image !== undefined)         data.image         = updates.image ? sanitizeString(updates.image, 2000) : null;
    if (updates.sku !== undefined)           data.sku           = updates.sku ? sanitizeString(updates.sku, 100) : null;
    if (updates.priceModifier !== undefined) data.priceModifier = sanitizeNumber(updates.priceModifier);
    if (updates.quantity !== undefined) {
      data.quantity = Math.max(0, parseInt(updates.quantity, 10));
      data.inStock  = data.quantity > 0;
    }
    if (updates.inStock !== undefined) data.inStock = Boolean(updates.inStock);

    const updated = await prisma.productVariantOption.update({ where: { id: optionId }, data });
    return NextResponse.json({ message: "Option updated.", option: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/store/product/variants?groupId=xxx  — delete an entire group
 * DELETE /api/store/product/variants?optionId=xxx — delete one option
 */
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await getSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId  = searchParams.get("groupId");
    const optionId = searchParams.get("optionId");

    if (groupId) {
      const group = await prisma.productVariantGroup.findFirst({
        where: { id: groupId, product: { storeId } },
      });
      if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
      await prisma.productVariantGroup.delete({ where: { id: groupId } });
      return NextResponse.json({ message: "Variant group deleted." });
    }

    if (optionId) {
      const option = await prisma.productVariantOption.findFirst({
        where: { id: optionId, group: { product: { storeId } } },
      });
      if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });
      await prisma.productVariantOption.delete({ where: { id: optionId } });
      return NextResponse.json({ message: "Variant option deleted." });
    }

    return NextResponse.json({ error: "groupId or optionId required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
