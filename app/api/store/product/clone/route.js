import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";

const variantInclude = {
  variantGroups: {
    orderBy: { position: "asc" },
    include: {
      options: { orderBy: { position: "asc" } },
    },
  },
};

/**
 * POST /api/store/product/clone
 * Body: { productId }
 * Duplicates a product (and its variant groups/options) with "Copy of " prepended to the name.
 * The clone starts as out-of-stock (inStock: false, quantity: 0); option rows also reset stock.
 */
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId, request.headers.get("x-store-id"));
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const original = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: variantInclude,
    });
    if (!original) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const { id, createdAt, updatedAt, variantGroups, ...rest } = original;

    const clone = await prisma.product.create({
      data: {
        ...rest,
        name: `Copy of ${original.name}`,
        inStock: false,
        quantity: 0,
        sku: original.sku ? `${original.sku}-copy` : null,
        scheduledAt: null,
        variantGroups:
          variantGroups.length > 0
            ? {
                create: variantGroups.map(({ id: _gid, productId: _pid, options, ...group }) => ({
                  ...group,
                  options: {
                    create: options.map(({ id: _oid, groupId: _gid2, ...opt }) => ({
                      ...opt,
                      quantity: 0,
                      inStock: false,
                    })),
                  },
                })),
              }
            : undefined,
      },
      include: variantInclude,
    });

    const product = {
      ...clone,
      variants: clone.variantGroups.flatMap((group) => group.options),
    };

    return NextResponse.json({ message: "Product cloned successfully.", product });
  } catch (error) {
    console.error("Clone error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
