import { NextResponse } from "next/server";
import prisma from "@/src/db";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";

export async function GET(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("trackingNumber") || "";
    const trackingNumber = sanitizeString(raw, 32).toUpperCase();

    if (!trackingNumber) {
      return NextResponse.json({ error: "trackingNumber is required." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        trackingNumber: true,
        store: { select: { name: true } },
        orderItems: {
          select: {
            quantity: true,
            product: { select: { name: true, images: true } },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Tracking number not found." }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Track lookup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

