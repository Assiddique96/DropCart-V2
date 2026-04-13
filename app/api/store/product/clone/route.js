import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";

/**
 * POST /api/store/product/clone
 * Body: { productId }
 * Duplicates a product (and its variants) with "Copy of " prepended to the name.
 * The clone starts as out-of-stock (inStock: false, quantity: 0).
 */
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const original = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: { variants: true },
    });
    if (!original) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Destructure fields we don't want to copy directly
    const { id, createdAt, updatedAt, variants, ...rest } = original;

    const clone = await prisma.product.create({
      data: {
        ...rest,
        name: `Copy of ${original.name}`,
        inStock: false,
        quantity: 0,
        sku: original.sku ? `${original.sku}-copy` : null,
        scheduledAt: null, // clone starts as unscheduled draft
        variants: variants.length > 0 ? {
          create: variants.map(({ id: _id, productId: _pid, ...v }) => ({
            ...v,
            quantity: 0,
            inStock: false,
          })),
        } : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json({ message: "Product cloned successfully.", product: clone });
  } catch (error) {
    console.error("Clone error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
