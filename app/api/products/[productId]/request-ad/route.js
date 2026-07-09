import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request, { params }) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. UNWRAP PARAMS (Next.js 15 Fix)
    // Params is now a Promise and must be awaited before accessing properties
    const resolvedParams = await params;
    const productId = resolvedParams.productId;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is missing" }, { status: 400 });
    }

    // 3. Check if product exists and belongs to user's store
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Ensure the store associated with the product belongs to the current user
    if (product.store.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Check if ad request already exists (Prevent duplicates)
    const existingRequest = await prisma.adRequest.findFirst({
      where: {
        productId,
        storeId: product.storeId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Ad request already exists for this product" },
        { status: 400 }
      );
    }

    // 5. Resolve admin-configured ad pricing/duration bounds
    const configRows = await prisma.platformConfig.findMany({
      where: { key: { in: ["ad_price_per_day", "ad_min_duration_days", "ad_max_duration_days"] } },
    });
    const configMap = Object.fromEntries(configRows.map((r) => [r.key, parseFloat(r.value)]));
    const pricePerDay = configMap.ad_price_per_day ?? 500;
    const minDuration = configMap.ad_min_duration_days ?? 3;
    const maxDuration = configMap.ad_max_duration_days ?? 30;

    const body = await request.json().catch(() => ({}));
    const requestedDuration = parseInt(body?.durationDays, 10);
    const durationDays = Number.isFinite(requestedDuration)
      ? Math.min(Math.max(requestedDuration, minDuration), maxDuration)
      : minDuration;
    const totalPrice = parseFloat((pricePerDay * durationDays).toFixed(2));

    // 6. Create the ad request
    const adRequest = await prisma.adRequest.create({
      data: {
        productId,
        storeId: product.storeId,
        durationDays,
        pricePerDay,
        totalPrice,
      },
    });

    return NextResponse.json({ adRequest });
  } catch (error) {
    console.error("Error creating ad request:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}