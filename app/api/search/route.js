// app/api/search/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  // Example: query your DB or product index
  // Use fuzzy matching (e.g., LIKE, trigram, or external search engine)
  const products = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
  });

  const suggestions = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: `${p.brand} • ${p.category}`,
    href: `/product/${p.id}`,
    image: p.images?.[0],
  }));

  return NextResponse.json({ suggestions });
}
