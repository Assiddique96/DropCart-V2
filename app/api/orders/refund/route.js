import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/orders/refund
 * Buyer submits a refund/return request for a delivered order.
 * Body: { orderId, reason }
 *
 * GET /api/orders/refund
 * Buyer retrieves all their refund requests.
 */

export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, reason: rawReason } = await request.json();
    const reason = sanitizeString(rawReason, 1000);

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Order ID and reason are required." }, { status: 400 });
    }

    // Verify order belongs to buyer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { refund: true },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Only delivered orders can be refunded
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Refund requests can only be submitted for delivered orders." },
        { status: 409 }
      );
    }

    // Prevent duplicate refund requests
    if (order.refund) {
      return NextResponse.json(
        { error: `A refund request already exists for this order (status: ${order.refund.status}).` },
        { status: 409 }
      );
    }

    const refund = await prisma.refund.create({
      data: { orderId, reason },
    });

    return NextResponse.json({ message: "Refund request submitted successfully.", refund });
  } catch (error) {
    console.error("Refund request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const refunds = await prisma.refund.findMany({
      where: { order: { userId } },
      include: {
        order: {
          select: { id: true, total: true, createdAt: true, orderItems: { include: { product: { select: { name: true, images: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ refunds });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
