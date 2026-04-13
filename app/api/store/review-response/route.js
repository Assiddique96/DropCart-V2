import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/store/review-response
 * Body: { ratingId, response }
 * Seller adds or updates a public reply to a review on one of their products.
 *
 * DELETE /api/store/review-response?ratingId=xxx
 * Seller removes their response.
 */

export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ratingId, response: rawResponse } = await request.json();
    const sellerResponse = sanitizeString(rawResponse, 1000);

    if (!ratingId) return NextResponse.json({ error: "ratingId is required" }, { status: 400 });
    if (!sellerResponse) return NextResponse.json({ error: "Response text is required" }, { status: 400 });

    // Verify the rating is for a product belonging to this store
    const rating = await prisma.rating.findFirst({
      where: { id: ratingId, product: { storeId } },
    });
    if (!rating) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const updated = await prisma.rating.update({
      where: { id: ratingId },
      data: { sellerResponse },
    });

    return NextResponse.json({ message: "Response saved.", rating: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    if (!rating) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    await prisma.rating.update({ where: { id: ratingId }, data: { sellerResponse: null } });
    return NextResponse.json({ message: "Response removed." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
