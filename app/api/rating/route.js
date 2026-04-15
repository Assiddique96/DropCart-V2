import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { defaultLimiter, looseLimiter } from "@/lib/rateLimit";
import { sanitizeString, sanitizeNumber } from "@/lib/sanitize";
import imagekit from "@/configs/imageKit";

// POST — submit a new rating (multipart/form-data to support image uploads)
export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);

    // Support both JSON and multipart (for image uploads)
    const contentType = request.headers.get("content-type") || "";
    let orderId, productId, rating, review, imageFiles = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      orderId     = formData.get("orderId");
      productId   = formData.get("productId");
      rating      = sanitizeNumber(formData.get("rating"));
      review      = sanitizeString(formData.get("review"), 2000);
      imageFiles  = formData.getAll("images").filter(f => f instanceof File && f.size > 0);
    } else {
      const body   = await request.json();
      orderId     = body.orderId;
      productId   = body.productId;
      rating      = sanitizeNumber(body.rating);
      review      = sanitizeString(body.review, 2000);
    }

    if (!orderId || !productId || isNaN(rating) || rating < 1 || rating > 5 || !review) {
      return NextResponse.json({ error: "Rating (1-5) and review text are required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "You can only review products after the order is delivered." },
        { status: 400 }
      );
    }

    const lineItem = await prisma.orderItem.findUnique({
      where: { orderId_productId: { orderId, productId } },
    });
    if (!lineItem) {
      return NextResponse.json({ error: "Product is not part of this order." }, { status: 400 });
    }

    const existing = await prisma.rating.findFirst({ where: { productId, orderId } });
    if (existing) return NextResponse.json({ error: "Product already rated for this order" }, { status: 400 });

    // Upload review images (max 3)
    let reviewImages = [];
    if (imageFiles.length > 0) {
      const uploads = await Promise.all(
        imageFiles.slice(0, 3).map(async (file) => {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const res = await imagekit.upload({
              file: buffer,
              fileName: file.name || `review-${Date.now()}`,
              folder: "reviews",
            });
            return imagekit.url({
              path: res.filePath,
              transformation: [{ quality: "auto" }, { format: "webp" }, { width: "800" }],
            });
          } catch { return null; }
        })
      );
      reviewImages = uploads.filter(Boolean);
    }

    const response = await prisma.rating.create({
      data: { userId, productId, rating, review, orderId, reviewImages },
    });

    return NextResponse.json({ message: "Rating added successfully", rating: response });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// GET — fetch all ratings by the current user
export async function GET(request) {
  const limit = looseLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ratings = await prisma.rating.findMany({ where: { userId } });
    return NextResponse.json({ ratings });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// PATCH — edit an existing rating (buyer can only edit their own)
export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const { ratingId, rating: rawRating, review: rawReview } = await request.json();

    if (!ratingId) return NextResponse.json({ error: "ratingId is required" }, { status: 400 });

    const existing = await prisma.rating.findUnique({ where: { id: ratingId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    const rating  = rawRating  !== undefined ? sanitizeNumber(rawRating)   : existing.rating;
    const review  = rawReview  !== undefined ? sanitizeString(rawReview, 2000) : existing.review;

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (!review) return NextResponse.json({ error: "Review text is required" }, { status: 400 });

    const updated = await prisma.rating.update({
      where: { id: ratingId },
      data: { rating, review },
    });

    return NextResponse.json({ message: "Rating updated successfully", rating: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a rating (buyer only, their own rating)
export async function DELETE(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const ratingId = searchParams.get("ratingId");

    if (!ratingId) return NextResponse.json({ error: "ratingId is required" }, { status: 400 });

    const existing = await prisma.rating.findUnique({ where: { id: ratingId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    await prisma.rating.delete({ where: { id: ratingId } });
    return NextResponse.json({ message: "Rating deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
