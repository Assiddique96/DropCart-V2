// app/api/shop/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim().toLowerCase();
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 1000000;
  const brands = searchParams.get("brands")?.split(",") || [];
  const category = searchParams.get("category") || "";
  const minRating = Number(searchParams.get("minRating")) || 0;
  const inStock = searchParams.get("inStock") === "true";
  const sort = searchParams.get("sort") || "default";

  const where = {
    AND: [],
  };

  if (q) {
    where.AND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (minPrice > 0) {
    where.AND.push({ price: { gte: minPrice } });
  }
  if (maxPrice < 1000000) {
    where.AND.push({ price: { lte: maxPrice } });
  }
  if (brands.length) {
    where.AND.push({ brand: { in: brands } });
  }
  if (category) {
    where.AND.push({ category });
  }
  if (minRating > 0) {
    // You may need a join with ratings or precomputed averageRating
    where.AND.push({ averageRating: { gte: minRating } });
  }
  if (inStock) {
    where.AND.push({ inStock: true });
  }

  let orderBy = {};
  switch (sort) {
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { averageRating: "desc" };
      break;
    case "new":
      orderBy = { createdAt: "desc" };
      break;
    case "discount":
      orderBy = { discountPercent: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const products = await db.product.findMany({
    where,
    orderBy,
    take: 50,
  });

  return NextResponse.json({ products });
}
