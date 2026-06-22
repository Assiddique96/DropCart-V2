import prisma from "src/db";
import { NextResponse } from "next/server";
import { looseLimiter } from "@/lib/rateLimit";

/** GET /api/products — public product listing with rate limit + cache headers */
export async function GET(request) {
  // Rate limit: 60 req/min per IP
  const rl = looseLimiter.check(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        // Only published products
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
        store: { isActive: true, status: "approved" },
      },
      include: {
        _count: { select: { orderItems: true } },
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
        wholesaleTiers: { orderBy: { position: "asc" } },
        rating: {
          select: {
            id: true,
            createdAt: true,
            rating: true,
            review: true,
            reviewImages: true,
            sellerResponse: true,
            userId: true,
            user: { select: { name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { products },
      {
        headers: {
          // Cache at CDN edge for 60s, allow stale for 5min while revalidating
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[/api/products]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
