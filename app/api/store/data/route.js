import prisma from "@/src/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get store username from query params
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('username');
    if (!usernameParam) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    const username = usernameParam.toLowerCase();

    // Get store info and inStock products with ratings
    const store = await prisma.store.findUnique({
      where: { username, isActive: true },
      include: { Product: { include: { rating: true } } }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 400 });
    }

    // Extract all individual ratings from all products belonging to this store
    const allRatings = store.Product.flatMap((product) => product.rating || []);

    const storeRatingCount = allRatings.length;
    const storeRatingAvg =
      storeRatingCount > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatingCount
        : 0;

    return NextResponse.json({
      store: {
        ...store,
        storeRatingAvg,
        storeRatingCount,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}