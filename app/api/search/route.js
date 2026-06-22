import { NextResponse } from "next/server";
import prisma from "src/db";
import { looseLimiter } from "@/lib/rateLimit";

/**
 * GET /api/search?q=...&take=10&category=...
 * Fast product search with Prisma's insensitive contains.
 * Searches name, description, category, manufacturer, sku, tags.
 */
export async function GET(request) {
  // Rate limit search endpoint
  const rl = looseLimiter.check(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const take = Math.min(Number(searchParams.get("take") ?? 12), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [], products: [] });
  }

  try {
    const where = {
      inStock: true,
      store: { isActive: true, status: "approved" },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { madeIn: { contains: q, mode: "insensitive" } },
      ],
      ...(category ? { category } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take,
        orderBy: [
          { rating: { _count: "desc" } }, // by review count
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          images: true,
          category: true,
          inStock: true,
          isWholesale: true,
          origin: true,
          manufacturer: true,
          store: { select: { name: true, username: true } },
          _count: { select: { rating: true, orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const suggestions = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      image: p.images?.[0] ?? null,
      category: p.category,
      store: p.store?.name ?? null,
      storeSlug: p.store?.username ?? null,
      href: `/product/${p.id}`,
      badge: p.isWholesale ? "Wholesale" : p.origin === "ABROAD" ? "Abroad" : null,
      reviewCount: p._count.rating,
    }));

    return NextResponse.json(
      { suggestions, total, query: q },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("[search]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
