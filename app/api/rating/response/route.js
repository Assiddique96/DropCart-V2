import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/rating/response
 * Body: { ratingId, response }
 * Seller posts a public reply to a review on one of their products.
 * Only the seller of the product being reviewed can respond.
 * Responding twice overwrites the previous response.
 */
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ratingId, response: rawResponse } = await request.json();
    const response = sanitizeString(rawResponse, 1000);

    if (!ratingId || !response) {
      return NextResponse.json({ error: "ratingId and response are required." }, { status: 400 });
    }

    // Verify the review is for a product owned by this seller
    const rating = await prisma.rating.findFirst({
      where: { id: ratingId, product: { storeId } },
    });

    if (!rating) {
      return NextResponse.json(
        { error: "Review not found or does not belong to your store." },
        { status: 404 }
      );
    }

    const updated = await prisma.rating.update({
      where: { id: ratingId },
      data: { sellerResponse: response },
    });

    return NextResponse.json({ message: "Response posted successfully.", rating: updated });
  } catch (error) {
    console.error("Review response error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/rating/response?ratingId=xxx
 * Seller removes their response to a review.
 */
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const ratingId = searchParams.get("ratingId");
    if (!ratingId) return NextResponse.json({ error: "ratingId is required" }, { status: 400 });

    const rating = await prisma.rating.findFirst({
      where: { id: ratingId, product: { storeId } },
    });
    if (!rating) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await prisma.rating.update({ where: { id: ratingId }, data: { sellerResponse: null } });
    return NextResponse.json({ message: "Response removed." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
