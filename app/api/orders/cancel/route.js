import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import { defaultLimiter } from "@/lib/rateLimit";
import { createNotifications } from "@/lib/serverNotifications";

/**
 * POST /api/orders/cancel
 * Body: { orderId }
 *
 * Buyers can cancel orders that are still ORDER_PLACED.
 * Sellers can cancel orders that are ORDER_PLACED or PROCESSING.
 */
export async function POST(request) {


  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, reason } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order with store info to determine role
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine if caller is the buyer or the seller
    const isBuyer = order.userId === userId;
    const isSeller = order.store?.userId === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Enforce cancellation window rules
    if (isBuyer && order.status !== "ORDER_PLACED") {
      return NextResponse.json(
        { error: "Buyers can only cancel orders that have not yet been processed." },
        { status: 409 }
      );
    }

    if (isSeller && !["ORDER_PLACED", "PROCESSING"].includes(order.status)) {
      return NextResponse.json(
        { error: "Orders that have already shipped cannot be cancelled." },
        { status: 409 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order is already cancelled." }, { status: 409 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        // Store cancellation reason in the coupon JSON field extension
        // (avoids a schema migration; a dedicated field is ideal for production)
        coupon: {
          ...(typeof order.coupon === "object" ? order.coupon : {}),
          cancellationReason: reason || null,
          cancelledBy: isBuyer ? "buyer" : "seller",
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    await createNotifications([
      {
        userId: order.userId,
        type: "order",
        title: "Order cancelled",
        message: isBuyer
          ? "You cancelled your order."
          : "Your order was cancelled by the seller.",
        link: "/orders",
      },
      {
        userId: order.store.userId,
        type: "order",
        title: "Order cancelled",
        message: isBuyer
          ? "A buyer cancelled an order."
          : "You cancelled an order.",
        link: "/store/orders",
      },
    ]);

    return NextResponse.json({ message: "Order cancelled successfully." });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}
