import prisma from "@/src/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    console.log("[PRODUCT_GET] productId:", productId); // ← add this

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        inStock: true,
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },
      include: {
        _count: {
          select: { orderItems: true },
        },
        store: {
          select: {
            isActive: true,
            name: true,
            logo: true,
            username: true,
            userId: true,
            state: true,
            deliveryStates: true,
            country: true,
            shippingLocalFee: true,
            shippingNationwideFee: true,
            shippingAbroadFee: true,
          },
        },
        variantGroups: {
          include: { options: { orderBy: { position: "asc" } } },
          orderBy: { position: "asc" },
        },
        wholesaleTiers: {
          orderBy: { position: "asc" },
        },
        rating: {
          select: {
            id: true,
            createdAt: true,
            rating: true,
            review: true,
            reviewImages: true,
            sellerResponse: true,
            userId: true,
            user: {
              select: { name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    console.log("[PRODUCT_GET] product:", product); // ← and this

    // Respect the store active check (findUnique can't filter on relations)
    if (!product || !product.store?.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[PRODUCT_GET_BY_ID]", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}