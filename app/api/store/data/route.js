import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    // Get store username from query params
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('username');
    if (!usernameParam) {
      return NextResponse.json({ error: "not_found" }, { status: 400 });
    }
    const username = usernameParam.toLowerCase();

    // Look up regardless of isActive so we can tell "no such store" apart
    // from "store exists but isn't live yet" (pending/rejected/paused).
    const store = await prisma.store.findUnique({
      where: { username },
      include: { Product: { include: { rating: true } } }
    });

    if (!store) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!store.isActive) {
      // Let the store owner preview their own pending/paused storefront —
      // everyone else gets a generic "not live" response (no verification
      // status, rejection reason, etc. leaked to the public).
      const { userId } = getAuth(request);
      if (!userId || userId !== store.userId) {
        return NextResponse.json({ error: "not_active" }, { status: 404 });
      }
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
        preview: !store.isActive, // true only when the owner is viewing their own non-live store
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}