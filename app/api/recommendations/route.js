// app/api/recommendations/route.js
import { NextResponse } from "next/server";
// import db from "@/lib/db"; // your Prisma or ORM instance

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || null;
  const currentProductId = searchParams.get("productId") || null;

  // Start simple: top-selling or highly rated products
  // Later: add logic that uses user history / similar items.
  let where = { isActive: true };

  if (currentProductId) {
    // Example: fetch current product and recommend similar category/brand
    // const current = await db.product.findUnique({ where: { id: currentProductId } });
    // if (current) {
    //   where = {
    //     ...where,
    //     category: current.category,
    //     NOT: { id: current.id },
    //   };
    // }
  }

  const products = await db.product.findMany({
    where,
    orderBy: {
      averageRating: "desc",
    },
    take: 10,
  });

  return NextResponse.json({ products });
}
